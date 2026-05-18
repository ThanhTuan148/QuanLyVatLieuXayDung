import 'package:flutter/material.dart';
import 'orders_tab.dart';
import 'products_tab.dart';
import 'customers_tab.dart';
import 'chat_tab.dart';

class SalesHomeScreen extends StatefulWidget {
  const SalesHomeScreen({super.key});

  @override
  State<SalesHomeScreen> createState() => _SalesHomeScreenState();
}

class _SalesHomeScreenState extends State<SalesHomeScreen> {
  int _selectedIndex = 0;

  static const List<Widget> _pages = <Widget>[
    OrdersTab(), // 1. Đơn hàng & Công nợ
    ProductsTab(), // 2. Sản phẩm & Khuyến mãi (Chỉ xem)
    CustomersTab(), // 3. Khách hàng
    ChatTab(), // 4. Chat trực tuyến
    _SalesProfileTab(), // 5. Cá nhân
  ];

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Nhân Viên Bán Hàng (Sales)', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.blue.shade700,
        elevation: 2,
      ),
      body: _pages.elementAt(_selectedIndex),
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        items: const <BottomNavigationBarItem>[
          BottomNavigationBarItem(
            icon: Icon(Icons.shopping_cart_outlined),
            activeIcon: Icon(Icons.shopping_cart),
            label: 'Đơn hàng',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.category_outlined),
            activeIcon: Icon(Icons.category),
            label: 'Sản phẩm',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.people_outline),
            activeIcon: Icon(Icons.people),
            label: 'Khách hàng',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.chat_outlined),
            activeIcon: Icon(Icons.chat),
            label: 'Chat',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'Cá nhân',
          ),
        ],
        currentIndex: _selectedIndex,
        selectedItemColor: Colors.blue.shade700,
        unselectedItemColor: Colors.grey.shade600,
        selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
        unselectedLabelStyle: const TextStyle(fontSize: 11),
        onTap: _onItemTapped,
      ),
    );
  }
}

// (Đã chuyển _CustomersSalesTab sang file customers_tab.dart)

// (Đã chuyển _ChatSupportSalesTab sang file chat_tab.dart)

// ==========================================
// TAB 5: CÁ NHÂN & ĐĂNG XUẤT (SALES)
// ==========================================
class _SalesProfileTab extends StatelessWidget {
  const _SalesProfileTab();

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        children: [
          const SizedBox(height: 16),
          CircleAvatar(radius: 48, backgroundColor: Colors.blue.shade200, child: const Icon(Icons.person, size: 48, color: Colors.blue)),
          const SizedBox(height: 16),
          const Text('Trang Cá Nhân Nhân Viên Bán Hàng', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
          const Text('Vai trò: Nhân viên Bán hàng (Sales)', style: TextStyle(color: Colors.grey)),
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
