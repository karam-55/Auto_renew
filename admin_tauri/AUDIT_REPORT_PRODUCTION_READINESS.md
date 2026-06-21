# تقرير فحص جاهزية الإنتاج — Admin Tauri Frontend

**المشروع:** AUTO_Renew  
**الواجهة:** admin_tauri (Vanilla JS/TS + Tauri Desktop)  
**تاريخ الفحص:** 20 يونيو 2026  
**المدقق:** Senior Frontend Engineer + QA Lead  
**نطاق الفحص:** 47+ ملف شاشة، 1 ملف راوتر، 1 ملف API Client، 1 ملف Auth، 1 ملف Layout  

---

## 1) ملخص عام — حكم الجاهزية للإطلاق

**الحكم: غير جاهز للإطلاق** ❌  
**نسبة الجاهزية التقديرية: 55%**

| # | السبب | الخطورة |
|---|-------|---------|
| 1 | **تسرب ذاكرة من event listeners** — كل شاشة تُعيد ربط مستمعين جدد عند إعادة الـ DOM ولا تُزيل القديم | Critical |
| 2 | **تباين أسماء الحقول بين الواجهة والـ API** يؤدي لـ `undefined` silent failures في العرض والحفظ | Critical |
| 3 | **لا يوجد فاليديشن حقيقي** — كل الفورم تعتمد على `required` HTML فقط، لا يوجد تحقق من أرقام هواتف، تواريخ، مبالغ | High |
| 4 | **لا يوجد معالجة خطأ موحدة** — بعض الشاشات تعرض `alert()`، بعضها تكتب في DOM، وبعضها تسكت | High |
| 5 | **تكرار مفرط للكود** — 47 شاشة تكرر نفس أنماط الجدول والفورم والمودال بدون مكونات مشتركة | Medium |
| 6 | **لا يوجد pagination client-side** — تحميل كل البيانات دفعة واحدة ثم فلترة في الذاكرة | Medium |
| 7 | **استخدام `any` في 90% من استجابات الـ API** — يُفقد TypeScript كل فائدته | Medium |

---

## 2) جدول مشاكل الربط (Data Binding Issues)

| # | الملف:السطر | الوصف | التأثير | إصلاح مقترح |
|---|-------------|-------|---------|-------------|
| 2.1 | `@admin_tauri/src/screens/bookings.ts:126-130` | البحث يستخدم 4 مفاتيح بديلة للعميل: `fullName \| name \| customerName` و 2 للوحة: `licensePlate \| plateNumber` | Medium | توحيد الـ API على `customer.fullName` و `vehicle.licensePlate` |
| 2.2 | `@admin_tauri/src/screens/bookings.ts:194` | `serviceName` يقرأ من 3 مصادر: `services[0].name \| bookingServices[0].service.name \| serviceName` | Medium | تبسيط الـ API response shape |
| 2.3 | `@admin_tauri/src/screens/invoices.ts:81` | `i.customer?.fullName \| i.customer?.name` — اسم العميل يأتي بمفتاحين | Medium | توحيد الـ Backend على `fullName` |
| 2.4 | `@admin_tauri/src/screens/invoices.ts:82` | `i.createdAt \| i.invoiceDate` — تاريخ الفاتورة بمفتاحين | Low | توحيد على `createdAt` |
| 2.5 | `@admin_tauri/src/screens/customers.ts:107` | `customer-name` input — لا يوجد `name` attribute مطابق للـ API | High | إضافة `name="fullName"` أو تعديل الـ payload |
| 2.6 | `@admin_tauri/src/screens/services.ts:817-826` | `openModal` يملأ الحقول يدوياً واحداً تلو الآخر — 15+ سطر — عرضة للنسيان | Medium | إنشاء دالة `populateForm(service, fields)` مشتركة |
| 2.7 | `@admin_tauri/src/screens/employee-form.ts:21-65` | `name` attributes لا تتطابق مع أسماء الـ API المتوقعة (مثلاً `fullNameAr` vs `fullName`) | High | مراجعة وتطابق الحقول مع الـ Backend DTO |
| 2.8 | `@admin_tauri/src/screens/payment.ts:42` | `pay-amount` input — لا يوجد min/max validation | Medium | إضافة `min="0.01"` والتحقق قبل الإرسال |
| 2.9 | `@admin_tauri/src/screens/login.ts:244-255` | منطق "اختيار الفرع" يُعيد تعيين `isLoggedIn` ولكنه لا يتحقق من `result.success` قبل التعديل على الـ DOM | Medium | إعادة هيكلة خطوات الـ login |
| 2.10 | `@admin_tauri/src/screens/customer-detail.ts:34-35` | `cust-name` و `cust-phone` — لا يوجد fallback لـ `undefined` | Low | إضافة `?? '-'` |

---

## 3) جدول عدم تطابق المتغيرات (Naming / API Contract Mismatches)

| الاسم في الواجهة | الاسم المتوقع في API | أين يُستخدم | الخطر | التوحيد المقترح |
|-------------------|----------------------|-------------|-------|-----------------|
| `customerName` | `customer.fullName` | bookings.ts, invoices.ts | silent undefined | إزالة `customerName` واستخدام `customer.fullName` |
| `plateNumber` | `vehicle.licensePlate` | bookings.ts | silent undefined | توحيد الـ Backend على `licensePlate` |
| `serviceName` | `services[0].name` | bookings.ts | silent undefined | إزالة `serviceName` المسطح |
| `invoiceNumber` | `id.slice(0,8)` | invoices.ts | غير ثابت | توحيد Backend على `invoiceNumber` |
| `nameAr` / `nameEn` | `name` | services.ts | قد يسبب مشاكل في البحث | توثيق الحقول المتوقعة |
| `status` (customer) | `isActive` | customers.ts | قد يرسل قيمة خاطئة | تطابق الـ enum مع الـ Backend |
| `departmentId` | `departmentId` | services.ts, employee-form.ts | ✅ مطابق | — |
| `estimatedDurationMinutes` | `duration` / `estimatedDurationMinutes` | services.ts | قد يرسل حقل خاطئ | توحيد على `estimatedDurationMinutes` |
| `fullNameAr` | `fullName` | employee-form.ts | قد يرسل حقل غير موجود | تعديل الـ Backend أو الواجهة |
| `employeeCode` | `code` / `employeeCode` | employee-form.ts | غير مؤكد | التحقق من الـ Backend DTO |
| `contractType` | `employmentType` / `contractType` | employee-form.ts | غير مؤكد | التحقق من الـ Backend DTO |
| `salarySYP` | `salary` / `salarySYP` | employee-form.ts | غير مؤكد | التحقق من الـ Backend DTO |
| `hourlyRate` | `hourlyRate` | employee-form.ts | ✅ مطابق | — |
| `hireDate` | `hireDate` | employee-form.ts | ✅ مطابق | — |
| `phone` | `phone` | employee-form.ts, customers.ts | ✅ مطابق | — |

---

## 4) جدول مشاكل الفاليديشن

| الفورم / الشاشة | الحقول المتأثرة | ما المفقود | مثال إصلاح |
|-----------------|-----------------|-------------|------------|
| **Login** | `username`, `password` | فقط `required` HTML | إضافة `minlength="3"` + trim check |
| **Customer Create** | `customer-name`, `customer-phone` | فقط `required` HTML | regex هاتف سوري: `^09\d{8}$` |
| **Service Create** | `service-name`, `service-price-syp` | فقط `required` HTML | `priceSYP > 0` check + `name.length >= 2` |
| **Employee Form** | `fullNameAr`, `phone`, `salarySYP` | فقط `required` HTML | راتب > 0، هاتف صالح، تاريخ تعيين <= اليوم |
| **Payment** | `pay-amount`, `pay-date` | لا يوجد `required` HTML ولا JS validation | `amount > 0` + `date` not future |
| **Booking Wizard** | كل الحقول | غير مدقق بالكامل | فاليديشن per-step |
| **Invoice Create** | `items[]`, `discount` | لا يوجد check على المبالغ السالبة | `discount <= subtotal` |
| **Init Setup** | `init-password` | فقط `required` HTML | `minlength="6"` + strength indicator |

---

## 5) جدول مشاكل UX

| الشاشة | نوع المشكلة | التأثير على المستخدم | اقتراح تحسين |
|--------|-------------|----------------------|--------------|
| **Dashboard** | لا يوجد loading state واضح للـ KPI cards | المستخدم يرى shimmer ثابت إذا فشل الـ API | إضافة timeout + error state لكل كارت |
| **Bookings** | bulk delete لا يعرض progress | المستخدم لا يعرف ما يحدث | إضافة toast/loading spinner |
| **Invoices** | `showInvoiceTypeModal` لا تغلق بالـ Escape | المستخدم محبوس في المودال | إضافة `keydown` listener |
| **Customers** | `export-customers-btn` لا يفعل شيئاً | زر ميت | إضافة تنفيذ أو إخفاء |
| **Services** | modal form كبير جداً (15+ حقل) | التمرير الطويل يسبب أخطاء | تقسيم لـ tabs: basic / pricing / parts / warranty |
| **Login** | "نسيت كلمة المرور" رابط فارغ | خداع المستخدم | إزالة أو تنفيذ |
| **All Screens** | لا يوجد toast/notification system | المستخدم لا يعرف إذا نجحت العملية | إنشاء `ToastService` مشترك |
| **All Screens** | لا يوجد confirm قبل navigate من form dirty | فقدان البيانات | إضافة `beforeunload` guard |
| **Payment** | `print-btn` مخفي (`hidden`) دائماً | زر لا يظهر أبداً | إظهاره بعد نجاح الدفع |
| **Employee Form** | لا يوجد feedback أثناء حفظ الموظف | المستخدم قد يضغط مرتين | disabled state + spinner |

---

## 6) جدول مشاكل الأداء

| الملف:السطر | نوع المشكلة | اقتراح تحسين |
|-------------|-------------|--------------|
| `@admin_tauri/src/screens/bookings.ts:193-225` | إعادة بناء كل tbody innerHTML عند كل فلترة | استخدام DocumentFragment أو virtual scrolling |
| `@admin_tauri/src/screens/customers.ts:57-78` | تحميل كل العملاء دفعة واحدة | إضافة pagination مع `?page=&limit=` |
| `@admin_tauri/src/screens/services.ts:43-80` | إعادة بناء كل modal HTML عند كل فتح | استخدام hidden/show بدل إعادة الإنشاء |
| `@admin_tauri/src/screens/dashboard.ts:49-100` | 6+ API calls متوازية بدون `Promise.all` | تجميعها في `Promise.all` |
| `@admin_tauri/src/api/client.ts:53-76` | كل استدعاء يمر عبر Tauri `invoke` bridge | caching للـ GET requests المتكررة |
| `@admin_tauri/src/screens/bookings.ts:228-238` | event listeners تُضاف في كل re-render | استخدام event delegation على tbody |
| `@admin_tauri/src/screens/login.ts:301-303` | branches تُحمّل في كل login | cache branches في localStorage |
| `@admin_tauri/src/router.ts:109-111` | `container.innerHTML = ''` يُهمل كل الـ DOM | استخدام `replaceChildren` أو virtual DOM |

---

## 7) اقتراحات Refactor هيكلية

| # | الـ Refactor | الملفات المتأثرة | الفائدة | الأولوية |
|---|--------------|-------------------|---------|----------|
| 7.1 | **إنشاء `BaseScreen` class** | كل `src/screens/*.ts` | توحيد init, loading, error, empty states | Critical |
| 7.2 | **إنشاء `DataTable` component** | bookings, customers, invoices, inventory, hr | إزالة تكرار الجدول والـ checkbox والـ bulk actions | High |
| 7.3 | **إنشاء `ModalForm` component** | services, customers, employee-form, departments | توحيد فتح/إغلاق/حفظ/فاليديشن المودال | High |
| 7.4 | **إنشاء `FormField` wrapper** | كل الفورم | توحيد label + input + error message + required indicator | Medium |
| 7.5 | **إنشاء `ToastService`** | كل الشاشات | إشعارات نجاح/خطأ/تحذير موحدة | High |

---

## 8) ملاحظات إضافية على البنية

### 8.1 الـ Router
```@admin_tauri/src/router.ts:114-188
// المشكلة: لا يوجد 404 handling فعلي — أي path غير معروف يرجع لـ Dashboard
```
**المشكلة:** fallback دائماً إلى Dashboard. **الإصلاح:** إضافة 404 screen.

### 8.2 الـ Auth
```@admin_tauri/src/services/auth.ts:26-37
// localStorage vulnerable — token stored in plain text
```
**المشكلة:** التوكن في `localStorage` — غير آمن. **الإصلاح:** استخدام `secureStorage` من Tauri.

### 8.3 الـ ApiClient
```@admin_tauri/src/api/client.ts:63-76
// لا يوجد retry logic ولا request timeout
```
**المشكلة:** فشل الشبكة = فشل تام بدون إعادة محاولة. **الإصلاح:** إضافة `retry: 3` و `timeout: 30s`.

### 8.4 الـ Layout
```@admin_tauri/src/components/layout.ts:90-267
// sidebar يُعاد بناؤه في كل navigation — يجب أن يكون persistent
```
**المشكرة:** الـ sidebar يُبنى من جديد في كل screen. **الإصلاح:** فصل الـ sidebar عن الـ content area.

---

## 9) خطة الإصلاح المقترحة قبل الإطلاق

### المرحلة 1 (أسبوع) — Critical
- [ ] إصلاح تسربات الـ event listeners (كل الشاشات)
- [ ] توحيد أسماء الحقول مع الـ Backend API
- [ ] إضافة فاليديشن حقيقي للفورم الرئيسية (login, customer, service, employee)
- [ ] إنشاء `ToastService`

### المرحلة 2 (أسبوع) — High
- [ ] إنشاء `BaseScreen` و `DataTable` و `ModalForm`
- [ ] إضافة error/empty states لكل شاشات القائمة
- [ ] إضافة pagination لـ bookings, customers, invoices
- [ ] إصلاح الـ Auth (secure storage + token refresh)

### المرحلة 3 (أسبوع) — Medium
- [ ] إضافة loading states لكل الأزرار
- [ ] تحسين أداء الجداول (event delegation + virtual scroll)
- [ ] إضافة 404 page
- [ ] مراجعة UX consistency (زر ميت، مودال escape، إلخ)

---

*نهاية التقرير*
