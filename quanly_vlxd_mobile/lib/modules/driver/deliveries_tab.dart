import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/app_theme.dart';
import '../../services/api_service.dart';
import 'delivery_detail_screen.dart';

import 'delivery_form_screen.dart';

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
  bool _isTableView = false;
  String _searchQuery = '';

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
            _deliveries = response.data is List
                ? response.data
                : [response.data];
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
              "sdtNguoiNhan": "0901234567",
            },
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
    if (status.contains('Đã giao') || status.contains('Hoàn thành'))
      return Colors.green;
    if (status.contains('Hủy')) return Colors.red;
    return Colors.grey;
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.primaryStart),
      );
    }

    final filteredList = _deliveries.where((d) {
      final ten = (d['tenNguoiNhan'] ?? d['TenNguoiNhan'] ?? '')
          .toString()
          .toLowerCase();
      final ma = (d['maHD'] ?? d['MaHD'] ?? '').toString().toLowerCase();
      return ten.contains(_searchQuery.toLowerCase()) ||
          ma.contains(_searchQuery.toLowerCase());
    }).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Card(
          margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          child: Padding(
            padding: const EdgeInsets.all(12.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Chuyến đi hôm nay (${_deliveries.length})',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                        ),
                      ),
                    ),
                    ElevatedButton.icon(
                      onPressed: () async {
                        final res = await Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => const DeliveryFormScreen()),
                        );
                        if (res == true) _fetchDeliveries();
                      },
                      icon: const Icon(Icons.add, size: 18),
                      label: const Text('Tạo mới', style: TextStyle(fontWeight: FontWeight.bold)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryStart,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      icon: Icon(
                        _isTableView ? Icons.grid_view : Icons.table_chart,
                        color: AppColors.primaryStart,
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
                TextField(
                  onChanged: (val) => setState(() => _searchQuery = val),
                  decoration: InputDecoration(
                    hintText: 'Tìm kiếm mã phiếu, tên người nhận...',
                    prefixIcon: const Icon(Icons.search),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    filled: true,
                    fillColor: Colors.grey.shade100,
                  ),
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
          child: filteredList.isEmpty
              ? const Center(child: Text('Không tìm thấy chuyến đi nào'))
              : _isTableView
              ? _buildTableView(filteredList)
              : _buildCardView(filteredList),
        ),
      ],
    );
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
                  'Mã Phiếu',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              DataColumn(
                label: Text(
                  'Người Nhận',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              DataColumn(
                label: Text(
                  'Địa Chỉ',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              DataColumn(
                label: Text(
                  'Thời Gian',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              DataColumn(
                label: Text(
                  'Trạng Thái',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ],
            rows: list.map((delivery) {
              final maHD =
                  delivery['maHD'] ??
                  delivery['MaHD'] ??
                  delivery['orderCode'] ??
                  'Phiếu #${delivery['maGH'] ?? delivery['id'] ?? ''}';
              final st =
                  delivery['trangThai'] ??
                  delivery['TrangThai'] ??
                  delivery['status'] ??
                  'Chưa rõ';
              final ten =
                  delivery['tenKhachHang'] ??
                  delivery['tenNguoiNhan'] ??
                  delivery['TenNguoiNhan'] ??
                  delivery['customerName'] ??
                  'Khách hàng';
              final sdt =
                  delivery['sdtKhachHang'] ??
                  delivery['sdtNguoiNhan'] ??
                  delivery['SdtNguoiNhan'] ??
                  delivery['phoneNumber'] ??
                  '';
              final dc =
                  delivery['diaChi'] ??
                  delivery['diaChiGiaoHang'] ??
                  delivery['DiaChiGiaoHang'] ??
                  delivery['shippingAddress'] ??
                  'Chưa có địa chỉ';
              final dateStr =
                  delivery['ngayGiaoDuKien'] ??
                  delivery['NgayGiaoDuKien'] ??
                  delivery['deliveryDate'];

              final statusColor = _getStatusColor(st.toString());
              final date = dateStr != null
                  ? DateTime.tryParse(dateStr.toString()) ?? DateTime.now()
                  : DateTime.now();
              final formattedDate = DateFormat('dd/MM/yyyy HH:mm').format(date);

              return DataRow(
                cells: [
                  DataCell(
                    Text(
                      maHD.toString(),
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                  DataCell(Text('$ten - $sdt')),
                  DataCell(Text(dc.toString())),
                  DataCell(Text(formattedDate)),
                  DataCell(
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: statusColor),
                      ),
                      child: Text(
                        st.toString(),
                        style: TextStyle(
                          color: statusColor,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ),
                ],
                onSelectChanged: (selected) async {
                  if (selected == true) {
                    final res = await Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) =>
                            DeliveryDetailScreen(delivery: delivery),
                      ),
                    );
                    if (res == true) {
                      _fetchDeliveries();
                    }
                  }
                },
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
        final delivery = list[index];
        final maHD =
            delivery['maHD'] ??
            delivery['MaHD'] ??
            delivery['orderCode'] ??
            delivery['OrderCode'] ??
            'Phiếu #${delivery['maGH'] ?? delivery['id'] ?? index}';
        final st =
            delivery['trangThai'] ??
            delivery['TrangThai'] ??
            delivery['status'] ??
            delivery['Status'] ??
            'Chưa rõ';
        final ten =
            delivery['tenKhachHang'] ??
            delivery['tenNguoiNhan'] ??
            delivery['TenNguoiNhan'] ??
            delivery['customerName'] ??
            delivery['CustomerName'] ??
            'Khách hàng';
        final sdt =
            delivery['sdtKhachHang'] ??
            delivery['sdtNguoiNhan'] ??
            delivery['SdtNguoiNhan'] ??
            delivery['phoneNumber'] ??
            delivery['PhoneNumber'] ??
            '';
        final dc =
            delivery['diaChi'] ??
            delivery['diaChiGiaoHang'] ??
            delivery['DiaChiGiaoHang'] ??
            delivery['shippingAddress'] ??
            delivery['ShippingAddress'] ??
            'Chưa có địa chỉ';
        final dateStr =
            delivery['ngayGiaoDuKien'] ??
            delivery['NgayGiaoDuKien'] ??
            delivery['deliveryDate'] ??
            delivery['DeliveryDate'];

        final statusColor = _getStatusColor(st.toString());
        final date = dateStr != null
            ? DateTime.tryParse(dateStr.toString()) ?? DateTime.now()
            : DateTime.now();
        final formattedDate = DateFormat('dd/MM/yyyy HH:mm').format(date);

        return Card(
          margin: const EdgeInsets.only(bottom: 16),
          elevation: 4,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
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
                        Icon(
                          Icons.receipt_long,
                          color: AppColors.primaryStart,
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          maHD.toString(),
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: statusColor),
                      ),
                      child: Text(
                        st.toString(),
                        style: TextStyle(
                          color: statusColor,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
                const Divider(height: 24),
                _buildIconRow(Icons.person, '$ten - $sdt'),
                const SizedBox(height: 8),
                _buildIconRow(
                  Icons.location_on,
                  dc.toString(),
                  color: Colors.red.shade400,
                ),
                const SizedBox(height: 8),
                _buildIconRow(Icons.access_time, 'Dự kiến: $formattedDate'),

                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () async {
                      final res = await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) =>
                              DeliveryDetailScreen(delivery: delivery),
                        ),
                      );
                      if (res == true) {
                        _fetchDeliveries();
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryStart,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: const Text(
                      'XEM CHI TIẾT & BẢN ĐỒ',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildIconRow(
    IconData icon,
    String text, {
    Color color = Colors.grey,
  }) {
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
