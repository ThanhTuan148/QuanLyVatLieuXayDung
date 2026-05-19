import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import 'package:intl/intl.dart';
import '../../core/permission_helper.dart';


class PromotionsTab extends StatefulWidget {
  const PromotionsTab({super.key});

  @override
  State<PromotionsTab> createState() => _PromotionsTabState();
}

class _PromotionsTabState extends State<PromotionsTab> with SingleTickerProviderStateMixin {
  final ApiService _apiService = ApiService();
  late TabController _tabController;

  List<dynamic> _promotions = [];
  bool _isLoading = true;
  String? _error;
  String _searchQuery = '';

  final NumberFormat _currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        setState(() {}); // Cập nhật nút Tạo tương ứng với Tab
      }
    });
    _fetchPromotions();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchPromotions() async {
    setState(() => _isLoading = true);
    try {
      final response = await _apiService.getPromotions();
      if (response.statusCode == 200 && response.data != null) {
        if (mounted) {
          setState(() {
            _promotions = response.data is List ? response.data : [response.data];
            _isLoading = false;
            _error = null;
          });
        }
      } else {
        if (mounted) {
          setState(() {
            _error = 'Lỗi tải dữ liệu: ${response.statusCode}';
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Không thể kết nối Backend.\nĐang hiển thị dữ liệu mẫu.';
          _promotions = _getMockPromotions();
          _isLoading = false;
        });
      }
    }
  }

  List<dynamic> _getMockPromotions() {
    final now = DateTime.now();
    return [
      {
        "maKhuyenMai": 1, "maKM": "KM01", "loaiKM": "SanPham", "tenKM": "Mùa Xây Dựng 2026", "moTa": "Giảm giá sâu các mặt hàng thiết yếu",
        "hangThanhVien": "Mọi hạng", "loaiGiamGia": "PhanTram", "giaTriGiam": 20, "donHangToiThieu": 0,
        "thoiGianBatDau": now.subtract(const Duration(days: 10)).toIso8601String(),
        "thoiGianKetThuc": now.add(const Duration(days: 30)).toIso8601String(),
        "trangThai": true, "targets": [{"maSanPham": 1}, {"maSanPham": 2}, {"maSanPham": 3}]
      },
      {
        "maKhuyenMai": 2, "maKM": "FL01", "loaiKM": "GiaSoc", "tenKM": "Đại tiệc tháng 5", "moTa": "Flash sale giá sốc",
        "hangThanhVien": "Mọi hạng", "loaiGiamGia": "PhanTram", "giaTriGiam": 30, "donHangToiThieu": 0,
        "thoiGianBatDau": now.subtract(const Duration(days: 2)).toIso8601String(),
        "thoiGianKetThuc": now.add(const Duration(days: 5)).toIso8601String(),
        "trangThai": true, "targets": [{"maSanPham": 1}, {"maSanPham": 2}, {"maSanPham": 3}, {"maSanPham": 4}, {"maSanPham": 5}, {"maSanPham": 6}]
      },
      {
        "maKhuyenMai": 3, "maKM": "UD01", "loaiKM": "UuDai", "tenKM": "Hè sales tưng bừng", "maApDung": "HESALES", "moTa": "Giảm trực tiếp tiền mặt",
        "hangThanhVien": "Mọi hạng", "loaiGiamGia": "SoTien", "giaTriGiam": 50000, "donHangToiThieu": 800000,
        "thoiGianBatDau": now.subtract(const Duration(days: 5)).toIso8601String(),
        "thoiGianKetThuc": now.add(const Duration(days: 20)).toIso8601String(),
        "soLuongToiDa": 10, "soLuongDaDung": 0, "trangThai": true
      },
      {
        "maKhuyenMai": 4, "maKM": "UD02", "loaiKM": "UuDai", "tenKM": "Thang5", "maApDung": "THANG5", "moTa": "Miễn phí vận chuyển",
        "hangThanhVien": "Mọi hạng", "loaiGiamGia": "Freeship", "giaTriGiam": 30000, "donHangToiThieu": 500000,
        "thoiGianBatDau": now.subtract(const Duration(days: 5)).toIso8601String(),
        "thoiGianKetThuc": now.add(const Duration(days: 15)).toIso8601String(),
        "soLuongToiDa": 50, "soLuongDaDung": 0, "trangThai": true
      },
      {
        "maKhuyenMai": 5, "maKM": "CP01", "loaiKM": "Coupon", "tenKM": "Summer Coupon", "maApDung": "SUMMER20", "moTa": "Coupon giảm tiền",
        "hangThanhVien": "Mọi hạng", "loaiGiamGia": "SoTien", "giaTriGiam": 20000, "donHangToiThieu": 0,
        "thoiGianBatDau": now.subtract(const Duration(days: 15)).toIso8601String(),
        "thoiGianKetThuc": now.add(const Duration(days: 40)).toIso8601String(),
        "soLuongToiDa": 20, "soLuongDaDung": 0, "trangThai": true
      },
    ];
  }

  // =========================================================================
  // DIALOG THÊM / SỬA CHUNG CHO CẢ 4 LOẠI
  // =========================================================================
  Future<void> _showAddEditDialog(String loaiKM, [Map<String, dynamic>? promo]) async {
    final isEdit = promo != null;
    final tenCtrl = TextEditingController(text: isEdit ? (promo['tenKM'] ?? promo['TenKM'] ?? '').toString() : '');
    final moTaCtrl = TextEditingController(text: isEdit ? (promo['moTa'] ?? promo['MoTa'] ?? '').toString() : '');
    final maApDungCtrl = TextEditingController(text: isEdit ? (promo['maApDung'] ?? promo['MaApDung'] ?? '').toString() : '');
    final giaTriCtrl = TextEditingController(text: isEdit ? (promo['giaTriGiam'] ?? promo['GiaTriGiam'] ?? 0).toString() : '0');
    final donToiThieuCtrl = TextEditingController(text: isEdit ? (promo['donHangToiThieu'] ?? promo['DonHangToiThieu'] ?? 0).toString() : '0');
    final soLuongCtrl = TextEditingController(text: isEdit ? (promo['soLuongToiDa'] ?? promo['SoLuongToiDa'] ?? 100).toString() : '100');
    
    String loaiGiam = isEdit ? (promo['loaiGiamGia'] ?? promo['LoaiGiamGia'] ?? 'PhanTram').toString() : 'PhanTram';
    String hangApDung = isEdit ? (promo['hangThanhVien'] ?? promo['HangThanhVien'] ?? 'Mọi hạng').toString() : 'Mọi hạng';
    bool trangThai = isEdit ? (promo['trangThai'] ?? promo['TrangThai'] ?? true) : true;

    DateTime startDt = isEdit && promo['thoiGianBatDau'] != null ? DateTime.parse(promo['thoiGianBatDau'].toString()) : DateTime.now();
    DateTime endDt = isEdit && promo['thoiGianKetThuc'] != null ? DateTime.parse(promo['thoiGianKetThuc'].toString()) : DateTime.now().add(const Duration(days: 30));

    final formKey = GlobalKey<FormState>();

    // Tiêu đề Dialog
    String titleStr = isEdit ? 'Sửa ' : 'Thêm ';
    if (loaiKM == 'SanPham') titleStr += 'Khuyến Mãi Sản Phẩm';
    else if (loaiKM == 'GiaSoc') titleStr += 'Flash Sale';
    else if (loaiKM == 'UuDai') titleStr += 'Ưu Đãi Hệ Thống';
    else titleStr += 'Coupon';

    await showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: Text(titleStr, style: const TextStyle(fontWeight: FontWeight.bold)),
              content: SingleChildScrollView(
                child: Form(
                  key: formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Tên chương trình (ẩn nếu là Coupon vì Coupon dùng Mã Code làm chính)
                      if (loaiKM != 'Coupon') ...[
                        TextFormField(
                          controller: tenCtrl,
                          decoration: InputDecoration(labelText: loaiKM == 'GiaSoc' ? 'Tiêu đề Flash Sale' : 'Tên chương trình / ưu đãi', border: const OutlineInputBorder()),
                          validator: (val) => val == null || val.isEmpty ? 'Vui lòng nhập tên' : null,
                        ),
                        const SizedBox(height: 12),
                      ],

                      // Mã Code (chỉ dành cho Ưu đãi hệ thống và Coupon)
                      if (loaiKM == 'UuDai' || loaiKM == 'Coupon') ...[
                        TextFormField(
                          controller: maApDungCtrl,
                          decoration: const InputDecoration(labelText: 'Mã Code (VD: SUMMER20)', border: OutlineInputBorder()),
                          validator: (val) => val == null || val.isEmpty ? 'Vui lòng nhập mã code' : null,
                        ),
                        const SizedBox(height: 12),
                      ],

                      // Mô tả
                      TextFormField(
                        controller: moTaCtrl,
                        decoration: const InputDecoration(labelText: 'Mô tả chi tiết', border: OutlineInputBorder()),
                      ),
                      const SizedBox(height: 12),

                      // Loại giảm giá
                      DropdownButtonFormField<String>(
                        value: loaiGiam,
                        decoration: const InputDecoration(labelText: 'Loại giảm giá', border: OutlineInputBorder()),
                        items: const [
                          DropdownMenuItem(value: 'PhanTram', child: Text('Giảm theo Phần trăm (%)')),
                          DropdownMenuItem(value: 'SoTien', child: Text('Giảm trực tiếp Số tiền (đ)')),
                          DropdownMenuItem(value: 'Freeship', child: Text('Miễn phí vận chuyển (Freeship)')),
                        ],
                        onChanged: (val) => setDialogState(() => loaiGiam = val!),
                      ),
                      const SizedBox(height: 12),

                      // Giá trị giảm & Đơn tối thiểu
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: giaTriCtrl,
                              keyboardType: TextInputType.number,
                              decoration: InputDecoration(labelText: loaiGiam == 'PhanTram' ? 'Mức giảm (%)' : 'Số tiền giảm (đ)', border: const OutlineInputBorder()),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: TextFormField(
                              controller: donToiThieuCtrl,
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(labelText: 'Đơn tối thiểu (đ)', border: OutlineInputBorder()),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Hạng thành viên & Số lượng tối đa
                      Row(
                        children: [
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              value: hangApDung,
                              decoration: const InputDecoration(labelText: 'Hạng áp dụng', border: OutlineInputBorder()),
                              items: const [
                                DropdownMenuItem(value: 'Mọi hạng', child: Text('Mọi hạng')),
                                DropdownMenuItem(value: 'Đồng', child: Text('Hạng Đồng')),
                                DropdownMenuItem(value: 'Bạc', child: Text('Hạng Bạc')),
                                DropdownMenuItem(value: 'Vàng', child: Text('Hạng Vàng')),
                                DropdownMenuItem(value: 'Kim Cương', child: Text('Kim Cương')),
                              ],
                              onChanged: (val) => setDialogState(() => hangApDung = val!),
                            ),
                          ),
                          if (loaiKM == 'UuDai' || loaiKM == 'Coupon') ...[
                            const SizedBox(width: 12),
                            Expanded(
                              child: TextFormField(
                                controller: soLuongCtrl,
                                keyboardType: TextInputType.number,
                                decoration: const InputDecoration(labelText: 'Tổng lượt dùng', border: OutlineInputBorder()),
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Thời gian bắt đầu & kết thúc
                      Row(
                        children: [
                          Expanded(
                            child: InkWell(
                              onTap: () async {
                                final dt = await showDatePicker(context: context, initialDate: startDt, firstDate: DateTime(2020), lastDate: DateTime(2030));
                                if (dt != null) setDialogState(() => startDt = dt);
                              },
                              child: InputDecorator(
                                decoration: const InputDecoration(labelText: 'Từ ngày', border: OutlineInputBorder()),
                                child: Text(DateFormat('dd/MM/yyyy').format(startDt)),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: InkWell(
                              onTap: () async {
                                final dt = await showDatePicker(context: context, initialDate: endDt, firstDate: DateTime(2020), lastDate: DateTime(2030));
                                if (dt != null) setDialogState(() => endDt = dt);
                              },
                              child: InputDecorator(
                                decoration: const InputDecoration(labelText: 'Đến ngày', border: OutlineInputBorder()),
                                child: Text(DateFormat('dd/MM/yyyy').format(endDt)),
                              ),
                            ),
                          ),
                        ],
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
                TextButton(onPressed: () => Navigator.pop(context), child: const Text('Hủy')),
                ElevatedButton(
                  onPressed: () async {
                    if (formKey.currentState!.validate()) {
                      Navigator.pop(context);
                      setState(() => _isLoading = true);

                      final data = {
                        'loaiKM': loaiKM,
                        'tenKM': loaiKM == 'Coupon' ? maApDungCtrl.text : tenCtrl.text,
                        'moTa': moTaCtrl.text,
                        'maApDung': maApDungCtrl.text,
                        'loaiGiamGia': loaiGiam,
                        'giaTriGiam': double.tryParse(giaTriCtrl.text) ?? 0,
                        'donHangToiThieu': double.tryParse(donToiThieuCtrl.text) ?? 0,
                        'hangThanhVien': hangApDung,
                        'soLuongToiDa': int.tryParse(soLuongCtrl.text) ?? 100,
                        'thoiGianBatDau': startDt.toIso8601String(),
                        'thoiGianKetThuc': endDt.toIso8601String(),
                        'trangThai': trangThai,
                      };

                      try {
                        if (isEdit) {
                          final id = promo['maKhuyenMai'] ?? promo['MaKhuyenMai'] ?? promo['id'];
                          await _apiService.updatePromotion(id, data);
                          if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cập nhật thành công!')));
                        } else {
                          await _apiService.createPromotion(data);
                          if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Thêm mới thành công!')));
                        }
                        _fetchPromotions();
                      } catch (e) {
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi: $e')));
                          _fetchPromotions();
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
      },
    );
  }

  Future<void> _deletePromotion(dynamic promo) async {
    final id = promo['maKhuyenMai'] ?? promo['MaKhuyenMai'] ?? promo['id'];
    final ten = promo['tenKM'] ?? promo['TenKM'] ?? promo['maApDung'] ?? '';

    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xác nhận xóa'),
        content: Text('Bạn có chắc chắn muốn xóa "$ten"?'),
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
        await _apiService.deletePromotion(id);
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Xóa thành công!')));
        _fetchPromotions();
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi khi xóa: $e')));
          _fetchPromotions();
        }
      }
    }
  }

  bool get _canCreateCurrentTab {
    if (_tabController.index == 0 || _tabController.index == 3) {
      return PermissionHelper.canCreate('PROMOTIONS');
    } else {
      return PermissionHelper.canCreate('FLASHSALES');
    }
  }

  Widget _buildPermissionDenied() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.lock, size: 64, color: Colors.grey),
          SizedBox(height: 16),
          Text('Bạn không có quyền xem dữ liệu này', style: TextStyle(color: Colors.grey, fontSize: 16)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Phân loại danh sách theo 4 Tab
    final filteredSanPham = _filterList('SanPham');
    final filteredFlashSale = _filterList('GiaSoc');
    final filteredUuDai = _filterList('UuDai');
    final filteredCoupon = _filterList('Coupon');

    return Scaffold(
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Quản Lý Chương Trình Ưu Đãi', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            Text('Quản lý tập trung Khuyến mãi sản phẩm, Flash Sales, Ưu đãi hệ thống và Coupon', style: TextStyle(fontSize: 12, fontWeight: FontWeight.normal)),
          ],
        ),
        backgroundColor: Colors.purple.shade800,
        foregroundColor: Colors.white,
        bottom: TabBar(
          controller: _tabController,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          indicatorColor: Colors.amber,
          indicatorWeight: 4,
          isScrollable: true,
          tabs: const [
            Tab(icon: Icon(Icons.local_offer), text: 'KHUYẾN MÃI SẢN PHẨM'),
            Tab(icon: Icon(Icons.flash_on), text: 'FLASH SALES'),
            Tab(icon: Icon(Icons.card_giftcard), text: 'ƯU ĐÃI HỆ THỐNG'),
            Tab(icon: Icon(Icons.confirmation_number), text: 'COUPON (NHẬP MÃ)'),
          ],
        ),
      ),
      floatingActionButton: _canCreateCurrentTab
          ? FloatingActionButton.extended(
              onPressed: () {
                if (_tabController.index == 0) _showAddEditDialog('SanPham');
                else if (_tabController.index == 1) _showAddEditDialog('GiaSoc');
                else if (_tabController.index == 2) _showAddEditDialog('UuDai');
                else _showAddEditDialog('Coupon');
              },
              icon: const Icon(Icons.add),
              label: Text(
                _tabController.index == 0 ? 'THÊM KHUYẾN MÃI' : (_tabController.index == 1 ? 'TẠO FLASH SALE' : (_tabController.index == 2 ? 'TẠO ƯU ĐÃI' : 'TẠO COUPON'))
              ),
              backgroundColor: Colors.pink.shade600,
              foregroundColor: Colors.white,
            )
          : null,
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Thông báo lỗi nếu có
                if (_error != null)
                  Container(
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 8, left: 16, right: 16, top: 12),
                    decoration: BoxDecoration(color: Colors.amber.shade100, borderRadius: BorderRadius.circular(8)),
                    child: Row(
                      children: [
                        const Icon(Icons.warning_amber_rounded, color: Colors.orange),
                        const SizedBox(width: 8),
                        Expanded(child: Text(_error!, style: TextStyle(color: Colors.orange.shade800, fontSize: 13, fontWeight: FontWeight.bold))),
                      ],
                    ),
                  ),

                // Thanh tìm kiếm nhanh
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: TextField(
                    onChanged: (val) => setState(() => _searchQuery = val),
                    decoration: InputDecoration(
                      hintText: 'Tìm kiếm nhanh (Tên, Mã Code)...',
                      prefixIcon: const Icon(Icons.search),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(30)),
                      contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 20),
                      filled: true,
                      fillColor: Colors.grey.shade100,
                    ),
                  ),
                ),

                // Nội dung 4 Tab
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      // TAB 1: KHUYẾN MÃI SẢN PHẨM
                      PermissionHelper.canView('PROMOTIONS') ? _buildSanPhamTab(filteredSanPham) : _buildPermissionDenied(),

                      // TAB 2: FLASH SALES
                      PermissionHelper.canView('FLASHSALES') ? _buildFlashSaleTab(filteredFlashSale) : _buildPermissionDenied(),

                      // TAB 3: ƯU ĐÃI HỆ THỐNG
                      PermissionHelper.canView('FLASHSALES') ? _buildUuDaiTab(filteredUuDai) : _buildPermissionDenied(),

                      // TAB 4: COUPON
                      PermissionHelper.canView('PROMOTIONS') ? _buildCouponTab(filteredCoupon) : _buildPermissionDenied(),
                    ],
                  ),
                ),
              ],
            ),
    );
  }

  List<dynamic> _filterList(String loai) {
    return _promotions.where((p) {
      final l = p['loaiKM'] ?? p['LoaiKM'] ?? 'SanPham';
      if (l.toString() != loai) return false;

      final ten = (p['tenKM'] ?? p['TenKM'] ?? '').toString().toLowerCase();
      final code = (p['maApDung'] ?? p['MaApDung'] ?? '').toString().toLowerCase();
      return ten.contains(_searchQuery.toLowerCase()) || code.contains(_searchQuery.toLowerCase());
    }).toList();
  }

  // =========================================================================
  // BẢNG TAB 1: KHUYẾN MÃI SẢN PHẨM
  // =========================================================================
  Widget _buildSanPhamTab(List<dynamic> list) {
    return list.isEmpty
        ? const Center(child: Text('Không tìm thấy khuyến mãi sản phẩm'))
        : SingleChildScrollView(
            scrollDirection: Axis.vertical,
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: DataTable(
                headingRowColor: WidgetStateProperty.all(Colors.grey.shade200),
                columnSpacing: 24,
                dataRowMaxHeight: 64,
                columns: const [
                  DataColumn(label: Text('Tên Chương Trình', style: TextStyle(fontWeight: FontWeight.bold))),
                  DataColumn(label: Text('Hạng áp dụng', style: TextStyle(fontWeight: FontWeight.bold))),
                  DataColumn(label: Text('Mức giảm', style: TextStyle(fontWeight: FontWeight.bold))),
                  DataColumn(label: Text('Sản phẩm', style: TextStyle(fontWeight: FontWeight.bold))),
                  DataColumn(label: Text('Thời Hạn', style: TextStyle(fontWeight: FontWeight.bold))),
                  DataColumn(label: Text('Trạng Thái', style: TextStyle(fontWeight: FontWeight.bold))),
                  DataColumn(label: Text('Thao Tác', style: TextStyle(fontWeight: FontWeight.bold))),
                ],
                rows: list.map((p) {
                  final ten = p['tenKM'] ?? p['TenKM'] ?? 'Tên chương trình';
                  final hang = p['hangThanhVien'] ?? p['HangThanhVien'] ?? 'Mọi hạng';
                  final loaiGiam = p['loaiGiamGia'] ?? p['LoaiGiamGia'] ?? 'PhanTram';
                  final giaTri = p['giaTriGiam'] ?? p['GiaTriGiam'] ?? 0;
                  final targets = p['targets'] ?? p['Targets'] ?? [];
                  final startDt = p['thoiGianBatDau'] != null ? DateTime.parse(p['thoiGianBatDau'].toString()) : DateTime.now();
                  final endDt = p['thoiGianKetThuc'] != null ? DateTime.parse(p['thoiGianKetThuc'].toString()) : DateTime.now().add(const Duration(days: 30));
                  final trangThai = p['trangThai'] ?? p['TrangThai'] ?? true;

                  String mucGiamStr = loaiGiam == 'PhanTram' ? '-$giaTri%' : '-${_currencyFormat.format(giaTri)}';
                  if (loaiGiam == 'Freeship') mucGiamStr = 'Freeship';

                  return DataRow(
                    cells: [
                      DataCell(SizedBox(width: 180, child: Text(ten.toString(), style: const TextStyle(fontWeight: FontWeight.bold)))),
                      DataCell(Text(hang.toString())),
                      DataCell(Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(color: Colors.orange.shade600, borderRadius: BorderRadius.circular(16)),
                        child: Text(mucGiamStr, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                      )),
                      DataCell(Chip(label: Text('${targets.length} SP', style: const TextStyle(color: Colors.blue, fontWeight: FontWeight.bold)), backgroundColor: Colors.blue.shade50)),
                      DataCell(Text('${DateFormat('dd/MM/yyyy').format(startDt)} - ${DateFormat('dd/MM/yyyy').format(endDt)}')),
                      DataCell(Chip(
                        label: Text(trangThai ? 'Hiệu lực' : 'Hết hạn', style: TextStyle(color: trangThai ? Colors.green.shade800 : Colors.red.shade800, fontSize: 12, fontWeight: FontWeight.bold)),
                        backgroundColor: trangThai ? Colors.green.shade100 : Colors.red.shade100,
                      )),
                      DataCell(Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (PermissionHelper.canEdit('PROMOTIONS'))
                            TextButton(child: const Text('SỬA', style: TextStyle(color: Colors.blue)), onPressed: () => _showAddEditDialog('SanPham', p as Map<String, dynamic>)),
                          if (PermissionHelper.canDelete('PROMOTIONS'))
                            TextButton(child: const Text('XÓA', style: TextStyle(color: Colors.red)), onPressed: () => _deletePromotion(p)),
                        ],
                      )),
                    ],
                  );
                }).toList(),
              ),
            ),
          );
  }

  // =========================================================================
  // BẢNG TAB 2: FLASH SALES
  // =========================================================================
  Widget _buildFlashSaleTab(List<dynamic> list) {
    return list.isEmpty
        ? const Center(child: Text('Không tìm thấy Flash Sales'))
        : SingleChildScrollView(
            scrollDirection: Axis.vertical,
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: DataTable(
                headingRowColor: WidgetStateProperty.all(Colors.grey.shade200),
                columnSpacing: 32,
                dataRowMaxHeight: 64,
                columns: const [
                  DataColumn(label: Text('Tiêu Đề', style: TextStyle(fontWeight: FontWeight.bold))),
                  DataColumn(label: Text('Sản phẩm', style: TextStyle(fontWeight: FontWeight.bold))),
                  DataColumn(label: Text('Thời Hạn', style: TextStyle(fontWeight: FontWeight.bold))),
                  DataColumn(label: Text('Trạng Thái', style: TextStyle(fontWeight: FontWeight.bold))),
                  DataColumn(label: Text('Thao Tác', style: TextStyle(fontWeight: FontWeight.bold))),
                ],
                rows: list.map((p) {
                  final ten = p['tenKM'] ?? p['TenKM'] ?? 'Flash sale';
                  final targets = p['targets'] ?? p['Targets'] ?? [];
                  final startDt = p['thoiGianBatDau'] != null ? DateTime.parse(p['thoiGianBatDau'].toString()) : DateTime.now();
                  final endDt = p['thoiGianKetThuc'] != null ? DateTime.parse(p['thoiGianKetThuc'].toString()) : DateTime.now().add(const Duration(days: 5));
                  final trangThai = p['trangThai'] ?? p['TrangThai'] ?? true;

                  return DataRow(
                    cells: [
                      DataCell(SizedBox(width: 200, child: Text(ten.toString(), style: const TextStyle(fontWeight: FontWeight.bold)))),
                      DataCell(Chip(label: Text('${targets.length} SP', style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold)), backgroundColor: Colors.red.shade50)),
                      DataCell(Text('${DateFormat('HH:mm:ss dd/MM/yyyy').format(startDt)} - ${DateFormat('HH:mm:ss dd/MM/yyyy').format(endDt)}')),
                      DataCell(Chip(
                        label: Text(trangThai ? 'Đang chạy' : 'Kết thúc', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                        backgroundColor: trangThai ? Colors.red.shade600 : Colors.grey,
                      )),
                      DataCell(Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (PermissionHelper.canEdit('FLASHSALES'))
                            TextButton(child: const Text('SỬA', style: TextStyle(color: Colors.blue)), onPressed: () => _showAddEditDialog('GiaSoc', p as Map<String, dynamic>)),
                          if (PermissionHelper.canDelete('FLASHSALES'))
                            TextButton(child: const Text('XÓA', style: TextStyle(color: Colors.red)), onPressed: () => _deletePromotion(p)),
                        ],
                      )),
                    ],
                  );
                }).toList(),
              ),
            ),
          );
  }

  // =========================================================================
  // BẢNG TAB 3: ƯU ĐÃI HỆ THỐNG
  // =========================================================================
  Widget _buildUuDaiTab(List<dynamic> list) {
    return list.isEmpty
        ? const Center(child: Text('Không tìm thấy ưu đãi hệ thống'))
        : SingleChildScrollView(
            scrollDirection: Axis.vertical,
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: DataTable(
                headingRowColor: WidgetStateProperty.all(Colors.grey.shade200),
                columnSpacing: 24,
                dataRowMaxHeight: 64,
                columns: const [
                  DataColumn(label: Text('Tên Ưu Đãi', style: TextStyle(fontWeight: FontWeight.bold))),
                  DataColumn(label: Text('Mã Code', style: TextStyle(fontWeight: FontWeight.bold))),
                  DataColumn(label: Text('Loại', style: TextStyle(fontWeight: FontWeight.bold))),
                  DataColumn(label: Text('Giá Trị', style: TextStyle(fontWeight: FontWeight.bold))),
                  DataColumn(label: Text('Đơn Tối Thiểu', style: TextStyle(fontWeight: FontWeight.bold))),
                  DataColumn(label: Text('Thời Hạn', style: TextStyle(fontWeight: FontWeight.bold))),
                  DataColumn(label: Text('Đã Dùng', style: TextStyle(fontWeight: FontWeight.bold))),
                  DataColumn(label: Text('Trạng Thái', style: TextStyle(fontWeight: FontWeight.bold))),
                  DataColumn(label: Text('Thao Tác', style: TextStyle(fontWeight: FontWeight.bold))),
                ],
                rows: list.map((p) {
                  final ten = p['tenKM'] ?? p['TenKM'] ?? 'Ưu đãi';
                  final code = p['maApDung'] ?? p['MaApDung'] ?? 'CODE';
                  final loaiGiam = p['loaiGiamGia'] ?? p['LoaiGiamGia'] ?? 'SoTien';
                  final giaTri = p['giaTriGiam'] ?? p['GiaTriGiam'] ?? 0;
                  final donToiThieu = p['donHangToiThieu'] ?? p['DonHangToiThieu'] ?? 0;
                  final startDt = p['thoiGianBatDau'] != null ? DateTime.parse(p['thoiGianBatDau'].toString()) : DateTime.now();
                  final endDt = p['thoiGianKetThuc'] != null ? DateTime.parse(p['thoiGianKetThuc'].toString()) : DateTime.now().add(const Duration(days: 30));
                  final daDung = p['soLuongDaDung'] ?? p['SoLuongDaDung'] ?? 0;
                  final toiDa = p['soLuongToiDa'] ?? p['SoLuongToiDa'] ?? 10;
                  final trangThai = p['trangThai'] ?? p['TrangThai'] ?? true;

                  String loaiStr = loaiGiam == 'PhanTram' ? 'Giảm %' : (loaiGiam == 'Freeship' ? 'Freeship' : 'Giảm Tiền');

                  return DataRow(
                    cells: [
                      DataCell(SizedBox(width: 150, child: Text(ten.toString(), style: const TextStyle(fontWeight: FontWeight.bold)))),
                      DataCell(Text(code.toString(), style: const TextStyle(color: Colors.pink, fontWeight: FontWeight.bold))),
                      DataCell(Chip(label: Text(loaiStr, style: const TextStyle(color: Colors.blue, fontSize: 12)), backgroundColor: Colors.white, side: const BorderSide(color: Colors.blue))),
                      DataCell(Text(loaiGiam == 'PhanTram' ? '$giaTri%' : _currencyFormat.format(giaTri), style: const TextStyle(fontWeight: FontWeight.bold))),
                      DataCell(Text(_currencyFormat.format(donToiThieu))),
                      DataCell(Text('${DateFormat('dd/MM/yyyy').format(startDt)} - ${DateFormat('dd/MM/yyyy').format(endDt)}')),
                      DataCell(Text('$daDung / $toiDa', style: const TextStyle(fontWeight: FontWeight.bold))),
                      DataCell(Chip(
                        label: Text(trangThai ? 'Hiệu lực' : 'Hết hạn', style: TextStyle(color: trangThai ? Colors.green.shade800 : Colors.red.shade800, fontSize: 12, fontWeight: FontWeight.bold)),
                        backgroundColor: trangThai ? Colors.green.shade100 : Colors.red.shade100,
                      )),
                      DataCell(Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (PermissionHelper.canEdit('FLASHSALES'))
                            TextButton(child: const Text('SỬA', style: TextStyle(color: Colors.blue)), onPressed: () => _showAddEditDialog('UuDai', p as Map<String, dynamic>)),
                          if (PermissionHelper.canDelete('FLASHSALES'))
                            TextButton(child: const Text('XÓA', style: TextStyle(color: Colors.red)), onPressed: () => _deletePromotion(p)),
                        ],
                      )),
                    ],
                  );
                }).toList(),
              ),
            ),
          );
  }

  // =========================================================================
  // BẢNG TAB 4: COUPON
  // =========================================================================
  Widget _buildCouponTab(List<dynamic> list) {
    return list.isEmpty
        ? const Center(child: Text('Không tìm thấy Coupon'))
        : SingleChildScrollView(
            scrollDirection: Axis.vertical,
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: DataTable(
                headingRowColor: WidgetStateProperty.all(Colors.grey.shade200),
                columnSpacing: 28,
                dataRowMaxHeight: 64,
                columns: const [
                  DataColumn(label: Text('Mã Code', style: TextStyle(fontWeight: FontWeight.bold))),
                  DataColumn(label: Text('Loại', style: TextStyle(fontWeight: FontWeight.bold))),
                  DataColumn(label: Text('Giá Trị', style: TextStyle(fontWeight: FontWeight.bold))),
                  DataColumn(label: Text('Đơn Tối Thiểu', style: TextStyle(fontWeight: FontWeight.bold))),
                  DataColumn(label: Text('Hạn Dùng', style: TextStyle(fontWeight: FontWeight.bold))),
                  DataColumn(label: Text('Đã Dùng', style: TextStyle(fontWeight: FontWeight.bold))),
                  DataColumn(label: Text('Trạng Thái', style: TextStyle(fontWeight: FontWeight.bold))),
                  DataColumn(label: Text('Thao Tác', style: TextStyle(fontWeight: FontWeight.bold))),
                ],
                rows: list.map((p) {
                  final code = p['maApDung'] ?? p['MaApDung'] ?? p['tenKM'] ?? 'COUPON';
                  final loaiGiam = p['loaiGiamGia'] ?? p['LoaiGiamGia'] ?? 'SoTien';
                  final giaTri = p['giaTriGiam'] ?? p['GiaTriGiam'] ?? 0;
                  final donToiThieu = p['donHangToiThieu'] ?? p['DonHangToiThieu'] ?? 0;
                  final startDt = p['thoiGianBatDau'] != null ? DateTime.parse(p['thoiGianBatDau'].toString()) : DateTime.now();
                  final endDt = p['thoiGianKetThuc'] != null ? DateTime.parse(p['thoiGianKetThuc'].toString()) : DateTime.now().add(const Duration(days: 30));
                  final daDung = p['soLuongDaDung'] ?? p['SoLuongDaDung'] ?? 0;
                  final toiDa = p['soLuongToiDa'] ?? p['SoLuongToiDa'] ?? 20;
                  final trangThai = p['trangThai'] ?? p['TrangThai'] ?? true;

                  String loaiStr = loaiGiam == 'PhanTram' ? 'Giảm %' : 'Giảm Tiền';

                  return DataRow(
                    cells: [
                      DataCell(Text(code.toString(), style: const TextStyle(color: Colors.teal, fontWeight: FontWeight.bold, fontSize: 16))),
                      DataCell(Chip(label: Text(loaiStr, style: const TextStyle(color: Colors.blue, fontSize: 12)), backgroundColor: Colors.white, side: const BorderSide(color: Colors.blue))),
                      DataCell(Text(loaiGiam == 'PhanTram' ? '$giaTri%' : _currencyFormat.format(giaTri), style: const TextStyle(fontWeight: FontWeight.bold))),
                      DataCell(Text(donToiThieu > 0 ? _currencyFormat.format(donToiThieu) : '—')),
                      DataCell(Text('${DateFormat('dd/MM/yyyy').format(startDt)} - ${DateFormat('dd/MM/yyyy').format(endDt)}')),
                      DataCell(Text('$daDung / $toiDa', style: const TextStyle(fontWeight: FontWeight.bold))),
                      DataCell(Chip(
                        label: Text(trangThai ? 'Hiệu lực' : 'Hết hạn', style: TextStyle(color: trangThai ? Colors.green.shade800 : Colors.red.shade800, fontSize: 12, fontWeight: FontWeight.bold)),
                        backgroundColor: trangThai ? Colors.green.shade100 : Colors.red.shade100,
                      )),
                      DataCell(Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (PermissionHelper.canEdit('PROMOTIONS'))
                            TextButton(child: const Text('SỬA', style: TextStyle(color: Colors.blue)), onPressed: () => _showAddEditDialog('Coupon', p as Map<String, dynamic>)),
                          if (PermissionHelper.canDelete('PROMOTIONS'))
                            TextButton(child: const Text('XÓA', style: TextStyle(color: Colors.red)), onPressed: () => _deletePromotion(p)),
                        ],
                      )),
                    ],
                  );
                }).toList(),
              ),
            ),
          );
  }
}
