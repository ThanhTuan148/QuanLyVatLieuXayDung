import 'package:flutter/material.dart';
import 'deliveries_tab.dart';
import '../warehouse/inventory_tab.dart';

class DriverHomeScreen extends StatefulWidget {
  const DriverHomeScreen({super.key});

  @override
  State<DriverHomeScreen> createState() => _DriverHomeScreenState();
}

class _DriverHomeScreenState extends State<DriverHomeScreen> {
  int _selectedIndex = 0;

  static const List<Widget> _pages = <Widget>[
    DeliveriesTab(), // 1. Chuyến đi giao hàng & COD
    InventoryTab(), // 2. Tra cứu kho hàng (Chỉ xem)
    _DriverProfileTab(), // 3. Cài đặt cá nhân
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
        title: const Text('Tài Xế Giao Hàng (Driver)', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.teal.shade700,
        elevation: 2,
      ),
      body: _pages.elementAt(_selectedIndex),
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        items: const <BottomNavigationBarItem>[
          BottomNavigationBarItem(
            icon: Icon(Icons.local_shipping_outlined),
            activeIcon: Icon(Icons.local_shipping),
            label: 'Chuyến đi',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.inventory_2_outlined),
            activeIcon: Icon(Icons.inventory_2),
            label: 'Tra cứu kho',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.settings_outlined),
            activeIcon: Icon(Icons.settings),
            label: 'Cài đặt',
          ),
        ],
        currentIndex: _selectedIndex,
        selectedItemColor: Colors.teal.shade700,
        unselectedItemColor: Colors.grey.shade600,
        selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
        unselectedLabelStyle: const TextStyle(fontSize: 11),
        onTap: _onItemTapped,
      ),
    );
  }
}

// ==========================================
// TAB 3: CÁ NHÂN & CÀI ĐẶT (DRIVER)
// ==========================================
class _DriverProfileTab extends StatelessWidget {
  const _DriverProfileTab();

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        children: [
          const SizedBox(height: 16),
          CircleAvatar(radius: 48, backgroundColor: Colors.teal.shade200, child: const Icon(Icons.person, size: 48, color: Colors.teal)),
          const SizedBox(height: 16),
          const Text('Trang Cá Nhân Tài Xế', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
          const Text('Vai trò: Tài xế / Giao hàng vận chuyển', style: TextStyle(color: Colors.grey)),
          const SizedBox(height: 32),
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Column(
              children: [
                ListTile(leading: const Icon(Icons.person), title: const Text('Thông tin bằng lái & phương tiện'), trailing: const Icon(Icons.arrow_forward_ios, size: 16), onTap: () {}),
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
