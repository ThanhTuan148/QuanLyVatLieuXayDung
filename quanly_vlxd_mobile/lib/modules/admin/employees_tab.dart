import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../core/permission_helper.dart';
import '../../services/shared_preferences_service.dart';
import 'dart:convert';



class EmployeesTab extends StatefulWidget {
  const EmployeesTab({super.key});

  @override
  State<EmployeesTab> createState() => _EmployeesTabState();
}

class _EmployeesTabState extends State<EmployeesTab> with SingleTickerProviderStateMixin {
  final ApiService _apiService = ApiService();
  late TabController _tabController;

  // Dữ liệu 2 tab
  List<dynamic> _employees = [];
  List<dynamic> _roles = [];
  bool _isLoading = false;

  // Bộ lọc
  String _searchQuery = '';
  String _selectedRole = 'Tất cả';
  bool _isTableView = true;

  List<String> _roleFilterList = ['Tất cả'];

  bool _isAdmin() {
    try {
      final userStr = SharedPreferencesService.getUser();
      if (userStr != null && userStr.isNotEmpty) {
        final userObj = jsonDecode(userStr);
        final rawRole = userObj['roleName'] ?? userObj['RoleName'] ?? userObj['role'] ?? userObj['Role'] ?? userObj['quyen'] ?? userObj['Quyen'] ?? userObj['chucVu'] ?? 'Nhân viên';
        final rStr = rawRole.toString().toLowerCase();
        final username = (userObj['username'] ?? userObj['tenTK'] ?? '').toString().toLowerCase();
        return rStr.contains('admin') || rStr.contains('quản trị') || rStr.contains('quantri') || username.contains('admin');
      }
    } catch (_) {}
    return false;
  }

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        setState(() {});
      }
    });
    _fetchEmployeesData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchEmployeesData() async {
    setState(() => _isLoading = true);
    try {
      final resEmp = await _apiService.getEmployees();
      final resRoles = await _apiService.getRoles();

      if (!mounted) return;
      setState(() {
        if (resEmp.statusCode == 200 && resEmp.data != null) _employees = resEmp.data is List ? resEmp.data : [];
        if (resRoles.statusCode == 200 && resRoles.data != null) {
          _roles = resRoles.data is List ? resRoles.data : [];
          _roleFilterList = ['Tất cả', ..._roles.map((r) => (r['tenVT'] ?? '').toString()).where((s) => s.isNotEmpty)];
        }
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi tải dữ liệu Nhân viên: $e'), backgroundColor: Colors.red));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  List<dynamic> _getFilteredEmployees() {
    return _employees.where((item) {
      // Tìm kiếm nhanh
      final ma = (item['maNV'] ?? item['maNhanVien'] ?? '').toString().toLowerCase();
      final ten = (item['tenNV'] ?? '').toString().toLowerCase();
      final sdt = (item['sdt'] ?? '').toString().toLowerCase();
      final matchQuery = ma.contains(_searchQuery.toLowerCase()) || ten.contains(_searchQuery.toLowerCase()) || sdt.contains(_searchQuery.toLowerCase());

      // Lọc vai trò
      final role = (item['tenVaiTro'] ?? '').toString();
      final matchRole = _selectedRole == 'Tất cả' || role.toLowerCase() == _selectedRole.toLowerCase();

      return matchQuery && matchRole;
    }).toList();
  }

  // =========================================================================
  // CHỨC NĂNG CRUD & QUẢN LÝ TÀI KHOẢN
  // =========================================================================
  void _showAddEditDialog([Map<String, dynamic>? emp]) async {
    final isEdit = emp != null;
    final tenCtrl = TextEditingController(text: isEdit ? (emp['tenNV'] ?? '').toString() : '');
    final sdtCtrl = TextEditingController(text: isEdit ? (emp['sdt'] ?? '').toString() : '');
    final emailCtrl = TextEditingController(text: isEdit ? (emp['email'] ?? '').toString() : '');
    final diaChiCtrl = TextEditingController(text: isEdit ? (emp['diaChi'] ?? '').toString() : '');
    final sucChuaCtrl = TextEditingController(text: isEdit ? (emp['sucChuaToiDa'] ?? '').toString() : '');
    bool trangThai = isEdit ? (emp['trangThai'] ?? true) : true;

    final formKey = GlobalKey<FormState>();

    await showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: Text(isEdit ? 'Sửa Nhân Viên' : 'Thêm Nhân Viên Mới', style: const TextStyle(fontWeight: FontWeight.bold)),
              content: SingleChildScrollView(
                child: Form(
                  key: formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      TextFormField(
                        controller: tenCtrl,
                        decoration: const InputDecoration(labelText: 'Tên nhân viên (*)', border: OutlineInputBorder()),
                        validator: (val) => val == null || val.isEmpty ? 'Vui lòng nhập tên' : null,
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: sdtCtrl,
                        keyboardType: TextInputType.phone,
                        decoration: const InputDecoration(labelText: 'Số điện thoại', border: OutlineInputBorder()),
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: emailCtrl,
                        keyboardType: TextInputType.emailAddress,
                        decoration: const InputDecoration(labelText: 'Email', border: OutlineInputBorder()),
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: diaChiCtrl,
                        decoration: const InputDecoration(labelText: 'Địa chỉ', border: OutlineInputBorder()),
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: sucChuaCtrl,
                        decoration: const InputDecoration(labelText: 'Sức chứa tối đa (dành cho Tài xế)', border: OutlineInputBorder()),
                      ),
                      const SizedBox(height: 12),
                      SwitchListTile(
                        title: const Text('Trạng thái hoạt động'),
                        value: trangThai,
                        onChanged: (val) => setDialogState(() => trangThai = val),
                      ),
                    ],
                  ),
                ),
              ),
              actions: [
                TextButton(onPressed: () => Navigator.pop(context), child: const Text('HỦY', style: TextStyle(color: Colors.grey))),
                ElevatedButton.icon(
                  onPressed: () async {
                    if (formKey.currentState!.validate()) {
                      Navigator.pop(context);
                      setState(() => _isLoading = true);

                      final data = {
                        'tenNV': tenCtrl.text,
                        'sdt': sdtCtrl.text,
                        'email': emailCtrl.text,
                        'diaChi': diaChiCtrl.text,
                        'sucChuaToiDa': sucChuaCtrl.text,
                        'trangThai': trangThai,
                      };

                      try {
                        if (isEdit) {
                          final id = emp['maNhanVien'] ?? emp['id'];
                          await _apiService.updateEmployee(id, data);
                          if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cập nhật nhân viên thành công!'), backgroundColor: Colors.green));
                        } else {
                          await _apiService.createEmployee(data);
                          if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Thêm nhân viên mới thành công!'), backgroundColor: Colors.green));
                        }
                        _fetchEmployeesData();
                      } catch (e) {
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi: $e'), backgroundColor: Colors.red));
                          _fetchEmployeesData();
                        }
                      }
                    }
                  },
                  icon: const Icon(Icons.save),
                  label: Text(isEdit ? 'LƯU THAY ĐỔI' : 'THÊM MỚI'),
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.indigo, foregroundColor: Colors.white),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _showCreateAccountDialog(Map<String, dynamic> emp) async {
    final tkCtrl = TextEditingController();
    final mkCtrl = TextEditingController();
    int? selectedRoleId = _roles.isNotEmpty ? _roles[0]['maVaiTro'] : null;
    final formKey = GlobalKey<FormState>();

    await showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: Text('Cấp Tài Khoản: ${emp['tenNV']}', style: const TextStyle(fontWeight: FontWeight.bold)),
              content: SingleChildScrollView(
                child: Form(
                  key: formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      TextFormField(
                        controller: tkCtrl,
                        decoration: const InputDecoration(labelText: 'Tên đăng nhập (*)', border: OutlineInputBorder()),
                        validator: (val) => val == null || val.isEmpty ? 'Vui lòng nhập tên đăng nhập' : null,
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: mkCtrl,
                        obscureText: true,
                        decoration: const InputDecoration(labelText: 'Mật khẩu (*)', border: OutlineInputBorder()),
                        validator: (val) => val == null || val.isEmpty ? 'Vui lòng nhập mật khẩu' : null,
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<int>(
                        value: selectedRoleId,
                        decoration: const InputDecoration(labelText: 'Vai trò / Quyền hạn', border: OutlineInputBorder()),
                        items: _roles.map<DropdownMenuItem<int>>((r) {
                          return DropdownMenuItem<int>(
                            value: r['maVaiTro'],
                            child: Text(r['tenVT'] ?? ''),
                          );
                        }).toList(),
                        onChanged: (val) => setDialogState(() => selectedRoleId = val),
                      ),
                    ],
                  ),
                ),
              ),
              actions: [
                TextButton(onPressed: () => Navigator.pop(context), child: const Text('HỦY', style: TextStyle(color: Colors.grey))),
                ElevatedButton.icon(
                  onPressed: () async {
                    if (formKey.currentState!.validate() && selectedRoleId != null) {
                      Navigator.pop(context);
                      setState(() => _isLoading = true);

                      final data = {
                        'tenTK': tkCtrl.text,
                        'matKhau': mkCtrl.text,
                        'email': emp['email'] ?? '',
                        'maVaiTro': selectedRoleId,
                      };

                      try {
                        final id = emp['maNhanVien'] ?? emp['id'];
                        final res = await _apiService.createEmployeeAccount(id, data);
                        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res.data['message'] ?? 'Cấp tài khoản thành công!'), backgroundColor: Colors.green));
                        _fetchEmployeesData();
                      } catch (e) {
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi cấp tài khoản: $e'), backgroundColor: Colors.red));
                          _fetchEmployeesData();
                        }
                      }
                    }
                  },
                  icon: const Icon(Icons.check),
                  label: const Text('XÁC NHẬN CẤP'),
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _showChangeRoleDialog(Map<String, dynamic> emp) async {
    int? selectedRoleId = emp['maVaiTro'] > 0 ? emp['maVaiTro'] : (_roles.isNotEmpty ? _roles[0]['maVaiTro'] : null);

    await showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: Text('Phân Quyền: ${emp['tenNV']}', style: const TextStyle(fontWeight: FontWeight.bold)),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  DropdownButtonFormField<int>(
                    value: selectedRoleId,
                    decoration: const InputDecoration(labelText: 'Chọn vai trò mới', border: OutlineInputBorder()),
                    items: _roles.map<DropdownMenuItem<int>>((r) {
                      return DropdownMenuItem<int>(
                        value: r['maVaiTro'],
                        child: Text(r['tenVT'] ?? ''),
                      );
                    }).toList(),
                    onChanged: (val) => setDialogState(() => selectedRoleId = val),
                  ),
                ],
              ),
              actions: [
                TextButton(onPressed: () => Navigator.pop(context), child: const Text('HỦY', style: TextStyle(color: Colors.grey))),
                ElevatedButton.icon(
                  onPressed: selectedRoleId == null ? null : () async {
                    Navigator.pop(context);
                    setState(() => _isLoading = true);
                    try {
                      final id = emp['maNhanVien'] ?? emp['id'];
                      final res = await _apiService.changeEmployeeRole(id, selectedRoleId!);
                      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res.data['message'] ?? 'Phân quyền thành công!'), backgroundColor: Colors.green));
                      _fetchEmployeesData();
                    } catch (e) {
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi phân quyền: $e'), backgroundColor: Colors.red));
                        _fetchEmployeesData();
                      }
                    }
                  },
                  icon: const Icon(Icons.save),
                  label: const Text('LƯU PHÂN QUYỀN'),
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.indigo, foregroundColor: Colors.white),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Map<String, Map<String, bool>> _autoMapGeneralToModule(List<dynamic> generalPerms) {
    final Map<String, Map<String, bool>> resultMap = {};
    bool hasQ(String code) => generalPerms.any((p) => p['maQ'] == code || p['maQuyen'] == code);
    
    Map<String, bool> createMod(bool view, bool create, bool update, bool del) {
      return {'coTheXem': view, 'coTheTao': create, 'coTheSua': update, 'coTheXoa': del};
    }

    if (hasQ('Q01')) resultMap['employees'] = createMod(true, true, true, true);
    
    if (hasQ('Q02')) {
      resultMap['products'] = createMod(true, true, true, true);
      resultMap['categories'] = createMod(true, true, true, true);
      resultMap['promotions'] = createMod(true, true, true, true);
      resultMap['flashsales'] = createMod(true, true, true, true);
    } else if (hasQ('Q10')) {
      resultMap['products'] = createMod(true, false, false, false);
      resultMap['categories'] = createMod(true, false, false, false);
      resultMap['promotions'] = createMod(true, false, false, false);
      resultMap['flashsales'] = createMod(true, false, false, false);
    }
    
    if (hasQ('Q03')) {
      resultMap['orders'] = createMod(true, true, true, true);
    } else if (hasQ('Q11')) {
      resultMap['orders'] = createMod(true, true, false, false);
    }
    
    if (hasQ('Q04')) {
      resultMap['inventory'] = createMod(true, true, true, true);
      resultMap['suppliers'] = createMod(true, true, true, true);
    }
    
    if (hasQ('Q05')) resultMap['deliveries'] = createMod(true, true, true, true);
    if (hasQ('Q06')) resultMap['customers'] = createMod(true, true, true, true);
    if (hasQ('Q07') || hasQ('Q08')) resultMap['reports'] = createMod(true, hasQ('Q08'), false, false);
    
    return resultMap;
  }

  void _showDetailedPermissionsDialog(Map<String, dynamic> emp) async {
    final id = emp['maNhanVien'] ?? emp['id'] ?? emp['maNV'];
    setState(() => _isLoading = true);
    try {
      final response = await _apiService.getEmployeeModulePermissions(id);
      final responseGen = await _apiService.getRolePermissions(id);
      
      List<dynamic> permissions = List.from(response.data ?? []);
      List<dynamic> rolePermissions = List.from(responseGen.data ?? []);
      
      setState(() => _isLoading = false);
      if (mounted) {
        _showModulePermissionsEditor(emp, permissions, rolePermissions);
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi tải danh sách quyền: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  void _showModulePermissionsEditor(Map<String, dynamic> emp, List<dynamic> permissions, List<dynamic> rolePermissions) async {
    final id = emp['maNhanVien'] ?? emp['id'] ?? emp['maNV'];
    
    // Auto-map role general permissions if no custom employee module permissions yet
    final Map<String, Map<String, bool>> initialModuleMap = {};
    if (permissions.isEmpty && rolePermissions.isNotEmpty) {
      initialModuleMap.addAll(_autoMapGeneralToModule(rolePermissions));
    } else {
      for (var mq in permissions) {
        final mod = mq['module']?.toString() ?? '';
        if (mod.isNotEmpty) {
          initialModuleMap[mod] = {
            'coTheXem': mq['coTheXem'] == true,
            'coTheTao': mq['coTheTao'] == true,
            'coTheSua': mq['coTheSua'] == true,
            'coTheXoa': mq['coTheXoa'] == true,
          };
        }
      }
    }

    final categories = [
      {
        'key': 'products',
        'label': '📦 Sản Phẩm',
        'tabs': [
          {
            'moduleKey': 'products',
            'label': 'Sản Phẩm',
            'ops': [
              {'field': 'coTheXem', 'label': 'Xem danh sách sản phẩm'},
              {'field': 'coTheTao', 'label': 'Thêm sản phẩm / Nhập Excel'},
              {'field': 'coTheSua', 'label': 'Sửa thông tin sản phẩm'},
              {'field': 'coTheXoa', 'label': 'Xóa sản phẩm'},
            ]
          },
          {
            'moduleKey': 'categories',
            'label': 'Loại Sản Phẩm',
            'ops': [
              {'field': 'coTheXem', 'label': 'Xem danh mục sản phẩm'},
              {'field': 'coTheTao', 'label': 'Thêm danh mục mới'},
              {'field': 'coTheSua', 'label': 'Sửa tên danh mục'},
              {'field': 'coTheXoa', 'label': 'Xóa danh mục'},
            ]
          },
        ]
      },
      {
        'key': 'orders',
        'label': '🛒 Đơn Hàng',
        'tabs': [
          {
            'moduleKey': 'orders',
            'label': 'Đơn Hàng',
            'ops': [
              {'field': 'coTheXem', 'label': 'Xem danh sách đơn hàng'},
              {'field': 'coTheTao', 'label': 'Tạo đơn hàng mới'},
              {'field': 'coTheSua', 'label': 'Cập nhật trạng thái đơn'},
              {'field': 'coTheXoa', 'label': 'Hủy / Xóa đơn hàng'},
            ]
          },
          {
            'moduleKey': 'deliveries',
            'label': 'Giao Hàng',
            'ops': [
              {'field': 'coTheXem', 'label': 'Xem lịch giao hàng'},
              {'field': 'coTheTao', 'label': 'Tạo phiếu giao hàng'},
              {'field': 'coTheSua', 'label': 'Cập nhật trạng thái giao'},
              {'field': 'coTheXoa', 'label': 'Hủy phiếu giao hàng'},
            ]
          },
        ]
      },
      {
        'key': 'customers',
        'label': '👥 Khách Hàng',
        'tabs': [
          {
            'moduleKey': 'customers',
            'label': 'Khách Hàng',
            'ops': [
              {'field': 'coTheXem', 'label': 'Xem danh sách khách hàng'},
              {'field': 'coTheTao', 'label': 'Thêm khách hàng mới'},
              {'field': 'coTheSua', 'label': 'Sửa thông tin khách hàng'},
              {'field': 'coTheXoa', 'label': 'Xóa tài khoản khách hàng'},
            ]
          },
        ]
      },
      {
        'key': 'inventory',
        'label': '🏭 Kho & Nhập Hàng',
        'tabs': [
          {
            'moduleKey': 'inventory',
            'label': 'Kho Hàng',
            'ops': [
              {'field': 'coTheXem', 'label': 'Xem tồn kho & phiếu kho'},
              {'field': 'coTheTao', 'label': 'Tạo phiếu xuất / nhập kho'},
              {'field': 'coTheSua', 'label': 'Điều chỉnh số lượng tồn'},
              {'field': 'coTheXoa', 'label': 'Xóa phiếu kho'},
            ]
          },
          {
            'moduleKey': 'inventory',
            'label': 'Nhập Hàng',
            'ops': [
              {'field': 'coTheXem', 'label': 'Xem đơn đặt hàng nhà cung cấp'},
              {'field': 'coTheTao', 'label': 'Tạo đơn nhập hàng mới'},
              {'field': 'coTheSua', 'label': 'Duyệt & cập nhật đơn nhập'},
              {'field': 'coTheXoa', 'label': 'Hủy đơn nhập hàng'},
            ]
          },
          {
            'moduleKey': 'inventory',
            'label': 'Đổi / Trả',
            'ops': [
              {'field': 'coTheXem', 'label': 'Xem yêu cầu đổi trả'},
              {'field': 'coTheTao', 'label': 'Tạo phiếu đổi trả'},
              {'field': 'coTheSua', 'label': 'Duyệt / Từ chối yêu cầu'},
              {'field': 'coTheXoa', 'label': 'Xóa yêu cầu đổi trả'},
            ]
          },
          {
            'moduleKey': 'suppliers',
            'label': 'Nhà Cung Cấp',
            'ops': [
              {'field': 'coTheXem', 'label': 'Xem danh sách nhà cung cấp'},
              {'field': 'coTheTao', 'label': 'Thêm nhà cung cấp mới'},
              {'field': 'coTheSua', 'label': 'Sửa thông tin nhà cung cấp'},
              {'field': 'coTheXoa', 'label': 'Xóa nhà cung cấp'},
            ]
          },
        ]
      },
      {
        'key': 'promotions',
        'label': '🏷️ Khuyến Mãi',
        'tabs': [
          {
            'moduleKey': 'promotions',
            'label': 'Khuyến Mãi SP',
            'ops': [
              {'field': 'coTheXem', 'label': 'Xem chương trình khuyến mãi'},
              {'field': 'coTheTao', 'label': 'Tạo khuyến mãi sản phẩm'},
              {'field': 'coTheSua', 'label': 'Sửa thông tin khuyến mãi'},
              {'field': 'coTheXoa', 'label': 'Xóa khuyến mãi'},
            ]
          },
          {
            'moduleKey': 'flashsales',
            'label': 'Flash Sales',
            'ops': [
              {'field': 'coTheXem', 'label': 'Xem chiến dịch Flash Sale'},
              {'field': 'coTheTao', 'label': 'Tạo Flash Sale mới'},
              {'field': 'coTheSua', 'label': 'Sửa Flash Sale'},
              {'field': 'coTheXoa', 'label': 'Xóa Flash Sale'},
            ]
          },
          {
            'moduleKey': 'flashsales',
            'label': 'Ưu Đãi Hệ Thống',
            'ops': [
              {'field': 'coTheXem', 'label': 'Xem chương trình ưu đãi'},
              {'field': 'coTheTao', 'label': 'Tạo ưu đãi hệ thống'},
              {'field': 'coTheSua', 'label': 'Sửa ưu đãi'},
              {'field': 'coTheXoa', 'label': 'Xóa ưu đãi'},
            ]
          },
          {
            'moduleKey': 'promotions',
            'label': 'Coupon',
            'ops': [
              {'field': 'coTheXem', 'label': 'Xem danh sách coupon'},
              {'field': 'coTheTao', 'label': 'Tạo mã coupon mới'},
              {'field': 'coTheSua', 'label': 'Sửa coupon'},
              {'field': 'coTheXoa', 'label': 'Xóa coupon'},
            ]
          },
        ]
      },
      {
        'key': 'reports',
        'label': '📊 Báo Cáo',
        'tabs': [
          {
            'moduleKey': 'reports',
            'label': 'Báo Cáo Thống Kê',
            'ops': [
              {'field': 'coTheXem', 'label': 'Xem báo cáo & biểu đồ'},
              {'field': 'coTheTao', 'label': 'Xuất báo cáo ra file'},
            ]
          },
        ]
      },
      {
        'key': 'employees',
        'label': '👨‍💼 Nhân Viên',
        'tabs': [
          {
            'moduleKey': 'employees',
            'label': 'Nhân Viên',
            'ops': [
              {'field': 'coTheXem', 'label': 'Xem danh sách nhân viên'},
              {'field': 'coTheTao', 'label': 'Thêm NV / Cấp tài khoản'},
              {'field': 'coTheSua', 'label': 'Sửa thông tin / Đổi vai trò'},
              {'field': 'coTheXoa', 'label': 'Xóa nhân viên'},
            ]
          },
        ]
      },
    ];

    await showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              titlePadding: const EdgeInsets.all(0),
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              title: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.indigo.shade800, Colors.indigo.shade900],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(16),
                    topRight: Radius.circular(16),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.verified_user, color: Colors.white, size: 24),
                        SizedBox(width: 8),
                        Text(
                          'Phân Quyền Chi Tiết',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${emp['tenNV']} - Vai trò: ${emp['tenVaiTro'] ?? "N/A"}',
                      style: const TextStyle(color: Colors.white70, fontSize: 13),
                    ),
                  ],
                ),
              ),
              content: SizedBox(
                width: MediaQuery.of(context).size.width * 0.95,
                height: MediaQuery.of(context).size.height * 0.65,
                child: Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 4.0),
                      child: Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () {
                                setDialogState(() {
                                  for (var k in [
                                    'products', 'categories', 'orders', 'deliveries', 
                                    'customers', 'inventory', 'suppliers', 'promotions', 
                                    'flashsales', 'reports', 'employees'
                                  ]) {
                                    initialModuleMap[k] = {
                                      'coTheXem': true,
                                      'coTheTao': true,
                                      'coTheSua': true,
                                      'coTheXoa': true,
                                    };
                                  }
                                });
                              },
                              style: OutlinedButton.styleFrom(
                                padding: EdgeInsets.zero,
                                side: const BorderSide(color: Colors.green),
                              ),
                              icon: const Icon(Icons.check_circle_outline, color: Colors.green, size: 16),
                              label: const Text('CẤP HẾT', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 11)),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () {
                                setDialogState(() {
                                  for (var k in [
                                    'products', 'categories', 'orders', 'deliveries', 
                                    'customers', 'inventory', 'suppliers', 'promotions', 
                                    'flashsales', 'reports', 'employees'
                                  ]) {
                                    initialModuleMap[k] = {
                                      'coTheXem': false,
                                      'coTheTao': false,
                                      'coTheSua': false,
                                      'coTheXoa': false,
                                    };
                                  }
                                });
                              },
                              style: OutlinedButton.styleFrom(
                                padding: EdgeInsets.zero,
                                side: const BorderSide(color: Colors.red),
                              ),
                              icon: const Icon(Icons.remove_circle_outline, color: Colors.red, size: 16),
                              label: const Text('THU HỒI HẾT', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 11)),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Divider(),
                    Expanded(
                      child: ListView.builder(
                        itemCount: categories.length,
                        itemBuilder: (context, index) {
                          final cat = categories[index];
                          final tabs = cat['tabs'] as List<Map<String, dynamic>>;
                          return Card(
                            elevation: 2,
                            margin: const EdgeInsets.only(bottom: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            child: ExpansionTile(
                              leading: Text(
                                cat['label'].toString().split(' ')[0],
                                style: const TextStyle(fontSize: 20),
                              ),
                              title: Text(
                                cat['label'].toString().substring(2),
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.indigo),
                              ),
                              initiallyExpanded: index == 0,
                              children: tabs.map((tab) {
                                final modKey = tab['moduleKey'] as String;
                                final ops = tab['ops'] as List<Map<String, String>>;
                                
                                return Card(
                                  margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  color: Colors.grey.shade50,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8),
                                    side: BorderSide(color: Colors.grey.shade200),
                                  ),
                                  child: ExpansionTile(
                                    title: Text(
                                      tab['label'] as String,
                                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                                    ),
                                    initiallyExpanded: true,
                                    children: ops.map((op) {
                                      final field = op['field'] as String;
                                      final label = op['label'] as String;
                                      
                                      final modMap = initialModuleMap[modKey] ??= {
                                        'coTheXem': false,
                                        'coTheTao': false,
                                        'coTheSua': false,
                                        'coTheXoa': false,
                                      };
                                      final isSwitched = modMap[field] ?? false;
                                      
                                      return SwitchListTile(
                                        title: Text(label, style: const TextStyle(fontSize: 13)),
                                        value: isSwitched,
                                        onChanged: (val) {
                                          setDialogState(() {
                                            modMap[field] = val;
                                          });
                                        },
                                        activeColor: Colors.indigo,
                                        dense: true,
                                      );
                                    }).toList(),
                                  ),
                                );
                              }).toList(),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(onPressed: () => Navigator.pop(context), child: const Text('HỦY', style: TextStyle(color: Colors.grey))),
                ElevatedButton.icon(
                  onPressed: () async {
                    final messenger = ScaffoldMessenger.of(context);
                    Navigator.pop(context);
                    setState(() => _isLoading = true);
                    
                    final payload = [
                      'products', 'categories', 'orders', 'deliveries', 
                      'customers', 'inventory', 'suppliers', 'promotions', 
                      'flashsales', 'reports', 'employees'
                    ].map((k) {
                      final q = initialModuleMap[k] ?? {
                        'coTheXem': false,
                        'coTheTao': false,
                        'coTheSua': false,
                        'coTheXoa': false,
                      };
                      return {
                        'module': k,
                        'tenModule': k,
                        'coTheXem': q['coTheXem'] ?? false,
                        'coTheTao': q['coTheTao'] ?? false,
                        'coTheSua': q['coTheSua'] ?? false,
                        'coTheXoa': q['coTheXoa'] ?? false,
                      };
                    }).toList();

                    try {
                      final res = await _apiService.setEmployeeModulePermissions(id, payload);
                      if (mounted) {
                        messenger.showSnackBar(
                          SnackBar(content: Text(res.data['message'] ?? 'Lưu phân quyền thành công!'), backgroundColor: Colors.green),
                        );
                      }
                      _fetchEmployeesData();
                    } catch (e) {
                      if (mounted) {
                        messenger.showSnackBar(
                          SnackBar(content: Text('Lỗi lưu phân quyền: $e'), backgroundColor: Colors.red),
                        );
                        _fetchEmployeesData();
                      }
                    }
                  },
                  icon: const Icon(Icons.save),
                  label: const Text('LƯU PHÂN QUYỀN'),
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.indigo, foregroundColor: Colors.white),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _deleteEmployee(Map<String, dynamic> emp) async {
    final id = emp['maNhanVien'] ?? emp['id'];
    final ten = emp['tenNV'] ?? '';

    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xác nhận xóa'),
        content: Text('Bạn có chắc chắn muốn xóa nhân viên "$ten"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('HỦY')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('XÓA', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      setState(() => _isLoading = true);
      try {
        await _apiService.deleteEmployee(id);
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Xóa nhân viên thành công!'), backgroundColor: Colors.green));
        _fetchEmployeesData();
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi khi xóa: $e'), backgroundColor: Colors.red));
          _fetchEmployeesData();
        }
      }
    }
  }

  void _toggleStatus(Map<String, dynamic> emp) async {
    final id = emp['maNhanVien'] ?? emp['id'];
    setState(() => _isLoading = true);
    try {
      await _apiService.toggleEmployeeStatus(id);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cập nhật trạng thái thành công!'), backgroundColor: Colors.green));
      _fetchEmployeesData();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi cập nhật trạng thái: $e'), backgroundColor: Colors.red));
        _fetchEmployeesData();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEmpTab = _tabController.index == 0;
    final filteredEmployees = _getFilteredEmployees();

    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(72),
        child: Container(
          color: Colors.indigo.shade800,
          child: SafeArea(
            child: TabBar(
              controller: _tabController,
              indicatorColor: Colors.white,
              indicatorWeight: 3,
              labelColor: Colors.white,
              unselectedLabelColor: Colors.white70,
              labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              tabs: const [
                Tab(icon: Icon(Icons.people, size: 20), text: 'NHÂN VIÊN'),
                Tab(icon: Icon(Icons.security, size: 20), text: 'VAI TRÒ'),
              ],
            ),
          ),
        ),
      ),
      body: Column(
        children: [
          // Toolbar y như Web
          Card(
            margin: const EdgeInsets.all(16),
            elevation: 2,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    alignment: WrapAlignment.spaceBetween,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      if (isEmpTab) ...[
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: Icon(_isTableView ? Icons.grid_view : Icons.table_chart, color: Colors.indigo.shade800),
                              tooltip: _isTableView ? 'Chuyển sang dạng Thẻ' : 'Chuyển sang dạng Bảng',
                              onPressed: () => setState(() => _isTableView = !_isTableView),
                              constraints: const BoxConstraints(),
                              padding: const EdgeInsets.all(8),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                              decoration: BoxDecoration(
                                border: Border.all(color: Colors.grey.shade300),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: DropdownButtonHideUnderline(
                                child: DropdownButton<String>(
                                  value: _selectedRole,
                                  icon: const Icon(Icons.filter_list, size: 18),
                                  isDense: true,
                                  items: _roleFilterList
                                      .map((r) => DropdownMenuItem(
                                            value: r,
                                            child: Text(r, style: const TextStyle(fontSize: 13)),
                                          ))
                                      .toList(),
                                  onChanged: (val) {
                                    if (val != null) setState(() => _selectedRole = val);
                                  },
                                ),
                              ),
                            ),
                          ],
                        ),
                        ElevatedButton.icon(
                          onPressed: () => _showAddEditDialog(),
                          icon: const Icon(Icons.person_add, size: 18),
                          label: const Text('THÊM NHÂN VIÊN', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.indigo.shade800,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                        ),
                      ],
                    ],
                  ),
                  if (isEmpTab) ...[
                    const SizedBox(height: 12),
                    TextField(
                      decoration: InputDecoration(
                        hintText: 'Tìm kiếm nhanh mã NV, tên nhân viên, SĐT...',
                        prefixIcon: const Icon(Icons.search),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      ),
                      onChanged: (val) => setState(() => _searchQuery = val),
                    ),
                  ],
                ],
              ),
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : isEmpTab
                    ? (filteredEmployees.isEmpty
                        ? const Center(child: Text('Không tìm thấy nhân viên nào phù hợp', style: TextStyle(color: Colors.grey, fontSize: 16)))
                        : _isTableView
                            ? _buildTableView(filteredEmployees)
                            : _buildCardView(filteredEmployees))
                    : _buildRolesView(),
          ),
        ],
      ),
    );
  }

  Widget _buildTableView(List<dynamic> list) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: SingleChildScrollView(
          child: DataTable(
            headingRowColor: WidgetStateProperty.all(Colors.grey.shade100),
            columns: const [
              DataColumn(label: Text('Mã NV', style: TextStyle(fontWeight: FontWeight.bold))),
              DataColumn(label: Text('Tên Nhân Viên', style: TextStyle(fontWeight: FontWeight.bold))),
              DataColumn(label: Text('Liên Hệ', style: TextStyle(fontWeight: FontWeight.bold))),
              DataColumn(label: Text('Tài Khoản', style: TextStyle(fontWeight: FontWeight.bold))),
              DataColumn(label: Text('Vai Trò', style: TextStyle(fontWeight: FontWeight.bold))),
              DataColumn(label: Text('Trạng Thái', style: TextStyle(fontWeight: FontWeight.bold))),
              DataColumn(label: Text('Tác Vụ', style: TextStyle(fontWeight: FontWeight.bold))),
            ],
            rows: list.map((emp) {
              final isHoatDong = emp['trangThai'] == true;
              final hasAccount = emp['maTaiKhoan'] != null && emp['maTaiKhoan'] > 0;

              return DataRow(
                cells: [
                  DataCell(Text(emp['maNV'] ?? emp['maNhanVien'].toString(), style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.indigo))),
                  DataCell(Text(emp['tenNV'] ?? 'N/A', style: const TextStyle(fontWeight: FontWeight.bold))),
                  DataCell(Text('${emp['sdt'] ?? "N/A"}\n${emp['email'] ?? ""}')),
                  DataCell(
                    hasAccount 
                        ? Text(emp['tenTK'] ?? '') 
                        : (_isAdmin() 
                            ? ElevatedButton.icon(
                                onPressed: () => _showCreateAccountDialog(emp),
                                icon: const Icon(Icons.key, size: 16),
                                label: const Text('Cấp TK', style: TextStyle(fontSize: 12)),
                                style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
                              )
                            : const Text('Chưa cấp', style: TextStyle(color: Colors.grey, fontStyle: FontStyle.italic))),
                  ),
                  DataCell(
                    hasAccount 
                        ? Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.blue.shade50,
                              border: Border.all(color: Colors.blue.shade200),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              emp['tenVaiTro'] ?? 'Chưa cấp', 
                              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.blue.shade800, fontSize: 12),
                            ),
                          )
                        : const Text('N/A', style: TextStyle(color: Colors.grey)),
                  ),
                  DataCell(
                    Switch(
                      value: isHoatDong,
                      onChanged: (val) => _toggleStatus(emp),
                      activeColor: Colors.green,
                    ),
                  ),
                  DataCell(
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (PermissionHelper.canEdit('EMPLOYEES'))
                          IconButton(
                            icon: const Icon(Icons.edit, color: Colors.blue), 
                            tooltip: 'Sửa thông tin', 
                            onPressed: () => _showAddEditDialog(emp),
                          ),
                        if (_isAdmin() && hasAccount) ...[
                          IconButton(
                            icon: const Icon(Icons.admin_panel_settings, color: Colors.orange),
                            tooltip: 'Thay đổi vai trò',
                            onPressed: () => _showChangeRoleDialog(emp),
                          ),
                          IconButton(
                            icon: const Icon(Icons.security, color: Colors.teal),
                            tooltip: 'Phân quyền chi tiết',
                            onPressed: () => _showDetailedPermissionsDialog(emp),
                          ),
                        ],
                        if (PermissionHelper.canDelete('EMPLOYEES'))
                          IconButton(
                            icon: const Icon(Icons.delete, color: Colors.red), 
                            tooltip: 'Xóa nhân viên', 
                            onPressed: () => _deleteEmployee(emp),
                          ),
                      ],
                    ),
                  ),
                ],
              );
            }).toList(),
          ),
        ),
      ),
    );
  }

  Widget _buildCardView(List<dynamic> list) {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: list.length,
      itemBuilder: (context, index) {
        final emp = list[index];
        final isHoatDong = emp['trangThai'] == true;
        final hasAccount = emp['maTaiKhoan'] != null && emp['maTaiKhoan'] > 0;

        return Card(
          elevation: 2,
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: Column(
            children: [
              ListTile(
                contentPadding: const EdgeInsets.all(16),
                leading: CircleAvatar(
                  backgroundColor: isHoatDong ? Colors.indigo.shade100 : Colors.red.shade100,
                  child: Icon(Icons.person, color: isHoatDong ? Colors.indigo : Colors.red),
                ),
                title: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        '${emp['maNV'] ?? emp['maNhanVien']} - ${emp['tenNV']}', 
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.indigo),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Switch(value: isHoatDong, onChanged: (val) => _toggleStatus(emp), activeColor: Colors.green),
                  ],
                ),
                subtitle: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 8),
                    Text('SĐT: ${emp['sdt'] ?? "N/A"} | Email: ${emp['email'] ?? "N/A"}'),
                    const SizedBox(height: 4),
                    if (hasAccount) ...[
                      Row(
                        children: [
                          const Text('Tài khoản: ', style: TextStyle(color: Colors.grey, fontSize: 13)),
                          Text(emp['tenTK'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blue, fontSize: 13)),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.blue.shade50,
                              border: Border.all(color: Colors.blue.shade200),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              emp['tenVaiTro'] ?? '',
                              style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.blue.shade800),
                            ),
                          ),
                        ],
                      ),
                    ] else ...[
                      const Text('Chưa có tài khoản đăng nhập', style: TextStyle(color: Colors.red, fontStyle: FontStyle.italic, fontSize: 13)),
                    ],
                  ],
                ),
              ),
              const Divider(height: 1),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 4.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    if (_isAdmin()) ...[
                      if (!hasAccount)
                        TextButton.icon(
                          onPressed: () => _showCreateAccountDialog(emp),
                          icon: const Icon(Icons.key, size: 18, color: Colors.green),
                          label: const Text('CẤP TK', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 13)),
                        )
                      else ...[
                        IconButton(
                          icon: const Icon(Icons.admin_panel_settings, color: Colors.orange),
                          tooltip: 'Thay đổi vai trò',
                          onPressed: () => _showChangeRoleDialog(emp),
                        ),
                        IconButton(
                          icon: const Icon(Icons.security, color: Colors.teal),
                          tooltip: 'Phân quyền chi tiết',
                          onPressed: () => _showDetailedPermissionsDialog(emp),
                        ),
                      ],
                    ],
                    if (PermissionHelper.canEdit('EMPLOYEES'))
                      IconButton(
                        icon: const Icon(Icons.edit, color: Colors.blue),
                        tooltip: 'Sửa thông tin',
                        onPressed: () => _showAddEditDialog(emp),
                      ),
                    if (PermissionHelper.canDelete('EMPLOYEES'))
                      IconButton(
                        icon: const Icon(Icons.delete, color: Colors.red),
                        tooltip: 'Xóa nhân viên',
                        onPressed: () => _deleteEmployee(emp),
                      ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildRolesView() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _roles.length,
      itemBuilder: (context, index) {
        final role = _roles[index];
        return Card(
          elevation: 2,
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: ListTile(
            contentPadding: const EdgeInsets.all(16),
            leading: const CircleAvatar(backgroundColor: Colors.indigo, child: Icon(Icons.security, color: Colors.white)),
            title: Text(role['tenVT'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            subtitle: Text(role['moTa'] ?? 'Không có mô tả chi tiết'),
            trailing: const Icon(Icons.check_circle, color: Colors.green),
          ),
        );
      },
    );
  }
}
