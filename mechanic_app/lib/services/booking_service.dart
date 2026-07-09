import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';
import '../models/booking.dart';

class BookingService {
  final ApiService _apiService = ApiService();

  Future<List<Booking>> getAssignedBookings(String mechanicId) async {
    try {
      final response = await _apiService.get('/bookings/mechanic/$mechanicId');
      final payload = response.data;
      // Backend returns { success: true, data: [...] }
      final bookingsList = (payload['data'] ?? []) as List;
      return bookingsList.map((b) => Booking.fromJson(b)).toList();
    } catch (e) {
      throw Exception('فشل تحميل الحجوزات: $e');
    }
  }

  /// Fetch bookings assigned to the current mechanic
  Future<List<Booking>> getMyBookings() async {
    final prefs = await SharedPreferences.getInstance();
    final userId = prefs.getString('userId');
    if (userId == null) throw Exception('المستخدم غير مسجل الدخول');
    return getAssignedBookings(userId);
  }

  Future<Booking> getBookingById(String id) async {
    try {
      final response = await _apiService.get('/bookings/$id');
      final payload = response.data;
      // Backend returns { success: true, data: {...} }
      final bookingData = payload['data'] ?? payload;
      return Booking.fromJson(bookingData);
    } catch (e) {
      throw Exception('فشل تحميل تفاصيل الحجز: $e');
    }
  }

  Future<Booking> updateBookingStatus(String id, String status) async {
    try {
      // Backend uses PUT not PATCH for /bookings/:id
      final response = await _apiService.put('/bookings/$id', data: {'status': status});
      final payload = response.data;
      final bookingData = payload['data'] ?? payload;
      return Booking.fromJson(bookingData);
    } catch (e) {
      throw Exception('فشل تحديث حالة الحجز: $e');
    }
  }

  /// Record parts consumed for a booking service
  Future<void> recordPartsConsumption(String bookingId, String serviceId, List<Map<String, dynamic>> parts) async {
    try {
      await _apiService.post('/bookings/$bookingId/parts-consumption', data: {
        'serviceId': serviceId,
        'parts': parts,
      });
    } catch (e) {
      throw Exception('فشل تسجيل استهلاك المواد: $e');
    }
  }
}
