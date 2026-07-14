class Dealer {
  final String id;
  final String name;
  final String companyName;
  final String phone;
  final String? address;
  final String? city;
  final String status;
  final bool isActive;
  final int warrantyCount;
  final DateTime? createdAt;

  Dealer({
    required this.id,
    required this.name,
    required this.companyName,
    required this.phone,
    this.address,
    this.city,
    this.status = 'ACTIVE',
    this.isActive = true,
    this.warrantyCount = 0,
    this.createdAt,
  });

  factory Dealer.fromJson(Map<String, dynamic> json) {
    return Dealer(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      companyName: json['companyName']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      address: json['address']?.toString(),
      city: json['city']?.toString(),
      status: json['status']?.toString() ?? 'ACTIVE',
      isActive: json['isActive'] ?? true,
      warrantyCount: json['warrantyCount'] ?? json['_count']?['dealerWarranties'] ?? 0,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'companyName': companyName,
      'phone': phone,
      if (address != null && address!.isNotEmpty) 'address': address,
      if (city != null && city!.isNotEmpty) 'city': city,
      'status': status,
      'isActive': isActive,
    };
  }

  Dealer copyWith({
    String? id,
    String? name,
    String? companyName,
    String? phone,
    String? address,
    String? city,
    String? status,
    bool? isActive,
    int? warrantyCount,
    DateTime? createdAt,
  }) {
    return Dealer(
      id: id ?? this.id,
      name: name ?? this.name,
      companyName: companyName ?? this.companyName,
      phone: phone ?? this.phone,
      address: address ?? this.address,
      city: city ?? this.city,
      status: status ?? this.status,
      isActive: isActive ?? this.isActive,
      warrantyCount: warrantyCount ?? this.warrantyCount,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
