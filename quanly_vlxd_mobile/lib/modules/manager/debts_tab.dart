import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import 'package:intl/intl.dart';

class DebtsTab extends StatefulWidget {
  const DebtsTab({super.key});

  @override
  State<DebtsTab> createState() => _DebtsTabState();
}

class _DebtsTabState extends State<DebtsTab> {
  final ApiService _apiService = ApiService();
  List<dynamic> _debts = [];
  bool _isLoading = true;
  final NumberFormat _currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');

  @override
  void initState() {
    super.initState();
    _fetchDebts();
  }

  Future<void> _fetchDebts() async {
    try {
      final response = await _apiService.getDebts();
      if (mounted) {
        setState(() {
          _debts = response.data is List ? response.data : [];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    if (_debts.isEmpty) return const Center(child: Text('Không có dữ liệu công nợ'));

    return ListView.builder(
      padding: const EdgeInsets.all(8),
      itemCount: _debts.length,
      itemBuilder: (context, index) {
        final d = _debts[index];
        return Card(
          child: ListTile(
            leading: const CircleAvatar(backgroundColor: Colors.redAccent, child: Icon(Icons.account_balance_wallet, color: Colors.white)),
            title: Text('${d['maCN']} - ${d['tenDoiTac'] ?? d['khachHang']?['tenKH'] ?? ''}', style: const TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Text('Loại: ${d['loaiCongNo']} | Hạn: ${d['hanThanhToan'] != null ? DateFormat('dd/MM/yyyy').format(DateTime.parse(d['hanThanhToan'])) : ''}'),
            trailing: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(_currencyFormat.format(d['soTienConLai'] ?? 0), style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
                Text(d['trangThai'] ?? '', style: const TextStyle(fontSize: 10, color: Colors.grey)),
              ],
            ),
          ),
        );
      },
    );
  }
}
