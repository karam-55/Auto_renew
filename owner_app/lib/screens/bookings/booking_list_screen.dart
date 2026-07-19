import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/constants.dart';
import '../../models/booking.dart';
import '../../repositories/booking_repository.dart';
import '../../widgets/animated_list_item.dart';
import '../../widgets/loading_indicator.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/error_state.dart';
import 'booking_form_screen.dart';

class BookingListScreen extends StatefulWidget {
  const BookingListScreen({super.key});

  @override
  State<BookingListScreen> createState() => _BookingListScreenState();
}

class _BookingListScreenState extends State<BookingListScreen> {
  final _repository = BookingRepository();
  List<Booking> _allBookings = [];
  List<Booking> _filteredBookings = [];
  bool _loading = true;
  String? _error;
  final _searchCtrl = TextEditingController();
  String? _selectedStatus;

  final List<Map<String, String>> _statuses = [
    {'value': '', 'label': 'كل الحالات'},
    {'value': 'PENDING', 'label': 'قيد الانتظار'},
    {'value': 'CONFIRMED', 'label': 'مؤكد'},
    {'value': 'IN_PROGRESS', 'label': 'قيد التنفيذ'},
    {'value': 'WAITING_PARTS', 'label': 'بانتظار القطع'},
    {'value': 'READY', 'label': 'جاهز'},
    {'value': 'COMPLETED', 'label': 'مكتمل'},
    {'value': 'DELIVERED', 'label': 'تم التسليم'},
    {'value': 'CANCELLED', 'label': 'ملغي'},
  ];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await _repository.getAll(status: _selectedStatus);
      if (!mounted) return;
      setState(() {
        _allBookings = data;
        _applyFilters();
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  void _applyFilters() {
    final q = _searchCtrl.text.trim().toLowerCase();
    _filteredBookings = _allBookings.where((b) {
      final matchesSearch = q.isEmpty ||
          b.customerName.toLowerCase().contains(q) ||
          b.vehicleName.toLowerCase().contains(q) ||
          b.servicesLabel.toLowerCase().contains(q);
      return matchesSearch;
    }).toList();
  }

  Future<void> _deleteBooking(Booking booking) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('تأكيد الحذف'),
        content: const Text('هل أنت متأكد من حذف هذا الحجز؟'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('حذف', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await _repository.delete(booking.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تم حذف الحجز بنجاح')),
      );
      _loadData();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('فشل الحذف: $e'), backgroundColor: AppColors.error),
      );
    }
  }

  Future<void> _openForm({Booking? booking, bool isNewCustomer = false}) async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) => BookingFormScreen(booking: booking, isNewCustomer: isNewCustomer),
      ),
    );
    if (result == true) _loadData();
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'COMPLETED':
      case 'DELIVERED':
        return AppColors.success;
      case 'IN_PROGRESS':
        return AppColors.info;
      case 'READY':
        return AppColors.primary;
      case 'CANCELLED':
      case 'NO_SHOW':
        return AppColors.error;
      case 'WAITING_PARTS':
        return AppColors.warning;
      default:
        return AppColors.textTertiary;
    }
  }

  String _statusLabel(String status) {
    final found = _statuses.firstWhere(
      (s) => s['value'] == status,
      orElse: () => {'label': status},
    );
    return found['label']!;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('الحجوزات'),
        actions: [
          PopupMenuButton<bool>(
            icon: const Icon(Icons.add),
            tooltip: 'حجز جديد',
            onSelected: (isNewCustomer) => _openForm(isNewCustomer: isNewCustomer),
            itemBuilder: (context) => [
              const PopupMenuItem<bool>(
                value: false,
                child: Row(
                  children: [
                    Icon(Icons.person_search, color: AppColors.primary, size: 20),
                    SizedBox(width: 12),
                    Text('إنشاء حجز لعميل مسبق'),
                  ],
                ),
              ),
              const PopupMenuItem<bool>(
                value: true,
                child: Row(
                  children: [
                    Icon(Icons.person_add, color: AppColors.success, size: 20),
                    SizedBox(width: 12),
                    Text('إنشاء حجز لعميل جديد'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: TextField(
              controller: _searchCtrl,
              decoration: const InputDecoration(
                hintText: 'بحث بالعميل/المركبة/الخدمة...',
                prefixIcon: Icon(Icons.search),
              ),
              onChanged: (value) => setState(() => _applyFilters()),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: SizedBox(
              height: 48,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: _statuses.length,
                itemBuilder: (context, index) {
                  final status = _statuses[index];
                  final isSelected = _selectedStatus == status['value'] ||
                      (status['value']!.isEmpty && _selectedStatus == null);
                  return Padding(
                    padding: const EdgeInsets.only(left: 8),
                    child: ChoiceChip(
                      label: Text(status['label']!),
                      selected: isSelected,
                      onSelected: (_) {
                        setState(() {
                          _selectedStatus = status['value']!.isEmpty ? null : status['value'];
                        });
                        _loadData();
                      },
                      selectedColor: AppColors.primary.withValues(alpha: 0.15),
                      labelStyle: TextStyle(
                        color: isSelected ? AppColors.primary : AppColors.textSecondary,
                        fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _loadData,
              child: _buildBody(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_loading) return const ShimmerList();
    if (_error != null) return ErrorState(message: _error!, onRetry: _loadData);
    if (_filteredBookings.isEmpty) {
      return EmptyState(
        title: 'لا توجد حجوزات',
        subtitle: _searchCtrl.text.isEmpty && _selectedStatus == null
            ? 'لم يتم تسجيل أي حجز بعد'
            : 'لا توجد نتائج مطابقة',
        icon: Icons.calendar_today_outlined,
        onAction: _searchCtrl.text.isEmpty && _selectedStatus == null ? () => _openForm() : null,
        actionLabel: 'حجز جديد',
      );
    }

    return ListView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemCount: _filteredBookings.length,
      itemBuilder: (context, index) {
        final booking = _filteredBookings[index];
        return AnimatedListItem(
          index: index,
          child: Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: _statusColor(booking.status).withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        _statusLabel(booking.status),
                        style: TextStyle(
                          color: _statusColor(booking.status),
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      icon: const Icon(Icons.edit, color: AppColors.info),
                      onPressed: () => _openForm(booking: booking),
                    ),
                    IconButton(
                      icon: const Icon(Icons.delete, color: AppColors.error),
                      onPressed: () => _deleteBooking(booking),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  booking.customerName,
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
                ),
                const SizedBox(height: 4),
                Text(
                  booking.vehicleName,
                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 14),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.calendar_today, size: 14, color: AppColors.textTertiary),
                    const SizedBox(width: 4),
                    Text(
                      booking.scheduledDate != null
                          ? DateFormat('yyyy-MM-dd').format(booking.scheduledDate!)
                          : '-',
                      style: const TextStyle(color: AppColors.textTertiary, fontSize: 13),
                    ),
                    const SizedBox(width: 16),
                    const Icon(Icons.build, size: 14, color: AppColors.textTertiary),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        booking.servicesLabel,
                        style: const TextStyle(color: AppColors.textTertiary, fontSize: 13),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      );
    },
    );
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }
}
