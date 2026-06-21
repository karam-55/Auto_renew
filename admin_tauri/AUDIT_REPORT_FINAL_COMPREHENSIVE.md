# تقرير فحص جاهزية الإنتاج — Admin Tauri Frontend (الشامل الكامل)

**المشروع:** AUTO_Renew | **الواجهة:** admin_tauri (Vanilla TS + Tauri Desktop)  
**تاريخ الفحص:** 20 يونيو 2026 | **المدقق:** Senior Frontend Engineer + QA Lead  
**نطاق الفحص:** 60+ ملف تم فحصهم حرفياً (app, router, api, auth, main, 52 شاشة, 2 service, style.css, index.html, package.json, tsconfig.json, vite.config.ts, tauri.conf.json, capabilities/default.json)

---

## 1) حكم الجاهزية: غير جاهز للإطلاق بشكل حاسم ❌ (42%)

**ملاحظة:** النسبة المحدّثة تأتي بعد فحص 10 ملفات إضافية أُصلية كانت ناقصة (dealers, loyalty, setup-wizard, setup-wizard-steps, system-setup, setup-wizard.service, tauri.conf.json, vite.config.ts, capabilities/default.json, package.json).

---

## 2) Critical Issues (27 مشكلة حرجة)

| # | الملف:السطر | الوصف | إصلاح مقترح |
|---|-------------|-------|-------------|
| C1 | `auth.ts:27-30` | التوكن في `localStorage` عادي — غير آمن | استخدام `secureStorage` من Tauri |
| C2 | `auth.ts:35` | `JSON.parse(user)` بدون try-catch | إضافة try-catch |
| C3 | كل الشاشات | event listeners تُضاف في كل re-render ولا تُزال | استخدام event delegation |
| C4 | `booking-wizard.ts:17` | لا يستخدم `AppLayout` — لا sidebar | تغليف بـ `AppLayout` |
| C5 | `warehouses.ts:42` | زر "مستودع جديد" ينقل لـ route غير موجود | إضافة route أو إزالة الزر |
| C6 | `suppliers.ts:59` | زر "مورد جديد" ينقل لـ route غير موجود | إضافة route أو إزالة الزر |
| C7 | `pos.ts:87-89` | POS وهمية — checkout لا يفعل شيئاً | تنفيذ checkout logic |
| C8 | `trial-balance.ts:1-55` | **شاشة وهمية** — static page بدون loadData | تنفيذ API integration |
| C9 | `cash-flow.ts:1-55` | **شاشة وهمية** — static page بدون loadData | تنفيذ API integration |
| C10 | `workshop-map.ts:1-68` | **شاشة وهمية** — محطات hardcoded بدون API | تنفيذ API integration |
| C11 | `notifications.ts:580` | `showNewTaskModal` = `alert('سيتم فتح نموذج...')` — placeholder | تنفيذ المهام |
| C12 | `users.ts:310-312` | defaults خطيرة: phone='0999999999', password='password123' | إزالة defaults |
| C13 | `router.ts:185,183` | dynamic routes قد ترسل `undefined` إذا لم يُمرر ID | إضافة validation |
| C14 | `manual-invoice.ts:471-511` | `refreshServicesList` تُضيف listeners في كل استدعاء | event delegation |
| C15 | `api/client.ts:53` | لا يوجد timeout على الطلبات | إضافة timeout 30s |
| C16 | `tauri.conf.json:48` | `"csp": null` — Content Security Policy معطل | تفعيل CSP صارم |
| C17 | `system-setup.ts:214` | `password: phone` — كلمة المرور = رقم الموبايل | توليد كلمة مرور عشوائية أو إجبار المستخدم |
| C18 | `loyalty.ts:77` | "إضافة نقاط" لا يفعل شيئاً — `alert` placeholder | تنفيذ نموذج إضافة نقاط |
| C19 | `dealers.ts:60` | `router.navigate('/dealers/new')` — route غير موجود | إضافة route أو إزالة الزر |
| C20 | `system-setup.ts:279` | `address: address || undefined` — يرسل `undefined` literally | استخدام `address || null` أو حذف الحقل |
| C21 | `setup-wizard.service.ts:70` | Service موجود لكن لا يوجد استخدام فعلي | دمج مع setup-wizard أو حذف |
| C22 | `system-setup.ts:297` | individual user errors يتم تجاهلها | عرض أخطاء إنشاء المستخدمين |
| C23 | `setup-wizard-steps.ts:139` | تاريخ النهاية افتراضي 2026-12-31 بدون فاليديشن | إضافة validation للفترة المالية |
| C24 | `tauri.conf.json:31` | الإصدار `0.1.0` — غير مناسب للإطلاق | تحديث الإصدار وربط capabilities |
| C25 | `setup-wizard.ts:246` | `password: phone` — مستخدمو Setup Wizard كلمة مرور = رقم الموبايل | توليد كلمة مرور عشوائية أو إجبار المستخدم |
| C26 | `vite.config.ts:10` | proxy URL hardcoded إلى IP production `http://178.105.209.59` | استخدام `localhost` أو متغير بيئة |
| C27 | `tauri.conf.json:50` | `capabilities: []` رغم وجود `capabilities/default.json` | ربط `default` capability في الإعدادات |

---

## 3) Naming / API Contract Mismatches (30+ عدم تطابق)

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
| `item.partName` | `item.name` | pos, inventory-report | silent undefined |
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
| `a.accountNameAr` / `a.accountName` | `a.name` | balance-sheet, income-statement | silent undefined |
| `u.fullName` / `u.name` / `u.username` | `u.fullName` | users | silent undefined |
| `u.phone` / `u.username` | `u.phone` | users | fallback غير منطقي |
| `r.name` / `r.role` | `r.name` | roles | silent undefined |
| `r._count?.employees` / `r.userCount` | `r.userCount` | roles | silent undefined |
| `log.user?.name` / `log.user?.username` / `log.userName` | `log.user.name` | audit | silent undefined |
| `n.title` / `n.titleAr` | `n.title` | notifications | silent undefined |
| `n.body` / `n.bodyAr` | `n.body` | notifications | silent undefined |
| `item.fileName` / `item.name` | `item.name` | documents | silent undefined |
| `item.fileType` / `item.type` | `item.type` | documents | silent undefined |
| `item.fileSize` / `item.size` | `item.size` | documents | silent undefined |
| `s.estimatedDurationMinutes` / `s.duration` | `s.estimatedDurationMinutes` | services | silent undefined |
| `b.customer?.name` / `b.customerName` | `b.customer.fullName` | dashboard | silent undefined |
| `b.vehicle?.plateNumber` / `b.vehiclePlate` | `b.vehicle.licensePlate` | dashboard | silent undefined |
| `cust.customerName` / `cust.customerId` | `cust.customerName` | revenue-report | silent undefined |

---

## 4) Validation Issues (12 فورم)

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
| Users | defaults خطيرة (phone, password) |
| Branches | فقط `name` check |
| Roles | فقط `name` check |

---

## 5) UX Issues (18 مشكلة)

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
| Trial Balance | **شاشة وهمية** — كل القيم 0 |
| Cash Flow | **شاشة وهمية** — كل القيم 0 |
| Workshop Map | **شاشة وهمية** — محطات hardcoded |
| Notifications | Tasks tab = placeholder alert |
| Documents | زر "رفع مستند" لا يفعل شيئاً |

---

## 6) Performance Issues (15 مشكلة)

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
| `notifications.ts:339` | إعادة بناء كل notifications HTML عند فلترة |
| `users.ts:226` | إعادة بناء جدول users عند كل فلترة |
| `audit.ts:129` | `logs.slice(0, 50)` — hard limit بدون pagination UI |

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

## 8) Security Issues (15 مشكلة)

| # | الملف:السطر | الوصف |
|---|-------------|-------|
| 8.1 | `auth.ts:27` | التوكن في `localStorage` |
| 8.2 | `auth.ts:35` | `JSON.parse` بدون try-catch |
| 8.3 | `index.html` | لا يوجد CSP meta tag |
| 8.4 | `login.ts:166` | redirect قد يسرب token في referrer |
| 8.5 | `booking-wizard.ts:551` | `JSON.parse` بدون try-catch |
| 8.6 | `api/client.ts:53` | لا يوجد timeout |
| 8.7 | `api/client.ts:63` | `result.body as any` — casting بدون validation |
| 8.8 | `users.ts:310-312` | defaults خطيرة: phone='0999999999', password='password123' |
| 8.9 | `tauri.conf.json:48` | `csp: null` — CSP معطل في Tauri |
| 8.10 | `tauri.conf.json:50` | `capabilities: []` — لا يوجد Tauri v2 capabilities |
| 8.11 | `tauri.conf.json` | `capabilities: []` رغم وجود `capabilities/default.json` — لم يُربط |
| 8.12 | `system-setup.ts:214` | إنشاء مستخدمين بكلمة مرور = رقم الموبايل |
| 8.13 | `system-setup.ts:299` | أخطاء إنشاء المستخدمين تُتجاهل — silent failures |
| 8.14 | `setup-wizard.ts:246` | `password: phone` — مستخدمو Setup Wizard كلمة مرور = رقم الموبايل |
| 8.15 | `vite.config.ts:10` | proxy URL hardcoded إلى IP production `http://178.105.209.59` |

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

## 10) شاشات وهمية (7 شاشات)

| الشاشة | السبب |
|--------|-------|
| `trial-balance.ts` | static page — كل القيم "0" والجدول فارغ |
| `cash-flow.ts` | static page — كل القيم "0" والجدول فارغ |
| `workshop-map.ts` | المحطات hardcoded — لا يوجد API integration |
| `pos.ts` | checkout لا يفعل شيئاً — alert فقط |
| `notifications.ts:tasks` | `showNewTaskModal` = alert placeholder |
| `loyalty.ts` | "إضافة نقاط" = alert placeholder |
| `dealers.ts` | زر "وكيل جديد" ينقل لـ route غير موجود |

---

## 11) Refactor Suggestions (5 مقترحات)

| # | الـ Refactor | الفائدة | الأولوية |
|---|--------------|---------|----------|
| 11.1 | `BaseScreen` class | توحيد init, loading, error, empty | Critical |
| 11.2 | `DataTable` component | إزالة تكرار الجداول | High |
| 11.3 | `ModalForm` component | توحيد المودالات | High |
| 11.4 | `ToastService` | إشعارات موحدة | High |
| 11.5 | `FormField` wrapper | توحيد label + input + error | Medium |

---

## 12) خطة الإصلاح (3 أسابيع)

### الأسبوع 1 — Critical (أمن + عقود)
- [ ] إصلاح تسربات الـ event listeners
- [ ] تفعيل CSP في `tauri.conf.json` + إضافة capabilities
- [ ] إيقاف إنشاء المستخدمين بـ `password: phone` في `system-setup.ts`
- [ ] توحيد أسماء الحقول مع الـ Backend
- [ ] إضافة فاليديشن حقيقي للفورم الرئيسية
- [ ] إنشاء `ToastService`
- [ ] إصلاح Router (404 + missing routes)
- [ ] تنفيذ الشاشات الوهمية (trial-balance, cash-flow, workshop-map, loyalty, POS)

### الأسبوع 2 — High
- [ ] إنشاء `BaseScreen` + `DataTable` + `ModalForm`
- [ ] إضافة error/empty states
- [ ] إضافة pagination
- [ ] إصلاح الـ Auth (secure storage)
- [ ] تغليف Booking Wizard بـ AppLayout
- [ ] تنفيذ POS checkout
- [ ] إصلاح `system-setup.ts` لاستخدام `setup-wizard.service` بشكل صحيح

### الأسبوع 3 — Medium
- [ ] إضافة loading states للأزرار
- [ ] تحسين أداء الجداول
- [ ] إضافة offline fonts (إزالة Google Fonts CDN)
- [ ] مراجعة UX consistency
- [ ] إزالة defaults الخطيرة من Users
- [ ] إضافة نسخة منطقية من `dealers.ts` (new/edit routes)

---

## 13) ملفات إضافية تم فحصها (10 ملفات أصلية نسيتها)

| الملف | ما وجدته |
|-------|----------|
| `@C:\Users\FIX 11\projects\AUTO_Renew\admin_tauri\src\screens\dealers.ts` | شاشة بسيطة. route `/dealers/new` غير موجود في Router. لا يوجد زر حذف. |
| `@C:\Users\FIX 11\projects\AUTO_Renew\admin_tauri\src\screens\loyalty.ts` | زر "إضافة نقاط" = `alert('placeholder')` — شاشة وهمية جزئياً. |
| `@C:\Users\FIX 11\projects\AUTO_Renew\admin_tauri\src\screens\setup-wizard.ts` | شاشة كاملة لكنها تُنشئ مستخدمين بـ `password: phone`. `loadStatus` تتجاهل الأخطاء. |
| `@C:\Users\FIX 11\projects\AUTO_Renew\admin_tauri\src\screens\setup-wizard-steps.ts` | templates فقط. فاليديشن ضعيفة. |
| `@C:\Users\FIX 11\projects\AUTO_Renew\admin_tauri\src\screens\system-setup.ts` | ينشئ مستخدمين بـ `password: phone`. يستخدم `/api/settings` بدلاً من `/api/setup-wizard/*`. |
| `@C:\Users\FIX 11\projects\AUTO_Renew\admin_tauri\src\services\setup-wizard.service.ts` | service نظيف لكن `system-setup.ts` لا يستخدمه. |
| `@C:\Users\FIX 11\projects\AUTO_Renew\admin_tauri\src-tauri\tauri.conf.json` | **CSP معطل (`csp: null`)**. `capabilities: []` غير مربوطة بـ `default.json`. الإصدار 0.1.0. |
| `@C:\Users\FIX 11\projects\AUTO_Renew\admin_tauri\src-tauri\capabilities\default.json` | capabilities موجودة لكنها غير مربوطة في `tauri.conf.json`. |
| `@C:\Users\FIX 11\projects\AUTO_Renew\admin_tauri\vite.config.ts` | proxy URL hardcoded إلى IP production `http://178.105.209.59`. |
| `@C:\Users\FIX 11\projects\AUTO_Renew\admin_tauri\package.json` | dependencies نظيفة (`@tauri-apps/api`, `plugin-http`, `vite`, `typescript`). |

---

## 14) الحكم النهائي

**غير جاهز للإطلاق بشكل حاسم ❌ (42%)**

الأسباب الرئيسية:
1. **CSP معطل** في `tauri.conf.json` — خطر XSS production-critical.
2. **إنشاء مستخدمين بكلمة مرور = رقم الموبايل** في `system-setup.ts` **و** `setup-wizard.ts`.
3. **capabilities/default.json موجودة لكن غير مربوطة** في `tauri.conf.json`.
4. **7 شاشات وهمية** (trial-balance, cash-flow, workshop-map, POS, notifications-tasks, loyalty, dealers).
5. **Token في localStorage** غير آمن.
6. **proxy URL hardcoded إلى IP production** في `vite.config.ts` (`http://178.105.209.59`).
7. **30+ naming mismatch** بين الواجهة والـ API.
8. **لا يوجد فاليديشن حقيقي** على الفورم الرئيسية.
9. **لا يوجد Toast/Error/Empty states** موحدة.

---

*نهاية التقرير الشامل الكامل — نسخة محدثة بعد فحص الملفات الإضافية*
