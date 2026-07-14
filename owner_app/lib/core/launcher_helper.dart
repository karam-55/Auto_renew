import 'package:url_launcher/url_launcher.dart';

class LauncherHelper {
  static Future<bool> call(String phoneNumber) async {
    final digits = phoneNumber.replaceAll(RegExp(r'\D'), '');
    final uri = Uri(scheme: 'tel', path: digits);
    if (await canLaunchUrl(uri)) {
      return launchUrl(uri);
    }
    return false;
  }

  static Future<bool> openWhatsApp(String phoneNumber, {String? message}) async {
    final digits = phoneNumber.replaceAll(RegExp(r'\D'), '');
    final uri = Uri.parse(
      'https://wa.me/$digits${message != null ? '?text=${Uri.encodeComponent(message)}' : ''}',
    );
    if (await canLaunchUrl(uri)) {
      return launchUrl(uri, mode: LaunchMode.externalApplication);
    }
    return false;
  }
}
