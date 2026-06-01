import 'dart:convert';
import 'package:flutter/material.dart';
import '../../core/app_theme.dart';
import '../../services/shared_preferences_service.dart';
import '../../services/api_service.dart';
import '../../services/push_notification_service.dart';
import '../notifications/notification_screen.dart';

// Import toàn bộ các Tab của hệ thống
import '../sales/dashboard_tab.dart';
import '../sales/products_tab.dart';
import '../sales/orders_tab.dart';
import '../sales/customers_tab.dart';
import '../manager/suppliers_tab.dart';
import '../manager/promotions_tab.dart';
import '../warehouse/stock_orders_tab.dart';
import '../manager/returns_tab.dart';
import '../warehouse/inventory_tab.dart';
import '../driver/deliveries_tab.dart';
import '../manager/debts_tab.dart';
import '../admin/employees_tab.dart';
import '../sales/chat_tab.dart';
import '../manager/price_history_tab.dart';
import '../manager/reports_tab.dart';
import '../admin/backup_restore_tab.dart';

class MainDynamicHomeScreen extends StatefulWidget {
  const MainDynamicHomeScreen({super.key});

  @override
  State<MainDynamicHomeScreen> createState() => _MainDynamicHomeScreenState();
}

class _MainDynamicHomeScreenState extends State<MainDynamicHomeScreen> {
  int _selectedIndex = 0;
  String _appBarTitle = 'Tổng quan';
  String _roleName = 'Nhân viên';
  String _fullName = 'Người dùng';

  // Danh sách toàn bộ các tính năng của hệ thống (Master Menu Registry)
  final List<Map<String, dynamic>> masterMenuItems = [
    {
      'id': 'DASHBOARD',
      'title': 'Tổng quan',
      'icon': Icons.dashboard,
      'widget': const DashboardTab(),
    },
    {
      'id': 'PRODUCTS',
      'title': 'Sản Phẩm',
      'icon': Icons.inventory_2,
      'widget': const ProductsTab(),
    },
    {
      'id': 'ORDERS',
      'title': 'Đơn Hàng',
      'icon': Icons.shopping_cart,
      'widget': const OrdersTab(),
    },
    {
      'id': 'CUSTOMERS',
      'title': 'Khách Hàng',
      'icon': Icons.people,
      'widget': const CustomersTab(),
    },
    {
      'id': 'SUPPLIERS',
      'title': 'Nhà Cung Cấp',
      'icon': Icons.business,
      'widget': const SuppliersTab(),
    },
    {
      'id': 'PROMOTIONS',
      'title': 'Khuyến Mãi',
      'icon': Icons.local_offer,
      'widget': const PromotionsTab(),
    },
    {
      'id': 'STOCK_ORDERS',
      'title': 'Nhập Hàng',
      'icon': Icons.move_to_inbox,
      'widget': const StockOrdersTab(),
    },
    {
      'id': 'RETURNS',
      'title': 'Đổi / Trả',
      'icon': Icons.assignment_return,
      'widget': const ReturnsTab(),
    },
    {
      'id': 'INVENTORY',
      'title': 'Kho Hàng',
      'icon': Icons.warehouse,
      'widget': const InventoryTab(),
    },
    {
      'id': 'PRICE_HISTORY',
      'title': 'Lịch Sử Giá',
      'icon': Icons.timeline,
      'widget': const PriceHistoryTab(),
    },
    {
      'id': 'DELIVERIES',
      'title': 'Giao Hàng',
      'icon': Icons.local_shipping,
      'widget': const DeliveriesTab(),
    },
    {
      'id': 'DEBTS',
      'title': 'Công Nợ',
      'icon': Icons.account_balance_wallet,
      'widget': const DebtsTab(),
    },
    {
      'id': 'REPORTS',
      'title': 'Báo Cáo',
      'icon': Icons.bar_chart,
      'widget': const ReportsTab(),
    },
    {
      'id': 'EMPLOYEES',
      'title': 'Nhân Viên',
      'icon': Icons.badge,
      'widget': const EmployeesTab(),
    },
    {
      'id': 'CHAT',
      'title': 'Hỗ trợ Chat',
      'icon': Icons.chat,
      'widget': const ChatTab(),
    },
    {
      'id': 'SETTINGS',
      'title': 'Cài Đặt',
      'icon': Icons.settings,
      'widget': const _DynamicProfileTab(),
    },
  ];

  List<Map<String, dynamic>> _userMenuItems = [];

  @override
  void initState() {
    super.initState();
    _loadUserPermissions();
  }

  void _loadUserPermissions() {
    try {
      final userStr = SharedPreferencesService.getUser();
      Map<String, dynamic> userObj = {};
      if (userStr != null && userStr.isNotEmpty) {
        try {
          userObj = jsonDecode(userStr);
        } catch (_) {}
      }

      _fullName =
          userObj['fullName'] ??
          userObj['FullName'] ??
          userObj['tenNV'] ??
          userObj['username'] ??
          'Người dùng';
      final rawRole =
          userObj['roleName'] ??
          userObj['RoleName'] ??
          userObj['role'] ??
          userObj['Role'] ??
          'Nhân viên';
      _roleName = rawRole.toString();

      // Đọc danh sách allowedModules từ Backend trả về
      List<String> allowedModules = [];
      final rawAllowed = userObj['allowedModules'] ?? userObj['AllowedModules'];
      if (rawAllowed is List) {
        // Parse and uppercase to match mobile app's masterMenuItems IDs
        allowedModules = rawAllowed
            .map((e) => e.toString().toUpperCase())
            .toList();

        // Map sub-modules to main tabs so the drawer displays the main tab
        if (allowedModules.contains('CATEGORIES') &&
            !allowedModules.contains('PRODUCTS')) {
          allowedModules.add('PRODUCTS');
        }
        if (allowedModules.contains('FLASHSALES') &&
            !allowedModules.contains('PROMOTIONS')) {
          allowedModules.add('PROMOTIONS');
        }
      }

      final roleLower = _roleName.toLowerCase();
      final isAdminRole =
          roleLower.contains('admin') ||
          roleLower.contains('quản trị') ||
          roleLower.contains('giám đốc') ||
          roleLower.contains('quản lý');

      // Các vai trò khác, kể cả quản lý (manager) KHÔNG ĐƯỢC phép truy cập sao lưu và phục hồi trừ khi là admin thực sự
      if (!roleLower.contains('admin') && !roleLower.contains('quản trị')) {
        allowedModules.remove('BACKUP_RESTORE');
      }

      // Nếu Backend không trả về hoặc mảng rỗng (ví dụ đăng nhập offline hoặc phiên bản cũ)
      // Ta tự động fallback gán các module mặc định theo vai trò gốc
      if (allowedModules.isEmpty) {
        if (isAdminRole) {
          allowedModules = [
            "DASHBOARD",
            "PRODUCTS",
            "CATEGORIES",
            "ORDERS",
            "CUSTOMERS",
            "SUPPLIERS",
            "PROMOTIONS",
            "FLASHSALES",
            "STOCK_ORDERS",
            "RETURNS",
            "INVENTORY",
            "PRICE_HISTORY",
            "DELIVERIES",
            "DEBTS",
            "REPORTS",
            "EMPLOYEES",
            "CHAT",
          ];
        } else if (roleLower.contains('bán hàng') || roleLower == 'sales') {
          allowedModules = [
            "PRODUCTS",
            "ORDERS",
            "CUSTOMERS",
            "PROMOTIONS",
            "CHAT",
          ];
        } else if (roleLower.contains('thủ kho') || roleLower == 'warehouse') {
          allowedModules = ["PRODUCTS", "STOCK_ORDERS", "INVENTORY", "RETURNS"];
        } else if (roleLower.contains('tài xế') ||
            roleLower == 'driver' ||
            roleLower == 'taixe') {
          allowedModules = ["DELIVERIES"];
        } else {
          allowedModules = ["PRODUCTS", "ORDERS", "CHAT"];
        }
      }

      // Bổ sung luôn luôn có tab Cài đặt
      if (!allowedModules.contains('SETTINGS')) {
        allowedModules.add('SETTINGS');
      }

      final isAdmin =
          roleLower.contains('admin') || roleLower.contains('quản trị');
      if (isAdmin) {
        allowedModules = ["CUSTOMERS", "EMPLOYEES", "SETTINGS"];
      }

      // Lọc danh sách menu hiển thị thực tế
      _userMenuItems = masterMenuItems
          .where((item) => allowedModules.contains(item['id']))
          .toList();

      if (_userMenuItems.isNotEmpty) {
        _appBarTitle = _userMenuItems[0]['title'];
      }
    } catch (e) {
      // Fallback an toàn nếu lỗi
      _userMenuItems = masterMenuItems
          .where(
            (item) => ['PRODUCTS', 'ORDERS', 'SETTINGS'].contains(item['id']),
          )
          .toList();
      if (_userMenuItems.isNotEmpty) _appBarTitle = _userMenuItems[0]['title'];
    }
  }

  void _onSelectItem(int index) {
    setState(() {
      _selectedIndex = index;
      _appBarTitle = _userMenuItems[index]['title'];
    });
    Navigator.pop(context); // Đóng Drawer
  }

  @override
  Widget build(BuildContext context) {
    if (_userMenuItems.isEmpty) {
      return Scaffold(
        appBar: const GradientAppBar(title: 'Lỗi Phân Quyền'),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.lock_outline, size: 64, color: AppColors.textHint),
              const SizedBox(height: 16),
              const Text(
                'Tài khoản chưa được cấp quyền truy cập.',
                style: TextStyle(fontSize: 16, color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
      );
    }

    final currentWidget = _userMenuItems[_selectedIndex]['widget'];
    final String initials = _fullName.isNotEmpty
        ? _fullName[0].toUpperCase()
        : '?';

    return Scaffold(
      appBar: GradientAppBar(
        title: _appBarTitle,
        actions: [
          ValueListenableBuilder<int>(
            valueListenable: PushNotificationService().unreadCount,
            builder: (context, count, child) {
              return Stack(
                alignment: Alignment.center,
                children: [
                  IconButton(
                    icon: const Icon(Icons.notifications),
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const NotificationScreen()),
                      ).then((_) {
                         PushNotificationService().fetchUnreadCount();
                      });
                    },
                  ),
                  if (count > 0)
                    Positioned(
                      right: 8,
                      top: 8,
                      child: Container(
                        padding: const EdgeInsets.all(2),
                        decoration: BoxDecoration(
                          color: AppColors.error,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        constraints: const BoxConstraints(
                          minWidth: 16,
                          minHeight: 16,
                        ),
                        child: Text(
                          '$count',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                ],
              );
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      drawer: Drawer(
        backgroundColor: Colors.white,
        child: Column(
          children: [
            // Header giống Web gradient
            Container(
              width: double.infinity,
              padding: EdgeInsets.only(
                top: MediaQuery.of(context).padding.top + 20,
                bottom: 20,
                left: 20,
                right: 20,
              ),
              decoration: const BoxDecoration(
                gradient: AppColors.primaryGradient,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CircleAvatar(
                    radius: 30,
                    backgroundColor: Colors.white.withValues(alpha: 0.25),
                    child: Text(
                      initials,
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    _fullName,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 17,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      _roleName,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            // Menu list
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                itemCount: _userMenuItems.length,
                itemBuilder: (context, index) {
                  final item = _userMenuItems[index];
                  final isSelected = index == _selectedIndex;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 2),
                    child: ListTile(
                      leading: Icon(
                        item['icon'],
                        size: 22,
                        color: isSelected
                            ? AppColors.primaryStart
                            : AppColors.textSecondary,
                      ),
                      title: Text(
                        item['title'],
                        style: TextStyle(
                          fontWeight: isSelected
                              ? FontWeight.w700
                              : FontWeight.w500,
                          color: isSelected
                              ? AppColors.primaryStart
                              : AppColors.textPrimary,
                          fontSize: 14,
                        ),
                      ),
                      selected: isSelected,
                      selectedTileColor: AppColors.drawerSelected,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 0,
                      ),
                      dense: true,
                      visualDensity: const VisualDensity(vertical: -1),
                      onTap: () => _onSelectItem(index),
                    ),
                  );
                },
              ),
            ),
            // Footer
            const Divider(height: 1, color: AppColors.divider),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Text(
                '© 2026 VLXD ERP v2.0',
                style: TextStyle(fontSize: 11, color: AppColors.textHint),
              ),
            ),
          ],
        ),
      ),
      body: currentWidget,
    );
  }
}

// ==========================================
// TAB CÀI ĐẶT
// ==========================================
class _DynamicProfileTab extends StatefulWidget {
  const _DynamicProfileTab();

  @override
  State<_DynamicProfileTab> createState() => _DynamicProfileTabState();
}

class _DynamicProfileTabState extends State<_DynamicProfileTab> {
  Map<String, dynamic> _userObj = {};
  String _roleName = 'Nhân viên';
  String _fullName = 'Người dùng';
  String _username = '';
  String _email = '';
  String _phone = '';
  bool _isAdmin = false;

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  void _loadUser() {
    try {
      final userStr = SharedPreferencesService.getUser();
      if (userStr != null && userStr.isNotEmpty) {
        _userObj = jsonDecode(userStr);
        _fullName =
            _userObj['fullName'] ??
            _userObj['FullName'] ??
            _userObj['username'] ??
            'Người dùng';
        _roleName =
            (_userObj['roleName'] ??
                    _userObj['RoleName'] ??
                    _userObj['role'] ??
                    'Nhân viên')
                .toString();
        _username = _userObj['username'] ?? _userObj['Username'] ?? '';
        _email = _userObj['email'] ?? _userObj['Email'] ?? '';
        _phone = _userObj['phoneNumber'] ?? _userObj['PhoneNumber'] ?? '';
        final roleLower = _roleName.toLowerCase();
        _isAdmin =
            roleLower.contains('admin') || roleLower.contains('quản trị');
      }
    } catch (_) {}
  }

  // ── Thông tin cá nhân dialog ──────────────────────────────────
  void _showPersonalInfo() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.person, color: AppColors.primaryStart),
            SizedBox(width: 8),
            Text(
              'Thông Tin Cá Nhân',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircleAvatar(
                radius: 36,
                backgroundColor: AppColors.primaryStart.withValues(alpha: 0.1),
                child: Icon(
                  Icons.person,
                  size: 40,
                  color: AppColors.primaryStart,
                ),
              ),
              const SizedBox(height: 16),
              _infoRow(Icons.badge_outlined, 'Họ và tên', _fullName),
              _infoRow(Icons.alternate_email, 'Tên đăng nhập', _username),
              _infoRow(Icons.work_outline, 'Vai trò', _roleName),
              if (_email.isNotEmpty)
                _infoRow(Icons.email_outlined, 'Email', _email),
              if (_phone.isNotEmpty)
                _infoRow(Icons.phone_outlined, 'Số điện thoại', _phone),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text(
              'ĐÓNG',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Colors.grey),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(fontSize: 11, color: Colors.grey),
                ),
                Text(
                  value,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Đổi mật khẩu dialog ──────────────────────────────────
  void _showChangePasswordDialog() {
    final formKey = GlobalKey<FormState>();
    final oldPwCtrl = TextEditingController();
    final newPwCtrl = TextEditingController();
    final confirmPwCtrl = TextEditingController();
    bool obscureOld = true;
    bool obscureNew = true;
    bool obscureConfirm = true;
    bool isSaving = false;

    final accountId = _userObj['id'] ?? _userObj['Id'];
    if (accountId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Không tìm thấy ID tài khoản. Vui lòng đăng nhập lại.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: const Row(
            children: [
              Icon(Icons.lock_reset, color: AppColors.primaryEnd),
              SizedBox(width: 8),
              Text(
                'Đổi Mật Khẩu',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
              ),
            ],
          ),
          content: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: oldPwCtrl,
                  obscureText: obscureOld,
                  decoration: InputDecoration(
                    labelText: 'Mật khẩu hiện tại',
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      icon: Icon(
                        obscureOld ? Icons.visibility_off : Icons.visibility,
                      ),
                      onPressed: () =>
                          setDialogState(() => obscureOld = !obscureOld),
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  validator: (v) => (v == null || v.isEmpty)
                      ? 'Vui lòng nhập mật khẩu cũ'
                      : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: newPwCtrl,
                  obscureText: obscureNew,
                  decoration: InputDecoration(
                    labelText: 'Mật khẩu mới',
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      icon: Icon(
                        obscureNew ? Icons.visibility_off : Icons.visibility,
                      ),
                      onPressed: () =>
                          setDialogState(() => obscureNew = !obscureNew),
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty)
                      return 'Vui lòng nhập mật khẩu mới';
                    if (v.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: confirmPwCtrl,
                  obscureText: obscureConfirm,
                  decoration: InputDecoration(
                    labelText: 'Xác nhận mật khẩu mới',
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      icon: Icon(
                        obscureConfirm
                            ? Icons.visibility_off
                            : Icons.visibility,
                      ),
                      onPressed: () => setDialogState(
                        () => obscureConfirm = !obscureConfirm,
                      ),
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty)
                      return 'Vui lòng xác nhận mật khẩu';
                    if (v != newPwCtrl.text)
                      return 'Mật khẩu xác nhận không khớp';
                    return null;
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: isSaving ? null : () => Navigator.pop(ctx),
              child: const Text('HỦY', style: TextStyle(color: Colors.grey)),
            ),
            ElevatedButton.icon(
              icon: isSaving
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2,
                      ),
                    )
                  : const Icon(Icons.check, size: 18),
              label: Text(
                isSaving ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.indigo,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              onPressed: isSaving
                  ? null
                  : () async {
                      if (!formKey.currentState!.validate()) return;
                      setDialogState(() => isSaving = true);
                      try {
                        final api = ApiService();
                        final res = await api.changePassword(
                          accountId is int
                              ? accountId
                              : int.parse(accountId.toString()),
                          oldPwCtrl.text.trim(),
                          newPwCtrl.text.trim(),
                        );
                        if (!ctx.mounted) return;
                        Navigator.pop(ctx);
                        if (res.statusCode == 200) {
                          if (!context.mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Row(
                                children: [
                                  Icon(Icons.check_circle, color: Colors.white),
                                  SizedBox(width: 8),
                                  Text('Đổi mật khẩu thành công!'),
                                ],
                              ),
                              backgroundColor: Colors.green,
                              duration: Duration(seconds: 3),
                            ),
                          );
                        }
                      } catch (e) {
                        if (!ctx.mounted) return;
                        setDialogState(() => isSaving = false);
                        String errMsg = 'Đổi mật khẩu thất bại.';
                        try {
                          final data = e.toString();
                          if (data.contains('Mật khẩu cũ không đúng'))
                            errMsg = 'Mật khẩu cũ không chính xác!';
                        } catch (_) {}
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(errMsg),
                            backgroundColor: Colors.red,
                          ),
                        );
                      }
                    },
            ),
          ],
        ),
      ),
    );
  }

  // ── Xem danh sách module được cấp quyền ──────────────────────
  void _showPermissionsList() {
    List<String> allowed = [];
    try {
      final rawAllowed =
          _userObj['allowedModules'] ?? _userObj['AllowedModules'];
      if (rawAllowed is List)
        allowed = rawAllowed.map((e) => e.toString()).toList();
    } catch (_) {}

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Danh sách Module được cấp'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: allowed.isEmpty
                ? [const Text('Sử dụng quyền mặc định theo vai trò.')]
                : allowed
                      .map(
                        (m) => ListTile(
                          dense: true,
                          leading: const Icon(Icons.check, color: Colors.green),
                          title: Text(
                            m,
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ),
                      )
                      .toList(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('ĐÓNG'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final String initials = _fullName.isNotEmpty
        ? _fullName[0].toUpperCase()
        : '?';
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20.0),
      child: Column(
        children: [
          const SizedBox(height: 20),
          // Avatar + tên
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: AppColors.primaryGradient,
            ),
            child: CircleAvatar(
              radius: 46,
              backgroundColor: Colors.white,
              child: Text(
                initials,
                style: const TextStyle(
                  fontSize: 36,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primaryStart,
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            _fullName,
            style: const TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 22,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
            decoration: BoxDecoration(
              color: AppColors.primaryStart.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              'Chức vụ: $_roleName',
              style: const TextStyle(
                color: AppColors.primaryStart,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const SizedBox(height: 32),

          // Menu card
          Card(
            child: Column(
              children: [
                _settingsTile(
                  icon: Icons.person_outline,
                  iconColor: AppColors.primaryStart,
                  title: 'Thông tin cá nhân',
                  subtitle: 'Xem họ tên, email, vai trò',
                  onTap: _showPersonalInfo,
                ),
                const Divider(height: 1, indent: 60),
                _settingsTile(
                  icon: Icons.lock_reset,
                  iconColor: AppColors.primaryEnd,
                  title: 'Đổi mật khẩu',
                  subtitle: 'Thay đổi mật khẩu đăng nhập',
                  onTap: _showChangePasswordDialog,
                ),
                const Divider(height: 1, indent: 60),
                _settingsTile(
                  icon: Icons.security_outlined,
                  iconColor: AppColors.success,
                  title: 'Kiểm tra Phân Quyền',
                  subtitle: 'Xem danh sách Module được cấp',
                  onTap: _showPermissionsList,
                ),
                if (_isAdmin) ...[
                  const Divider(height: 1, indent: 60),
                  _settingsTile(
                    icon: Icons.backup_outlined,
                    iconColor: AppColors.info,
                    title: 'Sao lưu & Phục hồi',
                    subtitle: 'Tạo bản sao lưu và phục hồi hệ thống',
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => Scaffold(
                            appBar: const GradientAppBar(
                              title: 'Sao Lưu & Phục Hồi',
                            ),
                            body: const BackupRestoreTab(),
                          ),
                        ),
                      );
                    },
                  ),
                ],
              ],
            ),
          ),

          const SizedBox(height: 32),

          // Đăng xuất
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () {
                SharedPreferencesService.logout();
                Navigator.of(context).pushReplacementNamed('/login');
              },
              icon: const Icon(Icons.logout),
              label: const Text(
                'ĐĂNG XUẤT',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.error,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _settingsTile({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: iconColor.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: iconColor, size: 22),
      ),
      title: Text(
        title,
        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
      ),
      subtitle: Text(
        subtitle,
        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
      ),
      trailing: const Icon(
        Icons.arrow_forward_ios,
        size: 14,
        color: AppColors.textHint,
      ),
      onTap: onTap,
    );
  }
}
