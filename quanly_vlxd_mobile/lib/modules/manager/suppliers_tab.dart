import 'package:flutter/material.dart';
import '../../services/api_service.dart';

class SuppliersTab extends StatefulWidget {
  const SuppliersTab({super.key});

  @override
  State<SuppliersTab> createState() => _SuppliersTabState();
}

class _SuppliersTabState extends State<SuppliersTab> {
  final ApiService _apiService = ApiService();
  List<dynamic> _suppliers = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchSuppliers();
  }

  Future<void> _fetchSuppliers() async {
    setState(() => _isLoading = true);
    try {
      final response = await _apiService.getSuppliers();
      if (response.statusCode == 200 && response.data != null) {
        if (mounted) {
          setState(() {
            _suppliers = response.data is List ? response.data : [response.data];
            _isLoading = false;
            _error = null;
          });
        }
      } else {
        if (mounted) {
          setState(() {
            _error = 'Lỗi tải nhà cung cấp: ${response.statusCode}';
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Không thể kết nối Backend.\nĐang hiển thị dữ liệu mẫu.';
          _suppliers = [
            {"maNCC": 1, "tenNCC": "Nhà cung cấp Xi măng Hà Tiên", "sdt": "0909.555.777", "diaChi": "KCN Sóng Thần", "trangThai": true},
            {"maNCC": 2, "tenNCC": "Thép Hòa Phát", "sdt": "1900.1234", "diaChi": "KCN Amata", "trangThai": true},
            {"maNCC": 3, "tenNCC": "Gạch Đồng Tâm", "sdt": "0888.666.999", "diaChi": "Bến Lức, Long An", "trangThai": true},
          ];
          _isLoading = false;
        });
      }
    }
  }

  // =========================================================================
  // CHỨC NĂNG CRUD
  // =========================================================================
  Future<void> _showAddEditDialog([Map<String, dynamic>? supplier]) async {
    final isEdit = supplier != null;
    final tenCtrl = TextEditingController(text: isEdit ? (supplier['tenNCC'] ?? supplier['TenNCC'] ?? '').toString() : '');
    final sdtCtrl = TextEditingController(text: isEdit ? (supplier['sdt'] ?? supplier['Sdt'] ?? '').toString() : '');
    final diaChiCtrl = TextEditingController(text: isEdit ? (supplier['diaChi'] ?? supplier['DiaChi'] ?? '').toString() : '');

    final formKey = GlobalKey<FormState>();

    await showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text(isEdit ? 'Sửa Nhà Cung Cấp' : 'Thêm Nhà Cung Cấp', style: const TextStyle(fontWeight: FontWeight.bold)),
          content: SingleChildScrollView(
            child: Form(
              key: formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextFormField(
                    controller: tenCtrl,
                    decoration: const InputDecoration(labelText: 'Tên nhà cung cấp', border: OutlineInputBorder()),
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
                    'tenNCC': tenCtrl.text,
                    'sdt': sdtCtrl.text,
                    'diaChi': diaChiCtrl.text,
                    'trangThai': true,
                  };

                  try {
                    if (isEdit) {
                      final id = supplier['maNhaCungCap'] ?? supplier['maNCC'] ?? supplier['MaNCC'] ?? supplier['id'];
                      await _apiService.updateSupplier(id, data);
                      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cập nhật thành công!')));
                    } else {
                      await _apiService.createSupplier(data);
                      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Thêm mới thành công!')));
                    }
                    _fetchSuppliers();
                  } catch (e) {
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi: $e')));
                      _fetchSuppliers();
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

  Future<void> _deleteSupplier(dynamic supplier) async {
    final id = supplier['maNhaCungCap'] ?? supplier['maNCC'] ?? supplier['MaNCC'] ?? supplier['id'];
    final ten = supplier['tenNCC'] ?? supplier['TenNCC'] ?? '';

    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xác nhận xóa'),
        content: Text('Bạn có chắc chắn muốn xóa nhà cung cấp "$ten"?'),
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
        await _apiService.deleteSupplier(id);
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Xóa thành công!')));
        _fetchSuppliers();
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi khi xóa: $e')));
          _fetchSuppliers();
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddEditDialog(),
        icon: const Icon(Icons.add_business),
        label: const Text('Thêm Nhà Cung Cấp'),
        backgroundColor: Colors.purple.shade800,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                if (_error != null)
                  Container(
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 8, left: 16, right: 16, top: 16),
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
                    padding: const EdgeInsets.all(16),
                    itemCount: _suppliers.length,
                    itemBuilder: (context, index) {
                      final s = _suppliers[index];
                      final name = s['tenNCC'] ?? s['TenNCC'] ?? s['name'] ?? 'Nhà cung cấp';
                      final phone = s['sdt'] ?? s['Sdt'] ?? 'Chưa cập nhật SĐT';
                      final address = s['diaChi'] ?? s['DiaChi'] ?? 'Chưa cập nhật địa chỉ';

                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: ListTile(
                          leading: const CircleAvatar(backgroundColor: Colors.teal, child: Icon(Icons.business, color: Colors.white)),
                          title: Text(name.toString(), style: const TextStyle(fontWeight: FontWeight.bold)),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Liên hệ: $phone', maxLines: 1, overflow: TextOverflow.ellipsis),
                              Text('Địa chỉ: $address', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.grey, fontSize: 12)),
                            ],
                          ),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              IconButton(
                                icon: const Icon(Icons.edit, color: Colors.orange),
                                tooltip: 'Sửa',
                                onPressed: () => _showAddEditDialog(s as Map<String, dynamic>),
                              ),
                              IconButton(
                                icon: const Icon(Icons.delete, color: Colors.red),
                                tooltip: 'Xóa',
                                onPressed: () => _deleteSupplier(s),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
    );
  }
}
