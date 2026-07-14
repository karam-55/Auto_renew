class DealerWarranty {
  final String id;
  final String dealerId;
  final String customerName;
  final String customerPhone;
  final String manufacturer;
  final String vehicleModel;
  final int vehicleYear;
  final String chassisNumber;
  final String plateNumber;
  final int mileage;
  final String color;
  final int durationMonths;
  final double amountPaid;
  final String currency;
  final DateTime? startDate;
  final DateTime? endDate;
  final Map<String, dynamic>? dealer;

  DealerWarranty({
    required this.id,
    required this.dealerId,
    required this.customerName,
    required this.customerPhone,
    required this.manufacturer,
    required this.vehicleModel,
    required this.vehicleYear,
    required this.chassisNumber,
    required this.plateNumber,
    required this.mileage,
    required this.color,
    required this.durationMonths,
    required this.amountPaid,
    this.currency = 'SYP',
    this.startDate,
    this.endDate,
    this.dealer,
  });

  factory DealerWarranty.fromJson(Map<String, dynamic> json) {
    return DealerWarranty(
      id: json['id']?.toString() ?? '',
      dealerId: json['dealerId']?.toString() ?? '',
      customerName: json['customerName']?.toString() ?? '',
      customerPhone: json['customerPhone']?.toString() ?? '',
      manufacturer: json['manufacturer']?.toString() ?? '',
      vehicleModel: json['vehicleModel']?.toString() ?? '',
      vehicleYear: json['vehicleYear'] != null ? int.tryParse(json['vehicleYear'].toString()) ?? 0 : 0,
      chassisNumber: json['chassisNumber']?.toString() ?? '',
      plateNumber: json['plateNumber']?.toString() ?? '',
      mileage: json['mileage'] != null ? int.tryParse(json['mileage'].toString()) ?? 0 : 0,
      color: json['color']?.toString() ?? '',
      durationMonths: json['durationMonths'] != null ? int.tryParse(json['durationMonths'].toString()) ?? 0 : 0,
      amountPaid: json['amountPaid'] != null ? double.tryParse(json['amountPaid'].toString()) ?? 0 : 0,
      currency: json['currency']?.toString() ?? 'SYP',
      startDate: json['startDate'] != null ? DateTime.tryParse(json['startDate'].toString()) : null,
      endDate: json['endDate'] != null ? DateTime.tryParse(json['endDate'].toString()) : null,
      dealer: json['dealer'] is Map<String, dynamic> ? json['dealer'] as Map<String, dynamic> : null,
    );
  }

  String get dealerName => dealer != null
      ? (dealer!['companyName']?.toString() ?? dealer!['name']?.toString() ?? '')
      : '';

  String get vehicleName => '$manufacturer $vehicleModel';

  String get amountWithCurrency =>
      '${amountPaid.toStringAsFixed(amountPaid.truncateToDouble() == amountPaid ? 0 : 2)} ${currency == 'USD' ? '\$' : 'ل.س'}';
}
