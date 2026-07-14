import 'package:flutter/material.dart';
import '../../core/constants.dart';
import '../../models/vehicle.dart';
import '../../repositories/vehicle_repository.dart';
import '../../widgets/loading_indicator.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/error_state.dart';
import 'vehicle_form_screen.dart';

class VehicleListScreen extends StatefulWidget {
  const VehicleListScreen({super.key});

  @override
  State<VehicleListScreen> createState() => _VehicleListScreenState();
}

class _VehicleListScreenState extends State<VehicleListScreen> {
  final _repository = VehicleRepository();
  List<Vehicle> _allVehicles = [];
  List<Vehicle> _filteredVehicles = [];
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
        _allVehicles = data;
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
      _filteredVehicles = List.from(_allVehicles);
    } else {
      _filteredVehicles = _allVehicles.where((v) {
        return v.make.toLowerCase().contains(q) ||
            v.model.toLowerCase().contains(q) ||
            (v.licensePlate?.toLowerCase().contains(q) ?? false) ||
            v.customerName.toLowerCase().contains(q);
      }).toList();
    }
  }

  Future<void> _deleteVehicle(Vehicle vehicle) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('تأكيد الحذف'),
        content: Text('هل أنت متأكد من حذف المركبة "${vehicle.displayName}"؟'),
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
      await _repository.delete(vehicle.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تم حذف المركبة بنجاح')),
      );
      _loadData();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('فشل الحذف: $e'), backgroundColor: AppColors.error),
      );
    }
  }

  Future<void> _openForm({Vehicle? vehicle}) async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) => VehicleFormScreen(vehicle: vehicle),
      ),
    );
    if (result == true) _loadData();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('المركبات'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _openForm(),
            tooltip: 'مركبة جديدة',
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
                hintText: 'بحث بالماركة/الموديل/اللوحة/العميل...',
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
    if (_filteredVehicles.isEmpty) {
      return EmptyState(
        title: 'لا توجد مركبات',
        subtitle: _searchCtrl.text.isEmpty
            ? 'لم يتم تسجيل أي مركبة بعد'
            : 'لا توجد نتائج مطابقة للبحث',
        icon: Icons.directions_car_outlined,
        onAction: _searchCtrl.text.isEmpty ? () => _openForm() : null,
        actionLabel: 'مركبة جديدة',
      );
    }

    return ListView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemCount: _filteredVehicles.length,
      itemBuilder: (context, index) {
        final vehicle = _filteredVehicles[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            leading: CircleAvatar(
              backgroundColor: AppColors.info.withValues(alpha: 0.1),
              child: const Icon(Icons.directions_car, color: AppColors.info),
            ),
            title: Text(
              '${vehicle.make} ${vehicle.model}',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (vehicle.customerName.isNotEmpty)
                  Text(
                    'العميل: ${vehicle.customerName}',
                    style: const TextStyle(fontSize: 13),
                  ),
                Text(
                  '${vehicle.licensePlate ?? 'بدون لوحة'} · ${vehicle.year ?? '-'} · ${vehicle.color ?? ''}',
                  style: const TextStyle(fontSize: 12, color: AppColors.textTertiary),
                ),
              ],
            ),
            isThreeLine: true,
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  icon: const Icon(Icons.edit, color: AppColors.info),
                  onPressed: () => _openForm(vehicle: vehicle),
                ),
                IconButton(
                  icon: const Icon(Icons.delete, color: AppColors.error),
                  onPressed: () => _deleteVehicle(vehicle),
                ),
              ],
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
