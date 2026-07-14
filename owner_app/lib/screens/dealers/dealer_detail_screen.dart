import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/constants.dart';
import '../../models/dealer.dart';
import '../../models/warranty.dart';
import '../../repositories/dealer_repository.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/error_state.dart';
import '../../widgets/loading_indicator.dart';

class DealerDetailScreen extends StatefulWidget {
  final Dealer dealer;

  const DealerDetailScreen({super.key, required this.dealer});

  @override
  State<DealerDetailScreen> createState() => _DealerDetailScreenState();
}

class _DealerDetailScreenState extends State<DealerDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<DealerWarranty> _warranties = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadWarranties();
  }

  Future<void> _loadWarranties() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await DealerRepository().getWarranties(widget.dealer.id);
      if (!mounted) return;
      setState(() {
        _warranties = data;
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

  List<Map<String, String>> _extractCustomers() {
    final map = <String, Map<String, String>>{};
    for (final w in _warranties) {
      map[w.customerPhone] = {
        'name': w.customerName,
        'phone': w.customerPhone,
      };
    }
    return map.values.toList();
  }

  Color _warrantyStatusColor(DealerWarranty w) {
    if (w.endDate != null && w.endDate!.isBefore(DateTime.now())) {
      return AppColors.error;
    }
    return AppColors.success;
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('تفاصيل الوكيل'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'المعلومات'),
            Tab(text: 'الكفالات'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildInfoTab(),
          _buildWarrantiesTab(),
        ],
      ),
    );
  }

  Widget _buildInfoTab() {
    final dealer = widget.dealer;
    final totalAmount = _warranties.fold<double>(0, (sum, w) => sum + w.amountPaid);
    final totalActive = _warranties.where((w) => w.endDate != null && w.endDate!.isAfter(DateTime.now())).length;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [AppColors.success, AppColors.primaryDark],
              begin: Alignment.topRight,
              end: Alignment.bottomLeft,
            ),
            borderRadius: BorderRadius.circular(AppRadius.lg),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                dealer.companyName,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                dealer.name,
                style: const TextStyle(color: Colors.white70, fontSize: 16),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        _buildInfoTile(Icons.phone, 'الهاتف', dealer.phone),
        _buildInfoTile(Icons.location_on, 'العنوان', dealer.address ?? 'غير متوفر'),
        _buildInfoTile(Icons.location_city, 'المدينة', dealer.city ?? 'غير متوفر'),
        const SizedBox(height: 24),
        const Text(
          'إحصائيات',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildStatCard('إجمالي المدفوع', _formatTotalAmount(totalAmount), Icons.account_balance_wallet),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard('إجمالي الكفالات', '${_warranties.length}', Icons.shield),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildStatCard('العملاء', '${_extractCustomers().length}', Icons.people),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard('الكفالات النشطة', '$totalActive', Icons.check_circle),
            ),
          ],
        ),
      ],
    );
  }

  String _formatTotalAmount(double amount) {
    if (amount == 0) return '0 ل.س';
    return '${amount.toStringAsFixed(amount.truncateToDouble() == amount ? 0 : 2)} ل.س';
  }

  Widget _buildInfoTile(IconData icon, String label, String value) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Icon(icon, color: AppColors.primary),
        title: Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
        subtitle: Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
      ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Icon(icon, color: AppColors.primary),
          const SizedBox(height: 8),
          Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          Text(label, style: const TextStyle(color: AppColors.textSecondary)),
        ],
      ),
    );
  }

  Widget _buildWarrantiesTab() {
    if (_loading) return const LoadingIndicator();

    Widget content;
    if (_error != null) {
      content = ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          SizedBox(
            height: MediaQuery.of(context).size.height * 0.5,
            child: ErrorState(message: _error!, onRetry: _loadWarranties),
          ),
        ],
      );
    } else if (_warranties.isEmpty) {
      content = ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          SizedBox(
            height: MediaQuery.of(context).size.height * 0.5,
            child: const EmptyState(
              title: 'لا توجد كفالات',
              subtitle: 'لم يقم هذا الوكيل بتسجيل أي كفالة بعد',
              icon: Icons.shield_outlined,
            ),
          ),
        ],
      );
    } else {
      content = ListView.builder(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        itemCount: _warranties.length,
        itemBuilder: (context, index) {
          final w = _warranties[index];
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: _warrantyStatusColor(w).withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          w.endDate != null && w.endDate!.isBefore(DateTime.now()) ? 'منتهية' : 'نشطة',
                          style: TextStyle(
                            color: _warrantyStatusColor(w),
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      const Spacer(),
                      Text(
                        w.amountWithCurrency,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    w.customerName,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 4),
                  Text('${w.customerPhone} · ${w.vehicleName}', style: const TextStyle(color: AppColors.textSecondary)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      _buildWarrantyInfo(Icons.calendar_today, 'بداية', w.startDate != null ? DateFormat('yyyy-MM-dd').format(w.startDate!) : '-'),
                      const SizedBox(width: 16),
                      _buildWarrantyInfo(Icons.event_busy, 'نهاية', w.endDate != null ? DateFormat('yyyy-MM-dd').format(w.endDate!) : '-'),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'رقم الشاصيه: ${w.chassisNumber} · اللوحة: ${w.plateNumber} · اللون: ${w.color}',
                    style: const TextStyle(fontSize: 12, color: AppColors.textTertiary),
                  ),
                ],
              ),
            ),
          );
        },
      );
    }

    return RefreshIndicator(
      onRefresh: _loadWarranties,
      child: content,
    );
  }

  Widget _buildWarrantyInfo(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 14, color: AppColors.textTertiary),
        const SizedBox(width: 4),
        Text('$label: $value', style: const TextStyle(fontSize: 13, color: AppColors.textTertiary)),
      ],
    );
  }
}
