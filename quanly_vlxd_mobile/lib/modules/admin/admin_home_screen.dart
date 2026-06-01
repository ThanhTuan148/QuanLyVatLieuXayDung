import 'package:flutter/material.dart';
import '../sales/customers_tab.dart';

class AdminHomeScreen extends StatefulWidget {
  const AdminHomeScreen({super.key});

  @override
  State<AdminHomeScreen> createState() => _AdminHomeScreenState();
}

class _AdminHomeScreenState extends State<AdminHomeScreen> {
  int _selectedIndex = 0;

  static const List<Widget> _pages = <Widget>[
    _EmployeesAdminTab(),
    CustomersTab(),
    _SettingsAdminTab(),
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
          'Quản Trị Hệ Thống (Admin)',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.blueGrey.shade800,
      ),
      body: _pages.elementAt(_selectedIndex),
      bottomNavigationBar: BottomNavigationBar(
        items: const <BottomNavigationBarItem>[
          BottomNavigationBarItem(
            icon: Icon(Icons.manage_accounts_outlined),
            activeIcon: Icon(Icons.manage_accounts),
            label: 'Nhân viên',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.people_outline),
            activeIcon: Icon(Icons.people),
            label: 'Khách hàng',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.settings_outlined),
            activeIcon: Icon(Icons.settings),
            label: 'Cài đặt',
          ),
        ],
        currentIndex: _selectedIndex,
        selectedItemColor: Colors.blueGrey.shade800,
        unselectedItemColor: Colors.grey,
        onTap: _onItemTapped,
      ),
    );
  }
}

// ==========================================
// TAB 1: QUẢN LÝ NHÂN VIÊN & PHÂN QUYỀN
// ==========================================
class _EmployeesAdminTab extends StatelessWidget {
  const _EmployeesAdminTab();

  @override
  Widget build(BuildContext context) {
    final List<Map<String, dynamic>> mockEmployees = [
      {
        "id": "NV001",
        "name": "Nguyễn Văn A",
        "role": "Nhân viên Bán hàng",
        "active": true,
      },
      {
        "id": "NV002",
        "name": "Trần Thị B",
        "role": "Nhân viên Kho",
        "active": true,
      },
      {"id": "NV003", "name": "Lê Hoàng C", "role": "Tài xế", "active": true},
      {"id": "NV004", "name": "Phạm Thị D", "role": "Quản lý", "active": true},
    ];

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Danh sách nhân sự (${mockEmployees.length})',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                ),
              ),
              ElevatedButton.icon(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Mở form tạo tài khoản nhân viên mới'),
                    ),
                  );
                },
                icon: const Icon(Icons.person_add),
                label: const Text('THÊM MỚI'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blueGrey.shade800,
                  foregroundColor: Colors.white,
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: mockEmployees.length,
            itemBuilder: (context, index) {
              final emp = mockEmployees[index];
              return Card(
                elevation: 2,
                margin: const EdgeInsets.only(bottom: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                child: ListTile(
                  contentPadding: const EdgeInsets.all(16),
                  leading: CircleAvatar(
                    backgroundColor: Colors.blueGrey.shade100,
                    child: const Icon(Icons.person, color: Colors.blueGrey),
                  ),
                  title: Text(
                    emp['name'],
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 4),
                      Text('Mã NV: ${emp['id']} | Vai trò: ${emp['role']}'),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          OutlinedButton.icon(
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    'Mở bảng phân quyền chi tiết cho ${emp['name']}',
                                  ),
                                ),
                              );
                            },
                            icon: const Icon(
                              Icons.security,
                              size: 16,
                              color: Colors.blue,
                            ),
                            label: const Text(
                              'Phân quyền',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.blue,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          OutlinedButton.icon(
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    'Mở popup đổi vai trò cho ${emp['name']}',
                                  ),
                                ),
                              );
                            },
                            icon: const Icon(
                              Icons.swap_horiz,
                              size: 16,
                              color: Colors.orange,
                            ),
                            label: const Text(
                              'Đổi vai trò',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.orange,
                              ),
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
        ),
      ],
    );
  }
}

// (Đã chuyển _CustomersAdminTab sang file customers_tab.dart dùng chung)

// ==========================================
// TAB 3: CÀI ĐẶT HỆ THỐNG & ĐĂNG XUẤT
// ==========================================
class _SettingsAdminTab extends StatelessWidget {
  const _SettingsAdminTab();

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Cấu hình & Bảo mật',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
          ),
          const SizedBox(height: 16),
          Card(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.security),
                  title: const Text('Cấu hình bảo mật hệ thống'),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                  onTap: () {},
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.backup),
                  title: const Text('Sao lưu & Phục hồi dữ liệu'),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                  onTap: () {},
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.history),
                  title: const Text('Nhật ký hoạt động (System Audit Log)'),
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
                'ĐĂNG XUẤT TÀI KHOẢN ADMIN',
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
