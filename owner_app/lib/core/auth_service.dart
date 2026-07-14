import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';
import 'constants.dart';

class AuthService {
  static const String _tokenKey = 'owner_token';
  static const String _userKey = 'owner_user';
  static const String _tenantIdKey = 'owner_tenant_id';

  static Future<void> saveAuth(String token, Map<String, dynamic> user, String tenantId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    await prefs.setString(_userKey, jsonEncode(user));
    await prefs.setString(_tenantIdKey, tenantId);
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  static Future<String?> getTenantId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tenantIdKey);
  }

  static Future<Map<String, dynamic>?> getUser() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString(_userKey);
    if (data == null) return null;
    try {
      return jsonDecode(data) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  static Future<void> updateStoredUser(Map<String, dynamic> user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userKey, jsonEncode(user));
  }

  static Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }

  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
    await prefs.remove(_tenantIdKey);
  }

  static Future<Map<String, dynamic>> login(String username, String password, String tenantId) async {
    final response = await ApiService.post(
      ApiConfig.login,
      body: {
        'username': username,
        'password': password,
        'tenantId': tenantId,
      },
    );

    if (response == null || response is! Map<String, dynamic>) {
      throw ApiException('استجابة غير صالحة من الخادم');
    }

    final tokens = response['tokens'];
    final token = tokens is Map ? tokens['accessToken'] : response['accessToken'];
    final user = response['user'];

    if (token == null || user == null) {
      throw ApiException('بيانات تسجيل الدخول غير صالحة');
    }

    if (user['role'] != 'OWNER') {
      throw ApiException('هذا التطبيق مخصص للمالكين فقط');
    }

    await saveAuth(token as String, user as Map<String, dynamic>, tenantId);
    return response;
  }
}
