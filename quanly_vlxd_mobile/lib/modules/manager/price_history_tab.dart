import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import 'package:intl/intl.dart';

class PriceHistoryTab extends StatefulWidget {
  const PriceHistoryTab({super.key});

  @override
  State<PriceHistoryTab> createState() => _PriceHistoryTabState();
}

class _PriceHistoryTabState extends State<PriceHistoryTab> {
  final ApiService _apiService = ApiService();
  List<dynamic> _history = [];
  bool _isLoading = true;
  final NumberFormat _currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');

  @override
  void initState() {
    super.initState();
    _fetchPriceHistory();
  }

  Future<void> _fetchPriceHistory() async {
    try {
      final response = await _apiService.getPriceHistory();
      if (mounted) {
        setState(() {
          _history = response.data is List ? response.data : [];
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
    if (_history.isEmpty) return const Center(child: Text('Không có dữ liệu lịch sử giá'));

    return ListView.builder(
      padding: const EdgeInsets.all(8),
      itemCount: _history.length,
      itemBuilder: (context, index) {
        final h = _history[index];
        final giaCu = h['giaBanCu'] != null ? _currencyFormat.format(h['giaBanCu']) : 'N/A';
        final giaMoi = _currencyFormat.format(h['giaBanMoi'] ?? 0);
        final phanTram = h['phanTramThayDoi'] != null ? '${h['phanTramThayDoi']}%' : '';
        final isTang = (h['phanTramThayDoi'] ?? 0) > 0;

        return Card(
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: isTang ? Colors.green.shade100 : Colors.orange.shade100,
              child: Icon(isTang ? Icons.trending_up : Icons.trending_down, color: isTang ? Colors.green : Colors.orange),
            ),
            title: Text('${h['maSP']} - ${h['tenSP']}', style: const TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 4),
                Text('Giá bán: $giaCu -> $giaMoi', style: const TextStyle(color: Colors.black87)),
                Text('Lý do: ${h['lyDo'] ?? 'Không có'} | NV: ${h['tenNhanVien']}', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                Text('Ngày: ${h['ngayThayDoi'] != null ? DateFormat('dd/MM/yyyy HH:mm').format(DateTime.parse(h['ngayThayDoi'])) : ''}', style: const TextStyle(fontSize: 11, color: Colors.grey)),
              ],
            ),
            trailing: phanTram.isNotEmpty ? Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: isTang ? Colors.green : Colors.orange,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(phanTram, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
            ) : null,
          ),
        );
      },
    );
  }
}
