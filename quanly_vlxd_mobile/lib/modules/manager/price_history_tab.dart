import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';

class PriceHistoryTab extends StatefulWidget {
  const PriceHistoryTab({super.key});

  @override
  State<PriceHistoryTab> createState() => _PriceHistoryTabState();
}

class _PriceHistoryTabState extends State<PriceHistoryTab> with SingleTickerProviderStateMixin {
  final ApiService _apiService = ApiService();
  late TabController _tabController;

  // Dữ liệu 3 tab
  List<dynamic> _overviewList = [];
  List<dynamic> _historyList = [];
  Map<String, dynamic> _summaryData = {};
  bool _isLoading = false;

  // Bộ lọc
  String _searchQuery = '';
  int _selectedDays = 180;
  bool _isTableView = true;

  final List<int> _daysOptions = [30, 90, 180, 365];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        setState(() {});
      }
    });
    _fetchPriceHistoryData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchPriceHistoryData() async {
    setState(() => _isLoading = true);
    try {
      final resOver = await _apiService.getPriceHistoryOverview();
      final resHist = await _apiService.getPriceHistoryFiltered(days: _selectedDays);
      final resSumm = await _apiService.getPriceHistorySummary(days: _selectedDays);

      if (!mounted) return;
      setState(() {
        if (resOver.statusCode == 200 && resOver.data != null) _overviewList = resOver.data is List ? resOver.data : [];
        if (resHist.statusCode == 200 && resHist.data != null) _historyList = resHist.data is List ? resHist.data : [];
        if (resSumm.statusCode == 200 && resSumm.data != null) _summaryData = resSumm.data;
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi tải dữ liệu Lịch sử giá: $e'), backgroundColor: Colors.red));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  List<dynamic> _getFilteredList(List<dynamic> source) {
    return source.where((item) {
      final ma = (item['maSP'] ?? item['maSanPham'] ?? '').toString().toLowerCase();
      final ten = (item['tenSP'] ?? item['tenSanPham'] ?? '').toString().toLowerCase();
      return ma.contains(_searchQuery.toLowerCase()) || ten.contains(_searchQuery.toLowerCase());
    }).toList();
  }

  void _showChartDialog(int productId, String productName) async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    try {
      final resChart = await _apiService.getPriceHistoryChart(productId, days: _selectedDays);
      if (!mounted) return;
      Navigator.pop(context); // Đóng loading

      List<dynamic> chartData = [];
      if (resChart.statusCode == 200 && resChart.data != null) {
        chartData = resChart.data['chartData'] ?? [];
      }

      _showChartPopup(productName, chartData);
    } catch (e) {
      if (!mounted) return;
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi tải biểu đồ: $e'), backgroundColor: Colors.red));
    }
  }

  void _showChartPopup(String productName, List<dynamic> chartData) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Text('Biểu Đồ Giá: $productName', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          content: SizedBox(
            width: double.maxFinite,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (chartData.isEmpty)
                    const Text('Chưa có đủ dữ liệu để vẽ biểu đồ', style: TextStyle(color: Colors.grey, fontStyle: FontStyle.italic))
                  else
                    Column(
                      children: chartData.map((point) {
                        final isHienTai = point['nguonThayDoi'] == 'Hiện tại';
                        return Card(
                          color: isHienTai ? Colors.blue.shade50 : Colors.white,
                          margin: const EdgeInsets.only(bottom: 8),
                          child: ListTile(
                            dense: true,
                            leading: Icon(Icons.timeline, color: isHienTai ? Colors.blue : Colors.green),
                            title: Text('Giá bán: ${NumberFormat.currency(locale: 'vi_VN', symbol: 'đ').format(point['giaBan'] ?? 0)}', style: TextStyle(fontWeight: FontWeight.bold, color: isHienTai ? Colors.blue : Colors.black87)),
                            subtitle: Text('Ngày: ${point['ngay'] != null ? DateFormat('dd/MM/yyyy HH:mm').format(DateTime.parse(point['ngay'])) : "N/A"} | Nguồn: ${point['nguonThayDoi'] ?? "N/A"}'),
                            trailing: Text('Giá nhập: ${NumberFormat.currency(locale: 'vi_VN', symbol: 'đ').format(point['giaNhap'] ?? 0)}', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                          ),
                        );
                      }).toList(),
                    ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('ĐÓNG', style: TextStyle(color: Colors.grey))),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final activeIndex = _tabController.index;
    List<dynamic> currentSource;
    if (activeIndex == 0) currentSource = _overviewList;
    else if (activeIndex == 1) currentSource = _historyList;
    else currentSource = (_summaryData['chiTiet'] as List<dynamic>?) ?? [];

    final currentList = _getFilteredList(currentSource);

    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(56),
        child: AppBar(
          backgroundColor: Colors.teal.shade800,
          elevation: 0,
          bottom: TabBar(
            controller: _tabController,
            indicatorColor: Colors.white,
            indicatorWeight: 3,
            labelColor: Colors.white,
            unselectedLabelColor: Colors.white70,
            labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            tabs: const [
              Tab(icon: Icon(Icons.inventory_2), text: 'TỔNG QUAN SP'),
              Tab(icon: Icon(Icons.history), text: 'LỊCH SỬ BIẾN ĐỘNG'),
              Tab(icon: Icon(Icons.bar_chart), text: 'THỐNG KÊ GIÁ'),
            ],
          ),
        ),
      ),
      body: Column(
        children: [
          if (activeIndex == 2 && _summaryData.isNotEmpty) ...[
            Container(
              padding: const EdgeInsets.all(16),
              color: Colors.teal.shade800,
              child: Row(
                children: [
                  Expanded(child: _buildStatCard('Tăng Giá', _summaryData['tangGia'] ?? 0, Colors.green)),
                  const SizedBox(width: 8),
                  Expanded(child: _buildStatCard('Giảm Giá', _summaryData['giamGia'] ?? 0, Colors.red)),
                  const SizedBox(width: 8),
                  Expanded(child: _buildStatCard('Không Đổi', _summaryData['khongThayDoi'] ?? 0, Colors.orange)),
                ],
              ),
            ),
          ],
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
                            icon: Icon(_isTableView ? Icons.grid_view : Icons.table_chart, color: Colors.teal.shade800),
                            tooltip: _isTableView ? 'Chuyển sang dạng Thẻ' : 'Chuyển sang dạng Bảng',
                            onPressed: () => setState(() => _isTableView = !_isTableView),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            decoration: BoxDecoration(border: Border.all(color: Colors.grey.shade300), borderRadius: BorderRadius.circular(8)),
                            child: DropdownButton<int>(
                              value: _selectedDays,
                              underline: const SizedBox(),
                              icon: const Icon(Icons.filter_list, size: 18),
                              items: _daysOptions.map((d) => DropdownMenuItem(value: d, child: Text('$d ngày gần đây', style: const TextStyle(fontSize: 14)))).toList(),
                              onChanged: (val) {
                                if (val != null) {
                                  setState(() {
                                    _selectedDays = val;
                                    _fetchPriceHistoryData();
                                  });
                                }
                              },
                            ),
                          ),
                        ],
                      ),
                      ElevatedButton.icon(
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Đang xuất báo cáo Lịch Sử Giá...'), backgroundColor: Colors.green));
                        },
                        icon: const Icon(Icons.download, size: 18),
                        label: const Text('Xuất'),
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.green.shade700, foregroundColor: Colors.white),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    decoration: InputDecoration(
                      hintText: 'Tìm kiếm nhanh mã SP, tên sản phẩm...',
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
                    ? const Center(child: Text('Không tìm thấy dữ liệu giá nào phù hợp', style: TextStyle(color: Colors.grey, fontSize: 16)))
                    : _isTableView
                        ? _buildTableView(currentList, activeIndex)
                        : _buildCardView(currentList, activeIndex),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, num val, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 4)]),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: TextStyle(color: Colors.grey.shade700, fontSize: 12, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text('$val SP', style: TextStyle(color: color, fontSize: 16, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildTableView(List<dynamic> list, int tabIndex) {
    if (tabIndex == 0) {
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
                DataColumn(label: Text('Mã SP', style: TextStyle(fontWeight: FontWeight.bold))),
                DataColumn(label: Text('Tên Sản Phẩm', style: TextStyle(fontWeight: FontWeight.bold))),
                DataColumn(label: Text('Giá Bán Hiện Tại', style: TextStyle(fontWeight: FontWeight.bold))),
                DataColumn(label: Text('Giá Bán Trước', style: TextStyle(fontWeight: FontWeight.bold))),
                DataColumn(label: Text('Biến Động', style: TextStyle(fontWeight: FontWeight.bold))),
                DataColumn(label: Text('Tồn Kho', style: TextStyle(fontWeight: FontWeight.bold))),
                DataColumn(label: Text('Biểu Đồ', style: TextStyle(fontWeight: FontWeight.bold))),
              ],
              rows: list.map((item) {
                final pct = item['phanTramGiaBan'];
                final isTang = pct != null && pct > 0;
                final isGiam = pct != null && pct < 0;

                return DataRow(
                  cells: [
                    DataCell(Text(item['maSP'] ?? item['maSanPham'].toString(), style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blue))),
                    DataCell(Text(item['tenSP'] ?? 'N/A')),
                    DataCell(Text(NumberFormat.currency(locale: 'vi_VN', symbol: 'đ').format(item['giaBanHienTai'] ?? 0), style: const TextStyle(fontWeight: FontWeight.bold))),
                    DataCell(Text(item['giaBanTruoc'] != null ? NumberFormat.currency(locale: 'vi_VN', symbol: 'đ').format(item['giaBanTruoc']) : 'N/A')),
                    DataCell(
                      pct == null ? const Text('0%') : Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(color: isTang ? Colors.green : (isGiam ? Colors.red : Colors.orange), borderRadius: BorderRadius.circular(12)),
                        child: Text('${pct > 0 ? "+" : ""}$pct%', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                      ),
                    ),
                    DataCell(Text('${item['soLuongTon'] ?? 0}')),
                    DataCell(
                      IconButton(
                        icon: const Icon(Icons.show_chart, color: Colors.teal),
                        tooltip: 'Xem biểu đồ',
                        onPressed: () => _showChartDialog(item['maSanPham'], item['tenSP'] ?? ''),
                      ),
                    ),
                  ],
                );
              }).toList(),
            ),
          ),
        ),
      );
    } else if (tabIndex == 1) {
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
                DataColumn(label: Text('Mã SP', style: TextStyle(fontWeight: FontWeight.bold))),
                DataColumn(label: Text('Tên Sản Phẩm', style: TextStyle(fontWeight: FontWeight.bold))),
                DataColumn(label: Text('Ngày Thay Đổi', style: TextStyle(fontWeight: FontWeight.bold))),
                DataColumn(label: Text('Giá Cũ -> Giá Mới', style: TextStyle(fontWeight: FontWeight.bold))),
                DataColumn(label: Text('Biến Động', style: TextStyle(fontWeight: FontWeight.bold))),
                DataColumn(label: Text('Người Thực Hiện', style: TextStyle(fontWeight: FontWeight.bold))),
              ],
              rows: list.map((item) {
                final pct = item['phanTramThayDoi'];
                final isTang = pct != null && pct > 0;
                final isGiam = pct != null && pct < 0;
                final ngay = item['ngayThayDoi'];

                return DataRow(
                  cells: [
                    DataCell(Text(item['maSP'] ?? item['maSanPham'].toString(), style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blue))),
                    DataCell(Text(item['tenSP'] ?? 'N/A')),
                    DataCell(Text(ngay != null ? DateFormat('dd/MM/yyyy HH:mm').format(DateTime.parse(ngay)) : 'N/A')),
                    DataCell(Text('${item['giaBanCu'] != null ? NumberFormat.currency(locale: 'vi_VN', symbol: 'đ').format(item['giaBanCu']) : "N/A"} -> ${NumberFormat.currency(locale: 'vi_VN', symbol: 'đ').format(item['giaBanMoi'] ?? 0)}')),
                    DataCell(
                      pct == null ? const Text('0%') : Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(color: isTang ? Colors.green : (isGiam ? Colors.red : Colors.orange), borderRadius: BorderRadius.circular(12)),
                        child: Text('${pct > 0 ? "+" : ""}$pct%', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                      ),
                    ),
                    DataCell(Text(item['tenNhanVien'] ?? 'Hệ thống')),
                  ],
                );
              }).toList(),
            ),
          ),
        ),
      );
    } else {
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
                DataColumn(label: Text('Mã SP', style: TextStyle(fontWeight: FontWeight.bold))),
                DataColumn(label: Text('Tên Sản Phẩm', style: TextStyle(fontWeight: FontWeight.bold))),
                DataColumn(label: Text('Số Lần Thay Đổi', style: TextStyle(fontWeight: FontWeight.bold))),
                DataColumn(label: Text('Giá Đầu Kỳ', style: TextStyle(fontWeight: FontWeight.bold))),
                DataColumn(label: Text('Giá Cuối Kỳ', style: TextStyle(fontWeight: FontWeight.bold))),
                DataColumn(label: Text('Tổng Biến Động', style: TextStyle(fontWeight: FontWeight.bold))),
              ],
              rows: list.map((item) {
                final pct = item['phanTramThayDoi'];
                final isTang = pct != null && pct > 0;
                final isGiam = pct != null && pct < 0;

                return DataRow(
                  cells: [
                    DataCell(Text(item['maSP'] ?? item['maSanPham'].toString(), style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blue))),
                    DataCell(Text(item['tenSP'] ?? 'N/A')),
                    DataCell(Text('${item['soLanThayDoi'] ?? 0}')),
                    DataCell(Text(NumberFormat.currency(locale: 'vi_VN', symbol: 'đ').format(item['giaDauKy'] ?? 0))),
                    DataCell(Text(NumberFormat.currency(locale: 'vi_VN', symbol: 'đ').format(item['giaCuoiKy'] ?? 0), style: const TextStyle(fontWeight: FontWeight.bold))),
                    DataCell(
                      pct == null ? const Text('0%') : Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(color: isTang ? Colors.green : (isGiam ? Colors.red : Colors.orange), borderRadius: BorderRadius.circular(12)),
                        child: Text('${pct > 0 ? "+" : ""}$pct%', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
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
  }

  Widget _buildCardView(List<dynamic> list, int tabIndex) {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: list.length,
      itemBuilder: (context, index) {
        final item = list[index];
        final pct = tabIndex == 0 ? item['phanTramGiaBan'] : item['phanTramThayDoi'];
        final isTang = pct != null && pct > 0;
        final isGiam = pct != null && pct < 0;
        final ma = item['maSP'] ?? item['maSanPham'];
        final ten = item['tenSP'] ?? item['tenSanPham'] ?? 'N/A';

        return Card(
          elevation: 2,
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: ListTile(
            contentPadding: const EdgeInsets.all(16),
            leading: CircleAvatar(
              backgroundColor: isTang ? Colors.green.shade100 : (isGiam ? Colors.red.shade100 : Colors.orange.shade100),
              child: Icon(isTang ? Icons.trending_up : (isGiam ? Icons.trending_down : Icons.trending_flat), color: isTang ? Colors.green : (isGiam ? Colors.red : Colors.orange)),
            ),
            title: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(ma.toString(), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.blue)),
                if (pct != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(color: isTang ? Colors.green : (isGiam ? Colors.red : Colors.orange), borderRadius: BorderRadius.circular(12)),
                    child: Text('${pct > 0 ? "+" : ""}$pct%', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                  ),
              ],
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 8),
                Text('Sản phẩm: $ten', style: const TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                if (tabIndex == 0) ...[
                  Text('Giá bán: ${item['giaBanTruoc'] != null ? NumberFormat.currency(locale: 'vi_VN', symbol: 'đ').format(item['giaBanTruoc']) : "N/A"} -> ${NumberFormat.currency(locale: 'vi_VN', symbol: 'đ').format(item['giaBanHienTai'] ?? 0)}'),
                  Text('Tồn kho: ${item['soLuongTon'] ?? 0}'),
                ] else if (tabIndex == 1) ...[
                  Text('Giá bán: ${item['giaBanCu'] != null ? NumberFormat.currency(locale: 'vi_VN', symbol: 'đ').format(item['giaBanCu']) : "N/A"} -> ${NumberFormat.currency(locale: 'vi_VN', symbol: 'đ').format(item['giaBanMoi'] ?? 0)}'),
                  Text('Ngày: ${item['ngayThayDoi'] != null ? DateFormat('dd/MM/yyyy HH:mm').format(DateTime.parse(item['ngayThayDoi'])) : "N/A"} | NV: ${item['tenNhanVien'] ?? "Hệ thống"}'),
                ] else ...[
                  Text('Số lần thay đổi: ${item['soLanThayDoi'] ?? 0}'),
                  Text('Giá: ${NumberFormat.currency(locale: 'vi_VN', symbol: 'đ').format(item['giaDauKy'] ?? 0)} -> ${NumberFormat.currency(locale: 'vi_VN', symbol: 'đ').format(item['giaCuoiKy'] ?? 0)}'),
                ]
              ],
            ),
            trailing: tabIndex == 0 ? IconButton(
              icon: const Icon(Icons.show_chart, color: Colors.teal),
              onPressed: () => _showChartDialog(item['maSanPham'], ten),
            ) : const Icon(Icons.arrow_forward_ios, size: 16),
            onTap: tabIndex == 0 ? () => _showChartDialog(item['maSanPham'], ten) : null,
          ),
        );
      },
    );
  }
}
