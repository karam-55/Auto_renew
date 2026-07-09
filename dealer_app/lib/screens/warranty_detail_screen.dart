import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:printing/printing.dart';
import 'package:intl/intl.dart';
import '../core/constants.dart';
import 'warranty_form_screen.dart';
import '../services/api_service.dart';

class WarrantyDetailScreen extends StatefulWidget {
  final Map<String, dynamic> warranty;
  final bool isNew;

  const WarrantyDetailScreen({super.key, required this.warranty, this.isNew = false});

  @override
  State<WarrantyDetailScreen> createState() => _WarrantyDetailScreenState();
}

class _WarrantyDetailScreenState extends State<WarrantyDetailScreen> {
  bool _sending = false;

  String _fmt(dynamic date) {
    if (date == null) return '';
    final d = DateTime.tryParse(date.toString());
    if (d == null) return date.toString();
    return DateFormat('yyyy-MM-dd').format(d);
  }

  Future<void> _downloadAndDoPdf({required bool share}) async {
    setState(() => _sending = true);
    try {
      final bytes = await ApiService.downloadWarrantyPdf(widget.warranty['id']);
      final pdfBytes = Uint8List.fromList(bytes);
      if (share) {
        await Printing.sharePdf(bytes: pdfBytes, filename: 'warranty_${widget.warranty['id']}.pdf');
      } else {
        await Printing.layoutPdf(onLayout: (format) => pdfBytes);
      }
    } catch (e, st) {
      debugPrint('PDF Error: $e\n$st');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('خطأ: ${e.toString()}'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final w = widget.warranty;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        title: const Text('شهادة الكفالة'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () async {
              final navigator = Navigator.of(context);
              final result = await navigator.push(
                MaterialPageRoute(builder: (_) => WarrantyFormScreen(warranty: w)),
              );
              if (!mounted) return;
              if (result == true) {
                navigator.pop(true); // Return to HomeScreen with refresh
              }
            },
          ),
          IconButton(
            icon: const Icon(Icons.delete, color: Colors.redAccent),
            onPressed: () async {
              final navigator = Navigator.of(context);
              final messenger = ScaffoldMessenger.of(context);
              final confirmed = await showDialog<bool>(
                context: context,
                builder: (_) => AlertDialog(
                  title: const Text('تأكيد الحذف'),
                  content: const Text('هل أنت متأكد من حذف هذه الكفالة؟ لا يمكن التراجع عن هذا الإجراء.'),
                  actions: [
                    TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('إلغاء')),
                    ElevatedButton(
                      onPressed: () => Navigator.pop(context, true),
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                      child: const Text('حذف', style: TextStyle(color: Colors.white)),
                    ),
                  ],
                ),
              );
              if (confirmed == true) {
                if (!mounted) return;
                try {
                  await ApiService.deleteWarranty(w['id']);
                  if (!mounted) return;
                  navigator.pop(true); // Return to HomeScreen with refresh
                } catch (e) {
                  if (!mounted) return;
                  messenger.showSnackBar(
                    SnackBar(content: Text('خطأ: ${e.toString()}'), backgroundColor: AppColors.error),
                  );
                }
              }
            },
          ),
          IconButton(
            icon: _sending ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Icon(Icons.share),
            onPressed: _sending ? null : () => _downloadAndDoPdf(share: true),
          ),
          IconButton(
            icon: const Icon(Icons.print),
            onPressed: _sending ? null : () => _downloadAndDoPdf(share: false),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (widget.isNew)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: AppColors.success.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.success),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.check_circle, color: AppColors.success),
                    SizedBox(width: 8),
                    Text('تم تسجيل الكفالة بنجاح!', style: TextStyle(color: AppColors.success, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            _buildCard('تفاصيل العميل', [
              _buildRow('الاسم', w['customerName']),
              _buildRow('الهاتف', w['customerPhone']),
            ]),
            const SizedBox(height: 16),
            _buildCard('تفاصيل المركبة', [
              _buildRow('الشركة المصنعة', w['manufacturer']),
              _buildRow('الموديل', w['vehicleModel']),
              _buildRow('سنة الصنع', '${w['vehicleYear']}'),
              _buildRow('رقم الشاصيه', w['chassisNumber']),
              _buildRow('رقم اللوحة', w['plateNumber']),
              _buildRow('العداد', '${w['mileage']} كم'),
              _buildRow('اللون', w['color']),
            ]),
            const SizedBox(height: 16),
            _buildCard('تفاصيل الكفالة', [
              _buildRow('المدة', '${w['durationMonths']} شهر'),
              _buildRow('المبلغ المدفوع', '${w['amountPaid']} ${w['currency'] == 'USD' ? '\$' : 'ل.س'}'),
              _buildRow('تاريخ البدء', _fmt(w['startDate'])),
              _buildRow('تاريخ الانتهاء', _fmt(w['endDate'])),
            ]),
            const SizedBox(height: 24),
            const Text('شروط الكفالة',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.primary)),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Text(warrantyTerms, style: TextStyle(fontSize: 13, height: 1.8)),
            ),
            const SizedBox(height: 80),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 12)],
        ),
        child: SafeArea(
          child: Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _sending ? null : () => _downloadAndDoPdf(share: true),
                  icon: const Icon(Icons.share),
                  label: const Text('مشاركة PDF'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _sending ? null : () => _downloadAndDoPdf(share: false),
                  icon: const Icon(Icons.print),
                  label: const Text('طباعة'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.accent,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCard(String title, List<Widget> children) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 12, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primary)),
          const SizedBox(height: 12),
          ...children,
        ],
      ),
    );
  }

  Widget _buildRow(String label, dynamic value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 14)),
          const Spacer(),
          Text('$value', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        ],
      ),
    );
  }
}
