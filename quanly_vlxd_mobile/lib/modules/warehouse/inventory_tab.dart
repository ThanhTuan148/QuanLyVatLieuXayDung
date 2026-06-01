import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';
import '../../services/shared_preferences_service.dart';
import '../../core/permission_helper.dart';

class InventoryTab extends StatefulWidget {
  const InventoryTab({super.key});

  @override
  State<InventoryTab> createState() => _InventoryTabState();
}

class _InventoryTabState extends State<InventoryTab> with SingleTickerProviderStateMixin {
  final ApiService _apiService = ApiService();
  List<dynamic> _inventory = [];
  bool _isLoading = true;
  String? _error;
  bool _isTableView = false;
  String _searchQuery = '';

  // Tab & Outbound properties
  late TabController _tabController;
  List<dynamic> _outbounds = [];
  List<dynamic> _filteredOutbounds = [];
  String _outboundSearchQuery = '';
  String _selectedOutboundStatus = 'Tất cả';
  DateTime? _outboundStartDate;
  DateTime? _outboundEndDate;
  bool _isLoadingOutbounds = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() {
      setState(() {});
    });
    _fetchInventory();
    _loadOutbounds();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchInventory() async {
    try {
      final response = await _apiService.getInventory();
      if (response.statusCode == 200 && response.data != null) {
        if (mounted) {
          setState(() {
            _inventory = response.data is List
                ? response.data
                : [response.data];
            _isLoading = false;
            _error = null;
          });
        }
      } else {
        if (mounted) {
          setState(() {
            _error = 'Lỗi tải tồn kho: ${response.statusCode}';
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Không kết nối được Backend. Đang hiển thị dữ liệu mẫu.';
          _inventory = [
            {
              "maSanPham": 1,
              "tenSanPham": "Xi măng Insee Đa Dụng",
              "tongTon": 1250,
              "donViTinh": "Bao",
              "kho": [
                {"maKhoHang": 1, "tenKho": "Kho Trung Tâm", "soLuongTon": 1000},
                {
                  "maKhoHang": 2,
                  "tenKho": "Kho Chi Nhánh 1",
                  "soLuongTon": 250,
                },
              ],
            },
            {
              "maSanPham": 2,
              "tenSanPham": "Thép cuộn Pomina D10",
              "tongTon": 400,
              "donViTinh": "Kg",
              "kho": [
                {"maKhoHang": 1, "tenKho": "Kho Trung Tâm", "soLuongTon": 400},
              ],
            },
          ];
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _loadOutbounds() async {
    setState(() => _isLoadingOutbounds = true);
    try {
      final response = await _apiService.getOutboundHistory();
      if (response.statusCode == 200 && response.data != null) {
        if (!mounted) return;
        setState(() {
          _outbounds = response.data;
          _applyOutboundFilters();
        });
      }
    } catch (e) {
      // Silent error or fallback
    } finally {
      if (mounted) {
        setState(() => _isLoadingOutbounds = false);
      }
    }
  }

  void _applyOutboundFilters() {
    setState(() {
      _filteredOutbounds = _outbounds.where((item) {
        final maXK = (item['maXK'] ?? item['maPhieuXK'] ?? '').toString().toLowerCase();
        final maGH = (item['maGH'] ?? '').toString().toLowerCase();
        final maHD = (item['maHD'] ?? '').toString().toLowerCase();
        final nguoiXuat = (item['tenNhanVien'] ?? item['nguoiXuat'] ?? '').toString().toLowerCase();
        final matchQuery = maXK.contains(_outboundSearchQuery.toLowerCase()) ||
            maGH.contains(_outboundSearchQuery.toLowerCase()) ||
            maHD.contains(_outboundSearchQuery.toLowerCase()) ||
            nguoiXuat.contains(_outboundSearchQuery.toLowerCase());

        final trangThai = (item['trangThai'] ?? '').toString();
        final matchStatus = _selectedOutboundStatus == 'Tất cả' ||
            trangThai.toLowerCase() == _selectedOutboundStatus.toLowerCase();

        bool matchDate = true;
        if (_outboundStartDate != null && _outboundEndDate != null) {
          try {
            final dateStr = item['ngayXuat'] ?? item['ngayTao'];
            if (dateStr != null) {
              final itemDate = DateTime.parse(dateStr.toString());
              matchDate = itemDate.isAfter(_outboundStartDate!.subtract(const Duration(days: 1))) &&
                  itemDate.isBefore(_outboundEndDate!.add(const Duration(days: 1)));
            }
          } catch (_) {}
        }

        return matchQuery && matchStatus && matchDate;
      }).toList();
    });
  }

  Future<void> _selectOutboundDateRange() async {
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
      initialDateRange: _outboundStartDate != null && _outboundEndDate != null
          ? DateTimeRange(start: _outboundStartDate!, end: _outboundEndDate!)
          : null,
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: Colors.orange.shade800,
              onPrimary: Colors.white,
              onSurface: Colors.black87,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        _outboundStartDate = picked.start;
        _outboundEndDate = picked.end;
        _applyOutboundFilters();
      });
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Chờ duyệt':
        return Colors.orange;
      case 'Đã duyệt':
        return Colors.blue;
      case 'Chờ nhận':
        return Colors.teal;
      case 'Đã xuất':
        return Colors.green;
      case 'Đã nhận một phần':
        return Colors.purple;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: Colors.orange),
      );
    }

    final regularList = _inventory.where((item) {
      final isGift = item['isGift'] ?? item['IsGift'] ?? false;
      return !isGift;
    }).toList();

    final giftList = _inventory.where((item) {
      final isGift = item['isGift'] ?? item['IsGift'] ?? false;
      return isGift;
    }).toList();

    return Column(
      children: [
        Card(
          margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              children: [
                _tabController.index == 2
                    ? _buildOutboundFilterToolbar()
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Quản Lý Kho Hàng',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 18,
                            ),
                          ),
                          IconButton(
                            icon: Icon(
                              _isTableView ? Icons.grid_view : Icons.table_chart,
                              color: Colors.orange,
                            ),
                            tooltip: _isTableView
                                ? 'Chuyển sang dạng Thẻ'
                                : 'Chuyển sang dạng Bảng',
                            onPressed: () =>
                                setState(() => _isTableView = !_isTableView),
                          ),
                        ],
                      ),
                const SizedBox(height: 12),
                _tabController.index == 2
                    ? const SizedBox.shrink()
                    : TextField(
                        onChanged: (val) => setState(() => _searchQuery = val),
                        decoration: InputDecoration(
                          hintText: 'Tìm kiếm vật tư...',
                          prefixIcon: const Icon(Icons.search),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                          filled: true,
                          fillColor: Colors.grey.shade200,
                        ),
                      ),
                const SizedBox(height: 12),
                TabBar(
                  controller: _tabController,
                  labelColor: Colors.orange.shade800,
                  unselectedLabelColor: Colors.grey.shade600,
                  indicatorColor: Colors.orange.shade800,
                  indicatorSize: TabBarIndicatorSize.tab,
                  labelStyle: const TextStyle(fontWeight: FontWeight.bold),
                  tabs: const [
                    Tab(icon: Icon(Icons.inventory_2_outlined), text: 'Vật Tư'),
                    Tab(icon: Icon(Icons.card_giftcard), text: 'Quà Tặng'),
                    Tab(icon: Icon(Icons.local_shipping_outlined), text: 'Lịch Sử Xuất Kho'),
                  ],
                ),
              ],
            ),
          ),
        ),

        if (_error != null)
          Container(
            padding: const EdgeInsets.all(12),
            margin: const EdgeInsets.only(bottom: 8, left: 8, right: 8),
            decoration: BoxDecoration(
              color: Colors.amber.shade100,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                const Icon(Icons.warning_amber_rounded, color: Colors.orange),
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

        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildTabContent(regularList),
              _buildTabContent(giftList),
              _buildOutboundTabContent(),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTabContent(List<dynamic> list) {
    final filtered = list.where((item) {
      final ten = (item['tenSanPham'] ?? item['TenSanPham'] ?? '')
          .toString()
          .toLowerCase();
      return ten.contains(_searchQuery.toLowerCase());
    }).toList();

    if (filtered.isEmpty) {
      return const Center(child: Text('Không tìm thấy vật tư nào'));
    }

    return _isTableView
        ? _buildTableView(filtered)
        : _buildCardView(filtered);
  }

  Widget _buildTableView(List<dynamic> list) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: SingleChildScrollView(
        scrollDirection: Axis.vertical,
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: DataTable(
            headingRowColor: WidgetStateProperty.all(Colors.grey.shade100),
            columns: const [
              DataColumn(
                label: Text(
                  'Tên Sản Phẩm',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              DataColumn(
                label: Text(
                  'Tổng Tồn',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              DataColumn(
                label: Text(
                  'ĐVT',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              DataColumn(
                label: Text(
                  'Chi Tiết Từng Kho',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ],
            rows: list.map((item) {
              final ten =
                  item['tenSanPham'] ??
                  item['TenSanPham'] ??
                  item['name'] ??
                  'Sản phẩm';
              final tong =
                  item['tongTon'] ?? item['TongTon'] ?? item['soLuongTon'] ?? 0;
              final dvt = item['donViTinh'] ?? item['DonViTinh'] ?? 'Đơn vị';
              final khoList = item['kho'] ?? item['Kho'] ?? [];

              String chiTietKho = '';
              if (khoList != null && khoList is List) {
                chiTietKho = khoList
                    .map((k) {
                      final tenKho = k['tenKho'] ?? k['TenKho'] ?? 'Kho';
                      final sl = k['soLuongTon'] ?? k['SoLuongTon'] ?? 0;
                      return '$tenKho: $sl';
                    })
                    .join(' | ');
              }

              return DataRow(
                cells: [
                  DataCell(
                    Text(
                      ten.toString(),
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                  DataCell(
                    Text(
                      tong.toString(),
                      style: const TextStyle(
                        color: Colors.orange,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  DataCell(Text(dvt.toString())),
                  DataCell(Text(chiTietKho)),
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
      padding: const EdgeInsets.symmetric(horizontal: 8),
      itemCount: list.length,
      itemBuilder: (context, index) {
        final item = list[index];
        final ten =
            item['tenSanPham'] ??
            item['TenSanPham'] ??
            item['name'] ??
            item['Name'] ??
            'Sản phẩm';
        final tong =
            item['tongTon'] ??
            item['TongTon'] ??
            item['totalStock'] ??
            item['TotalStock'] ??
            item['soLuongTon'] ??
            0;
        final dvt =
            item['donViTinh'] ??
            item['DonViTinh'] ??
            item['unit'] ??
            item['Unit'] ??
            'Đơn vị';
        final khoList =
            item['kho'] ??
            item['Kho'] ??
            item['warehouses'] ??
            item['Warehouses'] ??
            [
              {
                'tenKho': item['tenKho'] ?? item['TenKho'] ?? 'Kho',
                'soLuongTon': item['soLuongTon'] ?? item['SoLuongTon'] ?? item['tongTon'] ?? item['soLuong'] ?? 0,
              }
            ];

        return Card(
          elevation: 2,
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          child: ExpansionTile(
            leading: CircleAvatar(
              backgroundColor: Colors.orange.shade100,
              child: const Icon(Icons.inventory_2, color: Colors.orange),
            ),
            title: Text(
              ten.toString(),
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            subtitle: Text('Tổng tồn: $tong $dvt'),
            children: [
              const Divider(height: 1),
              if (khoList != null && khoList is List)
                ...khoList.map((k) {
                  final tenKho =
                      k['tenKho'] ??
                      k['TenKho'] ??
                      k['warehouseName'] ??
                      k['WarehouseName'] ??
                      'Kho';
                  final sl =
                      k['soLuongTon'] ??
                      k['SoLuongTon'] ??
                      k['stock'] ??
                      k['Stock'] ??
                      0;
                  return ListTile(
                    dense: true,
                    leading: const Icon(
                      Icons.location_on,
                      size: 16,
                      color: Colors.grey,
                    ),
                    title: Text(tenKho.toString()),
                    trailing: Text(
                      '$sl',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  );
                }),
            ],
          ),
        );
      },
    );
  }

  Widget _buildOutboundFilterToolbar() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: TextField(
                decoration: InputDecoration(
                  hintText: 'Tìm kiếm PXK, mã giao hàng, HĐ...',
                  prefixIcon: const Icon(Icons.search, size: 20),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide(color: Colors.grey.shade300),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide(color: Colors.grey.shade200),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide(color: Colors.orange.shade800, width: 1.5),
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  fillColor: Colors.grey.shade50,
                  filled: true,
                ),
                onChanged: (val) {
                  setState(() {
                    _outboundSearchQuery = val;
                    _applyOutboundFilters();
                  });
                },
              ),
            ),
            const SizedBox(width: 8),
            IconButton(
              icon: Icon(_isTableView ? Icons.grid_view : Icons.table_chart, color: Colors.orange.shade800, size: 20),
              tooltip: _isTableView ? 'Dạng Thẻ' : 'Dạng Bảng',
              onPressed: () => setState(() => _isTableView = !_isTableView),
              constraints: const BoxConstraints(),
              padding: const EdgeInsets.all(8),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            OutlinedButton.icon(
              onPressed: _selectOutboundDateRange,
              icon: const Icon(Icons.calendar_month, size: 16),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.grey.shade800,
                side: BorderSide(color: Colors.grey.shade300),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              ),
              label: Text(
                _outboundStartDate != null && _outboundEndDate != null
                    ? '${DateFormat('dd/MM').format(_outboundStartDate!)} - ${DateFormat('dd/MM').format(_outboundEndDate!)}'
                    : 'Khoảng thời gian',
                style: const TextStyle(fontSize: 12),
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade300),
                borderRadius: BorderRadius.circular(8),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _selectedOutboundStatus,
                  icon: const Icon(Icons.filter_list, size: 16),
                  style: TextStyle(color: Colors.grey.shade800, fontSize: 12),
                  items: [
                    'Tất cả',
                    'Chờ duyệt',
                    'Đã duyệt',
                    'Chờ nhận',
                    'Đã xuất',
                    'Đã nhận một phần',
                  ]
                      .map((s) => DropdownMenuItem(
                            value: s,
                            child: Text(s),
                          ))
                      .toList(),
                  onChanged: (val) {
                    if (val != null) {
                      setState(() {
                        _selectedOutboundStatus = val;
                        _applyOutboundFilters();
                      });
                    }
                  },
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildOutboundTabContent() {
    return _isLoadingOutbounds
        ? const Center(child: CircularProgressIndicator(color: Colors.orange))
        : _filteredOutbounds.isEmpty
            ? const Center(child: Text('Không tìm thấy phiếu xuất nào phù hợp', style: TextStyle(color: Colors.grey, fontSize: 16)))
            : _isTableView
                ? _buildOutboundTableView()
                : _buildOutboundCardView();
  }

  Widget _buildOutboundTableView() {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: RefreshIndicator(
        onRefresh: _loadOutbounds,
        color: Colors.orange.shade800,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          scrollDirection: Axis.vertical,
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: DataTable(
            headingRowColor: WidgetStateProperty.all(Colors.grey.shade100),
            columns: const [
              DataColumn(label: Text('Mã Phiếu', style: TextStyle(fontWeight: FontWeight.bold))),
              DataColumn(label: Text('Ngày Xuất', style: TextStyle(fontWeight: FontWeight.bold))),
              DataColumn(label: Text('Người Lập', style: TextStyle(fontWeight: FontWeight.bold))),
              DataColumn(label: Text('Liên Kết', style: TextStyle(fontWeight: FontWeight.bold))),
              DataColumn(label: Text('Trạng Thái', style: TextStyle(fontWeight: FontWeight.bold))),
              DataColumn(label: Text('Tác Vụ', style: TextStyle(fontWeight: FontWeight.bold))),
            ],
            rows: _filteredOutbounds.map((item) {
              final status = item['trangThai'] ?? 'Chờ duyệt';
              return DataRow(
                cells: [
                  DataCell(
                    TextButton(
                      onPressed: () => _showOutboundDetailDialog(item),
                      child: Text(item['maXK'] ?? 'PXK#${item['maPhieuXK']}', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.orange.shade800)),
                    ),
                  ),
                  DataCell(Text(item['ngayXuat'] != null ? DateFormat('dd/MM/yyyy').format(DateTime.parse(item['ngayXuat'])) : 'N/A')),
                  DataCell(Text(item['tenNhanVien'] ?? item['nguoiXuat'] ?? 'N/A')),
                  DataCell(Text('GH: ${item['maGH'] ?? 'N/A'} | HĐ: ${item['maHD'] ?? 'N/A'}')),
                  DataCell(
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(color: _getStatusColor(status).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                      child: Text(status, style: TextStyle(color: _getStatusColor(status), fontWeight: FontWeight.bold, fontSize: 12)),
                    ),
                  ),
                  DataCell(
                    IconButton(
                      icon: Icon(Icons.remove_red_eye, color: Colors.orange.shade800),
                      tooltip: 'Xem chi tiết',
                      onPressed: () => _showOutboundDetailDialog(item),
                    ),
                  ),
                ],
              );
            }).toList(),
          ),
        ),
      ),
    ),
  );
}

  Widget _buildOutboundCardView() {
    return RefreshIndicator(
      onRefresh: _loadOutbounds,
      color: Colors.orange.shade800,
      child: ListView.builder(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 8),
        itemCount: _filteredOutbounds.length,
        itemBuilder: (context, index) {
          final item = _filteredOutbounds[index];
          final status = item['trangThai'] ?? 'Chờ duyệt';

          return Card(
            elevation: 2,
            margin: const EdgeInsets.only(bottom: 12),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: ListTile(
              contentPadding: const EdgeInsets.all(16),
              leading: CircleAvatar(
                backgroundColor: _getStatusColor(status).withValues(alpha: 0.1),
                child: Icon(Icons.logout, color: _getStatusColor(status)),
              ),
              title: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(item['maXK'] ?? 'PXK#${item['maPhieuXK']}', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.orange.shade800)),
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
                  Text('Người xuất: ${item['nguoiXuat'] ?? 'Hệ thống'} | Thực hiện: ${item['tenNhanVien'] ?? 'N/A'}'),
                  const SizedBox(height: 4),
                  Text('Ngày lập: ${item['ngayXuat'] != null ? DateFormat('dd/MM/yyyy').format(DateTime.parse(item['ngayXuat'])) : 'N/A'}'),
                  const SizedBox(height: 8),
                  Text('GH: ${item['maGH'] ?? 'N/A'} | HĐ: ${item['maHD'] ?? 'N/A'}', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blueGrey)),
                ],
              ),
              trailing: const Icon(Icons.arrow_forward_ios, size: 16),
              onTap: () => _showOutboundDetailDialog(item),
            ),
          );
        },
      ),
    );
  }

  void _showOutboundDetailDialog(Map<String, dynamic> outbound) {
    _showOutboundDetailPopup(outbound);
  }

  void _showOutboundDetailPopup(Map<String, dynamic> detail) {
    final chiTiet = (detail['chiTiet'] as List<dynamic>?) ?? [];
    final currentStatus = detail['trangThai'] ?? 'Chờ duyệt';
    final int maPhieuXK = detail['maPhieuXK'];

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (dialogCtx, setPopupState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Row(
                      children: [
                        Icon(Icons.output_outlined, color: Colors.orange.shade800),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Phiếu Xuất: ${detail['maXK'] ?? 'PXK#$maPhieuXK'}',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: _getStatusColor(currentStatus).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      currentStatus,
                      style: TextStyle(
                        color: _getStatusColor(currentStatus),
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
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
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                          side: BorderSide(color: Colors.grey.shade200),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Người lập: ${detail['nguoiXuat'] ?? 'Hệ thống'}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                              const SizedBox(height: 8),
                              Text('Nhân viên thực hiện: ${detail['tenNhanVien'] ?? 'N/A'}'),
                              const SizedBox(height: 8),
                              Text('Ngày xuất: ${detail['ngayXuat'] != null ? DateFormat('dd/MM/yyyy HH:mm').format(DateTime.parse(detail['ngayXuat'])) : 'N/A'}'),
                              const SizedBox(height: 8),
                              Text('Liên kết: GH: ${detail['maGH'] ?? 'N/A'} | HĐ: ${detail['maHD'] ?? 'N/A'}'),
                              const SizedBox(height: 8),
                              Text('Ghi chú: ${detail['ghiChu'] ?? 'Không có'}'),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),
                      const Text('DANH SÁCH MẶT HÀNG XUẤT KHO:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.black87)),
                      const SizedBox(height: 12),
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: chiTiet.length,
                        itemBuilder: (context, index) {
                          final item = chiTiet[index];
                          return Card(
                            color: Colors.white,
                            margin: const EdgeInsets.only(bottom: 8),
                            elevation: 1,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                              side: BorderSide(color: Colors.grey.shade200),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item['tenSanPham'] ?? 'SP #${item['maSanPham']}',
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                  ),
                                  const SizedBox(height: 8),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text('Số lượng yêu cầu: ${item['soLuong']}'),
                                      Text(
                                        'Thực nhận: ${item['soLuongThucNhan'] ?? 0}',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          color: (item['soLuongThucNhan'] ?? 0) >= item['soLuong']
                                              ? Colors.green
                                              : Colors.orange,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Kho xuất: ${item['tenKho'] ?? 'Kho chính'}',
                                    style: TextStyle(fontStyle: FontStyle.italic, color: Colors.grey.shade700, fontSize: 13),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(dialogCtx),
                  child: const Text('ĐÓNG', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
                ),
                if (currentStatus == 'Chờ duyệt')
                  ElevatedButton.icon(
                    onPressed: () async {
                      Navigator.pop(dialogCtx);
                      await _handleApproveOutbound(maPhieuXK);
                    },
                    icon: const Icon(Icons.check_circle_outline),
                    label: const Text('DUYỆT & KÝ SỐ'),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
                  ),
                if (currentStatus == 'Đã duyệt')
                  ElevatedButton.icon(
                    onPressed: () async {
                      Navigator.pop(dialogCtx);
                      await _handleConfirmExport(maPhieuXK);
                    },
                    icon: const Icon(Icons.inventory_2),
                    label: const Text('XÁC NHẬN SOẠN HÀNG XONG'),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.blue, foregroundColor: Colors.white),
                  ),
                if (currentStatus == 'Chờ nhận' || currentStatus == 'Đã nhận một phần')
                  ElevatedButton.icon(
                    onPressed: () {
                      Navigator.pop(dialogCtx);
                      _showConfirmReceiptDialog(detail);
                    },
                    icon: const Icon(Icons.local_shipping),
                    label: const Text('TÀI XẾ NHẬN HÀNG'),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.orange.shade800, foregroundColor: Colors.white),
                  ),
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _handleApproveOutbound(int id) async {
    setState(() => _isLoadingOutbounds = true);
    try {
      int userId = 1;
      final userStr = SharedPreferencesService.getUser();
      if (userStr != null && userStr.isNotEmpty) {
        final userObj = jsonDecode(userStr);
        userId = userObj['id'] ?? userObj['Id'] ?? 1;
      }

      final response = await _apiService.approveOutbound(id, {'managerId': userId});
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(response.data['message'] ?? 'Phê duyệt phiếu xuất kho thành công!'), backgroundColor: Colors.green),
      );
      _loadOutbounds();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi phê duyệt: $e'), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) {
        setState(() => _isLoadingOutbounds = false);
      }
    }
  }

  Future<void> _handleConfirmExport(int id) async {
    setState(() => _isLoadingOutbounds = true);
    try {
      int userId = 1;
      final userStr = SharedPreferencesService.getUser();
      if (userStr != null && userStr.isNotEmpty) {
        final userObj = jsonDecode(userStr);
        userId = userObj['id'] ?? userObj['Id'] ?? 1;
      }

      final response = await _apiService.confirmExport(id, {'managerId': userId});
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(response.data['message'] ?? 'Xác nhận soạn hàng xong thành công!'), backgroundColor: Colors.green),
      );
      _loadOutbounds();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi xác nhận: $e'), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) {
        setState(() => _isLoadingOutbounds = false);
      }
    }
  }

  void _showConfirmReceiptDialog(Map<String, dynamic> detail) {
    final chiTiet = (detail['chiTiet'] as List<dynamic>?) ?? [];
    final int maPhieuXK = detail['maPhieuXK'];

    final List<Map<String, dynamic>> itemsPayload = chiTiet.map((item) {
      final int soLuong = item['soLuong'];
      final int soLuongThucNhan = item['soLuongThucNhan'] ?? 0;
      final int remaining = soLuong - soLuongThucNhan;
      final int initialNhan = remaining > 0 ? remaining : 0;

      return {
        'maSanPham': item['maSanPham'],
        'tenSanPham': item['tenSanPham'],
        'soLuong': soLuong,
        'soLuongThucNhan': soLuongThucNhan,
        'soLuongNhan': initialNhan,
        'nhanDu': true, // Mặc định là Nhận đủ
        'controller': TextEditingController(text: initialNhan.toString()),
        'ghiChuController': TextEditingController(),
      };
    }).toList();

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: Row(
                children: [
                  Icon(Icons.assignment_turned_in_outlined, color: Colors.orange.shade800),
                  const SizedBox(width: 8),
                  const Text('Xác nhận nhận hàng thực tế', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                ],
              ),
              content: SizedBox(
                width: double.maxFinite,
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Alert Warning Box
                      Container(
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: Colors.blue.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.blue.shade100),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(Icons.info_outline, color: Colors.blue.shade700, size: 20),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'Tài xế vui lòng kiểm tra kỹ số lượng hàng nhận từ kho trước khi xác nhận đi giao.',
                                style: TextStyle(
                                  color: Colors.blue.shade800,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      // List of items
                      ...itemsPayload.map((item) {
                        final int soLuong = item['soLuong'];
                        final int soLuongThucNhan = item['soLuongThucNhan'];
                        final int remaining = soLuong - soLuongThucNhan;
                        final bool isNhanDu = item['nhanDu'];

                        return Card(
                          margin: const EdgeInsets.only(bottom: 16),
                          elevation: 2,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: BorderSide(color: Colors.grey.shade200),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(12.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item['tenSanPham'],
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.black87),
                                ),
                                const SizedBox(height: 12),
                                // Grid of columns: Tổng yêu cầu | Đã nhận | Còn lại
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    _buildInfoColumn('Tổng yêu cầu', soLuong.toString(), Colors.black87),
                                    _buildInfoColumn('Đã nhận', soLuongThucNhan.toString(), Colors.green),
                                    _buildInfoColumn('Còn lại', remaining.toString(), remaining > 0 ? Colors.red : Colors.grey),
                                  ],
                                ),
                                const Divider(height: 24),
                                Row(
                                  children: [
                                    // Nhận đủ checkbox
                                    Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Checkbox(
                                          value: isNhanDu,
                                          activeColor: Colors.green,
                                          onChanged: (val) {
                                            setDialogState(() {
                                              item['nhanDu'] = val ?? false;
                                              if (item['nhanDu']) {
                                                item['soLuongNhan'] = remaining > 0 ? remaining : 0;
                                                item['controller'].text = item['soLuongNhan'].toString();
                                              }
                                            });
                                          },
                                        ),
                                        const Text('Nhận đủ', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                      ],
                                    ),
                                    const Spacer(),
                                    // S.Lần này input field
                                    SizedBox(
                                      width: 110,
                                      child: TextField(
                                        controller: item['controller'],
                                        keyboardType: TextInputType.number,
                                        enabled: !isNhanDu,
                                        style: const TextStyle(fontWeight: FontWeight.bold),
                                        decoration: const InputDecoration(
                                          labelText: 'S.Lần này',
                                          border: OutlineInputBorder(),
                                          isDense: true,
                                          contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                                        ),
                                        onChanged: (val) {
                                          final parsed = int.tryParse(val) ?? 0;
                                          item['soLuongNhan'] = parsed;
                                        },
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                // Ghi chú input field
                                TextField(
                                  controller: item['ghiChuController'],
                                  decoration: const InputDecoration(
                                    labelText: 'Ghi chú (nếu nhận thiếu)',
                                    border: OutlineInputBorder(),
                                    isDense: true,
                                    contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }),
                    ],
                  ),
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('HỦY BỎ', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
                ),
                ElevatedButton.icon(
                  onPressed: () async {
                    Navigator.pop(context);
                    setState(() => _isLoadingOutbounds = true);
                    try {
                      int userId = 1;
                      final userStr = SharedPreferencesService.getUser();
                      if (userStr != null && userStr.isNotEmpty) {
                        final userObj = jsonDecode(userStr);
                        userId = userObj['id'] ?? userObj['Id'] ?? 1;
                      }

                      final payload = {
                        'ManagerId': userId,
                        'Items': itemsPayload.map((item) => {
                          'MaSanPham': item['maSanPham'],
                          'SoLuongNhan': item['soLuongNhan'],
                          'GhiChu': item['ghiChuController'].text.trim(),
                        }).toList(),
                      };

                      final response = await _apiService.confirmReceipt(maPhieuXK, payload);
                      if (!mounted) return;
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(response.data['message'] ?? 'Xác nhận nhận hàng thành công!'), backgroundColor: Colors.green),
                      );
                      _loadOutbounds();
                    } catch (e) {
                      if (!mounted) return;
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Lỗi xác nhận: $e'), backgroundColor: Colors.red),
                      );
                    } finally {
                      if (mounted) {
                        setState(() => _isLoadingOutbounds = false);
                      }
                    }
                  },
                  icon: const Icon(Icons.local_shipping),
                  label: const Text('XÁC NHẬN NHẬN HÀNG & ĐI GIAO'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue.shade700,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Widget _buildInfoColumn(String label, String value, Color valueColor) {
    return Column(
      children: [
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: valueColor,
          ),
        ),
      ],
    );
  }
}
