import 'package:flutter/material.dart';
import '../core/constants.dart';
import '../services/api_service.dart';
import 'warranty_detail_screen.dart';

class WarrantyFormScreen extends StatefulWidget {
  final bool existingCustomer;
  final Map<String, dynamic>? warranty; // If provided, we're in edit mode
  const WarrantyFormScreen({super.key, this.existingCustomer = false, this.warranty});

  @override
  State<WarrantyFormScreen> createState() => _WarrantyFormScreenState();
}

class _WarrantyFormScreenState extends State<WarrantyFormScreen> {
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _manufacturerCtrl = TextEditingController();
  final _modelCtrl = TextEditingController();
  final _yearCtrl = TextEditingController();
  final _chassisCtrl = TextEditingController();
  final _plateCtrl = TextEditingController();
  final _mileageCtrl = TextEditingController();
  final _colorCtrl = TextEditingController();
  final _amountCtrl = TextEditingController();
  int _durationMonths = 12;
  bool _loading = false;

  bool get _isEditMode => widget.warranty != null;

  final _durations = [
    {'label': 'سنة واحدة', 'months': 12},
    {'label': '3 سنوات', 'months': 36},
    {'label': '5 سنوات', 'months': 60},
  ];

  @override
  void initState() {
    super.initState();
    if (_isEditMode) {
      final w = widget.warranty!;
      _nameCtrl.text = w['customerName'] ?? '';
      _phoneCtrl.text = w['customerPhone'] ?? '';
      _manufacturerCtrl.text = w['manufacturer'] ?? '';
      _modelCtrl.text = w['vehicleModel'] ?? '';
      _yearCtrl.text = w['vehicleYear']?.toString() ?? '';
      _chassisCtrl.text = w['chassisNumber'] ?? '';
      _plateCtrl.text = w['plateNumber'] ?? '';
      _mileageCtrl.text = w['mileage']?.toString() ?? '';
      _colorCtrl.text = w['color'] ?? '';
      _amountCtrl.text = w['amountPaid']?.toString() ?? '';
      _durationMonths = w['durationMonths'] ?? 12;
    }
  }

  Future<void> _submit() async {
    final required = [
      _nameCtrl, _phoneCtrl, _manufacturerCtrl, _modelCtrl,
      _yearCtrl, _chassisCtrl, _plateCtrl, _mileageCtrl, _colorCtrl, _amountCtrl
    ];
    for (final c in required) {
      if (c.text.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('يرجى ملء جميع الحقول')),
        );
        return;
      }
    }

    setState(() => _loading = true);
    try {
      final data = {
        'customerName': _nameCtrl.text.trim(),
        'customerPhone': _phoneCtrl.text.trim(),
        'manufacturer': _manufacturerCtrl.text.trim(),
        'vehicleModel': _modelCtrl.text.trim(),
        'vehicleYear': int.parse(_yearCtrl.text.trim()),
        'chassisNumber': _chassisCtrl.text.trim(),
        'plateNumber': _plateCtrl.text.trim(),
        'mileage': int.parse(_mileageCtrl.text.trim()),
        'color': _colorCtrl.text.trim(),
        'durationMonths': _durationMonths,
        'amountPaid': double.parse(_amountCtrl.text.trim()),
      };

      final warranty = _isEditMode
          ? await ApiService.updateWarranty(widget.warranty!['id'], data)
          : await ApiService.createWarranty(data);

      if (mounted) {
        // Pop back with success to trigger HomeScreen refresh
        Navigator.pop(context, true);
        // Then show the detail
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => WarrantyDetailScreen(warranty: warranty, isNew: !_isEditMode)),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: AppColors.error),
        );
      }
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        title: Text(_isEditMode ? 'تعديل كفالة' : 'تسجيل كفالة جديدة'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSectionTitle('معلومات العميل'),
            _buildField(_nameCtrl, 'اسم العميل', Icons.person),
            const SizedBox(height: 12),
            _buildField(_phoneCtrl, 'رقم الهاتف (واتساب)', Icons.phone, type: TextInputType.phone),
            const SizedBox(height: 24),
            _buildSectionTitle('معلومات المركبة'),
            _buildField(_manufacturerCtrl, 'الشركة المصنعة', Icons.factory),
            const SizedBox(height: 12),
            _buildField(_modelCtrl, 'موديل السيارة', Icons.directions_car),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _buildField(_yearCtrl, 'سنة الصنع', Icons.calendar_today, type: TextInputType.number)),
                const SizedBox(width: 12),
                Expanded(child: _buildField(_colorCtrl, 'اللون', Icons.color_lens)),
              ],
            ),
            const SizedBox(height: 12),
            _buildField(_chassisCtrl, 'رقم الشاصيه', Icons.confirmation_number),
            const SizedBox(height: 12),
            _buildField(_plateCtrl, 'رقم اللوحة', Icons.pin),
            const SizedBox(height: 12),
            _buildField(_mileageCtrl, 'عداد السيارة (كم)', Icons.speed, type: TextInputType.number),
            const SizedBox(height: 24),
            _buildSectionTitle('مدة الكفالة'),
            Row(
              children: _durations.map((d) {
                final selected = _durationMonths == (d['months'] as int);
                return Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _durationMonths = d['months'] as int),
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      decoration: BoxDecoration(
                        color: selected ? AppColors.primary : AppColors.surface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: selected ? AppColors.primary : AppColors.border),
                      ),
                      child: Text(
                        d['label'] as String,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: selected ? Colors.white : AppColors.textPrimary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 24),
            _buildSectionTitle('المبلغ المدفوع'),
            _buildField(_amountCtrl, 'المبلغ (ل.س)', Icons.payments, type: TextInputType.number),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: _loading ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.success,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 4,
                ),
                child: _loading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : Text(_isEditMode ? 'حفظ التعديلات' : 'تسجيل الكفالة', style: const TextStyle(fontSize: 18, color: Colors.white)),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(title,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primary)),
    );
  }

  Widget _buildField(TextEditingController ctrl, String label, IconData icon,
      {TextInputType type = TextInputType.text}) {
    return TextField(
      controller: ctrl,
      keyboardType: type,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: AppColors.primary),
        filled: true,
        fillColor: AppColors.surface,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
      ),
    );
  }
}
