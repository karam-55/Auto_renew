import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/auth_service.dart';
import '../core/constants.dart';

class TelegramRepository {
  Future<Map<String, dynamic>> sendTestMessage(String chatId, String message) async {
    final token = await AuthService.getToken();
    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.telegramSend}'),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'chatId': chatId, 'message': message}),
    );

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode != 200 || data['success'] != true) {
      throw Exception(data['error']?['message'] ?? data['error'] ?? 'فشل إرسال الرسالة');
    }
    return data['data'] as Map<String, dynamic>;
  }

  Future<bool> getStatus() async {
    final token = await AuthService.getToken();
    final response = await http.get(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.telegramStatus}'),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
    );

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode != 200 || data['success'] != true) {
      throw Exception(data['error']?['message'] ?? 'فشل التحقق من حالة البوت');
    }
    return (data['data']?['enabled'] as bool?) ?? false;
  }
}
