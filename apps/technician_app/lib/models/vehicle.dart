class Vehicle {
  final String id;
  final String plateNumber;
  final String brand;
  final String model;
  final int year;

  Vehicle({
    required this.id,
    required this.plateNumber,
    required this.brand,
    required this.model,
    required this.year,
  });

  factory Vehicle.fromJson(Map<String, dynamic> json) {
    return Vehicle(
      id: json['id'] as String,
      plateNumber: json['plateNumber'] as String,
      brand: json['brand'] as String,
      model: json['model'] as String,
      year: json['year'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'plateNumber': plateNumber,
      'brand': brand,
      'model': model,
      'year': year,
    };
  }
}
