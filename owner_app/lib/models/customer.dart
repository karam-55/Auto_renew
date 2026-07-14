class Customer {
  final String id;
  final String fullName;
  final String phone;
  final String? address;
  final String? city;
  final String? notes;
  final bool isActive;
  final DateTime? createdAt;

  Customer({
    required this.id,
    required this.fullName,
    required this.phone,
    this.address,
    this.city,
    this.notes,
    this.isActive = true,
    this.createdAt,
  });

  factory Customer.fromJson(Map<String, dynamic> json) {
    return Customer(
      id: json['id']?.toString() ?? '',
      fullName: json['fullName']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      address: json['address']?.toString(),
      city: json['city']?.toString(),
      notes: json['notes']?.toString(),
      isActive: json['isActive'] ?? true,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'fullName': fullName,
      'phone': phone,
      if (address != null && address!.isNotEmpty) 'address': address,
      if (city != null && city!.isNotEmpty) 'city': city,
      if (notes != null && notes!.isNotEmpty) 'notes': notes,
      'isActive': isActive,
    };
  }

  Customer copyWith({
    String? id,
    String? fullName,
    String? phone,
    String? address,
    String? city,
    String? notes,
    bool? isActive,
    DateTime? createdAt,
  }) {
    return Customer(
      id: id ?? this.id,
      fullName: fullName ?? this.fullName,
      phone: phone ?? this.phone,
      address: address ?? this.address,
      city: city ?? this.city,
      notes: notes ?? this.notes,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
