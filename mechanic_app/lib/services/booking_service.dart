import 'api_service.dart';
import '../models/booking.dart';

class BookingService {
  final ApiService _apiService = ApiService();

  Future<List<Booking>> getAssignedBookings(String mechanicId) async {
    try {
      final response = await _apiService.get('/bookings/mechanic/$mechanicId');
      final bookings = (response.data['bookings'] as List)
          .map((b) => Booking.fromJson(b))
          .toList();
      return bookings;
    } catch (e) {
      throw Exception('Failed to fetch assigned bookings: $e');
    }
  }

  Future<Booking> getBookingById(String id) async {
    try {
      final response = await _apiService.get('/bookings/$id');
      return Booking.fromJson(response.data['booking']);
    } catch (e) {
      throw Exception('Failed to fetch booking: $e');
    }
  }

  Future<Booking> updateBookingStatus(String id, String status) async {
    try {
      final response = await _apiService.put('/bookings/$id', data: {'status': status});
      return Booking.fromJson(response.data['booking']);
    } catch (e) {
      throw Exception('Failed to update booking status: $e');
    }
  }
}
