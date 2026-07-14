class Service {
  final String id;
  final String name;
  final String? category;
  final int? duration;
  final double? basePrice;

  Service({
    required this.id,
    required this.name,
    this.category,
    this.duration,
    this.basePrice,
  });

  factory Service.fromJson(Map<String, dynamic> json) {
    return Service(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      category: json['category'] is Map
          ? json['category']['name']?.toString()
          : json['category']?.toString(),
      duration: json['duration'] != null ? int.tryParse(json['duration'].toString()) : null,
      basePrice: json['basePrice'] != null ? double.tryParse(json['basePrice'].toString()) : null,
    );
  }
}
