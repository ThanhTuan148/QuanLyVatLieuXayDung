// lib/services/shared_preferences_service.dart
import 'package:shared_preferences/shared_preferences.dart';

class SharedPreferencesService {
  static late SharedPreferences _prefs;

  static Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  // Cấu hình Server URL linh hoạt
  static void setServerUrl(String url) {
    _prefs.setString('server_url', url);
  }

  static String getServerUrl() {
    // Mặc định lấy theo IP Wi-Fi hiện tại của bạn
    String url = _prefs.getString('server_url') ?? 'http://192.168.1.51:5000/api/';
    if (url.contains('192.168.1.43')) {
      url = url.replaceAll('192.168.1.43', '192.168.1.51');
      _prefs.setString('server_url', url);
    }
    if (!url.endsWith('/')) url += '/';
    return url;
  }

  static void setToken(String token) {
    _prefs.setString('token', token);
  }

  static String? getToken() {
    return _prefs.getString('token');
  }

  static void setUser(String userJson) {
    _prefs.setString('user', userJson);
  }

  static String? getUser() {
    return _prefs.getString('user');
  }

  static void clearAll() {
    _prefs.clear();
  }

  static void logout() {
    _prefs.remove('token');
    _prefs.remove('user');
  }

  /// Chuyển đổi relative path ảnh thành URL đầy đủ.
  /// VD: '/images/products/abc.jpg' → 'http://192.168.1.51:5000/images/products/abc.jpg'
  static String getImageUrl(String? relativePath) {
    if (relativePath == null || relativePath.isEmpty) return '';
    if (relativePath.startsWith('http')) return relativePath;
    // Lấy base URL server (bỏ phần '/api/')
    final serverUrl = getServerUrl().replaceAll(RegExp(r'/api/?$'), '');
    return '${serverUrl.endsWith('/') ? serverUrl.substring(0, serverUrl.length - 1) : serverUrl}$relativePath';
  }
}
