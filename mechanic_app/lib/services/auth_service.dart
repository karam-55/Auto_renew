import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class AuthService {
  final ApiService _apiService = ApiService();

  Future<Map<String, dynamic>> login(String username, String password) async {
    try {
      final response = await _apiService.post('/auth/login', data: {
        'username': username,
        'password': password,
      });

      final body = response.data as Map<String, dynamic>? ?? {};
      final user = body['data']?['user'] ?? body['user'];
      final tokens = body['data']?['tokens'] ?? body['tokens'];

      if (user == null || tokens == null) {
        throw Exception('Invalid server response: missing user or tokens');
      }

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('accessToken', tokens['accessToken']);
      await prefs.setString('refreshToken', tokens['refreshToken']);
      await prefs.setString('userId', user['id']);
      await prefs.setString('tenantId', user['tenantId'] ?? '');
      await prefs.setString('userRole', user['role']);
      await prefs.setString('userName', user['fullName'] ?? user['username'] ?? '');

      return {
        'user': user,
        'tokens': tokens,
      };
    } catch (e) {
      throw Exception('Login failed: $e');
    }
  }

  Future<void> logout() async {
    try {
      await _apiService.post('/auth/logout');
    } catch (e) {
      // Ignore logout errors
    } finally {
      final prefs = await SharedPreferences.getInstance();
      await prefs.clear();
    }
  }

  Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken');
    return token != null && token.isNotEmpty;
  }

  Future<String?> getUserId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('userId');
  }

  Future<String?> getTenantId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('tenantId');
  }

  Future<String?> getUserRole() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('userRole');
  }

  Future<String?> getUserName() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('userName');
  }
}
