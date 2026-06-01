import 'package:flutter/material.dart';

import 'core/app_theme.dart';
import 'services/shared_preferences_service.dart';
import 'services/push_notification_service.dart';
import 'modules/auth/login_screen.dart';
import 'modules/home/main_dynamic_home_screen.dart';

void main() async {
  // Khởi tạo binding và SharedPreferences trước khi chạy app
  WidgetsFlutterBinding.ensureInitialized();
  await SharedPreferencesService.init();

  // Khởi tạo dịch vụ thông báo (Push Notifications)
  await PushNotificationService().init();

  runApp(const BuildingMaterialApp
    ());
}

class BuildingMaterialApp extends StatelessWidget {
  const BuildingMaterialApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Vật Liệu Xây Dựng ERP',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      initialRoute: '/login',
      routes: {
        '/login': (context) => const LoginScreen(),
        '/sales/home': (context) => const MainDynamicHomeScreen(),
        '/driver/home': (context) => const MainDynamicHomeScreen(),
        '/warehouse/home': (context) => const MainDynamicHomeScreen(),
        '/manager/home': (context) => const MainDynamicHomeScreen(),
        '/admin/home': (context) => const MainDynamicHomeScreen(),
      },
    );
  }
}
