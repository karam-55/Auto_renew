import 'package:flutter/material.dart';
import '../../core/constants.dart';
import '../../models/dealer.dart';
import '../../repositories/dealer_repository.dart';
import '../../widgets/app_text_field.dart';

class DealerFormScreen extends StatefulWidget {
  final Dealer? dealer;

  const DealerFormScreen({super.key, this.dealer});

  @override
  State<DealerFormScreen> createState() => _DealerFormScreenState();
}

class _DealerFormScreenState extends State<DealerFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _companyCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _cityCtrl = TextEditingController();
  bool _loading = false;

  bool get _isEdit => widget.dealer != null;

  @override
  void initState() {
    super.initState();
    if (_isEdit) {
      final d = widget.dealer!;
      _nameCtrl.text = d.name;
      _companyCtrl.text = d.companyName;
      _phoneCtrl.text = d.phone;
      _addressCtrl.text = d.address ?? '';
      _cityCtrl.text = d.city ?? '';
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);
    try {
      final dealer = Dealer(
        id: widget.dealer?.id ?? '',
        name: _nameCtrl.text.trim(),
        companyName: _companyCtrl.text.trim(),
        phone: _phoneCtrl.text.trim(),
        address: _addressCtrl.text.trim(),
        city: _cityCtrl.text.trim(),
      );

      if (_isEdit) {
        await DealerRepository().update(widget.dealer!.id, dealer);
      } else {
        await DealerRepository().create(dealer);
      }

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_isEdit ? 'تم تحديث الوكيل' : 'تم إضافة الوكيل')),
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
    _companyCtrl.dispose();
    _phoneCtrl.dispose();
    _addressCtrl.dispose();
    _cityCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEdit ? 'تعديل وكيل' : 'وكيل جديد'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              AppTextField(
                controller: _companyCtrl,
                label: 'اسم الشركة / الوكالة',
                icon: Icons.business,
                required: true,
              ),
              const SizedBox(height: 16),
              AppTextField(
                controller: _nameCtrl,
                label: 'اسم المسؤول',
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
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _loading ? null : _save,
                  child: _loading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : Text(_isEdit ? 'حفظ التعديلات' : 'إضافة الوكيل'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
