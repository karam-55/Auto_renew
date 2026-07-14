import '../core/api_service.dart';
import '../core/constants.dart';
import '../models/dealer.dart';
import '../models/warranty.dart';

class DealerRepository {
  Future<List<Dealer>> getAll() async {
    final response = await ApiService.get(ApiConfig.dealers);
    if (response is Map && response['data'] is List) {
      return (response['data'] as List)
          .map((e) => Dealer.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    if (response is List) {
      return response.map((e) => Dealer.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<Dealer> create(Dealer dealer) async {
    final response = await ApiService.post(ApiConfig.dealers, body: dealer.toJson());
    if (response is Map && response['dealer'] is Map<String, dynamic>) {
      return Dealer.fromJson(response['dealer']);
    }
    throw ApiException('استجابة غير صالحة من الخادم');
  }

  Future<Dealer> update(String id, Dealer dealer) async {
    final response = await ApiService.put('${ApiConfig.dealers}/$id', body: dealer.toJson());
    if (response is Map && response['dealer'] is Map<String, dynamic>) {
      return Dealer.fromJson(response['dealer']);
    }
    throw ApiException('استجابة غير صالحة من الخادم');
  }

  Future<void> delete(String id) async {
    await ApiService.delete('${ApiConfig.dealers}/$id');
  }

  Future<List<DealerWarranty>> getWarranties(String dealerId) async {
    final response = await ApiService.get('${ApiConfig.dealers}/$dealerId/warranties');
    if (response is Map && response['data'] is List) {
      return (response['data'] as List)
          .map((e) => DealerWarranty.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    if (response is List) {
      return response.map((e) => DealerWarranty.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }
}
