import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';

class CustomersTab extends StatefulWidget {
  const CustomersTab({super.key});

  @override
  State<CustomersTab> createState() => _CustomersTabState();
}

class _CustomersTabState extends State<CustomersTab> {
  final ApiService _apiService = ApiService();
  List<dynamic> _customers = [];
  bool _isLoading = true;
  String? _error;

  final NumberFormat _currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');

  @override
  void initState() {
    super.initState();
    _fetchCustomers();
  }

  Future<void> _fetchCustomers() async {
    setState(() => _isLoading = true);
    try {
      final response = await _apiService.getCustomers();
      if (response.statusCode == 200 && response.data != null) {
        if (mounted) {
          setState(() {
            _customers = response.data is List ? response.data : [response.data];
            _isLoading = false;
            _error = null;
          });
        }
      } else {
        if (mounted) {
          setState(() {
            _error = 'Lỗi tải khách hàng: ${response.statusCode}';
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Không thể kết nối Backend.\nĐang hiển thị dữ liệu mẫu.';
          _customers = [
            {"maKH": 1, "tenKH": "Anh Hoàng Văn Thắng", "sdt": "0901234567", "diaChi": "Quận 3, TP.HCM", "hangThanhVien": "Vàng", "tongChiTieu": 15000000},
            {"maKH": 2, "tenKH": "Chị Nguyễn Mai Lan", "sdt": "0911223344", "diaChi": "Quận 5, TP.HCM", "hangThanhVien": "Bạc", "tongChiTieu": 5000000},
            {"maKH": 3, "tenKH": "Cửa hàng VLXD Hưng Thịnh", "sdt": "0988777666", "diaChi": "Thủ Đức, TP.HCM", "hangThanhVien": "Kim cương", "tongChiTieu": 125000000},
          ];
          _isLoading = false;
        });
      }
    }
  }

  // =========================================================================
  // CHỨC NĂNG CRUD
  // =========================================================================
  Future<void> _showAddEditDialog([Map<String, dynamic>? customer]) async {
    final isEdit = customer != null;
    final tenCtrl = TextEditingController(text: isEdit ? (customer['tenKH'] ?? customer['TenKH'] ?? '').toString() : '');
    final sdtCtrl = TextEditingController(text: isEdit ? (customer['sdt'] ?? customer['Sdt'] ?? '').toString() : '');
    final diaChiCtrl = TextEditingController(text: isEdit ? (customer['diaChi'] ?? customer['DiaChi'] ?? '').toString() : '');
    final emailCtrl = TextEditingController(text: isEdit ? (customer['email'] ?? customer['Email'] ?? '').toString() : '');

    final formKey = GlobalKey<FormState>();

    await showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text(isEdit ? 'Sửa Khách Hàng' : 'Thêm Khách Hàng', style: const TextStyle(fontWeight: FontWeight.bold)),
          content: SingleChildScrollView(
            child: Form(
              key: formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextFormField(
                    controller: tenCtrl,
                    decoration: const InputDecoration(labelText: 'Tên khách hàng', border: OutlineInputBorder()),
                    validator: (val) => val == null || val.isEmpty ? 'Vui lòng nhập tên' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: sdtCtrl,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(labelText: 'Số điện thoại', border: OutlineInputBorder()),
                    validator: (val) => val == null || val.isEmpty ? 'Vui lòng nhập SĐT' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: diaChiCtrl,
                    decoration: const InputDecoration(labelText: 'Địa chỉ', border: OutlineInputBorder()),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: emailCtrl,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(labelText: 'Email (tùy chọn)', border: OutlineInputBorder()),
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('Hủy')),
            ElevatedButton(
              onPressed: () async {
                if (formKey.currentState!.validate()) {
                  Navigator.pop(context);
                  setState(() => _isLoading = true);

                  final data = {
                    'tenKH': tenCtrl.text,
                    'sdt': sdtCtrl.text,
                    'diaChi': diaChiCtrl.text,
                    'email': emailCtrl.text,
                    'hangThanhVien': isEdit ? (customer['hangThanhVien'] ?? 'Đồng') : 'Đồng',
                    'trangThai': true,
                  };

                  try {
                    if (isEdit) {
                      final id = customer['maKhachHang'] ?? customer['maKH'] ?? customer['MaKH'] ?? customer['id'];
                      await _apiService.updateCustomer(id, data);
                      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cập nhật thành công!')));
                    } else {
                      await _apiService.createCustomer(data);
                      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Thêm mới thành công!')));
                    }
                    _fetchCustomers();
                  } catch (e) {
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi: $e')));
                      _fetchCustomers();
                    }
                  }
                }
              },
              child: Text(isEdit ? 'Lưu Thay Đổi' : 'Thêm Mới'),
            ),
          ],
        );
      },
    );
  }

  Future<void> _deleteCustomer(dynamic customer) async {
    final id = customer['maKhachHang'] ?? customer['maKH'] ?? customer['MaKH'] ?? customer['id'];
    final ten = customer['tenKH'] ?? customer['TenKH'] ?? '';

    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xác nhận xóa'),
        content: Text('Bạn có chắc chắn muốn xóa khách hàng "$ten"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Hủy')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Xóa', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      setState(() => _isLoading = true);
      try {
        await _apiService.deleteCustomer(id);
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Xóa thành công!')));
        _fetchCustomers();
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi khi xóa: $e')));
          _fetchCustomers();
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddEditDialog(),
        icon: const Icon(Icons.person_add),
        label: const Text('Thêm Khách Hàng'),
        backgroundColor: Colors.purple.shade800,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Khách hàng (${_customers.length})', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                    ],
                  ),
                ),
                if (_error != null)
                  Container(
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 8, left: 16, right: 16),
                    decoration: BoxDecoration(color: Colors.amber.shade100, borderRadius: BorderRadius.circular(8)),
                    child: Row(
                      children: [
                        const Icon(Icons.warning_amber_rounded, color: Colors.orange),
                        const SizedBox(width: 8),
                        Expanded(child: Text(_error!, style: TextStyle(color: Colors.orange.shade800, fontSize: 13, fontWeight: FontWeight.bold))),
                      ],
                    ),
                  ),
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _customers.length,
                    itemBuilder: (context, index) {
                      final c = _customers[index];
                      final name = c['tenKH'] ?? c['TenKH'] ?? c['fullName'] ?? 'Khách hàng';
                      final phone = c['sdt'] ?? c['Sdt'] ?? 'Chưa cập nhật SĐT';
                      final address = c['diaChi'] ?? c['DiaChi'] ?? 'Chưa cập nhật địa chỉ';
                      final tier = c['hangThanhVien'] ?? c['HangThanhVien'] ?? 'Đồng';
                      final totalSpend = c['tongChiTieu'] ?? c['TongChiTieu'] ?? 0;

                      return Card(
                        elevation: 2,
                        margin: const EdgeInsets.only(bottom: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        child: ListTile(
                          contentPadding: const EdgeInsets.all(16),
                          leading: CircleAvatar(backgroundColor: Theme.of(context).colorScheme.primary.withValues(alpha: 0.1), child: Icon(Icons.person, color: Theme.of(context).colorScheme.primary)),
                          title: Row(
                            children: [
                              Expanded(child: Text(name.toString(), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16))),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(color: Colors.orange.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(8)),
                                child: Text(tier.toString(), style: const TextStyle(color: Colors.orange, fontSize: 12, fontWeight: FontWeight.bold)),
                              )
                            ],
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  const Icon(Icons.phone, size: 14, color: Colors.grey),
                                  const SizedBox(width: 4),
                                  Text(phone.toString(), style: const TextStyle(color: Colors.grey)),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  const Icon(Icons.location_on, size: 14, color: Colors.grey),
                                  const SizedBox(width: 4),
                                  Expanded(child: Text(address.toString(), style: const TextStyle(color: Colors.grey), maxLines: 1, overflow: TextOverflow.ellipsis)),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text('Tổng chi tiêu: ${_currencyFormat.format(totalSpend)}', style: TextStyle(color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.bold)),
                            ],
                          ),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              IconButton(
                                icon: const Icon(Icons.edit, color: Colors.orange),
                                tooltip: 'Sửa',
                                onPressed: () => _showAddEditDialog(c as Map<String, dynamic>),
                              ),
                              IconButton(
                                icon: const Icon(Icons.delete, color: Colors.red),
                                tooltip: 'Xóa',
                                onPressed: () => _deleteCustomer(c),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                )
              ],
            ),
    );
  }
}
