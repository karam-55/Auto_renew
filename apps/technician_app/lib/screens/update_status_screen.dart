import 'package:flutter/material.dart';
import '../services/technician_service.dart';

class UpdateStatusScreen extends StatefulWidget {
  final String bookingId;

  const UpdateStatusScreen({super.key, required this.bookingId});

  @override
  State<UpdateStatusScreen> createState() => _UpdateStatusScreenState();
}

class _UpdateStatusScreenState extends State<UpdateStatusScreen> {
  final List<Map<String, dynamic>> _statuses = [
    {'name': 'RECEIVED', 'icon': Icons.inbox},
    {'name': 'IN_PROGRESS', 'icon': Icons.build},
    {'name': 'WAITING_CUSTOMER', 'icon': Icons.hourglass_bottom},
    {'name': 'COMPLETED', 'icon': Icons.check_circle},
  ];
  bool _isUpdating = false;
  String? _errorMessage;

  Future<void> _updateStatus(String status) async {
    setState(() {
      _isUpdating = true;
      _errorMessage = null;
    });

    try {
      final result = await TechnicianService().updateStatus(widget.bookingId, status);
      if (result.success) {
        Navigator.pop(context, 'updated');
      } else {
        setState(() {
          _errorMessage = result.error ?? 'Failed to update status';
          _isUpdating = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'An error occurred: ${e.toString()}';
        _isUpdating = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('تحديث الحالة')),
      body: Column(
        children: [
          if (_errorMessage != null)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.red.shade100,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.red),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error, color: Colors.red),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _errorMessage!,
                      style: const TextStyle(color: Colors.red),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.red),
                    onPressed: () => setState(() => _errorMessage = null),
                  ),
                ],
              ),
            ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _statuses.length,
              itemBuilder: (context, index) {
                final status = _statuses[index];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Card(
                    elevation: 2,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: ListTile(
                      leading: Icon(status['icon']),
                      title: Text(status['name']),
                      onTap: _isUpdating ? null : () => _updateStatus(status['name']),
                      enabled: !_isUpdating,
                      trailing: _isUpdating
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.chevron_right),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
