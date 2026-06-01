import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import '../../core/app_theme.dart';
import '../../services/api_service.dart';

class DashboardTab extends StatefulWidget {
  const DashboardTab({super.key});

  @override
  State<DashboardTab> createState() => _DashboardTabState();
}

class _DashboardTabState extends State<DashboardTab> {
  final ApiService _apiService = ApiService();

  Map<String, dynamic>? _stats;
  List<dynamic> _recentOrders = [];
  List<dynamic> _topProducts = [];
  List<dynamic> _inventoryAlerts = [];
  List<dynamic> _debts = [];
  List<dynamic> _lateOrders = [];

  bool _isLoading = true;
  String? _error;
  final NumberFormat _currencyFormat = NumberFormat.currency(
    locale: 'vi_VN',
    symbol: 'đ',
  );

  @override
  void initState() {
    super.initState();
    _fetchAllDashboardData();
  }

  Future<void> _fetchAllDashboardData() async {
    try {
      final results = await Future.wait([
        _apiService.getDashboardStats(),
        _apiService.getRecentOrders(),
        _apiService.getTopProducts(),
        _apiService.getInventoryAlerts(),
        _apiService.getDebtSummary(),
        _apiService.getLateOrders(),
      ]);

      if (mounted) {
        setState(() {
          _stats = results[0].data;
          _recentOrders = results[1].data is List ? results[1].data : [];
          _topProducts = results[2].data is List ? results[2].data : [];
          _inventoryAlerts = results[3].data is List ? results[3].data : [];
          _debts = results[4].data is List ? results[4].data : [];
          _lateOrders = results[5].data is List ? results[5].data : [];

          _isLoading = false;
          _error = null;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Không thể kết nối Backend.\nĐang hiển thị dữ liệu mẫu.';
          // Fallback MOCK data so the UI doesn't look empty when backend is down
          _stats = {
            "tongSanPham": 150,
            "tongDonHang": 45,
            "tongKhachHang": 120,
            "doanhThu": 155000000,
            "tongNhaCungCap": 12,
            "tongNhanVien": 8,
            "tongPhieuNhap": 20,
            "tongCongNo": 35000000,
            "tongTinNhan": 50,
            "tongTinNhanChuaDoc": 3,
          };
          _topProducts = [
            {
              "tenSP": "Xi măng Hà Tiên",
              "soLuongBan": 500,
              "doanhThu": 45000000,
            },
            {
              "tenSP": "Thép cuộn Pomina",
              "soLuongBan": 200,
              "doanhThu": 30000000,
            },
            {
              "tenSP": "Gạch Ống Đồng Tâm",
              "soLuongBan": 1000,
              "doanhThu": 12000000,
            },
            {"tenSP": "Cát Xây Dựng", "soLuongBan": 80, "doanhThu": 8000000},
          ];
          _recentOrders = [
            {
              "maHD": "HD001",
              "tenKhachHang": "Nguyễn Văn A",
              "tongTien": 5000000,
              "pttt": "Tiền mặt",
              "trangThai": "Hoàn thành",
            },
            {
              "maHD": "HD002",
              "tenKhachHang": "Công ty XD Hưng Thịnh",
              "tongTien": 12000000,
              "pttt": "Chuyển khoản",
              "trangThai": "Đang giao",
            },
          ];
          _inventoryAlerts = [
            {
              "tenSP": "Xi măng Insee",
              "maSP": "XM002",
              "tenKho": "Kho Quận 9",
              "soLuongTon": 5,
              "mucToiThieu": 50,
            },
          ];
          _debts = [
            {
              "maCN": "CN01",
              "tenDoiTac": "Nguyễn Văn A",
              "soTienConLai": 5000000,
              "hanThanhToan": "2026-06-01",
            },
          ];
          _lateOrders = [
            {
              "maHD": "HD000",
              "tenKhachHang": "Lê Văn C",
              "ngayLap": "2026-05-25T10:00:00",
              "trangThai": "Đang giao",
              "tongTien": 1500000,
            }
          ];
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Tổng quan',
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
              ),
              if (_error != null)
                const Icon(Icons.cloud_off, color: Colors.orange, size: 24),
            ],
          ),
          const SizedBox(height: 16),

          if (_error != null)
            Container(
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.only(bottom: 16),
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

          _buildStatCards(),
          const SizedBox(height: 24),

          _buildTopProductsCharts(),
          const SizedBox(height: 24),

          _buildRecentOrders(),
          const SizedBox(height: 24),

          _buildLateOrders(),
          const SizedBox(height: 24),

          _buildInventoryAlerts(),
          const SizedBox(height: 24),

          _buildDebtSummary(),
        ],
      ),
    );
  }

  Widget _buildStatCards() {
    final s = _stats ?? {};
    final cards = [
      {
        'title': 'SẢN PHẨM',
        'val': s['tongSanPham'] ?? 0,
        'icon': Icons.inventory_2,
        'col': AppColors.primaryStart,
      },
      {
        'title': 'ĐƠN HÀNG',
        'val': s['tongDonHang'] ?? 0,
        'icon': Icons.shopping_cart,
        'col': AppColors.accent,
      },
      {
        'title': 'KHÁCH HÀNG',
        'val': s['tongKhachHang'] ?? 0,
        'icon': Icons.people,
        'col': AppColors.info,
      },
      {
        'title': 'DOANH THU',
        'val': _currencyFormat.format(s['doanhThu'] ?? 0),
        'icon': Icons.payments,
        'col': AppColors.success,
      },
      {
        'title': 'NHÀ CUNG CẤP',
        'val': s['tongNhaCungCap'] ?? 0,
        'icon': Icons.business,
        'col': AppColors.warning,
      },
      {
        'title': 'NHÂN VIÊN',
        'val': s['tongNhanVien'] ?? 0,
        'icon': Icons.badge,
        'col': AppColors.primaryEnd,
      },
      {
        'title': 'PHIẾU NHẬP',
        'val': s['tongPhieuNhap'] ?? 0,
        'icon': Icons.receipt_long,
        'col': const Color(0xFFFF6B6B),
      },
      {
        'title': 'CÔNG NỢ',
        'val': _currencyFormat.format(s['tongCongNo'] ?? 0),
        'icon': Icons.account_balance_wallet,
        'col': AppColors.error,
      },
      {
        'title': 'TIN NHẮN',
        'val': '${s['tongTinNhan'] ?? 0} (${s['tongTinNhanChuaDoc'] ?? 0} mới)',
        'icon': Icons.mail,
        'col': const Color(0xFF00BFA5),
      },
    ];

    return GridView.builder(
      physics: const NeverScrollableScrollPhysics(),
      shrinkWrap: true,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 1.5,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: cards.length,
      itemBuilder: (context, index) {
        final c = cards[index];
        return Card(
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          child: Padding(
            padding: const EdgeInsets.all(12.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        c['title'] as String,
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          color: Colors.grey,
                        ),
                      ),
                    ),
                    Icon(
                      c['icon'] as IconData,
                      color: c['col'] as Color,
                      size: 20,
                    ),
                  ],
                ),
                const Spacer(),
                Text(
                  c['val'].toString(),
                  style: TextStyle(
                    fontSize: c['val'].toString().length > 10 ? 14 : 18,
                    fontWeight: FontWeight.bold,
                    color: c['col'] as Color,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildTopProductsCharts() {
    if (_topProducts.isEmpty) return const SizedBox();

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Sản phẩm bán chạy nhất',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 200,
              child: BarChart(
                BarChartData(
                  alignment: BarChartAlignment.spaceAround,
                  maxY:
                      (_topProducts
                                  .map((e) => (e['soLuongBan'] ?? 0) as num)
                                  .reduce((a, b) => a > b ? a : b)
                              as num)
                          .toDouble() *
                      1.2,
                  barTouchData: BarTouchData(enabled: false),
                  titlesData: FlTitlesData(
                    show: true,
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 40,
                        getTitlesWidget: (value, meta) {
                          if (value.toInt() >= 0 &&
                              value.toInt() < _topProducts.length) {
                            String name =
                                _topProducts[value.toInt()]['tenSP']
                                    ?.toString() ??
                                '';
                            if (name.length > 8)
                              name = name.substring(0, 8) + '...';
                            return SideTitleWidget(
                              meta: meta,
                              child: Text(
                                name,
                                style: const TextStyle(fontSize: 9),
                                textAlign: TextAlign.center,
                              ),
                            );
                          }
                          return const SizedBox();
                        },
                      ),
                    ),
                    leftTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    topTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    rightTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                  ),
                  gridData: FlGridData(show: false),
                  borderData: FlBorderData(show: false),
                  barGroups: List.generate(_topProducts.length, (index) {
                    final p = _topProducts[index];
                    final soLuong = (p['soLuongBan'] ?? 0) as num;
                    return BarChartGroupData(
                      x: index,
                      barRods: [
                        BarChartRodData(
                          toY: soLuong.toDouble(),
                          color: Theme.of(context).colorScheme.primary,
                          width: 16,
                          borderRadius: const BorderRadius.only(
                            topLeft: Radius.circular(4),
                            topRight: Radius.circular(4),
                          ),
                        ),
                      ],
                    );
                  }),
                ),
              ),
            ),
            const Divider(height: 32),
            ..._topProducts
                .map(
                  (p) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: CircleAvatar(
                      backgroundColor: AppColors.primaryStart,
                      child: const Icon(
                        Icons.star,
                        color: Colors.white,
                        size: 16,
                      ),
                    ),
                    title: Text(p['tenSP']?.toString() ?? ''),
                    subtitle: Text(
                      'Bán: ${p['soLuongBan']} | Doanh thu: ${_currencyFormat.format(p['doanhThu'] ?? 0)}',
                    ),
                  ),
                )
                .toList(),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentOrders() {
    return _buildListCard(
      title: 'Đơn Hàng Gần Đây',
      icon: Icons.list_alt,
      iconColor: AppColors.primaryStart,
      isEmpty: _recentOrders.isEmpty,
      itemCount: _recentOrders.length,
      itemBuilder: (context, index) {
        final order = _recentOrders[index];
        return ListTile(
          contentPadding: EdgeInsets.zero,
          title: Text(
            '${order['maHD']} - ${order['tenKhachHang']}',
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          subtitle: Text(
            '${_currencyFormat.format(order['tongTien'] ?? 0)} | PTTT: ${order['pttt']}',
          ),
          trailing: Chip(
            label: Text(
              order['trangThai']?.toString() ?? '',
              style: const TextStyle(fontSize: 10),
            ),
            backgroundColor: order['trangThai'] == 'Hoàn thành'
                ? Colors.green.shade100
                : Colors.orange.shade100,
          ),
        );
      },
    );
  }

  Widget _buildLateOrders() {
    return _buildListCard(
      title: 'Đơn Hàng Trễ',
      icon: Icons.timer_off_outlined,
      iconColor: AppColors.error,
      isEmpty: _lateOrders.isEmpty,
      emptyText: 'Không có đơn hàng trễ',
      itemCount: _lateOrders.length,
      itemBuilder: (context, index) {
        final order = _lateOrders[index];
        final date = order['ngayLap'] != null 
            ? DateFormat('dd/MM/yyyy HH:mm').format(DateTime.parse(order['ngayLap'])) 
            : '-';
        return ListTile(
          contentPadding: EdgeInsets.zero,
          title: Text(
            '${order['maHD']} - ${order['tenKhachHang']}',
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          subtitle: Text(
            'Ngày lập: $date',
            style: const TextStyle(color: Colors.grey),
          ),
          trailing: Chip(
            label: Text(
              order['trangThai']?.toString() ?? '',
              style: const TextStyle(fontSize: 10, color: Colors.white),
            ),
            backgroundColor: AppColors.error,
          ),
        );
      },
    );
  }

  Widget _buildInventoryAlerts() {
    return _buildListCard(
      title: 'Cảnh Báo Tồn Kho',
      icon: Icons.warning_amber_rounded,
      iconColor: AppColors.warning,
      isEmpty: _inventoryAlerts.isEmpty,
      emptyText: 'Tất cả sản phẩm đủ tồn kho',
      itemCount: _inventoryAlerts.length,
      itemBuilder: (context, index) {
        final alert = _inventoryAlerts[index];
        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.orange.shade50,
            borderRadius: BorderRadius.circular(8),
            border: Border(
              left: BorderSide(color: Colors.orange.shade700, width: 4),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      alert['tenSP']?.toString() ?? '',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    Text(
                      'Mã: ${alert['maSP']} | Kho: ${alert['tenKho']}',
                      style: const TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                  ],
                ),
              ),
              Text(
                'Tồn: ${alert['soLuongTon']} / ${alert['mucToiThieu']}',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.orange.shade900,
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDebtSummary() {
    return _buildListCard(
      title: 'Công Nợ Hiện Tại',
      icon: Icons.account_balance_wallet,
      iconColor: Colors.redAccent,
      isEmpty: _debts.isEmpty,
      emptyText: 'Không có công nợ',
      itemCount: _debts.length,
      itemBuilder: (context, index) {
        final d = _debts[index];
        final date = d['hanThanhToan'] != null
            ? DateFormat('dd/MM/yyyy').format(DateTime.parse(d['hanThanhToan']))
            : '-';
        return ListTile(
          contentPadding: EdgeInsets.zero,
          title: Text(
            '${d['maCN']} - ${d['tenDoiTac']}',
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          subtitle: Text(
            'Hạn TT: $date',
            style: const TextStyle(color: Colors.grey),
          ),
          trailing: Text(
            _currencyFormat.format(d['soTienConLai'] ?? 0),
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              color: Colors.redAccent,
            ),
          ),
        );
      },
    );
  }

  Widget _buildListCard({
    required String title,
    required IconData icon,
    required Color iconColor,
    required bool isEmpty,
    String emptyText = 'Không có dữ liệu',
    required int itemCount,
    required Widget Function(BuildContext, int) itemBuilder,
  }) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: iconColor),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 16),
                child: Center(
                  child: Text(
                    emptyText,
                    style: const TextStyle(
                      color: Colors.green,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              )
            else
              ListView.separated(
                physics: const NeverScrollableScrollPhysics(),
                shrinkWrap: true,
                itemCount: itemCount > 5
                    ? 5
                    : itemCount, // Show max 5 items in dashboard
                separatorBuilder: (context, index) => const Divider(height: 1),
                itemBuilder: itemBuilder,
              ),
          ],
        ),
      ),
    );
  }
}
