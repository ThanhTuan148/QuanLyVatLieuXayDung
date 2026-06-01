import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/app_theme.dart';
import '../../services/api_service.dart';

class OrderDetailScreen extends StatefulWidget {
  final Map<String, dynamic> order;

  const OrderDetailScreen({super.key, required this.order});

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  Map<String, dynamic>? _orderDetail;
  final _currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');

  @override
  void initState() {
    super.initState();
    _fetchOrderDetails();
  }

  Future<void> _fetchOrderDetails() async {
    setState(() => _isLoading = true);
    try {
      final id =
          widget.order['maHoaDon'] ??
          widget.order['MaHoaDon'] ??
          widget.order['id'];
      final response = await _apiService.getOrderDetail(id);
      if (response.statusCode == 200 && response.data != null) {
        if (mounted) {
          setState(() {
            _orderDetail = response.data;
            _isLoading = false;
          });
        }
      } else {
        if (mounted) setState(() => _isLoading = false);
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _updateOrderStatus(String newStatus) async {
    setState(() => _isLoading = true);
    try {
      final id =
          widget.order['maHoaDon'] ??
          widget.order['MaHoaDon'] ??
          widget.order['id'];
      final response = await _apiService.updateOrder(id, {
        'trangThai': newStatus,
      });
      if (response.statusCode == 200 || response.statusCode == 204) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                newStatus == 'Đã hủy'
                    ? 'Đã hủy đơn hàng thành công!'
                    : 'Đã xác nhận đơn hàng thành công!',
              ),
              backgroundColor: newStatus == 'Đã hủy'
                  ? Colors.red
                  : Colors.green,
            ),
          );
          Navigator.pop(context, true);
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Lỗi cập nhật: ${response.statusCode}')),
          );
          setState(() => _isLoading = false);
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Lỗi kết nối: $e')));
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final dateStr = widget.order['ngayLap'] ?? widget.order['NgayLap'];
    final date = dateStr != null
        ? DateTime.parse(dateStr.toString())
        : DateTime.now();
    final formattedDate = DateFormat('dd/MM/yyyy HH:mm').format(date);
    final maHD =
        widget.order['maHD'] ??
        widget.order['MaHD'] ??
        widget.order['maHoaDon'] ??
        '';
    final tenKH =
        widget.order['tenKhachHang'] ??
        widget.order['TenKhachHang'] ??
        'Khách vãng lai';
    final tongTien = widget.order['tongTien'] ?? widget.order['TongTien'] ?? 0;
    final trangThai =
        widget.order['trangThai'] ?? widget.order['TrangThai'] ?? 'Chờ xử lý';

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Chi tiết $maHD',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.purple.shade800,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Thông tin chung
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'THÔNG TIN ĐƠN HÀNG',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Colors.grey,
                      ),
                    ),
                    const Divider(),
                    const SizedBox(height: 8),
                    _buildInfoRow('Khách hàng:', tenKH.toString()),
                    _buildInfoRow('Ngày lập:', formattedDate),
                    _buildInfoRow(
                      'Trạng thái hiện tại:',
                      trangThai.toString(),
                      isStatus: true,
                    ),
                    const SizedBox(height: 16),
                    _buildInfoRow(
                      'Tổng tiền:',
                      _currencyFormat.format(tongTien),
                      isBold: true,
                      isPrice: true,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Danh sách sản phẩm
            const Text(
              'SẢN PHẨM TRONG ĐƠN',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 12),
            if (_isLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(20.0),
                  child: CircularProgressIndicator(),
                ),
              )
            else if (_orderDetail != null &&
                _orderDetail!['chiTiet'] != null &&
                (_orderDetail!['chiTiet'] as List).isNotEmpty)
              Card(
                elevation: 2,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                child: ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: (_orderDetail!['chiTiet'] as List).length,
                  separatorBuilder: (context, index) =>
                      const Divider(height: 1),
                  itemBuilder: (context, index) {
                    final item = _orderDetail!['chiTiet'][index];
                    final tenSP =
                        item['tenSanPham'] ?? item['TenSanPham'] ?? 'Sản phẩm';
                    final soLuong = item['soLuong'] ?? item['SoLuong'] ?? 0;
                    final donGia = item['donGia'] ?? item['DonGia'] ?? 0;
                    final thanhTien =
                        item['thanhTien'] ??
                        item['ThanhTien'] ??
                        (soLuong * donGia);

                    return ListTile(
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      leading: Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: Colors.purple.shade50,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(
                          Icons.inventory_2,
                          color: Colors.purple.shade700,
                        ),
                      ),
                      title: Text(
                        tenSP.toString(),
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                      subtitle: Padding(
                        padding: const EdgeInsets.only(top: 4.0),
                        child: Text(
                          'SL: $soLuong  x  ${_currencyFormat.format(donGia)}',
                          style: TextStyle(color: Colors.grey.shade700),
                        ),
                      ),
                      trailing: Text(
                        _currencyFormat.format(thanhTien),
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.purple.shade800,
                          fontSize: 15,
                        ),
                      ),
                    );
                  },
                ),
              )
            else
              Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Center(
                    child: Column(
                      children: [
                        Icon(
                          Icons.cloud_off,
                          size: 48,
                          color: Colors.grey.shade400,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'Không tải được chi tiết từ Backend',
                          style: TextStyle(
                            color: Colors.grey.shade600,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Vui lòng kiểm tra lại kết nối mạng',
                          style: TextStyle(
                            color: Colors.grey.shade500,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

            const SizedBox(height: 32),

            // Các nút thao tác dành cho Quản lý / Nhân viên
            if (trangThai == 'Chờ xử lý')
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () => _updateOrderStatus('Đã xác nhận'),
                  icon: const Icon(Icons.check_circle_outline),
                  label: const Text('XÁC NHẬN (DUYỆT ĐƠN)'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
              ),

            if (trangThai == 'Chờ xử lý' || trangThai == 'Đã xác nhận') ...[
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () => _updateOrderStatus('Đã hủy'),
                  icon: const Icon(Icons.cancel_outlined, color: Colors.red),
                  label: const Text(
                    'HỦY ĐƠN HÀNG',
                    style: TextStyle(color: Colors.red),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Colors.red),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(
    String label,
    String value, {
    bool isStatus = false,
    bool isBold = false,
    bool isPrice = false,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(label, style: const TextStyle(color: Colors.black54)),
          ),
          Expanded(
            child: isStatus
                ? Align(
                    alignment: Alignment.centerLeft,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.blue.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: Colors.blue.withValues(alpha: 0.5),
                        ),
                      ),
                      child: Text(
                        value,
                        style: const TextStyle(
                          color: Colors.blue,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  )
                : Text(
                    value,
                    style: TextStyle(
                      fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
                      fontSize: isPrice ? 18 : 14,
                      color: isPrice ? AppColors.primaryStart : Colors.black87,
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
