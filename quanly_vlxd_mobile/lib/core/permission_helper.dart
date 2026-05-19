import 'dart:convert';
import '../services/shared_preferences_service.dart';

class PermissionHelper {
  static Map<String, dynamic> _getModulePerms(String module) {
    try {
      final userStr = SharedPreferencesService.getUser();
      if (userStr == null || userStr.isEmpty) return _getDefaultPerms(module);
      final userObj = jsonDecode(userStr);
      final perms = userObj['modulePermissions'] ?? userObj['ModulePermissions'];
      
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
      String role = 'NhanVien';
      if (userStr != null && userStr.isNotEmpty) {
        final userObj = jsonDecode(userStr);
        role = (userObj['roleName'] ?? userObj['RoleName'] ?? userObj['role'] ?? 'NhanVien').toString().toLowerCase();
      }
      final modUpper = module.toUpperCase();
      bool isManagerOrAdmin = role.contains('quản lý') || role.contains('manager') || role.contains('admin') || role.contains('quản trị') || role.contains('giám đốc');
      if (isManagerOrAdmin) {
        if ((role.contains('admin') || role.contains('quản trị')) && modUpper == 'DEBTS') {
          return {'coTheXem': false, 'coTheTao': false, 'coTheSua': false, 'coTheXoa': false};
        }
        return {'coTheXem': true, 'coTheTao': true, 'coTheSua': true, 'coTheXoa': true};
      }
      
      if (role.contains('tài xế') || role.contains('driver')) {
        if (modUpper == 'DELIVERIES') {
          return {'coTheXem': true, 'coTheTao': false, 'coTheSua': false, 'coTheXoa': false};
        }
      } else if (role.contains('bán hàng') || role == 'sales') {
        if (['ORDERS', 'CUSTOMERS', 'PRODUCTS', 'PROMOTIONS'].contains(modUpper)) {
          return {'coTheXem': true, 'coTheTao': true, 'coTheSua': true, 'coTheXoa': false};
        }
      } else if (role.contains('thủ kho') || role == 'warehouse') {
        if (['STOCK_ORDERS', 'RETURNS', 'INVENTORY', 'PRODUCTS'].contains(modUpper)) {
          return {'coTheXem': true, 'coTheTao': true, 'coTheSua': true, 'coTheXoa': false};
        }
      }
      return {'coTheXem': false, 'coTheTao': false, 'coTheSua': false, 'coTheXoa': false};
    } catch (_) {
      return {'coTheXem': false, 'coTheTao': false, 'coTheSua': false, 'coTheXoa': false};
    }
  }

  static bool canView(String module) => _getModulePerms(module)['coTheXem'] ?? false;
  static bool canCreate(String module) => _getModulePerms(module)['coTheTao'] ?? false;
  static bool canEdit(String module) => _getModulePerms(module)['coTheSua'] ?? false;
  static bool canDelete(String module) => _getModulePerms(module)['coTheXoa'] ?? false;
}
