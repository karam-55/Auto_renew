import 'package:flutter/material.dart';

class FaultsSection extends StatelessWidget {
  const FaultsSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('الأعطال', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        const SizedBox(height: 12),
        Card(
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          child: Container(
            height: 100,
            padding: const EdgeInsets.all(16),
            child: const Center(child: Text('لا توجد أعطال')),
          ),
        ),
      ],
    );
  }
}
