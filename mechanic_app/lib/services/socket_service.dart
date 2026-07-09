import 'package:flutter/material.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:shared_preferences/shared_preferences.dart';
import '../core/config/app_config.dart';
import '../core/config/app_keys.dart';

enum SocketConnectionState {
  disconnected,
  connecting,
  connected,
  error,
}

class SocketService {
  static SocketService? _instance;
  static SocketService get instance => _instance ??= SocketService._internal();

  io.Socket? _socket;
  SocketConnectionState _connectionState = SocketConnectionState.disconnected;
  final _connectionStateController = ValueNotifier<SocketConnectionState>(SocketConnectionState.disconnected);
  String? _userId;
  String? _tenantId;
  VoidCallback? _onNewAssignment;
  VoidCallback? _onBookingStatusChanged;

  SocketService._internal();

  ValueNotifier<SocketConnectionState> get connectionState => _connectionStateController;
  bool get isConnected => _connectionState == SocketConnectionState.connected;
  SocketConnectionState get currentConnectionState => _connectionState;

  void setOnNewAssignmentCallback(VoidCallback? callback) {
    _onNewAssignment = callback;
  }

  void setOnBookingStatusChangedCallback(VoidCallback? callback) {
    _onBookingStatusChanged = callback;
  }

  Future<void> connect() async {
    if (_socket != null && _socket!.connected) {
      return;
    }

    _setConnectionState(SocketConnectionState.connecting);

    try {
      final prefs = await SharedPreferences.getInstance();
      _userId = prefs.getString('userId');
      _tenantId = prefs.getString('tenantId');

      if (_userId == null || _tenantId == null) {
        _setConnectionState(SocketConnectionState.disconnected);
        return;
      }

      _socket = io.io(AppConfig.serverUrl, <String, dynamic>{
        'transports': ['websocket'],
        'autoConnect': false,
      });

      _setupSocketListeners();
      _socket!.connect();
    } catch (e) {
      _setConnectionState(SocketConnectionState.error);
      _showErrorNotification('Connection error: $e');
    }
  }

  void _setupSocketListeners() {
    if (_socket == null) return;

    _socket!.onConnect((_) {
      _setConnectionState(SocketConnectionState.connected);
      debugPrint('Socket connected: ${_socket!.id}');

      // Join user room
      if (_userId != null) {
        _socket!.emit('join-user', _userId);
        debugPrint('Joined user room: user:$_userId');
      }

      // Join tenant room
      if (_tenantId != null) {
        _socket!.emit('join-tenant', _tenantId);
        debugPrint('Joined tenant room: tenant:$_tenantId');
      }
    });

    _socket!.onDisconnect((_) {
      _setConnectionState(SocketConnectionState.disconnected);
      debugPrint('Socket disconnected');
    });

    _socket!.onConnectError((error) {
      _setConnectionState(SocketConnectionState.error);
      debugPrint('Socket connection error: $error');
      _showErrorNotification('Connection error: $error');
    });

    _socket!.onError((error) {
      debugPrint('Socket error: $error');
    });

    // Listen for new mechanic assignments
    _socket!.on('mechanic:assignment-created', (data) {
      debugPrint('New mechanic assignment: $data');
      _showAssignmentNotification(data);
      _onNewAssignment?.call();
    });

    // Listen for assignment removals
    _socket!.on('mechanic:assignment-removed', (data) {
      debugPrint('Mechanic assignment removed: $data');
      _showAssignmentRemovedNotification(data);
    });

    // Listen for booking status changes
    _socket!.on('booking:status-changed', (data) {
      debugPrint('Booking status changed: $data');
      _showBookingStatusNotification(data);
      _onBookingStatusChanged?.call();
    });

    // Listen for new notifications
    _socket!.on('notification:new', (data) {
      debugPrint('New notification: $data');
      _showNotification(data);
    });

    // Listen for broadcast notifications
    _socket!.on('notification:broadcast', (data) {
      debugPrint('Broadcast notification: $data');
      _showNotification(data);
    });
  }

  void _setConnectionState(SocketConnectionState state) {
    _connectionState = state;
    _connectionStateController.value = state;
  }

  void _showAssignmentNotification(dynamic data) {
    final customerName = data['customerName'] ?? 'Customer';
    final vehicleInfo = data['vehicleInfo'] ?? 'Vehicle';
    final scheduledDate = data['scheduledDate'];
    final status = data['status'] ?? 'PENDING';

    AppKeys.scaffoldMessengerKey.currentState?.showSnackBar(
      SnackBar(
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('New Task Assigned', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text('Customer: $customerName'),
            Text('Vehicle: $vehicleInfo'),
            if (scheduledDate != null) Text('Scheduled: ${scheduledDate.toString()}'),
            Text('Status: $status'),
          ],
        ),
        backgroundColor: Colors.green,
        duration: const Duration(seconds: 6),
        action: SnackBarAction(
          label: 'View',
          textColor: Colors.white,
          onPressed: () {
            // Navigate to booking details
          },
        ),
      ),
    );
  }

  void _showAssignmentRemovedNotification(dynamic data) {
    final bookingId = data['bookingId'] ?? 'Unknown';

    AppKeys.scaffoldMessengerKey.currentState?.showSnackBar(
      SnackBar(
        content: Text('Removed from booking #$bookingId'),
        backgroundColor: Colors.orange,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  void _showBookingStatusNotification(dynamic data) {
    final bookingId = data['bookingId'] ?? 'Unknown';
    final oldStatus = data['oldStatus'] ?? 'Unknown';
    final newStatus = data['newStatus'] ?? 'Unknown';

    AppKeys.scaffoldMessengerKey.currentState?.showSnackBar(
      SnackBar(
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Booking #$bookingId Status Changed'),
            const SizedBox(height: 4),
            Text('$oldStatus → $newStatus'),
          ],
        ),
        backgroundColor: Colors.blue,
        duration: const Duration(seconds: 4),
      ),
    );
  }

  void _showNotification(dynamic data) {
    final title = data['title'] ?? 'Notification';
    final message = data['message'] ?? '';
    final type = data['type'] ?? 'INFO';

    Color backgroundColor = Colors.blue;
    if (type == 'SUCCESS') backgroundColor = Colors.green;
    if (type == 'WARNING') backgroundColor = Colors.orange;
    if (type == 'ERROR') backgroundColor = Colors.red;

    AppKeys.scaffoldMessengerKey.currentState?.showSnackBar(
      SnackBar(
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text(message),
          ],
        ),
        backgroundColor: backgroundColor,
        duration: const Duration(seconds: 4),
      ),
    );
  }

  void _showErrorNotification(String message) {
    AppKeys.scaffoldMessengerKey.currentState?.showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  void disconnect() {
    if (_socket != null) {
      _socket!.disconnect();
      _socket!.dispose();
      _socket = null;
    }
    _setConnectionState(SocketConnectionState.disconnected);
  }
}
