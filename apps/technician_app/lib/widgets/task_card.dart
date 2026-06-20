import 'package:flutter/material.dart';
import '../models/booking.dart';
import 'status_badge.dart';

class TaskCard extends StatelessWidget {
  final Booking booking;

  const TaskCard({super.key, required this.booking});

  Color _getBackgroundColor(String status) {
    switch (status.toUpperCase()) {
      case 'RECEIVED':
        return Colors.blue.withOpacity(0.1);
      case 'IN_PROGRESS':
        return Colors.orange.withOpacity(0.1);
      case 'WAITING_CUSTOMER':
        return Colors.purple.withOpacity(0.1);
      case 'COMPLETED':
        return Colors.green.withOpacity(0.1);
      default:
        return Colors.transparent;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      color: _getBackgroundColor(booking.status),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    booking.serviceType,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${booking.vehicle.plateNumber} - ${booking.vehicle.brand} ${booking.vehicle.model}',
                    style: const TextStyle(color: Colors.grey, fontSize: 14),
                  ),
                  const SizedBox(height: 12),
                  StatusBadge(status: booking.status),
                ],
              ),
            ),
            const SizedBox(width: 12),
            const Icon(Icons.chevron_right, color: Colors.grey),
          ],
        ),
      ),
    );
  }
}
