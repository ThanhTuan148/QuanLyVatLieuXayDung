import 'dart:convert';
import 'dart:io';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../services/api_service.dart';
import '../../services/shared_preferences_service.dart';
import '../../services/location_tracking_service.dart';
import '../../core/app_theme.dart';
import 'delivery_form_screen.dart';

class DeliveryDetailScreen extends StatefulWidget {
  final Map<String, dynamic> delivery;

  const DeliveryDetailScreen({super.key, required this.delivery});

  @override
  State<DeliveryDetailScreen> createState() => _DeliveryDetailScreenState();
}

class _DeliveryDetailScreenState extends State<DeliveryDetailScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = false;
  bool _isLoadingDetail = true;
  Map<String, dynamic> _fullDelivery = {};
  WebViewController? _webViewController;

  // Form states matching Web
  String _status = '';
  String _notes = '';
  String _amountPaid = '';
  String _paymentOption = 'partial';
  String _currentLocation = '';
  double? _lat;
  double? _lng;
  bool _isGettingGPS = false;

  // Photo state
  String? _photoPreview; // base64 string
  final ImagePicker _picker = ImagePicker();

  // Individual item updates: Map<maCTGH, Map<String, dynamic>>
  final Map<dynamic, Map<String, dynamic>> _itemUpdates = {};

  // History states
  List<dynamic> _history = [];
  bool _isLoadingHistory = false;

  // SignalR & Tracking
  bool _isLiveTracking = false;

  @override
  void initState() {
    super.initState();
    _fetchDetail();
    _checkLiveTrackingState();
  }

  void _checkLiveTrackingState() {
    final maPhieuGH = widget.delivery['maPhieuGH'] ?? widget.delivery['maGH'] ?? widget.delivery['id'];
    if (LocationTrackingService().isTracking && LocationTrackingService().currentMaPhieuGH == maPhieuGH.toString()) {
      setState(() {
        _isLiveTracking = true;
        _lat = LocationTrackingService().currentLat;
        _lng = LocationTrackingService().currentLng;
      });
    }
    
    LocationTrackingService().onLocationUpdate = (lat, lng) {
      if (mounted) {
        setState(() {
          _lat = lat;
          _lng = lng;
          _currentLocation = 'Đang chia sẻ vị trí trực tiếp';
          _isGettingGPS = false;
        });
        _webViewController?.runJavaScript('updateDriverLocation($_lat, $_lng);');
      }
    };
  }

  @override
  void dispose() {
    // We intentionally do NOT stop tracking here so it persists in the background.
    // If this screen was listening to onLocationUpdate, we can clear it if it's the active one
    if (LocationTrackingService().isTracking) {
        LocationTrackingService().onLocationUpdate = null;
    }
    super.dispose();
  }

  // Removed old _initSignalR method

  void _initWebView(String address) {
    final cleanAddress = address.trim();
    if (cleanAddress.isEmpty || 
        cleanAddress.toLowerCase() == 'chưa rõ' || 
        cleanAddress.toLowerCase() == 'chưa cập nhật' ||
        cleanAddress == 'N/A') {
      return;
    }
    
    final String html = '''
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <style>
            body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background-color: #f5f5f5; }
            #map { width: 100%; height: 100%; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            var map = L.map('map').setView([10.762622, 106.660172], 13);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
              attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
            }).addTo(map);

            var driverMarker = null;
            var destMarker = null;
            var routeLine = null;

            var truckIcon = L.divIcon({
              className: 'custom-icon',
              html: '<div style="background-color:orange;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 5px rgba(0,0,0,0.3);"><span style="font-size:16px;">🚚</span></div>',
              iconSize: [30, 30],
              iconAnchor: [15, 15]
            });

            var destIcon = L.divIcon({
              className: 'custom-icon',
              html: '<div style="background-color:green;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 5px rgba(0,0,0,0.3);"><span style="font-size:16px;">📍</span></div>',
              iconSize: [30, 30],
              iconAnchor: [15, 30]
            });

            function initMap(destLat, destLng, destAddress) {
               destMarker = L.marker([destLat, destLng], {icon: destIcon}).addTo(map).bindPopup(destAddress);
               map.setView([destLat, destLng], 14);
            }

            async function geocodeAndInitMap(address) {
               try {
                   var queries = [address];
                   var parts = address.split(',').map(p => p.trim());
                   if (parts.length > 2 && /^\\d/.test(parts[0])) queries.push(parts.slice(1).join(', '));
                   if (parts.length > 3) queries.push(parts.slice(parts.length - 3).join(', '));
                   if (parts.length > 2) queries.push(parts.slice(parts.length - 2).join(', '));
                   
                   for (let q of queries) {
                       var res = await fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(q) + '&countrycodes=vn');
                       var data = await res.json();
                       if (data && data.length > 0) {
                           initMap(parseFloat(data[0].lat), parseFloat(data[0].lon), address);
                           return;
                       }
                   }
                   console.log("Geocode failed for all fallbacks");
               } catch(e) {
                   console.log(e);
               }
            }

            async function updateDriverLocation(lat, lng) {
               if (!driverMarker) {
                   driverMarker = L.marker([lat, lng], {icon: truckIcon}).addTo(map);
               } else {
                   driverMarker.setLatLng([lat, lng]);
               }
               
               if (destMarker) {
                   try {
                       var url = 'https://router.project-osrm.org/route/v1/driving/' + lng + ',' + lat + ';' + destMarker.getLatLng().lng + ',' + destMarker.getLatLng().lat + '?overview=full&geometries=geojson';
                       var res = await fetch(url);
                       var data = await res.json();
                       if (data.routes && data.routes.length > 0) {
                           var coords = data.routes[0].geometry.coordinates;
                           var latlngs = coords.map(function(c) { return [c[1], c[0]]; });
                           
                           if (routeLine) {
                               routeLine.setLatLngs(latlngs);
                           } else {
                               routeLine = L.polyline(latlngs, {color: 'orange', weight: 5, opacity: 0.8}).addTo(map);
                           }
                           map.fitBounds(routeLine.getBounds(), {padding: [30, 30]});
                       }
                   } catch(e) { console.log(e); }
               } else {
                   map.setView([lat, lng], 15);
               }
            }

            geocodeAndInitMap("${cleanAddress.replaceAll('\n', ' ').replaceAll('"', '\\"')}");
          </script>
        </body>
      </html>
    ''';
    
    if (mounted) {
      setState(() {
        _webViewController = WebViewController()
          ..setJavaScriptMode(JavaScriptMode.unrestricted)
          ..setNavigationDelegate(
            NavigationDelegate(
              onNavigationRequest: (NavigationRequest request) async {
                final String url = request.url;
                if (url.startsWith('https://www.google.com/maps')) {
                  try {
                    if (url.startsWith('intent://')) {
                      final parts = url.split('#Intent;');
                      if (parts.isNotEmpty) {
                        var cleanUrl = parts[0].replaceAll('intent://', '');
                        var scheme = 'https';
                        if (parts.length > 1) {
                          final params = parts[1].split(';');
                          for (var param in params) {
                            if (param.startsWith('scheme=')) {
                              scheme = param.split('=')[1];
                            }
                          }
                        }
                        final webUrl = Uri.parse('$scheme://$cleanUrl');
                        await launchUrl(webUrl, mode: LaunchMode.externalApplication);
                      }
                    } else {
                      final Uri uri = Uri.parse(url);
                      await launchUrl(uri, mode: LaunchMode.externalApplication);
                    }
                  } catch (e) {
                    // Ignore
                  }
                  return NavigationDecision.prevent;
                }
                return NavigationDecision.navigate;
              },
              onPageFinished: (String url) {
                  if (_lat != null && _lng != null) {
                      _webViewController?.runJavaScript('updateDriverLocation($_lat, $_lng);');
                  }
              }
            ),
          )
          ..loadHtmlString(html);
      });
    }
  }

  void _fetchDetail() async {
    final maPhieuGH = widget.delivery['maPhieuGH'] ?? widget.delivery['maGH'] ?? widget.delivery['id'];
    if (maPhieuGH == null) {
      if (mounted) setState(() => _isLoadingDetail = false);
      return;
    }
    
    try {
      final res = await _apiService.getDeliveryDetail(maPhieuGH);
      if (res.statusCode == 200 && mounted) {
        setState(() {
          _fullDelivery = res.data;
          _isLoadingDetail = false;
          
          _status = _fullDelivery['trangThai'] ?? 'Chờ giao';
          _notes = _fullDelivery['ghiChu'] ?? '';
          _currentLocation = _fullDelivery['viTriHienTai'] ?? '';
          _lat = _fullDelivery['lat'];
          _lng = _fullDelivery['lng'];
          
          // Initialize item updates
          _itemUpdates.clear();
          final chiTiet = _fullDelivery['chiTiet'] as List<dynamic>? ?? [];
          for (var it in chiTiet) {
            final maCTGH = it['maCTGH'];
            var defaultStatus = it['trangThai'] ?? 'Chờ giao';
            final int soLuongNhanKho = it['soLuongNhanKho'] ?? 0;
            final int soLuongGiao = it['soLuongGiao'] ?? 0;
            if (soLuongNhanKho < soLuongGiao) {
              defaultStatus = 'Đang giao một phần';
            }
            _itemUpdates[maCTGH] = {
              'maCTGH': maCTGH,
              'trangThai': defaultStatus,
              'ghiChu': it['ghiChu'] ?? ''
            };
          }
        });
        
        final address = _fullDelivery['diaChi'] ?? widget.delivery['diaChi'] ?? widget.delivery['diaChiGiaoHang'] ?? '';
        _initWebView(address);
        _fetchHistory();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _fullDelivery = widget.delivery;
          _isLoadingDetail = false;
        });
        final address = widget.delivery['diaChi'] ?? widget.delivery['diaChiGiaoHang'] ?? '';
        _initWebView(address);
      }
    }
  }

  void _fetchHistory() async {
    final maPhieuGH = widget.delivery['maPhieuGH'] ?? widget.delivery['maGH'] ?? widget.delivery['id'];
    if (maPhieuGH == null) return;
    if (mounted) setState(() => _isLoadingHistory = true);
    try {
      final res = await _apiService.getDeliveryHistory(maPhieuGH);
      if (res.statusCode == 200 && mounted) {
        setState(() {
          _history = res.data ?? [];
        });
      }
    } catch (e) {
      // Ignore
    } finally {
      if (mounted) setState(() => _isLoadingHistory = false);
    }
  }

  void _handleItemUpdate(dynamic maCTGH, String field, dynamic value) {
    setState(() {
      _itemUpdates[maCTGH]![field] = value;
      
      if (field == 'trangThai') {
        final items = _itemUpdates.values.toList();
        final allDelivered = items.every((it) => it['trangThai'] == 'Đã giao');
        final anyDelivered = items.any((it) => it['trangThai'] == 'Đã giao' || it['trangThai'] == 'Đã giao một phần');

        int totalNhanKho = 0;
        int totalOrder = 0;
        final chiTiet = _fullDelivery['chiTiet'] as List<dynamic>? ?? [];
        for (var item in chiTiet) {
          totalNhanKho += (item['soLuongNhanKho'] ?? 0) as int;
          totalOrder += (item['soLuongOrder'] ?? 0) as int;
        }
        final driverReceivedAll = totalNhanKho >= totalOrder;

        if (allDelivered && driverReceivedAll) {
          _status = 'Đã giao';
        } else if (allDelivered && !driverReceivedAll) {
          _status = 'Đã giao một phần';
        } else if (anyDelivered) {
          _status = 'Đã giao một phần';
        } else {
          _status = 'Chờ giao';
        }

        // Prepopulate cash collect amount if overall status is updated to 'Đã giao'
        if (_status == 'Đã giao' || _status == 'Đã giao một phần') {
          _amountPaid = _calculateDynamicCOD().toInt().toString();
        }
      }
    });
  }

  double _calculateDynamicCOD() {
    final pttt = _fullDelivery['pttt'] ?? _fullDelivery['PTTT'] ?? '';
    if (pttt.toString().toUpperCase().contains('ATM')) return 0;

    final tongTien = (_fullDelivery['tongTienOrder'] ?? widget.delivery['tongTienOrder'] ?? 0.0).toDouble();
    final daThanhToan = (_fullDelivery['daThanhToanOrder'] ?? widget.delivery['daThanhToanOrder'] ?? 0.0).toDouble();
    final remaining = (tongTien - daThanhToan) > 0 ? (tongTien - daThanhToan) : 0.0;

    if (_paymentOption == 'full') {
      return remaining;
    }

    double total = 0.0;
    final chiTiet = _fullDelivery['chiTiet'] as List<dynamic>? ?? [];
    for (var item in chiTiet) {
      final maCTGH = item['maCTGH'];
      final currentItemStatus = _itemUpdates[maCTGH]?['trangThai'] ?? item['trangThai'] ?? 'Chờ giao';
      if (currentItemStatus == 'Đã giao') {
        final double soLuongGiao = (item['soLuongGiao'] ?? 0).toDouble();
        final double soLuongOrder = (item['soLuongOrder'] ?? 0).toDouble();
        final double donGia = (item['donGia'] ?? 0).toDouble();
        final double thanhTien = (item['thanhTien'] ?? 0).toDouble();

        if (thanhTien > 0 && soLuongOrder > 0) {
          final unitValue = thanhTien / soLuongOrder;
          total += unitValue * soLuongGiao;
        } else {
          total += soLuongGiao * donGia;
        }
      }
    }

    if (total > remaining) {
      total = remaining;
    }

    return total > 0 ? total : 0.0;
  }

  void _toggleLiveTracking() async {
    final maPhieuGH = widget.delivery['maPhieuGH'] ?? widget.delivery['maGH'] ?? widget.delivery['id'];
    
    if (_isLiveTracking) {
      // Stop tracking
      await LocationTrackingService().stopTracking();
      setState(() {
        _isLiveTracking = false;
        _isGettingGPS = false;
      });
    } else {
      // Start tracking
      setState(() {
        _isGettingGPS = true; // Show loading initially
      });
      
      bool success = await LocationTrackingService().startTracking(maPhieuGH.toString());
      
      if (!success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Vui lòng bật và cấp quyền Vị trí để chia sẻ.')));
        setState(() {
          _isGettingGPS = false;
        });
        return;
      }
      
      if (mounted) {
        setState(() {
          _isLiveTracking = true;
          _isGettingGPS = false;
        });
      }
      
      LocationTrackingService().onLocationUpdate = (lat, lng) {
        if (mounted) {
          setState(() {
            _lat = lat;
            _lng = lng;
            _currentLocation = 'Đang chia sẻ vị trí trực tiếp';
            _isGettingGPS = false;
          });
          _webViewController?.runJavaScript('updateDriverLocation($_lat, $_lng);');
        }
      };
    }
  }

  void _selectMockImage() {
    const String mockBase64 = 
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
    setState(() {
      _photoPreview = mockBase64;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('📸 Đã đính kèm ảnh chụp chứng thực giao hàng DEMO!'),
        backgroundColor: Colors.blue,
      ),
    );
  }

  void _pickImage(ImageSource source) async {
    try {
      final XFile? file = await _picker.pickImage(
        source: source,
        maxWidth: 800,
        maxHeight: 800,
        imageQuality: 85,
      );
      if (file != null) {
        final bytes = await file.readAsBytes();
        final base64Image = 'data:image/jpeg;base64,${base64Encode(bytes)}';
        setState(() {
          _photoPreview = base64Image;
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Không mở được camera/gallery: $e'), backgroundColor: Colors.red),
      );
    }
  }

  void _showImageSourceSheet() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (ctx) {
        return SafeArea(
          child: Wrap(
            children: [
              const ListTile(
                title: Text('Chọn phương thức đính kèm ảnh', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
              ListTile(
                leading: const Icon(Icons.camera_alt, color: Colors.blue),
                title: const Text('Chụp ảnh thực tế từ Camera'),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickImage(ImageSource.camera);
                },
              ),
              ListTile(
                leading: const Icon(Icons.photo_library, color: Colors.green),
                title: const Text('Chọn ảnh sẵn có từ Thư viện'),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickImage(ImageSource.gallery);
                },
              ),
              ListTile(
                leading: const Icon(Icons.flash_on, color: Colors.amber),
                title: const Text('Nạp ảnh mẫu giao hàng DEMO nhanh (Cho Emulator)'),
                onTap: () {
                  Navigator.pop(ctx);
                  _selectMockImage();
                },
              ),
            ],
          ),
        );
      },
    );
  }

  void _handleSaveStatus() async {
    final chiTiet = _fullDelivery['chiTiet'] as List<dynamic>? ?? [];
    
    // 1. Chặn nếu có sản phẩm thiếu hàng chưa nhận đủ từ kho
    final hasUnpickedShortageItems = chiTiet.any((item) {
      final maCTGH = item['maCTGH'];
      final currentStatus = _itemUpdates[maCTGH]?['trangThai'] ?? item['trangThai'] ?? 'Chờ giao';
      final isAlreadyDelivered = currentStatus == 'Đã giao' || currentStatus == 'Đã giao một phần';
      final int soLuongNhanKho = item['soLuongNhanKho'] ?? 0;
      final int soLuongGiao = item['soLuongGiao'] ?? 0;
      return !isAlreadyDelivered && soLuongNhanKho < soLuongGiao;
    }) && _fullDelivery['trangThaiXuatKho'] != 'Đã nhận đủ';

    if (hasUnpickedShortageItems) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('⚠️ KHÔNG THỂ CẬP NHẬT: Một số sản phẩm vẫn còn thiếu hàng chưa được nhận đủ từ kho!\n\nVui lòng qua mục "Kho hàng → Lịch sử xuất kho" để xác nhận nhận hàng trước.'),
          backgroundColor: Colors.red,
          duration: Duration(seconds: 5),
        ),
      );
      return;
    }

    // 2. Chưa xác nhận nhận hàng từ kho (lần đầu)
    final confirmedPxkStatuses = ['Đã xuất', 'Đã nhận một phần', 'Đã nhận đủ'];
    final pxkConfirmed = confirmedPxkStatuses.contains(_fullDelivery['trangThaiXuatKho']);
    final isAnyItemDelivered = chiTiet.any((item) {
      final maCTGH = item['maCTGH'];
      final currentStatus = _itemUpdates[maCTGH]?['trangThai'] ?? item['trangThai'] ?? 'Chờ giao';
      return currentStatus == 'Đã giao' || currentStatus == 'Đã giao một phần';
    });
    final isTryingToDeliver = _status == 'Đã giao' || _status == 'Đã giao một phần' || _status == 'Đang giao một phần' || isAnyItemDelivered;
    
    if (isTryingToDeliver && !pxkConfirmed) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('⚠️ KHÔNG THỂ CẬP NHẬT: Bạn chưa xác nhận nhận hàng từ kho cho chuyến này!\n\nVui lòng qua mục "Kho hàng → Lịch sử xuất kho" để xác nhận.'),
          backgroundColor: Colors.red,
          duration: Duration(seconds: 5),
        ),
      );
      return;
    }

    // 3. Yêu cầu chụp ảnh xác nhận
    final double dynamicCOD = _calculateDynamicCOD();
    final showPaymentAndPhoto = _status == 'Đã giao' || _status == 'Đã giao một phần' || isAnyItemDelivered || dynamicCOD > 0;
    if (showPaymentAndPhoto && _photoPreview == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('⚠️ BẮT BUỘC: Vui lòng chụp ảnh xác nhận đã giao hàng để hoàn tất!'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // 4. Kiểm tra số tiền thu không khớp (nếu không phải ATM)
    final pttt = _fullDelivery['pttt'] ?? _fullDelivery['PTTT'] ?? '';
    final isATM = pttt.toString().toUpperCase().contains('ATM');
    if (showPaymentAndPhoto && !isATM) {
      final expected = dynamicCOD;
      final actual = double.tryParse(_amountPaid) ?? 0.0;
      if (expected > 0 && actual != expected) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('❌ SỐ TIỀN THU KHÔNG KHỚP!\nCần thu theo số lượng thực tế giao: ${NumberFormat.currency(locale: 'vi_VN', symbol: 'đ').format(expected)}.\nBạn đang nhập: ${NumberFormat.currency(locale: 'vi_VN', symbol: 'đ').format(actual)}.\nVui lòng nhập lại chính xác.'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 6),
          ),
        );
        return;
      }
    }

    setState(() => _isLoading = true);
    try {
      int maNguoiThucHien = 0;
      final userStr = SharedPreferencesService.getUser();
      if (userStr != null && userStr.isNotEmpty) {
        final userObj = jsonDecode(userStr);
        maNguoiThucHien = userObj['id'] ?? userObj['Id'] ?? userObj['maNhanVien'] ?? 0;
      }

      final payload = {
        'TrangThai': _status,
        'GhiChu': _notes,
        'NgayGiaoThucTe': (_status == 'Đã giao' || _status == 'Đã giao một phần') ? DateTime.now().toUtc().toIso8601String() : null,
        'SoTienThu': double.tryParse(_amountPaid) ?? 0.0,
        'ViTriHienTai': _currentLocation,
        'Lat': _lat,
        'Lng': _lng,
        'HinhAnhXacNhan': _photoPreview,
        'MaNguoiThucHien': maNguoiThucHien,
        'Items': _itemUpdates.values.map((it) {
          return {
            'MaCTGH': it['maCTGH'],
            'TrangThai': it['trangThai'],
            'GhiChu': it['ghiChu']
          };
        }).toList()
      };

      final maPhieuGH = widget.delivery['maPhieuGH'] ?? widget.delivery['maGH'] ?? widget.delivery['id'];
      final res = await _apiService.updateDelivery(maPhieuGH, payload);
      
      if (!mounted) return;
      
      if (res.statusCode == 200 || res.statusCode == 204) {
        if (_status == 'Đã giao' || _status == 'Đã giao một phần' || _status == 'Đã hủy' || _status == 'Hoàn thành') {
           if (LocationTrackingService().isTracking && LocationTrackingService().currentMaPhieuGH == maPhieuGH.toString()) {
               await LocationTrackingService().stopTracking();
               setState(() { _isLiveTracking = false; });
           }
        }
        
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Lưu cập nhật trạng thái chuyến đi thành công!'),
            backgroundColor: Colors.green,
          ),
        );
        _fetchDetail(); // Reload detail and history!
      } else {
        throw Exception(res.data['message'] ?? 'Có lỗi xảy ra');
      }
    } catch (e) {
      if (!mounted) return;
      String errorMsg = e.toString();
      try {
        final dynamic err = e;
        if (err.response != null && err.response.data != null) {
          final data = err.response.data;
          if (data is Map) {
            errorMsg = data['message'] ?? data['Message'] ?? errorMsg;
          }
        }
      } catch (_) {}

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Lỗi cập nhật: $errorMsg'), 
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 6),
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Color _getStatusColor(String s) {
    if (s.contains('Đã giao')) return Colors.green;
    if (s.contains('Đang giao')) return Colors.blue;
    if (s.contains('Chờ')) return Colors.orange;
    if (s == 'Không thành công' || s == 'Hỏng/Lỗi' || s == 'Khách từ chối') return Colors.red;
    return Colors.grey;
  }

  @override
  Widget build(BuildContext context) {
    final delivery = _fullDelivery.isNotEmpty ? _fullDelivery : widget.delivery;
    final tongTien = (delivery['tongTienOrder'] ?? 0.0).toDouble();
    final daThu = (delivery['daThanhToanOrder'] ?? 0.0).toDouble();
    final canThu = (tongTien - daThu) > 0 ? (tongTien - daThu) : 0.0;
    final currencyFormatter = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');
    final pttt = _fullDelivery['pttt'] ?? _fullDelivery['PTTT'] ?? '';
    
    final maHD = delivery['maHD'] ?? delivery['MaHD'] ?? 'N/A';
    final maGH = delivery['maGH'] ?? delivery['maPhieuGH'] ?? 'N/A';
    final chiTiet = _fullDelivery['chiTiet'] as List<dynamic>? ?? [];
    
    final bool isCompletedStatus = delivery['trangThai'] == 'Đã giao' || delivery['trangThai'] == 'Đã hủy' || delivery['trangThai'] == 'Hoàn thành';

    // Web-equivalent validation logic checks
    final hasUnpickedShortageItems = chiTiet.any((item) {
      final maCTGH = item['maCTGH'];
      final currentStatus = _itemUpdates[maCTGH]?['trangThai'] ?? item['trangThai'] ?? 'Chờ giao';
      final isAlreadyDelivered = currentStatus == 'Đã giao' || currentStatus == 'Đã giao một phần';
      final int soLuongNhanKho = item['soLuongNhanKho'] ?? 0;
      final int soLuongGiao = item['soLuongGiao'] ?? 0;
      return !isAlreadyDelivered && soLuongNhanKho < soLuongGiao;
    }) && _fullDelivery['trangThaiXuatKho'] != 'Đã nhận đủ';

    final confirmedPxkStatuses = ['Đã xuất', 'Đã nhận một phần', 'Đã nhận đủ'];
    final pxkConfirmed = confirmedPxkStatuses.contains(_fullDelivery['trangThaiXuatKho']);
    final showReceiptWarning = !hasUnpickedShortageItems && !pxkConfirmed;

    final isAnyItemDelivered = chiTiet.any((item) {
      final maCTGH = item['maCTGH'];
      final currentStatus = _itemUpdates[maCTGH]?['trangThai'] ?? item['trangThai'] ?? 'Chờ giao';
      return currentStatus == 'Đã giao' || currentStatus == 'Đã giao một phần';
    });

    final double dynamicCOD = _calculateDynamicCOD();
    final bool showPaymentAndPhoto = _status == 'Đã giao' || _status == 'Đã giao một phần' || isAnyItemDelivered || dynamicCOD > 0;

    // Dropdown options matching Web
    final List<Map<String, String>> overallStatusOptions = [
      {'value': 'Chờ giao', 'label': '⏳ Chờ giao'},
      {'value': 'Đang giao', 'label': '🚚 Đang giao'},
      {'value': 'Đã giao một phần', 'label': '🌤️ Đã giao một phần'},
      {'value': 'Đã giao', 'label': '✅ Đã giao'},
      {'value': 'Không thành công', 'label': '❌ Không thành công'},
      {'value': 'Đã hủy', 'label': '🚫 Đã hủy'},
    ];

    // Filter overall "Đã giao" option if received from warehouse < total ordered
    int totalNhanKho = 0;
    int totalOrder = 0;
    for (var item in chiTiet) {
      totalNhanKho += (item['soLuongNhanKho'] ?? 0) as int;
      totalOrder += (item['soLuongOrder'] ?? 0) as int;
    }
    final driverReceivedAll = totalNhanKho >= totalOrder;
    final List<Map<String, String>> filteredOverallOptions = overallStatusOptions.where((opt) {
      if (opt['value'] == 'Đã giao') {
        return driverReceivedAll;
      }
      return true;
    }).toList();

    // Dynamically append current status to prevent crash
    final bool hasCurrentOverallStatus = filteredOverallOptions.any((opt) => opt['value'] == _status);
    if (!hasCurrentOverallStatus && _status.isNotEmpty) {
      filteredOverallOptions.add({'value': _status, 'label': '🔄 $_status'});
    }

    final itemStatusOptions = [
      {'value': 'Chờ giao', 'label': '⏳ Chờ giao'},
      {'value': 'Đang giao', 'label': '🚚 Đang giao'},
      {'value': 'Đang giao một phần', 'label': '🚚 Đang giao một phần'},
      {'value': 'Đã giao một phần', 'label': '🌤️ Đã giao một phần'},
      {'value': 'Đã giao', 'label': '✅ Đã giao'},
      {'value': 'Hỏng/Lỗi', 'label': '⚠️ Hỏng/Lỗi'},
      {'value': 'Khách từ chối', 'label': '❌ Khách từ chối'},
    ];

    return Scaffold(
      appBar: GradientAppBar(
        title: 'Chi tiết Giao Hàng: $maGH',
      ),
      body: Stack(
        children: [
          if (_isLoadingDetail)
            Center(child: CircularProgressIndicator(color: AppColors.primaryStart))
          else
            Column(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Header title with Status chip
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                'Chi Tiết Giao Hàng: $maGH',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: _getStatusColor(delivery['trangThai'] ?? '').withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: _getStatusColor(delivery['trangThai'] ?? '')),
                              ),
                              child: Text(
                                delivery['trangThai'] ?? 'Chờ giao',
                                style: TextStyle(
                                  color: _getStatusColor(delivery['trangThai'] ?? ''),
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            const Spacer(),
                            Text(
                              'HĐ: $maHD',
                              style: const TextStyle(color: Colors.grey, fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),

                        // Transit info and Customer info cards (2 sections)
                        Card(
                          elevation: 3,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  '📍 THÔNG TIN VẬN CHUYỂN',
                                  style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey, fontSize: 11),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Tài xế/Người giao: ${delivery['nguoiGiao'] ?? 'Chưa phân công'}',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                ),
                                const SizedBox(height: 4),
                                Text(delivery['diaChi'] ?? delivery['diaChiGiaoHang'] ?? 'Chưa rõ địa chỉ'),
                                const SizedBox(height: 8),
                                Text(
                                  'Ngày giao (dự kiến): ${delivery['ngayGiaoDuKien'] != null ? DateFormat('dd/MM/yyyy').format(DateTime.parse(delivery['ngayGiaoDuKien'])) : '—'}',
                                  style: TextStyle(color: AppColors.primaryStart, fontWeight: FontWeight.bold, fontSize: 13),
                                ),
                                const Divider(height: 24),
                                const Text(
                                  '👤 THÔNG TIN KHÁCH HÀNG',
                                  style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey, fontSize: 11),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Khách hàng: ${delivery['tenKhachHang'] ?? 'Chưa có'}',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                ),
                                const SizedBox(height: 4),
                                Text('Người nhận: ${delivery['tenKhachHang'] ?? 'Chưa có'}'),
                                const SizedBox(height: 4),
                                Text(
                                  'SĐT: ${delivery['sdtKhachHang'] ?? 'Chưa có'}',
                                  style: const TextStyle(fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Banner Alert: Missing warehouse stocks (Red Alert)
                        if (hasUnpickedShortageItems)
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(16),
                            margin: const EdgeInsets.only(bottom: 16),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFDEDEC),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFF5B7B1)),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Icon(Icons.error_outline, color: Colors.red, size: 24),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        '🚫 Có sản phẩm thiếu hàng chưa nhận đủ từ kho!',
                                        style: TextStyle(fontWeight: FontWeight.bold, color: Colors.red, fontSize: 14),
                                      ),
                                      const SizedBox(height: 6),
                                      const Text(
                                        'Tài xế chưa xác nhận nhận hàng còn lại từ kho. Không thể cập nhật trạng thái giao khi chưa được nhận đủ.',
                                        style: TextStyle(color: Colors.red, fontSize: 13),
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        '➔ Vui lòng qua Kho hàng → Lịch sử xuất kho để xác nhận nhận hàng còn lại trước khi cập nhật.',
                                        style: TextStyle(fontWeight: FontWeight.bold, color: Colors.red.shade900, fontSize: 13),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),

                        // Banner Alert: Warehouse receipt not confirmed (Yellow Alert)
                        if (showReceiptWarning)
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(16),
                            margin: const EdgeInsets.only(bottom: 16),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFEF9E7),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFF9E79F)),
                            ),
                            child: const Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Icon(Icons.warning_amber_rounded, color: Colors.amber, size: 24),
                                SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        '🚫 Chưa xác nhận nhận hàng từ kho!',
                                        style: TextStyle(fontWeight: FontWeight.bold, color: Colors.amber, fontSize: 14),
                                      ),
                                      SizedBox(height: 6),
                                      Text(
                                        'Bạn cần qua mục Kho hàng → Lịch sử xuất kho để xác nhận nhận hàng trước khi cập nhật trạng thái giao.\nHệ thống sẽ không cho phép chuyển trạng thái giao hàng khi chưa nhận hàng từ kho.',
                                        style: TextStyle(color: Colors.amber, fontSize: 13),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),

                        // Section 1: Cập nhật trạng thái từng sản phẩm
                        const Text(
                          '📦 CẬP NHẬT TRẠNG THÁI TỪNG SẢN PHẨM',
                          style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey, fontSize: 12),
                        ),
                        const SizedBox(height: 12),

                        if (chiTiet.isEmpty)
                          const Padding(
                            padding: EdgeInsets.only(bottom: 16.0),
                            child: Text('Không tải được danh sách hàng hóa', style: TextStyle(color: Colors.grey, fontStyle: FontStyle.italic)),
                          )
                        else
                          ListView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: chiTiet.length,
                            itemBuilder: (context, index) {
                              final item = chiTiet[index];
                              final maCTGH = item['maCTGH'];
                              final currentItemStatus = _itemUpdates[maCTGH]?['trangThai'] ?? 'Chờ giao';
                              final isDone = currentItemStatus == 'Đã giao';

                              final int soLuongNhanKho = item['soLuongNhanKho'] ?? 0;
                              final int soLuongGiao = item['soLuongGiao'] ?? 0;
                              final bool isShort = soLuongNhanKho < soLuongGiao;

                              // Filter item dropdown options based on shortages
                              final List<Map<String, String>> filteredItemOptions = itemStatusOptions.where((opt) {
                                if (isShort) {
                                  return opt['value']!.contains('một phần') || opt['value'] == 'Hỏng/Lỗi' || opt['value'] == 'Khách từ chối';
                                } else {
                                  return !opt['value']!.contains('một phần');
                                }
                              }).toList();

                              // Dynamically append current item status to prevent crash
                              final bool hasCurrentItemStatus = filteredItemOptions.any((opt) => opt['value'] == currentItemStatus);
                              if (!hasCurrentItemStatus && currentItemStatus.isNotEmpty) {
                                filteredItemOptions.add({'value': currentItemStatus, 'label': '🔄 $currentItemStatus'});
                              }

                              return Card(
                                margin: const EdgeInsets.only(bottom: 12),
                                elevation: 2,
                                color: isDone ? Colors.grey.shade50 : Colors.white,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                child: Padding(
                                  padding: const EdgeInsets.all(12.0),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Expanded(
                                            child: Text(
                                              item['tenSanPham'] ?? 'Sản phẩm',
                                              style: TextStyle(
                                                fontWeight: FontWeight.bold,
                                                fontSize: 14,
                                                color: isDone ? Colors.grey : Colors.black87,
                                              ),
                                            ),
                                          ),
                                          Text(
                                            'Đặt: ${item['soLuongOrder'] ?? 0}',
                                            style: const TextStyle(fontSize: 12, color: Colors.grey),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 8),
                                      Row(
                                        children: [
                                          const Text('SL Kế hoạch: ', style: TextStyle(fontSize: 12)),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: isDone ? Colors.grey.shade300 : Colors.blue.shade100,
                                              borderRadius: BorderRadius.circular(6),
                                            ),
                                            child: Text(
                                              '$soLuongGiao',
                                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: isDone ? Colors.grey.shade700 : Colors.blue.shade900),
                                            ),
                                          ),
                                          const Spacer(),
                                          const Text('Nhận từ kho: ', style: TextStyle(fontSize: 12)),
                                          Text(
                                            '$soLuongNhanKho ${isShort ? "(Thiếu)" : ""}',
                                            style: TextStyle(
                                              fontWeight: FontWeight.bold, 
                                              fontSize: 12,
                                              color: isShort ? Colors.red : Colors.green,
                                            ),
                                          ),
                                        ],
                                      ),
                                      const Divider(height: 16),
                                      Row(
                                        children: [
                                          Expanded(
                                            flex: 3,
                                            child: DropdownButtonFormField<String>(
                                              isExpanded: true,
                                              value: currentItemStatus,
                                              decoration: const InputDecoration(
                                                labelText: 'Trạng Thái',
                                                border: OutlineInputBorder(),
                                                isDense: true,
                                                contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                              ),
                                              items: filteredItemOptions.map((opt) => DropdownMenuItem<String>(
                                                value: opt['value'],
                                                child: Text(opt['label']!, style: const TextStyle(fontSize: 12)),
                                              )).toList(),
                                              onChanged: (val) {
                                                if (val != null) {
                                                  _handleItemUpdate(maCTGH, 'trangThai', val);
                                                }
                                              },
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            flex: 4,
                                            child: TextField(
                                              decoration: const InputDecoration(
                                                labelText: 'Ghi Chú',
                                                hintText: 'Ghi chú SP...',
                                                border: OutlineInputBorder(),
                                                isDense: true,
                                                contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                              ),
                                              controller: TextEditingController(text: _itemUpdates[maCTGH]?['ghiChu'] ?? '')
                                                ..selection = TextSelection.fromPosition(
                                                  TextPosition(offset: (_itemUpdates[maCTGH]?['ghiChu'] ?? '').length),
                                                ),
                                              style: const TextStyle(fontSize: 13),
                                              onChanged: (val) {
                                                _itemUpdates[maCTGH]?['ghiChu'] = val;
                                              },
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        const SizedBox(height: 16),

                        // Alert: Shortage Handling Guidelines
                        if (chiTiet.any((it) => (it['soLuongNhanKho'] ?? 0) < (it['soLuongGiao'] ?? 0)))
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(12),
                            margin: const EdgeInsets.only(bottom: 16),
                            decoration: BoxDecoration(
                              color: const Color(0xFFEBF5FB),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFAED6F1)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  '💡 Hướng dẫn xử lý hàng thiếu:',
                                  style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF2471A3), fontSize: 13),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'Bạn đang nhận thiếu hàng từ kho cho chuyến này (Cột Nhận từ kho màu đỏ).',
                                  style: TextStyle(color: Colors.blue.shade900, fontSize: 12),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '• Muốn lấy thêm hàng ngay: Quay lại Kho hàng -> Lịch sử xuất kho, tìm phiếu này và bấm xác nhận nhận thêm hàng.',
                                  style: TextStyle(color: Colors.blue.shade900, fontSize: 12),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '• Giao số đã có trước, giao phần thiếu sau: Bấm LƯU CẬP NHẬT. Phần hàng còn thiếu sẽ được báo về hệ thống để Quản lý xếp chuyến giao sau.',
                                  style: TextStyle(color: Colors.blue.shade900, fontSize: 12),
                                ),
                              ],
                            ),
                          ),

                        // Section 2: Hướng dẫn thu tiền (COD)
                        if (pttt.toString().toUpperCase().contains('ATM'))
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(16),
                            margin: const EdgeInsets.only(bottom: 16),
                            decoration: BoxDecoration(
                              color: const Color(0xFFE8F8F5),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFA3E4D7)),
                            ),
                            child: const Text(
                              '💳 ĐƠN HÀNG ĐÃ THANH TOÁN QUA ATM/BANKING. KHÔNG THU THÊM TIỀN MẶT.',
                              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.teal, fontSize: 13),
                              textAlign: TextAlign.center,
                            ),
                          )
                        else
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(16),
                            margin: const EdgeInsets.only(bottom: 16),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFFF4E5),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFFFE2B7)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  '💰 HƯỚNG DẪN THU TIỀN (COD)',
                                  style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFD35400), fontSize: 13),
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    Radio<String>(
                                      value: 'partial',
                                      groupValue: _paymentOption,
                                      onChanged: (val) {
                                        if (val != null) {
                                          setState(() {
                                            _paymentOption = val;
                                            _amountPaid = _calculateDynamicCOD().toInt().toString();
                                          });
                                        }
                                      },
                                    ),
                                    const Expanded(
                                      child: Text(
                                        'Thu theo thực tế đợt này',
                                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                  ],
                                ),
                                Row(
                                  children: [
                                    Radio<String>(
                                      value: 'full',
                                      groupValue: _paymentOption,
                                      onChanged: (val) {
                                        if (val != null) {
                                          setState(() {
                                            _paymentOption = val;
                                            _amountPaid = _calculateDynamicCOD().toInt().toString();
                                          });
                                        }
                                      },
                                    ),
                                    const Expanded(
                                      child: Text(
                                        'Thu toàn bộ số tiền còn lại (Đợt cuối)',
                                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Vui lòng thu: ${currencyFormatter.format(dynamicCOD)} cho Tài xế khi nhận hàng.',
                                  style: const TextStyle(fontWeight: FontWeight.w900, color: Colors.red, fontSize: 16),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  _paymentOption == 'partial'
                                      ? '(Số tiền cấn trừ tiền cọc & tổng giá trị thực tế giao)'
                                      : '(Đây là tổng số tiền khách hàng còn nợ của toàn bộ đơn hàng)',
                                  style: const TextStyle(color: Colors.grey, fontSize: 11),
                                ),
                              ],
                            ),
                          ),

                        // Section 3: Cập nhật trạng thái chuyến đi (Tổng thể)
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          margin: const EdgeInsets.only(bottom: 16),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF0F7FF),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFCCE3F5)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                '⚡ CẬP NHẬT TRẠNG THÁI CHUYẾN ĐI (TỔNG THỂ)',
                                style: TextStyle(fontWeight: FontWeight.bold, color: Colors.blue, fontSize: 13),
                              ),
                              const SizedBox(height: 16),

                              // Trạng thái giao dropdown
                              DropdownButtonFormField<String>(
                                value: _status,
                                decoration: const InputDecoration(
                                  labelText: 'Trạng Thái Giao',
                                  border: OutlineInputBorder(),
                                  fillColor: Colors.white,
                                  filled: true,
                                  isDense: true,
                                ),
                                items: filteredOverallOptions.map((opt) => DropdownMenuItem<String>(
                                  value: opt['value'],
                                  child: Text(opt['label']!),
                                )).toList(),
                                onChanged: (val) {
                                  if (val != null) {
                                    setState(() {
                                      _status = val;
                                      
                                      // Sync down to items
                                      if (_status == 'Đang giao' || _status == 'Đã giao' || _status == 'Đã giao một phần') {
                                        _itemUpdates.forEach((maCTGH, it) {
                                          final itemObj = chiTiet.firstWhere((c) => c['maCTGH'] == maCTGH, orElse: () => null);
                                          if (itemObj != null && itemObj['trangThai'] != 'Đã giao') {
                                            it['trangThai'] = _status;
                                          }
                                        });
                                      }

                                      if (_status == 'Đã giao' || _status == 'Đã giao một phần') {
                                        _amountPaid = _calculateDynamicCOD().toInt().toString();
                                      } else {
                                        _amountPaid = '';
                                      }
                                    });
                                  }
                                },
                              ),
                              const SizedBox(height: 16),

                              // So tien thu duoc (VNĐ)
                              if (showPaymentAndPhoto) ...[
                                TextField(
                                  decoration: InputDecoration(
                                    labelText: 'Số tiền thu được (VNĐ)',
                                    border: const OutlineInputBorder(),
                                    fillColor: Colors.white,
                                    filled: true,
                                    isDense: true,
                                    helperText: pttt.toString().toUpperCase().contains('ATM') 
                                      ? 'Đã thanh toán qua ATM' 
                                      : 'BẮT BUỘC THU: ${currencyFormatter.format(dynamicCOD)}',
                                    errorText: (!pttt.toString().toUpperCase().contains('ATM') && 
                                                dynamicCOD > 0 && 
                                                (double.tryParse(_amountPaid) ?? 0.0) != dynamicCOD)
                                      ? 'Số tiền thu không khớp với thực tế!'
                                      : null,
                                  ),
                                  keyboardType: TextInputType.number,
                                  controller: TextEditingController(text: _amountPaid)
                                    ..selection = TextSelection.fromPosition(
                                      TextPosition(offset: _amountPaid.length),
                                    ),
                                  onChanged: (val) {
                                    setState(() {
                                      _amountPaid = val;
                                    });
                                  },
                                ),
                                const SizedBox(height: 16),

                                // Photo Upload dashed border box
                                const Text(
                                  '📸 CHỤP ẢNH XÁC NHẬN GIAO HÀNG *',
                                  style: TextStyle(fontWeight: FontWeight.bold, color: Colors.blue, fontSize: 13),
                                ),
                                const SizedBox(height: 8),
                                InkWell(
                                  onTap: _showImageSourceSheet,
                                  child: Container(
                                    height: 120,
                                    width: double.infinity,
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(
                                        color: Colors.blue.shade300,
                                        style: BorderStyle.solid,
                                        width: 1.5,
                                      ),
                                    ),
                                    child: _photoPreview != null
                                        ? ClipRRect(
                                            borderRadius: BorderRadius.circular(12),
                                            child: Image.memory(
                                              base64Decode(_photoPreview!.split(',')[1]),
                                              fit: BoxFit.cover,
                                              width: double.infinity,
                                            ),
                                          )
                                        : const Column(
                                            mainAxisAlignment: MainAxisAlignment.center,
                                            children: [
                                              Icon(Icons.camera_alt_outlined, size: 36, color: Colors.blue),
                                              SizedBox(height: 8),
                                              Text(
                                                'Nhấp để chụp ảnh / đính kèm ảnh',
                                                style: TextStyle(color: Colors.blue, fontWeight: FontWeight.bold, fontSize: 13),
                                              ),
                                            ],
                                          ),
                                  ),
                                ),
                                const SizedBox(height: 16),
                              ],

                              // Ghi chú tổng thể
                              TextField(
                                decoration: const InputDecoration(
                                  labelText: 'Ghi chú cập nhật',
                                  hintText: 'Nhập ghi chú cập nhật chuyến đi...',
                                  border: OutlineInputBorder(),
                                  fillColor: Colors.white,
                                  filled: true,
                                  isDense: true,
                                ),
                                maxLines: 2,
                                controller: TextEditingController(text: _notes)
                                  ..selection = TextSelection.fromPosition(
                                    TextPosition(offset: _notes.length),
                                  ),
                                onChanged: (val) {
                                  _notes = val;
                                },
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Section 4: Live Tracking positions (Orange Alert Box)
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          margin: const EdgeInsets.only(bottom: 24),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF3E0),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFFFE0B2)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                '📡 VỊ TRÍ TRỰC TIẾP (LIVE TRACKING)',
                                style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFE65100), fontSize: 13),
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Expanded(
                                    child: TextField(
                                      decoration: const InputDecoration(
                                        labelText: 'Vị trí hiện tại (Ví dụ: Ngã tư A, Cách khách 2km...)',
                                        border: OutlineInputBorder(),
                                        fillColor: Colors.white,
                                        filled: true,
                                        isDense: true,
                                      ),
                                      controller: TextEditingController(text: _currentLocation)
                                        ..selection = TextSelection.fromPosition(
                                          TextPosition(offset: _currentLocation.length),
                                        ),
                                      onChanged: (val) {
                                        _currentLocation = val;
                                      },
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  ElevatedButton(
                                    onPressed: _toggleLiveTracking,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: _isLiveTracking ? Colors.red.shade700 : Colors.orange.shade700,
                                      foregroundColor: Colors.white,
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                    ),
                                    child: _isGettingGPS && _isLiveTracking
                                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                      : Text(_isLiveTracking ? '🛑 DỪNG LIVE' : '📍 BẮT ĐẦU LIVE', style: const TextStyle(fontWeight: FontWeight.bold)),
                                  ),
                                ],
                              ),
                              if (_lat != null && _lng != null) ...[
                                const SizedBox(height: 8),
                                Text(
                                  'Tọa độ ghi nhận: ${_lat!.toStringAsFixed(6)}, ${_lng!.toStringAsFixed(6)}',
                                  style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.green, fontSize: 12),
                                ),
                              ],
                            ],
                          ),
                        ),

                        // Static Google Maps Navigation Embed
                        const Text(
                          '🗺️ BẢN ĐỒ DẪN ĐƯỜNG',
                          style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey, fontSize: 12),
                        ),
                        const SizedBox(height: 12),
                        Container(
                          height: 250,
                          width: double.infinity,
                          decoration: BoxDecoration(
                            color: Colors.grey.shade100,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.grey.shade300),
                          ),
                          clipBehavior: Clip.antiAlias,
                          child: _webViewController != null
                              ? WebViewWidget(controller: _webViewController!)
                              : const Center(
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.map_outlined, size: 48, color: Colors.grey),
                                      SizedBox(height: 8),
                                      Text('Chưa có địa chỉ để hiển thị bản đồ', style: TextStyle(color: Colors.grey, fontSize: 13)),
                                    ],
                                  ),
                                ),
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            onPressed: () async {
                              final address = _fullDelivery['diaChi'] ?? delivery['diaChi'] ?? delivery['diaChiGiaoHang'] ?? '';
                              if (address.isEmpty || address == 'Chưa rõ') {
                                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Không có địa chỉ để chỉ đường!'), backgroundColor: Colors.red));
                                return;
                              }
                              final String query = Uri.encodeComponent(address);
                              final Uri geoUri = Uri.parse('geo:0,0?q=$query');
                              final Uri webUri = Uri.parse('https://www.google.com/maps/search/?api=1&query=$query');
                              
                              try {
                                final bool launched = await launchUrl(geoUri);
                                if (!launched) {
                                  await launchUrl(webUri, mode: LaunchMode.externalApplication);
                                }
                              } catch (e) {
                                try {
                                  await launchUrl(webUri, mode: LaunchMode.externalApplication);
                                } catch (_) {}
                              }
                            },
                            icon: const Icon(Icons.navigation_outlined),
                            label: const Text('Mở Google Maps chỉ đường (GPS)'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primaryStart,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Section 5: Lịch sử theo dõi giao hàng
                        const Divider(height: 48),
                        const Text(
                          '🕒 LỊCH SỬ THEO DÕI GIAO HÀNG',
                          style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey, fontSize: 12),
                        ),
                        const SizedBox(height: 16),

                        if (_isLoadingHistory)
                          Center(child: CircularProgressIndicator(color: AppColors.primaryStart))
                        else if (_history.isEmpty)
                          const Text('Chưa có lịch sử cập nhật.', style: TextStyle(color: Colors.grey, fontStyle: FontStyle.italic))
                        else
                          ListView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: _history.length,
                            itemBuilder: (context, index) {
                              final h = _history[index];
                              final String formattedDate = h['ngayTao'] != null 
                                  ? DateFormat('dd/MM/yyyy HH:mm').format(DateTime.parse(h['ngayTao'])) 
                                  : '—';
                              final isFirst = index == 0;

                              return Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Column(
                                    children: [
                                      Container(
                                        width: 14,
                                        height: 14,
                                        decoration: BoxDecoration(
                                          color: isFirst ? Colors.blue : Colors.grey.shade400,
                                          shape: BoxShape.circle,
                                          border: Border.all(color: Colors.white, width: 2),
                                          boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 2)],
                                        ),
                                      ),
                                      if (index < _history.length - 1)
                                        Container(
                                          width: 2,
                                          height: 80,
                                          color: Colors.grey.shade300,
                                        ),
                                    ],
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Text(
                                              h['trangThaiMoi'] ?? 'Cập nhật',
                                              style: TextStyle(
                                                fontWeight: FontWeight.bold, 
                                                color: isFirst ? Colors.blue.shade800 : Colors.black87,
                                                fontSize: 14,
                                              ),
                                            ),
                                            Text(
                                              formattedDate,
                                              style: const TextStyle(fontSize: 11, color: Colors.grey),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          h['noiDungThayDoi'] ?? '',
                                          style: const TextStyle(color: Colors.black54, fontSize: 13),
                                        ),
                                        if (h['viTriCapNhat'] != null && h['viTriCapNhat'].toString().isNotEmpty) ...[
                                          const SizedBox(height: 4),
                                          Text(
                                            '📍 ${h['viTriCapNhat']}',
                                            style: const TextStyle(color: Colors.blueGrey, fontStyle: FontStyle.italic, fontSize: 12),
                                          ),
                                        ],
                                        if (h['hinhAnhXacNhan'] != null && h['hinhAnhXacNhan'].toString().isNotEmpty) ...[
                                          const SizedBox(height: 8),
                                          const Text('📸 Ảnh xác nhận:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Colors.grey)),
                                          const SizedBox(height: 4),
                                          ClipRRect(
                                            borderRadius: BorderRadius.circular(8),
                                            child: Image.memory(
                                              base64Decode(h['hinhAnhXacNhan'].toString().contains(',')
                                                  ? h['hinhAnhXacNhan'].toString().split(',')[1]
                                                  : h['hinhAnhXacNhan'].toString()),
                                              height: 120,
                                              width: 180,
                                              fit: BoxFit.cover,
                                              errorBuilder: (ctx, err, stack) => const Icon(Icons.broken_image, size: 48, color: Colors.grey),
                                            ),
                                          ),
                                        ],
                                        const SizedBox(height: 16),
                                      ],
                                    ),
                                  ),
                                ],
                              );
                            },
                          ),
                      ],
                    ),
                  ),
                ),

                // Sticky Bottom Action Bar matching Web Dialog Actions
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.05),
                        blurRadius: 4,
                        offset: const Offset(0, -2),
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (_fullDelivery['coTheGiaoTiep'] == true) ...[
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            onPressed: () {
                              final maHoaDon = _fullDelivery['maHoaDon']?.toString();
                              if (maHoaDon != null) {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => DeliveryFormScreen(initialOrderId: maHoaDon),
                                  ),
                                ).then((res) {
                                  if (res == true) _fetchDetail();
                                });
                              }
                            },
                            icon: const Icon(Icons.add_box),
                            label: const Text('TIẾP TỤC TẠO PHIẾU GIAO', style: TextStyle(fontWeight: FontWeight.bold)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.green.shade600,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                      ],
                      Row(
                        children: [
                          Expanded(
                            flex: !isCompletedStatus ? 2 : 1,
                            child: OutlinedButton(
                              onPressed: () => Navigator.pop(context),
                              style: OutlinedButton.styleFrom(
                                side: const BorderSide(color: Colors.grey),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                padding: const EdgeInsets.symmetric(vertical: 14),
                              ),
                              child: const Text('ĐÓNG', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
                            ),
                          ),
                          if (!isCompletedStatus) ...[
                            const SizedBox(width: 12),
                            Expanded(
                              flex: 3,
                              child: ElevatedButton(
                                onPressed: (_isLoading || hasUnpickedShortageItems) ? null : _handleSaveStatus,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: hasUnpickedShortageItems ? Colors.red.shade700 : AppColors.primaryStart,
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  padding: const EdgeInsets.symmetric(vertical: 14),
                                ),
                                child: _isLoading 
                                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                  : const Text('LƯU CẬP NHẬT', style: TextStyle(fontWeight: FontWeight.bold)),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          if (_isLoading)
            Container(
              color: Colors.black26,
              child: Center(
                child: CircularProgressIndicator(color: AppColors.primaryStart),
              ),
            ),
        ],
      ),
    );
  }
}
