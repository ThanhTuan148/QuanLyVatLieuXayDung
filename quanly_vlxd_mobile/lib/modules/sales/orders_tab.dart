import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';
import 'order_detail_screen.dart';

class OrdersTab extends StatefulWidget {
  const OrdersTab({super.key});

  @override
  State<OrdersTab> createState() => _OrdersTabState();
}

class _OrdersTabState extends State<OrdersTab> {
  final ApiService _apiService = ApiService();
  List<dynamic> _orders = [];
  bool _isLoading = true;
  String? _error;
  String _selectedFilter = 'Tất cả';
  bool _isTableView = false;
  String _searchQuery = '';

  final NumberFormat _currencyFormat = NumberFormat.currency(
    locale: 'vi_VN',
    symbol: 'đ',
  );

  @override
  void initState() {
    super.initState();
    _fetchOrders();
  }

  Future<void> _fetchOrders() async {
    try {
      final response = await _apiService.getOrders();
      if (response.statusCode == 200 && response.data != null) {
        if (mounted) {
          setState(() {
            _orders = response.data is List ? response.data : [response.data];
            _isLoading = false;
            _error = null;
          });
        }
      } else {
        if (mounted) {
          setState(() {
            _error = 'Lỗi tải đơn hàng: ${response.statusCode}';
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Không thể kết nối Backend.\nĐang hiển thị dữ liệu mẫu.';
          _orders = [
            {
              "maHoaDon": 1,
              "maHD": "HD045",
              "tenKhachHang": "Anh Tuấn",
              "ngayLap": DateTime.now().toIso8601String(),
              "tongTien": 4500000,
              "trangThai": "Chờ xử lý",
            },
            {
              "maHoaDon": 2,
              "maHD": "HD046",
              "tenKhachHang": "Chị Mai Lan",
              "ngayLap": DateTime.now()
                  .subtract(const Duration(days: 1))
                  .toIso8601String(),
              "tongTien": 12500000,
              "trangThai": "Đã xác nhận",
            },
            {
              "maHoaHoa": 3,
              "maHD": "HD047",
              "tenKhachHang": "Công ty Xây dựng ABC",
              "ngayLap": DateTime.now()
                  .subtract(const Duration(days: 2))
                  .toIso8601String(),
              "tongTien": 35000000,
              "trangThai": "Đang giao",
            },
          ];
          _isLoading = false;
        });
      }
    }
  }

  Color _getStatusColor(String? status) {
    switch (status) {
      case 'Chờ xử lý':
        return Colors.orange;
      case 'Đã xác nhận':
        return Colors.blue;
      case 'Đang giao':
        return Colors.purple;
      case 'Hoàn thành':
        return Colors.green;
      case 'Đã hủy':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    final filteredOrders = _orders.where((o) {
      final st =
          o['trangThai'] ?? o['TrangThai'] ?? o['status'] ?? o['Status'] ?? '';
      final matchesStatus =
          _selectedFilter == 'Tất cả' || st == _selectedFilter;

      final ma = (o['maHD'] ?? o['MaHD'] ?? '').toString().toLowerCase();
      final ten = (o['tenKhachHang'] ?? o['TenKhachHang'] ?? '')
          .toString()
          .toLowerCase();
      final matchesQuery =
          ma.contains(_searchQuery.toLowerCase()) ||
          ten.contains(_searchQuery.toLowerCase());

      return matchesStatus && matchesQuery;
    }).toList();

    return Column(
      children: [
        Card(
          margin: const EdgeInsets.fromLTRB(16, 12, 16, 4),
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Đơn hàng (${_orders.length})',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                      ),
                    ),
                    IconButton(
                      icon: Icon(
                        _isTableView ? Icons.grid_view : Icons.table_chart,
                        color: Theme.of(context).colorScheme.primary,
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
                  decoration: InputDecoration(
                    hintText: 'Tìm kiếm mã ĐH, tên KH...',
                    prefixIcon: const Icon(Icons.search),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                  ),
                  onChanged: (val) => setState(() => _searchQuery = val),
                ),
              ],
            ),
          ),
        ),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
          child: Row(
            children: [
              _buildFilterChip('Tất cả'),
              _buildFilterChip('Chờ xử lý'),
              _buildFilterChip('Đã xác nhận'),
              _buildFilterChip('Đang giao'),
              _buildFilterChip('Hoàn thành'),
              _buildFilterChip('Đã hủy'),
            ],
          ),
        ),

        if (_error != null)
          Container(
            padding: const EdgeInsets.all(12),
            margin: const EdgeInsets.only(bottom: 8, left: 16, right: 16),
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
          child: filteredOrders.isEmpty
              ? const Center(child: Text('Không tìm thấy đơn hàng nào'))
              : _isTableView
              ? _buildTableView(filteredOrders)
              : _buildCardView(filteredOrders),
        ),
      ],
    );
  }

  Widget _buildTableView(List<dynamic> list) {
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
              DataColumn(
                label: Text(
                  'Mã ĐH',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              DataColumn(
                label: Text(
                  'Tên Khách Hàng',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              DataColumn(
                label: Text(
                  'Ngày Lập',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              DataColumn(
                label: Text(
                  'Tổng Tiền',
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
            rows: list.map((order) {
              final ma =
                  order['maHD'] ??
                  order['MaHD'] ??
                  order['orderCode'] ??
                  'HD_UNK';
              final st =
                  order['trangThai'] ??
                  order['TrangThai'] ??
                  order['status'] ??
                  'Chờ xử lý';
              final ten =
                  order['tenKhachHang'] ??
                  order['TenKhachHang'] ??
                  order['customerName'] ??
                  'Khách hàng';
              final dateStr =
                  order['ngayLap'] ?? order['NgayLap'] ?? order['createdDate'];
              final tong =
                  order['tongTien'] ??
                  order['TongTien'] ??
                  order['totalAmount'] ??
                  0;

              final statusColor = _getStatusColor(st.toString());
              final date = dateStr != null
                  ? DateTime.tryParse(dateStr.toString()) ?? DateTime.now()
                  : DateTime.now();
              final formattedDate = DateFormat('dd/MM/yyyy HH:mm').format(date);

              return DataRow(
                cells: [
                  DataCell(
                    Text(
                      ma.toString(),
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                  DataCell(Text(ten.toString())),
                  DataCell(Text(formattedDate)),
                  DataCell(
                    Text(
                      _currencyFormat.format(tong),
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.primary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  DataCell(
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: statusColor.withValues(alpha: 0.5),
                        ),
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
                    final result = await Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => OrderDetailScreen(order: order),
                      ),
                    );
                    if (result == true) _fetchOrders();
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
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: list.length,
      itemBuilder: (context, index) {
        final order = list[index];
        final ma =
            order['maHD'] ??
            order['MaHD'] ??
            order['orderCode'] ??
            order['OrderCode'] ??
            order['id'] ??
            'HD_UNK';
        final st =
            order['trangThai'] ??
            order['TrangThai'] ??
            order['status'] ??
            order['Status'] ??
            'Chờ xử lý';
        final ten =
            order['tenKhachHang'] ??
            order['TenKhachHang'] ??
            order['customerName'] ??
            order['CustomerName'] ??
            'Khách hàng';
        final dateStr =
            order['ngayLap'] ??
            order['NgayLap'] ??
            order['createdDate'] ??
            order['CreatedDate'];
        final tong =
            order['tongTien'] ??
            order['TongTien'] ??
            order['totalAmount'] ??
            order['TotalAmount'] ??
            0;

        final statusColor = _getStatusColor(st.toString());
        final date = dateStr != null
            ? DateTime.tryParse(dateStr.toString()) ?? DateTime.now()
            : DateTime.now();
        final formattedDate = DateFormat('dd/MM/yyyy HH:mm').format(date);

        return GestureDetector(
          onTap: () async {
            final result = await Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => OrderDetailScreen(order: order),
              ),
            );
            if (result == true) {
              _fetchOrders();
            }
          },
          child: Card(
            margin: const EdgeInsets.only(bottom: 12),
            elevation: 2,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        ma.toString(),
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: statusColor.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: statusColor.withValues(alpha: 0.5),
                          ),
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
                  Row(
                    children: [
                      const Icon(
                        Icons.person_outline,
                        size: 16,
                        color: Colors.grey,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        ten.toString(),
                        style: const TextStyle(fontSize: 14),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(
                        Icons.access_time,
                        size: 16,
                        color: Colors.grey,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        formattedDate,
                        style: const TextStyle(
                          fontSize: 14,
                          color: Colors.grey,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Tổng tiền:',
                        style: TextStyle(color: Colors.grey),
                      ),
                      Text(
                        _currencyFormat.format(tong),
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.primary,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildFilterChip(String label) {
    final isSelected = _selectedFilter == label;
    return Padding(
      padding: const EdgeInsets.only(right: 8.0),
      child: FilterChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (bool selected) {
          setState(() {
            _selectedFilter = label;
          });
        },
        selectedColor: Theme.of(
          context,
        ).colorScheme.primary.withValues(alpha: 0.2),
        checkmarkColor: Theme.of(context).colorScheme.primary,
        labelStyle: TextStyle(
          color: isSelected
              ? Theme.of(context).colorScheme.primary
              : Colors.black87,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
      ),
    );
  }
}
