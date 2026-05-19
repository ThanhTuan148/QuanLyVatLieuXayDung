import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';
import '../../core/permission_helper.dart';


class ReturnsTab extends StatefulWidget {
  const ReturnsTab({super.key});

  @override
  State<ReturnsTab> createState() => _ReturnsTabState();
}

class _ReturnsTabState extends State<ReturnsTab> with SingleTickerProviderStateMixin {
  final ApiService _apiService = ApiService();
  late TabController _tabController;

  // Dữ liệu 2 tab
  List<dynamic> _customerReturns = [];
  List<dynamic> _supplierReturns = [];
  bool _isLoading = false;

  // Bộ lọc
  String _searchQuery = '';
  String _selectedStatus = 'Tất cả';
  DateTime? _startDate;
  DateTime? _endDate;
  bool _isTableView = true;

  final List<String> _statusList = [
    'Tất cả',
    'Chờ Xử Lý',
    'Đã Duyệt',
    'Đang đổi trả',
    'Hoàn Tất',
    'Từ chối',
    'Chờ Duyệt Trả',
    'Đang Chờ Hàng Về',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        setState(() {}); // Cập nhật lại UI theo tab
      }
    });
    _fetchReturnsData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchReturnsData() async {
    setState(() => _isLoading = true);
    try {
      final resCust = await _apiService.getCustomerReturns();
      final resSupp = await _apiService.getSupplierReturns();
      if (!mounted) return;
      setState(() {
        if (resCust.statusCode == 200 && resCust.data != null) {
          _customerReturns = resCust.data is List ? resCust.data : [];
        }
        if (resSupp.statusCode == 200 && resSupp.data != null) {
          _supplierReturns = resSupp.data is List ? resSupp.data : [];
        }
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi tải dữ liệu Đổi/Trả: $e'), backgroundColor: Colors.red));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  List<dynamic> _getFilteredList(List<dynamic> source) {
    return source.where((item) {
      // Tìm kiếm nhanh
      final ma = (item['maDT'] ?? item['maPT'] ?? item['maPhieuDT'] ?? item['maPhieuTra'] ?? '').toString().toLowerCase();
      final ten = (item['tenKhachHang'] ?? item['tenNhaCungCap'] ?? '').toString().toLowerCase();
      final matchQuery = ma.contains(_searchQuery.toLowerCase()) || ten.contains(_searchQuery.toLowerCase());

      // Lọc trạng thái
      final st = (item['trangThai'] ?? '').toString();
      final matchStatus = _selectedStatus == 'Tất cả' || st.toLowerCase().contains(_selectedStatus.toLowerCase());

      // Lọc ngày
      bool matchDate = true;
      if (_startDate != null && _endDate != null) {
        try {
          final dStr = item['ngayDT'] ?? item['ngayTra'] ?? item['ngayTao'];
          if (dStr != null) {
            final d = DateTime.parse(dStr.toString());
            matchDate = d.isAfter(_startDate!.subtract(const Duration(days: 1))) && d.isBefore(_endDate!.add(const Duration(days: 1)));
          }
        } catch (_) {}
      }

      return matchQuery && matchStatus && matchDate;
    }).toList();
  }

  Future<void> _selectDateRange() async {
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
      initialDateRange: _startDate != null && _endDate != null ? DateTimeRange(start: _startDate!, end: _endDate!) : null,
    );
    if (picked != null) {
      setState(() {
        _startDate = picked.start;
        _endDate = picked.end;
      });
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'hoàn tất':
      case 'đã duyệt':
      case 'đã duyệt (tất cả)':
        return Colors.green.shade700;
      case 'chờ xử lý':
      case 'chờ duyệt trả':
        return Colors.blue.shade700;
      case 'đang đổi trả':
      case 'đang chờ hàng về':
      case 'đang xử lý (duyệt một phần)':
        return Colors.orange.shade700;
      case 'từ chối':
      case 'bị từ chối':
        return Colors.red.shade700;
      default:
        return Colors.grey.shade600;
    }
  }

  // =========================================================================
  // XEM CHI TIẾT & CÁC THAO TÁC DUYỆT / NHẬN HÀNG
  // =========================================================================
  void _showDetailDialog(Map<String, dynamic> item, bool isCustomer) {
    final maPhieu = item['maDT'] ?? item['maPT'];
    final tenDoiTac = item['tenKhachHang'] ?? item['tenNhaCungCap'];
    final ngay = item['ngayDT'] ?? item['ngayTra'];
    final currentStatus = item['trangThai'] ?? '';
    final chiTiet = (item['items'] ?? item['chiTiet'] ?? []) as List<dynamic>;

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Chi Tiết: $maPhieu', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(color: _getStatusColor(currentStatus).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                child: Text(currentStatus, style: TextStyle(color: _getStatusColor(currentStatus), fontWeight: FontWeight.bold, fontSize: 13)),
              ),
            ],
          ),
          content: SizedBox(
            width: double.maxFinite,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Card(
                    color: Colors.grey.shade50,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: Colors.grey.shade200)),
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('${isCustomer ? "Khách hàng" : "Nhà cung cấp"}: $tenDoiTac', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                          const SizedBox(height: 8),
                          Text('Ngày yêu cầu: ${ngay != null ? DateFormat('dd/MM/yyyy HH:mm').format(DateTime.parse(ngay)) : 'N/A'}'),
                          const SizedBox(height: 8),
                          Text('Lý do: ${item['lyDo'] ?? 'Không có'}'),
                          if (isCustomer) ...[
                            const SizedBox(height: 8),
                            Text('Loại: ${item['loai'] ?? 'N/A'} | Lỗi do: ${item['loiDo'] ?? 'N/A'}'),
                          ],
                          const Divider(height: 24),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Tổng tiền hoàn:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                              Text(NumberFormat.currency(locale: 'vi_VN', symbol: 'đ').format(item['tongTienHoan'] ?? 0), style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.red.shade700)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text('DANH SÁCH MẶT HÀNG:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                  const SizedBox(height: 8),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: DataTable(
                      headingRowColor: WidgetStateProperty.all(Colors.grey.shade100),
                      columns: [
                        const DataColumn(label: Text('Mặt Hàng', style: TextStyle(fontWeight: FontWeight.bold))),
                        const DataColumn(label: Text('Số Lượng', style: TextStyle(fontWeight: FontWeight.bold))),
                        const DataColumn(label: Text('Đơn Giá', style: TextStyle(fontWeight: FontWeight.bold))),
                        if (isCustomer) const DataColumn(label: Text('Loại', style: TextStyle(fontWeight: FontWeight.bold))),
                      ],
                      rows: chiTiet.map((ct) {
                        return DataRow(
                          cells: [
                            DataCell(Text(ct['tenSanPham'] ?? 'SP #${ct['maSanPham']}', style: const TextStyle(fontWeight: FontWeight.bold))),
                            DataCell(Text('${ct['soLuong'] ?? ct['soLuongTra'] ?? 0}')),
                            DataCell(Text(NumberFormat.currency(locale: 'vi_VN', symbol: 'đ').format(ct['donGia'] ?? 0))),
                            if (isCustomer) DataCell(Text(ct['loai'] ?? 'N/A')),
                          ],
                        );
                      }).toList(),
                    ),
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('ĐÓNG', style: TextStyle(color: Colors.grey))),
            if (currentStatus.contains('Chờ') || currentStatus.contains('Đề Xuất')) ...[
              ElevatedButton.icon(
                onPressed: () async {
                  Navigator.pop(context);
                  setState(() => _isLoading = true);
                  try {
                    final id = item['maPhieuDT'] ?? item['maPhieuTra'];
                    final res = isCustomer ? await _apiService.approveCustomerReturn(id) : await _apiService.approveSupplierReturn(id);
                    if (!mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res.data['message'] ?? 'Đã duyệt thành công!'), backgroundColor: Colors.green));
                    _fetchReturnsData();
                  } catch (e) {
                    if (!mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi duyệt phiếu: $e'), backgroundColor: Colors.red));
                    setState(() => _isLoading = false);
                  }
                },
                icon: const Icon(Icons.check_circle),
                label: const Text('DUYỆT YÊU CẦU'),
                style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
              ),
            ],
            if (currentStatus.contains('Duyệt') || currentStatus.contains('Chờ Hàng Về') || currentStatus.contains('Đang đổi trả')) ...[
              ElevatedButton.icon(
                onPressed: () async {
                  Navigator.pop(context);
                  setState(() => _isLoading = true);
                  try {
                    final id = item['maPhieuDT'] ?? item['maPhieuTra'];
                    final res = isCustomer ? await _apiService.receiveCustomerReturn(id) : await _apiService.receiveSupplierReturn(id);
                    if (!mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res.data['message'] ?? 'Đã xác nhận nhập kho thành công!'), backgroundColor: Colors.green));
                    _fetchReturnsData();
                  } catch (e) {
                    if (!mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi xác nhận nhập kho: $e'), backgroundColor: Colors.red));
                    setState(() => _isLoading = false);
                  }
                },
                icon: const Icon(Icons.inventory),
                label: const Text('XÁC NHẬN NHẬP KHO'),
                style: ElevatedButton.styleFrom(backgroundColor: Colors.blue.shade700, foregroundColor: Colors.white),
              ),
            ],
          ],
        );
      },
    );
  }

  // =========================================================================
  // FORM THÊM YÊU CẦU ĐỔI TRẢ KHÁCH HÀNG / TRẢ HÀNG NCC
  // =========================================================================
  void _showAddCustomerReturnPopup() async {
    // Tải danh sách đơn hàng để chọn
    setState(() => _isLoading = true);
    List<dynamic> orders = [];
    try {
      final res = await _apiService.getOrders();
      if (res.statusCode == 200) orders = res.data;
    } catch (_) {}
    if (!mounted) return;
    setState(() => _isLoading = false);

    int? selectedOrderId;
    List<dynamic> candidateItems = [];
    List<Map<String, dynamic>> returnItems = [];
    final reasonCtrl = TextEditingController();
    String returnType = 'Trả hàng';
    String faultBy = 'Khách hàng';

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setPopupState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: const Text('Tạo Đề Nghị Đổi/Trả Khách Hàng', style: TextStyle(fontWeight: FontWeight.bold)),
              content: SizedBox(
                width: double.maxFinite,
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Chọn Hóa Đơn:', style: TextStyle(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      DropdownButtonFormField<int>(
                        value: selectedOrderId,
                        decoration: InputDecoration(border: OutlineInputBorder(borderRadius: BorderRadius.circular(8))),
                        items: orders.map<DropdownMenuItem<int>>((o) {
                          return DropdownMenuItem<int>(
                            value: o['maHoaDon'] ?? o['maHD_Int'] ?? o['id'],
                            child: Text('${o['maHD']} - ${o['tenKH'] ?? o['tenKhachHang'] ?? "Khách hàng"}'),
                          );
                        }).toList(),
                        onChanged: (val) async {
                          setPopupState(() => selectedOrderId = val);
                          if (val != null) {
                            try {
                              // Tải các mặt hàng trong hóa đơn
                              final resDetail = await _apiService.getOrderDetail(val);
                              if (resDetail.statusCode == 200 && resDetail.data != null) {
                                setPopupState(() {
                                  candidateItems = resDetail.data['cthDs'] ?? resDetail.data['chiTiet'] ?? [];
                                  returnItems = candidateItems.map((c) => {
                                    'maSanPham': c['maSanPham'],
                                    'tenSanPham': c['tenSanPham'] ?? c['tenSP'] ?? 'SP #${c['maSanPham']}',
                                    'soLuong': 1,
                                    'maxSoLuong': c['soLuong'],
                                    'donGia': c['donGia'],
                                    'loai': 'Trả hàng',
                                    'selected': false,
                                  }).toList();
                                });
                              }
                            } catch (_) {}
                          }
                        },
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              value: returnType,
                              decoration: const InputDecoration(labelText: 'Loại xử lý', border: OutlineInputBorder()),
                              items: ['Trả hàng', 'Đổi hàng'].map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                              onChanged: (val) => setPopupState(() => returnType = val!),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              value: faultBy,
                              decoration: const InputDecoration(labelText: 'Lỗi do', border: OutlineInputBorder()),
                              items: ['Khách hàng', 'Cửa hàng'].map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                              onChanged: (val) => setPopupState(() => faultBy = val!),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      TextField(controller: reasonCtrl, decoration: const InputDecoration(labelText: 'Lý do đổi/trả', border: OutlineInputBorder()), maxLines: 2),
                      const SizedBox(height: 16),
                      const Text('Chọn Sản Phẩm Cần Đổi/Trả:', style: TextStyle(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      if (returnItems.isEmpty)
                        const Text('Vui lòng chọn Hóa đơn để hiển thị sản phẩm', style: TextStyle(color: Colors.grey, fontStyle: FontStyle.italic))
                      else
                        Column(
                          children: returnItems.map((item) {
                            return CheckboxListTile(
                              value: item['selected'],
                              title: Text(item['tenSanPham'], style: const TextStyle(fontWeight: FontWeight.bold)),
                              subtitle: Row(
                                children: [
                                  Text('Đơn giá: ${NumberFormat.currency(locale: 'vi_VN', symbol: 'đ').format(item['donGia'])}'),
                                  const SizedBox(width: 16),
                                  if (item['selected'])
                                    Expanded(
                                      child: TextFormField(
                                        initialValue: item['soLuong'].toString(),
                                        keyboardType: TextInputType.number,
                                        decoration: InputDecoration(labelText: 'Số lượng (tối đa ${item['maxSoLuong']})', isDense: true),
                                        onChanged: (val) {
                                          int sl = int.tryParse(val) ?? 1;
                                          if (sl > item['maxSoLuong']) sl = item['maxSoLuong'];
                                          item['soLuong'] = sl;
                                        },
                                      ),
                                    ),
                                ],
                              ),
                              onChanged: (bool? val) => setPopupState(() => item['selected'] = val ?? false),
                            );
                          }).toList(),
                        ),
                    ],
                  ),
                ),
              ),
              actions: [
                TextButton(onPressed: () => Navigator.pop(context), child: const Text('HỦY', style: TextStyle(color: Colors.grey))),
                ElevatedButton.icon(
                  onPressed: selectedOrderId == null || !returnItems.any((i) => i['selected']) ? null : () async {
                    Navigator.pop(context);
                    setState(() => _isLoading = true);
                    try {
                      final selectedList = returnItems.where((i) => i['selected']).toList();
                      final payload = {
                        'maHoaDon': selectedOrderId,
                        'maNhanVien': 1, // Giả định NV 1
                        'lyDo': reasonCtrl.text.isNotEmpty ? reasonCtrl.text : 'Yêu cầu từ Mobile',
                        'loiDo': faultBy,
                        'loai': returnType,
                        'items': selectedList.map((i) => {
                          'maSanPham': i['maSanPham'],
                          'soLuong': i['soLuong'],
                          'donGia': i['donGia'],
                          'loai': returnType,
                        }).toList(),
                      };

                      final res = await _apiService.createCustomerReturn(payload);
                      if (!mounted) return;
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res.data['message'] ?? 'Tạo đề nghị thành công!'), backgroundColor: Colors.green));
                      _fetchReturnsData();
                    } catch (e) {
                      if (!mounted) return;
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi tạo đề nghị: $e'), backgroundColor: Colors.red));
                      setState(() => _isLoading = false);
                    }
                  },
                  icon: const Icon(Icons.send),
                  label: const Text('GỬI ĐỀ NGHỊ'),
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _showAddSupplierReturnPopup() async {
    // Tải danh sách phiếu nhập để chọn
    setState(() => _isLoading = true);
    List<dynamic> procurements = [];
    try {
      final res = await _apiService.getProcurements();
      if (res.statusCode == 200) procurements = res.data;
    } catch (_) {}
    if (!mounted) return;
    setState(() => _isLoading = false);

    int? selectedProcurementId;
    final reasonCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setPopupState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: const Text('Tạo Đề Nghị Trả Hàng NCC', style: TextStyle(fontWeight: FontWeight.bold)),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Chọn Phiếu Nhập:', style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<int>(
                      value: selectedProcurementId,
                      decoration: InputDecoration(border: OutlineInputBorder(borderRadius: BorderRadius.circular(8))),
                      items: procurements.map<DropdownMenuItem<int>>((p) {
                        return DropdownMenuItem<int>(
                          value: p['maPhieuNhap'],
                          child: Text('${p['maPN'] ?? p['maPhieuNhap']} - ${p['tenNhaCungCap'] ?? "NCC"}'),
                        );
                      }).toList(),
                      onChanged: (val) => setPopupState(() => selectedProcurementId = val),
                    ),
                    const SizedBox(height: 16),
                    TextField(controller: reasonCtrl, decoration: const InputDecoration(labelText: 'Lý do trả hàng', border: OutlineInputBorder()), maxLines: 3),
                  ],
                ),
              ),
              actions: [
                TextButton(onPressed: () => Navigator.pop(context), child: const Text('HỦY', style: TextStyle(color: Colors.grey))),
                ElevatedButton.icon(
                  onPressed: selectedProcurementId == null ? null : () async {
                    Navigator.pop(context);
                    setState(() => _isLoading = true);
                    try {
                      final payload = {
                        'maPhieuNhap': selectedProcurementId,
                        'maNhanVien': 1,
                        'lyDo': reasonCtrl.text.isNotEmpty ? reasonCtrl.text : 'Hoàn trả hàng nhập lỗi/thiếu',
                      };
                      final res = await _apiService.createSupplierReturn(payload);
                      if (!mounted) return;
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res.data['message'] ?? 'Tạo đề nghị trả hàng NCC thành công!'), backgroundColor: Colors.green));
                      _fetchReturnsData();
                    } catch (e) {
                      if (!mounted) return;
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi tạo đề nghị trả NCC: $e'), backgroundColor: Colors.red));
                      setState(() => _isLoading = false);
                    }
                  },
                  icon: const Icon(Icons.send),
                  label: const Text('GỬI ĐỀ NGHỊ TRẢ NCC'),
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isCustomerTab = _tabController.index == 0;
    final currentList = _getFilteredList(isCustomerTab ? _customerReturns : _supplierReturns);

    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(56),
        child: AppBar(
          backgroundColor: Colors.purple.shade800,
          elevation: 0,
          bottom: TabBar(
            controller: _tabController,
            indicatorColor: Colors.white,
            indicatorWeight: 3,
            labelColor: Colors.white,
            unselectedLabelColor: Colors.white70,
            labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
            tabs: const [
              Tab(icon: Icon(Icons.assignment_return), text: 'KHÁCH HÀNG ĐỔI/TRẢ'),
              Tab(icon: Icon(Icons.outbox), text: 'TRẢ HÀNG NHÀ CUNG CẤP'),
            ],
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
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Wrap(
                        spacing: 8,
                        children: [
                          IconButton(
                            icon: Icon(_isTableView ? Icons.grid_view : Icons.table_chart, color: Colors.purple.shade800),
                            tooltip: _isTableView ? 'Chuyển sang dạng Thẻ' : 'Chuyển sang dạng Bảng',
                            onPressed: () => setState(() => _isTableView = !_isTableView),
                          ),
                          OutlinedButton.icon(
                            onPressed: _selectDateRange,
                            icon: const Icon(Icons.calendar_month, size: 18),
                            label: Text(_startDate != null && _endDate != null ? '${DateFormat('dd/MM').format(_startDate!)} - ${DateFormat('dd/MM').format(_endDate!)}' : 'Khoảng thời gian'),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            decoration: BoxDecoration(border: Border.all(color: Colors.grey.shade300), borderRadius: BorderRadius.circular(8)),
                            child: DropdownButton<String>(
                              value: _selectedStatus,
                              underline: const SizedBox(),
                              icon: const Icon(Icons.filter_list, size: 18),
                              items: _statusList.map((s) => DropdownMenuItem(value: s, child: Text(s, style: const TextStyle(fontSize: 14)))).toList(),
                              onChanged: (val) {
                                if (val != null) setState(() => _selectedStatus = val);
                              },
                            ),
                          ),
                        ],
                      ),
                      if (PermissionHelper.canCreate('RETURNS'))
                        ElevatedButton.icon(
                          onPressed: isCustomerTab ? _showAddCustomerReturnPopup : _showAddSupplierReturnPopup,
                          icon: const Icon(Icons.add),
                          label: Text(isCustomerTab ? 'TẠO ĐỀ NGHỊ' : 'TRẢ HÀNG NCC', style: const TextStyle(fontWeight: FontWeight.bold)),
                          style: ElevatedButton.styleFrom(backgroundColor: Colors.purple.shade800, foregroundColor: Colors.white),
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    decoration: InputDecoration(
                      hintText: 'Tìm kiếm nhanh mã phiếu, tên đối tác...',
                      prefixIcon: const Icon(Icons.search),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    ),
                    onChanged: (val) => setState(() => _searchQuery = val),
                  ),
                ],
              ),
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : currentList.isEmpty
                    ? const Center(child: Text('Không tìm thấy phiếu đổi/trả nào phù hợp', style: TextStyle(color: Colors.grey, fontSize: 16)))
                    : _isTableView
                        ? _buildTableView(currentList, isCustomerTab)
                        : _buildCardView(currentList, isCustomerTab),
          ),
        ],
      ),
    );
  }

  Widget _buildTableView(List<dynamic> list, bool isCustomer) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: SingleChildScrollView(
          child: DataTable(
            headingRowColor: WidgetStateProperty.all(Colors.grey.shade100),
            columns: [
              const DataColumn(label: Text('Mã Phiếu', style: TextStyle(fontWeight: FontWeight.bold))),
              const DataColumn(label: Text('Ngày Yêu Cầu', style: TextStyle(fontWeight: FontWeight.bold))),
              DataColumn(label: Text(isCustomer ? 'Khách Hàng' : 'Nhà Cung Cấp', style: const TextStyle(fontWeight: FontWeight.bold))),
              const DataColumn(label: Text('Tổng Tiền', style: TextStyle(fontWeight: FontWeight.bold))),
              const DataColumn(label: Text('Lý Do', style: TextStyle(fontWeight: FontWeight.bold))),
              const DataColumn(label: Text('Trạng Thái', style: TextStyle(fontWeight: FontWeight.bold))),
              const DataColumn(label: Text('Tác Vụ', style: TextStyle(fontWeight: FontWeight.bold))),
            ],
            rows: list.map((item) {
              final status = item['trangThai'] ?? '';
              final ma = item['maDT'] ?? item['maPT'];
              final ten = item['tenKhachHang'] ?? item['tenNhaCungCap'] ?? 'N/A';
              final ngay = item['ngayDT'] ?? item['ngayTra'];

              return DataRow(
                cells: [
                  DataCell(
                    TextButton(
                      onPressed: () => _showDetailDialog(item, isCustomer),
                      child: Text(ma.toString(), style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blue)),
                    ),
                  ),
                  DataCell(Text(ngay != null ? DateFormat('dd/MM/yyyy').format(DateTime.parse(ngay)) : 'N/A')),
                  DataCell(Text(ten)),
                  DataCell(Text(NumberFormat.currency(locale: 'vi_VN', symbol: 'đ').format(item['tongTienHoan'] ?? 0), style: const TextStyle(fontWeight: FontWeight.bold))),
                  DataCell(Text(item['lyDo'] ?? 'Không có', maxLines: 1, overflow: TextOverflow.ellipsis)),
                  DataCell(
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(color: _getStatusColor(status).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                      child: Text(status, style: TextStyle(color: _getStatusColor(status), fontWeight: FontWeight.bold, fontSize: 12)),
                    ),
                  ),
                  DataCell(
                    IconButton(
                      icon: const Icon(Icons.remove_red_eye, color: Colors.blue),
                      tooltip: 'Xem chi tiết',
                      onPressed: () => _showDetailDialog(item, isCustomer),
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

  Widget _buildCardView(List<dynamic> list, bool isCustomer) {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: list.length,
      itemBuilder: (context, index) {
        final item = list[index];
        final status = item['trangThai'] ?? '';
        final ma = item['maDT'] ?? item['maPT'];
        final ten = item['tenKhachHang'] ?? item['tenNhaCungCap'] ?? 'N/A';
        final ngay = item['ngayDT'] ?? item['ngayTra'];

        return Card(
          elevation: 2,
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: ListTile(
            contentPadding: const EdgeInsets.all(16),
            leading: CircleAvatar(
              backgroundColor: _getStatusColor(status).withValues(alpha: 0.1),
              child: Icon(isCustomer ? Icons.assignment_return : Icons.outbox, color: _getStatusColor(status)),
            ),
            title: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(ma.toString(), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.blue)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(color: _getStatusColor(status).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                  child: Text(status, style: TextStyle(color: _getStatusColor(status), fontWeight: FontWeight.bold, fontSize: 12)),
                ),
              ],
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 8),
                Text('${isCustomer ? "Khách hàng" : "Nhà cung cấp"}: $ten'),
                const SizedBox(height: 4),
                Text('Ngày yêu cầu: ${ngay != null ? DateFormat('dd/MM/yyyy').format(DateTime.parse(ngay)) : 'N/A'} | Lý do: ${item['lyDo'] ?? "Không có"}'),
                const SizedBox(height: 8),
                Text('Tổng tiền hoàn: ${NumberFormat.currency(locale: 'vi_VN', symbol: 'đ').format(item['tongTienHoan'] ?? 0)}', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.red.shade700, fontSize: 15)),
              ],
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 16),
            onTap: () => _showDetailDialog(item, isCustomer),
          ),
        );
      },
    );
  }
}
