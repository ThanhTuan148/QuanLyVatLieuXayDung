import 'package:flutter/material.dart';

class ApprovalsTab extends StatefulWidget {
  const ApprovalsTab({super.key});

  @override
  State<ApprovalsTab> createState() => _ApprovalsTabState();
}

class _ApprovalsTabState extends State<ApprovalsTab> {
  // Mock Data cho danh sách chờ phê duyệt
  final List<Map<String, dynamic>> _pendingApprovals = [
    {
      "id": "PXK-089",
      "loai": "Phiếu Xuất Kho",
      "nguoiYeuCau": "Tuấn (Kho)",
      "lyDo": "Xuất hàng cho đơn HD044",
      "thoiGian": "10 phút trước",
    },
    {
      "id": "CN-102",
      "loai": "Công Nợ",
      "nguoiYeuCau": "Cty Xây Dựng ABC",
      "lyDo": "Xin gia hạn nợ 50.000.000đ thêm 15 ngày",
      "thoiGian": "1 giờ trước",
    },
    {
      "id": "PNK-042",
      "loai": "Phiếu Nhập Kho",
      "nguoiYeuCau": "Lan (Kho)",
      "lyDo": "Nhập 1000 bao Xi măng Hà Tiên",
      "thoiGian": "2 giờ trước",
    }
  ];

  void _approveItem(int index) {
    final item = _pendingApprovals[index];
    setState(() {
      _pendingApprovals.removeAt(index);
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Đã DUYỆT ${item['id']}'),
        backgroundColor: Colors.green,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _rejectItem(int index) {
    final item = _pendingApprovals[index];
    setState(() {
      _pendingApprovals.removeAt(index);
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Đã TỪ CHỐI ${item['id']}'),
        backgroundColor: Colors.red,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          width: double.infinity,
          color: Colors.purple.shade50,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Danh sách cần phê duyệt',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: Colors.purple.shade900,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Vuốt sang phải để Duyệt, vuốt sang trái để Từ chối',
                style: TextStyle(color: Colors.purple.shade400, fontSize: 13),
              ),
            ],
          ),
        ),
        Expanded(
          child: _pendingApprovals.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.done_all, size: 64, color: Colors.green.shade200),
                      const SizedBox(height: 16),
                      const Text('Tuyệt vời! Không còn chứng từ nào cần duyệt.', style: TextStyle(color: Colors.grey)),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _pendingApprovals.length,
                  itemBuilder: (context, index) {
                    final item = _pendingApprovals[index];

                    return Dismissible(
                      key: Key(item['id']),
                      background: Container(
                        decoration: BoxDecoration(
                          color: Colors.green,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        alignment: Alignment.centerLeft,
                        padding: const EdgeInsets.only(left: 20),
                        margin: const EdgeInsets.only(bottom: 12),
                        child: const Icon(Icons.check_circle, color: Colors.white, size: 32),
                      ),
                      secondaryBackground: Container(
                        decoration: BoxDecoration(
                          color: Colors.red,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        alignment: Alignment.centerRight,
                        padding: const EdgeInsets.only(right: 20),
                        margin: const EdgeInsets.only(bottom: 12),
                        child: const Icon(Icons.cancel, color: Colors.white, size: 32),
                      ),
                      onDismissed: (direction) {
                        if (direction == DismissDirection.startToEnd) {
                          _approveItem(index);
                        } else {
                          _rejectItem(index);
                        }
                      },
                      child: Card(
                        elevation: 2,
                        margin: const EdgeInsets.only(bottom: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        child: ListTile(
                          contentPadding: const EdgeInsets.all(16),
                          leading: CircleAvatar(
                            backgroundColor: Colors.purple.shade100,
                            child: Icon(
                              item['loai'].contains('Kho') ? Icons.inventory : Icons.monetization_on,
                              color: Colors.purple.shade700,
                            ),
                          ),
                          title: Text(
                            '${item['id']} - ${item['loai']}',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const SizedBox(height: 4),
                              Text('Yêu cầu bởi: ${item['nguoiYeuCau']}'),
                              Text('Nội dung: ${item['lyDo']}', style: const TextStyle(color: Colors.black87)),
                              const SizedBox(height: 4),
                              Text(item['thoiGian'], style: const TextStyle(fontSize: 12, color: Colors.grey)),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }
}
