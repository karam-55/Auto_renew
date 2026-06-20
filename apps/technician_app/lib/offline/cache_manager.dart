import 'local_db.dart';

class CacheManager {
  static Future<void> cacheTasks(List<dynamic> tasks) async {
    await LocalDB.saveTasks(tasks);
  }

  static Future<void> cacheTask(Map<String, dynamic> task) async {
    await LocalDB.saveTask(task);
  }

  static Future<void> cacheFaults(String bookingId, List<dynamic> faults) async {
    await LocalDB.saveFaults(bookingId, faults);
  }

  static Future<void> cachePhotos(String bookingId, List<String> photos) async {
    await LocalDB.savePhotos(bookingId, photos);
  }

  static List<dynamic> getCachedTasks() {
    return LocalDB.getTasks();
  }

  static dynamic getCachedTask(String id) {
    return LocalDB.getTask(id);
  }

  static List<dynamic> getCachedFaults(String bookingId) {
    return LocalDB.getFaults(bookingId);
  }

  static List<String> getCachedPhotos(String bookingId) {
    return LocalDB.getPhotos(bookingId);
  }
}
