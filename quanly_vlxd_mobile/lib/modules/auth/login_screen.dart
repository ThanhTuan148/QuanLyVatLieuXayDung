import 'dart:convert';
import 'package:flutter/material.dart';
import '../../core/app_theme.dart';
import '../../services/api_service.dart';
import '../../services/shared_preferences_service.dart';
import '../../services/push_notification_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  final ApiService _apiService = ApiService();
  bool _isLoading = false;
  bool _isScanning = false;
  bool _obscurePassword = true;
  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeOut,
    );
    _fadeController.forward();
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  // Tính năng quét tự động IP Backend trong mạng LAN
  void _autoDiscoverIP() async {
    setState(() => _isScanning = true);

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Đang quét mạng LAN tìm máy chủ Backend...'),
        duration: Duration(seconds: 1),
      ),
    );

    final foundUrl = await _apiService.autoDiscoverServerIP();

    if (!mounted) return;
    setState(() => _isScanning = false);

    if (foundUrl != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Đã tìm thấy & kết nối tự động tới: $foundUrl'),
          backgroundColor: AppColors.success,
          duration: const Duration(seconds: 3),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text(
            'Không tìm thấy Backend. Vui lòng kiểm tra lại mạng Wi-Fi hoặc nhập bằng tay.',
          ),
          backgroundColor: AppColors.warning,
        ),
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
          title: const Text(
            'Cấu Hình Máy Chủ',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Nhập địa chỉ IP và Port Backend .NET 8 của bạn:',
                style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: urlController,
                decoration: InputDecoration(
                  labelText: 'Server Base URL',
                  hintText: 'http://192.168.1.6:5213/api',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  prefixIcon: const Icon(Icons.link),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text(
                'HỦY',
                style: TextStyle(color: AppColors.textSecondary),
              ),
            ),
            ElevatedButton(
              onPressed: () {
                final newUrl = urlController.text.trim();
                if (newUrl.isNotEmpty) {
                  SharedPreferencesService.setServerUrl(newUrl);
                  _apiService.updateBaseUrl(newUrl);
                  Navigator.of(context).pop();
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Đã cập nhật Server IP: $newUrl'),
                      backgroundColor: AppColors.success,
                    ),
                  );
                }
              },
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
        
        // Khởi tạo lại dịch vụ thông báo (cập nhật userId và kết nối Hub mới)
        PushNotificationService().init();

        // 1. Quét toàn diện các key phân quyền từ Backend .NET
        final rawRole =
            userObj['role'] ??
            userObj['Role'] ??
            userObj['roleName'] ??
            userObj['RoleName'] ??
            userObj['role_name'] ??
            userObj['quyen'] ??
            userObj['Quyen'] ??
            userObj['chucVu'] ??
            userObj['roleId'] ??
            '';
        final roleStr = rawRole.toString().toLowerCase();
        final userLower = username.toLowerCase();

        // 2. Phân quyền Kép: Kết hợp Role từ Backend VÀ từ khóa trong Username
        if (roleStr.contains('admin') ||
            roleStr.contains('quản trị') ||
            userLower.contains('admin')) {
          role = 'Admin';
        } else if (roleStr.contains('manager') ||
            roleStr.contains('quản lý') ||
            roleStr.contains('giám đốc') ||
            userLower.contains('quanly') ||
            userLower.contains('manager')) {
          role = 'QuanLy';
        } else if (roleStr.contains('kho') || userLower.contains('kho')) {
          role = 'NhanVienKho';
        } else if (roleStr.contains('taixe') ||
            roleStr.contains('driver') ||
            roleStr.contains('tài xế') ||
            userLower.contains('taixe') ||
            userLower.contains('driver')) {
          role = 'TaiXe';
        } else {
          role = 'NhanVienBanHang';
        }
      } else {
        if (!mounted) return;
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Tài khoản hoặc mật khẩu không chính xác.'),
            backgroundColor: Colors.red,
            duration: Duration(seconds: 3),
          ),
        );
        return;
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      
      String errorMessage = 'Lỗi kết nối mạng hoặc máy chủ không phản hồi.';
      final eStr = e.toString();
      if (eStr.contains('401') || eStr.contains('400') || eStr.contains('404')) {
        errorMessage = 'Tài khoản hoặc mật khẩu không chính xác.';
      }
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(errorMessage),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 3),
        ),
      );
      return;
    }

    if (!mounted) return;
    setState(() => _isLoading = false);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Đăng nhập thành công! Vai trò: $role'),
        backgroundColor: AppColors.success,
        duration: const Duration(seconds: 2),
      ),
    );

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
        decoration: const BoxDecoration(gradient: AppColors.primaryGradient),
        child: SafeArea(
          child: Stack(
            children: [
              // Decorative circles
              Positioned(
                top: -60,
                right: -60,
                child: Container(
                  width: 200,
                  height: 200,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withValues(alpha: 0.06),
                  ),
                ),
              ),
              Positioned(
                bottom: -80,
                left: -80,
                child: Container(
                  width: 260,
                  height: 260,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withValues(alpha: 0.04),
                  ),
                ),
              ),
              Positioned(
                top: 120,
                left: -40,
                child: Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withValues(alpha: 0.05),
                  ),
                ),
              ),

              // Cụm nút Quét tự động & Cấu hình ở góc trên bên phải
              Positioned(
                top: 12,
                right: 12,
                child: Row(
                  children: [
                    // Nút Quét Tự Động IP Backend
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: TextButton.icon(
                        onPressed: _isScanning ? null : _autoDiscoverIP,
                        icon: _isScanning
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Icon(
                                Icons.wifi_find,
                                color: Colors.white,
                                size: 18,
                              ),
                        label: Text(
                          _isScanning ? 'Đang quét...' : 'Quét IP',
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    // Nút Cấu hình bằng tay
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                      ),
                      child: IconButton(
                        icon: const Icon(
                          Icons.settings_suggest,
                          color: Colors.white,
                          size: 22,
                        ),
                        tooltip: 'Cấu hình IP bằng tay',
                        onPressed: _showServerConfigDialog,
                      ),
                    ),
                  ],
                ),
              ),

              Center(
                child: FadeTransition(
                  opacity: _fadeAnimation,
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 28),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const SizedBox(height: 40),
                        // Logo & App Name
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white.withValues(alpha: 0.15),
                          ),
                          child: const Icon(
                            Icons.apartment_rounded,
                            size: 56,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 20),
                        const Text(
                          'Quản Lý Vật Liệu\nXây Dựng',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 24,
                            color: Colors.white,
                            letterSpacing: 0.5,
                            height: 1.3,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Hệ thống quản lý doanh nghiệp',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.white.withValues(alpha: 0.75),
                            fontWeight: FontWeight.w400,
                          ),
                        ),
                        const SizedBox(height: 40),

                        // Login Card
                        Container(
                          padding: const EdgeInsets.all(28),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.08),
                                blurRadius: 30,
                                offset: const Offset(0, 10),
                              ),
                            ],
                          ),
                          child: Form(
                            key: _formKey,
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Đăng nhập',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 22,
                                    color: AppColors.textPrimary,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                const Text(
                                  'Nhập thông tin tài khoản để tiếp tục',
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                                const SizedBox(height: 24),
                                TextFormField(
                                  controller: _usernameController,
                                  decoration: InputDecoration(
                                    labelText: 'Tên đăng nhập',
                                    prefixIcon: Icon(
                                      Icons.person_outline,
                                      color: AppColors.primaryStart.withValues(
                                        alpha: 0.7,
                                      ),
                                    ),
                                  ),
                                  validator: (value) =>
                                      (value == null || value.isEmpty)
                                      ? 'Vui lòng nhập tên đăng nhập'
                                      : null,
                                ),
                                const SizedBox(height: 16),
                                TextFormField(
                                  controller: _passwordController,
                                  obscureText: _obscurePassword,
                                  decoration: InputDecoration(
                                    labelText: 'Mật khẩu',
                                    prefixIcon: Icon(
                                      Icons.lock_outline,
                                      color: AppColors.primaryStart.withValues(
                                        alpha: 0.7,
                                      ),
                                    ),
                                    suffixIcon: IconButton(
                                      icon: Icon(
                                        _obscurePassword
                                            ? Icons.visibility_off_outlined
                                            : Icons.visibility_outlined,
                                        color: AppColors.textHint,
                                      ),
                                      onPressed: () => setState(
                                        () => _obscurePassword =
                                            !_obscurePassword,
                                      ),
                                    ),
                                  ),
                                  validator: (value) =>
                                      (value == null || value.isEmpty)
                                      ? 'Vui lòng nhập mật khẩu'
                                      : null,
                                ),
                                const SizedBox(height: 28),
                                SizedBox(
                                  width: double.infinity,
                                  height: 52,
                                  child: ElevatedButton(
                                    onPressed: _isLoading ? null : _login,
                                    style:
                                        ElevatedButton.styleFrom(
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(
                                              14,
                                            ),
                                          ),
                                          elevation: 0,
                                        ).copyWith(
                                          backgroundColor:
                                              WidgetStateProperty.resolveWith((
                                                s,
                                              ) {
                                                if (s.contains(
                                                  WidgetState.disabled,
                                                ))
                                                  return AppColors.primaryStart
                                                      .withValues(alpha: 0.6);
                                                return null;
                                              }),
                                        ),
                                    child: _isLoading
                                        ? const SizedBox(
                                            height: 22,
                                            width: 22,
                                            child: CircularProgressIndicator(
                                              color: Colors.white,
                                              strokeWidth: 2.5,
                                            ),
                                          )
                                        : const Text(
                                            'ĐĂNG NHẬP',
                                            style: TextStyle(
                                              fontSize: 16,
                                              fontWeight: FontWeight.w700,
                                              letterSpacing: 0.5,
                                            ),
                                          ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 40),
                      ],
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
}
