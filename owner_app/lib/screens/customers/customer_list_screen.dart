import 'package:flutter/material.dart';
import 'package:flutter_slidable/flutter_slidable.dart';
import '../../core/constants.dart';
import '../../core/launcher_helper.dart';
import '../../models/customer.dart';
import '../../repositories/customer_repository.dart';
import '../../widgets/animated_list_item.dart';
import '../../widgets/loading_indicator.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/error_state.dart';
import 'customer_form_screen.dart';

class CustomerListScreen extends StatefulWidget {
  const CustomerListScreen({super.key});

  @override
  State<CustomerListScreen> createState() => _CustomerListScreenState();
}

class _CustomerListScreenState extends State<CustomerListScreen> {
  final _repository = CustomerRepository();
  List<Customer> _allCustomers = [];
  List<Customer> _filteredCustomers = [];
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
        _allCustomers = data;
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
      _filteredCustomers = List.from(_allCustomers);
    } else {
      _filteredCustomers = _allCustomers.where((c) {
        return c.fullName.toLowerCase().contains(q) ||
            c.phone.contains(q) ||
            (c.address?.toLowerCase().contains(q) ?? false);
      }).toList();
    }
  }

  Future<void> _deleteCustomer(Customer customer) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('تأكيد الحذف'),
        content: Text('هل أنت متأكد من حذف العميل "${customer.fullName}"؟'),
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
      await _repository.delete(customer.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تم حذف العميل بنجاح')),
      );
      _loadData();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('فشل الحذف: $e'), backgroundColor: AppColors.error),
      );
    }
  }

  Future<void> _openForm({Customer? customer}) async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) => CustomerFormScreen(customer: customer),
      ),
    );
    if (result == true) _loadData();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('العملاء'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _openForm(),
            tooltip: 'عميل جديد',
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
                hintText: 'بحث بالاسم أو الهاتف أو العنوان...',
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
    if (_loading) return const ShimmerList();
    if (_error != null) {
      return ErrorState(
        message: _error!,
        onRetry: _loadData,
      );
    }
    if (_filteredCustomers.isEmpty) {
      return EmptyState(
        title: 'لا يوجد عملاء',
        subtitle: _searchCtrl.text.isEmpty
            ? 'لم يتم تسجيل أي عميل بعد'
            : 'لا توجد نتائج مطابقة للبحث',
        icon: Icons.people_outline,
        onAction: _searchCtrl.text.isEmpty ? () => _openForm() : null,
        actionLabel: 'عميل جديد',
      );
    }

    return ListView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemCount: _filteredCustomers.length,
      itemBuilder: (context, index) {
        final customer = _filteredCustomers[index];
        return AnimatedListItem(
          index: index,
          child: Slidable(
            key: ValueKey(customer.id),
            endActionPane: ActionPane(
              motion: const ScrollMotion(),
              extentRatio: 0.5,
              children: [
                SlidableAction(
                  onPressed: (_) => _openForm(customer: customer),
                  backgroundColor: AppColors.info,
                  foregroundColor: Colors.white,
                  icon: Icons.edit,
                  label: 'تعديل',
                ),
                SlidableAction(
                  onPressed: (_) => _deleteCustomer(customer),
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
                  backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                  child: const Icon(Icons.person, color: AppColors.primary),
                ),
                title: Text(
                  customer.fullName,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                subtitle: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(customer.phone, style: const TextStyle(fontSize: 13)),
                    if (customer.address != null && customer.address!.isNotEmpty)
                      Text(
                        customer.address!,
                        style: const TextStyle(fontSize: 12, color: AppColors.textTertiary),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                  ],
                ),
                isThreeLine: customer.address != null && customer.address!.isNotEmpty,
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.call, color: AppColors.success),
                      onPressed: () => LauncherHelper.call(customer.phone),
                      tooltip: 'اتصال',
                    ),
                    IconButton(
                      icon: const Icon(Icons.message, color: AppColors.success),
                      onPressed: () => LauncherHelper.openWhatsApp(
                        customer.phone,
                        message: 'مرحباً ${customer.fullName}،',
                      ),
                      tooltip: 'واتساب',
                    ),
                  ],
                ),
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
