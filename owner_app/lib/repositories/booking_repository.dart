import '../core/api_service.dart';
import '../core/constants.dart';
import '../models/booking.dart';

class BookingRepository {
  Future<List<Booking>> getAll({String? status}) async {
    final params = status != null && status.isNotEmpty ? {'status': status} : null;
    final response = await ApiService.get(ApiConfig.bookings, params: params);
    if (response is Map && response['data'] is List) {
      return (response['data'] as List)
          .map((e) => Booking.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    if (response is List) {
      return response.map((e) => Booking.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<Booking> create(Booking booking) async {
    final response = await ApiService.post(ApiConfig.bookings, body: booking.toJson());
    if (response is Map && response['booking'] is Map<String, dynamic>) {
      return Booking.fromJson(response['booking']);
    }
    throw ApiException('استجابة غير صالحة من الخادم');
  }

  Future<Booking> update(String id, Booking booking) async {
    final response = await ApiService.put('${ApiConfig.bookings}/$id', body: booking.toJson());
    if (response is Map && response['booking'] is Map<String, dynamic>) {
      return Booking.fromJson(response['booking']);
    }
    throw ApiException('استجابة غير صالحة من الخادم');
  }

  Future<void> delete(String id) async {
    await ApiService.delete('${ApiConfig.bookings}/$id');
  }
}
