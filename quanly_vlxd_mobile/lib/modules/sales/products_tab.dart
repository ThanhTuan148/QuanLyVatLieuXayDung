import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';

class ProductsTab extends StatefulWidget {
  const ProductsTab({super.key});

  @override
  State<ProductsTab> createState() => _ProductsTabState();
}

class _ProductsTabState extends State<ProductsTab> with SingleTickerProviderStateMixin {
  final ApiService _apiService = ApiService();
  late TabController _tabController;

  List<dynamic> _products = [];
  List<dynamic> _categories = [];
  bool _isLoading = true;
  String? _error;
  String _searchQuery = '';

  final NumberFormat _currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        setState(() {}); // Cập nhật nút Thêm tương ứng với Tab
      }
    });
    _fetchAllData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchAllData() async {
    setState(() => _isLoading = true);
    try {
      final resProducts = await _apiService.getProducts();
      final resCategories = await _apiService.getCategories();

      if (mounted) {
        setState(() {
          if (resProducts.statusCode == 200 && resProducts.data != null) {
            _products = resProducts.data is List ? resProducts.data : [resProducts.data];
          }
          if (resCategories.statusCode == 200 && resCategories.data != null) {
            _categories = resCategories.data is List ? resCategories.data : [resCategories.data];
          }
          _isLoading = false;
          _error = null;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Không thể kết nối Backend.\nĐang hiển thị dữ liệu mẫu.';
          _products = _getMockProducts();
          _categories = _getMockCategories();
          _isLoading = false;
        });
      }
    }
  }

  List<dynamic> _getMockProducts() {
    return [
      {"maSanPham": 1, "maSP": "SP001", "tenSP": "Xi măng Insee Đa Dụng", "hinhAnh": "", "thuongHieu": "Insee", "xuatXu": "Việt Nam", "donViTinh": "Bao", "giaNhap": 80000, "giaBan": 90000, "mucTonToiThieu": 100, "soLuongTon": 500, "trangThai": true, "isGift": false, "tenLoai": "Xi măng"},
      {"maSanPham": 2, "maSP": "SP002", "tenSP": "Xi măng Hà Tiên PCB40", "hinhAnh": "", "thuongHieu": "Hà Tiên", "xuatXu": "Việt Nam", "donViTinh": "Bao", "giaNhap": 78000, "giaBan": 85000, "mucTonToiThieu": 100, "soLuongTon": 450, "trangThai": true, "isGift": false, "tenLoai": "Xi măng"},
      {"maSanPham": 3, "maSP": "SP003", "tenSP": "Thép Hòa Phát D10", "hinhAnh": "", "thuongHieu": "Hòa Phát", "xuatXu": "Việt Nam", "donViTinh": "Cây", "giaNhap": 140000, "giaBan": 155000, "mucTonToiThieu": 50, "soLuongTon": 120, "trangThai": true, "isGift": false, "tenLoai": "Sắt thép"},
      {"maSanPham": 21, "maSP": "SP021", "tenSP": "Bút thử điện thông minh", "hinhAnh": "", "thuongHieu": "OEM", "xuatXu": "Việt Nam", "donViTinh": "Cái", "giaNhap": 0, "giaBan": 0, "mucTonToiThieu": 50, "soLuongTon": 80, "trangThai": true, "isGift": true, "tenLoai": "Quà tặng"},
      {"maSanPham": 22, "maSP": "SP022", "tenSP": "Đèn pin siêu sáng", "hinhAnh": "", "thuongHieu": "OEM", "xuatXu": "Việt Nam", "donViTinh": "Cái", "giaNhap": 0, "giaBan": 0, "mucTonToiThieu": 30, "soLuongTon": 5, "trangThai": true, "isGift": true, "tenLoai": "Quà tặng"},
    ];
  }

  List<dynamic> _getMockCategories() {
    return [
      {"maLoaiSanPham": 1, "maLoai": "LSP01", "tenLoai": "Xi măng", "moTa": "Các loại xi măng xây dựng", "hinhAnh": ""},
      {"maLoaiSanPham": 2, "maLoai": "LSP02", "tenLoai": "Sắt thép", "moTa": "Thép cây, thép cuộn các loại", "hinhAnh": ""},
      {"maLoaiSanPham": 3, "maLoai": "LSP03", "tenLoai": "Gạch xây dựng", "moTa": "Gạch ống, gạch đinh, gạch men", "hinhAnh": ""},
    ];
  }

  // =========================================================================
  // DIALOG THÊM / SỬA SẢN PHẨM & QUÀ TẶNG
  // =========================================================================
  Future<void> _showAddEditProductDialog([Map<String, dynamic>? product, bool isGiftDefault = false]) async {
    final isEdit = product != null;
    final tenCtrl = TextEditingController(text: isEdit ? (product['tenSP'] ?? product['TenSP'] ?? '').toString() : '');
    final maSPCtrl = TextEditingController(text: isEdit ? (product['maSP'] ?? product['MaSP'] ?? '').toString() : '');
    final thuongHieuCtrl = TextEditingController(text: isEdit ? (product['thuongHieu'] ?? product['ThuongHieu'] ?? 'OEM').toString() : 'OEM');
    final xuatXuCtrl = TextEditingController(text: isEdit ? (product['xuatXu'] ?? product['XuatXu'] ?? 'Việt Nam').toString() : 'Việt Nam');
    final dvtCtrl = TextEditingController(text: isEdit ? (product['donViTinh'] ?? product['DonViTinh'] ?? 'Bao').toString() : 'Bao');
    final giaNhapCtrl = TextEditingController(text: isEdit ? (product['giaNhap'] ?? product['GiaNhap'] ?? 0).toString() : '0');
    final giaBanCtrl = TextEditingController(text: isEdit ? (product['giaBan'] ?? product['GiaBan'] ?? 0).toString() : '0');
    final tonThieuCtrl = TextEditingController(text: isEdit ? (product['mucTonToiThieu'] ?? product['MucTonToiThieu'] ?? 10).toString() : '10');
    bool isGift = isEdit ? (product['isGift'] ?? product['IsGift'] ?? false) : isGiftDefault;
    bool trangThai = isEdit ? (product['trangThai'] ?? product['TrangThai'] ?? true) : true;

    final formKey = GlobalKey<FormState>();

    await showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: Text(isEdit ? (isGift ? 'Sửa Quà Tặng' : 'Sửa Sản Phẩm') : (isGift ? 'Thêm Quà Tặng' : 'Thêm Sản Phẩm'), style: const TextStyle(fontWeight: FontWeight.bold)),
              content: SingleChildScrollView(
                child: Form(
                  key: formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      SwitchListTile(
                        title: const Text('Là sản phẩm quà tặng', style: TextStyle(fontWeight: FontWeight.bold)),
                        value: isGift,
                        onChanged: (val) {
                          setDialogState(() {
                            isGift = val;
                            if (isGift) {
                              giaNhapCtrl.text = '0';
                              giaBanCtrl.text = '0';
                            }
                          });
                        },
                      ),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: maSPCtrl,
                        decoration: const InputDecoration(labelText: 'Mã SP (SP001...)', border: OutlineInputBorder()),
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: tenCtrl,
                        decoration: const InputDecoration(labelText: 'Tên sản phẩm', border: OutlineInputBorder()),
                        validator: (val) => val == null || val.isEmpty ? 'Vui lòng nhập tên' : null,
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: thuongHieuCtrl,
                              decoration: const InputDecoration(labelText: 'Thương hiệu', border: OutlineInputBorder()),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: TextFormField(
                              controller: xuatXuCtrl,
                              decoration: const InputDecoration(labelText: 'Xuất xứ', border: OutlineInputBorder()),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: dvtCtrl,
                              decoration: const InputDecoration(labelText: 'Đơn vị tính', border: OutlineInputBorder()),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: TextFormField(
                              controller: tonThieuCtrl,
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(labelText: 'Tồn tối thiểu', border: OutlineInputBorder()),
                            ),
                          ),
                        ],
                      ),
                      if (!isGift) ...[
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: TextFormField(
                                controller: giaNhapCtrl,
                                keyboardType: TextInputType.number,
                                decoration: const InputDecoration(labelText: 'Giá nhập (đ)', border: OutlineInputBorder()),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: TextFormField(
                                controller: giaBanCtrl,
                                keyboardType: TextInputType.number,
                                decoration: const InputDecoration(labelText: 'Giá bán (đ)', border: OutlineInputBorder()),
                              ),
                            ),
                          ],
                        ),
                      ],
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
                        'maSP': maSPCtrl.text,
                        'tenSP': tenCtrl.text,
                        'thuongHieu': thuongHieuCtrl.text,
                        'xuatXu': xuatXuCtrl.text,
                        'donViTinh': dvtCtrl.text,
                        'giaNhap': double.tryParse(giaNhapCtrl.text) ?? 0,
                        'giaBan': double.tryParse(giaBanCtrl.text) ?? 0,
                        'mucTonToiThieu': int.tryParse(tonThieuCtrl.text) ?? 10,
                        'isGift': isGift,
                        'trangThai': trangThai,
                      };

                      try {
                        if (isEdit) {
                          final id = product['maSanPham'] ?? product['MaSanPham'] ?? product['id'];
                          await _apiService.updateProduct(id, data);
                          if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cập nhật thành công!')));
                        } else {
                          await _apiService.createProduct(data);
                          if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Thêm mới thành công!')));
                        }
                        _fetchAllData();
                      } catch (e) {
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi: $e')));
                          _fetchAllData();
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

  Future<void> _deleteProduct(dynamic product) async {
    final id = product['maSanPham'] ?? product['MaSanPham'] ?? product['id'];
    final ten = product['tenSP'] ?? product['TenSP'] ?? '';

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
        await _apiService.deleteProduct(id);
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Xóa thành công!')));
        _fetchAllData();
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi khi xóa: $e')));
          _fetchAllData();
        }
      }
    }
  }

  // =========================================================================
  // DIALOG THÊM / SỬA DANH MỤC (LOẠI SẢN PHẨM)
  // =========================================================================
  Future<void> _showAddEditCategoryDialog([Map<String, dynamic>? category]) async {
    final isEdit = category != null;
    final tenCtrl = TextEditingController(text: isEdit ? (category['tenLoai'] ?? category['TenLoai'] ?? '').toString() : '');
    final maLoaiCtrl = TextEditingController(text: isEdit ? (category['maLoai'] ?? category['MaLoai'] ?? '').toString() : '');
    final moTaCtrl = TextEditingController(text: isEdit ? (category['moTa'] ?? category['MoTa'] ?? '').toString() : '');

    final formKey = GlobalKey<FormState>();

    await showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text(isEdit ? 'Sửa Danh Mục' : 'Thêm Danh Mục', style: const TextStyle(fontWeight: FontWeight.bold)),
          content: SingleChildScrollView(
            child: Form(
              key: formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextFormField(
                    controller: maLoaiCtrl,
                    decoration: const InputDecoration(labelText: 'Mã loại (LSP01...)', border: OutlineInputBorder()),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: tenCtrl,
                    decoration: const InputDecoration(labelText: 'Tên danh mục', border: OutlineInputBorder()),
                    validator: (val) => val == null || val.isEmpty ? 'Vui lòng nhập tên danh mục' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: moTaCtrl,
                    decoration: const InputDecoration(labelText: 'Mô tả chi tiết', border: OutlineInputBorder()),
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
                    'maLoai': maLoaiCtrl.text,
                    'tenLoai': tenCtrl.text,
                    'moTa': moTaCtrl.text,
                  };

                  try {
                    if (isEdit) {
                      final id = category['maLoaiSanPham'] ?? category['MaLoaiSP'] ?? category['id'];
                      await _apiService.updateCategory(id, data);
                      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cập nhật thành công!')));
                    } else {
                      await _apiService.createCategory(data);
                      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Thêm mới thành công!')));
                    }
                    _fetchAllData();
                  } catch (e) {
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi: $e')));
                      _fetchAllData();
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

  Future<void> _deleteCategory(dynamic category) async {
    final id = category['maLoaiSanPham'] ?? category['MaLoaiSP'] ?? category['id'];
    final ten = category['tenLoai'] ?? category['TenLoai'] ?? '';

    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xác nhận xóa'),
        content: Text('Bạn có chắc chắn muốn xóa danh mục "$ten"?'),
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
        await _apiService.deleteCategory(id);
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Xóa thành công!')));
        _fetchAllData();
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi khi xóa: $e')));
          _fetchAllData();
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Phân loại danh sách
    final filteredProducts = _products.where((p) {
      final isGift = p['isGift'] ?? p['IsGift'] ?? false;
      if (isGift) return false;
      final name = (p['tenSP'] ?? p['TenSP'] ?? '').toString().toLowerCase();
      final code = (p['maSP'] ?? p['MaSP'] ?? '').toString().toLowerCase();
      return name.contains(_searchQuery.toLowerCase()) || code.contains(_searchQuery.toLowerCase());
    }).toList();

    final filteredGifts = _products.where((p) {
      final isGift = p['isGift'] ?? p['IsGift'] ?? false;
      if (!isGift) return false;
      final name = (p['tenSP'] ?? p['TenSP'] ?? '').toString().toLowerCase();
      final code = (p['maSP'] ?? p['MaSP'] ?? '').toString().toLowerCase();
      return name.contains(_searchQuery.toLowerCase()) || code.contains(_searchQuery.toLowerCase());
    }).toList();

    final filteredCategories = _categories.where((c) {
      final name = (c['tenLoai'] ?? c['TenLoai'] ?? '').toString().toLowerCase();
      return name.contains(_searchQuery.toLowerCase());
    }).toList();

    // Thống kê Tab 1
    final totalProd = filteredProducts.length;
    final activeProd = filteredProducts.where((p) => (p['trangThai'] ?? p['TrangThai'] ?? true) == true).length;
    final inactiveProd = totalProd - activeProd;
    final lowStockProd = filteredProducts.where((p) {
      final ton = p['soLuongTon'] ?? p['SoLuongTon'] ?? 0;
      final thieu = p['mucTonToiThieu'] ?? p['MucTonToiThieu'] ?? 10;
      return ton <= thieu;
    }).length;

    // Thống kê Tab 2
    final totalGift = filteredGifts.length;
    final activeGift = filteredGifts.where((p) => (p['trangThai'] ?? p['TrangThai'] ?? true) == true).length;
    final inactiveGift = totalGift - activeGift;
    final outOfStockGift = filteredGifts.where((p) => (p['soLuongTon'] ?? p['SoLuongTon'] ?? 0) == 0).length;

    return Scaffold(
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Kho Sản Phẩm & Danh Mục', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            Text('Quản lý toàn bộ danh sách sản phẩm và phân loại', style: TextStyle(fontSize: 12, fontWeight: FontWeight.normal)),
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
            Tab(icon: Icon(Icons.inventory_2), text: 'Sản Phẩm'),
            Tab(icon: Icon(Icons.card_giftcard), text: 'Sản Phẩm Quà Tặng'),
            Tab(icon: Icon(Icons.category), text: 'Loại Sản Phẩm (Danh Mục)'),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          if (_tabController.index == 0) {
            _showAddEditProductDialog(null, false);
          } else if (_tabController.index == 1) {
            _showAddEditProductDialog(null, true);
          } else {
            _showAddEditCategoryDialog();
          }
        },
        icon: Icon(_tabController.index == 2 ? Icons.add_chart : Icons.add),
        label: Text(_tabController.index == 0 ? 'Thêm Sản Phẩm' : (_tabController.index == 1 ? 'Thêm Quà Tặng' : 'Thêm Phân Loại')),
        backgroundColor: Colors.purple.shade800,
      ),
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
                      hintText: 'Tìm kiếm nhanh (Mã, Tên)...',
                      prefixIcon: const Icon(Icons.search),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(30)),
                      contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 20),
                      filled: true,
                      fillColor: Colors.grey.shade100,
                    ),
                  ),
                ),

                // Nội dung Tab
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      // TAB 1: SẢN PHẨM
                      _buildProductTabView(filteredProducts, totalProd, activeProd, inactiveProd, lowStockProd, false),

                      // TAB 2: QUÀ TẶNG
                      _buildProductTabView(filteredGifts, totalGift, activeGift, inactiveGift, outOfStockGift, true),

                      // TAB 3: DANH MỤC
                      _buildCategoryTabView(filteredCategories),
                    ],
                  ),
                ),
              ],
            ),
    );
  }

  // =========================================================================
  // GIAO DIỆN TAB 1 & TAB 2 (BẢNG SẢN PHẨM / QUÀ TẶNG CUỘN NGANG)
  // =========================================================================
  Widget _buildProductTabView(List<dynamic> list, int total, int active, int inactive, int alertCount, bool isGift) {
    return Column(
      children: [
        // 4 Thẻ thống kê
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              _buildStatCard(isGift ? 'Tổng quà tặng' : 'Tổng sản phẩm', total.toString(), Colors.blue),
              const SizedBox(width: 12),
              _buildStatCard('Đang hoạt động', active.toString(), Colors.green),
              const SizedBox(width: 12),
              _buildStatCard('Ngừng hoạt động', inactive.toString(), Colors.red),
              const SizedBox(width: 12),
              _buildStatCard(isGift ? 'Quà tặng hết hàng' : 'Cần nhập hàng', alertCount.toString(), Colors.orange),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Bảng dữ liệu cuộn ngang đầy đủ cột y như Web
        Expanded(
          child: list.isEmpty
              ? const Center(child: Text('Không tìm thấy dữ liệu'))
              : SingleChildScrollView(
                  scrollDirection: Axis.vertical,
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: DataTable(
                      headingRowColor: WidgetStateProperty.all(Colors.grey.shade200),
                      columnSpacing: 24,
                      dataRowMaxHeight: 64,
                      columns: const [
                        DataColumn(label: Text('Mã SP', style: TextStyle(fontWeight: FontWeight.bold))),
                        DataColumn(label: Text('Tên Sản Phẩm', style: TextStyle(fontWeight: FontWeight.bold))),
                        DataColumn(label: Text('Hình Ảnh', style: TextStyle(fontWeight: FontWeight.bold))),
                        DataColumn(label: Text('Nhà Cung Cấp', style: TextStyle(fontWeight: FontWeight.bold))),
                        DataColumn(label: Text('Thương Hiệu', style: TextStyle(fontWeight: FontWeight.bold))),
                        DataColumn(label: Text('Xuất Xứ', style: TextStyle(fontWeight: FontWeight.bold))),
                        DataColumn(label: Text('Loại SP', style: TextStyle(fontWeight: FontWeight.bold))),
                        DataColumn(label: Text('ĐVT', style: TextStyle(fontWeight: FontWeight.bold))),
                        DataColumn(label: Text('Giá Nhập', style: TextStyle(fontWeight: FontWeight.bold))),
                        DataColumn(label: Text('Giá Bán', style: TextStyle(fontWeight: FontWeight.bold))),
                        DataColumn(label: Text('Tồn Kho / Tồn Thiểu', style: TextStyle(fontWeight: FontWeight.bold))),
                        DataColumn(label: Text('Trạng Thái', style: TextStyle(fontWeight: FontWeight.bold))),
                        DataColumn(label: Text('Thao Tác', style: TextStyle(fontWeight: FontWeight.bold))),
                      ],
                      rows: list.map((p) {
                        final maSP = p['maSP'] ?? p['MaSP'] ?? p['maSanPham'] ?? '';
                        final tenSP = p['tenSP'] ?? p['TenSP'] ?? 'Chưa đặt tên';
                        final thuongHieu = p['thuongHieu'] ?? p['ThuongHieu'] ?? 'OEM';
                        final xuatXu = p['xuatXu'] ?? p['XuatXu'] ?? 'Việt Nam';
                        final tenLoai = p['tenLoai'] ?? p['TenLoai'] ?? (isGift ? 'Quà tặng' : 'Vật tư');
                        final dvt = p['donViTinh'] ?? p['DonViTinh'] ?? 'Bao';
                        final giaNhap = p['giaNhap'] ?? p['GiaNhap'] ?? 0;
                        final giaBan = p['giaBan'] ?? p['GiaBan'] ?? 0;
                        final tonKho = p['soLuongTon'] ?? p['SoLuongTon'] ?? 0;
                        final tonThieu = p['mucTonToiThieu'] ?? p['MucTonToiThieu'] ?? 10;
                        final trangThai = p['trangThai'] ?? p['TrangThai'] ?? true;

                        // Lấy tên nhà cung cấp đầu tiên
                        String tenNCC = 'Chưa gán';
                        final nccList = p['nhaCungCaps'] ?? p['NhaCungCaps'];
                        if (nccList != null && nccList is List && nccList.isNotEmpty) {
                          tenNCC = nccList[0]['tenNCC'] ?? nccList[0]['TenNCC'] ?? 'CT Xi Măng Hà Tiên';
                        }

                        return DataRow(
                          cells: [
                            DataCell(Text(maSP.toString(), style: const TextStyle(color: Colors.blue, fontWeight: FontWeight.bold))),
                            DataCell(SizedBox(width: 180, child: Text(tenSP.toString(), style: const TextStyle(fontWeight: FontWeight.bold), maxLines: 2, overflow: TextOverflow.ellipsis))),
                            DataCell(Container(width: 40, height: 40, decoration: BoxDecoration(color: Colors.grey.shade200, borderRadius: BorderRadius.circular(4)), child: const Icon(Icons.image, color: Colors.grey))),
                            DataCell(Chip(label: Text(tenNCC, style: const TextStyle(fontSize: 12, color: Colors.blue)), backgroundColor: Colors.blue.shade50)),
                            DataCell(Text(thuongHieu.toString())),
                            DataCell(Text(xuatXu.toString())),
                            DataCell(Text(tenLoai.toString())),
                            DataCell(Text(dvt.toString())),
                            DataCell(Text(isGift ? '—' : _currencyFormat.format(giaNhap))),
                            DataCell(Text(isGift ? '—' : _currencyFormat.format(giaBan), style: const TextStyle(fontWeight: FontWeight.bold))),
                            DataCell(Text('$tonKho / $tonThieu', style: TextStyle(color: tonKho <= tonThieu ? Colors.red : Colors.green, fontWeight: FontWeight.bold))),
                            DataCell(Chip(
                              label: Text(trangThai ? 'Hoạt động' : 'Ngừng', style: TextStyle(color: trangThai ? Colors.green.shade800 : Colors.red.shade800, fontSize: 12)),
                              backgroundColor: trangThai ? Colors.green.shade100 : Colors.red.shade100,
                            )),
                            DataCell(Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                IconButton(icon: const Icon(Icons.edit, color: Colors.orange), onPressed: () => _showAddEditProductDialog(p as Map<String, dynamic>, isGift)),
                                IconButton(icon: const Icon(Icons.delete, color: Colors.red), onPressed: () => _deleteProduct(p)),
                              ],
                            )),
                          ],
                        );
                      }).toList(),
                    ),
                  ),
                ),
        ),
      ],
    );
  }

  // =========================================================================
  // GIAO DIỆN TAB 3 (BẢNG DANH MỤC CUỘN NGANG)
  // =========================================================================
  Widget _buildCategoryTabView(List<dynamic> list) {
    return list.isEmpty
        ? const Center(child: Text('Không tìm thấy danh mục'))
        : SingleChildScrollView(
            scrollDirection: Axis.vertical,
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: DataTable(
                headingRowColor: WidgetStateProperty.all(Colors.grey.shade200),
                columnSpacing: 32,
                dataRowMaxHeight: 64,
                columns: const [
                  DataColumn(label: Text('Hệ Thống ID', style: TextStyle(fontWeight: FontWeight.bold))),
                  DataColumn(label: Text('Tên Loại / Danh Mục', style: TextStyle(fontWeight: FontWeight.bold))),
                  DataColumn(label: Text('Hình Ảnh', style: TextStyle(fontWeight: FontWeight.bold))),
                  DataColumn(label: Text('Mô Tả', style: TextStyle(fontWeight: FontWeight.bold))),
                  DataColumn(label: Text('Thao Tác', style: TextStyle(fontWeight: FontWeight.bold))),
                ],
                rows: list.map((c) {
                  final maLoai = c['maLoai'] ?? c['MaLoai'] ?? 'LSP01';
                  final tenLoai = c['tenLoai'] ?? c['TenLoai'] ?? 'Tên danh mục';
                  final moTa = c['moTa'] ?? c['MoTa'] ?? 'Không có mô tả';

                  return DataRow(
                    cells: [
                      DataCell(Text(maLoai.toString(), style: const TextStyle(color: Colors.teal, fontWeight: FontWeight.bold))),
                      DataCell(Text(tenLoai.toString(), style: const TextStyle(fontWeight: FontWeight.bold))),
                      DataCell(Container(width: 40, height: 40, decoration: BoxDecoration(color: Colors.grey.shade200, borderRadius: BorderRadius.circular(4)), child: const Icon(Icons.category, color: Colors.teal))),
                      DataCell(SizedBox(width: 250, child: Text(moTa.toString(), maxLines: 2, overflow: TextOverflow.ellipsis))),
                      DataCell(Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          TextButton.icon(icon: const Icon(Icons.edit, size: 16, color: Colors.blue), label: const Text('SỬA', style: TextStyle(color: Colors.blue)), onPressed: () => _showAddEditCategoryDialog(c as Map<String, dynamic>)),
                          const SizedBox(width: 8),
                          TextButton.icon(icon: const Icon(Icons.delete, size: 16, color: Colors.red), label: const Text('XÓA', style: TextStyle(color: Colors.red)), onPressed: () => _deleteCategory(c)),
                        ],
                      )),
                    ],
                  );
                }).toList(),
              ),
            ),
          );
  }

  // Thẻ thống kê Header
  Widget _buildStatCard(String title, String value, Color color) {
    return Container(
      width: 150,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.3)),
        boxShadow: [BoxShadow(color: Colors.grey.withValues(alpha: 0.1), blurRadius: 4, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
          const SizedBox(height: 6),
          Text(value, style: TextStyle(color: color, fontSize: 20, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
