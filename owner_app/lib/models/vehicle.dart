class Vehicle {
  final String id;
  final String customerId;
  final String make;
  final String model;
  final int? year;
  final String? licensePlate;
  final String? vin;
  final String? color;
  final int? mileage;
  final Map<String, dynamic>? customer;

  Vehicle({
    required this.id,
    required this.customerId,
    required this.make,
    required this.model,
    this.year,
    this.licensePlate,
    this.vin,
    this.color,
    this.mileage,
    this.customer,
  });

  factory Vehicle.fromJson(Map<String, dynamic> json) {
    return Vehicle(
      id: json['id']?.toString() ?? '',
      customerId: json['customerId']?.toString() ?? json['customer_id']?.toString() ?? '',
      make: json['make']?.toString() ?? '',
      model: json['model']?.toString() ?? '',
      year: json['year'] != null ? int.tryParse(json['year'].toString()) : null,
      licensePlate: json['licensePlate']?.toString() ?? json['license_plate']?.toString(),
      vin: json['vin']?.toString() ?? json['VIN']?.toString(),
      color: json['color']?.toString(),
      mileage: json['mileage'] != null ? int.tryParse(json['mileage'].toString()) : null,
      customer: json['customer'] is Map<String, dynamic> ? json['customer'] as Map<String, dynamic> : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'customerId': customerId,
      'make': make,
      'model': model,
      if (year != null) 'year': year,
      if (licensePlate != null && licensePlate!.isNotEmpty) 'licensePlate': licensePlate,
      if (vin != null && vin!.isNotEmpty) 'vin': vin,
      if (color != null && color!.isNotEmpty) 'color': color,
      if (mileage != null) 'mileage': mileage,
    };
  }

  String get displayName => '$make $model';

  String get customerName => customer != null
      ? (customer!['fullName']?.toString() ?? '')
      : '';

  Vehicle copyWith({
    String? id,
    String? customerId,
    String? make,
    String? model,
    int? year,
    String? licensePlate,
    String? vin,
    String? color,
    int? mileage,
    Map<String, dynamic>? customer,
  }) {
    return Vehicle(
      id: id ?? this.id,
      customerId: customerId ?? this.customerId,
      make: make ?? this.make,
      model: model ?? this.model,
      year: year ?? this.year,
      licensePlate: licensePlate ?? this.licensePlate,
      vin: vin ?? this.vin,
      color: color ?? this.color,
      mileage: mileage ?? this.mileage,
      customer: customer ?? this.customer,
    );
  }
}
