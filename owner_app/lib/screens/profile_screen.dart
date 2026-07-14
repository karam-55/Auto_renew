import 'package:flutter/material.dart';
import '../core/auth_service.dart';
import '../core/constants.dart';
import '../repositories/user_repository.dart';
import '../widgets/app_text_field.dart';
import '../widgets/loading_indicator.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? _user;
  final _chatIdCtrl = TextEditingController();
  bool _loading = true;
  bool _saving = false;
  String? _error;
  String? _success;

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  Future<void> _loadUser() async {
    final user = await AuthService.getUser();
    if (!mounted) return;
    setState(() {
      _user = user;
      _chatIdCtrl.text = user?['telegramChatId']?.toString() ?? '';
      _loading = false;
    });
  }

  Future<void> _save() async {
    if (_user == null || _user!['id'] == null) return;

    setState(() {
      _saving = true;
      _error = null;
      _success = null;
    });

    try {
      final updated = await UserRepository().updateTelegramChatId(
        _user!['id'].toString(),
        _chatIdCtrl.text.trim(),
      );
      await AuthService.updateStoredUser(updated);
      if (!mounted) return;
      setState(() {
        _success = 'تم حفظ معرف Telegram بنجاح';
        _user = updated;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _changePassword() async {
    final currentCtrl = TextEditingController();
    final newCtrl = TextEditingController();
    final confirmCtrl = TextEditingController();

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('تغيير كلمة المرور'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AppTextField(
              controller: currentCtrl,
              label: 'كلمة المرور الحالية',
              icon: Icons.lock,
              obscureText: true,
              validationType: ValidationType.password,
            ),
            const SizedBox(height: 12),
            AppTextField(
              controller: newCtrl,
              label: 'كلمة المرور الجديدة',
              icon: Icons.lock_outline,
              obscureText: true,
              validationType: ValidationType.password,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: confirmCtrl,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'تأكيد كلمة المرور',
                prefixIcon: Icon(Icons.lock_outline, color: AppColors.primary),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            onPressed: () {
              if (newCtrl.text != confirmCtrl.text) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('كلمتا المرور غير متطابقتين')),
                );
                return;
              }
              Navigator.pop(context, true);
            },
            child: const Text('تغيير'),
          ),
        ],
      ),
    );

    if (confirmed != true || _user == null || _user!['id'] == null) return;

    try {
      await UserRepository().update(
        _user!['id'].toString(),
        {
          'password': newCtrl.text,
        },
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تم تغيير كلمة المرور')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('فشل تغيير كلمة المرور: $e')),
      );
    }
  }

  @override
  void dispose() {
    _chatIdCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('الإعدادات'),
      ),
      body: _loading
          ? const LoadingIndicator()
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_user != null) ...[
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: CircleAvatar(
                        backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                        child: const Icon(Icons.person, color: AppColors.primary),
                      ),
                      title: Text(
                        _user!['fullName']?.toString() ?? 'مالك النظام',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                      ),
                      subtitle: Text(
                        '${_user!['username']} · ${_user!['role']}',
                        style: const TextStyle(color: AppColors.textSecondary),
                      ),
                    ),
                    const Divider(height: 32),
                  ],
                  const Text(
                    'إعدادات Telegram',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'معرف المحادثة (Chat ID) مستخدم لإرسال الإشعارات المهمة.',
                    style: TextStyle(color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 16),
                  AppTextField(
                    controller: _chatIdCtrl,
                    label: 'Telegram Chat ID',
                    icon: Icons.send,
                    keyboardType: TextInputType.number,
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.error.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(AppRadius.md),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.error_outline, color: AppColors.error),
                          const SizedBox(width: 8),
                          Expanded(child: Text(_error!, style: const TextStyle(color: AppColors.error))),
                        ],
                      ),
                    ),
                  ],
                  if (_success != null) ...[
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.success.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(AppRadius.md),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.check_circle, color: AppColors.success),
                          const SizedBox(width: 8),
                          Expanded(child: Text(_success!, style: const TextStyle(color: AppColors.success))),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: _saving ? null : _save,
                      child: _saving
                          ? const CircularProgressIndicator(color: Colors.white)
                          : const Text('حفظ Chat ID'),
                    ),
                  ),
                  const SizedBox(height: 32),
                  const Text(
                    'الأمان',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  OutlinedButton.icon(
                    onPressed: _changePassword,
                    icon: const Icon(Icons.lock),
                    label: const Text('تغيير كلمة المرور'),
                  ),
                ],
              ),
            ),
    );
  }
}
