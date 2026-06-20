import 'package:flutter/foundation.dart';
import '../services/api_service.dart';
import '../models/technician.dart';

class AuthProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();

  bool _isAuthenticated = false;
  bool _isLoading = false;
  String? _errorMessage;
  Technician? _technician;

  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  Technician? get technician => _technician;

  Future<void> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final result = await _apiService.login(email, password);
      
      if (result.success && result.data != null) {
        _isAuthenticated = true;
        // TODO: Parse technician data from result.data
        // _technician = Technician.fromJson(result.data);
        _apiService.token = result.data?['token'];
      } else {
        _errorMessage = result.error ?? 'Login failed';
      }
    } catch (e) {
      _errorMessage = 'An error occurred: ${e.toString()}';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void logout() {
    _isAuthenticated = false;
    _technician = null;
    _apiService.token = null;
    _errorMessage = null;
    notifyListeners();
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
