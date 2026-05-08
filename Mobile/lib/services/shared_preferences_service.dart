// lib/services/shared_preferences_service.dart
import 'package:shared_preferences/shared_preferences.dart';

class SharedPreferencesService {
  static late SharedPreferences _prefs;

  static Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
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
}
