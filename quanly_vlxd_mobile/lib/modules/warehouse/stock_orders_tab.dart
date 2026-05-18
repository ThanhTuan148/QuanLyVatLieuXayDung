import 'package:flutter/material.dart';

class StockOrdersTab extends StatefulWidget {
  const StockOrdersTab({super.key});

  @override
  State<StockOrdersTab> createState() => _StockOrdersTabState();
}

class _StockOrdersTabState extends State<StockOrdersTab> {
  // Mock Data
  final List<Map<String, dynamic>> _mockOrders = [
    {
      "maPhieu": "XK-001",
      "loai": "Xuất kho",
      "trangThai": "Chờ soạn hàng",
      "ngayTao": "2024-05-17T09:00:00",
      "soLuongItem": 3,
      "ghiChu": "Đơn hàng online HD045",
    },
    {
      "maPhieu": "NK-042",
      "loai": "Nhập kho",
      "trangThai": "Chờ kiểm đếm",
      "ngayTao": "2024-05-17T10:30:00",
      "soLuongItem": 1,
      "ghiChu": "Nhập hàng từ NCC Xi Măng Tiên Phong",
    }
  ];

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Column(
        children: [
          Container(
            color: Colors.orange.shade700,
            child: const TabBar(
               indicatorColor: Colors.white,
              labelColor: Colors.white,
              unselectedLabelColor: Colors.white70,
              tabs: [
                Tab(text: 'CHỜ XUẤT KHO'),
                Tab(text: 'CHỜ NHẬP KHO'),
              ],
            ),
          ),
          Expanded(
            child: TabBarView(
              children: [
                _buildList("Xuất kho"),
                _buildList("Nhập kho"),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildList(String loai) {
    final filtered = _mockOrders.where((o) => o['loai'] == loai).toList();

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: filtered.length,
      itemBuilder: (context, index) {
        final order = filtered[index];
        final isExport = order['loai'] == 'Xuất kho';

        return Card(
          elevation: 2,
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(
            side: BorderSide(color: isExport ? Colors.blue.shade200 : Colors.green.shade200),
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
                    Row(
                      children: [
                        Icon(isExport ? Icons.outbound : Icons.move_to_inbox, 
                             color: isExport ? Colors.blue : Colors.green),
                        const SizedBox(width: 8),
                        Text(
                          order['maPhieu'],
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.orange.shade100,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        order['trangThai'],
                        style: TextStyle(color: Colors.orange.shade800, fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text('Số lượng mã vật tư: ${order['soLuongItem']}'),
                Text('Ghi chú: ${order['ghiChu']}', style: const TextStyle(color: Colors.grey)),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      // TODO: Mở màn hình quét kiểm đếm chi tiết
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isExport ? Colors.blue : Colors.green,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    child: Text(isExport ? 'SOẠN HÀNG XUẤT KHO' : 'KIỂM ĐẾM NHẬP KHO'),
                  ),
                )
              ],
            ),
          ),
        );
      },
    );
  }
}
