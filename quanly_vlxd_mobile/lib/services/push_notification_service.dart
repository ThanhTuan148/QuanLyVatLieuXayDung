import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:signalr_netcore/signalr_client.dart';
import 'dart:convert';
import 'api_service.dart';
import 'shared_preferences_service.dart';
import 'package:flutter/foundation.dart';

class PushNotificationService {
  static final PushNotificationService _instance = PushNotificationService._internal();
  factory PushNotificationService() => _instance;
  PushNotificationService._internal();

  final FlutterLocalNotificationsPlugin _flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();
  HubConnection? _hubConnection;
  String? _currentUserId;
  final ValueNotifier<int> unreadCount = ValueNotifier<int>(0);

  Future<void> init() async {
    // Permission request for Android 13+
    _flutterLocalNotificationsPlugin
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.requestNotificationsPermission();

    const AndroidInitializationSettings initializationSettingsAndroid = AndroidInitializationSettings('@mipmap/ic_launcher');
    const InitializationSettings initializationSettings = InitializationSettings(
      android: initializationSettingsAndroid,
    );
    
    await _flutterLocalNotificationsPlugin.initialize(
      settings: initializationSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) {
        // Handle notification tap here if needed
        print("Notification tapped: ${response.payload}");
      },
    );

    final userJson = SharedPreferencesService.getUser();
    if (userJson != null) {
      try {
        final user = jsonDecode(userJson);
        _currentUserId = user['maNhanVien']?.toString() ?? user['id']?.toString();
      } catch (e) {
        print("Error parsing user: \$e");
      }
    }
    
    _connectSignalR();
    fetchUnreadCount();
  }

  Future<void> fetchUnreadCount() async {
    if (_currentUserId == null) return;
    try {
      final res = await ApiService().dio.get('/notifications?userId=$_currentUserId');
      if (res.statusCode == 200) {
        final List list = res.data;
        unreadCount.value = list.where((n) => n['daDoc'] == false).length;
      }
    } catch (e) {
      print("Error fetching unread count: $e");
    }
  }

  Future<void> _connectSignalR() async {
    if (_currentUserId == null) return;
    
    // Replace '/api' with '' if baseUrl contains '/api' because the hub is at /hubs/notifications
    final serverUrl = "\${ApiService.baseUrl.replaceAll('/api', '')}/hubs/notifications";
    
    _hubConnection = HubConnectionBuilder().withUrl(serverUrl).build();
    
    _hubConnection?.on("ReceiveNotification", _handleNotification);
    
    try {
      await _hubConnection?.start();
      print("Notification SignalR Connected. Hub url: \$serverUrl");
      await _hubConnection?.invoke("JoinGroup", args: ["User_\$_currentUserId"]);
      print("Joined notification group: User_\$_currentUserId");
    } catch (e) {
      print("Notification SignalR Connection Error: \$e");
      // Optionally implement reconnect logic
    }
  }

  void _handleNotification(List<Object?>? args) {
    if (args != null && args.isNotEmpty) {
      try {
        final notificationData = args[0] as Map<String, dynamic>;
        
        final receiverId = notificationData['maNguoiNhan']?.toString();
        // Skip if this notification is for someone else (in case group filtering failed)
        if (receiverId != null && receiverId != _currentUserId) return;
        
        final title = notificationData['tieuDe']?.toString() ?? 'Thông báo mới';
        final body = notificationData['noiDung']?.toString() ?? '';
        final id = notificationData['maThongBao'] != null ? notificationData['maThongBao'].hashCode : DateTime.now().millisecond;
        
        unreadCount.value++;
        showNotification(id, title, body);
      } catch (e) {
        print("Error parsing notification from SignalR: \$e");
      }
    }
  }

  Future<void> showNotification(int id, String title, String body) async {
    const AndroidNotificationDetails androidPlatformChannelSpecifics =
        AndroidNotificationDetails(
      'erp_notifications', // channel id
      'ERP Notifications', // channel name
      channelDescription: 'Thông báo từ hệ thống Quản lý Vật liệu Xây dựng',
      importance: Importance.max,
      priority: Priority.high,
      showWhen: true,
      enableVibration: true,
    );
    const NotificationDetails platformChannelSpecifics =
        NotificationDetails(android: androidPlatformChannelSpecifics);
        
    await _flutterLocalNotificationsPlugin.show(
      id: id,
      title: title,
      body: body,
      notificationDetails: platformChannelSpecifics,
    );
  }

  Future<void> disconnect() async {
    try {
      if (_hubConnection != null && _hubConnection!.state == HubConnectionState.Connected) {
        if (_currentUserId != null) {
          await _hubConnection?.invoke("LeaveGroup", args: ["User_\$_currentUserId"]);
        }
        await _hubConnection?.stop();
      }
    } catch (e) {
      print("Error disconnecting from Notification Hub: \$e");
    } finally {
      _hubConnection = null;
    }
  }
}
