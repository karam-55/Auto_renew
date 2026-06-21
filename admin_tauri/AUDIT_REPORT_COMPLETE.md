# تقرير فحص جاهزية الإنتاج — Admin Tauri Frontend (الشامل)

**المشروع:** AUTO_Renew | **الواجهة:** admin_tauri (Vanilla TS + Tauri) | **تاريخ الفحص:** 20 يونيو 2026
**نطاق الفحص:** 52 ملف تم فحصهم حرفياً (app, router, api, auth, main, 47+ شاشة, style.css, index.html)

---

## 1) حكم الجاهزية: غير جاهز للإطلاق ❌ (52%)

---

## 2) Critical Issues (10 مشاكل حرجة)

| # | الملف:السطر | الوصف | إصلاح مقترح |
|---|-------------|-------|-------------|
| C1 | `auth.ts:27-30` | التوكن في `localStorage` عادي — غير آمن | استخدام `secureStorage` من Tauri |
| C2 | `auth.ts:35` | `JSON.parse(user)` بدون try-catch | إضافة try-catch |
| C3 | كل الشاشات | event listeners تُضاف في كل re-render ولا تُزال | استخدام event delegation |
| C4 | `booking-wizard.ts:17` | لا يستخدم `AppLayout` — لا sidebar | تغليف بـ `AppLayout` |
| C5 | `warehouses.ts:42` | زر "مستودع جديد" ينقل لـ route غير موجود | إضافة route أو إزالة الزر |
| C6 | `suppliers.ts:59` | زر "مورد جديد" ينقل لـ route غير موجود | إضافة route أو إزالة الزر |
| C7 | `pos.ts:87-89` | POS وهمية — checkout لا يفعل شيئاً | تنفيذ checkout logic |
| C8 | `router.ts:185,183` | dynamic routes قد ترسل `undefined` إذا لم يُمرر ID | إضافة validation |
| C9 | `manual-invoice.ts:471-511` | `refreshServicesList` تُضيف listeners في كل استدعاء | event delegation |
| C10 | `api/client.ts:53` | لا يوجد timeout على الطلبات | إضافة timeout 30s |

---

## 3) Naming / API Contract Mismatches (24 عدم تطابق)

| الواجهة | API المتوقع | الملف | الخطر |
|---------|-------------|-------|-------|
| `customerName` | `customer.fullName` | bookings, invoices | silent undefined |
| `plateNumber` | `vehicle.licensePlate` | bookings | silent undefined |
| `serviceName` | `services[0].name` | bookings | silent undefined |
| `i.customer?.name` | `i.customer?.fullName` | invoices | silent undefined |
| `i.invoiceDate` | `i.createdAt` | invoices | silent undefined |
| `fullNameAr` | `fullName` | employee-form, hr | قد يرسل حقل غير موجود |
| `e.name` | `e.fullName` | hr | silent undefined |
| `e.position` | `e.role` | hr | silent undefined |
| `e.salary` | `e.salarySYP` | hr | silent undefined |
| `s.nameEn` / `s.nameAr` | `s.name` | services, manual-invoice | silent undefined |
| `s.basePrice` | `s.priceSYP` | manual-invoice | silent undefined |
| `item.partName` | `item.name` | pos | silent undefined |
| `item.unitPrice` / `item.price` | `item.sellingPriceSYP` | pos | silent undefined |
| `item.supplierName` | `item.supplier.name` | purchase-orders | silent undefined |
| `inv.customerName` | `inv.customer.fullName` | invoice-detail | silent undefined |
| `b.total` | `b.totalCost` | booking-ticket | silent undefined |
| `item.note` | `item.description` | journal-entries | silent undefined |
| `d.name` | `d.nameAr` | departments | silent undefined |
| `c.name` | `c.fullName` | booking-wizard | silent undefined |
| `v.currentKm` | `v.mileage` | booking-wizard | غير مؤكد |
| `scheduledTime` | — | booking-wizard | قد يرسل حقل غير معروف |
| `serviceIds` | — | booking-wizard | قد يتوقع `services` array |
| `customerRes.data?.service` | `customerRes.data` | booking-wizard | fallback غير منطقي |
| `vehicleRes.data?.service` | `vehicleRes.data` | booking-wizard | fallback غير منطقي |

---

## 4) Validation Issues (11 فورم)

| الفورم | ما المفقود |
|--------|------------|
| Login | فقط `required` HTML |
| Customer Create | فقط `required` HTML + لا يوجد regex هاتف |
| Service Create | فقط `required` HTML |
| Employee Form | فقط `required` HTML + لا يوجد check على راتب > 0 |
| Payment | لا يوجد `required` HTML ولا JS validation |
| Booking Wizard | سنة المركبة فقط — لا يوجد check على هاتف العميل |
| Invoice Create | لا يوجد check على discount <= subtotal |
| Init Setup | فقط `required` HTML |
| Manual Invoice | لا يتحقق من اختيار العميل |
| Department | فقط `required` HTML |
| Settings | لا يوجد validation على الهاتف |

---

## 5) UX Issues (15 مشكلة)

| الشاشة | المشكلة |
|--------|---------|
| Dashboard | لا يوجد error state للـ KPI cards |
| Bookings | bulk delete لا يعرض progress |
| Invoices | مودال لا تغلق بالـ Escape |
| Customers | زر "تصدير" لا يفعل شيئاً |
| Services | modal form كبير جداً (15+ حقل) |
| Login | "نسيت كلمة المرور" رابط فارغ |
| All Screens | لا يوجد toast/notification system |
| All Screens | لا يوجد confirm قبل navigate من form dirty |
| Payment | `print-btn` مخفي دائماً |
| Employee Form | لا يوجد feedback أثناء الحفظ |
| Booking Wizard | لا يوجد AppLayout — لا sidebar |
| POS | checkout لا يفعل شيئاً |
| Warehouses | زر جديد ينقل لـ route غير موجود |
| Suppliers | زر جديد ينقل لـ route غير موجود |
| Invoice Detail | `applyDiscount` يستخدم `alert()` |

---

## 6) Performance Issues (13 مشكلة)

| الملف:السطر | المشكلة |
|-------------|---------|
| `bookings.ts:193` | إعادة بناء tbody innerHTML عند كل فلترة |
| `customers.ts:57` | تحميل كل العملاء دفعة واحدة |
| `services.ts:43` | إعادة بناء modal HTML عند كل فتح |
| `dashboard.ts:49` | 6+ API calls بدون `Promise.all` |
| `api/client.ts:53` | كل استدعاء يمر عبر Tauri bridge بدون cache |
| `bookings.ts:228` | listeners تُضاف في كل re-render |
| `login.ts:301` | branches تُحمّل في كل login |
| `router.ts:109` | `container.innerHTML = ''` يُهمل DOM |
| `manual-invoice.ts:471` | `refreshServicesList` تُضيف listeners |
| `booking-ticket.ts:252` | إعادة بناء QR code في كل تحديث |
| `pos.ts:93` | تحميل كل المنتجات دفعة واحدة |
| `index.html:12` | Tailwind CDN يتطلب إنترنت |
| `index.html:10-11` | Google Fonts يتطلب إنترنت |

---

## 7) Router Issues (7 مشاكل)

| # | الوصف |
|---|-------|
| 7.1 | لا يوجد 404 page — أي path يرجع لـ Dashboard |
| 7.2 | `/payments/new` يستخدم `startsWith` — قد يسبب تداخل |
| 7.3 | `/inventory/warehouses/new` — غير موجود في Router |
| 7.4 | `/inventory/suppliers/new` — غير موجود في Router |
| 7.5 | `/customers/` dynamic — قد يرسل `undefined` |
| 7.6 | `/hr/employees/` dynamic — قد يرسل `undefined` |
| 7.7 | `/dealers/` dynamic — `DealersScreen` لا تستخدم الـ ID |

---

## 8) Security Issues (7 مشاكل)

| # | الملف:السطر | الوصف |
|---|-------------|-------|
| 8.1 | `auth.ts:27` | التوكن في `localStorage` |
| 8.2 | `auth.ts:35` | `JSON.parse` بدون try-catch |
| 8.3 | `index.html` | لا يوجد CSP meta tag |
| 8.4 | `login.ts:166` | redirect قد يسرب token في referrer |
| 8.5 | `booking-wizard.ts:551` | `JSON.parse` بدون try-catch |
| 8.6 | `api/client.ts:53` | لا يوجد timeout |
| 8.7 | `api/client.ts:63` | `result.body as any` — casting بدون validation |

---

## 9) CSS / HTML Issues (8 مشاكل)

| # | الملف:السطر | الوصف |
|---|-------------|-------|
| 9.1 | `index.html:12` | Tailwind من CDN — offline mode معطل |
| 9.2 | `index.html:10-11` | Google Fonts من CDN — offline mode معطل |
| 9.3 | `index.html:7` | العنوان "أوتو برو" ≠ "AUTO_Renew" |
| 9.4 | `index.html` | لا يوجد description meta |
| 9.5 | `index.html` | لا يوجد CSP |
| 9.6 | `style.css` | 2105 سطر — كبير جداً |
| 9.7 | `style.css:8-92` | بعض CSS variables لا تُستخدم |
| 9.8 | `style.css` | ✅ `prefers-reduced-motion` — جيد |

---

## 10) Refactor Suggestions (5 مقترحات)

| # | الـ Refactor | الفائدة | الأولوية |
|---|--------------|---------|----------|
| 10.1 | `BaseScreen` class | توحيد init, loading, error, empty | Critical |
| 10.2 | `DataTable` component | إزالة تكرار الجداول | High |
| 10.3 | `ModalForm` component | توحيد المودالات | High |
| 10.4 | `ToastService` | إشعارات موحدة | High |
| 10.5 | `FormField` wrapper | توحيد label + input + error | Medium |

---

## 11) خطة الإصلاح (3 أسابيع)

### الأسبوع 1 — Critical
- [ ] إصلاح تسربات الـ event listeners
- [ ] توحيد أسماء الحقول مع الـ Backend
- [ ] إضافة فاليديشن حقيقي للفورم الرئيسية
- [ ] إنشاء `ToastService`
- [ ] إصلاح Router (404 + missing routes)

### الأسبوع 2 — High
- [ ] إنشاء `BaseScreen` + `DataTable` + `ModalForm`
- [ ] إضافة error/empty states
- [ ] إضافة pagination
- [ ] إصلاح الـ Auth (secure storage)
- [ ] تغليف Booking Wizard بـ AppLayout

### الأسبوع 3 — Medium
- [ ] إضافة loading states للأزرار
- [ ] تحسين أداء الجداول
- [ ] إضافة CSP + offline fonts
- [ ] مراجعة UX consistency
- [ ] تنفيذ POS checkout

---

*نهاية التقرير الشامل*
