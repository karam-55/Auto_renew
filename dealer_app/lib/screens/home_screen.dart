import 'package:flutter/material.dart';
import '../core/constants.dart';
import '../services/api_service.dart';
import 'warranty_form_screen.dart';
import 'warranty_detail_screen.dart';
import 'customer_search_screen.dart';
import 'welcome_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Map<String, dynamic>? _stats;
  List<dynamic> _warranties = [];
  bool _loading = true;
  String _dealerName = '';
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Auto-refresh when returning from other screens
    if (!_loading) {
      _loadData();
    }
  }

  Future<void> _loadData() async {
    setState(() { _loading = true; _error = null; });
    try {
      final stats = await ApiService.getStats();
      final warranties = await ApiService.getWarranties();
      final dealer = await ApiService.getSavedDealer();
      if (mounted) {
        setState(() {
          _stats = stats;
          _warranties = warranties;
          _dealerName = dealer?['name'] ?? 'وكيل';
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = e.toString();
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('خطأ تحميل البيانات: $_error'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  void _logout() async {
    await ApiService.clearToken();
    if (mounted) {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const WelcomeScreen()),
        (_) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        title: Text('مرحباً $_dealerName'),
        actions: [
          IconButton(onPressed: _logout, icon: const Icon(Icons.logout, color: Colors.white)),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildStatsCards(),
                    const SizedBox(height: 24),
                    const Text('كفالة جديدة',
                        style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                    const SizedBox(height: 12),
                    _buildActionButtons(),
                    const SizedBox(height: 24),
                    const Text('آخر الكفالات',
                        style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                    const SizedBox(height: 12),
                    _buildWarrantiesList(),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildStatsCards() {
    final stats = [
      {'label': 'إجمالي الكفالات', 'value': _stats?['totalWarranties'] ?? 0, 'color': AppColors.primary},
      {'label': 'الكفالات النشطة', 'value': _stats?['activeWarranties'] ?? 0, 'color': AppColors.success},
      {'label': 'العملاء', 'value': _stats?['totalCustomers'] ?? 0, 'color': AppColors.accent},
      {
        'label': 'إجمالي المبالغ',
        'value': '${_stats?['totalRevenue'] ?? 0}',
        'color': AppColors.primaryLight
      },
    ];
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 1.6,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: stats.length,
      itemBuilder: (context, index) {
        final s = stats[index];
        return Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [s['color'] as Color, (s['color'] as Color).withOpacity(0.8)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(color: (s['color'] as Color).withOpacity(0.3), blurRadius: 12, offset: const Offset(0, 6)),
            ],
          ),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('${s['value']}', style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white)),
              const SizedBox(height: 8),
              Text(s['label'] as String, style: const TextStyle(fontSize: 14, color: Colors.white70)),
            ],
          ),
        );
      },
    );
  }

  Widget _buildActionButtons() {
    return Row(
      children: [
        Expanded(
          child: _buildActionCard(
            'عميل جديد',
            Icons.person_add_alt_1,
            AppColors.success,
            () async {
              final result = await Navigator.push(context, MaterialPageRoute(builder: (_) => const WarrantyFormScreen()));
              if (result == true) _loadData();
            },
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildActionCard(
            'عميل سابق',
            Icons.person_search,
            AppColors.accent,
            () async {
              // Open customer search first
              final customer = await Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const CustomerSearchScreen()),
              );
              if (customer != null && mounted) {
                // User selected existing customer
                final result = await Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => WarrantyFormScreen(existingCustomer: true, customer: customer)),
                );
                if (result == true) _loadData();
              }
            },
          ),
        ),
      ],
    );
  }

  Widget _buildActionCard(String label, IconData icon, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 24),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 12, offset: const Offset(0, 4))],
        ),
        child: Column(
          children: [
            CircleAvatar(
              radius: 32,
              backgroundColor: color.withOpacity(0.15),
              child: Icon(icon, color: color, size: 32),
            ),
            const SizedBox(height: 12),
            Text(label, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }

  Widget _buildWarrantiesList() {
    if (_warranties.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: Text('لا توجد كفالات مسجلة بعد', style: TextStyle(color: AppColors.textSecondary)),
        ),
      );
    }
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _warranties.length,
      itemBuilder: (context, index) {
        final w = _warranties[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: ListTile(
            contentPadding: const EdgeInsets.all(16),
            leading: CircleAvatar(
              backgroundColor: AppColors.primary.withOpacity(0.1),
              child: const Icon(Icons.shield, color: AppColors.primary),
            ),
            title: Text(w['customerName'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Text('${w['vehicleModel']} - ${w['plateNumber']}'),
            trailing: const Icon(Icons.arrow_forward_ios, size: 16),
            onTap: () async {
              final result = await Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => WarrantyDetailScreen(warranty: w)),
              );
              if (result == true) _loadData();
            },
          ),
        );
      },
    );
  }
}
