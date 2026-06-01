import 'package:flutter/material.dart';
import '../../core/app_theme.dart';
import '../../services/api_service.dart';
import '../../services/shared_preferences_service.dart';
import 'dart:convert';
import 'package:intl/intl.dart';

class NotificationScreen extends StatefulWidget {
  const NotificationScreen({super.key});

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {
  final ApiService _apiService = ApiService();
  List<dynamic> _notifications = [];
  bool _isLoading = true;
  String? _userId;

  @override
  void initState() {
    super.initState();
    _loadUserAndFetch();
  }

  Future<void> _loadUserAndFetch() async {
    final userStr = SharedPreferencesService.getUser();
    if (userStr != null && userStr.isNotEmpty) {
      try {
        final user = jsonDecode(userStr);
        _userId = user['maNhanVien']?.toString() ?? user['id']?.toString();
      } catch (_) {}
    }
    
    if (_userId != null) {
      await _fetchNotifications();
    } else {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _fetchNotifications() async {
    try {
      final response = await _apiService.dio.get('/notifications?userId=$_userId');
      if (response.statusCode == 200) {
        setState(() {
          _notifications = response.data;
          _isLoading = false;
        });
      }
    } catch (e) {
      print("Lỗi fetch notifications: $e");
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _markAsRead(dynamic notification) async {
    if (notification['daDoc'] == true) return;
    
    final id = notification['maThongBao'];
    try {
      await _apiService.dio.put('/notifications/$id/read');
      setState(() {
        notification['daDoc'] = true;
      });
    } catch (e) {
      print("Lỗi đánh dấu đã đọc: $e");
    }
  }

  Future<void> _markAllAsRead() async {
    if (_userId == null) return;
    
    try {
      await _apiService.dio.put('/notifications/read-all?userId=$_userId');
      setState(() {
        for (var n in _notifications) {
          n['daDoc'] = true;
        }
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Đã đánh dấu tất cả là đã đọc')),
      );
    } catch (e) {
      print("Lỗi đánh dấu tất cả đã đọc: $e");
    }
  }

  String _formatDate(String? isoString) {
    if (isoString == null) return '';
    try {
      final date = DateTime.parse(isoString);
      return DateFormat('dd/MM/yyyy HH:mm').format(date);
    } catch (_) {
      return isoString;
    }
  }

  IconData _getIconForType(String? type) {
    if (type == null) return Icons.notifications;
    final t = type.toLowerCase();
    if (t.contains('donhang') || t.contains('order')) return Icons.shopping_bag;
    if (t.contains('congno') || t.contains('debt')) return Icons.account_balance_wallet;
    if (t.contains('giaohang') || t.contains('delivery')) return Icons.local_shipping;
    if (t.contains('khuyenmai') || t.contains('promotion')) return Icons.local_offer;
    if (t.contains('hethong') || t.contains('system')) return Icons.info;
    return Icons.notifications;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: GradientAppBar(
        title: 'Thông báo',
        actions: [
          IconButton(
            icon: const Icon(Icons.done_all),
            tooltip: 'Đánh dấu tất cả đã đọc',
            onPressed: _notifications.any((n) => n['daDoc'] == false) 
                ? _markAllAsRead 
                : null,
          ),
        ],
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : _notifications.isEmpty 
          ? const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.notifications_off_outlined, size: 64, color: AppColors.textHint),
                  SizedBox(height: 16),
                  Text('Bạn không có thông báo nào', style: TextStyle(color: AppColors.textSecondary, fontSize: 16)),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: _fetchNotifications,
              child: ListView.separated(
                padding: const EdgeInsets.all(12),
                itemCount: _notifications.length,
                separatorBuilder: (context, index) => const SizedBox(height: 8),
                itemBuilder: (context, index) {
                  final n = _notifications[index];
                  final bool isRead = n['daDoc'] == true;
                  
                  return Card(
                    elevation: 0,
                    margin: EdgeInsets.zero,
                    color: isRead ? Colors.white : AppColors.primaryStart.withValues(alpha: 0.05),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(
                        color: isRead ? AppColors.divider : AppColors.primaryStart.withValues(alpha: 0.3),
                      ),
                    ),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(12),
                      onTap: () {
                        _markAsRead(n);
                        // Optional: Navigate to linked screen based on n['lienKet']
                        // e.g. if (n['lienKet']?.contains('/sales/orders') == true) ...
                      },
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: isRead ? AppColors.surface : AppColors.primaryStart.withValues(alpha: 0.1),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                _getIconForType(n['loaiThongBao']),
                                color: isRead ? AppColors.textSecondary : AppColors.primaryStart,
                                size: 24,
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    n['tieuDe'] ?? 'Thông báo',
                                    style: TextStyle(
                                      fontWeight: isRead ? FontWeight.w600 : FontWeight.w700,
                                      fontSize: 15,
                                      color: isRead ? AppColors.textPrimary : Colors.black,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    n['noiDung'] ?? '',
                                    style: TextStyle(
                                      fontSize: 13,
                                      color: isRead ? AppColors.textSecondary : AppColors.textPrimary,
                                      height: 1.4,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    _formatDate(n['ngayTao']),
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: isRead ? AppColors.textHint : AppColors.primaryStart.withValues(alpha: 0.8),
                                      fontWeight: isRead ? FontWeight.normal : FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            if (!isRead)
                              Container(
                                width: 8,
                                height: 8,
                                margin: const EdgeInsets.only(top: 8),
                                decoration: const BoxDecoration(
                                  color: AppColors.error,
                                  shape: BoxShape.circle,
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
    );
  }
}
