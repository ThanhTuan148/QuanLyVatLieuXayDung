import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import 'package:intl/intl.dart';

class ReturnsTab extends StatefulWidget {
  const ReturnsTab({super.key});

  @override
  State<ReturnsTab> createState() => _ReturnsTabState();
}

class _ReturnsTabState extends State<ReturnsTab> {
  final ApiService _apiService = ApiService();
  List<dynamic> _returns = [];
  bool _isLoading = true;
  final NumberFormat _currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');

  @override
  void initState() {
    super.initState();
    _fetchReturns();
  }

  Future<void> _fetchReturns() async {
    try {
      final response = await _apiService.getReturns();
      if (mounted) {
        setState(() {
          _returns = response.data is List ? response.data : [];
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
    if (_returns.isEmpty) return const Center(child: Text('Không có dữ liệu đổi trả'));

    return ListView.builder(
      padding: const EdgeInsets.all(8),
      itemCount: _returns.length,
      itemBuilder: (context, index) {
        final r = _returns[index];
        return Card(
          child: ListTile(
            leading: const CircleAvatar(backgroundColor: Colors.blueGrey, child: Icon(Icons.assignment_return, color: Colors.white)),
            title: Text('${r['maPhieu']} - ${r['loaiPhieu']}', style: const TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Text('Ngày: ${r['ngayTao'] != null ? DateFormat('dd/MM/yyyy').format(DateTime.parse(r['ngayTao'])) : ''}'),
            trailing: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(_currencyFormat.format(r['tongTienHoan'] ?? 0), style: const TextStyle(color: Colors.blue, fontWeight: FontWeight.bold)),
                Text(r['trangThai'] ?? '', style: const TextStyle(fontSize: 10, color: Colors.grey)),
              ],
            ),
          ),
        );
      },
    );
  }
}
