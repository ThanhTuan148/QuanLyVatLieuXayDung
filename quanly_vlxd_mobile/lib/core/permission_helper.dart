import 'dart:convert';
import '../services/shared_preferences_service.dart';

class PermissionHelper {
  static Map<String, dynamic> _getModulePerms(String module) {
    try {
      final userStr = SharedPreferencesService.getUser();
      if (userStr == null || userStr.isEmpty) return _getDefaultPerms(module);
      final userObj = jsonDecode(userStr);
      final perms = userObj['modulePermissions'] ?? userObj['ModulePermissions'];
      if (perms != null && perms[module] != null) {
        return perms[module] as Map<String, dynamic>;
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
      bool isManagerOrAdmin = role.contains('quản lý') || role.contains('manager') || role.contains('admin') || role.contains('quản trị');
      if (isManagerOrAdmin) {
        return {'coTheXem': true, 'coTheTao': true, 'coTheSua': true, 'coTheXoa': true};
      }
      if (role.contains('bán hàng') || role == 'sales') {
        if (['ORDERS', 'CUSTOMERS', 'PRODUCTS'].contains(module)) {
          return {'coTheXem': true, 'coTheTao': true, 'coTheSua': true, 'coTheXoa': true};
        }
      } else if (role.contains('thủ kho') || role == 'warehouse') {
        if (['STOCK_ORDERS', 'RETURNS', 'INVENTORY', 'PRODUCTS'].contains(module)) {
          return {'coTheXem': true, 'coTheTao': true, 'coTheSua': true, 'coTheXoa': true};
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
