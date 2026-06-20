import 'dart:io';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'api_service.dart';
import '../offline/queue_manager.dart';

class TechnicianService {
  final ApiService _apiService = ApiService();
  static final Map<String, DateTime> _lastCallTimestamps = {};
  static const Duration _debounceDelay = Duration(milliseconds: 500);

  Future<bool> _isOnline() async {
    final connectivityResult = await Connectivity().checkConnectivity();
    return connectivityResult != ConnectivityResult.none;
  }

  bool _shouldDebounce(String callKey) {
    final lastCall = _lastCallTimestamps[callKey];
    if (lastCall == null) return false;
    return DateTime.now().difference(lastCall) < _debounceDelay;
  }

  void _recordCall(String callKey) {
    _lastCallTimestamps[callKey] = DateTime.now();
  }

  Future<ApiResult<void>> updateStatus(String bookingId, String status) async {
    if (bookingId.isEmpty) {
      return ApiResult(success: false, error: 'Booking ID cannot be empty');
    }

    final callKey = 'updateStatus_$bookingId';
    if (_shouldDebounce(callKey)) {
      return ApiResult(success: false, error: 'Please wait before updating again');
    }
    _recordCall(callKey);

    final online = await _isOnline();
    if (!online) {
      await QueueManager.addUpdateStatusOperation(bookingId, status);
      return ApiResult(success: true, message: 'queued_offline');
    }

    try {
      await _apiService.put('/bookings/$bookingId/status', {'status': status});
      return ApiResult(success: true);
    } catch (e) {
      return ApiResult(success: false, error: 'Failed to update status: ${e.toString()}');
    }
  }

  Future<ApiResult<void>> addFault(String bookingId, String description) async {
    if (bookingId.isEmpty) {
      return ApiResult(success: false, error: 'Booking ID cannot be empty');
    }

    final online = await _isOnline();
    if (!online) {
      await QueueManager.addFaultOperation(bookingId, description);
      return ApiResult(success: true, message: 'queued_offline');
    }

    try {
      await _apiService.post('/bookings/$bookingId/faults', {
        'description': description,
      });
      return ApiResult(success: true);
    } catch (e) {
      return ApiResult(success: false, error: 'Failed to add fault: ${e.toString()}');
    }
  }

  Future<ApiResult<void>> uploadPhotos(String bookingId, List<File> photos) async {
    if (bookingId.isEmpty) {
      return ApiResult(success: false, error: 'Booking ID cannot be empty');
    }

    final online = await _isOnline();
    if (!online) {
      final photoPaths = photos.map((f) => f.path).toList();
      await QueueManager.addUploadPhotosOperation(bookingId, photoPaths);
      return ApiResult(success: true, message: 'queued_offline');
    }

    try {
      // TODO: Implement photo upload
      // Will need multipart/form-data for file upload
      return ApiResult(success: false, error: 'Not implemented');
    } catch (e) {
      return ApiResult(success: false, error: 'Failed to upload photos: ${e.toString()}');
    }
  }

  Future<dynamic> getNotifications() async {
    try {
      return await _apiService.get('/notifications');
    } catch (e) {
      return ApiResult(success: false, error: 'Failed to get notifications: ${e.toString()}');
    }
  }

  Future<ApiResult<void>> markNotificationAsRead(String notificationId) async {
    try {
      await _apiService.put('/notifications/$notificationId/read', {});
      return ApiResult(success: true);
    } catch (e) {
      return ApiResult(success: false, error: 'Failed to mark as read: ${e.toString()}');
    }
  }

  Future<dynamic> getFaults(String bookingId) async {
    if (bookingId.isEmpty) {
      return ApiResult(success: false, error: 'Booking ID cannot be empty');
    }

    try {
      return await _apiService.get('/bookings/$bookingId/faults');
    } catch (e) {
      return ApiResult(success: false, error: 'Failed to get faults: ${e.toString()}');
    }
  }

  Future<dynamic> getPhotos(String bookingId) async {
    if (bookingId.isEmpty) {
      return ApiResult(success: false, error: 'Booking ID cannot be empty');
    }

    try {
      return await _apiService.get('/bookings/$bookingId/photos');
    } catch (e) {
      return ApiResult(success: false, error: 'Failed to get photos: ${e.toString()}');
    }
  }

  Future<dynamic> getPartsSuggestions(String bookingId) async {
    if (bookingId.isEmpty) {
      return ApiResult(success: false, error: 'Booking ID cannot be empty');
    }

    try {
      return await _apiService.get('/bookings/$bookingId/parts-suggestions');
    } catch (e) {
      return ApiResult(success: false, error: 'Failed to get parts suggestions: ${e.toString()}');
    }
  }
}
