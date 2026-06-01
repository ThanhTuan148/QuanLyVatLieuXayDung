import 'dart:async';
import 'package:geolocator/geolocator.dart';
import 'package:signalr_netcore/signalr_client.dart';
import 'shared_preferences_service.dart';

class LocationTrackingService {
  static final LocationTrackingService _instance = LocationTrackingService._internal();

  factory LocationTrackingService() {
    return _instance;
  }

  LocationTrackingService._internal();

  StreamSubscription<Position>? _positionStream;
  HubConnection? _hubConnection;
  bool _isTracking = false;
  String? _currentMaPhieuGH;
  
  // Expose current location for UI if needed
  double? currentLat;
  double? currentLng;
  
  // Callbacks for UI updates
  Function(double lat, double lng)? onLocationUpdate;

  bool get isTracking => _isTracking;
  String? get currentMaPhieuGH => _currentMaPhieuGH;

  Future<void> _initSignalR() async {
    if (_hubConnection != null && _hubConnection!.state == HubConnectionState.Connected) {
      return;
    }
    
    final baseUrl = SharedPreferencesService.getServerUrl();
    if (baseUrl == null) return;
    
    final hubUrl = baseUrl.replaceAll('/api/', '/hubs/location');
    _hubConnection = HubConnectionBuilder()
        .withUrl(hubUrl)
        .withAutomaticReconnect()
        .build();
        
    try {
      await _hubConnection?.start();
      print("Global SignalR Connected for Location Tracking");
    } catch (e) {
      print("Global SignalR Connection Error: $e");
    }
  }

  Future<bool> startTracking(String maPhieuGH) async {
    if (_isTracking && _currentMaPhieuGH == maPhieuGH) {
      return true; // Already tracking this delivery
    }
    
    // Stop previous tracking if any
    await stopTracking();

    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return false;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return false;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      return false;
    }

    await _initSignalR();

    _isTracking = true;
    _currentMaPhieuGH = maPhieuGH;

    _positionStream = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10,
      ),
    ).listen((Position position) {
      currentLat = position.latitude;
      currentLng = position.longitude;
      
      if (onLocationUpdate != null) {
        onLocationUpdate!(currentLat!, currentLng!);
      }
      
      if (_hubConnection?.state == HubConnectionState.Connected) {
        _hubConnection?.invoke('SendLocationUpdate', args: [
          maPhieuGH,
          position.latitude,
          position.longitude,
          'Đang chia sẻ vị trí trực tiếp'
        ]).catchError((err) {
          print("Error sending location to SignalR: $err");
        });
      }
    });
    
    return true;
  }

  Future<void> stopTracking() async {
    await _positionStream?.cancel();
    _positionStream = null;
    
    // Send final update if possible
    if (_isTracking && _currentMaPhieuGH != null && _hubConnection?.state == HubConnectionState.Connected && currentLat != null && currentLng != null) {
      try {
        await _hubConnection?.invoke('SendLocationUpdate', args: [
          _currentMaPhieuGH!,
          currentLat!,
          currentLng!,
          'Đã hoàn thành chuyến đi / Ngừng theo dõi'
        ]);
      } catch (e) {
        print(e);
      }
    }
    
    _isTracking = false;
    _currentMaPhieuGH = null;
  }
}
