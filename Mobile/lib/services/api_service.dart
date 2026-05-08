// lib/services/api_service.dart
import 'package:dio/dio.dart';
import 'shared_preferences_service.dart';

class ApiService {
  static const String baseUrl = 'https://10.0.2.2:5001/api'; // For Android emulator
  late Dio _dio;

  ApiService() {
    _dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
      ),
    );
    _setupInterceptors();
  }

  void _setupInterceptors() {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          final token = SharedPreferencesService.getToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer \$token';
          }
          return handler.next(options);
        },
        onError: (error, handler) {
          if (error.response?.statusCode == 401) {
            SharedPreferencesService.logout();
          }
          return handler.next(error);
        },
      ),
    );
  }

  Future<Response> login(String username, String password) async {
    return _dio.post(
      '/auth/login',
      data: {'username': username, 'password': password},
    );
  }

  Future<Response> getProducts() async {
    return _dio.get('/products');
  }

  Future<Response> getOrders() async {
    return _dio.get('/orders');
  }

  Future<Response> getInventory() async {
    return _dio.get('/inventory');
  }

  Future<Response> getDeliveries() async {
    return _dio.get('/deliveries');
  }
}
