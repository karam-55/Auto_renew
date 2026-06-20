import 'local_db.dart';

class QueueManager {
  static Future<void> addFaultOperation(String bookingId, String description) async {
    final operation = {
      'id': DateTime.now().millisecondsSinceEpoch.toString(),
      'type': 'addFault',
      'payload': {
        'bookingId': bookingId,
        'description': description,
      },
      'timestamp': DateTime.now().toIso8601String(),
    };
    await LocalDB.saveQueuedOperation(operation);
  }

  static Future<void> addUpdateStatusOperation(String bookingId, String status) async {
    final operation = {
      'id': DateTime.now().millisecondsSinceEpoch.toString(),
      'type': 'updateStatus',
      'payload': {
        'bookingId': bookingId,
        'status': status,
      },
      'timestamp': DateTime.now().toIso8601String(),
    };
    await LocalDB.saveQueuedOperation(operation);
  }

  static Future<void> addUploadPhotosOperation(String bookingId, List<String> photos) async {
    final operation = {
      'id': DateTime.now().millisecondsSinceEpoch.toString(),
      'type': 'uploadPhotos',
      'payload': {
        'bookingId': bookingId,
        'photos': photos,
      },
      'timestamp': DateTime.now().toIso8601String(),
    };
    await LocalDB.saveQueuedOperation(operation);
  }

  static List<dynamic> getQueuedOperations() {
    return LocalDB.getQueuedOperations();
  }

  static Future<void> removeOperation(dynamic key) async {
    await LocalDB.removeQueuedOperation(key);
  }

  static Future<void> clearQueue() async {
    await LocalDB.clearQueue();
  }
}
