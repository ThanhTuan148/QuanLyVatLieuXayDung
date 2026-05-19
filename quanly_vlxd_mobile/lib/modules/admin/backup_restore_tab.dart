import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class BackupRestoreTab extends StatefulWidget {
  const BackupRestoreTab({super.key});

  @override
  State<BackupRestoreTab> createState() => _BackupRestoreTabState();
}

class _BackupRestoreTabState extends State<BackupRestoreTab> {
  bool _isBackingUp = false;
  bool _isRestoring = false;
  String _backupType = 'Full'; // 'Full', 'Config', 'Logs'

  // Mock list of backups
  final List<Map<String, dynamic>> _backups = [
    {
      'fileName': 'vlxd_backup_full_20260519_080000.bak',
      'type': 'Full',
      'size': '248.5 MB',
      'createdAt': DateTime.now().subtract(const Duration(hours: 4)),
      'status': 'Thành công',
    },
    {
      'fileName': 'vlxd_backup_config_20260518_170000.bak',
      'type': 'Config',
      'size': '12.4 MB',
      'createdAt': DateTime.now().subtract(const Duration(days: 1)),
      'status': 'Thành công',
    },
    {
      'fileName': 'vlxd_backup_full_20260515_000100.bak',
      'type': 'Full',
      'size': '245.2 MB',
      'createdAt': DateTime.now().subtract(const Duration(days: 4)),
      'status': 'Thành công',
    },
  ];

  void _createNewBackup() async {
    setState(() => _isBackingUp = true);

    // Simulate database backup operation
    await Future.delayed(const Duration(seconds: 3));

    if (!mounted) return;

    final String typeStr = _backupType == 'Full' ? 'full' : (_backupType == 'Config' ? 'config' : 'logs');
    final String sizeStr = _backupType == 'Full' ? '250.1 MB' : (_backupType == 'Config' ? '12.6 MB' : '4.2 MB');

    setState(() {
      _backups.insert(0, {
        'fileName': 'vlxd_backup_${typeStr}_${DateFormat('yyyyMMdd_HHmmss').format(DateTime.now())}.bak',
        'type': _backupType,
        'size': sizeStr,
        'createdAt': DateTime.now(),
        'status': 'Thành công',
      });
      _isBackingUp = false;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Row(
          children: [
            Icon(Icons.check_circle, color: Colors.white),
            SizedBox(width: 8),
            Text('Tạo bản sao lưu dữ liệu mới thành công!'),
          ],
        ),
        backgroundColor: Colors.green,
      ),
    );
  }

  void _restoreBackup(Map<String, dynamic> backup) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.warning, color: Colors.orange),
            SizedBox(width: 8),
            Text('Xác nhận Phục hồi', style: TextStyle(fontWeight: FontWeight.bold)),
          ],
        ),
        content: Text(
          'Bạn có chắc chắn muốn phục hồi hệ thống về phiên bản "${backup['fileName']}"?\n\n'
          'Cảnh báo: Toàn bộ dữ liệu hiện tại sau thời điểm này sẽ bị ghi đè và thay thế hoàn toàn!',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('HỦY', style: TextStyle(color: Colors.grey))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.orange.shade800),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('PHỤC HỒI NGAY', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      setState(() => _isRestoring = true);

      // Simulate recovery progress
      await Future.delayed(const Duration(seconds: 4));

      if (!mounted) return;
      setState(() => _isRestoring = false);

      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Row(
            children: [
              Icon(Icons.check_circle, color: Colors.green),
              SizedBox(width: 8),
              Text('Khôi Phục Thành Công', style: TextStyle(fontWeight: FontWeight.bold)),
            ],
          ),
          content: const Text('Hệ thống đã phục hồi dữ liệu hoàn tất. Các thay đổi và cấu hình mới đã được áp dụng.'),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('OK')),
          ],
        ),
      );
    }
  }

  void _deleteBackup(int index) {
    setState(() {
      _backups.removeAt(index);
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Đã xóa bản sao lưu!'), backgroundColor: Colors.red),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.blueGrey.shade800, Colors.blueGrey.shade900],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 8, offset: const Offset(0, 4)),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.white24,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.backup_outlined, color: Colors.white, size: 28),
                        ),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Sao lưu & Phục hồi',
                                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20),
                              ),
                              SizedBox(height: 2),
                              Text(
                                'Bảo mật và an toàn dữ liệu hệ thống',
                                style: TextStyle(color: Colors.white70, fontSize: 13),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Create Backup Section
              Card(
                elevation: 2,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Tạo Bản Sao Lưu Mới',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.black87),
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'Chọn loại dữ liệu cần sao lưu trữ:',
                        style: TextStyle(color: Colors.grey, fontSize: 13),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: ChoiceChip(
                              label: const Center(child: Text('Toàn bộ CSDL')),
                              selected: _backupType == 'Full',
                              selectedColor: Colors.blueGrey.shade100,
                              onSelected: (val) {
                                if (val) setState(() => _backupType = 'Full');
                              },
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: ChoiceChip(
                              label: const Center(child: Text('Cấu hình')),
                              selected: _backupType == 'Config',
                              selectedColor: Colors.blueGrey.shade100,
                              onSelected: (val) {
                                if (val) setState(() => _backupType = 'Config');
                              },
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: ChoiceChip(
                              label: const Center(child: Text('Nhật ký')),
                              selected: _backupType == 'Logs',
                              selectedColor: Colors.blueGrey.shade100,
                              onSelected: (val) {
                                if (val) setState(() => _backupType = 'Logs');
                              },
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: _isBackingUp ? null : _createNewBackup,
                          icon: _isBackingUp
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                )
                              : const Icon(Icons.cloud_upload_outlined),
                          label: Text(
                            _isBackingUp ? 'ĐANG SAO LƯU DỮ LIỆU...' : 'TIẾN HÀNH SAO LƯU NGAY',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.blueGrey.shade700,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Backup List Section
              const Text(
                'Lịch Sử Bản Sao Lưu Gần Đây',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.black87),
              ),
              const SizedBox(height: 10),

              _backups.isEmpty
                  ? const Center(
                      child: Padding(
                        padding: EdgeInsets.symmetric(vertical: 32),
                        child: Text('Chưa có bản sao lưu nào được tạo.', style: TextStyle(color: Colors.grey)),
                      ),
                    )
                  : ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _backups.length,
                      itemBuilder: (context, index) {
                        final backup = _backups[index];
                        final type = backup['type'];
                        final dateStr = DateFormat('dd/MM/yyyy HH:mm:ss').format(backup['createdAt']);

                        IconData typeIcon = Icons.dns;
                        Color typeColor = Colors.blue;
                        if (type == 'Config') {
                          typeIcon = Icons.settings;
                          typeColor = Colors.orange;
                        } else if (type == 'Logs') {
                          typeIcon = Icons.receipt_long;
                          typeColor = Colors.purple;
                        }

                        return Card(
                          margin: const EdgeInsets.only(bottom: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          child: ListTile(
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            leading: CircleAvatar(
                              backgroundColor: typeColor.withValues(alpha: 0.1),
                              child: Icon(typeIcon, color: typeColor),
                            ),
                            title: Text(
                              backup['fileName'],
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const SizedBox(height: 4),
                                Text('Loại: $type | Dung lượng: ${backup['size']}'),
                                const SizedBox(height: 2),
                                Text('Ngày tạo: $dateStr', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                              ],
                            ),
                            trailing: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                IconButton(
                                  icon: const Icon(Icons.settings_backup_restore, color: Colors.green),
                                  tooltip: 'Phục hồi dữ liệu',
                                  onPressed: () => _restoreBackup(backup),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.delete_outline, color: Colors.red),
                                  tooltip: 'Xóa bản sao lưu',
                                  onPressed: () => _deleteBackup(index),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ],
          ),
        ),

        // Fullscreen Restoring Overlay
        if (_isRestoring)
          Container(
            color: Colors.black54,
            child: const Center(
              child: Card(
                margin: EdgeInsets.all(32),
                child: Padding(
                  padding: EdgeInsets.symmetric(horizontal: 32, vertical: 40),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      CircularProgressIndicator(strokeWidth: 4),
                      SizedBox(height: 24),
                      Text(
                        'ĐANG KHÔI PHỤC HỆ THỐNG...',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, letterSpacing: 1.2),
                      ),
                      SizedBox(height: 8),
                      Text(
                        'Vui lòng không tắt ứng dụng hoặc ngắt kết nối.',
                        style: TextStyle(color: Colors.grey, fontSize: 13),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}
