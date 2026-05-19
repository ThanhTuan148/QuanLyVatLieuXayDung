import 'dart:convert';
import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../services/shared_preferences_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  final ApiService _apiService = ApiService();
  bool _isLoading = false;
  bool _isScanning = false;
  bool _obscurePassword = true;

  // Tính năng quét tự động IP Backend trong mạng LAN
  void _autoDiscoverIP() async {
    setState(() => _isScanning = true);

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Đang quét mạng LAN tìm máy chủ Backend...'), duration: Duration(seconds: 1)),
    );

    final foundUrl = await _apiService.autoDiscoverServerIP();

    if (!mounted) return;
    setState(() => _isScanning = false);

    if (foundUrl != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Đã tìm thấy & kết nối tự động tới: $foundUrl'), backgroundColor: Colors.green, duration: const Duration(seconds: 3)),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: const Text('Không tìm thấy Backend. Vui lòng kiểm tra lại mạng Wi-Fi hoặc nhập bằng tay.'), backgroundColor: Colors.orange.shade800),
      );
    }
  }

  // Mở hộp thoại cấu hình địa chỉ IP máy chủ Backend bằng tay
  void _showServerConfigDialog() {
    final TextEditingController urlController = TextEditingController(
      text: SharedPreferencesService.getServerUrl(),
    );

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Cấu Hình Máy Chủ (Server IP)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Nhập địa chỉ IP và Port Backend .NET 8 của bạn (Ví dụ khi đổi mạng Wi-Fi):', style: TextStyle(fontSize: 13, color: Colors.grey)),
              const SizedBox(height: 16),
              TextField(
                controller: urlController,
                decoration: InputDecoration(
                  labelText: 'Server Base URL',
                  hintText: 'http://192.168.1.6:5213/api',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                  prefixIcon: const Icon(Icons.link),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('HỦY', style: TextStyle(color: Colors.grey)),
            ),
            ElevatedButton(
              onPressed: () {
                final newUrl = urlController.text.trim();
                if (newUrl.isNotEmpty) {
                  SharedPreferencesService.setServerUrl(newUrl);
                  _apiService.updateBaseUrl(newUrl);
                  Navigator.of(context).pop();
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Đã cập nhật Server IP: $newUrl'), backgroundColor: Colors.green),
                  );
                }
              },
              style: ElevatedButton.styleFrom(backgroundColor: Theme.of(context).colorScheme.primary, foregroundColor: Colors.white),
              child: const Text('LƯU'),
            ),
          ],
        );
      },
    );
  }

  void _login() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final username = _usernameController.text.trim();
    final password = _passwordController.text;
    String role = 'NhanVienBanHang'; // Mặc định
    bool isOfflineMode = false;

    try {
      final response = await _apiService.login(username, password);

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data;
        final token = data['token'] ?? '';
        final userObj = data['user'] ?? data['User'] ?? data ?? {};

        if (token.isNotEmpty) {
          SharedPreferencesService.setToken(token);
        }
        SharedPreferencesService.setUser(jsonEncode(userObj));


        // 1. Quét toàn diện các key phân quyền từ Backend .NET
        final rawRole = userObj['role'] ?? userObj['Role'] ?? userObj['roleName'] ?? userObj['RoleName'] ?? userObj['role_name'] ?? userObj['quyen'] ?? userObj['Quyen'] ?? userObj['chucVu'] ?? userObj['roleId'] ?? '';
        final roleStr = rawRole.toString().toLowerCase();
        final userLower = username.toLowerCase();

        // 2. Phân quyền Kép: Kết hợp Role từ Backend VÀ từ khóa trong Username
        if (roleStr.contains('admin') || roleStr.contains('quản trị') || userLower.contains('admin')) {
          role = 'Admin';
        } else if (roleStr.contains('manager') || roleStr.contains('quản lý') || roleStr.contains('giám đốc') || userLower.contains('quanly') || userLower.contains('manager')) {
          role = 'QuanLy';
        } else if (roleStr.contains('kho') || userLower.contains('kho')) {
          role = 'NhanVienKho';
        } else if (roleStr.contains('taixe') || roleStr.contains('driver') || roleStr.contains('tài xế') || userLower.contains('taixe') || userLower.contains('driver')) {
          role = 'TaiXe';
        } else {
          role = 'NhanVienBanHang';
        }
      }
    } catch (e) {
      isOfflineMode = true;
      final userLower = username.toLowerCase();

      if (userLower.contains('admin')) {
        role = 'Admin';
      } else if (userLower.contains('quanly') || userLower.contains('manager')) {
        role = 'QuanLy';
      } else if (userLower.contains('kho')) {
        role = 'NhanVienKho';
      } else if (userLower.contains('taixe') || userLower.contains('driver')) {
        role = 'TaiXe';
      } else {
        role = 'NhanVienBanHang';
      }
    }

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (isOfflineMode) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Không kết nối được Server. Đang đăng nhập Offline với vai trò: $role'),
          backgroundColor: Colors.orange.shade800,
          duration: const Duration(seconds: 3),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Đăng nhập thành công! Vai trò: $role'),
          backgroundColor: Colors.green.shade700,
          duration: const Duration(seconds: 2),
        ),
      );
    }

    switch (role) {
      case 'Admin':
        Navigator.of(context).pushReplacementNamed('/admin/home');
        break;
      case 'QuanLy':
        Navigator.of(context).pushReplacementNamed('/manager/home');
        break;
      case 'NhanVienKho':
        Navigator.of(context).pushReplacementNamed('/warehouse/home');
        break;
      case 'TaiXe':
        Navigator.of(context).pushReplacementNamed('/driver/home');
        break;
      case 'NhanVienBanHang':
      default:
        Navigator.of(context).pushReplacementNamed('/sales/home');
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFFE3F2FD), Color(0xFFBBDEFB)],
          ),
        ),
        child: SafeArea(
          child: Stack(
            children: [
              // Cụm nút Quét tự động & Cấu hình ở góc trên bên phải
              Positioned(
                top: 16,
                right: 16,
                child: Row(
                  children: [
                    // Nút Quét Tự Động IP Backend
                    Container(
                      decoration: BoxDecoration(color: Colors.white.withOpacity(0.9), borderRadius: BorderRadius.circular(20), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4, spreadRadius: 1)]),
                      child: TextButton.icon(
                        onPressed: _isScanning ? null : _autoDiscoverIP,
                        icon: _isScanning
                            ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                            : const Icon(Icons.wifi_find, color: Colors.green),
                        label: Text(_isScanning ? 'Đang quét...' : 'Quét IP', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.green)),
                      ),
                    ),
                    const SizedBox(width: 8),
                    // Nút Cấu hình bằng tay
                    Container(
                      decoration: BoxDecoration(color: Colors.white.withOpacity(0.9), shape: BoxShape.circle, boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4, spreadRadius: 1)]),
                      child: IconButton(
                        icon: const Icon(Icons.settings_suggest, color: Colors.blue, size: 26),
                        tooltip: 'Cấu hình IP bằng tay',
                        onPressed: _showServerConfigDialog,
                      ),
                    ),
                  ],
                ),
              ),
              Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(24.0),
                  child: Card(
                    elevation: 8,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    child: Padding(
                      padding: const EdgeInsets.all(32.0),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.apartment_rounded, size: 64, color: Theme.of(context).colorScheme.primary),
                            const SizedBox(height: 16),
                            Text(
                              'Quản Lý Vật Liệu\nXây Dựng',
                              textAlign: TextAlign.center,
                              style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold, color: Colors.black87),
                            ),
                            const SizedBox(height: 32),
                            TextFormField(
                              controller: _usernameController,
                              decoration: InputDecoration(
                                labelText: 'Tên đăng nhập',
                                prefixIcon: const Icon(Icons.person_outline),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              validator: (value) => (value == null || value.isEmpty) ? 'Vui lòng nhập tên đăng nhập' : null,
                            ),
                            const SizedBox(height: 16),
                            TextFormField(
                              controller: _passwordController,
                              obscureText: _obscurePassword,
                              decoration: InputDecoration(
                                labelText: 'Mật khẩu',
                                prefixIcon: const Icon(Icons.lock_outline),
                                suffixIcon: IconButton(
                                  icon: Icon(_obscurePassword ? Icons.visibility_off : Icons.visibility),
                                  onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                                ),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              validator: (value) => (value == null || value.isEmpty) ? 'Vui lòng nhập mật khẩu' : null,
                            ),
                            const SizedBox(height: 24),
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: _isLoading ? null : _login,
                                child: _isLoading
                                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                    : const Text('ĐĂNG NHẬP', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}
