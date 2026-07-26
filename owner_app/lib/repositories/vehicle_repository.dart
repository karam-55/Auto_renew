import '../core/api_service.dart';
import '../core/constants.dart';
import '../models/vehicle.dart';

class VehicleRepository {
  /// Fetch all vehicles. limit=0 → "all rows" (lookup for booking form).
  Future<List<Vehicle>> getAll() async {
    final response = await ApiService.get(
      ApiConfig.vehicles,
      params: {'limit': '0'},
    );
    if (response is Map && response['data'] is List) {
      return (response['data'] as List)
          .map((e) => Vehicle.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    if (response is List) {
      return response.map((e) => Vehicle.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<List<Vehicle>> getByCustomer(String customerId) async {
    final response = await ApiService.get('${ApiConfig.vehicles}/customer/$customerId');
    if (response is Map && response['data'] is List) {
      return (response['data'] as List)
          .map((e) => Vehicle.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    if (response is List) {
      return response.map((e) => Vehicle.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<Vehicle> create(Vehicle vehicle) async {
    final response = await ApiService.post(ApiConfig.vehicles, body: vehicle.toJson());
    if (response is Map && response['vehicle'] is Map<String, dynamic>) {
      return Vehicle.fromJson(response['vehicle']);
    }
    throw ApiException('استجابة غير صالحة من الخادم');
  }

  Future<Vehicle> update(String id, Vehicle vehicle) async {
    final response = await ApiService.put('${ApiConfig.vehicles}/$id', body: vehicle.toJson());
    if (response is Map && response['vehicle'] is Map<String, dynamic>) {
      return Vehicle.fromJson(response['vehicle']);
    }
    throw ApiException('استجابة غير صالحة من الخادم');
  }

  Future<void> delete(String id) async {
    await ApiService.delete('${ApiConfig.vehicles}/$id');
  }
}
