import 'package:flutter/material.dart';
import 'dart:io';

class PhotoUploader extends StatefulWidget {
  final Function(List<String>) onImagesSelected;

  const PhotoUploader({super.key, required this.onImagesSelected});

  @override
  State<PhotoUploader> createState() => _PhotoUploaderState();
}

class _PhotoUploaderState extends State<PhotoUploader> with SingleTickerProviderStateMixin {
  final List<String> _selectedImages = [];
  String? _errorMessage;
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 150),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.95).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _removeImage(int index) {
    setState(() {
      _selectedImages.removeAt(index);
      widget.onImagesSelected(_selectedImages);
    });
  }

  Future<void> _selectImages() async {
    try {
      // TODO: Implement actual image selection
      // Placeholder: add dummy image path
      setState(() {
        _errorMessage = null;
        _selectedImages.add('dummy_path_${_selectedImages.length}');
        widget.onImagesSelected(_selectedImages);
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to select images: ${e.toString()}';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        if (_errorMessage != null)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            margin: const EdgeInsets.only(bottom: 8),
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
        if (_selectedImages.isNotEmpty)
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: List.generate(_selectedImages.length, (index) {
              return Stack(
                children: [
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Image.file(
                      File(_selectedImages[index]),
                      fit: BoxFit.cover,
                      cacheWidth: 160,
                      cacheHeight: 160,
                      errorBuilder: (context, error, stackTrace) {
                        return const Center(child: Icon(Icons.image, color: Colors.grey));
                      },
                    ),
                  ),
                  Positioned(
                    top: -8,
                    right: -8,
                    child: IconButton(
                      icon: const Icon(Icons.close, color: Colors.red),
                      onPressed: () => _removeImage(index),
                      iconSize: 20,
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                  ),
                ],
              );
            }),
          ),
        const SizedBox(height: 8),
        GestureDetector(
          onTapDown: (_) => _animationController.forward(),
          onTapUp: (_) => _animationController.reverse(),
          onTapCancel: () => _animationController.reverse(),
          onTap: _selectImages,
          child: ScaleTransition(
            scale: _scaleAnimation,
            child: Container(
              height: 200,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey, width: 2, style: BorderStyle.solid),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.add_a_photo, size: 48, color: Colors.grey),
                    const SizedBox(height: 8),
                    const Text('اضغط لإضافة صور', style: TextStyle(color: Colors.grey)),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
