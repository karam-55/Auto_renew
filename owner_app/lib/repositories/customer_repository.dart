import '../core/api_service.dart';
import '../core/constants.dart';
import '../models/customer.dart';

class CustomerRepository {
  Future<List<Customer>> getAll({int page = 1, int limit = 100}) async {
    final response = await ApiService.get(
      ApiConfig.customers,
      params: {'page': page.toString(), 'limit': limit.toString()},
    );
    if (response is Map && response['data'] is List) {
      return (response['data'] as List)
          .map((e) => Customer.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    if (response is List) {
      return response.map((e) => Customer.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<Customer> create(Customer customer) async {
    final response = await ApiService.post(ApiConfig.customers, body: customer.toJson());
    if (response is Map && response['customer'] is Map<String, dynamic>) {
      return Customer.fromJson(response['customer']);
    }
    throw ApiException('استجابة غير صالحة من الخادم');
  }

  Future<Customer> update(String id, Customer customer) async {
    final response = await ApiService.put('${ApiConfig.customers}/$id', body: customer.toJson());
    if (response is Map && response['customer'] is Map<String, dynamic>) {
      return Customer.fromJson(response['customer']);
    }
    throw ApiException('استجابة غير صالحة من الخادم');
  }

  Future<void> delete(String id) async {
    await ApiService.delete('${ApiConfig.customers}/$id');
  }
}
