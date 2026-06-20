import 'package:hive/hive.dart';

part 'offline_task.g.dart';

@HiveType(typeId: 0)
class OfflineTask extends HiveObject {
  @HiveField(0)
  String id;

  @HiveField(1)
  String type;

  @HiveField(2)
  Map<String, dynamic> payload;

  @HiveField(3)
  DateTime timestamp;

  OfflineTask({
    required this.id,
    required this.type,
    required this.payload,
    required this.timestamp,
  });
}
