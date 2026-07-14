# Auto Renew Owner Mobile App

## تاريخ التنفيذ
2026-07-14

## نظرة عامة
تطبيق Flutter Android مخصص للمالكين (OWNER) لإدارة العملاء والمركبات والحجوزات والوكلاء والكفالات من خلال واجهة عربية RTL.

## الأدوار المدعومة
- OWNER فقط

## الميزات
1. **تسجيل الدخول**: يعتمد على JWT مع التحقق من دور OWNER.
2. **لوحة التحكم**: إحصائيات سريعة للعملاء والمركبات والحجوزات والوكلاء.
3. **العملاء**: عرض/بحث/إضافة/تعديل/حذف + أزرار اتصال/واتساب.
4. **المركبات**: عرض/بحث/إضافة/تعديل/حذف مع ربط العميل.
5. **الحجوزات**: عرض/بحث/إضافة/تعديل/حذف مع فلترة حسب الحالة + انتقاء الوقت.
6. **الوكلاء**: عرض/بحث/إضافة/تعديل/حذف + أزرار اتصال.
7. **تفاصيل الوكيل**: عرض بيانات الوكيل + قائمة الكفالات + قائمة العملاء المستفيدين (عرض فقط).
8. **الإعدادات / الملف الشخصي**: تغيير كلمة المرور وحفظ Telegram Chat ID.
9. **معالجة انتهاء الجلسة**: عند استلام 401 يتم تسجيل الخروج تلقائياً.
10. **التحقق من البيانات**: أسماء مستخدمين، كلمات مرور، أرقام هواتف.

## الملفات المُنشأة

### Core
- `lib/core/constants.dart`
- `lib/core/api_service.dart`
- `lib/core/auth_service.dart`
- `lib/core/navigation_service.dart`
- `lib/core/theme.dart`
- `lib/core/validators.dart`
- `lib/core/launcher_helper.dart`

### Models
- `lib/models/customer.dart`
- `lib/models/vehicle.dart`
- `lib/models/booking.dart`
- `lib/models/dealer.dart`
- `lib/models/warranty.dart`
- `lib/models/service.dart`
- `lib/models/paginated_result.dart`

### Repositories
- `lib/repositories/customer_repository.dart`
- `lib/repositories/vehicle_repository.dart`
- `lib/repositories/booking_repository.dart`
- `lib/repositories/dealer_repository.dart`
- `lib/repositories/service_repository.dart`
- `lib/repositories/user_repository.dart`

### Widgets
- `lib/widgets/loading_indicator.dart`
- `lib/widgets/empty_state.dart`
- `lib/widgets/error_state.dart`
- `lib/widgets/app_text_field.dart`

### Screens
- `lib/main.dart`
- `lib/screens/login_screen.dart`
- `lib/screens/home_screen.dart`
- `lib/screens/dashboard_screen.dart`
- `lib/screens/profile_screen.dart`
- `lib/screens/customers/customer_list_screen.dart`
- `lib/screens/customers/customer_form_screen.dart`
- `lib/screens/vehicles/vehicle_list_screen.dart`
- `lib/screens/vehicles/vehicle_form_screen.dart`
- `lib/screens/bookings/booking_list_screen.dart`
- `lib/screens/bookings/booking_form_screen.dart`
- `lib/screens/dealers/dealer_list_screen.dart`
- `lib/screens/dealers/dealer_form_screen.dart`
- `lib/screens/dealers/dealer_detail_screen.dart`

### Assets
- `assets/logo.png`

### Backend Changes (لتفعيل Telegram Chat ID)
- `backend/prisma/schema.prisma`: إضافة `telegramChatId` إلى `User`.
- `backend/src/modules/users/types.ts`: إضافة `telegramChatId` إلى `UpdateUserInput` و `UserResponse`.
- `backend/src/modules/users/service.ts`: معالجة `telegramChatId` في `updateUser`.

## الاعتماديات
- http: ^1.2.0
- shared_preferences: ^2.2.0
- intl: ^0.20.2
- shimmer: ^3.0.0
- flutter_slidable: ^3.1.0
- url_launcher: ^6.3.0
- flutter_launcher_icons: ^0.14.0
- flutter_localizations

## نتائج البناء
- `flutter analyze`: 0 errors / 0 warnings
- `flutter test`: 1 passed
- `flutter build apk --debug`: success
- Launcher icon generated for Android

## ملاحظات
- يجب ضبط `ApiConfig.baseUrl` في `lib/core/constants.dart` على عنوان الخادم الحقيقي.
- الكفالات تُعرض فقط من تطبيق المالك (لا يمكن إنشاؤها/تعديلها من هذا التطبيق).
- يجب توفير معرف Tenant صحيح عند تسجيل الدخول (افتراضي: `default`).
- بعد تغييرات الـ Backend يجب تشغيل:
  ```bash
  cd backend
  npx prisma migrate dev --name add_telegram_chat_id
  npx prisma generate
  npm run build
  ```
- الـ pagination لم يُطبق بشكل كامل لاختلاف تنسيق الاستجابة بين الـ Backend APIs (customers vs bookings vs vehicles). تم رفع الحد الأقصى للطلبات لتحسين الأداء.
