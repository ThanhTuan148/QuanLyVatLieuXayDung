import 'dart:convert';
import 'package:flutter/material.dart';
import '../../../services/api_service.dart';
import '../../../services/shared_preferences_service.dart';

class DeliveryFormScreen extends StatefulWidget {
  final String? initialOrderId;

  const DeliveryFormScreen({Key? key, this.initialOrderId}) : super(key: key);

  @override
  _DeliveryFormScreenState createState() => _DeliveryFormScreenState();
}

class _DeliveryFormScreenState extends State<DeliveryFormScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = false;
  bool _isLoadingDetails = false;

  List<dynamic> _orders = [];
  List<dynamic> _drivers = [];
  
  String? _selectedOrderId;
  dynamic _selectedDriver;
  
  final TextEditingController _addressController = TextEditingController();
  final TextEditingController _noteController = TextEditingController();

  List<dynamic> _items = [];

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    try {
      final ordersRes = await _apiService.getOrders();
      final driversRes = await _apiService.getEmployees();
      
      setState(() {
        _orders = (ordersRes.data as List).where((o) =>
          o['trangThai'] == 'Đã xác nhận' || 
          o['trangThai'] == 'Chờ xử lý' || 
          o['trangThai'] == 'Đang giao (Thiếu hàng)' ||
          o['trangThai'] == 'Đã giao một phần' ||
          o['maHoaDon'] == widget.initialOrderId
        ).toList();
        
        _drivers = (driversRes.data as List).where((e) => e['tenVaiTro'] == 'Tài xế').toList();
      });

      if (widget.initialOrderId != null) {
        _selectedOrderId = widget.initialOrderId;
        _fetchOrderDetails(_selectedOrderId!);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi tải dữ liệu: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _fetchOrderDetails(String maHoaDon) async {
    setState(() => _isLoadingDetails = true);
    try {
      final res = await _apiService.getOrderDetail(int.parse(maHoaDon.replaceAll(RegExp(r'[^0-9]'), '')));
      final order = res.data;
      
      String mainAddress = order['diaChiGiaoHang'] == 'Giao hàng nhiều địa chỉ' ? '' : (order['diaChiGiaoHang'] ?? '');
      _addressController.text = mainAddress;

      final processedItems = (order['chiTiet'] as List).map((ct) {
        final total = ct['soLuong'] ?? ct['SoLuong'] ?? 0;
        final chuaGan = ct['soLuongChuaGan'] ?? 0;
        final conLai = chuaGan;
        return {
          'maCTHD': ct['maCTHD'] ?? ct['MaCTHD'],
          'maSanPham': ct['maSanPham'] ?? ct['MaSanPham'],
          'tenSanPham': ct['tenSanPham'] ?? ct['TenSanPham'],
          'soLuongGoc': total,
          'soLuongDaGan': ct['soLuongDaGan'] ?? 0,
          'soLuongConLai': conLai,
          'soLuongGiao': conLai > 0 ? conLai : 0,
          'ghiChu': '',
        };
      }).toList();

      setState(() {
        _items = processedItems;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi tải chi tiết đơn hàng: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoadingDetails = false);
    }
  }

  void _submit() async {
    if (_selectedOrderId == null || _selectedDriver == null || _addressController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Vui lòng nhập đủ Hóa đơn, Tài xế, Địa chỉ!')));
      return;
    }

    final deliverableItems = _items.where((i) => (i['soLuongGiao'] as int) > 0).toList();
    if (deliverableItems.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Vui lòng chọn ít nhất 1 sản phẩm để giao (Số lượng > 0)')));
      return;
    }

    setState(() => _isLoading = true);
    try {
      final userStr = SharedPreferencesService.getUser();
      Map<String, dynamic> user = {};
      if (userStr != null) {
        try {
          user = jsonDecode(userStr);
        } catch (e) {}
      }
      final currentUserIdStr = user['maNhanVien']?.toString() ?? user['id']?.toString() ?? '0';
      final currentUserId = int.tryParse(currentUserIdStr) ?? 0;

      final payload = {
        'nguoiGiao': _selectedDriver['tenNV'],
        'diaChi': _addressController.text,
        'ghiChu': _noteController.text,
        'maHoaDon': _selectedOrderId,
        'maNhanVien': _selectedDriver['maNhanVien'],
        'maNguoiLap': currentUserId,
        'items': deliverableItems.map((i) => {
          'maSanPham': i['maSanPham'],
          'maCTHD': i['maCTHD'],
          'soLuongGiao': i['soLuongGiao'],
          'ghiChu': i['ghiChu']
        }).toList()
      };

      await _apiService.createDelivery(payload);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Tạo phiếu giao hàng thành công!'), backgroundColor: Colors.green));
        Navigator.pop(context, true); 
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi tạo phiếu giao: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tạo Phiếu Giao Hàng'),
        backgroundColor: Colors.blue.shade800,
        foregroundColor: Colors.white,
      ),
      body: _isLoading && _orders.isEmpty 
        ? const Center(child: CircularProgressIndicator())
        : SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                DropdownButtonFormField<String>(
                  decoration: const InputDecoration(labelText: 'Hóa đơn *', border: OutlineInputBorder()),
                  value: _selectedOrderId,
                  items: _orders.map((o) {
                    return DropdownMenuItem<String>(
                      value: o['maHoaDon'].toString(),
                      child: Text('${o['maHD']} - Khách: ${o['tenKhachHang'] ?? "Khách lẻ"}'),
                    );
                  }).toList(),
                  onChanged: (val) {
                    setState(() {
                      _selectedOrderId = val;
                      _items = [];
                    });
                    if (val != null) _fetchOrderDetails(val);
                  },
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<dynamic>(
                  decoration: const InputDecoration(labelText: 'Tài xế giao hàng *', border: OutlineInputBorder()),
                  value: _selectedDriver,
                  items: _drivers.map((d) {
                    return DropdownMenuItem<dynamic>(
                      value: d,
                      child: Text('${d['tenNV']} ${d['sucChuaToiDa'] != null ? "(Sức chứa: ${d['sucChuaToiDa']} kg)" : ""}'),
                    );
                  }).toList(),
                  onChanged: (val) {
                    setState(() => _selectedDriver = val);
                  },
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _addressController,
                  decoration: const InputDecoration(labelText: 'Địa chỉ giao chuyến này *', border: OutlineInputBorder()),
                  maxLines: 2,
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _noteController,
                  decoration: const InputDecoration(labelText: 'Ghi chú', border: OutlineInputBorder()),
                  maxLines: 2,
                ),
                const SizedBox(height: 24),
                
                if (_isLoadingDetails)
                  const Center(child: CircularProgressIndicator())
                else if (_items.isNotEmpty) ...[
                  const Text('Chọn sản phẩm giao chuyến này:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 8),
                  ..._items.map((item) {
                    final isDone = (item['soLuongConLai'] as int) <= 0;
                    return Card(
                      color: isDone ? Colors.grey.shade100 : Colors.white,
                      margin: const EdgeInsets.only(bottom: 8),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(item['tenSanPham'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('Gốc: ${item['soLuongGoc']}'),
                                Text('Còn lại: ${item['soLuongConLai']}', style: TextStyle(color: item['soLuongConLai'] > 0 ? Colors.green : Colors.grey, fontWeight: FontWeight.bold)),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                const Text('SL Giao: '),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: TextFormField(
                                    initialValue: item['soLuongGiao'].toString(),
                                    keyboardType: TextInputType.number,
                                    decoration: const InputDecoration(isDense: true, border: OutlineInputBorder()),
                                    enabled: !isDone,
                                    onChanged: (val) {
                                      int v = int.tryParse(val) ?? 0;
                                      if (v > item['soLuongConLai']) v = item['soLuongConLai'];
                                      if (v < 0) v = 0;
                                      setState(() {
                                        item['soLuongGiao'] = v;
                                      });
                                    },
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            TextField(
                              decoration: const InputDecoration(labelText: 'Ghi chú SP', isDense: true, border: OutlineInputBorder()),
                              enabled: !isDone,
                              onChanged: (val) => item['ghiChu'] = val,
                            )
                          ],
                        ),
                      ),
                    );
                  }).toList()
                ]
              ],
            ),
          ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: ElevatedButton(
            onPressed: _isLoading ? null : _submit,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue.shade800,
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
            child: _isLoading 
              ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white))
              : const Text('TẠO PHIẾU GIAO', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
          ),
        ),
      ),
    );
  }
}
