class Booking {
  final String id;
  final String tenantId;
  final String customerId;
  final String vehicleId;
  final DateTime scheduledDate;
  final String? scheduledTime;
  final String status;
  final String priority;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;
  final Customer? customer;
  final Vehicle? vehicle;
  final List<Service>? services;

  Booking({
    required this.id,
    required this.tenantId,
    required this.customerId,
    required this.vehicleId,
    required this.scheduledDate,
    this.scheduledTime,
    required this.status,
    required this.priority,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
    this.customer,
    this.vehicle,
    this.services,
  });

  factory Booking.fromJson(Map<String, dynamic> json) {
    return Booking(
      id: json['id'],
      tenantId: json['tenantId'],
      customerId: json['customerId'],
      vehicleId: json['vehicleId'],
      scheduledDate: DateTime.parse(json['scheduledDate']),
      scheduledTime: json['scheduledTime'],
      status: json['status'],
      priority: json['priority'],
      notes: json['notes'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
      customer: json['customer'] != null ? Customer.fromJson(json['customer']) : null,
      vehicle: json['vehicle'] != null ? Vehicle.fromJson(json['vehicle']) : null,
      services: json['services'] != null
          ? (json['services'] as List).map((s) => Service.fromJson(s)).toList()
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'tenantId': tenantId,
      'customerId': customerId,
      'vehicleId': vehicleId,
      'scheduledDate': scheduledDate.toIso8601String(),
      'scheduledTime': scheduledTime,
      'status': status,
      'priority': priority,
      'notes': notes,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'customer': customer?.toJson(),
      'vehicle': vehicle?.toJson(),
      'services': services?.map((s) => s.toJson()).toList(),
    };
  }
}

class Customer {
  final String id;
  final String fullName;
  final String phone;

  Customer({
    required this.id,
    required this.fullName,
    required this.phone,
  });

  factory Customer.fromJson(Map<String, dynamic> json) {
    return Customer(
      id: json['id'],
      fullName: json['fullName'],
      phone: json['phone'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fullName': fullName,
      'phone': phone,
    };
  }
}

class Vehicle {
  final String id;
  final String make;
  final String model;
  final int year;
  final String licensePlate;

  Vehicle({
    required this.id,
    required this.make,
    required this.model,
    required this.year,
    required this.licensePlate,
  });

  factory Vehicle.fromJson(Map<String, dynamic> json) {
    return Vehicle(
      id: json['id'],
      make: json['make'],
      model: json['model'],
      year: json['year'],
      licensePlate: json['licensePlate'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'make': make,
      'model': model,
      'year': year,
      'licensePlate': licensePlate,
    };
  }
}

class Service {
  final String id;
  final String name;
  final String category;
  final int duration;
  final double basePrice;

  Service({
    required this.id,
    required this.name,
    required this.category,
    required this.duration,
    required this.basePrice,
  });

  factory Service.fromJson(Map<String, dynamic> json) {
    return Service(
      id: json['id'],
      name: json['name'],
      category: json['category'],
      duration: json['duration'],
      basePrice: (json['basePrice'] as num).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'category': category,
      'duration': duration,
      'basePrice': basePrice,
    };
  }
}
