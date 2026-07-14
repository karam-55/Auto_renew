import 'package:flutter/material.dart';
import '../../core/constants.dart';
import '../../models/customer.dart';
import '../../models/vehicle.dart';
import '../../repositories/customer_repository.dart';
import '../../repositories/vehicle_repository.dart';
import '../../widgets/app_text_field.dart';

class VehicleFormScreen extends StatefulWidget {
  final Vehicle? vehicle;

  const VehicleFormScreen({super.key, this.vehicle});

  @override
  State<VehicleFormScreen> createState() => _VehicleFormScreenState();
}

class _VehicleFormScreenState extends State<VehicleFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _makeCtrl = TextEditingController();
  final _modelCtrl = TextEditingController();
  final _yearCtrl = TextEditingController();
  final _plateCtrl = TextEditingController();
  final _vinCtrl = TextEditingController();
  final _colorCtrl = TextEditingController();
  final _mileageCtrl = TextEditingController();

  List<Customer> _customers = [];
  String? _selectedCustomerId;
  bool _loadingCustomers = true;
  bool _saving = false;
  String? _error;

  bool get _isEdit => widget.vehicle != null;

  @override
  void initState() {
    super.initState();
    if (_isEdit) {
      final v = widget.vehicle!;
      _makeCtrl.text = v.make;
      _modelCtrl.text = v.model;
      _yearCtrl.text = v.year?.toString() ?? '';
      _plateCtrl.text = v.licensePlate ?? '';
      _vinCtrl.text = v.vin ?? '';
      _colorCtrl.text = v.color ?? '';
      _mileageCtrl.text = v.mileage?.toString() ?? '';
      _selectedCustomerId = v.customerId;
    }
    _loadCustomers();
  }

  Future<void> _loadCustomers() async {
    try {
      final customers = await CustomerRepository().getAll();
      if (!mounted) return;
      setState(() {
        _customers = customers;
        _loadingCustomers = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loadingCustomers = false;
      });
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedCustomerId == null || _selectedCustomerId!.isEmpty) {
      setState(() => _error = 'يرجى اختيار العميل');
      return;
    }

    setState(() {
      _saving = true;
      _error = null;
    });

    try {
      final vehicle = Vehicle(
        id: widget.vehicle?.id ?? '',
        customerId: _selectedCustomerId!,
        make: _makeCtrl.text.trim(),
        model: _modelCtrl.text.trim(),
        year: _yearCtrl.text.isEmpty ? null : int.tryParse(_yearCtrl.text.trim()),
        licensePlate: _plateCtrl.text.trim(),
        vin: _vinCtrl.text.trim(),
        color: _colorCtrl.text.trim(),
        mileage: _mileageCtrl.text.isEmpty ? null : int.tryParse(_mileageCtrl.text.trim()),
      );

      if (_isEdit) {
        await VehicleRepository().update(widget.vehicle!.id, vehicle);
      } else {
        await VehicleRepository().create(vehicle);
      }

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_isEdit ? 'تم تحديث المركبة' : 'تم إضافة المركبة')),
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
    _makeCtrl.dispose();
    _modelCtrl.dispose();
    _yearCtrl.dispose();
    _plateCtrl.dispose();
    _vinCtrl.dispose();
    _colorCtrl.dispose();
    _mileageCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEdit ? 'تعديل مركبة' : 'مركبة جديدة'),
      ),
      body: _loadingCustomers
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  children: [
                    _buildCustomerDropdown(),
                    const SizedBox(height: 16),
                    AppTextField(
                      controller: _makeCtrl,
                      label: 'الشركة المصنعة',
                      icon: Icons.factory,
                      required: true,
                    ),
                    const SizedBox(height: 16),
                    AppTextField(
                      controller: _modelCtrl,
                      label: 'الموديل',
                      icon: Icons.directions_car,
                      required: true,
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: AppTextField(
                            controller: _yearCtrl,
                            label: 'سنة الصنع',
                            icon: Icons.calendar_today,
                            keyboardType: TextInputType.number,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: AppTextField(
                            controller: _colorCtrl,
                            label: 'اللون',
                            icon: Icons.color_lens,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    AppTextField(
                      controller: _plateCtrl,
                      label: 'رقم اللوحة',
                      icon: Icons.pin,
                    ),
                    const SizedBox(height: 16),
                    AppTextField(
                      controller: _vinCtrl,
                      label: 'رقم الشاصيه (VIN)',
                      icon: Icons.confirmation_number,
                    ),
                    const SizedBox(height: 16),
                    AppTextField(
                      controller: _mileageCtrl,
                      label: 'عداد المركبة (كم)',
                      icon: Icons.speed,
                      keyboardType: TextInputType.number,
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
                            : Text(_isEdit ? 'حفظ التعديلات' : 'إضافة المركبة'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildCustomerDropdown() {
    return InputDecorator(
      decoration: InputDecoration(
        labelText: 'العميل *',
        prefixIcon: const Icon(Icons.person, color: AppColors.primary),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: _selectedCustomerId,
          isDense: true,
          hint: const Text('اختر العميل'),
          items: _customers.map((customer) {
            return DropdownMenuItem<String>(
              value: customer.id,
              child: Text(customer.fullName),
            );
          }).toList(),
          onChanged: (value) => setState(() => _selectedCustomerId = value),
        ),
      ),
    );
  }
}
