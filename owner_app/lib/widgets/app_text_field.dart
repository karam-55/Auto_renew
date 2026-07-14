import 'package:flutter/material.dart';
import '../core/constants.dart';
import '../core/validators.dart';

enum ValidationType { none, required, phone, username, password }

class AppTextField extends StatelessWidget {
  final TextEditingController? controller;
  final String label;
  final String? hint;
  final IconData? icon;
  final TextInputType keyboardType;
  final bool obscureText;
  final bool required;
  final int? maxLines;
  final String? Function(String?)? validator;
  final ValidationType validationType;
  final void Function(String)? onChanged;

  const AppTextField({
    super.key,
    this.controller,
    required this.label,
    this.hint,
    this.icon,
    this.keyboardType = TextInputType.text,
    this.obscureText = false,
    this.required = false,
    this.maxLines = 1,
    this.validator,
    this.validationType = ValidationType.none,
    this.onChanged,
  });

  String? Function(String?)? get _effectiveValidator {
    if (validator != null) return validator;
    if (required) {
      return (value) => Validators.required(value);
    }
    switch (validationType) {
      case ValidationType.phone:
        return Validators.phone;
      case ValidationType.username:
        return Validators.username;
      case ValidationType.password:
        return Validators.password;
      default:
        return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      obscureText: obscureText,
      maxLines: maxLines,
      validator: _effectiveValidator,
      onChanged: onChanged,
      decoration: InputDecoration(
        labelText: label + (required || validationType != ValidationType.none ? ' *' : ''),
        hintText: hint,
        prefixIcon: icon != null ? Icon(icon, color: AppColors.primary) : null,
      ),
    );
  }
}
