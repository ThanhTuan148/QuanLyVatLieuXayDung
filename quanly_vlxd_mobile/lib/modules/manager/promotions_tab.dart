import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import 'package:intl/intl.dart';
import '../../core/permission_helper.dart';

class PromotionsTab extends StatefulWidget {
  const PromotionsTab({super.key});

  @override
  State<PromotionsTab> createState() => _PromotionsTabState();
}

class _PromotionsTabState extends State<PromotionsTab>
    with SingleTickerProviderStateMixin {
  final ApiService _apiService = ApiService();
  late TabController _tabController;

  List<dynamic> _promotions = [];
  List<dynamic> _allProducts = [];
  bool _isLoading = true;
  String? _error;
  String _searchQuery = '';

  final NumberFormat _currencyFormat = NumberFormat.currency(
    locale: 'vi_VN',
    symbol: 'đ',
  );

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
    _fetchProducts();
  }

  Future<void> _fetchProducts() async {
    try {
      final response = await _apiService.getProducts();
      if (response.statusCode == 200 && response.data != null) {
        if (mounted) {
          setState(() {
            _allProducts = response.data is List
                ? response.data
                : [response.data];
          });
        }
      }
    } catch (_) {}
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
            _promotions = response.data is List
                ? response.data
                : [response.data];
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
        "maKhuyenMai": 1,
        "maKM": "KM01",
        "loaiKM": "SanPham",
        "tenKM": "Mùa Xây Dựng 2026",
        "moTa": "Giảm giá sâu các mặt hàng thiết yếu",
        "hangThanhVien": "Mọi hạng",
        "loaiGiamGia": "PhanTram",
        "giaTriGiam": 20,
        "donHangToiThieu": 0,
        "thoiGianBatDau": now
            .subtract(const Duration(days: 10))
            .toIso8601String(),
        "thoiGianKetThuc": now.add(const Duration(days: 30)).toIso8601String(),
        "trangThai": true,
        "targets": [
          {"maSanPham": 1},
          {"maSanPham": 2},
          {"maSanPham": 3},
        ],
      },
      {
        "maKhuyenMai": 2,
        "maKM": "FL01",
        "loaiKM": "GiaSoc",
        "tenKM": "Đại tiệc tháng 5",
        "moTa": "Flash sale giá sốc",
        "hangThanhVien": "Mọi hạng",
        "loaiGiamGia": "PhanTram",
        "giaTriGiam": 30,
        "donHangToiThieu": 0,
        "thoiGianBatDau": now
            .subtract(const Duration(days: 2))
            .toIso8601String(),
        "thoiGianKetThuc": now.add(const Duration(days: 5)).toIso8601String(),
        "trangThai": true,
        "targets": [
          {"maSanPham": 1},
          {"maSanPham": 2},
          {"maSanPham": 3},
          {"maSanPham": 4},
          {"maSanPham": 5},
          {"maSanPham": 6},
        ],
      },
      {
        "maKhuyenMai": 3,
        "maKM": "UD01",
        "loaiKM": "UuDai",
        "tenKM": "Hè sales tưng bừng",
        "maApDung": "HESALES",
        "moTa": "Giảm trực tiếp tiền mặt",
        "hangThanhVien": "Mọi hạng",
        "loaiGiamGia": "SoTien",
        "giaTriGiam": 50000,
        "donHangToiThieu": 800000,
        "thoiGianBatDau": now
            .subtract(const Duration(days: 5))
            .toIso8601String(),
        "thoiGianKetThuc": now.add(const Duration(days: 20)).toIso8601String(),
        "soLuongToiDa": 10,
        "soLuongDaDung": 0,
        "trangThai": true,
      },
      {
        "maKhuyenMai": 4,
        "maKM": "UD02",
        "loaiKM": "UuDai",
        "tenKM": "Thang5",
        "maApDung": "THANG5",
        "moTa": "Miễn phí vận chuyển",
        "hangThanhVien": "Mọi hạng",
        "loaiGiamGia": "Freeship",
        "giaTriGiam": 30000,
        "donHangToiThieu": 500000,
        "thoiGianBatDau": now
            .subtract(const Duration(days: 5))
            .toIso8601String(),
        "thoiGianKetThuc": now.add(const Duration(days: 15)).toIso8601String(),
        "soLuongToiDa": 50,
        "soLuongDaDung": 0,
        "trangThai": true,
      },
      {
        "maKhuyenMai": 5,
        "maKM": "CP01",
        "loaiKM": "Coupon",
        "tenKM": "Summer Coupon",
        "maApDung": "SUMMER20",
        "moTa": "Coupon giảm tiền",
        "hangThanhVien": "Mọi hạng",
        "loaiGiamGia": "SoTien",
        "giaTriGiam": 20000,
        "donHangToiThieu": 0,
        "thoiGianBatDau": now
            .subtract(const Duration(days: 15))
            .toIso8601String(),
        "thoiGianKetThuc": now.add(const Duration(days: 40)).toIso8601String(),
        "soLuongToiDa": 20,
        "soLuongDaDung": 0,
        "trangThai": true,
      },
    ];
  }

  // =========================================================================
  // DIALOG THÊM / SỬA CHUNG CHO CẢ 4 LOẠI
  // =========================================================================
  Future<void> _showAddEditDialog(
    String loaiKM, [
    Map<String, dynamic>? promo,
  ]) async {
    final isEdit = promo != null;
    final tenCtrl = TextEditingController(
      text: isEdit ? (promo['tenKM'] ?? promo['TenKM'] ?? '').toString() : '',
    );
    final moTaCtrl = TextEditingController(
      text: isEdit ? (promo['moTa'] ?? promo['MoTa'] ?? '').toString() : '',
    );
    final maApDungCtrl = TextEditingController(
      text: isEdit
          ? (promo['maApDung'] ?? promo['MaApDung'] ?? '').toString()
          : '',
    );
    final giaTriCtrl = TextEditingController(
      text: isEdit
          ? (promo['giaTriGiam'] ?? promo['GiaTriGiam'] ?? 0).toString()
          : '0',
    );
    final donToiThieuCtrl = TextEditingController(
      text: isEdit
          ? (promo['donHangToiThieu'] ?? promo['DonHangToiThieu'] ?? 0)
                .toString()
          : '0',
    );
    final soLuongCtrl = TextEditingController(
      text: isEdit
          ? (promo['soLuongToiDa'] ?? promo['SoLuongToiDa'] ?? 100).toString()
          : '100',
    );

    String loaiGiam = isEdit
        ? (promo['loaiGiamGia'] ?? promo['LoaiGiamGia'] ?? 'PhanTram')
              .toString()
        : 'PhanTram';
    String hangApDung = isEdit
        ? (promo['hangThanhVien'] ?? promo['HangThanhVien'] ?? 'Mọi hạng')
              .toString()
        : 'Mọi hạng';
    bool trangThai = isEdit
        ? (promo['trangThai'] ?? promo['TrangThai'] ?? true)
        : true;

    List<int> selectedProductIds = [];
    if (isEdit) {
      final targets = promo['targets'] ?? promo['Targets'] ?? [];
      for (var t in targets) {
        final pid = t['maSanPham'] ?? t['MaSanPham'] ?? t['id'];
        if (pid != null) {
          selectedProductIds.add(
            pid is int ? pid : int.tryParse(pid.toString()) ?? 0,
          );
        }
      }
    }

    DateTime startDt = isEdit && promo['thoiGianBatDau'] != null
        ? DateTime.parse(promo['thoiGianBatDau'].toString())
        : DateTime.now();
    DateTime endDt = isEdit && promo['thoiGianKetThuc'] != null
        ? DateTime.parse(promo['thoiGianKetThuc'].toString())
        : DateTime.now().add(const Duration(days: 30));

    final formKey = GlobalKey<FormState>();

    // Tiêu đề Dialog
    String titleStr = isEdit ? 'Sửa ' : 'Thêm ';
    if (loaiKM == 'SanPham')
      titleStr += 'Khuyến Mãi Sản Phẩm';
    else if (loaiKM == 'GiaSoc')
      titleStr += 'Flash Sale';
    else if (loaiKM == 'UuDai')
      titleStr += 'Ưu Đãi Hệ Thống';
    else
      titleStr += 'Coupon';

    await showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: Text(
                titleStr,
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              content: SingleChildScrollView(
                child: Form(
                  key: formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (loaiKM != 'Coupon') ...[
                        TextFormField(
                          controller: tenCtrl,
                          decoration: InputDecoration(
                            labelText: loaiKM == 'GiaSoc'
                                ? 'Tiêu đề Flash Sale'
                                : 'Tên chương trình / ưu đãi',
                            border: const OutlineInputBorder(),
                          ),
                          validator: (val) => val == null || val.isEmpty
                              ? 'Vui lòng nhập tên'
                              : null,
                        ),
                        const SizedBox(height: 12),
                      ],
                      if (loaiKM == 'UuDai' || loaiKM == 'Coupon') ...[
                        TextFormField(
                          controller: maApDungCtrl,
                          decoration: const InputDecoration(
                            labelText: 'Mã Code (VD: SUMMER20)',
                            border: OutlineInputBorder(),
                          ),
                          validator: (val) => val == null || val.isEmpty
                              ? 'Vui lòng nhập mã code'
                              : null,
                        ),
                        const SizedBox(height: 12),
                      ],
                      TextFormField(
                        controller: moTaCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Mô tả chi tiết',
                          border: OutlineInputBorder(),
                        ),
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        value: loaiGiam,
                        isExpanded: true,
                        decoration: const InputDecoration(
                          labelText: 'Loại giảm giá',
                          border: OutlineInputBorder(),
                        ),
                        items: const [
                          DropdownMenuItem(
                            value: 'PhanTram',
                            child: Text(
                              'Giảm theo Phần trăm (%)',
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          DropdownMenuItem(
                            value: 'SoTien',
                            child: Text(
                              'Giảm trực tiếp Số tiền (đ)',
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          DropdownMenuItem(
                            value: 'Freeship',
                            child: Text(
                              'Miễn phí vận chuyển (Freeship)',
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                        onChanged: (val) =>
                            setDialogState(() => loaiGiam = val!),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: giaTriCtrl,
                              keyboardType: TextInputType.number,
                              decoration: InputDecoration(
                                labelText: loaiGiam == 'PhanTram'
                                    ? 'Mức giảm (%)'
                                    : 'Số tiền giảm (đ)',
                                border: const OutlineInputBorder(),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: TextFormField(
                              controller: donToiThieuCtrl,
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(
                                labelText: 'Đơn tối thiểu (đ)',
                                border: OutlineInputBorder(),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              value: hangApDung,
                              isExpanded: true,
                              decoration: const InputDecoration(
                                labelText: 'Hạng áp dụng',
                                border: OutlineInputBorder(),
                              ),
                              items: const [
                                DropdownMenuItem(
                                  value: 'Mọi hạng',
                                  child: Text('Mọi hạng'),
                                ),
                                DropdownMenuItem(
                                  value: 'Đồng',
                                  child: Text('Hạng Đồng'),
                                ),
                                DropdownMenuItem(
                                  value: 'Bạc',
                                  child: Text('Hạng Bạc'),
                                ),
                                DropdownMenuItem(
                                  value: 'Vàng',
                                  child: Text('Hạng Vàng'),
                                ),
                                DropdownMenuItem(
                                  value: 'Kim Cương',
                                  child: Text('Kim Cương'),
                                ),
                              ],
                              onChanged: (val) =>
                                  setDialogState(() => hangApDung = val!),
                            ),
                          ),
                          if (loaiKM == 'UuDai' || loaiKM == 'Coupon') ...[
                            const SizedBox(width: 12),
                            Expanded(
                              child: TextFormField(
                                controller: soLuongCtrl,
                                keyboardType: TextInputType.number,
                                decoration: const InputDecoration(
                                  labelText: 'Tổng lượt dùng',
                                  border: OutlineInputBorder(),
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: InkWell(
                              onTap: () async {
                                final dt = await showDatePicker(
                                  context: context,
                                  initialDate: startDt,
                                  firstDate: DateTime(2020),
                                  lastDate: DateTime(2030),
                                );
                                if (dt != null)
                                  setDialogState(() => startDt = dt);
                              },
                              child: InputDecorator(
                                decoration: const InputDecoration(
                                  labelText: 'Từ ngày',
                                  border: OutlineInputBorder(),
                                ),
                                child: Text(
                                  DateFormat('dd/MM/yyyy').format(startDt),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: InkWell(
                              onTap: () async {
                                final dt = await showDatePicker(
                                  context: context,
                                  initialDate: endDt,
                                  firstDate: DateTime(2020),
                                  lastDate: DateTime(2030),
                                );
                                if (dt != null)
                                  setDialogState(() => endDt = dt);
                              },
                              child: InputDecorator(
                                decoration: const InputDecoration(
                                  labelText: 'Đến ngày',
                                  border: OutlineInputBorder(),
                                ),
                                child: Text(
                                  DateFormat('dd/MM/yyyy').format(endDt),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),

                      if (loaiKM == 'SanPham' || loaiKM == 'GiaSoc') ...[
                        const SizedBox(height: 12),
                        InkWell(
                          onTap: () async {
                            await _showProductSelectionBottomSheet(
                              selectedProductIds,
                            );
                            setDialogState(() {});
                          },
                          child: InputDecorator(
                            decoration: InputDecoration(
                              labelText: 'Sản phẩm áp dụng',
                              border: const OutlineInputBorder(),
                              errorText: selectedProductIds.isEmpty
                                  ? 'Vui lòng chọn ít nhất 1 sản phẩm'
                                  : null,
                            ),
                            child: Text(
                              selectedProductIds.isEmpty
                                  ? 'Chọn sản phẩm...'
                                  : 'Đã chọn ${selectedProductIds.length} sản phẩm',
                              style: TextStyle(
                                fontWeight: selectedProductIds.isEmpty
                                    ? FontWeight.normal
                                    : FontWeight.bold,
                                color: selectedProductIds.isEmpty
                                    ? Colors.grey
                                    : Colors.blue,
                              ),
                            ),
                          ),
                        ),
                      ],

                      const SizedBox(height: 12),
                      SwitchListTile(
                        title: const Text('Trạng thái hoạt động'),
                        value: trangThai,
                        onChanged: (val) =>
                            setDialogState(() => trangThai = val),
                      ),
                    ],
                  ),
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Hủy'),
                ),
                ElevatedButton(
                  onPressed: () async {
                    if (formKey.currentState!.validate()) {
                      if ((loaiKM == 'SanPham' || loaiKM == 'GiaSoc') &&
                          selectedProductIds.isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Vui lòng chọn sản phẩm áp dụng!'),
                          ),
                        );
                        return;
                      }

                      Navigator.pop(context);
                      setState(() => _isLoading = true);

                      final data = {
                        'loaiKM': loaiKM,
                        'tenKM': loaiKM == 'Coupon'
                            ? maApDungCtrl.text
                            : tenCtrl.text,
                        'moTa': moTaCtrl.text,
                        'maApDung': maApDungCtrl.text,
                        'loaiGiamGia': loaiGiam,
                        'giaTriGiam': double.tryParse(giaTriCtrl.text) ?? 0,
                        'donHangToiThieu':
                            double.tryParse(donToiThieuCtrl.text) ?? 0,
                        'hangThanhVien': hangApDung,
                        'soLuongToiDa': int.tryParse(soLuongCtrl.text) ?? 100,
                        'thoiGianBatDau': startDt.toIso8601String(),
                        'thoiGianKetThuc': endDt.toIso8601String(),
                        'trangThai': trangThai,
                        'targets': selectedProductIds
                            .map((id) => {'maSanPham': id})
                            .toList(),
                      };

                      try {
                        if (isEdit) {
                          final id =
                              promo['maKhuyenMai'] ??
                              promo['MaKhuyenMai'] ??
                              promo['id'];
                          await _apiService.updatePromotion(id, data);
                          if (mounted)
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Cập nhật thành công!'),
                              ),
                            );
                        } else {
                          await _apiService.createPromotion(data);
                          if (mounted)
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Thêm mới thành công!'),
                              ),
                            );
                        }
                        _fetchPromotions();
                      } catch (e) {
                        if (mounted) {
                          ScaffoldMessenger.of(
                            context,
                          ).showSnackBar(SnackBar(content: Text('Lỗi: $e')));
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

  Future<void> _showProductSelectionBottomSheet(
    List<int> selectedProductIds,
  ) async {
    List<int> tempSelected = List.from(selectedProductIds);
    String filterQuery = '';

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            final displayProducts = _allProducts.where((p) {
              final ten = (p['tenSP'] ?? p['TenSP'] ?? '')
                  .toString()
                  .toLowerCase();
              final ma = (p['maSP'] ?? p['MaSP'] ?? '')
                  .toString()
                  .toLowerCase();
              return ten.contains(filterQuery.toLowerCase()) ||
                  ma.contains(filterQuery.toLowerCase());
            }).toList();

            return Container(
              height: MediaQuery.of(context).size.height * 0.7,
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  const Text(
                    'Chọn Sản Phẩm Áp Dụng',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    onChanged: (val) => setSheetState(() => filterQuery = val),
                    decoration: InputDecoration(
                      hintText: 'Tìm kiếm sản phẩm...',
                      prefixIcon: const Icon(Icons.search),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      contentPadding: EdgeInsets.zero,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Expanded(
                    child: displayProducts.isEmpty
                        ? const Center(
                            child: Text('Không tìm thấy sản phẩm nào'),
                          )
                        : ListView.builder(
                            itemCount: displayProducts.length,
                            itemBuilder: (context, index) {
                              final p = displayProducts[index];
                              final id =
                                  p['maSanPham'] ?? p['MaSanPham'] ?? p['id'];
                              final isSelected = tempSelected.contains(id);

                              return CheckboxListTile(
                                title: Text(
                                  p['tenSP'] ?? p['TenSP'] ?? 'Sản phẩm',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                subtitle: Text(p['maSP'] ?? p['MaSP'] ?? ''),
                                value: isSelected,
                                onChanged: (val) {
                                  setSheetState(() {
                                    if (val == true) {
                                      tempSelected.add(id);
                                    } else {
                                      tempSelected.remove(id);
                                    }
                                  });
                                },
                              );
                            },
                          ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.purple.shade800,
                        foregroundColor: Colors.white,
                      ),
                      onPressed: () {
                        selectedProductIds.clear();
                        selectedProductIds.addAll(tempSelected);
                        Navigator.pop(context);
                      },
                      child: Text('XÁC NHẬN CHỌN (${tempSelected.length})'),
                    ),
                  ),
                ],
              ),
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
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Hủy'),
          ),
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
        if (mounted)
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text('Xóa thành công!')));
        _fetchPromotions();
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text('Lỗi khi xóa: $e')));
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
          Text(
            'Bạn không có quyền xem dữ liệu này',
            style: TextStyle(color: Colors.grey, fontSize: 16),
          ),
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
            Text(
              'Quản Lý Chương Trình Ưu Đãi',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
            Text(
              'Quản lý tập trung Khuyến mãi sản phẩm, Flash Sales, Ưu đãi hệ thống và Coupon',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.normal),
            ),
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
          tabAlignment: TabAlignment.start,
          tabs: const [
            Tab(icon: Icon(Icons.local_offer), text: 'KHUYẾN MÃI SẢN PHẨM'),
            Tab(icon: Icon(Icons.flash_on), text: 'FLASH SALES'),
            Tab(icon: Icon(Icons.card_giftcard), text: 'ƯU ĐÃI HỆ THỐNG'),
            Tab(
              icon: Icon(Icons.confirmation_number),
              text: 'COUPON (NHẬP MÃ)',
            ),
          ],
        ),
      ),
      floatingActionButton: _canCreateCurrentTab
          ? FloatingActionButton.extended(
              onPressed: () {
                if (_tabController.index == 0)
                  _showAddEditDialog('SanPham');
                else if (_tabController.index == 1)
                  _showAddEditDialog('GiaSoc');
                else if (_tabController.index == 2)
                  _showAddEditDialog('UuDai');
                else
                  _showAddEditDialog('Coupon');
              },
              icon: const Icon(Icons.add),
              label: Text(
                _tabController.index == 0
                    ? 'THÊM KHUYẾN MÃI'
                    : (_tabController.index == 1
                          ? 'TẠO FLASH SALE'
                          : (_tabController.index == 2
                                ? 'TẠO ƯU ĐÃI'
                                : 'TẠO COUPON')),
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
                    margin: const EdgeInsets.only(
                      bottom: 8,
                      left: 16,
                      right: 16,
                      top: 12,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.amber.shade100,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.warning_amber_rounded,
                          color: Colors.orange,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _error!,
                            style: TextStyle(
                              color: Colors.orange.shade800,
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
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
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(30),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        vertical: 0,
                        horizontal: 20,
                      ),
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
                      PermissionHelper.canView('PROMOTIONS')
                          ? _buildSanPhamTab(filteredSanPham)
                          : _buildPermissionDenied(),

                      // TAB 2: FLASH SALES
                      PermissionHelper.canView('FLASHSALES')
                          ? _buildFlashSaleTab(filteredFlashSale)
                          : _buildPermissionDenied(),

                      // TAB 3: ƯU ĐÃI HỆ THỐNG
                      PermissionHelper.canView('FLASHSALES')
                          ? _buildUuDaiTab(filteredUuDai)
                          : _buildPermissionDenied(),

                      // TAB 4: COUPON
                      PermissionHelper.canView('PROMOTIONS')
                          ? _buildCouponTab(filteredCoupon)
                          : _buildPermissionDenied(),
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
      final code = (p['maApDung'] ?? p['MaApDung'] ?? '')
          .toString()
          .toLowerCase();
      return ten.contains(_searchQuery.toLowerCase()) ||
          code.contains(_searchQuery.toLowerCase());
    }).toList();
  }

  // =========================================================================
  // GIAO DIỆN DẠNG CARD CHUNG
  // =========================================================================
  Widget _buildCardList(
    List<dynamic> list,
    String type,
    Widget Function(dynamic) cardBuilder,
  ) {
    if (list.isEmpty)
      return const Center(
        child: Text('Không có dữ liệu', style: TextStyle(color: Colors.grey)),
      );
    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: list.length,
      itemBuilder: (context, index) => cardBuilder(list[index]),
    );
  }

  // =========================================================================
  // TAB 1: KHUYẾN MÃI SẢN PHẨM
  // =========================================================================
  Widget _buildSanPhamTab(List<dynamic> list) {
    return _buildCardList(list, 'SanPham', (p) {
      final ten = p['tenKM'] ?? p['TenKM'] ?? 'Tên chương trình';
      final hang = p['hangThanhVien'] ?? p['HangThanhVien'] ?? 'Mọi hạng';
      final loaiGiam = p['loaiGiamGia'] ?? p['LoaiGiamGia'] ?? 'PhanTram';
      final giaTri = p['giaTriGiam'] ?? p['GiaTriGiam'] ?? 0;
      final targets = p['targets'] ?? p['Targets'] ?? [];
      final startDt = p['thoiGianBatDau'] != null
          ? DateTime.parse(p['thoiGianBatDau'].toString())
          : DateTime.now();
      final endDt = p['thoiGianKetThuc'] != null
          ? DateTime.parse(p['thoiGianKetThuc'].toString())
          : DateTime.now().add(const Duration(days: 30));
      final trangThai = p['trangThai'] ?? p['TrangThai'] ?? true;
      String mucGiamStr = loaiGiam == 'PhanTram'
          ? '-$giaTri%'
          : '-${_currencyFormat.format(giaTri)}';
      if (loaiGiam == 'Freeship') mucGiamStr = 'Freeship';

      return Card(
        margin: const EdgeInsets.only(bottom: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        elevation: 2,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      ten.toString(),
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.purple.shade800,
                      ),
                    ),
                  ),
                  Chip(
                    label: Text(
                      trangThai ? 'Hiệu lực' : 'Hết hạn',
                      style: TextStyle(
                        color: trangThai
                            ? Colors.green.shade800
                            : Colors.red.shade800,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    backgroundColor: trangThai
                        ? Colors.green.shade50
                        : Colors.red.shade50,
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                ],
              ),
              const Divider(),
              Row(
                children: [
                  const Icon(Icons.star_rate, size: 16, color: Colors.orange),
                  const SizedBox(width: 4),
                  Text('Áp dụng: $hang', style: const TextStyle(fontSize: 13)),
                  const SizedBox(width: 16),
                  const Icon(Icons.discount, size: 16, color: Colors.blue),
                  const SizedBox(width: 4),
                  Text(
                    'Mức giảm: $mucGiamStr',
                    style: const TextStyle(
                      color: Colors.blue,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.date_range, size: 16, color: Colors.grey),
                  const SizedBox(width: 4),
                  Text(
                    '${DateFormat('dd/MM/yyyy').format(startDt)} - ${DateFormat('dd/MM/yyyy').format(endDt)}',
                    style: const TextStyle(color: Colors.grey, fontSize: 13),
                  ),
                  const Spacer(),
                  Text(
                    '${targets.length} SP được chọn',
                    style: const TextStyle(
                      fontStyle: FontStyle.italic,
                      color: Colors.grey,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  if (PermissionHelper.canEdit('PROMOTIONS'))
                    TextButton.icon(
                      icon: const Icon(Icons.edit, size: 18),
                      label: const Text('Sửa'),
                      onPressed: () => _showAddEditDialog(
                        'SanPham',
                        p as Map<String, dynamic>,
                      ),
                    ),
                  if (PermissionHelper.canDelete('PROMOTIONS'))
                    TextButton.icon(
                      icon: const Icon(
                        Icons.delete,
                        size: 18,
                        color: Colors.red,
                      ),
                      label: const Text(
                        'Xóa',
                        style: TextStyle(color: Colors.red),
                      ),
                      onPressed: () => _deletePromotion(p),
                    ),
                ],
              ),
            ],
          ),
        ),
      );
    });
  }

  // =========================================================================
  // TAB 2: FLASH SALES
  // =========================================================================
  Widget _buildFlashSaleTab(List<dynamic> list) {
    return _buildCardList(list, 'GiaSoc', (p) {
      final ten = p['tenKM'] ?? p['TenKM'] ?? 'Flash sale';
      final targets = p['targets'] ?? p['Targets'] ?? [];
      final startDt = p['thoiGianBatDau'] != null
          ? DateTime.parse(p['thoiGianBatDau'].toString())
          : DateTime.now();
      final endDt = p['thoiGianKetThuc'] != null
          ? DateTime.parse(p['thoiGianKetThuc'].toString())
          : DateTime.now().add(const Duration(days: 5));
      final trangThai = p['trangThai'] ?? p['TrangThai'] ?? true;

      return Card(
        margin: const EdgeInsets.only(bottom: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        elevation: 2,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      ten.toString(),
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.red,
                      ),
                    ),
                  ),
                  Chip(
                    label: Text(
                      trangThai ? 'Đang chạy' : 'Kết thúc',
                      style: TextStyle(
                        color: trangThai ? Colors.white : Colors.grey.shade700,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    backgroundColor: trangThai
                        ? Colors.red.shade600
                        : Colors.grey.shade300,
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                ],
              ),
              const Divider(),
              Row(
                children: [
                  const Icon(Icons.bolt, size: 18, color: Colors.orange),
                  const SizedBox(width: 4),
                  Text(
                    '${targets.length} Sản phẩm Flash Sale',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.orange,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(
                    Icons.timer_outlined,
                    size: 16,
                    color: Colors.grey,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '${DateFormat('HH:mm dd/MM/yyyy').format(startDt)} - ${DateFormat('HH:mm dd/MM/yyyy').format(endDt)}',
                    style: const TextStyle(color: Colors.grey, fontSize: 13),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  if (PermissionHelper.canEdit('FLASHSALES'))
                    TextButton.icon(
                      icon: const Icon(Icons.edit, size: 18),
                      label: const Text('Sửa'),
                      onPressed: () => _showAddEditDialog(
                        'GiaSoc',
                        p as Map<String, dynamic>,
                      ),
                    ),
                  if (PermissionHelper.canDelete('FLASHSALES'))
                    TextButton.icon(
                      icon: const Icon(
                        Icons.delete,
                        size: 18,
                        color: Colors.red,
                      ),
                      label: const Text(
                        'Xóa',
                        style: TextStyle(color: Colors.red),
                      ),
                      onPressed: () => _deletePromotion(p),
                    ),
                ],
              ),
            ],
          ),
        ),
      );
    });
  }

  // =========================================================================
  // TAB 3: ƯU ĐÃI HỆ THỐNG
  // =========================================================================
  Widget _buildUuDaiTab(List<dynamic> list) {
    return _buildCardList(list, 'UuDai', (p) {
      final ten = p['tenKM'] ?? p['TenKM'] ?? 'Ưu đãi';
      final code = p['maApDung'] ?? p['MaApDung'] ?? 'CODE';
      final loaiGiam = p['loaiGiamGia'] ?? p['LoaiGiamGia'] ?? 'SoTien';
      final giaTri = p['giaTriGiam'] ?? p['GiaTriGiam'] ?? 0;
      final donToiThieu = p['donHangToiThieu'] ?? p['DonHangToiThieu'] ?? 0;
      final startDt = p['thoiGianBatDau'] != null
          ? DateTime.parse(p['thoiGianBatDau'].toString())
          : DateTime.now();
      final endDt = p['thoiGianKetThuc'] != null
          ? DateTime.parse(p['thoiGianKetThuc'].toString())
          : DateTime.now().add(const Duration(days: 30));
      final daDung = p['soLuongDaDung'] ?? p['SoLuongDaDung'] ?? 0;
      final toiDa = p['soLuongToiDa'] ?? p['SoLuongToiDa'] ?? 10;
      final trangThai = p['trangThai'] ?? p['TrangThai'] ?? true;
      String loaiStr = loaiGiam == 'PhanTram'
          ? 'Giảm %'
          : (loaiGiam == 'Freeship' ? 'Freeship' : 'Giảm Tiền');

      return Card(
        margin: const EdgeInsets.only(bottom: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        elevation: 2,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      ten.toString(),
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.blue,
                      ),
                    ),
                  ),
                  Chip(
                    label: Text(
                      trangThai ? 'Hiệu lực' : 'Hết hạn',
                      style: TextStyle(
                        color: trangThai
                            ? Colors.green.shade800
                            : Colors.red.shade800,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    backgroundColor: trangThai
                        ? Colors.green.shade50
                        : Colors.red.shade50,
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                ],
              ),
              const Divider(),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.pink.shade50,
                      border: Border.all(color: Colors.pink.shade200),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      code.toString(),
                      style: const TextStyle(
                        color: Colors.pink,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    '• $loaiStr',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.blue,
                      fontSize: 13,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    loaiGiam == 'PhanTram'
                        ? '$giaTri%'
                        : _currencyFormat.format(giaTri),
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: Colors.red,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.shopping_cart, size: 16, color: Colors.grey),
                  const SizedBox(width: 4),
                  Text(
                    'Đơn từ: ${_currencyFormat.format(donToiThieu)}',
                    style: const TextStyle(fontSize: 13),
                  ),
                  const Spacer(),
                  Text(
                    'Đã dùng: $daDung / $toiDa',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      color: Colors.teal,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.date_range, size: 16, color: Colors.grey),
                  const SizedBox(width: 4),
                  Text(
                    '${DateFormat('dd/MM/yyyy').format(startDt)} - ${DateFormat('dd/MM/yyyy').format(endDt)}',
                    style: const TextStyle(color: Colors.grey, fontSize: 13),
                  ),
                  const Spacer(),
                  if (PermissionHelper.canEdit('FLASHSALES'))
                    TextButton.icon(
                      icon: const Icon(Icons.edit, size: 16),
                      label: const Text('Sửa'),
                      onPressed: () => _showAddEditDialog(
                        'UuDai',
                        p as Map<String, dynamic>,
                      ),
                    ),
                  if (PermissionHelper.canDelete('FLASHSALES'))
                    TextButton(
                      child: const Text(
                        'Xóa',
                        style: TextStyle(color: Colors.red),
                      ),
                      onPressed: () => _deletePromotion(p),
                    ),
                ],
              ),
            ],
          ),
        ),
      );
    });
  }

  // =========================================================================
  // TAB 4: COUPON
  // =========================================================================
  Widget _buildCouponTab(List<dynamic> list) {
    return _buildCardList(list, 'Coupon', (p) {
      final code = p['maApDung'] ?? p['MaApDung'] ?? p['tenKM'] ?? 'COUPON';
      final loaiGiam = p['loaiGiamGia'] ?? p['LoaiGiamGia'] ?? 'SoTien';
      final giaTri = p['giaTriGiam'] ?? p['GiaTriGiam'] ?? 0;
      final donToiThieu = p['donHangToiThieu'] ?? p['DonHangToiThieu'] ?? 0;
      final startDt = p['thoiGianBatDau'] != null
          ? DateTime.parse(p['thoiGianBatDau'].toString())
          : DateTime.now();
      final endDt = p['thoiGianKetThuc'] != null
          ? DateTime.parse(p['thoiGianKetThuc'].toString())
          : DateTime.now().add(const Duration(days: 30));
      final daDung = p['soLuongDaDung'] ?? p['SoLuongDaDung'] ?? 0;
      final toiDa = p['soLuongToiDa'] ?? p['SoLuongToiDa'] ?? 20;
      final trangThai = p['trangThai'] ?? p['TrangThai'] ?? true;
      String loaiStr = loaiGiam == 'PhanTram' ? 'Giảm %' : 'Giảm Tiền';

      return Card(
        margin: const EdgeInsets.only(bottom: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        elevation: 2,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.teal.shade50,
                      border: Border.all(
                        color: Colors.teal.shade300,
                        style: BorderStyle.solid,
                        width: 2,
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      code.toString(),
                      style: TextStyle(
                        color: Colors.teal.shade700,
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                        letterSpacing: 2,
                      ),
                    ),
                  ),
                  Chip(
                    label: Text(
                      trangThai ? 'Hiệu lực' : 'Hết hạn',
                      style: TextStyle(
                        color: trangThai
                            ? Colors.green.shade800
                            : Colors.red.shade800,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    backgroundColor: trangThai
                        ? Colors.green.shade50
                        : Colors.red.shade50,
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  const Icon(Icons.discount, size: 16, color: Colors.blue),
                  const SizedBox(width: 4),
                  Text('$loaiStr: ', style: const TextStyle(fontSize: 13)),
                  Text(
                    loaiGiam == 'PhanTram'
                        ? '$giaTri%'
                        : _currencyFormat.format(giaTri),
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: Colors.red,
                    ),
                  ),
                  const Spacer(),
                  const Icon(
                    Icons.shopping_bag_outlined,
                    size: 16,
                    color: Colors.grey,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    donToiThieu > 0
                        ? 'Từ ${_currencyFormat.format(donToiThieu)}'
                        : 'Mọi đơn hàng',
                    style: const TextStyle(fontSize: 13),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.date_range, size: 16, color: Colors.grey),
                  const SizedBox(width: 4),
                  Text(
                    '${DateFormat('dd/MM/yyyy').format(startDt)} - ${DateFormat('dd/MM/yyyy').format(endDt)}',
                    style: const TextStyle(color: Colors.grey, fontSize: 13),
                  ),
                  const Spacer(),
                  Text(
                    '$daDung / $toiDa lượt',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      color: Colors.teal,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  if (PermissionHelper.canEdit('PROMOTIONS'))
                    TextButton.icon(
                      icon: const Icon(Icons.edit, size: 16),
                      label: const Text('Sửa'),
                      onPressed: () => _showAddEditDialog(
                        'Coupon',
                        p as Map<String, dynamic>,
                      ),
                    ),
                  if (PermissionHelper.canDelete('PROMOTIONS'))
                    TextButton(
                      child: const Text(
                        'Xóa',
                        style: TextStyle(color: Colors.red),
                      ),
                      onPressed: () => _deletePromotion(p),
                    ),
                ],
              ),
            ],
          ),
        ),
      );
    });
  }
}
