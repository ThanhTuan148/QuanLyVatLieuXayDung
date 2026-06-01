import 'package:flutter/material.dart';
import 'inventory_tab.dart';
import 'stock_orders_tab.dart';

class WarehouseHomeScreen extends StatefulWidget {
  const WarehouseHomeScreen({super.key});

  @override
  State<WarehouseHomeScreen> createState() => _WarehouseHomeScreenState();
}

class _WarehouseHomeScreenState extends State<WarehouseHomeScreen> {
  int _selectedIndex = 0;

  static const List<Widget> _pages = <Widget>[
    InventoryTab(), // 1. Tồn kho & Lịch sử giá
    StockOrdersTab(), // 2. Lệnh xuất/nhập & Đổi trả
    _SuppliersWarehouseTab(), // 3. Nhà cung cấp
    _WarehouseProfileTab(), // 4. Cá nhân
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
        title: const Text(
          'Quản Lý Kho Hàng',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.orange.shade800,
        elevation: 2,
      ),
      body: _pages.elementAt(_selectedIndex),
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        items: const <BottomNavigationBarItem>[
          BottomNavigationBarItem(
            icon: Icon(Icons.inventory_2_outlined),
            activeIcon: Icon(Icons.inventory_2),
            label: 'Tồn kho',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.swap_horiz_outlined),
            activeIcon: Icon(Icons.swap_horiz),
            label: 'Xuất/Nhập',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.business_outlined),
            activeIcon: Icon(Icons.business),
            label: 'Nhà cung cấp',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'Cá nhân',
          ),
        ],
        currentIndex: _selectedIndex,
        selectedItemColor: Colors.orange.shade800,
        unselectedItemColor: Colors.grey.shade600,
        selectedLabelStyle: const TextStyle(
          fontWeight: FontWeight.bold,
          fontSize: 12,
        ),
        unselectedLabelStyle: const TextStyle(fontSize: 11),
        onTap: _onItemTapped,
      ),
    );
  }
}

// ==========================================
// TAB 3: QUẢN LÝ NHÀ CUNG CẤP (WAREHOUSE)
// ==========================================
class _SuppliersWarehouseTab extends StatelessWidget {
  const _SuppliersWarehouseTab();

  @override
  Widget build(BuildContext context) {
    final List<Map<String, dynamic>> mockSuppliers = [
      {
        "name": "Công ty Cổ phần Xi măng Hà Tiên",
        "phone": "028.38123456",
        "category": "Xi măng",
        "address": "Quận 1, TP.HCM",
      },
      {
        "name": "Tập đoàn Thép Hòa Phát",
        "phone": "024.62848666",
        "category": "Thép xây dựng",
        "address": "Hưng Yên",
      },
      {
        "name": "Nhà máy Gạch Tuynel Bình Dương",
        "phone": "0274.3555666",
        "category": "Gạch ngói",
        "address": "Bình Dương",
      },
      {
        "name": "Mỏ đá Hóa An",
        "phone": "0251.3955777",
        "category": "Cát, Đá",
        "address": "Đồng Nai",
      },
    ];

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Nhà cung ứng (${mockSuppliers.length})',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                ),
              ),
              ElevatedButton.icon(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Mở popup thêm nhà cung cấp mới'),
                    ),
                  );
                },
                icon: const Icon(Icons.add_business),
                label: const Text('THÊM'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orange.shade800,
                  foregroundColor: Colors.white,
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: mockSuppliers.length,
            itemBuilder: (context, index) {
              final s = mockSuppliers[index];
              return Card(
                elevation: 2,
                margin: const EdgeInsets.only(bottom: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                child: ListTile(
                  contentPadding: const EdgeInsets.all(16),
                  leading: CircleAvatar(
                    backgroundColor: Colors.orange.shade100,
                    child: const Icon(Icons.business, color: Colors.orange),
                  ),
                  title: Text(
                    s['name'],
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 4),
                      Text('Ngành hàng: ${s['category']} | SĐT: ${s['phone']}'),
                      const SizedBox(height: 4),
                      Text(
                        'Địa chỉ: ${s['address']}',
                        style: TextStyle(color: Colors.grey.shade700),
                      ),
                    ],
                  ),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          'Xem hợp đồng & lịch sử nhập hàng từ ${s['name']}',
                        ),
                      ),
                    );
                  },
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

// ==========================================
// TAB 4: CÁ NHÂN & ĐĂNG XUẤT (WAREHOUSE)
// ==========================================
class _WarehouseProfileTab extends StatelessWidget {
  const _WarehouseProfileTab();

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        children: [
          const SizedBox(height: 16),
          CircleAvatar(
            radius: 48,
            backgroundColor: Colors.orange.shade200,
            child: const Icon(Icons.person, size: 48, color: Colors.orange),
          ),
          const SizedBox(height: 16),
          const Text(
            'Trang Cá Nhân Nhân Viên Kho',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20),
          ),
          const Text(
            'Vai trò: Nhân viên Kho (Warehouse)',
            style: TextStyle(color: Colors.grey),
          ),
          const SizedBox(height: 32),
          Card(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.person),
                  title: const Text('Thông tin cá nhân'),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                  onTap: () {},
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.lock),
                  title: const Text('Đổi mật khẩu'),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                  onTap: () {},
                ),
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
              label: const Text(
                'ĐĂNG XUẤT',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red.shade600,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
