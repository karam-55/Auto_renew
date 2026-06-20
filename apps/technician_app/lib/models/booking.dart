import 'vehicle.dart';
import 'customer.dart';

class Booking {
  final String id;
  final String status;
  final String serviceType;
  final DateTime scheduledAt;
  final Vehicle vehicle;
  final Customer customer;
  final List<String>? photos;
  final List<String>? faults;
  final List<String>? partsSuggestions;

  Booking({
    required this.id,
    required this.status,
    required this.serviceType,
    required this.scheduledAt,
    required this.vehicle,
    required this.customer,
    this.photos,
    this.faults,
    this.partsSuggestions,
  });

  factory Booking.fromJson(Map<String, dynamic> json) {
    return Booking(
      id: json['id'] ?? '',
      status: json['status'] ?? '',
      serviceType: json['serviceType'] ?? '',
      scheduledAt: DateTime.parse(json['scheduledAt'] ?? DateTime.now().toIso8601String()),
      vehicle: Vehicle.fromJson(json['vehicle'] ?? {}),
      customer: Customer.fromJson(json['customer'] ?? {}),
      photos: json['photos'] != null ? List<String>.from(json['photos']) : null,
      faults: json['faults'] != null ? List<String>.from(json['faults']) : null,
      partsSuggestions: json['partsSuggestions'] != null ? List<String>.from(json['partsSuggestions']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'status': status,
      'serviceType': serviceType,
      'scheduledAt': scheduledAt.toIso8601String(),
      'vehicle': vehicle.toJson(),
      'customer': customer.toJson(),
      'photos': photos,
      'faults': faults,
      'partsSuggestions': partsSuggestions,
    };
  }
}
