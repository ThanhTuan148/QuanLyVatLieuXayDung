import 'package:flutter/material.dart';
import '../../services/api_service.dart';

class ChatTab extends StatefulWidget {
  const ChatTab({super.key});

  @override
  State<ChatTab> createState() => _ChatTabState();
}

class _ChatTabState extends State<ChatTab> {
  final ApiService _apiService = ApiService();
  List<dynamic> _chats = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchChats();
  }

  Future<void> _fetchChats() async {
    try {
      final response = await _apiService.getChats();
      if (response.statusCode == 200 && response.data != null) {
        if (mounted) {
          setState(() {
            _chats = response.data is List ? response.data : [response.data];
            _isLoading = false;
            _error = null;
          });
        }
      } else {
        if (mounted) {
          setState(() {
            _error = 'Lỗi tải tin nhắn: ${response.statusCode}';
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Không thể kết nối Backend.\nĐang hiển thị dữ liệu mẫu.';
          _chats = [
            {"name": "Khách hàng Trần Văn Nam", "lastMsg": "Tôi muốn hỏi giá sỉ cho 2000 bao xi măng?", "time": "5 phút trước", "unread": true},
            {"name": "Khách hàng Lê Thị Hoa", "lastMsg": "Đơn hàng HD044 khi nào giao tới nơi?", "time": "30 phút trước", "unread": false},
            {"name": "Công ty XD An Phú", "lastMsg": "Cảm ơn công ty đã hỗ trợ nhiệt tình.", "time": "2 giờ trước", "unread": false},
          ];
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Hỗ trợ Khách hàng (${_chats.length})', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
              Chip(label: const Text('Trực tuyến', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)), backgroundColor: Colors.green.shade600),
            ],
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
            itemCount: _chats.length,
            itemBuilder: (context, index) {
              final chat = _chats[index];
              final name = chat['name'] ?? chat['customerName'] ?? chat['khachHang'] ?? 'Khách hàng';
              final lastMsg = chat['lastMsg'] ?? chat['lastMessage'] ?? chat['tinNhanCuoi'] ?? 'Tin nhắn mới';
              final time = chat['time'] ?? chat['timestamp'] ?? chat['thoiGian'] ?? 'Vừa xong';
              final unread = chat['unread'] ?? chat['isUnread'] ?? chat['chuaDoc'] ?? false;

              return Card(
                elevation: unread ? 3 : 1,
                margin: const EdgeInsets.only(bottom: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: ListTile(
                  contentPadding: const EdgeInsets.all(16),
                  leading: Stack(
                    children: [
                      CircleAvatar(backgroundColor: Theme.of(context).colorScheme.primary.withValues(alpha: 0.1), child: Icon(Icons.person, color: Theme.of(context).colorScheme.primary)),
                      if (unread)
                        Positioned(right: 0, top: 0, child: Container(width: 12, height: 12, decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle))),
                    ],
                  ),
                  title: Text(name.toString(), style: TextStyle(fontWeight: unread ? FontWeight.bold : FontWeight.normal, fontSize: 16)),
                  subtitle: Padding(padding: const EdgeInsets.only(top: 4.0), child: Text(lastMsg.toString(), maxLines: 1, overflow: TextOverflow.ellipsis)),
                  trailing: Text(time.toString(), style: const TextStyle(fontSize: 12, color: Colors.grey)),
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Mở khung chat với ${name}')));
                  },
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
