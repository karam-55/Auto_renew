import 'package:flutter/foundation.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'dart:async';
import '../models/notification_item.dart';
import '../services/technician_service.dart';

class NotificationsProvider with ChangeNotifier {
  List<NotificationItem> _notifications = [];
  bool _isLoading = false;
  Timer? _refreshTimer;

  List<NotificationItem> get notifications => _notifications;
  bool get isLoading => _isLoading;
  int get unreadCount => _notifications.where((n) => !n.read).length.clamp(0, _notifications.length);

  NotificationsProvider() {
    _startAutoRefresh();
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  void _startAutoRefresh() {
    _refreshTimer = Timer.periodic(const Duration(seconds: 30), (_) async {
      try {
        final connectivityResult = await Connectivity().checkConnectivity();
        if (connectivityResult != ConnectivityResult.none) {
          loadNotifications();
        }
      } catch (e) {
        // Prevent timer from crashing the app
        // Error will be logged in loadNotifications
      }
    });
  }

  Future<void> loadNotifications() async {
    _isLoading = true;
    notifyListeners();

    try {
      // TODO: Implement load notifications
      // final result = await TechnicianService().getNotifications();
      // if (result.success) {
      //   _notifications = result.data;
      // }
      // Do not clear existing notifications on error
    } catch (e) {
      // Keep existing notifications on error
      // TODO: Log error
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> markAsRead(String notificationId) async {
    // Update locally first for immediate UI feedback
    final index = _notifications.indexWhere((n) => n.id == notificationId);
    if (index != -1) {
      _notifications[index] = NotificationItem(
        id: _notifications[index].id,
        title: _notifications[index].title,
        message: _notifications[index].message,
        type: _notifications[index].type,
        createdAt: _notifications[index].createdAt,
        read: true,
      );
      notifyListeners();
    }

    // Then call API
    try {
      await TechnicianService().markNotificationAsRead(notificationId);
    } catch (e) {
      // TODO: Log error but keep local state
    }
  }
}
