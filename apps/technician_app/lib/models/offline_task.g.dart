// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'offline_task.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class OfflineTaskAdapter extends TypeAdapter<OfflineTask> {
  @override
  final int typeId = 0;

  @override
  OfflineTask read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return OfflineTask(
      id: fields[0] as String,
      type: fields[1] as String,
      payload: (fields[2] as Map).cast<String, dynamic>(),
      timestamp: fields[3] as DateTime,
    );
  }

  @override
  void write(BinaryWriter writer, OfflineTask obj) {
    writer
      ..writeByte(4)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.type)
      ..writeByte(2)
      ..write(obj.payload)
      ..writeByte(3)
      ..write(obj.timestamp);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is OfflineTaskAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
