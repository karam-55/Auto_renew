import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:path_provider/path_provider.dart';
import 'package:intl/intl.dart';
import '../core/constants.dart';

class WarrantyDetailScreen extends StatefulWidget {
  final Map<String, dynamic> warranty;
  final bool isNew;

  const WarrantyDetailScreen({super.key, required this.warranty, this.isNew = false});

  @override
  State<WarrantyDetailScreen> createState() => _WarrantyDetailScreenState();
}

class _WarrantyDetailScreenState extends State<WarrantyDetailScreen> {
  bool _sending = false;

  Future<pw.Document> _generatePdf() async {
    final pdf = pw.Document();
    final fontData = await rootBundle.load('assets/fonts/NotoNaskhArabic-Regular.ttf');
    final arabicFont = pw.Font.ttf(fontData);

    final w = widget.warranty;
    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        build: (context) => pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Center(
              child: pw.Text('Auto Renew - شهادة كفالة', style: pw.TextStyle(fontSize: 24, fontWeight: pw.FontWeight.bold)),
            ),
            pw.SizedBox(height: 20),
            pw.Text('تفاصيل العميل:', style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold)),
            pw.Text('الاسم: ${w['customerName']}'),
            pw.Text('الهاتف: ${w['customerPhone']}'),
            pw.SizedBox(height: 16),
            pw.Text('تفاصيل المركبة:', style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold)),
            pw.Text('الشركة: ${w['manufacturer']}'),
            pw.Text('الموديل: ${w['vehicleModel']}'),
            pw.Text('السنة: ${w['vehicleYear']}'),
            pw.Text('رقم الشاصيه: ${w['chassisNumber']}'),
            pw.Text('رقم اللوحة: ${w['plateNumber']}'),
            pw.Text('العداد: ${w['mileage']} كم'),
            pw.Text('اللون: ${w['color']}'),
            pw.SizedBox(height: 16),
            pw.Text('تفاصيل الكفالة:', style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold)),
            pw.Text('المدة: ${w['durationMonths']} شهر'),
            pw.Text('المبلغ المدفوع: ${w['amountPaid']} ل.س'),
            pw.Text('تاريخ البدء: ${_fmt(w['startDate'])}'),
            pw.Text('تاريخ الانتهاء: ${_fmt(w['endDate'])}'),
            pw.SizedBox(height: 24),
            pw.Text('شروط الكفالة:', style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold)),
            pw.Text(warrantyTerms, style: const pw.TextStyle(fontSize: 10)),
          ],
        ),
      ),
    );
    return pdf;
  }

  String _fmt(dynamic date) {
    if (date == null) return '';
    final d = DateTime.tryParse(date.toString());
    if (d == null) return date.toString();
    return DateFormat('yyyy-MM-dd').format(d);
  }

  Future<void> _sharePdf() async {
    setState(() => _sending = true);
    try {
      final pdf = await _generatePdf();
      await Printing.sharePdf(bytes: await pdf.save(), filename: 'warranty_${widget.warranty['id']}.pdf');
    } finally {
      setState(() => _sending = false);
    }
  }

  Future<void> _printPdf() async {
    setState(() => _sending = true);
    try {
      final pdf = await _generatePdf();
      await Printing.layoutPdf(onLayout: (format) async => pdf.save());
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
              final result = await Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => WarrantyFormScreen(warranty: w)),
              );
              if (result == true && mounted) {
                Navigator.pop(context, true); // Return to HomeScreen with refresh
              }
            },
          ),
          IconButton(
            icon: _sending ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Icon(Icons.share),
            onPressed: _sending ? null : _sharePdf,
          ),
          IconButton(
            icon: const Icon(Icons.print),
            onPressed: _sending ? null : _printPdf,
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
                  color: AppColors.success.withOpacity(0.1),
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
              _buildRow('المبلغ المدفوع', '${w['amountPaid']} ل.س'),
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
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 12)],
        ),
        child: SafeArea(
          child: Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _sending ? null : _sharePdf,
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
                  onPressed: _sending ? null : _printPdf,
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
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 12, offset: const Offset(0, 4))],
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
