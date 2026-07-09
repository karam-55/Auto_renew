import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:animate_do/animate_do.dart';
import 'package:flutter_slidable/flutter_slidable.dart';
import '../providers/auth_provider.dart';
import '../services/booking_service.dart';
import '../services/socket_service.dart';
import '../models/booking.dart';
import '../core/theme/app_theme.dart';
import 'booking_detail_screen.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final BookingService _bookingService = BookingService();
  List<Booking> _bookings = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadBookings();
    
    // Listen for socket events to refresh bookings
    SocketService.instance.connectionState.addListener(_onSocketStateChanged);
    SocketService.instance.setOnNewAssignmentCallback(_refreshOnNewAssignment);
    SocketService.instance.setOnBookingStatusChangedCallback(_refreshOnNewAssignment);
  }

  @override
  void dispose() {
    SocketService.instance.connectionState.removeListener(_onSocketStateChanged);
    SocketService.instance.setOnNewAssignmentCallback(null);
    SocketService.instance.setOnBookingStatusChangedCallback(null);
    super.dispose();
  }

  void _onSocketStateChanged() {
    // Refresh bookings when socket connects or receives new data
    if (SocketService.instance.isConnected) {
      _loadBookings();
    }
  }
  
  void _refreshOnNewAssignment() {
    // Refresh bookings when a new assignment is received via socket
    _loadBookings();
  }

  Future<void> _loadBookings() async {
    final authState = ref.read(authStateProvider);
    final userId = authState.userId;
    if (userId == null) {
      setState(() {
        _isLoading = false;
      });
      return;
    }

    try {
      final bookings = await _bookingService.getAssignedBookings(userId);
      setState(() {
        _bookings = bookings;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load bookings: $e')),
        );
      }
    }
  }

  Future<void> _updateBookingStatus(Booking booking, String newStatus) async {
    try {
      await _bookingService.updateBookingStatus(booking.id, newStatus);
      await _loadBookings();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Status updated to $newStatus')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update status: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('ظ…ظ‡ط§ظ…ظٹ'),
        actions: [
          // Connection status indicator
          ValueListenableBuilder(
            valueListenable: SocketService.instance.connectionState,
            builder: (context, state, _) {
              IconData icon;
              Color color;
              String tooltip;

              switch (state) {
                case SocketConnectionState.connected:
                  icon = Icons.wifi;
                  color = AppTheme.successColor;
                  tooltip = 'ظ…طھطµظ„';
                  break;
                case SocketConnectionState.connecting:
                  icon = Icons.sync;
                  color = AppTheme.warningColor;
                  tooltip = 'ط¬ط§ط±ظٹ ط§ظ„ط§طھطµط§ظ„...';
                  break;
                case SocketConnectionState.error:
                  icon = Icons.wifi_off;
                  color = AppTheme.errorColor;
                  tooltip = 'ط®ط·ط£ ظپظٹ ط§ظ„ط§طھطµط§ظ„';
                  break;
                case SocketConnectionState.disconnected:
                  icon = Icons.wifi_off;
                  color = Colors.grey;
                  tooltip = 'ط؛ظٹط± ظ…طھطµظ„';
                  break;
              }

              return IconButton(
                icon: Icon(icon),
                color: color,
                tooltip: tooltip,
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('ط­ط§ظ„ط© ط§ظ„ط§طھطµط§ظ„: $tooltip')),
                  );
                },
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'طھط³ط¬ظٹظ„ ط§ظ„ط®ط±ظˆط¬',
            onPressed: () {
              // Disconnect socket before logout
              SocketService.instance.disconnect();
              ref.read(authStateProvider.notifier).logout();
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _bookings.isEmpty
              ? Center(
                  child: FadeInUp(
                    duration: const Duration(milliseconds: 600),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: EdgeInsets.all(24.r),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryBg,
                            borderRadius: BorderRadius.circular(24.r),
                          ),
                          child: Icon(
                            Icons.inbox,
                            size: 64.sp,
                            color: AppTheme.primaryColor,
                          ),
                        ),
                        SizedBox(height: 16.h),
                        Text(
                          'ظ„ط§ طھظˆط¬ط¯ ط­ط¬ظˆط²ط§طھ ظ…ط³ظ†ط¯ط© ط¥ظ„ظٹظƒ',
                          style: TextStyle(
                            fontSize: 18.sp,
                            color: Theme.of(context).textTheme.bodyMedium?.color,
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadBookings,
                  child: ListView.builder(
                    padding: EdgeInsets.all(16.w),
                    itemCount: _bookings.length,
                    itemBuilder: (context, index) {
                      final booking = _bookings[index];
                      return FadeInUp(
                        duration: const Duration(milliseconds: 600),
                        delay: Duration(milliseconds: index * 100),
                        child: _BookingCard(
                          booking: booking,
                          onStatusUpdate: (newStatus) {
                            if (newStatus.isNotEmpty) {
                              _updateBookingStatus(booking, newStatus);
                            }
                          },
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => BookingDetailScreen(booking: booking),
                              ),
                            ).then((_) => _loadBookings());
                          },
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}

class _BookingCard extends StatelessWidget {
  final Booking booking;
  final Function(String) onStatusUpdate;
  final VoidCallback? onTap;

  const _BookingCard({
    required this.booking,
    required this.onStatusUpdate,
    this.onTap,
  });

  Color _getStatusColor(String status) {
    switch (status) {
      case 'PENDING':
        return AppTheme.warningColor;
      case 'CONFIRMED':
        return AppTheme.primaryColor;
      case 'IN_PROGRESS':
        return AppTheme.primaryLight;
      case 'WAITING_PARTS':
        return AppTheme.warningColor;
      case 'COMPLETED':
        return AppTheme.successColor;
      case 'CANCELLED':
        return AppTheme.errorColor;
      case 'NO_SHOW':
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'PENDING':
        return 'ظ‚ظٹط¯ ط§ظ„ط§ظ†طھط¸ط§ط±';
      case 'CONFIRMED':
        return 'ظ…ط¤ظƒط¯';
      case 'IN_PROGRESS':
        return 'ظ‚ظٹط¯ ط§ظ„طھظ†ظپظٹط°';
      case 'WAITING_PARTS':
        return 'ظپظٹ ط§ظ†طھط¸ط§ط± ط§ظ„ظ‚ط·ط¹';
      case 'COMPLETED':
        return 'ظ…ظƒطھظ…ظ„';
      case 'CANCELLED':
        return 'ظ…ظ„ط؛ظٹ';
      case 'NO_SHOW':
        return 'ظ„ظ… ظٹط­ط¶ط±';
      default:
        return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Slidable(
      endActionPane: ActionPane(
        motion: const ScrollMotion(),
        children: [
          SlidableAction(
            onPressed: (_) => onStatusUpdate('IN_PROGRESS'),
            backgroundColor: AppTheme.successColor,
            foregroundColor: Colors.white,
            icon: Icons.play_arrow,
            label: 'ط¨ط¯ط،',
          ),
          SlidableAction(
            onPressed: (_) => onStatusUpdate('WAITING_PARTS'),
            backgroundColor: AppTheme.warningColor,
            foregroundColor: Colors.white,
            icon: Icons.inventory,
            label: 'ظ‚ط·ط¹',
          ),
          SlidableAction(
            onPressed: (_) => onStatusUpdate('COMPLETED'),
            backgroundColor: AppTheme.primaryColor,
            foregroundColor: Colors.white,
            icon: Icons.check,
            label: 'ط¥ظƒظ…ط§ظ„',
          ),
        ],
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        child: Card(
          margin: EdgeInsets.only(bottom: 16.h),
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppTheme.radiusLg),
          ),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AppTheme.radiusLg),
              border: Border.all(
                color: _getStatusColor(booking.status).withValues(alpha: 0.3),
                width: 1,
              ),
            ),
            child: Padding(
              padding: EdgeInsets.all(16.w),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          booking.customerName,
                        style: TextStyle(
                          fontSize: 18.sp,
                          fontWeight: FontWeight.bold,
                          color: Theme.of(context).textTheme.displaySmall?.color,
                        ),
                      ),
                    ),
                    Container(
                      padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 6.h),
                      decoration: BoxDecoration(
                        color: _getStatusColor(booking.status),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        _getStatusText(booking.status),
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 12.sp,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 8.h),
                if (booking.vehicle != null)
                  Row(
                    children: [
                      Container(
                        padding: EdgeInsets.all(8.r),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryBg,
                          borderRadius: BorderRadius.circular(8.r),
                        ),
                        child: Icon(
                          Icons.directions_car,
                          size: 16.sp,
                          color: AppTheme.primaryColor,
                        ),
                      ),
                      SizedBox(width: 8.w),
                      Expanded(
                        child: Text(
                          '${booking.vehicle!.make} ${booking.vehicle!.model} (${booking.vehicle!.licensePlate})',
                          style: TextStyle(
                            fontSize: 14.sp,
                            color: Theme.of(context).textTheme.bodyMedium?.color,
                          ),
                        ),
                      ),
                    ],
                  ),
                SizedBox(height: 8.h),
                Row(
                  children: [
                    Container(
                      padding: EdgeInsets.all(8.r),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryBg,
                        borderRadius: BorderRadius.circular(8.r),
                      ),
                      child: Icon(
                        Icons.calendar_today,
                        size: 16.sp,
                        color: AppTheme.primaryColor,
                      ),
                    ),
                    SizedBox(width: 8.w),
                    Text(
                      '${booking.scheduledDate.day}/${booking.scheduledDate.month}/${booking.scheduledDate.year}',
                      style: TextStyle(
                        fontSize: 14.sp,
                        color: Theme.of(context).textTheme.bodyMedium?.color,
                      ),
                    ),
                    if (booking.scheduledTime != null) ...[
                      SizedBox(width: 16.w),
                      Container(
                        padding: EdgeInsets.all(8.r),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryBg,
                          borderRadius: BorderRadius.circular(8.r),
                        ),
                        child: Icon(
                          Icons.access_time,
                          size: 16.sp,
                          color: AppTheme.primaryColor,
                        ),
                      ),
                      SizedBox(width: 8.w),
                      Text(
                        booking.scheduledTime!,
                        style: TextStyle(
                          fontSize: 14.sp,
                          color: Theme.of(context).textTheme.bodyMedium?.color,
                        ),
                      ),
                    ],
                  ],
                ),
                if (booking.services != null && booking.services!.isNotEmpty) ...[
                  SizedBox(height: 12.h),
                  Text(
                    'ط§ظ„ط®ط¯ظ…ط§طھ:',
                    style: TextStyle(
                      fontSize: 14.sp,
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).textTheme.bodyMedium?.color,
                    ),
                  ),
                  SizedBox(height: 4.h),
                  ...booking.services!.map((service) => Padding(
                        padding: EdgeInsets.only(left: 8.w, top: 2.h),
                        child: Text(
                          'â€¢ ${service.name}',
                          style: TextStyle(
                            fontSize: 12.sp,
                            color: Theme.of(context).textTheme.bodySmall?.color,
                          ),
                        ),
                      )),
                ],
                SizedBox(height: 16.h),
                Wrap(
                  spacing: 8.w,
                  runSpacing: 8.h,
                  children: [
                    _StatusButton(
                      label: 'ط¨ط¯ط،',
                      status: 'IN_PROGRESS',
                      color: AppTheme.successColor,
                      onPressed: () => onStatusUpdate('IN_PROGRESS'),
                    ),
                    _StatusButton(
                      label: 'ط§ظ†طھط¸ط§ط± ظ‚ط·ط¹',
                      status: 'WAITING_PARTS',
                      color: AppTheme.warningColor,
                      onPressed: () => onStatusUpdate('WAITING_PARTS'),
                    ),
                    _StatusButton(
                      label: 'ط¥ظƒظ…ط§ظ„',
                      status: 'COMPLETED',
                      color: AppTheme.primaryColor,
                      onPressed: () => onStatusUpdate('COMPLETED'),
                    ),
                    _StatusButton(
                      label: 'ط¥ظ„ط؛ط§ط،',
                      status: 'CANCELLED',
                      color: AppTheme.errorColor,
                      onPressed: () => onStatusUpdate('CANCELLED'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    ),
  );
  }
}

class _StatusButton extends StatelessWidget {
  final String label;
  final String status;
  final Color color;
  final VoidCallback onPressed;

  const _StatusButton({
    required this.label,
    required this.status,
    required this.color,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: color,
        foregroundColor: Colors.white,
        padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 8.h),
        textStyle: TextStyle(fontSize: 12.sp),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppTheme.radiusMd),
        ),
      ),
      child: Text(label),
    );
  }
}
