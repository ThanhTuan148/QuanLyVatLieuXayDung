import 'package:flutter/material.dart';
import '../../services/api_service.dart';

class EmployeesTab extends StatefulWidget {
  const EmployeesTab({super.key});

  @override
  State<EmployeesTab> createState() => _EmployeesTabState();
}

class _EmployeesTabState extends State<EmployeesTab> {
  final ApiService _apiService = ApiService();
  List<dynamic> _employees = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchEmployees();
  }

  Future<void> _fetchEmployees() async {
    try {
      final response = await _apiService.getEmployees();
      if (mounted) {
        setState(() {
          _employees = response.data is List ? response.data : [];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    if (_employees.isEmpty) return const Center(child: Text('Không có dữ liệu nhân viên'));

    return ListView.builder(
      padding: const EdgeInsets.all(8),
      itemCount: _employees.length,
      itemBuilder: (context, index) {
        final e = _employees[index];
        return Card(
          child: ListTile(
            leading: const CircleAvatar(backgroundColor: Colors.indigo, child: Icon(Icons.person, color: Colors.white)),
            title: Text(e['tenNV'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Text('Vai trò: ${e['vaiTro'] ?? e['chucVu'] ?? ''} | SĐT: ${e['sdt'] ?? ''}'),
            trailing: Icon(e['trangThai'] == 'Đang làm việc' || e['trangThai'] == 'Hoạt động' ? Icons.check_circle : Icons.cancel, color: e['trangThai'] == 'Đang làm việc' || e['trangThai'] == 'Hoạt động' ? Colors.green : Colors.red),
          ),
        );
      },
    );
  }
}
