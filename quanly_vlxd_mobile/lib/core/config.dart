class AppConfig {
  // Thay đổi IP này thành IPv4 của máy tính trong mạng LAN (ví dụ: 192.168.1.5)
  // Nếu dùng Android Emulator thì giữ nguyên 10.0.2.2 (ánh xạ tới localhost của máy tính)
  static const String baseUrl = 'http://192.168.1.51:5000/api';
  static const String imageUrl = 'http://192.168.1.51:5000';
}
