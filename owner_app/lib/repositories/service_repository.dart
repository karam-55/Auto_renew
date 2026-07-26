import '../core/api_service.dart';
import '../core/constants.dart';
import '../models/service.dart';

class ServiceRepository {
  /// Fetch all services. limit=0 → "all rows" (lookup for booking form).
  Future<List<Service>> getAll() async {
    final response = await ApiService.get(
      ApiConfig.services,
      params: {'limit': '0'},
    );
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
