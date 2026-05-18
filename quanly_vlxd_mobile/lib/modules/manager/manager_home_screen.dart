import 'package:flutter/material.dart';
import '../sales/dashboard_tab.dart'; 
import '../sales/products_tab.dart';
import '../sales/orders_tab.dart';
import '../sales/customers_tab.dart';
import 'suppliers_tab.dart';
import 'promotions_tab.dart';
import '../warehouse/stock_orders_tab.dart';
import 'returns_tab.dart';
import '../warehouse/inventory_tab.dart';
import '../driver/deliveries_tab.dart';
import 'debts_tab.dart';
import '../admin/employees_tab.dart';
import '../sales/chat_tab.dart';
import 'approvals_tab.dart';
import 'price_history_tab.dart';
import 'reports_tab.dart';

class ManagerHomeScreen extends StatefulWidget {
  const ManagerHomeScreen({super.key});

  @override
  State<ManagerHomeScreen> createState() => _ManagerHomeScreenState();
}

class _ManagerHomeScreenState extends State<ManagerHomeScreen> {
  int _selectedIndex = 0;
  String _appBarTitle = 'Tổng quan';

  // Định nghĩa danh sách các chức năng (y chang Web)
  final List<Map<String, dynamic>> _menuItems = [
    {'title': 'Tổng quan', 'icon': Icons.dashboard, 'widget': const DashboardTab()},
    {'title': 'Sản Phẩm', 'icon': Icons.inventory_2, 'widget': const ProductsTab()},
    {'title': 'Đơn Hàng', 'icon': Icons.shopping_cart, 'widget': const OrdersTab()},
    {'title': 'Khách Hàng', 'icon': Icons.people, 'widget': const CustomersTab()},
    {'title': 'Nhà Cung Cấp', 'icon': Icons.business, 'widget': const SuppliersTab()},
    {'title': 'Khuyến Mãi', 'icon': Icons.local_offer, 'widget': const PromotionsTab()},
    {'title': 'Nhập Hàng', 'icon': Icons.move_to_inbox, 'widget': const StockOrdersTab()},
    {'title': 'Đổi / Trả', 'icon': Icons.assignment_return, 'widget': const ReturnsTab()},
    {'title': 'Kho Hàng', 'icon': Icons.warehouse, 'widget': const InventoryTab()},
    {'title': 'Lịch Sử Giá', 'icon': Icons.timeline, 'widget': const PriceHistoryTab()},
    {'title': 'Giao Hàng', 'icon': Icons.local_shipping, 'widget': const DeliveriesTab()},
    {'title': 'Công Nợ', 'icon': Icons.account_balance_wallet, 'widget': const DebtsTab()},
    {'title': 'Báo Cáo', 'icon': Icons.bar_chart, 'widget': const ReportsTab()},
    {'title': 'Nhân Viên', 'icon': Icons.badge, 'widget': const EmployeesTab()},
    {'title': 'Hỗ trợ Chat', 'icon': Icons.chat, 'widget': const ChatTab()},
    {'title': 'Cài Đặt', 'icon': Icons.settings, 'widget': const _ManagerProfileTab()},
  ];

  void _onSelectItem(int index) {
    setState(() {
      _selectedIndex = index;
      _appBarTitle = _menuItems[index]['title'];
    });
    Navigator.pop(context); // Đóng Drawer
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_appBarTitle, style: const TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.purple.shade800,
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
              decoration: BoxDecoration(color: Colors.purple.shade800),
              accountName: const Text('Tài Khoản Quản Lý', style: TextStyle(fontWeight: FontWeight.bold)),
              accountEmail: const Text('Giám đốc điều hành'),
              currentAccountPicture: const CircleAvatar(
                backgroundColor: Colors.white,
                child: Icon(Icons.admin_panel_settings, color: Colors.purple, size: 40),
              ),
            ),
            Expanded(
              child: ListView.builder(
                padding: EdgeInsets.zero,
                itemCount: _menuItems.length,
                itemBuilder: (context, index) {
                  final isSelected = index == _selectedIndex;
                  return ListTile(
                    leading: Icon(
                      _menuItems[index]['icon'],
                      color: isSelected ? Colors.purple.shade800 : Colors.grey.shade700,
                    ),
                    title: Text(
                      _menuItems[index]['title'],
                      style: TextStyle(
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        color: isSelected ? Colors.purple.shade800 : Colors.black87,
                      ),
                    ),
                    selected: isSelected,
                    selectedTileColor: Colors.purple.shade50,
                    onTap: () => _onSelectItem(index),
                  );
                },
              ),
            ),
          ],
        ),
      ),
      body: _menuItems[_selectedIndex]['widget'],
    );
  }
}

// ==========================================
// TAB CÀI ĐẶT
// ==========================================
class _ManagerProfileTab extends StatelessWidget {
  const _ManagerProfileTab();

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        children: [
          const SizedBox(height: 16),
          CircleAvatar(radius: 48, backgroundColor: Colors.purple.shade200, child: const Icon(Icons.admin_panel_settings, size: 48, color: Colors.purple)),
          const SizedBox(height: 16),
          const Text('Trang Cá Nhân Quản Lý', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
          const SizedBox(height: 32),
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Column(
              children: [
                ListTile(leading: const Icon(Icons.person), title: const Text('Thông tin cá nhân'), trailing: const Icon(Icons.arrow_forward_ios, size: 16), onTap: () {}),
                const Divider(height: 1),
                ListTile(leading: const Icon(Icons.lock), title: const Text('Đổi mật khẩu'), trailing: const Icon(Icons.arrow_forward_ios, size: 16), onTap: () {}),
              ],
            ),
          ),
          const SizedBox(height: 32),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () {
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
