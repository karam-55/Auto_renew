import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../services/technician_service.dart';
import 'queue_manager.dart';

class SyncService {
  static Timer? _autoSyncTimer;
  static bool _isSyncing = false;

  static Future<void> syncAll() async {
    if (_isSyncing) return;
    _isSyncing = true;

    final operations = QueueManager.getQueuedOperations();
    
    for (var operation in operations) {
      try {
        final type = operation['type'];
        final payload = operation['payload'] as Map<String, dynamic>;

        switch (type) {
          case 'addFault':
            await TechnicianService().addFault(
              payload['bookingId'],
              payload['description'],
            );
            break;
          case 'updateStatus':
            await TechnicianService().updateStatus(
              payload['bookingId'],
              payload['status'],
            );
            break;
          case 'uploadPhotos':
            // Photos need to be File objects, but we stored paths
            // This is a simplified version - in production, you'd need to handle file paths
            break;
        }

        await QueueManager.removeOperation(operation['id']);
      } catch (e) {
        // Log sync failure but continue with other operations
      }
    }

    _isSyncing = false;
  }

  static void startAutoSyncTimer() {
    _autoSyncTimer?.cancel();
    _autoSyncTimer = Timer.periodic(const Duration(minutes: 5), (timer) async {
      final connectivityResult = await Connectivity().checkConnectivity();
      if (connectivityResult != ConnectivityResult.none) {
        await syncAll();
      }
    });
  }

  static void stopAutoSyncTimer() {
    _autoSyncTimer?.cancel();
    _autoSyncTimer = null;
  }

  static bool get isSyncing => _isSyncing;
}
