import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';

class BackupRestoreTab extends StatefulWidget {
  const BackupRestoreTab({super.key});

  @override
  State<BackupRestoreTab> createState() => _BackupRestoreTabState();
}

class _BackupRestoreTabState extends State<BackupRestoreTab> {
  final ApiService _apiService = ApiService();
  bool _isBackingUp = false;
  bool _isRestoring = false;
  bool _isLoading = false;

  List<dynamic> _backups = [];

  @override
  void initState() {
    super.initState();
    _fetchBackups();
  }

  Future<void> _fetchBackups() async {
    if (!mounted) return;
    setState(() => _isLoading = true);
    try {
      final res = await _apiService.getBackupsList();
      if (!mounted) return;
      if (res.statusCode == 200 && res.data != null) {
        setState(() {
          _backups = List<dynamic>.from(res.data);
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Lỗi tải danh sách sao lưu: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _createNewBackup() async {
    setState(() => _isBackingUp = true);
    try {
      final res = await _apiService.createServerBackup();
      if (!mounted) return;
      if (res.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.white),
                const SizedBox(width: 8),
                Text(
                  res.data['message'] ??
                      'Tạo bản sao lưu dữ liệu mới thành công!',
                ),
              ],
            ),
            backgroundColor: Colors.green,
          ),
        );
        _fetchBackups();
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Lỗi khi tạo sao lưu: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) setState(() => _isBackingUp = false);
    }
  }

  void _restoreBackup(Map<String, dynamic> backup) async {
    final fileName = backup['fileName'] ?? backup['FileName'] ?? '';
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.warning, color: Colors.orange),
            SizedBox(width: 8),
            Text(
              'Xác nhận Phục hồi',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ],
        ),
        content: Text(
          'Bạn có chắc chắn muốn phục hồi hệ thống về phiên bản "$fileName"?\n\n'
          'Cảnh báo: Toàn bộ dữ liệu hiện tại sau thời điểm này sẽ bị ghi đè và thay thế hoàn toàn trên cả Web và App!',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('HỦY', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.orange.shade800,
            ),
            onPressed: () => Navigator.pop(context, true),
            child: const Text(
              'PHỤC HỒI NGAY',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
    );

    if (confirm == true) {
      setState(() => _isRestoring = true);
      try {
        final res = await _apiService.restoreServerBackup(fileName);
        if (!mounted) return;
        if (res.statusCode == 200) {
          showDialog(
            context: context,
            builder: (context) => AlertDialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              title: const Row(
                children: [
                  Icon(Icons.check_circle, color: Colors.green),
                  SizedBox(width: 8),
                  Text(
                    'Khôi Phục Thành Công',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              content: const Text(
                'Hệ thống đã phục hồi dữ liệu hoàn tất trên Server. Các thay đổi và cấu hình mới đã được áp dụng.',
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('OK'),
                ),
              ],
            ),
          );
          _fetchBackups();
        }
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi phục hồi dữ liệu: $e'),
            backgroundColor: Colors.red,
          ),
        );
      } finally {
        if (mounted) setState(() => _isRestoring = false);
      }
    }
  }

  void _deleteBackup(Map<String, dynamic> backup) async {
    final fileName = backup['fileName'] ?? backup['FileName'] ?? '';
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xác nhận xóa'),
        content: Text(
          'Bạn có chắc chắn muốn xóa bản sao lưu "$fileName" không?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('HỦY'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('XÓA', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      setState(() => _isLoading = true);
      try {
        final res = await _apiService.deleteServerBackup(fileName);
        if (!mounted) return;
        if (res.statusCode == 200) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Đã xóa bản sao lưu thành công!'),
              backgroundColor: Colors.green,
            ),
          );
          _fetchBackups();
        }
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi khi xóa bản sao lưu: $e'),
            backgroundColor: Colors.red,
          ),
        );
      } finally {
        if (mounted) setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        RefreshIndicator(
          onRefresh: _fetchBackups,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
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
                      colors: [
                        Colors.blueGrey.shade800,
                        Colors.blueGrey.shade900,
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.1),
                        blurRadius: 8,
                        offset: const Offset(0, 4),
                      ),
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
                            child: const Icon(
                              Icons.backup_outlined,
                              color: Colors.white,
                              size: 28,
                            ),
                          ),
                          const SizedBox(width: 12),
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Sao lưu & Phục hồi',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 20,
                                  ),
                                ),
                                SizedBox(height: 2),
                                Text(
                                  'Bảo mật và an toàn dữ liệu hệ thống trực tiếp trên Server',
                                  style: TextStyle(
                                    color: Colors.white70,
                                    fontSize: 13,
                                  ),
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
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Tạo Bản Sao Lưu Mới',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                            color: Colors.black87,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Tiến hành sao lưu toàn bộ cơ sở dữ liệu (CSDL) hệ thống SQL Server hiện tại của bạn.',
                          style: TextStyle(color: Colors.grey, fontSize: 13),
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
                                    child: CircularProgressIndicator(
                                      color: Colors.white,
                                      strokeWidth: 2,
                                    ),
                                  )
                                : const Icon(Icons.cloud_upload_outlined),
                            label: Text(
                              _isBackingUp
                                  ? 'ĐANG SAO LƯU DỮ LIỆU...'
                                  : 'TIẾN HÀNH SAO LƯU NGAY',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.blueGrey.shade700,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
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
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 10),

                _isLoading
                    ? const Center(
                        child: Padding(
                          padding: EdgeInsets.symmetric(vertical: 32),
                          child: CircularProgressIndicator(),
                        ),
                      )
                    : _backups.isEmpty
                    ? const Center(
                        child: Padding(
                          padding: EdgeInsets.symmetric(vertical: 32),
                          child: Text(
                            'Chưa có bản sao lưu nào được tạo trên server.',
                            style: TextStyle(color: Colors.grey),
                          ),
                        ),
                      )
                    : ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _backups.length,
                        itemBuilder: (context, index) {
                          final backup = _backups[index];
                          final fName =
                              backup['fileName'] ?? backup['FileName'] ?? '';
                          final fSize =
                              backup['fileSize'] ?? backup['FileSize'] ?? '—';
                          final rawCreated =
                              backup['createdAt'] ?? backup['CreatedAt'];
                          final DateTime dt = rawCreated != null
                              ? (rawCreated is DateTime
                                    ? rawCreated
                                    : DateTime.tryParse(
                                            rawCreated.toString(),
                                          ) ??
                                          DateTime.now())
                              : DateTime.now();
                          final dateStr = DateFormat(
                            'dd/MM/yyyy HH:mm:ss',
                          ).format(dt);

                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: ListTile(
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 8,
                              ),
                              leading: CircleAvatar(
                                backgroundColor: Colors.blue.withValues(
                                  alpha: 0.1,
                                ),
                                child: const Icon(
                                  Icons.dns,
                                  color: Colors.blue,
                                ),
                              ),
                              title: Text(
                                fName,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                ),
                              ),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const SizedBox(height: 4),
                                  Text('Dung lượng: $fSize'),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Ngày tạo: $dateStr',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey,
                                    ),
                                  ),
                                ],
                              ),
                              trailing: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  IconButton(
                                    icon: const Icon(
                                      Icons.settings_backup_restore,
                                      color: Colors.green,
                                    ),
                                    tooltip: 'Phục hồi dữ liệu',
                                    onPressed: () => _restoreBackup(backup),
                                  ),
                                  IconButton(
                                    icon: const Icon(
                                      Icons.delete_outline,
                                      color: Colors.red,
                                    ),
                                    tooltip: 'Xóa bản sao lưu',
                                    onPressed: () => _deleteBackup(backup),
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
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                          letterSpacing: 1.2,
                        ),
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
