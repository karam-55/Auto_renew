import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/constants.dart';
import '../../core/validators.dart';
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
  final bool isNewCustomer;

  const BookingFormScreen({super.key, this.booking, this.isNewCustomer = false});

  @override
  State<BookingFormScreen> createState() => _BookingFormScreenState();
}

class _BookingFormScreenState extends State<BookingFormScreen> {
  final _formKey = GlobalKey<FormState>();
  int _currentStep = 0;

  List<Customer> _customers = [];
  List<Vehicle> _vehicles = [];
  List<Service> _services = [];
  bool _loading = true;
  String? _error;
  bool _saving = false;

  // Step 1: Customer
  String? _selectedCustomerId;
  final _customerNameCtrl = TextEditingController();
  final _customerPhoneCtrl = TextEditingController();
  final _customerAddressCtrl = TextEditingController();
  final _customerNotesCtrl = TextEditingController();

  // Step 2: Vehicle
  String? _selectedVehicleId;
  final _vehicleMakeCtrl = TextEditingController();
  final _vehicleModelCtrl = TextEditingController();
  final _vehicleYearCtrl = TextEditingController();
  final _vehiclePlateCtrl = TextEditingController();
  final _vehicleMileageCtrl = TextEditingController();
  final _vehicleVinCtrl = TextEditingController();
  final _vehicleColorCtrl = TextEditingController();
  final _vehicleNotesCtrl = TextEditingController();

  // Step 3: Booking details
  DateTime? _scheduledDate;
  DateTime? _estimatedCompletionDate;
  final _timeCtrl = TextEditingController();
  String _status = 'PENDING';
  String _priority = 'NORMAL';
  String _paymentMethod = 'CASH';
  final _notesCtrl = TextEditingController();
  final List<Service> _selectedServices = [];

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
  bool get _isExisting => !_isEdit && !widget.isNewCustomer;

  @override
  void initState() {
    super.initState();
    if (_isEdit) {
      final b = widget.booking!;
      _selectedCustomerId = b.customerId;
      _selectedVehicleId = b.vehicleId;
      _scheduledDate = b.scheduledDate;
      _estimatedCompletionDate = b.estimatedCompletionDate;
      _timeCtrl.text = b.scheduledTime ?? '';
      _status = b.status;
      _priority = b.priority;
      _paymentMethod = b.paymentMethod ?? 'CASH';
      _notesCtrl.text = b.notes ?? '';
    } else if (widget.isNewCustomer) {
      _currentStep = 0;
    }
    _scheduledDate ??= DateTime.now();
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

      if (_selectedCustomerId != null && (_isExisting || _isEdit)) {
        await _loadVehicles(_selectedCustomerId!);
      }

      if (_isEdit) {
        _prefillFromExistingBooking();
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

  void _prefillFromExistingBooking() {
    final b = widget.booking!;
    if (b.customer != null) {
      _customerNameCtrl.text = b.customer!['fullName']?.toString() ?? '';
      _customerPhoneCtrl.text = b.customer!['phone']?.toString() ?? '';
      _customerAddressCtrl.text = b.customer!['address']?.toString() ?? '';
      _customerNotesCtrl.text = b.customer!['notes']?.toString() ?? '';
    }
    if (b.vehicle != null) {
      _vehicleMakeCtrl.text = b.vehicle!['make']?.toString() ?? '';
      _vehicleModelCtrl.text = b.vehicle!['model']?.toString() ?? '';
      _vehicleYearCtrl.text = b.vehicle!['year']?.toString() ?? '';
      _vehiclePlateCtrl.text = b.vehicle!['licensePlate']?.toString() ?? '';
      _vehicleMileageCtrl.text = b.vehicle!['mileage']?.toString() ?? '';
      _vehicleVinCtrl.text = b.vehicle!['vin']?.toString() ?? '';
      _vehicleColorCtrl.text = b.vehicle!['color']?.toString() ?? '';
    }
  }

  Future<void> _loadVehicles(String customerId) async {
    try {
      final vehicles = await VehicleRepository().getByCustomer(customerId);
      if (!mounted) return;
      setState(() {
        _vehicles = vehicles;
        if (_selectedVehicleId != null &&
            _selectedVehicleId!.isNotEmpty &&
            !_vehicles.any((v) => v.id == _selectedVehicleId)) {
          _selectedVehicleId = null;
          _clearVehicleFields();
        }
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    }
  }

  void _onCustomerSelected(String? customerId) {
    if (customerId == null || customerId.isEmpty) return;
    final customer = _customers.firstWhere((c) => c.id == customerId);
    setState(() {
      _selectedCustomerId = customerId;
      _selectedVehicleId = null;
      _vehicles = [];
      _customerNameCtrl.text = customer.fullName;
      _customerPhoneCtrl.text = customer.phone;
      _customerAddressCtrl.text = customer.address ?? '';
      _customerNotesCtrl.text = customer.notes ?? '';
    });
    _loadVehicles(customerId);
  }

  void _onVehicleSelected(String? vehicleId) {
    if (vehicleId == null || vehicleId.isEmpty) {
      setState(() {
        _selectedVehicleId = null;
        _clearVehicleFields();
      });
      return;
    }
    final vehicle = _vehicles.firstWhere((v) => v.id == vehicleId);
    setState(() {
      _selectedVehicleId = vehicleId;
      _vehicleMakeCtrl.text = vehicle.make;
      _vehicleModelCtrl.text = vehicle.model;
      _vehicleYearCtrl.text = vehicle.year?.toString() ?? '';
      _vehiclePlateCtrl.text = vehicle.licensePlate ?? '';
      _vehicleMileageCtrl.text = vehicle.mileage?.toString() ?? '';
      _vehicleVinCtrl.text = vehicle.vin ?? '';
      _vehicleColorCtrl.text = vehicle.color ?? '';
      _vehicleNotesCtrl.text = '';
    });
  }

  void _clearVehicleFields() {
    _vehicleMakeCtrl.clear();
    _vehicleModelCtrl.clear();
    _vehicleYearCtrl.clear();
    _vehiclePlateCtrl.clear();
    _vehicleMileageCtrl.clear();
    _vehicleVinCtrl.clear();
    _vehicleColorCtrl.clear();
    _vehicleNotesCtrl.clear();
  }

  Future<void> _pickDate({required bool estimated}) async {
    final initial = estimated
        ? (_estimatedCompletionDate ?? DateTime.now())
        : (_scheduledDate ?? DateTime.now());
    final date = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (date != null) {
      setState(() {
        if (estimated) {
          _estimatedCompletionDate = date;
        } else {
          _scheduledDate = date;
        }
      });
    }
  }

  Future<void> _pickTime() async {
    final now = TimeOfDay.now();
    final initial = _timeCtrl.text.isNotEmpty
        ? TimeOfDay.fromDateTime(DateTime.parse('2024-01-01 ${_timeCtrl.text}:00'))
        : now;
    final time = await showTimePicker(
      context: context,
      initialTime: initial,
      builder: (context, child) {
        return MediaQuery(
          data: MediaQuery.of(context).copyWith(alwaysUse24HourFormat: true),
          child: child!,
        );
      },
    );
    if (time != null) {
      setState(() => _timeCtrl.text =
          '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}');
    }
  }

  bool _validateCurrentStep() {
    if (_currentStep == 0) {
      if (widget.isNewCustomer) {
        if (Validators.required(_customerNameCtrl.text) != null ||
            Validators.phone(_customerPhoneCtrl.text) != null) {
          _formKey.currentState?.validate();
          return false;
        }
        return true;
      }
      if (_selectedCustomerId == null) {
        setState(() => _error = 'يرجى اختيار عميل');
        return false;
      }
      return true;
    }

    if (_currentStep == 1) {
      if (_selectedVehicleId != null && _selectedVehicleId!.isNotEmpty) {
        return true;
      }
      if (Validators.required(_vehicleMakeCtrl.text) != null ||
          Validators.required(_vehicleModelCtrl.text) != null ||
          Validators.required(_vehicleYearCtrl.text) != null ||
          Validators.required(_vehiclePlateCtrl.text) != null) {
        _formKey.currentState?.validate();
        return false;
      }
      return true;
    }

    return true;
  }

  void _nextStep() {
    if (!_validateCurrentStep()) return;
    if (_currentStep < 2) {
      setState(() => _currentStep++);
    }
  }

  void _previousStep() {
    if (_currentStep > 0) {
      setState(() => _currentStep--);
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    if (!_validateCurrentStep()) return;

    setState(() {
      _saving = true;
      _error = null;
    });

    try {
      String customerId = _selectedCustomerId ?? '';
      String vehicleId = _selectedVehicleId ?? '';

      // Create new customer if needed
      if (widget.isNewCustomer) {
        final newCustomer = await CustomerRepository().create(
          Customer(
            id: '',
            fullName: _customerNameCtrl.text.trim(),
            phone: _customerPhoneCtrl.text.trim(),
            address: _customerAddressCtrl.text.trim().isNotEmpty
                ? _customerAddressCtrl.text.trim()
                : null,
            notes: _customerNotesCtrl.text.trim().isNotEmpty
                ? _customerNotesCtrl.text.trim()
                : null,
          ),
        );
        customerId = newCustomer.id;

        final newVehicle = await VehicleRepository().create(
          Vehicle(
            id: '',
            customerId: customerId,
            make: _vehicleMakeCtrl.text.trim(),
            model: _vehicleModelCtrl.text.trim(),
            year: int.tryParse(_vehicleYearCtrl.text.trim()),
            licensePlate: _vehiclePlateCtrl.text.trim().isNotEmpty
                ? _vehiclePlateCtrl.text.trim()
                : null,
            mileage: int.tryParse(_vehicleMileageCtrl.text.trim()),
            vin: _vehicleVinCtrl.text.trim().isNotEmpty
                ? _vehicleVinCtrl.text.trim()
                : null,
            color: _vehicleColorCtrl.text.trim().isNotEmpty
                ? _vehicleColorCtrl.text.trim()
                : null,
          ),
        );
        vehicleId = newVehicle.id;
      } else if (vehicleId.isEmpty) {
        // Existing customer but new vehicle
        final newVehicle = await VehicleRepository().create(
          Vehicle(
            id: '',
            customerId: customerId,
            make: _vehicleMakeCtrl.text.trim(),
            model: _vehicleModelCtrl.text.trim(),
            year: int.tryParse(_vehicleYearCtrl.text.trim()),
            licensePlate: _vehiclePlateCtrl.text.trim().isNotEmpty
                ? _vehiclePlateCtrl.text.trim()
                : null,
            mileage: int.tryParse(_vehicleMileageCtrl.text.trim()),
            vin: _vehicleVinCtrl.text.trim().isNotEmpty
                ? _vehicleVinCtrl.text.trim()
                : null,
            color: _vehicleColorCtrl.text.trim().isNotEmpty
                ? _vehicleColorCtrl.text.trim()
                : null,
          ),
        );
        vehicleId = newVehicle.id;
      }

      final booking = Booking(
        id: widget.booking?.id ?? '',
        customerId: customerId,
        vehicleId: vehicleId,
        scheduledDate: _scheduledDate,
        scheduledTime: _timeCtrl.text.trim().isNotEmpty ? _timeCtrl.text.trim() : null,
        status: _status,
        priority: _priority,
        paymentMethod: _paymentMethod,
        notes: _notesCtrl.text.trim().isNotEmpty ? _notesCtrl.text.trim() : null,
        estimatedCompletionDate: _estimatedCompletionDate,
        services: _selectedServices.map((s) => {'id': s.id, 'name': s.name}).toList(),
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
    _customerNameCtrl.dispose();
    _customerPhoneCtrl.dispose();
    _customerAddressCtrl.dispose();
    _customerNotesCtrl.dispose();
    _vehicleMakeCtrl.dispose();
    _vehicleModelCtrl.dispose();
    _vehicleYearCtrl.dispose();
    _vehiclePlateCtrl.dispose();
    _vehicleMileageCtrl.dispose();
    _vehicleVinCtrl.dispose();
    _vehicleColorCtrl.dispose();
    _vehicleNotesCtrl.dispose();
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
          : Form(
              key: _formKey,
              child: Stepper(
                currentStep: _currentStep,
                onStepContinue: _currentStep == 2 ? _save : _nextStep,
                onStepCancel: _previousStep,
                controlsBuilder: (context, details) {
                  return Padding(
                    padding: const EdgeInsets.only(top: 24),
                    child: Row(
                      children: [
                        Expanded(
                          child: SizedBox(
                            height: 52,
                            child: ElevatedButton(
                              onPressed: _saving ? null : details.onStepContinue,
                              child: _saving
                                  ? const SizedBox(
                                      width: 24,
                                      height: 24,
                                      child: CircularProgressIndicator(
                                        color: Colors.white,
                                        strokeWidth: 2.5,
                                      ),
                                    )
                                  : Text(_currentStep == 2
                                      ? (_isEdit ? 'حفظ التعديلات' : 'إنشاء الحجز')
                                      : 'التالي'),
                            ),
                          ),
                        ),
                        if (_currentStep > 0) ...[
                          const SizedBox(width: 12),
                        Expanded(
                            child: SizedBox(
                              height: 52,
                              child: OutlinedButton(
                                onPressed: _saving ? null : details.onStepCancel,
                                child: const Text('السابق'),
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  );
                },
                steps: [
                  Step(
                    title: const Text('بيانات العميل'),
                    isActive: _currentStep >= 0,
                    state: _currentStep > 0 ? StepState.complete : StepState.indexed,
                    content: _buildCustomerStep(),
                  ),
                  Step(
                    title: const Text('بيانات المركبة'),
                    isActive: _currentStep >= 1,
                    state: _currentStep > 1 ? StepState.complete : StepState.indexed,
                    content: _buildVehicleStep(),
                  ),
                  Step(
                    title: const Text('الخدمة والموعد'),
                    isActive: _currentStep >= 2,
                    state: _currentStep == 2 ? StepState.editing : StepState.indexed,
                    content: _buildServiceStep(),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildCustomerStep() {
    if (widget.isNewCustomer) {
      return _buildCard(
        title: 'بيانات العميل الجديد',
        icon: Icons.person_add,
        children: [
          TextFormField(
            controller: _customerNameCtrl,
            decoration: const InputDecoration(
              labelText: 'الاسم *',
              prefixIcon: Icon(Icons.person, color: AppColors.primary),
            ),
            validator: (v) => Validators.required(v),
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _customerPhoneCtrl,
            decoration: const InputDecoration(
              labelText: 'رقم الموبايل *',
              prefixIcon: Icon(Icons.phone, color: AppColors.primary),
              hintText: '09XXXXXXXX',
            ),
            keyboardType: TextInputType.phone,
            validator: (v) => Validators.phone(v),
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _customerAddressCtrl,
            decoration: const InputDecoration(
              labelText: 'العنوان',
              prefixIcon: Icon(Icons.location_on, color: AppColors.primary),
            ),
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _customerNotesCtrl,
            decoration: const InputDecoration(
              labelText: 'ملاحظات العميل',
              prefixIcon: Icon(Icons.notes, color: AppColors.primary),
            ),
            maxLines: 2,
          ),
        ],
      );
    }

    return _buildCard(
      title: 'اختيار العميل المسجل',
      icon: Icons.person_search,
      children: [
        _buildDropdown(
          label: 'العميل *',
          icon: Icons.person,
          value: _selectedCustomerId,
          items: _customers.map((c) {
            return DropdownMenuItem(
              value: c.id,
              child: Text('${c.fullName} - ${c.phone}'),
            );
          }).toList(),
          onChanged: (value) => _onCustomerSelected(value),
          validator: (value) => value == null ? 'يرجى اختيار عميل' : null,
        ),
        if (_selectedCustomerId != null) ...[
          const SizedBox(height: 20),
          _buildInfoRow(Icons.phone, 'الموبايل', _customerPhoneCtrl.text.isNotEmpty
              ? _customerPhoneCtrl.text
              : '-'),
          const SizedBox(height: 8),
          _buildInfoRow(Icons.location_on, 'العنوان', _customerAddressCtrl.text.isNotEmpty
              ? _customerAddressCtrl.text
              : '-'),
        ],
      ],
    );
  }

  Widget _buildVehicleStep() {
    final List<DropdownMenuItem<String>> vehicleItems = [
      const DropdownMenuItem(value: '', child: Text('إدخال مركبة جديدة')),
      ..._vehicles.map((v) {
        return DropdownMenuItem(
          value: v.id,
          child: Text('${v.make} ${v.model} ${v.licensePlate != null && v.licensePlate!.isNotEmpty ? '(${v.licensePlate})' : ''}'),
        );
      }),
    ];

    return _buildCard(
      title: 'بيانات المركبة',
      icon: Icons.directions_car,
      children: [
        if (!_isEdit && _isExisting) ...[
          _buildDropdown(
            label: 'اختر المركبة (أو أدخل جديدة)',
            icon: Icons.directions_car,
            value: _selectedVehicleId ?? '',
            items: vehicleItems,
            onChanged: (value) => _onVehicleSelected(value?.isEmpty ?? true ? null : value),
          ),
          const SizedBox(height: 20),
        ],
        TextFormField(
          controller: _vehicleMakeCtrl,
          decoration: const InputDecoration(
            labelText: 'الماركة *',
            prefixIcon: Icon(Icons.branding_watermark, color: AppColors.primary),
            hintText: 'مثال: تويوتا',
          ),
          validator: (v) => _selectedVehicleId != null ? null : Validators.required(v),
          textInputAction: TextInputAction.next,
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _vehicleModelCtrl,
          decoration: const InputDecoration(
            labelText: 'الموديل *',
            prefixIcon: Icon(Icons.car_rental, color: AppColors.primary),
            hintText: 'مثال: كورولا',
          ),
          validator: (v) => _selectedVehicleId != null ? null : Validators.required(v),
          textInputAction: TextInputAction.next,
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: TextFormField(
                controller: _vehicleYearCtrl,
                decoration: const InputDecoration(
                  labelText: 'سنة الصنع *',
                  prefixIcon: Icon(Icons.calendar_today, color: AppColors.primary),
                ),
                keyboardType: TextInputType.number,
                validator: (v) => _selectedVehicleId != null ? null : Validators.required(v),
                textInputAction: TextInputAction.next,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: TextFormField(
                controller: _vehiclePlateCtrl,
                decoration: const InputDecoration(
                  labelText: 'رقم اللوحة *',
                  prefixIcon: Icon(Icons.pin, color: AppColors.primary),
                ),
                validator: (v) => _selectedVehicleId != null ? null : Validators.required(v),
                textInputAction: TextInputAction.next,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: TextFormField(
                controller: _vehicleMileageCtrl,
                decoration: const InputDecoration(
                  labelText: 'العداد (كم)',
                  prefixIcon: Icon(Icons.speed, color: AppColors.primary),
                ),
                keyboardType: TextInputType.number,
                textInputAction: TextInputAction.next,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: TextFormField(
                controller: _vehicleColorCtrl,
                decoration: const InputDecoration(
                  labelText: 'اللون',
                  prefixIcon: Icon(Icons.palette, color: AppColors.primary),
                ),
                textInputAction: TextInputAction.next,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _vehicleVinCtrl,
          decoration: const InputDecoration(
            labelText: 'رقم الهيكل (VIN)',
            prefixIcon: Icon(Icons.confirmation_number, color: AppColors.primary),
          ),
          textInputAction: TextInputAction.next,
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _vehicleNotesCtrl,
          decoration: const InputDecoration(
            labelText: 'ملاحظات المركبة',
            prefixIcon: Icon(Icons.notes, color: AppColors.primary),
          ),
          maxLines: 2,
        ),
      ],
    );
  }

  Widget _buildServiceStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildCard(
          title: 'الخدمات *',
          icon: Icons.build,
          children: [
            if (_services.isEmpty)
              const Text('لا توجد خدمات متوفرة')
            else
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
          ],
        ),
        const SizedBox(height: 16),
        _buildCard(
          title: 'تفاصيل الموعد',
          icon: Icons.calendar_month,
          children: [
            Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: () => _pickDate(estimated: false),
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
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: InkWell(
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
                ),
              ],
            ),
            const SizedBox(height: 16),
            InkWell(
              onTap: () => _pickDate(estimated: true),
              child: InputDecorator(
                decoration: const InputDecoration(
                  labelText: 'تاريخ الانتهاء المتوقع',
                  prefixIcon: Icon(Icons.event_available, color: AppColors.primary),
                ),
                child: Text(
                  _estimatedCompletionDate != null
                      ? DateFormat('yyyy-MM-dd').format(_estimatedCompletionDate!)
                      : 'اختر التاريخ',
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        _buildCard(
          title: 'إعدادات الحجز',
          icon: Icons.settings,
          children: [
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
            const SizedBox(height: 16),
            TextFormField(
              controller: _notesCtrl,
              decoration: const InputDecoration(
                labelText: 'ملاحظات الخدمة',
                prefixIcon: Icon(Icons.notes, color: AppColors.primary),
              ),
              maxLines: 3,
            ),
          ],
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
      ],
    );
  }

  Widget _buildCard({required String title, required IconData icon, required List<Widget> children}) {
    return Card(
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.lg)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: AppColors.primary, size: 22),
                const SizedBox(width: 10),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const Divider(height: 24),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppColors.textTertiary),
        const SizedBox(width: 8),
        Text(
          '$label: ',
          style: const TextStyle(color: AppColors.textSecondary, fontSize: 14),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Widget _buildDropdown<T>({
    required String label,
    required IconData icon,
    required T? value,
    required List<DropdownMenuItem<T>> items,
    required void Function(T?) onChanged,
    String? Function(T?)? validator,
  }) {
    return FormField<T>(
      initialValue: value,
      validator: validator,
      builder: (field) {
        return InputDecorator(
          decoration: InputDecoration(
            labelText: label,
            prefixIcon: Icon(icon, color: AppColors.primary),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
            errorText: field.errorText,
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<T>(
              value: field.value,
              isDense: true,
              isExpanded: true,
              hint: const Text('اختر'),
              items: items,
              onChanged: (value) {
                field.didChange(value);
                onChanged(value);
              },
            ),
          ),
        );
      },
    );
  }
}
