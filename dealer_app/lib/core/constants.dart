import 'package:flutter/material.dart';

class AppColors {
  static const Color primary = Color(0xFFE31E24);
  static const Color primaryLight = Color(0xFFEF4444);
  static const Color primaryDark = Color(0xFFB91C1C);
  static const Color accent = Color(0xFFE31E24);
  static const Color success = Color(0xFF22C55E);
  static const Color error = Color(0xFFDC2626);
  static const Color warning = Color(0xFFF59E0B);
  static const Color background = Color(0xFFFFFFFF);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color textPrimary = Color(0xFF000000);
  static const Color textSecondary = Color(0xFF333333);
  static const Color border = Color(0xFFE5E5E5);
  static const Color cardGradientStart = Color(0xFFE31E24);
  static const Color cardGradientEnd = Color(0xFFB91C1C);
}

class ApiConfig {
  // Change this to your server IP
  static const String baseUrl = 'http://178.105.209.59';
  static const String dealerRegister = '/api/dealers/register';
  static const String dealerLogin = '/api/dealers/login';
  static const String dealerStats = '/api/dealers/me/stats';
  static const String warranties = '/api/dealers/me/warranties';
  static const String warrantyDetail = '/api/dealers/me/warranties';
}

const String warrantyTerms = '''تقدّم شركة Auto Renew كفالة محددة للمركبات وفق الشروط التالية، ويُعدّ استفادة العميل من الكفالة موافقة كاملة على جميع البنود المذكورة أدناه.

أولاً – شروط الاستفادة من الكفالة
لا يحق للمستفيد من الكفالة التعامل مع أي طرف آخر أو ورشة أو مركز صيانة خارج Auto Renew خلال مدة الكفالة.
في حال تم التعامل مع طرف ثالث، تُلغى الكفالة مباشرة عن المركبة دون أي تعويض.

الالتزام بمواعيد الصيانة الدورية المحددة من قبل الشركة.
الإبلاغ عن أي عطل فور ظهوره وعدم تأجيل الصيانة.

ثانياً – ما تشمله الكفالة
تشمل الكفالة الخدمات التالية ضمن المدة المحددة:

تغطية أعطال سوء التصنيع (Manufacturing Defects) التي تُثبت بعد الفحص الفني لدى Auto Renew.
تبديل زيت المحرك بأنواعه وفق المواصفات المعتمدة.
تبديل الإطارات ضمن الحالات المغطاة بالكفالة.
برمجة المركبة (تحديث البرامج).
الكوليات (Brake Pads).
أعمال كهرباء السيارات ضمن الأعطال المغطاة.

ثالثاً – ميزات الكفالة
أول تبديل زيت محرك مجاني بالكامل.
أول تحديث برامج مجاني.

رابعاً – حالات تُلغى فيها الكفالة
صيانة المركبة خارج Auto Renew.
استخدام قطع غير أصلية أو غير معتمدة.
إهمال الصيانة الدورية أو تجاهل الأعطال.
إجراء أي تعديل على المركبة دون موافقة الشركة.
ثبوت سوء الاستخدام أو التشغيل الخاطئ للمركبة.

خامساً – ملاحظات عامة
الكفالة غير قابلة للتحويل إلا بموافقة خطية من Auto Renew.
تسري الكفالة فقط على الأعطال المغطاة والمذكورة في هذا المستند.
تحتفظ الشركة بحق تعديل الشروط بما يتوافق مع سياسات العمل.''';
