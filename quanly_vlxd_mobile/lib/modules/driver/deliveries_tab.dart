import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';
import 'delivery_detail_screen.dart';

class DeliveriesTab extends StatefulWidget {
  const DeliveriesTab({super.key});

  @override
  State<DeliveriesTab> createState() => _DeliveriesTabState();
}

class _DeliveriesTabState extends State<DeliveriesTab> {
  final ApiService _apiService = ApiService();
  List<dynamic> _deliveries = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchDeliveries();
  }

  Future<void> _fetchDeliveries() async {
    try {
      final response = await _apiService.getDeliveries();
      if (response.statusCode == 200 && response.data != null) {
        if (mounted) {
          setState(() {
            _deliveries = response.data is List ? response.data : [response.data];
            _isLoading = false;
            _error = null;
          });
        }
      } else {
        if (mounted) {
          setState(() {
            _error = 'Lỗi tải chuyến đi: ${response.statusCode}';
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Không thể kết nối Backend.\nĐang dùng dữ liệu mẫu.';
          _deliveries = [
            {
              "maGH": 1,
              "maHD": "HD045",
              "diaChiGiaoHang": "123 Lê Lợi, Quận 1, TP.HCM",
              "trangThai": "Đang giao",
              "ngayGiaoDuKien": DateTime.now().toIso8601String(),
              "tenNguoiNhan": "Anh Tuấn",
              "sdtNguoiNhan": "0901234567"
            }
          ];
          _isLoading = false;
        });
      }
    }
  }

  Color _getStatusColor(String? status) {
    if (status == null) return Colors.grey;
    if (status.contains('Chờ')) return Colors.orange;
    if (status.contains('Đang giao')) return Colors.blue;
    if (status.contains('Đã giao') || status.contains('Hoàn thành')) return Colors.green;
    if (status.contains('Hủy')) return Colors.red;
    return Colors.grey;
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: Colors.teal));
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: Text(
            'Chuyến đi hôm nay (${_deliveries.length})',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
          ),
        ),

        if (_error != null)
          Container(
            padding: const EdgeInsets.all(12),
            margin: const EdgeInsets.only(bottom: 8, left: 16, right: 16),
            decoration: BoxDecoration(color: Colors.amber.shade100, borderRadius: BorderRadius.circular(8)),
            child: Row(
              children: [
                const Icon(Icons.warning_amber_rounded, color: Colors.orange),
                const SizedBox(width: 8),
                Expanded(child: Text(_error!, style: TextStyle(color: Colors.orange.shade800, fontSize: 13, fontWeight: FontWeight.bold))),
              ],
            ),
          ),

        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _deliveries.length,
            itemBuilder: (context, index) {
              final delivery = _deliveries[index];
              final maHD = delivery['maHD'] ?? delivery['MaHD'] ?? delivery['orderCode'] ?? delivery['OrderCode'] ?? 'Phiếu #${delivery['maGH'] ?? delivery['id'] ?? index}';
              final st = delivery['trangThai'] ?? delivery['TrangThai'] ?? delivery['status'] ?? delivery['Status'] ?? 'Chưa rõ';
              final ten = delivery['tenNguoiNhan'] ?? delivery['TenNguoiNhan'] ?? delivery['customerName'] ?? delivery['CustomerName'] ?? 'Khách hàng';
              final sdt = delivery['sdtNguoiNhan'] ?? delivery['SdtNguoiNhan'] ?? delivery['phoneNumber'] ?? delivery['PhoneNumber'] ?? '';
              final dc = delivery['diaChiGiaoHang'] ?? delivery['DiaChiGiaoHang'] ?? delivery['shippingAddress'] ?? delivery['ShippingAddress'] ?? 'Chưa có địa chỉ';
              final dateStr = delivery['ngayGiaoDuKien'] ?? delivery['NgayGiaoDuKien'] ?? delivery['deliveryDate'] ?? delivery['DeliveryDate'];

              final statusColor = _getStatusColor(st.toString());
              final date = dateStr != null ? DateTime.tryParse(dateStr.toString()) ?? DateTime.now() : DateTime.now();
              final formattedDate = DateFormat('dd/MM/yyyy HH:mm').format(date);

              return Card(
                margin: const EdgeInsets.only(bottom: 16),
                elevation: 4,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.receipt_long, color: Colors.teal.shade700, size: 20),
                              const SizedBox(width: 8),
                              Text(maHD.toString(), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: statusColor.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: statusColor),
                            ),
                            child: Text(st.toString(), style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 12)),
                          ),
                        ],
                      ),
                      const Divider(height: 24),
                      _buildIconRow(Icons.person, '$ten - $sdt'),
                      const SizedBox(height: 8),
                      _buildIconRow(Icons.location_on, dc.toString(), color: Colors.red.shade400),
                      const SizedBox(height: 8),
                      _buildIconRow(Icons.access_time, 'Dự kiến: $formattedDate'),
                      
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (context) => DeliveryDetailScreen(delivery: delivery)),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.teal,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          child: const Text('XEM CHI TIẾT & BẢN ĐỒ', style: TextStyle(fontWeight: FontWeight.bold)),
                        ),
                      )
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildIconRow(IconData icon, String text, {Color color = Colors.grey}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: color),
        const SizedBox(width: 8),
        Expanded(child: Text(text, style: const TextStyle(fontSize: 14))),
      ],
    );
  }
}
