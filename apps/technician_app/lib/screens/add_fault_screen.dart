import 'package:flutter/material.dart';
import '../services/technician_service.dart';

class AddFaultScreen extends StatefulWidget {
  final String bookingId;

  const AddFaultScreen({super.key, required this.bookingId});

  @override
  State<AddFaultScreen> createState() => _AddFaultScreenState();
}

class _AddFaultScreenState extends State<AddFaultScreen> {
  final TextEditingController _descriptionController = TextEditingController();
  bool _isSending = false;
  String? _errorMessage;

  Future<void> _submitFault() async {
    if (_descriptionController.text.trim().isEmpty) {
      setState(() {
        _errorMessage = 'Please enter a fault description';
      });
      return;
    }

    setState(() {
      _isSending = true;
      _errorMessage = null;
    });

    try {
      final result = await TechnicianService().addFault(
        widget.bookingId,
        _descriptionController.text,
      );
      if (result.success) {
        Navigator.pop(context, 'fault_added');
      } else {
        setState(() {
          _errorMessage = result.error ?? 'Failed to add fault';
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'An error occurred: ${e.toString()}';
      });
    } finally {
      setState(() {
        _isSending = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('إضافة عطل')),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          children: [
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: TextField(
                  controller: _descriptionController,
                  decoration: const InputDecoration(
                    labelText: 'وصف العطل',
                    border: InputBorder.none,
                  ),
                  maxLines: 5,
                ),
              ),
            ),
            const SizedBox(height: 16),
            if (_errorMessage != null)
              Container(
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 16),
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
            ElevatedButton.icon(
              onPressed: _isSending ? null : _submitFault,
              icon: _isSending
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.add_circle_outline),
              label: const Text('إرسال'),
              style: ElevatedButton.styleFrom(
                minimumSize: const Size(double.infinity, 50),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
