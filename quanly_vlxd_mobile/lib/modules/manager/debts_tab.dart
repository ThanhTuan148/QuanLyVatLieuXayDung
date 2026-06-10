import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/api_service.dart';
import '../../services/shared_preferences_service.dart';
import '../../core/permission_helper.dart';

class DebtsTab extends StatefulWidget {
  const DebtsTab({super.key});

  @override
  State<DebtsTab> createState() => _DebtsTabState();
}

class _DebtsTabState extends State<DebtsTab>
    with SingleTickerProviderStateMixin {
  final ApiService _apiService = ApiService();
  late TabController _tabController;

  // Dữ liệu 3 tab
  List<dynamic> _receivableDebts = []; // Phải thu
  List<dynamic> _payableDebts = []; // Phải trả
  List<dynamic> _debtWarnings = []; // Cảnh báo nợ
  Map<String, dynamic> _stats = {};
  bool _isLoading = false;

  // Bộ lọc
  String _searchQuery = '';
  String _selectedStatus = 'Tất cả';
  bool _isTableView = false;

  final List<String> _statusList = [
    'Tất cả',
    'Chưa thanh toán',
    'Sắp đến hạn',
    'Quá hạn',
    'Đã thanh toán',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        setState(() {});
      }
    });
    _fetchDebtsData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchDebtsData() async {
    setState(() => _isLoading = true);
    try {
      final resRec = await _apiService.getDebtsFiltered(type: 'Phải thu');
      final resPay = await _apiService.getDebtsFiltered(type: 'Phải trả');
      final resWarn = await _apiService.getDebtWarnings();
      final resStats = await _apiService.getDebtStatistics();

      if (!mounted) return;
      setState(() {
        if (resRec.statusCode == 200 && resRec.data != null)
          _receivableDebts = resRec.data is List ? resRec.data : [];
        if (resPay.statusCode == 200 && resPay.data != null)
          _payableDebts = resPay.data is List ? resPay.data : [];
        if (resWarn.statusCode == 200 && resWarn.data != null)
          _debtWarnings = resWarn.data is List ? resWarn.data : [];
        if (resStats.statusCode == 200 && resStats.data != null)
          _stats = resStats.data;
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Lỗi tải dữ liệu Công nợ: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  List<dynamic> _getFilteredList(List<dynamic> source) {
    return source.where((item) {
      // Tìm kiếm nhanh
      final ma = (item['maCN'] ?? item['maCongNo'] ?? '')
          .toString()
          .toLowerCase();
      final ten =
          (item['tenKhachHang'] ?? item['tenNCC'] ?? item['tenDoiTac'] ?? '')
              .toString()
              .toLowerCase();
      final matchQuery =
          ma.contains(_searchQuery.toLowerCase()) ||
          ten.contains(_searchQuery.toLowerCase());

      // Lọc trạng thái
      final st = (item['trangThai'] ?? '').toString();
      final matchStatus =
          _selectedStatus == 'Tất cả' ||
          st.toLowerCase() == _selectedStatus.toLowerCase();

      return matchQuery && matchStatus;
    }).toList();
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'đã thanh toán':
        return Colors.green.shade700;
      case 'sắp đến hạn':
        return Colors.orange.shade700;
      case 'quá hạn':
        return Colors.red.shade700;
      case 'chưa thanh toán':
      default:
        return Colors.blue.shade700;
    }
  }

  // =========================================================================
  // XEM CHI TIẾT & GHI NHẬN THANH TOÁN
  // =========================================================================
  void _showDetailDialog(Map<String, dynamic> debt) async {
    final int id = debt['maCongNo'] ?? debt['id'];
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    try {
      final resHist = await _apiService.getDebtHistory(id);
      if (!mounted) return;
      Navigator.pop(context); // Đóng loading

      List<dynamic> history = [];
      if (resHist.statusCode == 200 && resHist.data != null) {
        history = resHist.data is List ? resHist.data : [];
      }

      _showDebtDetailPopup(debt, history);
    } catch (e) {
      if (!mounted) return;
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Lỗi tải lịch sử thanh toán: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _showDebtDetailPopup(Map<String, dynamic> debt, List<dynamic> history) {
    final ma = debt['maCN'] ?? debt['maCongNo'];
    final ten =
        debt['tenKhachHang'] ?? debt['tenNCC'] ?? debt['tenDoiTac'] ?? 'N/A';
    final currentStatus = debt['trangThai'] ?? 'Chưa thanh toán';
    final isPhaiThu = debt['loaiCongNo'] == 'Phải thu';

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Chi Tiết Công Nợ: $ma',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: _getStatusColor(currentStatus).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  currentStatus,
                  style: TextStyle(
                    color: _getStatusColor(currentStatus),
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ),
          content: SizedBox(
            width: double.maxFinite,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Card(
                    color: Colors.grey.shade50,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(color: Colors.grey.shade200),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${isPhaiThu ? "Khách hàng" : "Nhà cung cấp"}: $ten',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Hóa đơn / Phiếu nhập: ${debt['maHD'] ?? debt['maPN'] ?? "N/A"}',
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Hạn thanh toán: ${debt['hanThanhToan'] != null ? DateFormat('dd/MM/yyyy').format(DateTime.parse(debt['hanThanhToan'])) : 'Không có'}',
                          ),
                          const Divider(height: 24),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Tổng nợ ban đầu:'),
                              Text(
                                NumberFormat.currency(
                                  locale: 'vi_VN',
                                  symbol: 'đ',
                                ).format(debt['soTienNo'] ?? 0),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Đã thanh toán:'),
                              Text(
                                NumberFormat.currency(
                                  locale: 'vi_VN',
                                  symbol: 'đ',
                                ).format(debt['soTienDaTra'] ?? 0),
                                style: const TextStyle(color: Colors.green),
                              ),
                            ],
                          ),
                          const Divider(height: 16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'Nợ còn lại:',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
                              ),
                              Text(
                                NumberFormat.currency(
                                  locale: 'vi_VN',
                                  symbol: 'đ',
                                ).format(debt['soTienConLai'] ?? 0),
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 18,
                                  color: Colors.red.shade700,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'LỊCH SỬ THANH TOÁN:',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                  const SizedBox(height: 8),
                  if (history.isEmpty)
                    const Text(
                      'Chưa có giao dịch thanh toán nào',
                      style: TextStyle(
                        color: Colors.grey,
                        fontStyle: FontStyle.italic,
                      ),
                    )
                  else
                    Column(
                      children: history.map((h) {
                        return Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          child: ListTile(
                            dense: true,
                            leading: const Icon(
                              Icons.payment,
                              color: Colors.green,
                            ),
                            title: Text(
                              NumberFormat.currency(
                                locale: 'vi_VN',
                                symbol: 'đ',
                              ).format(h['soTien'] ?? 0),
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Colors.green,
                              ),
                            ),
                            subtitle: Text(
                              'Ngày: ${h['ngayTT'] != null ? DateFormat('dd/MM/yyyy HH:mm').format(DateTime.parse(h['ngayTT'])) : "N/A"} | PTTT: ${h['pttt'] ?? "Tiền mặt"}',
                            ),
                            trailing: Text(
                              h['tenNhanVien'] ?? 'Hệ thống',
                              style: const TextStyle(
                                fontSize: 12,
                                color: Colors.grey,
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('ĐÓNG', style: TextStyle(color: Colors.grey)),
            ),
            if ((debt['soTienConLai'] ?? 0) > 0)
              ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(context);
                  _showPaymentPopup(debt);
                },
                icon: const Icon(Icons.add_card),
                label: const Text('GHI NHẬN THANH TOÁN'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  foregroundColor: Colors.white,
                ),
              ),
          ],
        );
      },
    );
  }

  void _showPaymentPopup(Map<String, dynamic> debt) {
    final amountCtrl = TextEditingController(
      text: (debt['soTienConLai'] ?? 0).toString(),
    );
    final methodCtrl = TextEditingController(text: 'Tiền mặt');
    final transCtrl = TextEditingController();
    final noteCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: const Text(
            'Ghi Nhận Thanh Toán',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: amountCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Số tiền thanh toán (đ)',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: 'Tiền mặt',
                  decoration: const InputDecoration(
                    labelText: 'Phương thức thanh toán',
                    border: OutlineInputBorder(),
                  ),
                  items: ['Tiền mặt', 'Chuyển khoản', 'Thẻ ngân hàng']
                      .map((m) => DropdownMenuItem(value: m, child: Text(m)))
                      .toList(),
                  onChanged: (val) => methodCtrl.text = val!,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: transCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Mã giao dịch (nếu có)',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: noteCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Ghi chú',
                    border: OutlineInputBorder(),
                  ),
                  maxLines: 2,
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('HỦY', style: TextStyle(color: Colors.grey)),
            ),
            if (PermissionHelper.canEdit('DEBTS'))
              ElevatedButton.icon(
                onPressed: () async {
                  final amount = double.tryParse(amountCtrl.text) ?? 0;
                  if (amount <= 0 || amount > (debt['soTienConLai'] ?? 0)) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Số tiền thanh toán không hợp lệ!'),
                        backgroundColor: Colors.red,
                      ),
                    );
                    return;
                  }

                  Navigator.pop(context);
                  setState(() => _isLoading = true);
                  try {
                    final payload = {
                      'maCongNo': debt['maCongNo'] ?? debt['id'],
                      'soTien': amount,
                      'pttt': methodCtrl.text,
                      'soGiaoDich': transCtrl.text,
                      'maNhanVien': 1,
                      'ghiChu': noteCtrl.text,
                    };

                    final res = await _apiService.recordDebtPayment(payload);
                    if (!mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          res.data['message'] ??
                              'Ghi nhận thanh toán thành công!',
                        ),
                        backgroundColor: Colors.green,
                      ),
                    );
                    _fetchDebtsData();
                  } catch (e) {
                    if (!mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Lỗi ghi nhận thanh toán: $e'),
                        backgroundColor: Colors.red,
                      ),
                    );
                    setState(() => _isLoading = false);
                  }
                },
                icon: const Icon(Icons.check),
                label: const Text('XÁC NHẬN'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  foregroundColor: Colors.white,
                ),
              ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final activeIndex = _tabController.index;
    List<dynamic> currentSource;
    if (activeIndex == 0)
      currentSource = _receivableDebts;
    else if (activeIndex == 1)
      currentSource = _payableDebts;
    else
      currentSource = _debtWarnings;

    final currentList = _getFilteredList(currentSource);

    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(76),
        child: AppBar(
          backgroundColor: Colors.red.shade800,
          elevation: 0,
          bottom: TabBar(
            controller: _tabController,
            indicatorColor: Colors.white,
            indicatorWeight: 3,
            labelColor: Colors.white,
            unselectedLabelColor: Colors.white70,
            labelStyle: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
            tabs: const [
              Tab(icon: Icon(Icons.arrow_downward), text: 'NỢ PHẢI THU'),
              Tab(icon: Icon(Icons.arrow_upward), text: 'NỢ PHẢI TRẢ'),
              Tab(icon: Icon(Icons.warning), text: 'CẢNH BÁO NỢ'),
            ],
          ),
        ),
      ),
      body: Column(
        children: [
          // Bảng Thống kê nhanh
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.red.shade800,
            child: Row(
              children: [
                Expanded(
                  child: _buildStatCard(
                    'Tổng Nợ Phải Thu',
                    _stats['tongNoPhaiThu'] ?? 0,
                    Colors.green,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildStatCard(
                    'Tổng Nợ Phải Trả',
                    _stats['tongNoPhaiTra'] ?? 0,
                    Colors.orange,
                  ),
                ),
              ],
            ),
          ),
          // Toolbar y như Web
          Card(
            margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            elevation: 2,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            child: Padding(
              padding: const EdgeInsets.all(12.0),
              child: Column(
                children: [
                  Row(
                    children: [
                      IconButton(
                        icon: Icon(
                          _isTableView ? Icons.grid_view : Icons.table_chart,
                          color: Colors.red.shade800,
                        ),
                        tooltip: _isTableView
                            ? 'Chuyển sang dạng Thẻ'
                            : 'Chuyển sang dạng Bảng',
                        onPressed: () =>
                            setState(() => _isTableView = !_isTableView),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.grey.shade300),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              value: _selectedStatus,
                              isExpanded: true,
                              icon: const Icon(Icons.filter_list, size: 18),
                              items: _statusList
                                  .map(
                                    (s) => DropdownMenuItem(
                                      value: s,
                                      child: Text(
                                        s,
                                        style: const TextStyle(fontSize: 12),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  )
                                  .toList(),
                              onChanged: (val) {
                                if (val != null)
                                  setState(() => _selectedStatus = val);
                              },
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton.icon(
                        onPressed: () async {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Đang xuất báo cáo Công Nợ...'),
                              backgroundColor: Colors.green,
                            ),
                          );
                          final baseUrl = SharedPreferencesService.getServerUrl() ?? '';
                          final type = activeIndex == 0 ? 'Phải thu' : (activeIndex == 1 ? 'Phải trả' : '');
                          final status = _selectedStatus == 'Tất cả' ? '' : _selectedStatus;
                          final url = '${baseUrl}debts/export?type=${Uri.encodeComponent(type)}&status=${Uri.encodeComponent(status)}';
                          final uri = Uri.parse(url);
                          if (await canLaunchUrl(uri)) {
                            await launchUrl(uri, mode: LaunchMode.externalApplication);
                          } else {
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Không thể tải file!'), backgroundColor: Colors.red),
                              );
                            }
                          }
                        },
                        icon: const Icon(Icons.download, size: 18),
                        label: const Text('Xuất'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green.shade700,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          decoration: InputDecoration(
                            hintText: 'Tìm kiếm nhanh mã công nợ, tên đối tác...',
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
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : currentList.isEmpty
                ? const Center(
                    child: Text(
                      'Không tìm thấy khoản công nợ nào phù hợp',
                      style: TextStyle(color: Colors.grey, fontSize: 16),
                    ),
                  )
                : _isTableView
                ? _buildTableView(currentList, activeIndex)
                : _buildCardView(currentList, activeIndex),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, num val, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 4),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(
              color: Colors.grey.shade700,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            NumberFormat.currency(locale: 'vi_VN', symbol: 'đ').format(val),
            style: TextStyle(
              color: color,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTableView(List<dynamic> list, int tabIndex) {
    final isPhaiThu = tabIndex == 0;
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: SingleChildScrollView(
          child: DataTable(
            headingRowColor: WidgetStateProperty.all(Colors.grey.shade100),
            columns: [
              const DataColumn(
                label: Text(
                  'Mã CN',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              DataColumn(
                label: Text(
                  isPhaiThu ? 'Khách Hàng' : 'Đối Tác',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              const DataColumn(
                label: Text(
                  'Hạn Thanh Toán',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              const DataColumn(
                label: Text(
                  'Tổng Nợ',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              const DataColumn(
                label: Text(
                  'Còn Lại',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              const DataColumn(
                label: Text(
                  'Trạng Thái',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              const DataColumn(
                label: Text(
                  'Tác Vụ',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ],
            rows: list.map((item) {
              final status = item['trangThai'] ?? 'Chưa thanh toán';
              final ma = item['maCN'] ?? item['maCongNo'];
              final ten =
                  item['tenKhachHang'] ??
                  item['tenNCC'] ??
                  item['tenDoiTac'] ??
                  'N/A';
              final han = item['hanThanhToan'];

              return DataRow(
                cells: [
                  DataCell(
                    TextButton(
                      onPressed: () => _showDetailDialog(item),
                      child: Text(
                        ma.toString(),
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.blue,
                        ),
                      ),
                    ),
                  ),
                  DataCell(Text(ten)),
                  DataCell(
                    Text(
                      han != null
                          ? DateFormat('dd/MM/yyyy').format(DateTime.parse(han))
                          : 'N/A',
                    ),
                  ),
                  DataCell(
                    Text(
                      NumberFormat.currency(
                        locale: 'vi_VN',
                        symbol: 'đ',
                      ).format(item['soTienNo'] ?? 0),
                    ),
                  ),
                  DataCell(
                    Text(
                      NumberFormat.currency(
                        locale: 'vi_VN',
                        symbol: 'đ',
                      ).format(item['soTienConLai'] ?? 0),
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Colors.red,
                      ),
                    ),
                  ),
                  DataCell(
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: _getStatusColor(status).withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        status,
                        style: TextStyle(
                          color: _getStatusColor(status),
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ),
                  DataCell(
                    IconButton(
                      icon: const Icon(Icons.payment, color: Colors.green),
                      tooltip: 'Thanh toán & Chi tiết',
                      onPressed: () => _showDetailDialog(item),
                    ),
                  ),
                ],
              );
            }).toList(),
          ),
        ),
      ),
    );
  }

  Widget _buildCardView(List<dynamic> list, int tabIndex) {
    final isPhaiThu = tabIndex == 0;
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      itemCount: list.length,
      itemBuilder: (context, index) {
        final item = list[index];
        final status = item['trangThai'] ?? 'Chưa thanh toán';
        final ma = item['maCN'] ?? item['maCongNo'];
        final ten =
            item['tenKhachHang'] ??
            item['tenNCC'] ??
            item['tenDoiTac'] ??
            'N/A';
        final han = item['hanThanhToan'];

        return Card(
          elevation: 2,
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          child: ListTile(
            contentPadding: const EdgeInsets.all(16),
            leading: CircleAvatar(
              backgroundColor: _getStatusColor(status).withValues(alpha: 0.1),
              child: Icon(
                Icons.account_balance_wallet,
                color: _getStatusColor(status),
              ),
            ),
            title: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  ma.toString(),
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: Colors.blue,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: _getStatusColor(status).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    status,
                    style: TextStyle(
                      color: _getStatusColor(status),
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 8),
                Text('${isPhaiThu ? "Khách hàng" : "Đối tác"}: $ten'),
                const SizedBox(height: 4),
                Text(
                  'Hạn thanh toán: ${han != null ? DateFormat('dd/MM/yyyy').format(DateTime.parse(han)) : "Không có"}',
                ),
                const SizedBox(height: 8),
                Text(
                  'Nợ còn lại: ${NumberFormat.currency(locale: 'vi_VN', symbol: 'đ').format(item['soTienConLai'] ?? 0)}',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.red.shade700,
                    fontSize: 15,
                  ),
                ),
              ],
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 16),
            onTap: () => _showDetailDialog(item),
          ),
        );
      },
    );
  }
}
