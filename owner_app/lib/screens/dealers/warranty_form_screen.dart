import 'package:flutter/material.dart';
import '../../core/constants.dart';
import '../../models/warranty.dart';
import '../../repositories/dealer_repository.dart';
import '../../widgets/app_text_field.dart';

class WarrantyFormScreen extends StatefulWidget {
  final String dealerId;
  final DealerWarranty? warranty;

  const WarrantyFormScreen({
    super.key,
    required this.dealerId,
    this.warranty,
  });

  @override
  State<WarrantyFormScreen> createState() => _WarrantyFormScreenState();
}

class _WarrantyFormScreenState extends State<WarrantyFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _customerNameCtrl = TextEditingController();
  final _customerPhoneCtrl = TextEditingController();
  final _manufacturerCtrl = TextEditingController();
  final _vehicleModelCtrl = TextEditingController();
  final _vehicleYearCtrl = TextEditingController();
  final _chassisNumberCtrl = TextEditingController();
  final _plateNumberCtrl = TextEditingController();
  final _mileageCtrl = TextEditingController();
  final _colorCtrl = TextEditingController();
  final _durationMonthsCtrl = TextEditingController();
  final _amountPaidCtrl = TextEditingController();
  String _currency = 'SYP';
  bool _loading = false;

  bool get _isEdit => widget.warranty != null;

  @override
  void initState() {
    super.initState();
    if (_isEdit) {
      final w = widget.warranty!;
      _customerNameCtrl.text = w.customerName;
      _customerPhoneCtrl.text = w.customerPhone;
      _manufacturerCtrl.text = w.manufacturer;
      _vehicleModelCtrl.text = w.vehicleModel;
      _vehicleYearCtrl.text = w.vehicleYear.toString();
      _chassisNumberCtrl.text = w.chassisNumber;
      _plateNumberCtrl.text = w.plateNumber;
      _mileageCtrl.text = w.mileage.toString();
      _colorCtrl.text = w.color;
      _durationMonthsCtrl.text = w.durationMonths.toString();
      _amountPaidCtrl.text = w.amountPaid.toStringAsFixed(
          w.amountPaid.truncateToDouble() == w.amountPaid ? 0 : 2);
      _currency = w.currency;
    } else {
      _durationMonthsCtrl.text = '12';
      _mileageCtrl.text = '0';
      _amountPaidCtrl.text = '0';
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);
    try {
      final data = <String, dynamic>{
        'customerName': _customerNameCtrl.text.trim(),
        'customerPhone': _customerPhoneCtrl.text.trim(),
        'manufacturer': _manufacturerCtrl.text.trim(),
        'vehicleModel': _vehicleModelCtrl.text.trim(),
        'vehicleYear': int.tryParse(_vehicleYearCtrl.text.trim()) ?? 0,
        'chassisNumber': _chassisNumberCtrl.text.trim(),
        'plateNumber': _plateNumberCtrl.text.trim(),
        'mileage': int.tryParse(_mileageCtrl.text.trim()) ?? 0,
        'color': _colorCtrl.text.trim(),
        'durationMonths': int.tryParse(_durationMonthsCtrl.text.trim()) ?? 0,
        'amountPaid': double.tryParse(_amountPaidCtrl.text.trim()) ?? 0,
        'currency': _currency,
      };

      if (_isEdit) {
        await DealerRepository().updateWarranty(widget.warranty!.id, data);
      } else {
        await DealerRepository().createWarranty(widget.dealerId, data);
      }

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_isEdit ? 'تم تحديث الكفالة' : 'تم إضافة الكفالة')),
      );
      Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('حدث خطأ: $e'), backgroundColor: AppColors.error),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _customerNameCtrl.dispose();
    _customerPhoneCtrl.dispose();
    _manufacturerCtrl.dispose();
    _vehicleModelCtrl.dispose();
    _vehicleYearCtrl.dispose();
    _chassisNumberCtrl.dispose();
    _plateNumberCtrl.dispose();
    _mileageCtrl.dispose();
    _colorCtrl.dispose();
    _durationMonthsCtrl.dispose();
    _amountPaidCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEdit ? 'تعديل كفالة' : 'كفالة جديدة'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              AppTextField(
                controller: _customerNameCtrl,
                label: 'اسم العميل',
                icon: Icons.person,
                required: true,
              ),
              const SizedBox(height: 16),
              AppTextField(
                controller: _customerPhoneCtrl,
                label: 'رقم الهاتف',
                icon: Icons.phone,
                keyboardType: TextInputType.phone,
                validationType: ValidationType.phone,
              ),
              const SizedBox(height: 16),
              AppTextField(
                controller: _manufacturerCtrl,
                label: 'الشركة المصنعة',
                icon: Icons.factory,
                required: true,
              ),
              const SizedBox(height: 16),
              AppTextField(
                controller: _vehicleModelCtrl,
                label: 'موديل المركبة',
                icon: Icons.directions_car,
                required: true,
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: AppTextField(
                      controller: _vehicleYearCtrl,
                      label: 'سنة الصنع',
                      icon: Icons.calendar_today,
                      keyboardType: TextInputType.number,
                      required: true,
                      validator: (v) {
                        final year = int.tryParse(v ?? '');
                        if (year == null || year < 1900 || year > 2100) {
                          return 'سنة غير صحيحة';
                        }
                        return null;
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: AppTextField(
                      controller: _mileageCtrl,
                      label: 'المسافة (km)',
                      icon: Icons.speed,
                      keyboardType: TextInputType.number,
                      required: true,
                      validator: (v) {
                        final km = int.tryParse(v ?? '');
                        if (km == null || km < 0) return 'قيمة غير صحيحة';
                        return null;
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              AppTextField(
                controller: _chassisNumberCtrl,
                label: 'رقم الشاسيه',
                icon: Icons.confirmation_number,
                required: true,
              ),
              const SizedBox(height: 16),
              AppTextField(
                controller: _plateNumberCtrl,
                label: 'رقم اللوحة',
                icon: Icons.pin,
                required: true,
              ),
              const SizedBox(height: 16),
              AppTextField(
                controller: _colorCtrl,
                label: 'اللون',
                icon: Icons.palette,
                required: true,
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: AppTextField(
                      controller: _durationMonthsCtrl,
                      label: 'المدة (أشهر)',
                      icon: Icons.schedule,
                      keyboardType: TextInputType.number,
                      required: true,
                      validator: (v) {
                        final m = int.tryParse(v ?? '');
                        if (m == null || m <= 0) return 'قيمة غير صحيحة';
                        return null;
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: AppTextField(
                      controller: _amountPaidCtrl,
                      label: 'المبلغ المدفوع',
                      icon: Icons.payments,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      required: true,
                      validator: (v) {
                        final a = double.tryParse(v ?? '');
                        if (a == null || a < 0) return 'قيمة غير صحيحة';
                        return null;
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                initialValue: _currency,
                decoration: const InputDecoration(
                  labelText: 'العملة',
                  prefixIcon: Icon(Icons.monetization_on, color: AppColors.primary),
                ),
                items: const [
                  DropdownMenuItem(value: 'SYP', child: Text('ليرة سورية (ل.س)')),
                  DropdownMenuItem(value: 'USD', child: Text('دولار أمريكي (\$)')),
                ],
                onChanged: (v) => setState(() => _currency = v ?? 'SYP'),
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _loading ? null : _save,
                  child: _loading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : Text(_isEdit ? 'حفظ التعديلات' : 'إضافة الكفالة'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
