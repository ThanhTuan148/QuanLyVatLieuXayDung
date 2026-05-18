import 'package:flutter/material.dart';
import '../../services/api_service.dart';

class InventoryTab extends StatefulWidget {
  const InventoryTab({super.key});

  @override
  State<InventoryTab> createState() => _InventoryTabState();
}

class _InventoryTabState extends State<InventoryTab> {
  final ApiService _apiService = ApiService();
  List<dynamic> _inventory = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchInventory();
  }

  Future<void> _fetchInventory() async {
    try {
      final response = await _apiService.getInventory();
      if (response.statusCode == 200 && response.data != null) {
        if (mounted) {
          setState(() {
            _inventory = response.data is List ? response.data : [response.data];
            _isLoading = false;
            _error = null;
          });
        }
      } else {
        if (mounted) {
          setState(() {
            _error = 'Lỗi tải tồn kho: ${response.statusCode}';
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Không kết nối được Backend. Đang hiển thị dữ liệu mẫu.';
          _inventory = [
            {
              "maSanPham": 1,
              "tenSanPham": "Xi măng Insee Đa Dụng",
              "tongTon": 1250,
              "donViTinh": "Bao",
              "kho": [
                {"maKhoHang": 1, "tenKho": "Kho Trung Tâm", "soLuongTon": 1000},
                {"maKhoHang": 2, "tenKho": "Kho Chi Nhánh 1", "soLuongTon": 250},
              ]
            },
            {
              "maSanPham": 2,
              "tenSanPham": "Thép cuộn Pomina D10",
              "tongTon": 400,
              "donViTinh": "Kg",
              "kho": [
                {"maKhoHang": 1, "tenKho": "Kho Trung Tâm", "soLuongTon": 400},
              ]
            }
          ];
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: Colors.orange));
    }

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: TextField(
            decoration: InputDecoration(
              hintText: 'Tìm kiếm vật tư, mã vạch...',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: const Icon(Icons.qr_code_scanner, color: Colors.orange),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              filled: true,
              fillColor: Colors.grey.shade200,
            ),
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
            itemCount: _inventory.length,
            itemBuilder: (context, index) {
              final item = _inventory[index];
              final ten = item['tenSanPham'] ?? item['TenSanPham'] ?? item['name'] ?? item['Name'] ?? 'Sản phẩm';
              final tong = item['tongTon'] ?? item['TongTon'] ?? item['totalStock'] ?? item['TotalStock'] ?? item['soLuongTon'] ?? 0;
              final dvt = item['donViTinh'] ?? item['DonViTinh'] ?? item['unit'] ?? item['Unit'] ?? 'Đơn vị';
              final khoList = item['kho'] ?? item['Kho'] ?? item['warehouses'] ?? item['Warehouses'];

              return Card(
                elevation: 2,
                margin: const EdgeInsets.only(bottom: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: ExpansionTile(
                  leading: CircleAvatar(backgroundColor: Colors.orange.shade100, child: const Icon(Icons.inventory_2, color: Colors.orange)),
                  title: Text(ten.toString(), style: const TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text('Tổng tồn: $tong $dvt'),
                  children: [
                    const Divider(height: 1),
                    if (khoList != null && khoList is List)
                      ...khoList.map((k) {
                        final tenKho = k['tenKho'] ?? k['TenKho'] ?? k['warehouseName'] ?? k['WarehouseName'] ?? 'Kho';
                        final sl = k['soLuongTon'] ?? k['SoLuongTon'] ?? k['stock'] ?? k['Stock'] ?? 0;
                        return ListTile(
                          dense: true,
                          leading: const Icon(Icons.location_on, size: 16, color: Colors.grey),
                          title: Text(tenKho.toString()),
                          trailing: Text('$sl', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                        );
                      }),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
