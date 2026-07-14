import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../screens/login_screen.dart';
import 'constants.dart';
import 'auth_service.dart';
import 'navigation_service.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;

  ApiException(this.message, {this.statusCode});

  @override
  String toString() => message;
}

class ApiService {
  static final Map<String, String> _defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  static Future<Map<String, String>> _headers() async {
    final headers = Map<String, String>.from(_defaultHeaders);
    final token = await AuthService.getToken();
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    final tenantId = await AuthService.getTenantId();
    if (tenantId != null && tenantId.isNotEmpty) {
      headers['x-tenant-id'] = tenantId;
    }
    return headers;
  }

  static bool _loggingOut = false;

  static Future<dynamic> _handleResponse(http.Response response) async {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) return null;
      try {
        return jsonDecode(response.body);
      } catch (_) {
        return response.body;
      }
    }

    if (response.statusCode == 401 && !_loggingOut) {
      _loggingOut = true;
      await AuthService.logout();
      await NavigationService.navigateToAndRemoveUntil(
        const LoginScreen(),
        (_) => false,
      );
      _loggingOut = false;
      throw ApiException('انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى', statusCode: 401);
    }

    String message = 'حدث خطأ في الاتصال';
    try {
      final body = jsonDecode(response.body);
      if (body is Map) {
        message = body['error']?.toString() ??
            body['message']?.toString() ??
            message;
      }
    } catch (_) {}

    throw ApiException(message, statusCode: response.statusCode);
  }

  static Future<dynamic> get(String path, {Map<String, String>? params}) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}$path').replace(queryParameters: params);
    final response = await http.get(uri, headers: await _headers());
    return _handleResponse(response);
  }

  static Future<dynamic> post(String path, {Map<String, dynamic>? body}) async {
    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}$path'),
      headers: await _headers(),
      body: body == null ? null : jsonEncode(body),
    );
    return _handleResponse(response);
  }

  static Future<dynamic> put(String path, {Map<String, dynamic>? body}) async {
    final response = await http.put(
      Uri.parse('${ApiConfig.baseUrl}$path'),
      headers: await _headers(),
      body: body == null ? null : jsonEncode(body),
    );
    return _handleResponse(response);
  }

  static Future<dynamic> patch(String path, {Map<String, dynamic>? body}) async {
    final response = await http.patch(
      Uri.parse('${ApiConfig.baseUrl}$path'),
      headers: await _headers(),
      body: body == null ? null : jsonEncode(body),
    );
    return _handleResponse(response);
  }

  static Future<dynamic> delete(String path) async {
    final response = await http.delete(
      Uri.parse('${ApiConfig.baseUrl}$path'),
      headers: await _headers(),
    );
    return _handleResponse(response);
  }
}
