import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants.dart';

class ApiService {
  static String? _token;

  static Future<void> setToken(String token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('dealer_token', token);
  }

  static Future<String?> getToken() async {
    if (_token != null) return _token;
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('dealer_token');
    return _token;
  }

  static Future<void> clearToken() async {
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('dealer_token');
    await prefs.remove('dealer_data');
  }

  static Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }

  static Map<String, String> _headers({bool auth = true}) {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (auth && _token != null) {
      headers['Authorization'] = 'Bearer $_token';
    }
    return headers;
  }

  static Future<Map<String, dynamic>> register(Map<String, dynamic> data) async {
    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.dealerRegister}'),
      headers: _headers(auth: false),
      body: jsonEncode(data),
    );
    final body = jsonDecode(response.body);
    if (response.statusCode == 201) {
      await setToken(body['token']);
      await _saveDealer(body['dealer']);
      return body;
    }
    throw Exception(body['error'] ?? 'Registration failed');
  }

  static Future<Map<String, dynamic>> login(String phone, String password) async {
    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.dealerLogin}'),
      headers: _headers(auth: false),
      body: jsonEncode({'phone': phone, 'password': password}),
    );
    final body = jsonDecode(response.body);
    if (response.statusCode == 200) {
      await setToken(body['token']);
      await _saveDealer(body['dealer']);
      return body;
    }
    throw Exception(body['error'] ?? 'Login failed');
  }

  static Future<Map<String, dynamic>> getStats() async {
    final response = await http.get(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.dealerStats}'),
      headers: _headers(),
    );
    final body = jsonDecode(response.body);
    if (response.statusCode == 200) return body;
    throw Exception(body['error'] ?? 'Failed to load stats');
  }

  static Future<List<dynamic>> getWarranties() async {
    final response = await http.get(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.warranties}'),
      headers: _headers(),
    );
    final body = jsonDecode(response.body);
    if (response.statusCode == 200) return body['warranties'] ?? [];
    throw Exception(body['error'] ?? 'Failed to load warranties');
  }

  static Future<Map<String, dynamic>> createWarranty(Map<String, dynamic> data) async {
    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.warranties}'),
      headers: _headers(),
      body: jsonEncode(data),
    );
    final body = jsonDecode(response.body);
    if (response.statusCode == 201) return body['warranty'];
    throw Exception(body['error'] ?? 'Failed to create warranty');
  }

  static Future<void> _saveDealer(Map<String, dynamic> dealer) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('dealer_data', jsonEncode(dealer));
  }

  static Future<Map<String, dynamic>?> getSavedDealer() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString('dealer_data');
    if (data != null) return jsonDecode(data);
    return null;
  }
}
