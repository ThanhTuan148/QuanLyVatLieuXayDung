// lib/services/api_service.dart
import 'dart:io';
import 'dart:async';
import 'package:dio/dio.dart';
import 'package:dio/io.dart';
import 'shared_preferences_service.dart';

class ApiService {
  late Dio _dio;
  Dio get dio => _dio;

  ApiService() {
    _dio = Dio(
      BaseOptions(
        baseUrl: SharedPreferencesService.getServerUrl(),
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );
    _setupInterceptors();
    _setupSslBypass();
  }

  void updateBaseUrl(String newUrl) {
    _dio.options.baseUrl = newUrl;
  }

  void _setupSslBypass() {
    _dio.httpClientAdapter = IOHttpClientAdapter(
      createHttpClient: () {
        final client = HttpClient();
        client.badCertificateCallback =
            (X509Certificate cert, String host, int port) => true;
        return client;
      },
    );
  }

  void _setupInterceptors() {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          print(
            '>>> DIO REQUEST: ${options.method} ${options.baseUrl}${options.path}',
          );
          final token = SharedPreferencesService.getToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) {
          print(
            '>>> DIO ERROR: ${error.message} - ${error.response?.statusCode} - URL: ${error.requestOptions.baseUrl}${error.requestOptions.path}',
          );
          if (error.response?.statusCode == 401) {
            SharedPreferencesService.logout();
          }
          return handler.next(error);
        },
      ),
    );
  }

  // =========================================================================
  // TÍNH NĂNG QUÉT MẠNG LAN ĐA CỔNG (5000, 5001, 5213)
  // =========================================================================
  Future<String?> autoDiscoverServerIP() async {
    try {
      final interfaces = await NetworkInterface.list(
        type: InternetAddressType.IPv4,
        includeLoopback: false,
      );
      String? deviceIp;
      for (var interface in interfaces) {
        for (var addr in interface.addresses) {
          if (addr.address.startsWith('192.168.') ||
              addr.address.startsWith('10.') ||
              addr.address.startsWith('172.')) {
            deviceIp = addr.address;
            break;
          }
        }
        if (deviceIp != null) break;
      }

      if (deviceIp == null) return null;

      final lastDotIndex = deviceIp.lastIndexOf('.');
      final subnet = deviceIp.substring(0, lastDotIndex + 1);
      final List<int> targetPorts = [
        5000,
        5001,
        5213,
      ]; // Quét cả 3 cổng phổ biến của .NET Backend

      // Quét song song 254 IP trên cả 3 cổng
      final List<Future<String?>> checkTasks = [];
      for (int i = 1; i <= 254; i++) {
        final targetIp = '$subnet$i';
        for (int port in targetPorts) {
          checkTasks.add(_checkServerAlive(targetIp, port));
        }
      }

      final results = await Future.wait(checkTasks);
      final foundResult = results.firstWhere(
        (res) => res != null,
        orElse: () => null,
      );

      if (foundResult != null) {
        SharedPreferencesService.setServerUrl(foundResult);
        updateBaseUrl(foundResult);
        return foundResult;
      }
    } catch (e) {
      // Bỏ qua lỗi
    }
    return null;
  }

  Future<String?> _checkServerAlive(String ip, int port) async {
    try {
      // Tăng timeout lên 850ms để các thiết bị Wi-Fi chậm vẫn kịp phản hồi
      final socket = await Socket.connect(
        ip,
        port,
        timeout: const Duration(milliseconds: 850),
      );
      socket.destroy();
      // Nếu kết nối thành công, trả về URL hoàn chỉnh có dấu '/' ở cuối
      final scheme = (port == 5001) ? 'https' : 'http';
      return '$scheme://$ip:$port/api/';
    } catch (e) {
      return null;
    }
  }

  // =========================================================================
  // DANH SÁCH API ENDPOINTS
  // =========================================================================
  Future<Response> login(String username, String password) async {
    return _dio.post(
      'auth/login',
      data: {'username': username, 'password': password},
    );
  }

  Future<Response> getProducts() async {
    return _dio.get('products');
  }

  Future<Response> getOrders() async {
    return _dio.get('orders');
  }

  Future<Response> getOrderDetail(int id) async {
    return _dio.get('orders/$id');
  }

  Future<Response> updateOrder(int id, Map<String, dynamic> data) async {
    return _dio.put('orders/$id', data: data);
  }

  Future<Response> getInventory() async {
    return _dio.get('inventory');
  }

  Future<Response> getOutboundHistory() async {
    return _dio.get('inventory/outbound');
  }

  Future<Response> confirmExport(int id, Map<String, dynamic> data) async {
    return _dio.post('inventory/$id/confirm-export', data: data);
  }

  Future<Response> confirmReceipt(int id, Map<String, dynamic> data) async {
    return _dio.post('inventory/$id/confirm-receipt', data: data);
  }

  Future<Response> approveOutbound(int id, Map<String, dynamic> data) async {
    return _dio.post('inventory/$id/approve', data: data);
  }

  Future<Response> getDeliveries() async {
    return _dio.get('deliveries');
  }

  Future<Response> createDelivery(Map<String, dynamic> data) async {
    return _dio.post('deliveries', data: data);
  }

  Future<Response> getDeliveryDetail(int id) async {
    return _dio.get('deliveries/$id');
  }

  Future<Response> updateDelivery(int id, Map<String, dynamic> data) async {
    return _dio.put('deliveries/$id', data: data);
  }

  Future<Response> getDeliveryHistory(int id) async {
    return _dio.get('deliveries/$id/history');
  }

  Future<Response> getDashboardStats() async {
    return _dio.get('dashboard/stats');
  }

  Future<Response> getRecentOrders() async {
    return _dio.get('dashboard/recent-orders');
  }

  Future<Response> getTopProducts() async {
    return _dio.get('dashboard/top-products');
  }

  Future<Response> getInventoryAlerts() async {
    return _dio.get('dashboard/inventory-alerts');
  }

  Future<Response> getLateOrders() async {
    return _dio.get('dashboard/late-orders');
  }

  Future<Response> getDebtSummary() async {
    return _dio.get('dashboard/debt-summary');
  }

  Future<Response> getEmployees() async {
    return _dio.get('employees');
  }

  Future<Response> getReturns() async {
    return _dio.get('returns');
  }

  Future<Response> getPriceHistory() async {
    return _dio.get('price-history');
  }

  Future<Response> getReportSummary() async {
    return _dio.get('reports/summary');
  }

  Future<Response> getRevenueProfit() async {
    return _dio.get('reports/revenue-profit');
  }

  Future<Response> getCustomerRanking() async {
    return _dio.get('reports/customer-ranking');
  }

  Future<Response> getInventoryAging() async {
    return _dio.get('reports/inventory-aging');
  }

  Future<Response> getDebtAging() async {
    return _dio.get('reports/debt-aging');
  }

  Future<Response> getDebts() async {
    return _dio.get('debts');
  }

  Future<Response> getCustomers() async {
    return _dio.get('customers');
  }

  Future<Response> getPromotions() async {
    return _dio.get('promotions');
  }

  Future<Response> getSuppliers() async {
    return _dio.get('suppliers');
  }

  Future<Response> getChats() async {
    return _dio.get('chat/customers');
  }

  // =========================================================================
  // CRUD ENDPOINTS & ADVANCED ACTIONS
  // =========================================================================
  // Products
  Future<Response> createProduct(Map<String, dynamic> data) async =>
      _dio.post('products', data: data);
  Future<Response> updateProduct(int id, Map<String, dynamic> data) async =>
      _dio.put('products/$id', data: data);
  Future<Response> deleteProduct(int id) async => _dio.delete('products/$id');

  // Customers
  Future<Response> createCustomer(Map<String, dynamic> data) async =>
      _dio.post('customers', data: data);
  Future<Response> updateCustomer(int id, Map<String, dynamic> data) async =>
      _dio.put('customers/$id', data: data);
  Future<Response> deleteCustomer(int id) async => _dio.delete('customers/$id');

  // Suppliers
  Future<Response> createSupplier(Map<String, dynamic> data) async =>
      _dio.post('suppliers', data: data);
  Future<Response> updateSupplier(int id, Map<String, dynamic> data) async =>
      _dio.put('suppliers/$id', data: data);
  Future<Response> deleteSupplier(int id) async => _dio.delete('suppliers/$id');

  // Promotions
  Future<Response> createPromotion(Map<String, dynamic> data) async =>
      _dio.post('promotions', data: data);
  Future<Response> updatePromotion(int id, Map<String, dynamic> data) async =>
      _dio.put('promotions/$id', data: data);
  Future<Response> deletePromotion(int id) async =>
      _dio.delete('promotions/$id');

  // Procurement / Nhập hàng
  Future<Response> getProcurements() async => _dio.get('procurement');
  Future<Response> getProcurementDetail(int id) async =>
      _dio.get('procurement/$id');
  Future<Response> createProcurementProposal(Map<String, dynamic> data) async =>
      _dio.post('procurement/proposal', data: data);
  Future<Response> updateProcurementProposal(
    int id,
    Map<String, dynamic> data,
  ) async => _dio.put('procurement/$id', data: data);
  Future<Response> approveProcurement(
    int id,
    Map<String, dynamic> data,
  ) async => _dio.put('procurement/$id/approve', data: data);
  Future<Response> approveProcurementItems(
    int id,
    Map<String, dynamic> data,
  ) async => _dio.put('procurement/$id/approve-items', data: data);
  Future<Response> rejectProcurement(int id, Map<String, dynamic> data) async =>
      _dio.put('procurement/$id/reject', data: data);
  Future<Response> receiveProcurementItems(int id, List<dynamic> items) async =>
      _dio.put('procurement/$id/receive', data: items);

  // Categories
  Future<Response> getCategories() async => _dio.get('categories');
  Future<Response> createCategory(Map<String, dynamic> data) async =>
      _dio.post('categories', data: data);
  Future<Response> updateCategory(int id, Map<String, dynamic> data) async =>
      _dio.put('categories/$id', data: data);
  Future<Response> deleteCategory(int id) async =>
      _dio.delete('categories/$id');

  // Returns (Đổi / Trả)
  Future<Response> getCustomerReturns() async => _dio.get('returns/customer');
  Future<Response> getSupplierReturns() async => _dio.get('returns/supplier');
  Future<Response> createCustomerReturn(Map<String, dynamic> data) async =>
      _dio.post('returns/customer', data: data);
  Future<Response> approveCustomerReturn(int id) async =>
      _dio.put('returns/customer/$id/approve');
  Future<Response> receiveCustomerReturn(int id) async =>
      _dio.put('returns/customer/$id/receive');
  Future<Response> createSupplierReturn(Map<String, dynamic> data) async =>
      _dio.post('returns/supplier', data: data);
  Future<Response> approveSupplierReturn(int id) async =>
      _dio.put('returns/supplier/$id/approve');
  Future<Response> receiveSupplierReturn(int id) async =>
      _dio.put('returns/supplier/$id/receive');

  // Debts (Công Nợ)
  Future<Response> getDebtsFiltered({String? type, String? status}) async =>
      _dio.get('debts', queryParameters: {'type': type, 'status': status});
  Future<Response> getDebtStatistics() async => _dio.get('debts/statistics');
  Future<Response> getDebtWarnings() async => _dio.get('debts/warnings');
  Future<Response> getDebtHistory(int id) async =>
      _dio.get('debts/$id/history');
  Future<Response> recordDebtPayment(Map<String, dynamic> data) async =>
      _dio.post('debts/payment', data: data);

  // Price History (Lịch Sử Giá)
  Future<Response> getPriceHistoryFiltered({
    int? productId,
    int days = 180,
  }) async => _dio.get(
    'price-history',
    queryParameters: {'productId': productId, 'days': days},
  );
  Future<Response> getPriceHistoryOverview() async =>
      _dio.get('price-history/products-overview');
  Future<Response> getPriceHistorySummary({int days = 30}) async =>
      _dio.get('price-history/summary', queryParameters: {'days': days});
  Future<Response> getPriceHistoryChart(int id, {int days = 180}) async => _dio
      .get('price-history/product/$id/chart', queryParameters: {'days': days});

  // Employees (Nhân Viên)
  Future<Response> createEmployee(Map<String, dynamic> data) async =>
      _dio.post('employees', data: data);
  Future<Response> updateEmployee(int id, Map<String, dynamic> data) async =>
      _dio.put('employees/$id', data: data);
  Future<Response> deleteEmployee(int id) async => _dio.delete('employees/$id');
  Future<Response> toggleEmployeeStatus(int id) async =>
      _dio.put('employees/$id/toggle-status');
  Future<Response> getRoles() async => _dio.get('employees/roles');
  Future<Response> changeEmployeeRole(int id, int roleId) async =>
      _dio.put('employees/$id/role', data: {'maVaiTro': roleId});
  Future<Response> createEmployeeAccount(
    int id,
    Map<String, dynamic> data,
  ) async => _dio.post('employees/$id/create-account', data: data);
  Future<Response> getEmployeeModulePermissions(int id) async =>
      _dio.get('employees/$id/module-permissions');
  Future<Response> getRolePermissions(int id) async =>
      _dio.get('employees/$id/permissions');
  Future<Response> setEmployeeModulePermissions(
    int id,
    List<dynamic> permissions,
  ) async => _dio.put('employees/$id/module-permissions', data: permissions);

  // Backup & Restore (Sao Lưu & Phục Hồi)
  Future<Response> getBackupsList() async => _dio.get('backup');
  Future<Response> createServerBackup() async => _dio.post('backup');
  Future<Response> restoreServerBackup(String fileName) async =>
      _dio.post('backup/$fileName/restore');
  Future<Response> deleteServerBackup(String fileName) async =>
      _dio.delete('backup/$fileName');

  // Auth: Đổi mật khẩu
  Future<Response> changePassword(
    int accountId,
    String oldPassword,
    String newPassword,
  ) async => _dio.put(
    'auth/$accountId/change-password',
    data: {'oldPassword': oldPassword, 'newPassword': newPassword},
  );
}
