import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/auth_service.dart';

final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService();
});

final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.watch(authServiceProvider));
});

class AuthState {
  final bool isLoading;
  final bool isAuthenticated;
  final String? userId;
  final String? tenantId;
  final String? userRole;
  final String? userName;
  final String? error;

  AuthState({
    this.isLoading = false,
    this.isAuthenticated = false,
    this.userId,
    this.tenantId,
    this.userRole,
    this.userName,
    this.error,
  });

  AuthState copyWith({
    bool? isLoading,
    bool? isAuthenticated,
    String? userId,
    String? tenantId,
    String? userRole,
    String? userName,
    String? error,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      userId: userId ?? this.userId,
      tenantId: tenantId ?? this.tenantId,
      userRole: userRole ?? this.userRole,
      userName: userName ?? this.userName,
      error: error,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService;

  AuthNotifier(this._authService) : super(AuthState()) {
    _checkAuthStatus();
  }

  AuthService get authService => _authService;

  Future<void> _checkAuthStatus() async {
    state = state.copyWith(isLoading: true);
    try {
      final isLoggedIn = await _authService.isLoggedIn();
      if (isLoggedIn) {
        final userId = await _authService.getUserId();
        final tenantId = await _authService.getTenantId();
        final userRole = await _authService.getUserRole();
        final userName = await _authService.getUserName();

        state = state.copyWith(
          isAuthenticated: true,
          userId: userId,
          tenantId: tenantId,
          userRole: userRole,
          userName: userName,
          isLoading: false,
        );
      } else {
        state = state.copyWith(isLoading: false);
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> login(String username, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _authService.login(username, password, 'default');
      final userId = await _authService.getUserId();
      final tenantIdResult = await _authService.getTenantId();
      final userRole = await _authService.getUserRole();
      final userName = await _authService.getUserName();

      state = state.copyWith(
        isAuthenticated: true,
        userId: userId,
        tenantId: tenantIdResult,
        userRole: userRole,
        userName: userName,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> logout() async {
    state = state.copyWith(isLoading: true);
    try {
      await _authService.logout();
      state = AuthState();
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }
}
