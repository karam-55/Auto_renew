class Booking {
  final String id;
  final String customerId;
  final String vehicleId;
  final DateTime? scheduledDate;
  final String? scheduledTime;
  final String status;
  final String priority;
  final String? paymentMethod;
  final String? notes;
  final DateTime? estimatedCompletionDate;
  final List<Map<String, dynamic>> services;
  final Map<String, dynamic>? customer;
  final Map<String, dynamic>? vehicle;

  Booking({
    required this.id,
    required this.customerId,
    required this.vehicleId,
    this.scheduledDate,
    this.scheduledTime,
    this.status = 'PENDING',
    this.priority = 'NORMAL',
    this.paymentMethod,
    this.notes,
    this.estimatedCompletionDate,
    this.services = const [],
    this.customer,
    this.vehicle,
  });

  factory Booking.fromJson(Map<String, dynamic> json) {
    List<Map<String, dynamic>> parseServices() {
      final raw = json['services'] ?? json['bookingServices'];
      if (raw is! List) return [];
      return raw.whereType<Map<String, dynamic>>().toList();
    }

    return Booking(
      id: json['id']?.toString() ?? '',
      customerId: json['customerId']?.toString() ?? '',
      vehicleId: json['vehicleId']?.toString() ?? '',
      scheduledDate: json['scheduledDate'] != null
          ? DateTime.tryParse(json['scheduledDate'].toString())
          : null,
      scheduledTime: json['scheduledTime']?.toString(),
      status: json['status']?.toString() ?? 'PENDING',
      priority: json['priority']?.toString() ?? 'NORMAL',
      paymentMethod: json['paymentMethod']?.toString() ?? 'CASH',
      notes: json['notes']?.toString(),
      estimatedCompletionDate: json['estimatedCompletionDate'] != null
          ? DateTime.tryParse(json['estimatedCompletionDate'].toString())
          : null,
      services: parseServices(),
      customer: json['customer'] is Map<String, dynamic> ? json['customer'] as Map<String, dynamic> : null,
      vehicle: json['vehicle'] is Map<String, dynamic> ? json['vehicle'] as Map<String, dynamic> : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'customerId': customerId,
      'vehicleId': vehicleId,
      'scheduledDate': scheduledDate?.toIso8601String(),
      'scheduledTime': scheduledTime,
      'status': status,
      'priority': priority,
      'paymentMethod': paymentMethod ?? 'CASH',
      if (notes != null && notes!.isNotEmpty) 'notes': notes,
      'serviceIds': services.map((s) => s['id']?.toString() ?? s['serviceId']?.toString()).where((e) => e != null && e.isNotEmpty).toList(),
    };
  }

  String get customerName => customer != null
      ? (customer!['fullName']?.toString() ?? '')
      : '';

  String get vehicleName {
    if (vehicle == null) return '';
    final make = vehicle!['make']?.toString() ?? '';
    final model = vehicle!['model']?.toString() ?? '';
    final plate = vehicle!['licensePlate']?.toString() ?? '';
    return '$make $model ${plate.isNotEmpty ? '($plate)' : ''}'.trim();
  }

  String get servicesLabel {
    if (services.isEmpty) return 'بدون خدمات';
    final names = services.map((s) {
      final svc = s['service'];
      if (svc is Map) return svc['name']?.toString() ?? '';
      return s['name']?.toString() ?? '';
    }).where((n) => n.isNotEmpty).toList();
    return names.isEmpty ? 'بدون خدمات' : names.join(', ');
  }

  Booking copyWith({
    String? id,
    String? customerId,
    String? vehicleId,
    DateTime? scheduledDate,
    String? scheduledTime,
    String? status,
    String? priority,
    String? paymentMethod,
    String? notes,
    DateTime? estimatedCompletionDate,
    List<Map<String, dynamic>>? services,
    Map<String, dynamic>? customer,
    Map<String, dynamic>? vehicle,
  }) {
    return Booking(
      id: id ?? this.id,
      customerId: customerId ?? this.customerId,
      vehicleId: vehicleId ?? this.vehicleId,
      scheduledDate: scheduledDate ?? this.scheduledDate,
      scheduledTime: scheduledTime ?? this.scheduledTime,
      status: status ?? this.status,
      priority: priority ?? this.priority,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      notes: notes ?? this.notes,
      estimatedCompletionDate: estimatedCompletionDate ?? this.estimatedCompletionDate,
      services: services ?? this.services,
      customer: customer ?? this.customer,
      vehicle: vehicle ?? this.vehicle,
    );
  }
}
