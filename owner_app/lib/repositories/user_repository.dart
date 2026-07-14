import '../core/api_service.dart';
import '../core/constants.dart';

class UserRepository {
  Future<Map<String, dynamic>> update(String userId, Map<String, dynamic> data) async {
    final response = await ApiService.put(
      '${ApiConfig.users}/$userId',
      body: data,
    );
    if (response is Map && response['user'] is Map) {
      return response['user'] as Map<String, dynamic>;
    }
    throw ApiException('استجابة غير صالحة من الخادم');
  }

  Future<Map<String, dynamic>> updateTelegramChatId(String userId, String chatId) async {
    return update(userId, {'telegramChatId': chatId});
  }
}
