import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../core/theme/luxury_theme.dart';
import '../services/booking_service.dart';
import '../models/booking.dart';

class BookingsListScreen extends StatefulWidget {
  const BookingsListScreen({super.key});

  @override
  State<BookingsListScreen> createState() => _BookingsListScreenState();
}

class _BookingsListScreenState extends State<BookingsListScreen> {
  final BookingService _bookingService = BookingService();
  List<Booking> _bookings = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadBookings();
  }

  Future<void> _loadBookings() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final bookings = await _bookingService.getMyBookings();
      setState(() {
        _bookings = bookings;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              LuxuryTheme.primaryColor.withOpacity(0.1),
              LuxuryTheme.backgroundColor,
            ],
          ),
        ),
        child: Column(
          children: [
            // Header
            Container(
              padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 16.h),
              decoration: BoxDecoration(
                color: LuxuryTheme.cardColor,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back),
                    color: LuxuryTheme.primaryColor,
                    onPressed: () => Navigator.pop(context),
                  ),
                  SizedBox(width: 16.w),
                  Expanded(
                    child: Text(
                      'حجوزاتي',
                      style: TextStyle(
                        fontSize: 20.sp,
                        fontWeight: FontWeight.bold,
                        color: LuxuryTheme.textColor,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.refresh),
                    color: LuxuryTheme.primaryColor,
                    onPressed: _loadBookings,
                  ),
                ],
              ),
            ),
            // Content
            Expanded(
              child: _buildContent(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64.sp, color: Colors.red),
            SizedBox(height: 16.h),
            Text(
              'حدث خطأ',
              style: TextStyle(fontSize: 18.sp, color: LuxuryTheme.textColor),
            ),
            SizedBox(height: 8.h),
            Text(
              _error!,
              style: TextStyle(fontSize: 14.sp, color: LuxuryTheme.textColor.withOpacity(0.7)),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 16.h),
            ElevatedButton(
              onPressed: _loadBookings,
              style: ElevatedButton.styleFrom(
                backgroundColor: LuxuryTheme.primaryColor,
                foregroundColor: Colors.white,
              ),
              child: const Text('إعادة المحاولة'),
            ),
          ],
        ),
      );
    }

    if (_bookings.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.event_note, size: 64.sp, color: LuxuryTheme.textColor.withOpacity(0.5)),
            SizedBox(height: 16.h),
            Text(
              'لا توجد حجوزات',
              style: TextStyle(fontSize: 18.sp, color: LuxuryTheme.textColor),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: EdgeInsets.all(16.w),
      itemCount: _bookings.length,
      itemBuilder: (context, index) {
        final booking = _bookings[index];
        return _buildBookingCard(booking);
      },
    );
  }

  Widget _buildBookingCard(Booking booking) {
    return Container(
      margin: EdgeInsets.only(bottom: 16.h),
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        color: LuxuryTheme.cardColor,
        borderRadius: BorderRadius.circular(12.r),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'حجز #${booking.id.substring(0, 8)}',
                style: TextStyle(
                  fontSize: 16.sp,
                  fontWeight: FontWeight.bold,
                  color: LuxuryTheme.textColor,
                ),
              ),
              _buildStatusBadge(booking.status),
            ],
          ),
          SizedBox(height: 12.h),
          if (booking.customerName != null) ...[
            Row(
              children: [
                Icon(Icons.person, size: 16.sp, color: LuxuryTheme.textColor.withOpacity(0.7)),
                SizedBox(width: 8.w),
                Text(
                  booking.customerName!,
                  style: TextStyle(fontSize: 14.sp, color: LuxuryTheme.textColor.withOpacity(0.7)),
                ),
              ],
            ),
            SizedBox(height: 8.h),
          ],
          if (booking.vehicleInfo != null) ...[
            Row(
              children: [
                Icon(Icons.directions_car, size: 16.sp, color: LuxuryTheme.textColor.withOpacity(0.7)),
                SizedBox(width: 8.w),
                Text(
                  booking.vehicleInfo!,
                  style: TextStyle(fontSize: 14.sp, color: LuxuryTheme.textColor.withOpacity(0.7)),
                ),
              ],
            ),
            SizedBox(height: 8.h),
          ],
          Row(
            children: [
              Icon(Icons.calendar_today, size: 16.sp, color: LuxuryTheme.textColor.withOpacity(0.7)),
              SizedBox(width: 8.w),
              Text(
                booking.bookingDate != null
                    ? booking.bookingDate!.toString().split(' ')[0]
                    : 'غير محدد',
                style: TextStyle(fontSize: 14.sp, color: LuxuryTheme.textColor.withOpacity(0.7)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color backgroundColor;
    Color textColor;

    switch (status.toUpperCase()) {
      case 'PENDING':
        backgroundColor = Colors.orange.withOpacity(0.2);
        textColor = Colors.orange;
        break;
      case 'IN_PROGRESS':
        backgroundColor = Colors.blue.withOpacity(0.2);
        textColor = Colors.blue;
        break;
      case 'READY':
        backgroundColor = Colors.green.withOpacity(0.2);
        textColor = Colors.green;
        break;
      case 'DELIVERED':
        backgroundColor = Colors.grey.withOpacity(0.2);
        textColor = Colors.grey;
        break;
      case 'CANCELLED':
        backgroundColor = Colors.red.withOpacity(0.2);
        textColor = Colors.red;
        break;
      default:
        backgroundColor = Colors.grey.withOpacity(0.2);
        textColor = Colors.grey;
    }

    return Container(
      padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 6.h),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(8.r),
      ),
      child: Text(
        _getStatusText(status),
        style: TextStyle(
          fontSize: 12.sp,
          fontWeight: FontWeight.bold,
          color: textColor,
        ),
      ),
    );
  }

  String _getStatusText(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'قيد الانتظار';
      case 'IN_PROGRESS':
        return 'قيد العمل';
      case 'READY':
        return 'جاهز';
      case 'DELIVERED':
        return 'تم التسليم';
      case 'CANCELLED':
        return 'ملغي';
      default:
        return status;
    }
  }
}
