import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';
import 'package:path_provider/path_provider.dart';

import '../../core/constants.dart';
import '../../models/booking.dart';
import '../../repositories/booking_repository.dart';

/// Booking ticket screen for the Owner app.
///
/// Mirrors the admin desktop app's printable ticket: shows booking details,
/// per-service prices, grand total, and a QR code linking to the public
/// tracking page. Provides a "Share PDF" button that generates a PDF and
/// shares it via the OS share sheet (WhatsApp / email / print / save).
class BookingTicketScreen extends StatefulWidget {
  final String bookingId;

  const BookingTicketScreen({super.key, required this.bookingId});

  @override
 State<BookingTicketScreen> createState() => _BookingTicketScreenState();
}

class _BookingTicketScreenState extends State<BookingTicketScreen> {
  Booking? _booking;
  bool _loading = true;
  String? _error;
  bool _sharing = false;

  static const _serverDomain = 'http://178.105.209.59';

  @override
  void initState() {
    super.initState();
    _loadBooking();
  }

  Future<void> _loadBooking() async {
    try {
      final booking = await BookingRepository().getById(widget.bookingId);
      if (!mounted) return;
      setState(() {
        _booking = booking;
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

  String get _qrUrl {
    final token = _booking?.publicToken;
    if (token != null && token.isNotEmpty) {
      return '$_serverDomain/customer/?token=$token';
    }
    return '$_serverDomain/customer/?booking=${widget.bookingId}';
  }

  String _statusLabel(String? status) {
    const map = {
      'PENDING': 'قيد الانتظار',
      'CONFIRMED': 'مؤكد',
      'IN_PROGRESS': 'قيد العمل',
      'WAITING_PARTS': 'بانتظار المواد',
      'READY': 'جاهز',
      'COMPLETED': 'مكتمل',
      'DELIVERED': 'تم التسليم',
      'CANCELLED': 'ملغي',
    };
    return map[status] ?? status ?? '-';
  }

  String _priorityLabel(String? p) {
    const map = {
      'LOW': 'منخفضة',
      'NORMAL': 'عادي',
      'MEDIUM': 'متوسطة',
      'HIGH': 'عالي',
      'URGENT': 'عاجل',
    };
    return map[p] ?? 'عادي';
  }

  Future<void> _sharePdf() async {
    if (_booking == null) return;
    setState(() => _sharing = true);
    try {
      final pdfBytes = await _buildPdf(_booking!);
      final dir = await getTemporaryDirectory();
      final file = File('${dir.path}/booking_ticket_${_booking!.id.substring(0, 8)}.pdf');
      await file.writeAsBytes(pdfBytes);
      await Share.shareXFiles(
        [XFile(file.path)],
        text: 'تذكرة حجز - Auto Renew',
        subject: 'تذكرة حجز رقم ${_booking!.id.substring(0, 8).toUpperCase()}',
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('فشل إنشاء PDF: $e')),
      );
    } finally {
      if (mounted) setState(() => _sharing = false);
    }
  }

  Future<Uint8List> _buildPdf(Booking b) async {
    final doc = pw.Document();

    // Build QR image bytes from the tracking URL.
    final qrValidationResult = await QrPainter(
      data: _qrUrl,
      version: QrVersions.auto,
      gapless: true,
      eyeStyle: const QrEyeStyle(
        eyeShape: QrEyeShape.square,
        color: Color(0xFF1E293B),
      ),
      dataModuleStyle: const QrDataModuleStyle(
        dataModuleShape: QrDataModuleShape.square,
        color: Color(0xFF1E293B),
      ),
    ).toImageData(200);
    final qrBytes = qrValidationResult?.buffer.asUint8List();

    final dateFormat = DateFormat('yyyy-MM-dd');
    final services = b.services;
    final totalSYP = b.totalSYP?.toInt() ??
        services.fold<int>(0, (sum, s) => sum + ((s['priceSYP'] ?? s['basePrice'] ?? 0) as num).toInt());

    doc.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(16),
        build: (ctx) {
          return pw.Directionality(
            textDirection: pw.TextDirection.rtl,
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                // Header
                pw.Container(
                  padding: const pw.EdgeInsets.only(bottom: 8),
                  decoration: const pw.BoxDecoration(
                    border: pw.Border(bottom: pw.BorderSide(width: 2, color: PdfColors.blue)),
                  ),
                  child: pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    children: [
                      pw.Column(
                        crossAxisAlignment: pw.CrossAxisAlignment.start,
                        children: [
                          pw.Text('تذكرة الحجز',
                              style: pw.TextStyle(fontSize: 22, fontWeight: pw.FontWeight.bold, color: PdfColors.blue)),
                          pw.SizedBox(height: 4),
                          pw.Text('Auto Renew - لخدمات السيارات',
                              style: const pw.TextStyle(fontSize: 11, color: PdfColors.grey600)),
                        ],
                      ),
                      pw.Column(
                        crossAxisAlignment: pw.CrossAxisAlignment.end,
                        children: [
                          pw.Text('رقم الحجز',
                              style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey600)),
                          pw.Text(b.id.substring(0, 8).toUpperCase(),
                              style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold)),
                        ],
                      ),
                    ],
                  ),
                ),
                pw.SizedBox(height: 16),

                // Customer + Vehicle grid
                pw.Row(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Expanded(
                      child: pw.Container(
                        padding: const pw.EdgeInsets.all(10),
                        decoration: pw.BoxDecoration(
                          border: pw.Border.all(color: PdfColors.grey300),
                          borderRadius: pw.BorderRadius.circular(6),
                        ),
                        child: pw.Column(
                          crossAxisAlignment: pw.CrossAxisAlignment.start,
                          children: [
                            pw.Text('بيانات العميل',
                                style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold, color: PdfColors.blue)),
                            pw.SizedBox(height: 6),
                            _pdfRow('الاسم', b.customer?['fullName']?.toString() ?? '-'),
                            _pdfRow('التاريخ', b.scheduledDate != null ? dateFormat.format(b.scheduledDate!) : '-'),
                            _pdfRow('الوقت', b.scheduledTime ?? '-'),
                          ],
                        ),
                      ),
                    ),
                    pw.SizedBox(width: 10),
                    pw.Expanded(
                      child: pw.Container(
                        padding: const pw.EdgeInsets.all(10),
                        decoration: pw.BoxDecoration(
                          border: pw.Border.all(color: PdfColors.grey300),
                          borderRadius: pw.BorderRadius.circular(6),
                        ),
                        child: pw.Column(
                          crossAxisAlignment: pw.CrossAxisAlignment.start,
                          children: [
                            pw.Text('بيانات المركبة',
                                style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold, color: PdfColors.blue)),
                            pw.SizedBox(height: 6),
                            _pdfRow('المركبة',
                                '${b.vehicle?['make'] ?? ''} ${b.vehicle?['model'] ?? ''}'.trim()),
                            _pdfRow('اللوحة', b.vehicle?['licensePlate']?.toString() ?? '-'),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                pw.SizedBox(height: 16),

                // Services table
                pw.Text('الخدمات المطلوبة',
                    style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold)),
                pw.SizedBox(height: 8),
                pw.Table(
                  border: pw.TableBorder.all(color: PdfColors.grey300, width: 0.5),
                  children: [
                    pw.TableRow(
                      decoration: const pw.BoxDecoration(color: PdfColors.grey200),
                      children: [
                        pw.Padding(padding: const pw.EdgeInsets.all(6), child: pw.Text('#', style: const pw.TextStyle(fontSize: 10))),
                        pw.Padding(padding: const pw.EdgeInsets.all(6), child: pw.Text('الخدمة', style: const pw.TextStyle(fontSize: 10))),
                        pw.Padding(
                          padding: const pw.EdgeInsets.all(6),
                          child: pw.Text('السعر (ل.س)', style: const pw.TextStyle(fontSize: 10), textAlign: pw.TextAlign.center),
                        ),
                      ],
                    ),
                    ...services.asMap().entries.map((entry) {
                      final i = entry.key + 1;
                      final s = entry.value;
                      final name = s['name']?.toString() ??
                          (s['service'] is Map ? (s['service']['name']?.toString() ?? 'خدمة') : 'خدمة');
                      final price = (s['priceSYP'] ?? s['basePrice'] ?? 0).toInt();
                      return pw.TableRow(
                        children: [
                          pw.Padding(padding: const pw.EdgeInsets.all(6), child: pw.Text('$i', style: const pw.TextStyle(fontSize: 10))),
                          pw.Padding(padding: const pw.EdgeInsets.all(6), child: pw.Text(name, style: const pw.TextStyle(fontSize: 10))),
                          pw.Padding(
                            padding: const pw.EdgeInsets.all(6),
                            child: pw.Text(price.toString(), style: const pw.TextStyle(fontSize: 10), textAlign: pw.TextAlign.center),
                          ),
                        ],
                      );
                    }),
                    // Total row
                    pw.TableRow(
                      decoration: const pw.BoxDecoration(color: PdfColors.blue50),
                      children: [
                        pw.Padding(padding: const pw.EdgeInsets.all(6), child: pw.Text('')),
                        pw.Padding(
                          padding: const pw.EdgeInsets.all(6),
                          child: pw.Text('الإجمالي', style: pw.TextStyle(fontSize: 11, fontWeight: pw.FontWeight.bold)),
                        ),
                        pw.Padding(
                          padding: const pw.EdgeInsets.all(6),
                          child: pw.Text(totalSYP.toString(),
                              style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold, color: PdfColors.blue),
                              textAlign: pw.TextAlign.center),
                        ),
                      ],
                    ),
                  ],
                ),
                pw.SizedBox(height: 16),

                // Status row
                pw.Row(
                  children: [
                    _pdfStatusChip('الحالة', _statusLabel(b.status)),
                    pw.SizedBox(width: 8),
                    _pdfStatusChip('الأولوية', _priorityLabel(b.priority)),
                    pw.SizedBox(width: 8),
                    _pdfStatusChip('الدفع', b.paymentMethod ?? 'CASH'),
                  ],
                ),
                pw.SizedBox(height: 20),

                // Footer + QR
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: pw.CrossAxisAlignment.end,
                  children: [
                    pw.Expanded(
                      child: pw.Column(
                        crossAxisAlignment: pw.CrossAxisAlignment.start,
                        children: [
                          pw.Text('يرجى إبراز هذه التذكرة عند وصولك للمركز.',
                              style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey700)),
                          pw.SizedBox(height: 4),
                          pw.Text('للاستفسارات: +963 900 000 000',
                              style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey500)),
                          if (b.notes != null && b.notes!.isNotEmpty) ...[
                            pw.SizedBox(height: 6),
                            pw.Text('ملاحظات: ${b.notes}',
                                style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey600)),
                          ],
                        ],
                      ),
                    ),
                    if (qrBytes != null)
                      pw.Column(
                        children: [
                          pw.Image(pw.MemoryImage(qrBytes), width: 90, height: 90),
                          pw.SizedBox(height: 4),
                          pw.Text('امسح لتتبع الحالة', style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey600)),
                        ],
                      ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );

    return doc.save();
  }

  pw.Widget _pdfRow(String label, String value) {
    return pw.Padding(
      padding: const pw.EdgeInsets.only(bottom: 4),
      child: pw.Row(
        children: [
          pw.Text('$label: ', style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey600)),
          pw.Expanded(
            child: pw.Text(value, style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  pw.Widget _pdfStatusChip(String label, String value) {
    return pw.Container(
      padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: pw.BoxDecoration(
        color: PdfColors.grey100,
        borderRadius: pw.BorderRadius.circular(4),
        border: pw.Border.all(color: PdfColors.grey300, width: 0.5),
      ),
      child: pw.Row(
        mainAxisSize: pw.MainAxisSize.min,
        children: [
          pw.Text('$label: ', style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey600)),
          pw.Text(value, style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('تذكرة الحجز'),
        centerTitle: true,
        actions: [
          if (_booking != null && !_sharing)
            IconButton(
              icon: const Icon(Icons.share),
              tooltip: 'مشاركة PDF',
              onPressed: _sharePdf,
            ),
          if (_sharing)
            const Padding(
              padding: EdgeInsets.all(14),
              child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Text(_error!, style: const TextStyle(color: AppColors.error), textAlign: TextAlign.center),
                  ),
                )
              : _buildTicket(context),
    );
  }

  Widget _buildTicket(BuildContext context) {
    final b = _booking!;
    final dateFormat = DateFormat('yyyy-MM-dd');
    final services = b.services;
    final totalSYP = b.totalSYP?.toInt() ??
        services.fold<int>(0, (sum, s) => sum + ((s['priceSYP'] ?? s['basePrice'] ?? 0) as num).toInt());

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Card(
        elevation: 4,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.confirmation_number, color: AppColors.primary, size: 28),
                      const SizedBox(width: 8),
                      Text('تذكرة الحجز',
                          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                              color: AppColors.primary, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      const Text('رقم الحجز', style: TextStyle(fontSize: 11, color: AppColors.textTertiary)),
                      Text(b.id.substring(0, 8).toUpperCase(),
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ],
              ),
              const Divider(height: 24),

              // Customer + Vehicle
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(child: _infoCard('بيانات العميل', Icons.person, [
                    _infoRow('الاسم', b.customer?['fullName']?.toString() ?? '-'),
                    _infoRow('التاريخ', b.scheduledDate != null ? dateFormat.format(b.scheduledDate!) : '-'),
                    _infoRow('الوقت', b.scheduledTime ?? '-'),
                  ])),
                  const SizedBox(width: 10),
                  Expanded(child: _infoCard('بيانات المركبة', Icons.directions_car, [
                    _infoRow('المركبة',
                        '${b.vehicle?['make'] ?? ''} ${b.vehicle?['model'] ?? ''}'.trim()),
                    _infoRow('اللوحة', b.vehicle?['licensePlate']?.toString() ?? '-'),
                  ])),
                ],
              ),
              const SizedBox(height: 16),

              // Services
              const Text('الخدمات المطلوبة',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              ...services.asMap().entries.map((entry) {
                final i = entry.key + 1;
                final s = entry.value;
                final name = s['name']?.toString() ??
                    (s['service'] is Map ? (s['service']['name']?.toString() ?? 'خدمة') : 'خدمة');
                final price = (s['priceSYP'] ?? s['basePrice'] ?? 0).toInt();
                return ListTile(
                  leading: CircleAvatar(radius: 12, child: Text('$i', style: const TextStyle(fontSize: 11))),
                  title: Text(name),
                  trailing: Text('$price ل.س', style: const TextStyle(fontWeight: FontWeight.w600)),
                  dense: true,
                );
              }),

              // Total
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('الإجمالي', style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.textSecondary)),
                    Text('$totalSYP ل.س',
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primary)),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Status chips
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _statusChip('الحالة', _statusLabel(b.status)),
                  _statusChip('الأولوية', _priorityLabel(b.priority)),
                  _statusChip('الدفع', b.paymentMethod ?? 'CASH'),
                ],
              ),
              const SizedBox(height: 16),

              if (b.notes != null && b.notes!.isNotEmpty) ...[
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.notes, size: 18, color: AppColors.textTertiary),
                      const SizedBox(width: 8),
                      Expanded(child: Text(b.notes!, style: const TextStyle(fontSize: 13))),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // QR + share hint
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('يرجى إبراز هذه التذكرة عند وصولك للمركز.',
                            style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                        const SizedBox(height: 4),
                        const Text('للاستفسارات: +963 900 000 000',
                            style: TextStyle(fontSize: 11, color: AppColors.textTertiary)),
                      ],
                    ),
                  ),
                  Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: QrImageView(
                          data: _qrUrl,
                          version: QrVersions.auto,
                          size: 90,
                          gapless: true,
                          backgroundColor: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text('امسح لتتبع الحالة',
                          style: TextStyle(fontSize: 10, color: AppColors.textTertiary)),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Share button
              FilledButton.icon(
                onPressed: _sharing ? null : _sharePdf,
                icon: _sharing
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.share),
                label: Text(_sharing ? 'جاري إنشاء PDF...' : 'مشاركة تذكرة PDF'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _infoCard(String title, IconData icon, List<Widget> children) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Icon(icon, color: AppColors.primary, size: 18),
            const SizedBox(width: 6),
            Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
          ]),
          const SizedBox(height: 8),
          ...children,
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          Text('$label: ', style: const TextStyle(fontSize: 12, color: AppColors.textTertiary)),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600))),
        ],
      ),
    );
  }

  Widget _statusChip(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('$label: ', style: const TextStyle(fontSize: 11, color: AppColors.textTertiary)),
          Text(value, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
