import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/constants.dart';
import '../../models/booking.dart';
import '../../models/customer.dart';
import '../../models/service.dart';
import '../../models/vehicle.dart';
import '../../repositories/booking_repository.dart';
import '../../repositories/customer_repository.dart';
import '../../repositories/service_repository.dart';
import '../../repositories/vehicle_repository.dart';

class BookingFormScreen extends StatefulWidget {
  final Booking? booking;

  const BookingFormScreen({super.key, this.booking});

  @override
  State<BookingFormScreen> createState() => _BookingFormScreenState();
}

class _BookingFormScreenState extends State<BookingFormScreen> {
  final _formKey = GlobalKey<FormState>();

  List<Customer> _customers = [];
  List<Vehicle> _vehicles = [];
  List<Service> _services = [];
  bool _loading = true;
  String? _error;

  String? _selectedCustomerId;
  String? _selectedVehicleId;
  DateTime? _scheduledDate;
  final _timeCtrl = TextEditingController();
  String _status = 'PENDING';
  String _priority = 'NORMAL';
  String _paymentMethod = 'CASH';
  final _notesCtrl = TextEditingController();
  final List<Service> _selectedServices = [];

  bool _saving = false;

  final List<Map<String, String>> _statuses = [
    {'value': 'PENDING', 'label': 'قيد الانتظار'},
    {'value': 'CONFIRMED', 'label': 'مؤكد'},
    {'value': 'IN_PROGRESS', 'label': 'قيد التنفيذ'},
    {'value': 'WAITING_PARTS', 'label': 'بانتظار القطع'},
    {'value': 'READY', 'label': 'جاهز'},
    {'value': 'COMPLETED', 'label': 'مكتمل'},
    {'value': 'DELIVERED', 'label': 'تم التسليم'},
    {'value': 'CANCELLED', 'label': 'ملغي'},
  ];

  final List<Map<String, String>> _priorities = [
    {'value': 'LOW', 'label': 'منخفضة'},
    {'value': 'NORMAL', 'label': 'عادية'},
    {'value': 'MEDIUM', 'label': 'متوسطة'},
    {'value': 'HIGH', 'label': 'عالية'},
    {'value': 'URGENT', 'label': 'عاجلة'},
  ];

  final List<Map<String, String>> _paymentMethods = [
    {'value': 'CASH', 'label': 'نقدي'},
    {'value': 'CREDIT', 'label': 'آجل'},
    {'value': 'ELECTRONIC', 'label': 'إلكتروني'},
  ];

  bool get _isEdit => widget.booking != null;

  @override
  void initState() {
    super.initState();
    if (_isEdit) {
      final b = widget.booking!;
      _selectedCustomerId = b.customerId;
      _selectedVehicleId = b.vehicleId;
      _scheduledDate = b.scheduledDate;
      _timeCtrl.text = b.scheduledTime ?? '';
      _status = b.status;
      _priority = b.priority;
      _paymentMethod = b.paymentMethod ?? 'CASH';
      _notesCtrl.text = b.notes ?? '';
    }
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final [customers, services] = await Future.wait([
        CustomerRepository().getAll(),
        ServiceRepository().getAll(),
      ]);

      if (!mounted) return;
      setState(() {
        _customers = customers as List<Customer>;
        _services = services as List<Service>;
        _loading = false;
      });

      if (_selectedCustomerId != null) {
        await _loadVehicles(_selectedCustomerId!);
      }

      if (_isEdit && widget.booking!.services.isNotEmpty) {
        final serviceIds = widget.booking!.services
            .map((s) => s['serviceId']?.toString() ?? s['id']?.toString())
            .whereType<String>()
            .toSet();
        setState(() {
          _selectedServices.addAll(
            _services.where((s) => serviceIds.contains(s.id)),
          );
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _loadVehicles(String customerId) async {
    try {
      final vehicles = await VehicleRepository().getByCustomer(customerId);
      if (!mounted) return;
      setState(() {
        _vehicles = vehicles;
        if (_selectedVehicleId != null &&
            !_vehicles.any((v) => v.id == _selectedVehicleId)) {
          _selectedVehicleId = null;
        }
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    }
  }

  Future<void> _pickDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _scheduledDate ?? DateTime.now(),
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (date != null) {
      setState(() => _scheduledDate = date);
    }
  }

  Future<void> _pickTime() async {
    final time = await showTimePicker(
      context: context,
      initialTime: _timeCtrl.text.isNotEmpty
          ? TimeOfDay.fromDateTime(DateTime.parse('2024-01-01 ${_timeCtrl.text}:00'))
          : TimeOfDay.now(),
      builder: (context, child) {
        return MediaQuery(
          data: MediaQuery.of(context).copyWith(alwaysUse24HourFormat: true),
          child: child!,
        );
      },
    );
    if (time != null) {
      setState(() => _timeCtrl.text = '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}');
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedCustomerId == null || _selectedVehicleId == null || _scheduledDate == null) {
      setState(() => _error = 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setState(() {
      _saving = true;
      _error = null;
    });

    try {
      final booking = Booking(
        id: widget.booking?.id ?? '',
        customerId: _selectedCustomerId!,
        vehicleId: _selectedVehicleId!,
        scheduledDate: _scheduledDate,
        scheduledTime: _timeCtrl.text.trim(),
        status: _status,
        priority: _priority,
        paymentMethod: _paymentMethod,
        notes: _notesCtrl.text.trim(),
        services: _selectedServices
            .map((s) => {'id': s.id, 'name': s.name})
            .toList(),
      );

      if (_isEdit) {
        await BookingRepository().update(widget.booking!.id, booking);
      } else {
        await BookingRepository().create(booking);
      }

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_isEdit ? 'تم تحديث الحجز' : 'تم إضافة الحجز')),
      );
      Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  void dispose() {
    _timeCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEdit ? 'تعديل حجز' : 'حجز جديد'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildDropdown(
                      label: 'العميل *',
                      icon: Icons.person,
                      value: _selectedCustomerId,
                      items: _customers.map((c) => DropdownMenuItem(value: c.id, child: Text(c.fullName))).toList(),
                      onChanged: (value) {
                        setState(() {
                          _selectedCustomerId = value;
                          _selectedVehicleId = null;
                          _vehicles = [];
                        });
                        if (value != null) _loadVehicles(value);
                      },
                    ),
                    const SizedBox(height: 16),
                    _buildDropdown(
                      label: 'المركبة *',
                      icon: Icons.directions_car,
                      value: _selectedVehicleId,
                      items: _vehicles.map((v) => DropdownMenuItem(value: v.id, child: Text('${v.make} ${v.model} ${v.licensePlate != null && v.licensePlate!.isNotEmpty ? '(${v.licensePlate})' : ''}'))).toList(),
                      onChanged: (value) => setState(() => _selectedVehicleId = value),
                    ),
                    const SizedBox(height: 16),
                    InkWell(
                      onTap: _pickDate,
                      child: InputDecorator(
                        decoration: const InputDecoration(
                          labelText: 'تاريخ الحجز *',
                          prefixIcon: Icon(Icons.calendar_today, color: AppColors.primary),
                        ),
                        child: Text(
                          _scheduledDate != null
                              ? DateFormat('yyyy-MM-dd').format(_scheduledDate!)
                              : 'اختر التاريخ',
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    InkWell(
                      onTap: _pickTime,
                      child: InputDecorator(
                        decoration: const InputDecoration(
                          labelText: 'وقت الحجز',
                          prefixIcon: Icon(Icons.access_time, color: AppColors.primary),
                        ),
                        child: Text(
                          _timeCtrl.text.isNotEmpty ? _timeCtrl.text : 'اختر الوقت',
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: _buildDropdown(
                            label: 'الحالة',
                            icon: Icons.flag,
                            value: _status,
                            items: _statuses.map((s) => DropdownMenuItem(value: s['value'], child: Text(s['label']!))).toList(),
                            onChanged: (value) => setState(() => _status = value ?? 'PENDING'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildDropdown(
                            label: 'الأولوية',
                            icon: Icons.priority_high,
                            value: _priority,
                            items: _priorities.map((p) => DropdownMenuItem(value: p['value'], child: Text(p['label']!))).toList(),
                            onChanged: (value) => setState(() => _priority = value ?? 'NORMAL'),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _buildDropdown(
                      label: 'طريقة الدفع',
                      icon: Icons.payment,
                      value: _paymentMethod,
                      items: _paymentMethods.map((m) => DropdownMenuItem(value: m['value'], child: Text(m['label']!))).toList(),
                      onChanged: (value) => setState(() => _paymentMethod = value ?? 'CASH'),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'الخدمات',
                      style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _services.map((service) {
                        final selected = _selectedServices.contains(service);
                        return FilterChip(
                          label: Text(service.name),
                          selected: selected,
                          onSelected: (_) {
                            setState(() {
                              if (selected) {
                                _selectedServices.remove(service);
                              } else {
                                _selectedServices.add(service);
                              }
                            });
                          },
                          selectedColor: AppColors.primary.withValues(alpha: 0.15),
                          checkmarkColor: AppColors.primary,
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _notesCtrl,
                      decoration: const InputDecoration(
                        labelText: 'ملاحظات',
                        prefixIcon: Icon(Icons.notes, color: AppColors.primary),
                      ),
                      maxLines: 3,
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.error.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(AppRadius.md),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error_outline, color: AppColors.error),
                            const SizedBox(width: 8),
                            Expanded(child: Text(_error!, style: const TextStyle(color: AppColors.error))),
                          ],
                        ),
                      ),
                    ],
                    const SizedBox(height: 32),
                    SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: ElevatedButton(
                        onPressed: _saving ? null : _save,
                        child: _saving
                            ? const CircularProgressIndicator(color: Colors.white)
                            : Text(_isEdit ? 'حفظ التعديلات' : 'إضافة الحجز'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildDropdown<T>({
    required String label,
    required IconData icon,
    required T? value,
    required List<DropdownMenuItem<T>> items,
    required void Function(T?) onChanged,
  }) {
    return InputDecorator(
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: AppColors.primary),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<T>(
          value: value,
          isDense: true,
          isExpanded: true,
          hint: const Text('اختر'),
          items: items,
          onChanged: onChanged,
        ),
      ),
    );
  }
}
