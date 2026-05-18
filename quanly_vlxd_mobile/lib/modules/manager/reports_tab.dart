import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import 'package:intl/intl.dart';

class ReportsTab extends StatefulWidget {
  const ReportsTab({super.key});

  @override
  State<ReportsTab> createState() => _ReportsTabState();
}

class _ReportsTabState extends State<ReportsTab> {
  final ApiService _apiService = ApiService();
  Map<String, dynamic>? _summary;
  List<dynamic> _revenueProfit = [];
  List<dynamic> _customerRanking = [];
  List<dynamic> _inventoryAging = [];
  Map<String, dynamic>? _debtAging;
  
  bool _isLoading = true;
  final NumberFormat _currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');

  @override
  void initState() {
    super.initState();
    _fetchReportsData();
  }

  Future<void> _fetchReportsData() async {
    try {
      final results = await Future.wait([
        _apiService.getReportSummary(),
        _apiService.getRevenueProfit(),
        _apiService.getCustomerRanking(),
        _apiService.getInventoryAging(),
        _apiService.getDebtAging(),
      ]);

      if (mounted) {
        setState(() {
          _summary = results[0].data;
          _revenueProfit = results[1].data is List ? results[1].data : [];
          _customerRanking = results[2].data is List ? results[2].data : [];
          _inventoryAging = results[3].data is List ? results[3].data : [];
          _debtAging = results[4].data;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Center(child: CircularProgressIndicator());

    return DefaultTabController(
      length: 4,
      child: Column(
        children: [
          Container(
            color: Colors.purple.shade800,
            child: const TabBar(
              isScrollable: true,
              indicatorColor: Colors.white,
              labelColor: Colors.white,
              unselectedLabelColor: Colors.white70,
              labelStyle: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              tabs: [
                Tab(text: 'TỔNG QUAN BÁO CÁO'),
                Tab(text: 'DOANH THU & LỢI NHUẬN'),
                Tab(text: 'XẾP HẠNG KHÁCH HÀNG'),
                Tab(text: 'HÀNG TỒN ĐỌNG'),
              ],
            ),
          ),
          Expanded(
            child: TabBarView(
              children: [
                _buildSummaryTab(),
                _buildRevenueProfitTab(),
                _buildCustomerRankingTab(),
                _buildInventoryAgingTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryTab() {
    final s = _summary ?? {};
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSummaryCard('Tổng Doanh Thu', _currencyFormat.format(s['totalRevenue'] ?? 0), Icons.monetization_on, Colors.green),
          _buildSummaryCard('Tổng Công Nợ', _currencyFormat.format(s['totalDebt'] ?? 0), Icons.money_off, Colors.red),
          _buildSummaryCard('Giá Trị Kho Hàng', _currencyFormat.format(s['inventoryValue'] ?? 0), Icons.warehouse, Colors.blue),
          _buildSummaryCard('Tổng Sản Phẩm', '${s['totalProducts'] ?? 0}', Icons.inventory_2, Colors.orange),
          _buildSummaryCard('Tổng Đơn Hàng', '${s['totalOrders'] ?? 0}', Icons.shopping_cart, Colors.purple),
          
          const SizedBox(height: 24),
          const Text('Phân tích Công nợ theo hạn', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 12),
          if (_debtAging != null) ...[
            _buildDebtAgingRow('Trong hạn', _debtAging!['inTerm'], Colors.green),
            _buildDebtAgingRow('Quá hạn < 30 ngày', _debtAging!['overdue30'], Colors.orange),
            _buildDebtAgingRow('Quá hạn 30 - 60 ngày', _debtAging!['overdue60'], Colors.deepOrange),
            _buildDebtAgingRow('Quá hạn > 60 ngày (Khó đòi)', _debtAging!['overdueLong'], Colors.red),
          ]
        ],
      ),
    );
  }

  Widget _buildSummaryCard(String title, String val, IconData icon, Color color) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        leading: CircleAvatar(backgroundColor: color.withOpacity(0.2), child: Icon(icon, color: color)),
        title: Text(title, style: const TextStyle(color: Colors.grey, fontSize: 12, fontWeight: FontWeight.bold)),
        subtitle: Text(val, style: TextStyle(color: color, fontSize: 18, fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _buildDebtAgingRow(String label, dynamic val, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8), border: Border(left: BorderSide(color: color, width: 4))),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontWeight: FontWeight.bold)),
          Text(_currencyFormat.format(val ?? 0), style: TextStyle(fontWeight: FontWeight.bold, color: color)),
        ],
      ),
    );
  }

  Widget _buildRevenueProfitTab() {
    if (_revenueProfit.isEmpty) return const Center(child: Text('Không có dữ liệu doanh thu & lợi nhuận'));
    return ListView.builder(
      padding: const EdgeInsets.all(8),
      itemCount: _revenueProfit.length,
      itemBuilder: (context, index) {
        final r = _revenueProfit[index];
        return Card(
          child: ListTile(
            title: Text('Ngày: ${r['date']}', style: const TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Doanh thu: ${_currencyFormat.format(r['revenue'] ?? 0)}', style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
                Text('Đã thu: ${_currencyFormat.format(r['collected'] ?? 0)} | Số đơn: ${r['orderCount']}', style: const TextStyle(color: Colors.black87)),
              ],
            ),
            trailing: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                const Text('Lợi nhuận', style: TextStyle(fontSize: 10, color: Colors.grey)),
                Text(_currencyFormat.format(r['profit'] ?? 0), style: const TextStyle(color: Colors.blue, fontWeight: FontWeight.bold, fontSize: 14)),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildCustomerRankingTab() {
    if (_customerRanking.isEmpty) return const Center(child: Text('Không có dữ liệu xếp hạng'));
    return ListView.builder(
      padding: const EdgeInsets.all(8),
      itemCount: _customerRanking.length,
      itemBuilder: (context, index) {
        final c = _customerRanking[index];
        return Card(
          child: ListTile(
            leading: CircleAvatar(backgroundColor: Colors.amber, child: Text('#${index + 1}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
            title: Text(c['tenKH'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Text('Số đơn: ${c['orderCount']}'),
            trailing: Text(_currencyFormat.format(c['totalSpend'] ?? 0), style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 15)),
          ),
        );
      },
    );
  }

  Widget _buildInventoryAgingTab() {
    if (_inventoryAging.isEmpty) return const Center(child: Text('Không có hàng tồn đọng quá 60 ngày'));
    return ListView.builder(
      padding: const EdgeInsets.all(8),
      itemCount: _inventoryAging.length,
      itemBuilder: (context, index) {
        final i = _inventoryAging[index];
        return Card(
          child: ListTile(
            leading: const CircleAvatar(backgroundColor: Colors.deepOrange, child: Icon(Icons.warning, color: Colors.white)),
            title: Text(i['tenSP'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Text('Kho: ${i['tenKho']} | Tồn: ${i['soLuongTon']}'),
            trailing: Text('Tồn đọng\n${i['daysOld']} ngày', textAlign: TextAlign.center, style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 12)),
          ),
        );
      },
    );
  }
}
