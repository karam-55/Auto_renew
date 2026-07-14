import '../core/api_service.dart';
import '../core/constants.dart';
import '../models/service.dart';

class ServiceRepository {
  Future<List<Service>> getAll() async {
    final response = await ApiService.get(ApiConfig.services);
    if (response is Map && response['data'] is List) {
      return (response['data'] as List)
          .map((e) => Service.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    if (response is List) {
      return response.map((e) => Service.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }
}
