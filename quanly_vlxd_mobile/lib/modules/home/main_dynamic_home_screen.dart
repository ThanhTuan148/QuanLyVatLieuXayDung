import 'dart:convert';
import 'package:flutter/material.dart';
import '../../services/shared_preferences_service.dart';

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
    {'id': 'DASHBOARD', 'title': 'Tổng quan', 'icon': Icons.dashboard, 'widget': const DashboardTab()},
    {'id': 'PRODUCTS', 'title': 'Sản Phẩm', 'icon': Icons.inventory_2, 'widget': const ProductsTab()},
    {'id': 'ORDERS', 'title': 'Đơn Hàng', 'icon': Icons.shopping_cart, 'widget': const OrdersTab()},
    {'id': 'CUSTOMERS', 'title': 'Khách Hàng', 'icon': Icons.people, 'widget': const CustomersTab()},
    {'id': 'SUPPLIERS', 'title': 'Nhà Cung Cấp', 'icon': Icons.business, 'widget': const SuppliersTab()},
    {'id': 'PROMOTIONS', 'title': 'Khuyến Mãi', 'icon': Icons.local_offer, 'widget': const PromotionsTab()},
    {'id': 'STOCK_ORDERS', 'title': 'Nhập Hàng', 'icon': Icons.move_to_inbox, 'widget': const StockOrdersTab()},
    {'id': 'RETURNS', 'title': 'Đổi / Trả', 'icon': Icons.assignment_return, 'widget': const ReturnsTab()},
    {'id': 'INVENTORY', 'title': 'Kho Hàng', 'icon': Icons.warehouse, 'widget': const InventoryTab()},
    {'id': 'PRICE_HISTORY', 'title': 'Lịch Sử Giá', 'icon': Icons.timeline, 'widget': const PriceHistoryTab()},
    {'id': 'DELIVERIES', 'title': 'Giao Hàng', 'icon': Icons.local_shipping, 'widget': const DeliveriesTab()},
    {'id': 'DEBTS', 'title': 'Công Nợ', 'icon': Icons.account_balance_wallet, 'widget': const DebtsTab()},
    {'id': 'REPORTS', 'title': 'Báo Cáo', 'icon': Icons.bar_chart, 'widget': const ReportsTab()},
    {'id': 'EMPLOYEES', 'title': 'Nhân Viên', 'icon': Icons.badge, 'widget': const EmployeesTab()},
    {'id': 'CHAT', 'title': 'Hỗ trợ Chat', 'icon': Icons.chat, 'widget': const ChatTab()},
    {'id': 'SETTINGS', 'title': 'Cài Đặt', 'icon': Icons.settings, 'widget': const _DynamicProfileTab()},
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

      _fullName = userObj['fullName'] ?? userObj['FullName'] ?? userObj['tenNV'] ?? userObj['username'] ?? 'Người dùng';
      final rawRole = userObj['roleName'] ?? userObj['RoleName'] ?? userObj['role'] ?? userObj['Role'] ?? 'Nhân viên';
      _roleName = rawRole.toString();

      // Đọc danh sách allowedModules từ Backend trả về
      List<String> allowedModules = [];
      final rawAllowed = userObj['allowedModules'] ?? userObj['AllowedModules'];
      if (rawAllowed is List) {
        allowedModules = rawAllowed.map((e) => e.toString()).toList();
      }

      final roleLower = _roleName.toLowerCase();
      final isAdminRole = roleLower.contains('admin') || roleLower.contains('quản trị');

      if (isAdminRole) {
        // Admin chỉ được truy cập quản lý khách hàng, quản lý Nhân viên, cài đặt
        allowedModules = ["CUSTOMERS", "EMPLOYEES", "SETTINGS"];
      } else {
        // Các vai trò khác, kể cả quản lý (manager) KHÔNG ĐƯỢC phép truy cập sao lưu và phục hồi
        allowedModules.remove('BACKUP_RESTORE');

        // Nếu Backend không trả về hoặc mảng rỗng (ví dụ đăng nhập offline hoặc phiên bản cũ)
        // Ta tự động fallback gán các module mặc định theo vai trò gốc
        if (allowedModules.isEmpty) {
          if (roleLower.contains('quản lý') || roleLower.contains('manager')) {
            allowedModules = ["DASHBOARD", "PRODUCTS", "ORDERS", "CUSTOMERS", "SUPPLIERS", "PROMOTIONS", "STOCK_ORDERS", "RETURNS", "INVENTORY", "PRICE_HISTORY", "DELIVERIES", "DEBTS", "REPORTS", "EMPLOYEES", "CHAT"];
          } else if (roleLower.contains('bán hàng') || roleLower == 'sales') {
            allowedModules = ["PRODUCTS", "ORDERS", "CUSTOMERS", "PROMOTIONS", "CHAT"];
          } else if (roleLower.contains('thủ kho') || roleLower == 'warehouse') {
            allowedModules = ["PRODUCTS", "STOCK_ORDERS", "INVENTORY", "RETURNS"];
          } else if (roleLower.contains('tài xế') || roleLower == 'driver' || roleLower == 'taixe') {
            allowedModules = ["DELIVERIES"];
          } else {
            allowedModules = ["PRODUCTS", "ORDERS", "CHAT"];
          }
        }
      }

      // Bổ sung luôn luôn có tab Cài đặt
      if (!allowedModules.contains('SETTINGS')) {
        allowedModules.add('SETTINGS');
      }

      // Lọc danh sách menu hiển thị thực tế
      _userMenuItems = masterMenuItems.where((item) => allowedModules.contains(item['id'])).toList();

      if (_userMenuItems.isNotEmpty) {
        _appBarTitle = _userMenuItems[0]['title'];
      }
    } catch (e) {
      // Fallback an toàn nếu lỗi
      _userMenuItems = masterMenuItems.where((item) => ['PRODUCTS', 'ORDERS', 'SETTINGS'].contains(item['id'])).toList();
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
        appBar: AppBar(title: const Text('Lỗi Phân Quyền')),
        body: const Center(child: Text('Tài khoản của bạn chưa được cấp quyền truy cập chức năng nào.')),
      );
    }

    final currentWidget = _userMenuItems[_selectedIndex]['widget'];

    return Scaffold(
      appBar: AppBar(
        title: Text(_appBarTitle, style: const TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.blue.shade800,
        elevation: 2,
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline),
            tooltip: 'Thêm mới (CRUD)',
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Tính năng Thêm/Xóa/Sửa đang được cập nhật form chi tiết!')),
              );
            },
          )
        ],
      ),
      drawer: Drawer(
        child: Column(
          children: [
            UserAccountsDrawerHeader(
              decoration: BoxDecoration(color: Colors.blue.shade800),
              accountName: Text(_fullName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              accountEmail: Text('Vai trò: $_roleName', style: const TextStyle(color: Colors.white70)),
              currentAccountPicture: CircleAvatar(
                backgroundColor: Colors.white,
                child: Icon(Icons.security, color: Colors.blue.shade800, size: 36),
              ),
            ),
            Expanded(
              child: ListView.builder(
                padding: EdgeInsets.zero,
                itemCount: _userMenuItems.length,
                itemBuilder: (context, index) {
                  final item = _userMenuItems[index];
                  final isSelected = index == _selectedIndex;
                  return ListTile(
                    leading: Icon(
                      item['icon'],
                      color: isSelected ? Colors.blue.shade800 : Colors.grey.shade700,
                    ),
                    title: Text(
                      item['title'],
                      style: TextStyle(
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        color: isSelected ? Colors.blue.shade800 : Colors.black87,
                      ),
                    ),
                    selected: isSelected,
                    selectedTileColor: Colors.blue.shade50,
                    onTap: () => _onSelectItem(index),
                  );
                },
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
class _DynamicProfileTab extends StatelessWidget {
  const _DynamicProfileTab();

  @override
  Widget build(BuildContext context) {
    String roleName = 'Nhân viên';
    String fullName = 'Người dùng';
    try {
      final userStr = SharedPreferencesService.getUser();
      if (userStr != null && userStr.isNotEmpty) {
        final userObj = jsonDecode(userStr);
        fullName = userObj['fullName'] ?? userObj['FullName'] ?? userObj['username'] ?? 'Người dùng';
        roleName = (userObj['roleName'] ?? userObj['RoleName'] ?? userObj['role'] ?? 'Nhân viên').toString();
      }
    } catch (_) {}

    final roleLower = roleName.toLowerCase();
    final isAdmin = roleLower.contains('admin') || roleLower.contains('quản trị');

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        children: [
          const SizedBox(height: 16),
          CircleAvatar(radius: 48, backgroundColor: Colors.blue.shade100, child: Icon(Icons.person, size: 48, color: Colors.blue.shade800)),
          const SizedBox(height: 16),
          Text(fullName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
          const SizedBox(height: 4),
          Text('Chức vụ: $roleName', style: const TextStyle(color: Colors.grey, fontSize: 16)),
          const SizedBox(height: 32),
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Column(
              children: [
                ListTile(leading: const Icon(Icons.person), title: const Text('Thông tin cá nhân'), trailing: const Icon(Icons.arrow_forward_ios, size: 16), onTap: () {}),
                const Divider(height: 1),
                ListTile(leading: const Icon(Icons.lock), title: const Text('Đổi mật khẩu'), trailing: const Icon(Icons.arrow_forward_ios, size: 16), onTap: () {}),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.security, color: Colors.green),
                  title: const Text('Kiểm tra Phân Quyền Động'),
                  subtitle: const Text('Xem danh sách Module được cấp'),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                  onTap: () {
                    showDialog(
                      context: context,
                      builder: (context) {
                        List<String> allowed = [];
                        try {
                          final userStr = SharedPreferencesService.getUser();
                          if (userStr != null && userStr.isNotEmpty) {
                            final userObj = jsonDecode(userStr);
                            final rawAllowed = userObj['allowedModules'] ?? userObj['AllowedModules'];
                            if (rawAllowed is List) allowed = rawAllowed.map((e) => e.toString()).toList();
                          }
                        } catch (_) {}

                        return AlertDialog(
                          title: const Text('Danh sách Module được cấp'),
                          content: SingleChildScrollView(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: allowed.isEmpty
                                  ? [const Text('Sử dụng quyền mặc định theo vai trò.')]
                                  : allowed.map((m) => ListTile(dense: true, leading: const Icon(Icons.check, color: Colors.green), title: Text(m, style: const TextStyle(fontWeight: FontWeight.bold)))).toList(),
                            ),
                          ),
                          actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('ĐÓNG'))],
                        );
                      },
                    );
                  },
                ),
                if (isAdmin) ...[
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.backup, color: Colors.blueGrey),
                    title: const Text('Sao lưu & Phục hồi dữ liệu'),
                    subtitle: const Text('Tạo bản sao lưu và phục hồi hệ thống'),
                    trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => Scaffold(
                            appBar: AppBar(
                              title: const Text('Sao Lưu & Phục Hồi Dữ Liệu'),
                              backgroundColor: Colors.blueGrey.shade800,
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
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () {
                SharedPreferencesService.logout();
                Navigator.of(context).pushReplacementNamed('/login');
              },
              icon: const Icon(Icons.logout),
              label: const Text('ĐĂNG XUẤT', style: TextStyle(fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red.shade600, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 16)),
            ),
          )
        ],
      ),
    );
  }
}
