import 'package:flutter/material.dart';

class DeliveryDetailScreen extends StatelessWidget {
  final Map<String, dynamic> delivery;

  const DeliveryDetailScreen({super.key, required this.delivery});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Chi tiết Giao Hàng'),
        backgroundColor: Colors.teal,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Thông tin chung
            Card(
              elevation: 4,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'MÃ ĐƠN: ${delivery['maHD'] ?? 'N/A'}',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.teal),
                    ),
                    const Divider(height: 24),
                    _buildInfoRow(Icons.person, 'Người nhận:', delivery['tenNguoiNhan'] ?? 'Khách hàng'),
                    _buildInfoRow(Icons.phone, 'Điện thoại:', delivery['sdtNguoiNhan'] ?? 'Chưa cập nhật', isHighlight: true),
                    _buildInfoRow(Icons.location_on, 'Địa chỉ:', delivery['diaChiGiaoHang'] ?? 'Chưa rõ'),
                    
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.amber.shade50,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.amber.shade200),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.warning_amber_rounded, color: Colors.amber.shade800),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Thu hộ (COD): 4.500.000 đ', // Mock COD for now
                              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.amber.shade900, fontSize: 16),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Giả lập Bản đồ
            const Text(
              'BẢN ĐỒ DẪN ĐƯỜNG',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 12),
            Container(
              height: 200,
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade400),
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  const Icon(Icons.map, size: 64, color: Colors.grey),
                  Positioned(
                    bottom: 16,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        // TODO: Mở Google Maps App
                      },
                      icon: const Icon(Icons.directions),
                      label: const Text('Chỉ đường với Google Maps'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 32),
            
            // Nút Thao tác Giao hàng
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton.icon(
                onPressed: () {
                  // TODO: Gọi API cập nhật trạng thái
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Xác nhận giao hàng thành công! Đã gửi thông báo cho khách.'),
                      backgroundColor: Colors.green,
                    ),
                  );
                  Navigator.pop(context);
                },
                icon: const Icon(Icons.check_circle, size: 28),
                label: const Text('XÁC NHẬN ĐÃ GIAO & THU TIỀN', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: OutlinedButton.icon(
                onPressed: () {
                  // TODO: Chụp ảnh minh chứng khi khách đi vắng / sự cố
                },
                icon: const Icon(Icons.report_problem, color: Colors.orange),
                label: const Text('BÁO CÁO SỰ CỐ / GIAO THẤT BẠI', style: TextStyle(color: Colors.orange, fontSize: 16)),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Colors.orange, width: 2),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value, {bool isHighlight = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: Colors.teal.shade700),
          const SizedBox(width: 8),
          SizedBox(
            width: 90,
            child: Text(label, style: const TextStyle(color: Colors.grey)),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontWeight: isHighlight ? FontWeight.bold : FontWeight.normal,
                color: isHighlight ? Colors.blue.shade800 : Colors.black87,
                fontSize: 15,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
