import 'dart:convert';
import '../services/shared_preferences_service.dart';

class PermissionHelper {
  static Map<String, dynamic> _getModulePerms(String module) {
    try {
      final userStr = SharedPreferencesService.getUser();
      if (userStr == null || userStr.isEmpty) return _getDefaultPerms(module);
      final userObj = jsonDecode(userStr);
      final perms =
          userObj['modulePermissions'] ?? userObj['ModulePermissions'];

      if (perms != null) {
        final Map<String, dynamic> permsMap = Map<String, dynamic>.from(perms);

        // Find matching key case-insensitively
        final matchingKey = permsMap.keys.firstWhere(
          (k) => k.toLowerCase() == module.toLowerCase(),
          orElse: () => '',
        );

        if (matchingKey.isNotEmpty) {
          return permsMap[matchingKey] as Map<String, dynamic>;
        }
      }
      return _getDefaultPerms(module);
    } catch (_) {
      return _getDefaultPerms(module);
    }
  }

  static Map<String, dynamic> _getDefaultPerms(String module) {
    try {
      final userStr = SharedPreferencesService.getUser();
      String role = 'nhân viên';
      if (userStr != null && userStr.isNotEmpty) {
        final userObj = jsonDecode(userStr);
        role =
            (userObj['roleName'] ??
                    userObj['RoleName'] ??
                    userObj['role'] ??
                    'nhân viên')
                .toString()
                .toLowerCase();
      }

      final String m = module.toLowerCase();
      final defaultMap = <String, Map<String, dynamic>>{};

      if (role.contains('admin') || role.contains('quản trị')) {
        const allModules = [
          'dashboard',
          'products',
          'categories',
          'inventory',
          'inventory_gift',
          'inventory_history',
          'procurement',
          'returns',
          'returns_customer',
          'orders',
          'customers',
          'suppliers',
          'promotions',
          'flashsales',
          'deliveries',
          'reports',
          'settings',
          'employees',
          'price_history',
          'contact',
          'chat',
          'stock_orders',
        ];
        for (var mod in allModules) {
          defaultMap[mod] = {
            'coTheXem': true,
            'coTheTao': true,
            'coTheSua': true,
            'coTheXoa': true,
          };
        }
        defaultMap['debts'] = {
          'coTheXem': false,
          'coTheTao': false,
          'coTheSua': false,
          'coTheXoa': false,
        };
      } else if (role.contains('giám đốc') ||
          role.contains('quản lý') ||
          role.contains('kế toán') ||
          role.contains('accountant')) {
        const allModules = [
          'dashboard',
          'products',
          'categories',
          'inventory',
          'inventory_gift',
          'inventory_history',
          'procurement',
          'returns',
          'returns_customer',
          'orders',
          'customers',
          'suppliers',
          'promotions',
          'flashsales',
          'deliveries',
          'debts',
          'reports',
          'settings',
          'employees',
          'price_history',
          'contact',
          'chat',
          'stock_orders',
        ];
        for (var mod in allModules) {
          defaultMap[mod] = {
            'coTheXem': true,
            'coTheTao': true,
            'coTheSua': true,
            'coTheXoa': true,
          };
        }
      } else if (role.contains('tài xế') || role.contains('driver')) {
        defaultMap['deliveries'] = {
          'coTheXem': true,
          'coTheTao': false,
          'coTheSua': false,
          'coTheXoa': false,
        };
      } else if (role.contains('bán hàng') || role.contains('sales')) {
        for (var mod in ['products', 'orders', 'customers', 'promotions']) {
          defaultMap[mod] = {
            'coTheXem': true,
            'coTheTao': true,
            'coTheSua': true,
            'coTheXoa': false,
          };
        }
      } else if (role.contains('thủ kho') || role.contains('warehouse')) {
        for (var mod in [
          'inventory',
          'inventory_gift',
          'inventory_history',
          'procurement',
          'returns',
          'returns_customer',
          'products',
          'stock_orders',
        ]) {
          defaultMap[mod] = {
            'coTheXem': true,
            'coTheTao': true,
            'coTheSua': true,
            'coTheXoa': false,
          };
        }
      }

      if (role.contains('nhân viên') ||
          role.contains('quản lý') ||
          role.contains('bán hàng') ||
          role.contains('kho') ||
          role.contains('tài xế') ||
          role.contains('sales') ||
          role.contains('driver')) {
        for (var mod in ['contact', 'chat']) {
          defaultMap[mod] = {
            'coTheXem': true,
            'coTheTao': true,
            'coTheSua': true,
            'coTheXoa': true,
          };
        }
      }

      return defaultMap.containsKey(m)
          ? defaultMap[m]!
          : {
              'coTheXem': false,
              'coTheTao': false,
              'coTheSua': false,
              'coTheXoa': false,
            };
    } catch (_) {
      return {
        'coTheXem': false,
        'coTheTao': false,
        'coTheSua': false,
        'coTheXoa': false,
      };
    }
  }

  static bool canView(String module) =>
      _getModulePerms(module)['coTheXem'] ?? false;
  static bool canCreate(String module) =>
      _getModulePerms(module)['coTheTao'] ?? false;
  static bool canEdit(String module) =>
      _getModulePerms(module)['coTheSua'] ?? false;
  static bool canDelete(String module) =>
      _getModulePerms(module)['coTheXoa'] ?? false;
}
