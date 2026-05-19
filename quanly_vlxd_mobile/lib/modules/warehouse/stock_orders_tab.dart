import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';
import '../../services/shared_preferences_service.dart';
import '../../core/permission_helper.dart';


class StockOrdersTab extends StatefulWidget {
  const StockOrdersTab({super.key});

  @override
  State<StockOrdersTab> createState() => _StockOrdersTabState();
}

class _StockOrdersTabState extends State<StockOrdersTab> {
  final ApiService _apiService = ApiService();
  List<dynamic> _procurements = [];
  List<dynamic> _filteredProcurements = [];
  bool _isLoading = false;

  // Bộ lọc y như Web
  String _searchQuery = '';
  String _selectedStatus = 'Tất cả';
  DateTime? _startDate;
  DateTime? _endDate;
  bool _isTableView = true; // Chế độ hiển thị dạng Bảng (Table) giống web hoặc dạng Thẻ (Card)

  final List<String> _statusList = [
    'Tất cả',
    'Đề Xuất',
    'Chờ Duyệt',
    'Đã Duyệt',
    'Hoàn Thành',
    'Đã Tách',
    'Từ Chối',
    'Yêu Cầu Sửa',
    'Đang xử lý',
  ];

  @override
  void initState() {
    super.initState();
    _loadProcurements();
  }

  Future<void> _loadProcurements() async {
    setState(() => _isLoading = true);
    try {
      final response = await _apiService.getProcurements();
      if (response.statusCode == 200 && response.data != null) {
        if (!mounted) return;
        setState(() {
          _procurements = response.data;
          _applyFilters();
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi tải danh sách phiếu nhập: $e'), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _applyFilters() {
    setState(() {
      _filteredProcurements = _procurements.where((item) {
        // Lọc tìm kiếm nhanh
        final maPN = (item['maPN'] ?? item['maPhieuNhap'] ?? '').toString().toLowerCase();
        final tenNCC = (item['tenNhaCungCap'] ?? '').toString().toLowerCase();
        final tenNV = (item['tenNhanVien'] ?? '').toString().toLowerCase();
        final matchQuery = maPN.contains(_searchQuery.toLowerCase()) ||
            tenNCC.contains(_searchQuery.toLowerCase()) ||
            tenNV.contains(_searchQuery.toLowerCase());

        // Lọc trạng thái
        final trangThai = (item['trangThai'] ?? '').toString();
        final matchStatus = _selectedStatus == 'Tất cả' || trangThai.toLowerCase() == _selectedStatus.toLowerCase();

        // Lọc ngày
        bool matchDate = true;
        if (_startDate != null && _endDate != null) {
          try {
            final dateStr = item['ngayNhap'] ?? item['ngayTao'];
            if (dateStr != null) {
              final itemDate = DateTime.parse(dateStr.toString());
              matchDate = itemDate.isAfter(_startDate!.subtract(const Duration(days: 1))) &&
                  itemDate.isBefore(_endDate!.add(const Duration(days: 1)));
            }
          } catch (_) {}
        }

        return matchQuery && matchStatus && matchDate;
      }).toList();
    });
  }

  Future<void> _selectDateRange() async {
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
      initialDateRange: _startDate != null && _endDate != null
          ? DateTimeRange(start: _startDate!, end: _endDate!)
          : null,
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: Theme.of(context).colorScheme.primary,
              onPrimary: Colors.white,
              surface: Colors.white,
              onSurface: Colors.black,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        _startDate = picked.start;
        _endDate = picked.end;
        _applyFilters();
      });
    }
  }

  // Lấy màu badge trạng thái y như Web
  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'hoàn thành':
      case 'đã xử lý đổi trả':
      case 'đã duyệt':
        return Colors.green.shade700;
      case 'đề xuất':
      case 'chờ duyệt':
      case 'đang xử lý':
        return Colors.blue.shade700;
      case 'yêu cầu sửa':
      case 'nhập thiếu (cần đổi trả)':
        return Colors.orange.shade700;
      case 'từ chối':
        return Colors.red.shade700;
      case 'đã tách':
      default:
        return Colors.grey.shade600;
    }
  }

  // =========================================================================
  // XEM CHI TIẾT PHIẾU NHẬP & CÁC THAO TÁC DUYỆT / NHẬN HÀNG
  // =========================================================================
  void _showProcurementDetailDialog(Map<String, dynamic> procurement) async {
    final int id = procurement['maPhieuNhap'];
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Center(child: const CircularProgressIndicator()),
    );

    try {
      final response = await _apiService.getProcurementDetail(id);
      if (!mounted) return;
      Navigator.pop(context); // Đóng loading

      if (response.statusCode == 200 && response.data != null) {
        _showDetailPopup(response.data);
      }
    } catch (e) {
      if (!mounted) return;
      Navigator.pop(context); // Đóng loading
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi tải chi tiết phiếu: $e'), backgroundColor: Colors.red),
      );
    }
  }

  void _showDetailPopup(Map<String, dynamic> detail) {
    final chiTiet = (detail['chiTiet'] as List<dynamic>?) ?? [];
    final currentStatus = detail['trangThai'] ?? '';

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(Icons.description, color: Theme.of(context).colorScheme.primary),
                  const SizedBox(width: 8),
                  Text('Chi Tiết Phiếu: ${detail['maPN'] ?? detail['maPhieuNhap']}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(color: _getStatusColor(currentStatus).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                child: Text(currentStatus, style: TextStyle(color: _getStatusColor(currentStatus), fontWeight: FontWeight.bold, fontSize: 14)),
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
                  // Thông tin chung
                  Card(
                    color: Colors.grey.shade50,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: Colors.grey.shade200)),
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Nhà cung cấp: ${detail['tenNhaCungCap']}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                          const SizedBox(height: 8),
                          Text('Ngày lập: ${detail['ngayNhap'] != null ? DateFormat('dd/MM/yyyy HH:mm').format(DateTime.parse(detail['ngayNhap'])) : 'N/A'}'),
                          const SizedBox(height: 8),
                          Text('Ghi chú: ${detail['ghiChu'] ?? 'Không có'}'),
                          const Divider(height: 24),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Tổng tiền phiếu:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                              Text(NumberFormat.currency(locale: 'vi_VN', symbol: 'đ').format(detail['tongTien'] ?? 0), style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.red.shade700)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text('DANH SÁCH MẶT HÀNG:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.black87)),
                  const SizedBox(height: 12),
                  // Bảng mặt hàng
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: DataTable(
                      headingRowColor: WidgetStateProperty.all(Colors.grey.shade100),
                      columns: const [
                        DataColumn(label: Text('Mặt Hàng', style: TextStyle(fontWeight: FontWeight.bold))),
                        DataColumn(label: Text('Số Lượng', style: TextStyle(fontWeight: FontWeight.bold))),
                        DataColumn(label: Text('Đơn Giá', style: TextStyle(fontWeight: FontWeight.bold))),
                        DataColumn(label: Text('Thành Tiền', style: TextStyle(fontWeight: FontWeight.bold))),
                        DataColumn(label: Text('Kho Hàng', style: TextStyle(fontWeight: FontWeight.bold))),
                        DataColumn(label: Text('Trạng Thái', style: TextStyle(fontWeight: FontWeight.bold))),
                      ],
                      rows: chiTiet.map((item) {
                        return DataRow(
                          cells: [
                            DataCell(Text(item['tenSanPham'] ?? 'SP #${item['maSanPham']}', style: const TextStyle(fontWeight: FontWeight.bold))),
                            DataCell(Text('${item['soLuong']} (Đã nhận: ${item['soLuongDaNhan'] ?? 0})')),
                            DataCell(Text(NumberFormat.currency(locale: 'vi_VN', symbol: 'đ').format(item['donGia'] ?? 0))),
                            DataCell(Text(NumberFormat.currency(locale: 'vi_VN', symbol: 'đ').format(item['thanhTien'] ?? 0), style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blue))),
                            DataCell(Text(item['tenKhoHang'] ?? 'Kho #1')),
                            DataCell(
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(color: _getStatusColor(item['trangThai'] ?? '').withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                                child: Text(item['trangThai'] ?? 'N/A', style: TextStyle(color: _getStatusColor(item['trangThai'] ?? ''), fontSize: 12, fontWeight: FontWeight.bold)),
                              ),
                            ),
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
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('ĐÓNG', style: TextStyle(color: Colors.grey)),
            ),
            // Nút Thao tác dựa theo trạng thái
            if (PermissionHelper.canEdit('PROCUREMENT')) ...[
              if (currentStatus == 'Đề Xuất' || currentStatus == 'Chờ Duyệt' || currentStatus == 'Yêu Cầu Sửa' || currentStatus == 'Đang xử lý') ...[
                ElevatedButton.icon(
                  onPressed: () => _handleRejectProposal(detail['maPhieuNhap']),
                  icon: const Icon(Icons.cancel),
                  label: const Text('TỪ CHỐI'),
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
                ),
                ElevatedButton.icon(
                  onPressed: () => _handleApproveProposal(detail['maPhieuNhap']),
                  icon: const Icon(Icons.check_circle),
                  label: const Text('DUYỆT ĐỀ XUẤT'),
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
                ),
              ],
              if (currentStatus == 'Đã Duyệt') ...[
                ElevatedButton.icon(
                  onPressed: () => _showReceiveItemsPopup(detail),
                  icon: const Icon(Icons.input),
                  label: const Text('KIỂM ĐẾM NHẬP KHO'),
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.blue.shade700, foregroundColor: Colors.white),
                ),
              ],
            ],
          ],
        );
      },
    );
  }

  // Thao tác Duyệt Phiếu
  void _handleApproveProposal(int id) async {
    Navigator.pop(context); // Đóng popup chi tiết
    setState(() => _isLoading = true);
    try {
      final response = await _apiService.approveProcurement(id, {'userId': 1}); // Giả định userId 1
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(response.data['message'] ?? 'Đã duyệt đề xuất thành công!'), backgroundColor: Colors.green),
      );
      _loadProcurements();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi duyệt phiếu: $e'), backgroundColor: Colors.red),
      );
      setState(() => _isLoading = false);
    }
  }

  // Thao tác Từ Chối Phiếu
  void _handleRejectProposal(int id) async {
    Navigator.pop(context); // Đóng popup
    final TextEditingController reasonController = TextEditingController();

    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Từ chối đề xuất'),
        content: TextField(
          controller: reasonController,
          decoration: const InputDecoration(labelText: 'Lý do từ chối', border: OutlineInputBorder()),
          maxLines: 3,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('HỦY')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
            child: const Text('XÁC NHẬN TỪ CHỐI'),
          ),
        ],
      ),
    );

    if (confirm == true && reasonController.text.isNotEmpty) {
      setState(() => _isLoading = true);
      try {
        final response = await _apiService.rejectProcurement(id, {'lyDo': reasonController.text, 'userId': 1});
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(response.data['message'] ?? 'Đã từ chối phiếu!'), backgroundColor: Colors.green),
        );
        _loadProcurements();
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi từ chối phiếu: $e'), backgroundColor: Colors.red),
        );
        setState(() => _isLoading = false);
      }
    }
  }

  // Popup Kiểm đếm và Nhận hàng vào kho
  void _showReceiveItemsPopup(Map<String, dynamic> detail) {
    Navigator.pop(context); // Đóng popup chi tiết
    final chiTiet = (detail['chiTiet'] as List<dynamic>?) ?? [];
    final List<Map<String, dynamic>> receivePayload = chiTiet.map((item) {
      return {
        'maCTPN': item['maCTPN'],
        'maSanPham': item['maSanPham'],
        'tenSanPham': item['tenSanPham'],
        'soLuong': item['soLuong'],
        'soLuongDaNhan': item['soLuong'], // Mặc định điền đủ số lượng
        'maKhoHang': item['maKhoHang'] ?? 1,
        'controller': TextEditingController(text: item['soLuong'].toString()),
      };
    }).toList();

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text('Kiểm Đếm & Nhập Kho', style: TextStyle(fontWeight: FontWeight.bold)),
          content: SizedBox(
            width: double.maxFinite,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: receivePayload.map((item) {
                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: Padding(
                      padding: const EdgeInsets.all(12.0),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(item['tenSanPham'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                                const SizedBox(height: 4),
                                Text('Số lượng cần nhập: ${item['soLuong']}'),
                              ],
                            ),
                          ),
                          SizedBox(
                            width: 100,
                            child: TextField(
                              controller: item['controller'],
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(labelText: 'Thực nhận', border: OutlineInputBorder()),
                              onChanged: (val) {
                                item['soLuongDaNhan'] = int.tryParse(val) ?? 0;
                              },
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('HỦY', style: TextStyle(color: Colors.grey))),
            ElevatedButton.icon(
              onPressed: () async {
                Navigator.pop(context);
                setState(() => _isLoading = true);
                try {
                  final payload = receivePayload.map((item) => {
                    'maCTPN': item['maCTPN'],
                    'soLuongDaNhan': item['soLuongDaNhan'],
                    'maKhoHang': item['maKhoHang'],
                    'userId': 1,
                  }).toList();

                  final response = await _apiService.receiveProcurementItems(detail['maPhieuNhap'], payload);
                  if (!mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(response.data['message'] ?? 'Đã nhập kho thành công!'), backgroundColor: Colors.green),
                  );
                  _loadProcurements();
                } catch (e) {
                  if (!mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Lỗi nhập kho: $e'), backgroundColor: Colors.red),
                  );
                  setState(() => _isLoading = false);
                }
              },
              icon: const Icon(Icons.save),
              label: const Text('XÁC NHẬN NHẬP KHO'),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
            ),
          ],
        );
      },
    );
  }

  // =========================================================================
  // FORM TẠO ĐỀ XUẤT NHẬP HÀNG MỚI
  // =========================================================================
  void _showCreateProposalPopup() async {
    // Tải danh sách nhà cung cấp và sản phẩm để chọn
    setState(() => _isLoading = true);
    List<dynamic> suppliers = [];
    List<dynamic> products = [];
    try {
      final resSuppliers = await _apiService.getSuppliers();
      final resProducts = await _apiService.getProducts();
      if (resSuppliers.statusCode == 200) suppliers = resSuppliers.data;
      if (resProducts.statusCode == 200) products = resProducts.data;
    } catch (_) {}
    if (!mounted) return;
    setState(() => _isLoading = false);

    int? selectedSupplierId = suppliers.isNotEmpty ? suppliers[0]['maNhaCungCap'] : null;
    List<Map<String, dynamic>> selectedItems = [];

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setPopupState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: const Text('Tạo Đề Xuất Nhập Hàng Mới', style: TextStyle(fontWeight: FontWeight.bold)),
              content: SizedBox(
                width: double.maxFinite,
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Chọn Nhà cung cấp
                      const Text('Nhà cung cấp:', style: TextStyle(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      DropdownButtonFormField<int>(
                        value: selectedSupplierId,
                        decoration: InputDecoration(border: OutlineInputBorder(borderRadius: BorderRadius.circular(8))),
                        items: suppliers.map<DropdownMenuItem<int>>((s) {
                          return DropdownMenuItem<int>(
                            value: s['maNhaCungCap'],
                            child: Text(s['tenNCC'] ?? s['tenNhaCungCap'] ?? ''),
                          );
                        }).toList(),
                        onChanged: (val) => setPopupState(() => selectedSupplierId = val),
                      ),
                      const SizedBox(height: 20),
                      // Chọn Sản phẩm
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Danh sách sản phẩm:', style: TextStyle(fontWeight: FontWeight.bold)),
                          ElevatedButton.icon(
                            onPressed: () {
                              if (products.isEmpty) return;
                              setPopup(products, selectedItems, setPopupState);
                            },
                            icon: const Icon(Icons.add),
                            label: const Text('THÊM SP'),
                            style: ElevatedButton.styleFrom(backgroundColor: Theme.of(context).colorScheme.primary, foregroundColor: Colors.white),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      if (selectedItems.isEmpty)
                        const Padding(padding: EdgeInsets.all(16.0), child: Text('Chưa có sản phẩm nào được chọn', style: TextStyle(color: Colors.grey, fontStyle: FontStyle.italic)))
                      else
                        Column(
                          children: selectedItems.map((item) {
                            return Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              child: Padding(
                                padding: const EdgeInsets.all(12.0),
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(item['tenSP'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                                          const SizedBox(height: 4),
                                          Row(
                                            children: [
                                              Expanded(
                                                child: TextFormField(
                                                  initialValue: item['soLuong'].toString(),
                                                  keyboardType: TextInputType.number,
                                                  decoration: const InputDecoration(labelText: 'Số lượng', isDense: true),
                                                  onChanged: (val) => setPopupState(() => item['soLuong'] = int.tryParse(val) ?? 1),
                                                ),
                                              ),
                                              const SizedBox(width: 12),
                                              Expanded(
                                                child: TextFormField(
                                                  initialValue: item['donGia'].toString(),
                                                  keyboardType: TextInputType.number,
                                                  decoration: const InputDecoration(labelText: 'Đơn giá (đ)', isDense: true),
                                                  onChanged: (val) => setPopupState(() => item['donGia'] = double.tryParse(val) ?? 0.0),
                                                ),
                                              ),
                                            ],
                                          )
                                        ],
                                      ),
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.delete, color: Colors.red),
                                      onPressed: () => setPopupState(() => selectedItems.remove(item)),
                                    )
                                  ],
                                ),
                              ),
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
                  onPressed: selectedItems.isEmpty ? null : () async {
                    Navigator.pop(context);
                    setState(() => _isLoading = true);
                    try {
                      final payload = {
                        'maNhaCungCap': selectedSupplierId,
                        'maNhanVien': 1,
                        'ngayNhap': DateTime.now().toIso8601String(),
                        'ghiChu': 'Đề xuất nhập hàng từ Mobile',
                        'chiTiet': selectedItems.map((i) => {
                          'maSanPham': i['maSP'],
                          'soLuong': i['soLuong'],
                          'donGia': i['donGia'],
                          'maKhoHang': 1,
                          'maNhaCungCap': selectedSupplierId,
                        }).toList(),
                      };

                      final response = await _apiService.createProcurementProposal(payload);
                      if (!mounted) return;
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(response.data['message'] ?? 'Đã tạo đề xuất thành công!'), backgroundColor: Colors.green),
                      );
                      _loadProcurements();
                    } catch (e) {
                      if (!mounted) return;
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Lỗi tạo đề xuất: $e'), backgroundColor: Colors.red),
                      );
                      setState(() => _isLoading = false);
                    }
                  },
                  icon: const Icon(Icons.send),
                  label: const Text('GỬI ĐỀ XUẤT'),
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void setPopup(List<dynamic> products, List<Map<String, dynamic>> selectedItems, void Function(void Function()) setPopupState) {
    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: const Text('Chọn Sản Phẩm'),
          content: SizedBox(
            width: double.maxFinite,
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: products.length,
              itemBuilder: (ctx, idx) {
                final p = products[idx];
                return ListTile(
                  title: Text(p['tenSP'] ?? p['tenSanPham'] ?? ''),
                  subtitle: Text('Giá hiện tại: ${NumberFormat.currency(locale: 'vi_VN', symbol: 'đ').format(p['giaBan'] ?? 0)}'),
                  trailing: const Icon(Icons.add_circle, color: Colors.green),
                  onTap: () {
                    setPopupState(() {
                      selectedItems.add({
                        'maSP': p['maSP'] ?? p['maSanPham'],
                        'tenSP': p['tenSP'] ?? p['tenSanPham'],
                        'soLuong': 10,
                        'donGia': (p['giaNhap'] ?? p['giaBan'] ?? 0) * 0.8, // Ước tính giá nhập
                      });
                    });
                    Navigator.pop(ctx);
                  },
                );
              },
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade100,
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
                  // Hàng đầu tiên: Các nút chức năng & Bộ lọc
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Wrap(
                        spacing: 8,
                        children: [
                          // Toggle Bảng / Thẻ
                          IconButton(
                            icon: Icon(_isTableView ? Icons.grid_view : Icons.table_chart, color: Theme.of(context).colorScheme.primary),
                            tooltip: _isTableView ? 'Chuyển sang dạng Thẻ' : 'Chuyển sang dạng Bảng',
                            onPressed: () => setState(() => _isTableView = !_isTableView),
                          ),
                          // Nút Bộ lọc Ngày
                          OutlinedButton.icon(
                            onPressed: _selectDateRange,
                            icon: const Icon(Icons.calendar_month, size: 18),
                            label: Text(
                              _startDate != null && _endDate != null
                                  ? '${DateFormat('dd/MM').format(_startDate!)} - ${DateFormat('dd/MM').format(_endDate!)}'
                                  : 'Khoảng thời gian',
                            ),
                          ),
                          // Dropdown Trạng thái
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            decoration: BoxDecoration(border: Border.all(color: Colors.grey.shade300), borderRadius: BorderRadius.circular(8)),
                            child: DropdownButton<String>(
                              value: _selectedStatus,
                              underline: const SizedBox(),
                              icon: const Icon(Icons.filter_list, size: 18),
                              items: _statusList.map((s) => DropdownMenuItem(value: s, child: Text(s, style: const TextStyle(fontSize: 14)))).toList(),
                              onChanged: (val) {
                                if (val != null) {
                                  setState(() {
                                    _selectedStatus = val;
                                    _applyFilters();
                                  });
                                }
                              },
                            ),
                          ),
                        ],
                      ),
                      // Nút Xuất Excel
                      ElevatedButton.icon(
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Đang xuất file Excel Đơn Nhập Hàng...'), backgroundColor: Colors.green));
                        },
                        icon: const Icon(Icons.download, size: 18),
                        label: const Text('Xuất'),
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.green.shade700, foregroundColor: Colors.white),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  // Hàng thứ hai: Tìm kiếm & Thêm mới
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          decoration: InputDecoration(
                            hintText: 'Tìm kiếm nhanh mã phiếu, NCC, người lập...',
                            prefixIcon: const Icon(Icons.search),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          ),
                          onChanged: (val) {
                            setState(() {
                              _searchQuery = val;
                              _applyFilters();
                            });
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      if (PermissionHelper.canCreate('PROCUREMENT'))
                        ElevatedButton.icon(
                          onPressed: _showCreateProposalPopup,
                          icon: const Icon(Icons.add),
                          label: const Text('THÊM ĐỀ XUẤT', style: TextStyle(fontWeight: FontWeight.bold)),
                          style: ElevatedButton.styleFrom(backgroundColor: Theme.of(context).colorScheme.primary, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14)),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          // Bảng hoặc Danh sách dữ liệu
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _filteredProcurements.isEmpty
                    ? const Center(child: Text('Không tìm thấy phiếu nhập nào phù hợp', style: TextStyle(color: Colors.grey, fontSize: 16)))
                    : _isTableView
                        ? _buildTableView()
                        : _buildCardView(),
          ),
        ],
      ),
    );
  }

  // Giao diện Bảng (Table View) y như Web
  Widget _buildTableView() {
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
              DataColumn(label: Text('Mã Phiếu', style: TextStyle(fontWeight: FontWeight.bold))),
              DataColumn(label: Text('Ngày Lập', style: TextStyle(fontWeight: FontWeight.bold))),
              DataColumn(label: Text('Nhà Cung Cấp', style: TextStyle(fontWeight: FontWeight.bold))),
              DataColumn(label: Text('Tổng Tiền', style: TextStyle(fontWeight: FontWeight.bold))),
              DataColumn(label: Text('Người Lập', style: TextStyle(fontWeight: FontWeight.bold))),
              DataColumn(label: Text('Trạng Thái', style: TextStyle(fontWeight: FontWeight.bold))),
              DataColumn(label: Text('Tác Vụ', style: TextStyle(fontWeight: FontWeight.bold))),
            ],
            rows: _filteredProcurements.map((item) {
              final status = item['trangThai'] ?? '';
              return DataRow(
                cells: [
                  DataCell(
                    TextButton(
                      onPressed: () => _showProcurementDetailDialog(item),
                      child: Text(item['maPN'] ?? item['maPhieuNhap'].toString(), style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blue)),
                    ),
                  ),
                  DataCell(Text(item['ngayNhap'] != null ? DateFormat('dd/MM/yyyy').format(DateTime.parse(item['ngayNhap'])) : 'N/A')),
                  DataCell(Text(item['tenNhaCungCap'] ?? 'N/A')),
                  DataCell(Text(NumberFormat.currency(locale: 'vi_VN', symbol: 'đ').format(item['tongTien'] ?? 0), style: const TextStyle(fontWeight: FontWeight.bold))),
                  DataCell(Text(item['tenNhanVien'] ?? 'Nguyễn Minh Đức')),
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
                      onPressed: () => _showProcurementDetailDialog(item),
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

  // Giao diện Thẻ (Card View) tối ưu di động
  Widget _buildCardView() {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: _filteredProcurements.length,
      itemBuilder: (context, index) {
        final item = _filteredProcurements[index];
        final status = item['trangThai'] ?? '';

        return Card(
          elevation: 2,
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: ListTile(
            contentPadding: const EdgeInsets.all(16),
            leading: CircleAvatar(
              backgroundColor: _getStatusColor(status).withValues(alpha: 0.1),
              child: Icon(Icons.move_to_inbox, color: _getStatusColor(status)),
            ),
            title: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(item['maPN'] ?? item['maPhieuNhap'].toString(), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.blue)),
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
                Text('Nhà cung cấp: ${item['tenNhaCungCap']}'),
                const SizedBox(height: 4),
                Text('Ngày lập: ${item['ngayNhap'] != null ? DateFormat('dd/MM/yyyy').format(DateTime.parse(item['ngayNhap'])) : 'N/A'} | Người lập: ${item['tenNhanVien'] ?? 'N/A'}'),
                const SizedBox(height: 8),
                Text('Tổng tiền: ${NumberFormat.currency(locale: 'vi_VN', symbol: 'đ').format(item['tongTien'] ?? 0)}', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.red.shade700, fontSize: 15)),
              ],
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 16),
            onTap: () => _showProcurementDetailDialog(item),
          ),
        );
      },
    );
  }
}
