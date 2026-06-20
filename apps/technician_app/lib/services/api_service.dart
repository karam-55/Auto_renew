import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiResult<T> {
  final bool success;
  final T? data;
  final String? error;
  final String? message;

  ApiResult({required this.success, this.data, this.error, this.message});
}

class ApiService {
  static String baseUrl = 'http://localhost:8080/api';
  static const Duration _timeout = Duration(seconds: 15);
  String? token;

  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    if (token != null) 'Authorization': 'Bearer $token',
  };

  void updateBaseUrl(String url) {
    baseUrl = url.endsWith('/api') ? url : '$url/api';
  }

  Future<ApiResult<Map<String, dynamic>>> login(String username, String password, String tenantId) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'username': username, 'password': password, 'tenantId': tenantId}),
      ).timeout(_timeout);

      final data = jsonDecode(response.body);
      if (response.statusCode >= 200 && response.statusCode < 300) {
        token = data['token'] ?? data['accessToken'];
        return ApiResult(success: true, data: data);
      } else {
        return ApiResult(success: false, error: data['error'] ?? data['message'] ?? 'Login failed');
      }
    } on TimeoutException {
      return ApiResult(success: false, error: 'Connection timeout');
    } catch (e) {
      return ApiResult(success: false, error: 'Network error: ${e.toString()}');
    }
  }

  Future<ApiResult<dynamic>> get(String path) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl$path'),
        headers: _headers,
      ).timeout(_timeout);

      final data = jsonDecode(response.body);
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return ApiResult(success: true, data: data);
      } else {
        return ApiResult(success: false, error: data['error'] ?? data['message'] ?? 'Request failed');
      }
    } on TimeoutException {
      return ApiResult(success: false, error: 'Connection timeout');
    } catch (e) {
      return ApiResult(success: false, error: 'Network error: ${e.toString()}');
    }
  }

  Future<ApiResult<dynamic>> post(String path, Map<String, dynamic> body) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl$path'),
        headers: _headers,
        body: jsonEncode(body),
      ).timeout(_timeout);

      final data = jsonDecode(response.body);
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return ApiResult(success: true, data: data);
      } else {
        return ApiResult(success: false, error: data['error'] ?? data['message'] ?? 'Request failed');
      }
    } on TimeoutException {
      return ApiResult(success: false, error: 'Connection timeout');
    } catch (e) {
      return ApiResult(success: false, error: 'Network error: ${e.toString()}');
    }
  }

  Future<ApiResult<dynamic>> put(String path, Map<String, dynamic> body) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl$path'),
        headers: _headers,
        body: jsonEncode(body),
      ).timeout(_timeout);

      final data = jsonDecode(response.body);
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return ApiResult(success: true, data: data);
      } else {
        return ApiResult(success: false, error: data['error'] ?? data['message'] ?? 'Request failed');
      }
    } on TimeoutException {
      return ApiResult(success: false, error: 'Connection timeout');
    } catch (e) {
      return ApiResult(success: false, error: 'Network error: ${e.toString()}');
    }
  }
}
