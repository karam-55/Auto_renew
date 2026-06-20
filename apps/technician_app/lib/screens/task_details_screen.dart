import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../models/booking.dart';
import '../providers/tasks_provider.dart';
import '../widgets/faults_section.dart';
import '../widgets/photos_section.dart';
import '../widgets/parts_section.dart';
import 'update_status_screen.dart';
import 'add_fault_screen.dart';
import 'upload_photos_screen.dart';

class TaskDetailsScreen extends StatefulWidget {
  final Booking booking;

  const TaskDetailsScreen({super.key, required this.booking});

  @override
  State<TaskDetailsScreen> createState() => _TaskDetailsScreenState();
}

class _TaskDetailsScreenState extends State<TaskDetailsScreen> with SingleTickerProviderStateMixin {
  late Booking _booking;
  bool _isRefreshing = false;
  String? _refreshError;
  bool _isOffline = false;
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _booking = widget.booking;
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(_animationController);
    _animationController.forward();
    _checkConnectivity();
  }

  Future<void> _checkConnectivity() async {
    final connectivityResult = await Connectivity().checkConnectivity();
    setState(() {
      _isOffline = connectivityResult == ConnectivityResult.none;
    });
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _refreshBooking() async {
    setState(() {
      _isRefreshing = true;
      _refreshError = null;
    });

    try {
      await context.read<TasksProvider>().refreshTask(_booking.id);
      // TODO: Update local _booking from provider
    } catch (e) {
      setState(() {
        _refreshError = 'Failed to refresh: ${e.toString()}';
      });
    } finally {
      setState(() {
        _isRefreshing = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('تفاصيل المهمة')),
      body: Stack(
        children: [
          FadeTransition(
            opacity: _fadeAnimation,
            child: Column(
              children: [
                if (_isOffline)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    color: Colors.orange.shade100,
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.wifi_off, color: Colors.orange),
                        SizedBox(width: 8),
                        Text('وضع عدم الاتصال', style: TextStyle(color: Colors.orange, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(20.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Booking ID: ${_booking.id}', style: const TextStyle(fontSize: 16)),
                        const SizedBox(height: 8),
                        Text('Service: ${_booking.serviceType}', style: const TextStyle(fontSize: 16)),
                        const SizedBox(height: 8),
                        Text('Vehicle: ${_booking.vehicle.plateNumber}', style: const TextStyle(fontSize: 16)),
                        const SizedBox(height: 8),
                        Text('Customer: ${_booking.customer.name}', style: const TextStyle(fontSize: 16)),
                        const SizedBox(height: 24),
                        ElevatedButton(
                          onPressed: () async {
                            final result = await Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => UpdateStatusScreen(bookingId: _booking.id),
                              ),
                            );
                            if (result != null) {
                              await _refreshBooking();
                            }
                          },
                          child: const Text('تحديث الحالة'),
                        ),
                        const SizedBox(height: 12),
                        ElevatedButton(
                          onPressed: () async {
                            final result = await Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => AddFaultScreen(bookingId: _booking.id),
                              ),
                            );
                            if (result != null) {
                              await _refreshBooking();
                            }
                          },
                          child: const Text('إضافة عطل'),
                        ),
                        const SizedBox(height: 12),
                        ElevatedButton(
                          onPressed: () async {
                            final result = await Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => UploadPhotosScreen(bookingId: _booking.id),
                              ),
                            );
                            if (result != null) {
                              await _refreshBooking();
                            }
                          },
                          child: const Text('رفع صور'),
                        ),
                        const SizedBox(height: 24),
                        const FaultsSection(),
                        const SizedBox(height: 16),
                        const PhotosSection(),
                        const SizedBox(height: 16),
                        const PartsSection(),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (_isRefreshing)
            Container(
              color: Colors.black.withOpacity(0.3),
              child: const Center(child: CircularProgressIndicator()),
            ),
          if (_refreshError != null)
            Positioned(
              bottom: 16,
              left: 16,
              right: 16,
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.shade100,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.red),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error, color: Colors.red),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _refreshError!,
                        style: const TextStyle(color: Colors.red),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: Colors.red),
                      onPressed: () => setState(() => _refreshError = null),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
