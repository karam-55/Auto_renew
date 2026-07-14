import 'package:flutter/material.dart';
import 'package:flutter_slidable/flutter_slidable.dart';
import '../../core/constants.dart';
import '../../core/launcher_helper.dart';
import '../../models/dealer.dart';
import '../../repositories/dealer_repository.dart';
import '../../widgets/loading_indicator.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/error_state.dart';
import 'dealer_detail_screen.dart';
import 'dealer_form_screen.dart';

class DealerListScreen extends StatefulWidget {
  const DealerListScreen({super.key});

  @override
  State<DealerListScreen> createState() => _DealerListScreenState();
}

class _DealerListScreenState extends State<DealerListScreen> {
  final _repository = DealerRepository();
  List<Dealer> _allDealers = [];
  List<Dealer> _filteredDealers = [];
  bool _loading = true;
  String? _error;
  final _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await _repository.getAll();
      if (!mounted) return;
      setState(() {
        _allDealers = data;
        _applySearch(_searchCtrl.text);
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

  void _applySearch(String query) {
    final q = query.trim().toLowerCase();
    if (q.isEmpty) {
      _filteredDealers = List.from(_allDealers);
    } else {
      _filteredDealers = _allDealers.where((d) {
        return d.name.toLowerCase().contains(q) ||
            d.companyName.toLowerCase().contains(q) ||
            d.phone.contains(q);
      }).toList();
    }
  }

  Future<void> _deleteDealer(Dealer dealer) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('تأكيد الحذف'),
        content: Text('هل أنت متأكد من حذف الوكيل "${dealer.companyName}"؟'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('حذف', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await _repository.delete(dealer.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تم حذف الوكيل بنجاح')),
      );
      _loadData();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('فشل الحذف: $e'), backgroundColor: AppColors.error),
      );
    }
  }

  Future<void> _openForm({Dealer? dealer}) async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) => DealerFormScreen(dealer: dealer),
      ),
    );
    if (result == true) _loadData();
  }

  void _openDetail(Dealer dealer) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => DealerDetailScreen(dealer: dealer),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('الوكلاء'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _openForm(),
            tooltip: 'وكيل جديد',
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchCtrl,
              decoration: const InputDecoration(
                hintText: 'بحث بالاسم أو الشركة أو الهاتف...',
                prefixIcon: Icon(Icons.search),
              ),
              onChanged: (value) => setState(() => _applySearch(value)),
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _loadData,
              child: _buildBody(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_loading) return const LoadingIndicator();
    if (_error != null) return ErrorState(message: _error!, onRetry: _loadData);
    if (_filteredDealers.isEmpty) {
      return EmptyState(
        title: 'لا يوجد وكلاء',
        subtitle: _searchCtrl.text.isEmpty
            ? 'لم يتم تسجيل أي وكيل بعد'
            : 'لا توجد نتائج مطابقة للبحث',
        icon: Icons.business_outlined,
        onAction: _searchCtrl.text.isEmpty ? () => _openForm() : null,
        actionLabel: 'وكيل جديد',
      );
    }

    return ListView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemCount: _filteredDealers.length,
      itemBuilder: (context, index) {
        final dealer = _filteredDealers[index];
        return Slidable(
          key: ValueKey(dealer.id),
          endActionPane: ActionPane(
            motion: const ScrollMotion(),
            extentRatio: 0.65,
            children: [
              SlidableAction(
                onPressed: (_) => _openDetail(dealer),
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                icon: Icons.visibility,
                label: 'عرض',
              ),
              SlidableAction(
                onPressed: (_) => _openForm(dealer: dealer),
                backgroundColor: AppColors.info,
                foregroundColor: Colors.white,
                icon: Icons.edit,
                label: 'تعديل',
              ),
              SlidableAction(
                onPressed: (_) => _deleteDealer(dealer),
                backgroundColor: AppColors.error,
                foregroundColor: Colors.white,
                icon: Icons.delete,
                label: 'حذف',
              ),
            ],
          ),
          child: Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              leading: CircleAvatar(
                backgroundColor: AppColors.success.withValues(alpha: 0.1),
                child: const Icon(Icons.business, color: AppColors.success),
              ),
              title: Text(
                dealer.companyName,
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('${dealer.name} · ${dealer.phone}', style: const TextStyle(fontSize: 13)),
                  Text(
                    'الكفالات: ${dealer.warrantyCount}',
                    style: const TextStyle(fontSize: 12, color: AppColors.textTertiary),
                  ),
                ],
              ),
              isThreeLine: true,
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(
                    icon: const Icon(Icons.call, color: AppColors.success),
                    onPressed: () => LauncherHelper.call(dealer.phone),
                    tooltip: 'اتصال',
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }
}
