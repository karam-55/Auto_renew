import 'package:flutter/foundation.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../models/booking.dart';
import '../offline/cache_manager.dart';

class TasksProvider with ChangeNotifier {
  List<Booking> _tasks = [];
  bool _isLoading = false;
  bool _hasError = false;
  String? _errorMessage;

  List<Booking> get tasks => _tasks;
  bool get isLoading => _isLoading;
  bool get hasError => _hasError;
  String? get errorMessage => _errorMessage;

  Future<void> loadTasks() async {
    _isLoading = true;
    _hasError = false;
    _errorMessage = null;
    notifyListeners();

    try {
      final connectivityResult = await Connectivity().checkConnectivity();
      
      if (connectivityResult == ConnectivityResult.none) {
        // Offline: load from local DB
        final cachedTasks = CacheManager.getCachedTasks();
        _tasks = cachedTasks.map((t) => Booking.fromJson(t)).toList();
      } else {
        // Online: fetch from API and cache
        // TODO: Implement load tasks logic
        // final result = await TechnicianService().getTasks();
        // _tasks = result;
        // await CacheManager.cacheTasks(result.map((t) => t.toJson()).toList());
      }
    } catch (e) {
      _hasError = true;
      _errorMessage = 'Failed to load tasks: ${e.toString()}';
      // Keep old tasks on error
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> refreshTask(String bookingId) async {
    try {
      // TODO: Implement single task refresh
      // Fetch booking by ID and update only the changed task in _tasks list
      final index = _tasks.indexWhere((t) => t.id == bookingId);
      if (index != -1) {
        // TODO: Fetch updated booking from API
        // final updatedBooking = await TechnicianService().getBooking(bookingId);
        // _tasks[index] = updatedBooking;
        notifyListeners();
      }
    } catch (e) {
      // Prevent crash if booking not found or refresh fails
      _errorMessage = 'Failed to refresh task: ${e.toString()}';
      notifyListeners();
    }
  }

  void clearError() {
    _hasError = false;
    _errorMessage = null;
    notifyListeners();
  }
}
