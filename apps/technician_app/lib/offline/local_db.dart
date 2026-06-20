import 'package:hive_flutter/hive_flutter.dart';

class LocalDB {
  static const String _tasksBox = 'tasksBox';
  static const String _faultsBox = 'faultsBox';
  static const String _photosBox = 'photosBox';
  static const String _queueBox = 'queueBox';

  static Future<void> init() async {
    await Hive.initFlutter();
    await Hive.openBox(_tasksBox);
    await Hive.openBox(_faultsBox);
    await Hive.openBox(_photosBox);
    await Hive.openBox(_queueBox);
  }

  static Box get _tasks => Hive.box(_tasksBox);
  static Box get _faults => Hive.box(_faultsBox);
  static Box get _photos => Hive.box(_photosBox);
  static Box get _queue => Hive.box(_queueBox);

  static Future<void> saveTasks(List<dynamic> tasks) async {
    await _tasks.clear();
    final Map<String, dynamic> taskMap = {};
    for (var task in tasks) {
      taskMap[task['id']] = task;
    }
    await _tasks.putAll(taskMap);
  }

  static List<dynamic> getTasks() {
    return _tasks.values.toList();
  }

  static Future<void> saveTask(Map<String, dynamic> task) async {
    await _tasks.put(task['id'], task);
  }

  static dynamic getTask(String id) {
    return _tasks.get(id);
  }

  static Future<void> saveFaults(String bookingId, List<dynamic> faults) async {
    await _faults.put(bookingId, faults);
  }

  static List<dynamic> getFaults(String bookingId) {
    return _faults.get(bookingId, defaultValue: []);
  }

  static Future<void> savePhotos(String bookingId, List<String> photos) async {
    await _photos.put(bookingId, photos);
  }

  static List<String> getPhotos(String bookingId) {
    return _photos.get(bookingId, defaultValue: []);
  }

  static Future<void> saveQueuedOperation(Map<String, dynamic> operation) async {
    await _queue.add(operation);
  }

  static List<dynamic> getQueuedOperations() {
    return _queue.values.toList();
  }

  static Future<void> removeQueuedOperation(dynamic key) async {
    await _queue.delete(key);
  }

  static Future<void> clearQueue() async {
    await _queue.clear();
  }
}
