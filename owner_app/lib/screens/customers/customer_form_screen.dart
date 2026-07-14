import 'package:flutter/material.dart';
import '../../core/constants.dart';
import '../../models/customer.dart';
import '../../repositories/customer_repository.dart';
import '../../widgets/app_text_field.dart';

class CustomerFormScreen extends StatefulWidget {
  final Customer? customer;

  const CustomerFormScreen({super.key, this.customer});

  @override
  State<CustomerFormScreen> createState() => _CustomerFormScreenState();
}

class _CustomerFormScreenState extends State<CustomerFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _cityCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  bool _loading = false;

  bool get _isEdit => widget.customer != null;

  @override
  void initState() {
    super.initState();
    if (_isEdit) {
      final c = widget.customer!;
      _nameCtrl.text = c.fullName;
      _phoneCtrl.text = c.phone;
      _addressCtrl.text = c.address ?? '';
      _cityCtrl.text = c.city ?? '';
      _notesCtrl.text = c.notes ?? '';
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);
    try {
      final customer = Customer(
        id: widget.customer?.id ?? '',
        fullName: _nameCtrl.text.trim(),
        phone: _phoneCtrl.text.trim(),
        address: _addressCtrl.text.trim(),
        city: _cityCtrl.text.trim(),
        notes: _notesCtrl.text.trim(),
      );

      if (_isEdit) {
        await CustomerRepository().update(widget.customer!.id, customer);
      } else {
        await CustomerRepository().create(customer);
      }

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_isEdit ? 'تم تحديث العميل' : 'تم إضافة العميل')),
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
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _addressCtrl.dispose();
    _cityCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEdit ? 'تعديل عميل' : 'عميل جديد'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              AppTextField(
                controller: _nameCtrl,
                label: 'الاسم الكامل',
                icon: Icons.person,
                required: true,
              ),
              const SizedBox(height: 16),
              AppTextField(
                controller: _phoneCtrl,
                label: 'رقم الهاتف',
                icon: Icons.phone,
                keyboardType: TextInputType.phone,
                validationType: ValidationType.phone,
              ),
              const SizedBox(height: 16),
              AppTextField(
                controller: _addressCtrl,
                label: 'العنوان',
                icon: Icons.location_on,
              ),
              const SizedBox(height: 16),
              AppTextField(
                controller: _cityCtrl,
                label: 'المدينة',
                icon: Icons.location_city,
              ),
              const SizedBox(height: 16),
              AppTextField(
                controller: _notesCtrl,
                label: 'ملاحظات',
                icon: Icons.notes,
                maxLines: 3,
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _loading ? null : _save,
                  child: _loading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : Text(_isEdit ? 'حفظ التعديلات' : 'إضافة العميل'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
