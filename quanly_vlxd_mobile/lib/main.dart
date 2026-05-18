import 'package:flutter/material.dart';

import 'services/shared_preferences_service.dart';
import 'modules/auth/login_screen.dart';
import 'modules/sales/sales_home_screen.dart';
import 'modules/driver/driver_home_screen.dart';
import 'modules/warehouse/warehouse_home_screen.dart';
import 'modules/manager/manager_home_screen.dart';
import 'modules/admin/admin_home_screen.dart';

void main() async {
  // Khởi tạo binding và SharedPreferences trước khi chạy app
  WidgetsFlutterBinding.ensureInitialized();
  await SharedPreferencesService.init();
  
  runApp(const BuildingMaterialApp());
}

class BuildingMaterialApp extends StatelessWidget {
  const BuildingMaterialApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Vật Liệu Xây Dựng ERP',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF1976D2), // Blue primary color matching Web
          primary: const Color(0xFF1976D2),
          secondary: const Color(0xFFF57C00),
        ),
        useMaterial3: true,
        appBarTheme: const AppBarTheme(
          centerTitle: true,
          elevation: 0,
          backgroundColor: Color(0xFF1976D2),
          foregroundColor: Colors.white,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF1976D2),
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        ),
      ),
      initialRoute: '/login',
      routes: {
        '/login': (context) => const LoginScreen(),
        '/sales/home': (context) => const SalesHomeScreen(),
        '/driver/home': (context) => const DriverHomeScreen(),
        '/warehouse/home': (context) => const WarehouseHomeScreen(),
        '/manager/home': (context) => const ManagerHomeScreen(),
        '/admin/home': (context) => const AdminHomeScreen(),
      },
    );
  }
}
