# 🔐 بيانات الدخول للنظام - Garage Go 2.0

## ✅ حالة الخادم
- **Backend Server:** يعمل على `http://localhost:8080`
- **Database:** PostgreSQL على المنفذ 5433
- **CORS:** تم تفعيل `*` للسماح بجميع العناوين

## 👥 المستخدمون المتاحون

| اسم المستخدم | كلمة المرور | الدور | الصلاحيات |
|--------------|-------------|------|-----------|
| **owner** | owner123 | OWNER | كل الصلاحيات - مالك النظام |
| **admin** | admin123 | MANAGER | مدير النظام - معظم الوظائف |
| **hr_manager** | hr123 | HR_MANAGER | إدارة الموارد البشرية |
| **accountant** | accountant123 | ACCOUNTANT | المحاسبة والتقارير المالية |
| **receptionist** | receptionist123 | RECEPTIONIST | الحجوزات والزبائن |
| **mechanic** | mechanic123 | MECHANIC | المهام الميكانيكية |
| **sales** | sales123 | SALES | المبيعات والمخزون |
| **cashier** | cashier123 | CASHIER | الفواتير والصندوق |

## 🔑 بيانات الدخول الموصى بها

### للدخول كمالك النظام:
```
Tenant ID: default
Username: owner
Password: owner123
```

### للدخول كمدير النظام:
```
Tenant ID: default
Username: admin
Password: admin123
```

## 🚨 استكشاف الأخطاء

### إذا واجهت خطأ في الاتصال:

1. **تأكد من أن الخادم يعمل:**
   ```bash
   curl http://localhost:8080/health
   ```
   يجب أن تعود: `{"status":"ok",...}`

2. **تحقق من منفذ Flutter Web:**
   - قد يعمل Flutter Web على منفذ مختلف (مثل 3000، 4000، 5000، إلخ)
   - تحقق من الرابط في المتصفح عند تشغيل Flutter

3. **إذا كان Flutter Web على منفذ مختلف:**
   - أضف المنفذ إلى إعدادات CORS في `backend/.env`:
     ```
     CORS_ORIGIN="http://localhost:YOUR_PORT"
     ```

4. **أعد تشغيل الخادم بعد تغيير الإعدادات:**
   ```bash
   cd backend
   npm run dev
   ```

## 📝 ملاحظات مهمة

- جميع كلمات المرور الأولية بسيطة - يُنصح بتغييرها في الإنتاج
- تم إنشاء هذه المستخدمين عبر `backend/prisma/seed.ts`
- يمكن إضافة مستخدمين جدد عبر واجهة الإدارة أو API التسجيل

## 🔄 إعادة إنشاء المستخدمين

إذا احتجت لإعادة إنشاء المستخدمين:
```bash
cd backend
npx ts-node prisma/seed.ts
```

## 📞 الدعم

إذا واجهت مشاكل في الدخول:
1. تأكد أن الخادم يعمل على المنفذ 8080
2. تحقق من إعدادات CORS
3. تأكد من صحة بيانات الدخول
4. تحقق من سجلات الخادم للأخطاء
