# تقرير توثيق Backend API الشامل
**التاريخ:** يونيو 2026  
**المشروع:** AUTO_Renew Backend  
**المسار:** `backend/`

---

## 1) الـ Domains الموجودة

### Domains الرئيسية:
- **Auth** - المصادقة والتفويض
- **Customers** - إدارة العملاء
- **Vehicles** - إدارة المركبات
- **Bookings** - إدارة الحجوزات
- **Work Orders** - أوامر العمل
- **Invoices** - إدارة الفواتير
- **Payments** - إدارة المدفوعات
- **Inventory** - إدارة المخزون
- **Accounting** - المحاسبة والقيود اليومية
- **Branches** - إدارة الفروع
- **Warehouses** - إدارة المستودعات
- **Memberships** - إدارة العضويات
- **Loyalty** - إدارة نقاط الولاء
- **Wallet** - إدارة المحافظ الرقمية
- **Analytics** - التحليلات والتقارير
- **Reports** - التقارير المالية
- **Notifications** - الإشعارات
- **Settings** - الإعدادات
- **RBAC** - إدارة الأدوار والصلاحيات
- **AI** - المساعد الذكي
- **Public** - الوصول العام (تتبع الحجوزات)

---

## 2) الـ Endpoints المتوفرة

**ملاحظة:** النظام لديه أكثر من 70 route مسجلة. سأذكر أهمها:

### Auth Domain
```
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
GET /api/auth/profile
```

### Users Domain
```
GET /api/users
POST /api/users
GET /api/users/:id
PUT /api/users/:id
DELETE /api/users/:id
```

### Customers Domain
```
POST /api/customers
GET /api/customers/:id
GET /api/customers
PUT /api/customers/:id
DELETE /api/customers/:id
POST /api/customers/:id/loyalty
```

### Vehicles Domain
```
POST /api/vehicles
GET /api/vehicles/:id
GET /api/vehicles
GET /api/vehicles/customer/:customerId
PUT /api/vehicles/:id
GET /api/vehicle-categories
POST /api/vehicle-categories
PUT /api/vehicle-categories/:id
DELETE /api/vehicle-categories/:id
GET /api/vehicles/brands/clean
GET /api/vehicles/models/clean
GET /api/customers/:customerId/vehicles/clean
POST /api/customers/:customerId/vehicles/clean
GET /api/customers/:customerId/vehicles/clean/:id
PUT /api/customers/:customerId/vehicles/clean/:id
DELETE /api/customers/:customerId/vehicles/clean/:id
```

### Services Domain
```
GET /api/services
POST /api/services
GET /api/services/:id
PUT /api/services/:id
DELETE /api/services/:id
GET /api/service-categories
POST /api/service-categories
PUT /api/service-categories/:id
DELETE /api/service-categories/:id
GET /api/service-packages
POST /api/service-packages
PUT /api/service-packages/:id
DELETE /api/service-packages/:id
```

### Bookings Domain
```
POST /api/bookings
GET /api/bookings/:id
GET /api/bookings
PUT /api/bookings/:id
GET /api/bookings/vehicle/:vehicleId
GET /api/mechanic-assignments
POST /api/mechanic-assignments
PUT /api/mechanic-assignments/:id
DELETE /api/mechanic-assignments/:id
```

### Invoices Domain
```
POST /api/invoices
GET /api/invoices/:id
GET /api/invoices
PUT /api/invoices/:id
GET /api/invoices/booking/:bookingId
```

### Payments Domain
```
GET /api/payments
POST /api/payments
GET /api/payments/:id
PUT /api/payments/:id
DELETE /api/payments/:id
```

### Inventory Domain
```
POST /api/inventory/suppliers
GET /api/inventory/suppliers
POST /api/inventory/purchase-orders
GET /api/inventory/purchase-orders
POST /api/inventory/grns
GET /api/inventory/grns
GET /api/inventory/stock
GET /api/inventory/stock/movements
GET /api/parts
POST /api/parts
GET /api/parts/:id
PUT /api/parts/:id
DELETE /api/parts/:id
GET /api/part-categories
POST /api/part-categories
PUT /api/part-categories/:id
DELETE /api/part-categories/:id
GET /api/inventory-transactions
POST /api/inventory-transactions
GET /api/inventory-count
POST /api/inventory-count
PUT /api/inventory-count/:id
GET /api/suppliers
POST /api/suppliers
GET /api/suppliers/:id
PUT /api/suppliers/:id
DELETE /api/suppliers/:id
GET /api/purchase-orders
POST /api/purchase-orders
GET /api/purchase-orders/:id
PUT /api/purchase-orders/:id
DELETE /api/purchase-orders/:id
GET /api/grn
POST /api/grn
GET /api/grn/:id
PUT /api/grn/:id
DELETE /api/grn/:id
```

### Accounting Domain
```
POST /api/accounting/accounts
GET /api/accounting/accounts
GET /api/accounting/accounts/tree
POST /api/accounting/journal-entries
GET /api/accounting/journal-entries
GET /api/accounting/customers/:customerId/balance
GET /api/accounting/customers/:customerId/statement
GET /api/accounting/suppliers/:supplierId/balance
GET /api/accounting/suppliers/:supplierId/statement
POST /api/accounting/payments
GET /api/accounting/payments/customer/:customerId
GET /api/accounting/reports/trial-balance
GET /api/accounting/reports/income-statement
GET /api/accounting/reports/balance-sheet
GET /api/accounts
POST /api/accounts
GET /api/accounts/:id
PUT /api/accounts/:id
DELETE /api/accounts/:id
GET /api/fiscal-periods
POST /api/fiscal-periods
PUT /api/fiscal-periods/:id
GET /api/journal-entries
POST /api/journal-entries
GET /api/journal-entries/:id
PUT /api/journal-entries/:id
DELETE /api/journal-entries/:id
```

### Branches Domain
```
GET /api/branches
POST /api/branches
GET /api/branches/:id
PUT /api/branches/:id
DELETE /api/branches/:id
GET /api/warehouses
POST /api/warehouses
GET /api/warehouses/:id
PUT /api/warehouses/:id
DELETE /api/warehouses/:id
```

### Memberships Domain
```
GET /api/memberships/plans
POST /api/memberships/plans
PUT /api/memberships/plans/:id
DELETE /api/memberships/plans/:id
GET /api/memberships/customers/:id/memberships
POST /api/memberships/customers/:id/memberships/purchase
PUT /api/memberships/:id/cancel
GET /api/memberships/customers/:id/points
GET /api/memberships/customers/:id/points/transactions
POST /api/memberships/customers/:id/points/redeem
POST /api/memberships/customers/:id/points/add
GET /api/memberships/customers-with-points
GET /api/memberships/customers/:id/wallet
POST /api/memberships/customers/:id/wallet/add
GET /api/loyalty
POST /api/loyalty
PUT /api/loyalty/:id
DELETE /api/loyalty/:id
```

### Analytics Domain
```
GET /api/analytics/sales
GET /api/analytics/profitability
GET /api/analytics/bookings
GET /api/analytics/inventory
GET /api/analytics/memberships
GET /api/analytics/branches
POST /api/analytics/cache/clear
GET /api/dashboard
```

### RBAC Domain
```
GET /api/rbac/roles
GET /api/rbac/roles/:id
POST /api/rbac/roles
PUT /api/rbac/roles/:id
DELETE /api/rbac/roles/:id
GET /api/rbac/permissions
GET /api/rbac/roles/:roleId/permissions
POST /api/rbac/roles/:roleId/permissions
```

### Notifications Domain
```
GET /api/notifications
POST /api/notifications
GET /api/notifications/rules
POST /api/notifications/rules
PUT /api/notifications/rules/:id
DELETE /api/notifications/rules/:id
GET /api/whatsapp
POST /api/whatsapp
PUT /api/whatsapp/:id
DELETE /api/whatsapp/:id
GET /api/fcm
POST /api/fcm
PUT /api/fcm/:id
DELETE /api/fcm/:id
```

### Reports Domain
```
GET /api/reports
GET /api/reports/advanced
GET /api/reports-management
POST /api/reports-management
GET /api/data-exports
POST /api/data-exports
```

### HR Domain
```
GET /api/departments
POST /api/departments
PUT /api/departments/:id
DELETE /api/departments/:id
GET /api/employees
POST /api/employees
GET /api/employees/:id
PUT /api/employees/:id
DELETE /api/employees/:id
GET /api/shifts
POST /api/shifts
PUT /api/shifts/:id
DELETE /api/shifts/:id
GET /api/attendance
POST /api/attendance
PUT /api/attendance/:id
DELETE /api/attendance/:id
GET /api/payroll
POST /api/payroll
PUT /api/payroll/:id
DELETE /api/payroll/:id
```

### Finance Domain
```
GET /api/currencies
POST /api/currencies
PUT /api/currencies/:id
DELETE /api/currencies/:id
GET /api/cheques
POST /api/cheques
PUT /api/cheques/:id
DELETE /api/cheques/:id
GET /api/installments
POST /api/installments
PUT /api/installments/:id
DELETE /api/installments/:id
GET /api/expenses
POST /api/expenses
PUT /api/expenses/:id
DELETE /api/expenses/:id
```

### Maintenance Domain
```
GET /api/maintenance
POST /api/maintenance
PUT /api/maintenance/:id
DELETE /api/maintenance/:id
GET /api/schedule
POST /api/schedule
PUT /api/schedule/:id
DELETE /api/schedule/:id
```

### Settings Domain
```
GET /api/settings
PUT /api/settings
```

### AI Domain
```
POST /api/ai/query
```

### Public Domain
```
GET /api/public/track/:token
```

### Audit Domain
```
GET /api/audit
GET /api/audit/:id
```

### Insights Domain
```
GET /api/insights
```

### Health Domain
```
GET /health
```

### Coming Soon Routes (قيد التطوير)
```
GET /api/tenants
POST /api/tenants
GET /api/inventory
POST /api/inventory
GET /api/hr
POST /api/hr
```

### Clean Architecture Routes (قديمة - قد تكون مهملة)
```
POST /api/auth/clean/login
POST /api/auth/clean/logout
POST /api/auth/clean/refresh
GET /api/auth/clean/profile
GET /api/customers/clean
POST /api/customers/clean
GET /api/customers/clean/:id
PUT /api/customers/clean/:id
DELETE /api/customers/clean/:id
GET /api/vehicles/clean
POST /api/vehicles/clean
GET /api/vehicles/clean/:id
PUT /api/vehicles/clean/:id
GET /api/vehicles/brands/clean
GET /api/vehicles/models/clean
GET /api/bookings/clean
POST /api/bookings/clean
GET /api/bookings/clean/:id
PUT /api/bookings/clean/:id
GET /api/bookings/:id/services/clean
POST /api/bookings/:id/services/clean
GET /api/bookings/:id/images/clean
POST /api/bookings/:id/images/clean
GET /api/bookings/:id/approval/clean
PUT /api/bookings/:id/approval/clean
GET /api/invoices/clean
POST /api/invoices/clean
GET /api/invoices/clean/:id
PUT /api/invoices/clean/:id
GET /api/invoices/:id/items/clean
POST /api/invoices/:id/items/clean
GET /api/invoices/:id/payments/clean
POST /api/invoices/:id/payments/clean
GET /api/inventory/parts/clean
GET /api/inventory/stock/clean
GET /api/inventory/movements/clean
GET /api/inventory/po/clean
POST /api/inventory/po/clean
GET /api/inventory/grn/clean
POST /api/inventory/grn/clean
```

---

## 3) شكل الـ Responses

### Success Response Format
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message"
  }
}
```

### Booking Response Example
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "customerId": "uuid",
    "vehicleId": "uuid",
    "status": "PENDING",
    "publicToken": "uuid",
    "scheduledDate": "2026-06-12",
    "scheduledTime": "10:00",
    "notes": "Customer notes",
    "priority": "NORMAL",
    "createdAt": "2026-06-12T10:00:00Z",
    "updatedAt": "2026-06-12T10:00:00Z"
  }
}
```

### Customer Response Example
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "fullName": "Karam",
    "phone": "+963123456789",
    "address": "Damascus",
    "notes": "VIP customer",
    "city": "Damascus",
    "loyaltyPoints": 100,
    "createdAt": "2026-06-12T10:00:00Z",
    "updatedAt": "2026-06-12T10:00:00Z"
  }
}
```

### Invoice Response Example
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "customerId": "uuid",
    "bookingId": "uuid",
    "invoiceNumber": "INV-001",
    "invoiceDate": "2026-06-12",
    "dueDate": "2026-06-19",
    "subtotalSYP": 100000,
    "subtotalUSD": 200,
    "taxSYP": 10000,
    "taxUSD": 20,
    "discountSYP": 0,
    "discountUSD": 0,
    "totalSYP": 110000,
    "totalUSD": 220,
    "status": "DRAFT",
    "notes": "Invoice notes",
    "createdAt": "2026-06-12T10:00:00Z",
    "updatedAt": "2026-06-12T10:00:00Z"
  }
}
```

---

## 4) الفلو الأساسي للنظام

### Flow 1: حجز جديد
1. الزبون يحجز (من خلال الموظف أو عبر التطبيق)
2. يتم إنشاء Booking بحالة PENDING
3. يتم إرسال إشعار للزبون
4. الموظف يستقبل السيارة
5. يتم تحديث حالة الحجز إلى IN_PROGRESS
6. الفني يبدأ العمل
7. يتم إضافة خدمات إضافية إذا لزم الأمر
8. يتم إصدار الفاتورة
9. يتم الدفع
10. يتم تسليم السيارة
11. يتم تحديث حالة الحجز إلى COMPLETED
12. يتم إضافة نقاط ولاء للزبون

### Flow 2: إدارة المخزون
1. إنشاء Supplier
2. إنشاء Purchase Order
3. استلام البضائع (GRN)
4. تحديث المخزون تلقائياً
5. نقل المخزون بين الفروع (Inventory Transfer)
6. مراقبة حركة المخزون (Stock Movements)

### Flow 3: المحاسبة
1. إنشاء Accounts (شجرة الحسابات)
2. إنشاء Journal Entries تلقائياً عند:
   - إصدار فاتورة
   - استلام دفعة
   - شراء مخزون
   - نقل مخزون
3. إنشاء Payment
4. تحديث Customer/Supplier Balance
5. إنشاء التقارير المالية (Trial Balance, Income Statement, Balance Sheet)

### Flow 4: العضويات والولاء
1. إنشاء Membership Plans
2. الزبون يشتري Membership
3. يتم إضافة نقاط ولاء تلقائياً
4. الزبون يستخدم النقاط أو المحفظة
5. مراقبة المعاملات

---

## 5) Webhooks أو Events

### Domain Events (من Clean Architecture)
النظام يستخدم Domain Events من خلال Clean Architecture:

#### Booking Events
- **BookingCreatedEvent** - عند إنشاء حجز جديد
- **BookingStatusChangedEvent** - عند تغيير حالة الحجز

#### Invoice Events
- **InvoiceCreatedEvent** - عند إنشاء فاتورة
- **InvoicePaidEvent** - عند دفع فاتورة

#### Payment Events
- **PaymentReceivedEvent** - عند استلام دفعة

#### Inventory Events
- **PartCreatedEvent** - عند إنشاء قطعة غيار
- **StockIncreasedEvent** - عند زيادة المخزون
- **StockDecreasedEvent** - عند نقصان المخزون
- **GRNCreatedEvent** - عند إنشاء GRN
- **GRNReceivedEvent** - عند استلام GRN
- **StockIncreasedByGRNEvent** - عند زيادة المخزون عبر GRN

#### Customer Events
- **CustomerCreatedEvent** - عند إنشاء عميل جديد

#### Auth Events
- **UserCreatedEvent** - عند إنشاء مستخدم جديد

### Queue Jobs (BullMQ)
النظام يستخدم BullMQ للمعالجة غير المتزامنة:

#### Queue Types
- **Notifications Queue** - إرسال إشعارات (WhatsApp, SMS, Email)
- **PDF Queue** - توليد PDF للفواتير والتقارير
- **Reports Queue** - توليد التقارير المعقدة
- **Accounting Queue** - معالجة القيود اليومية
- **Inventory Queue** - معالجة حركات المخزون

### Socket.IO Events
النظام يستخدم Socket.IO للاتصال الحي:

#### Events
- **join-tenant** - الانضمام لقناة tenant
- **join-user** - الانضمام لقناة user
- **join-booking** - الانضمام لقناة booking
- **booking-updated** - تحديث حالة الحجز
- **notification** - إشعار جديد

---

## 6) Authentication/Authorization

### Authentication
- **JWT Tokens** - يستخدم JWT للمصادقة
- **Access Token** - رمز وصول قصير العمر
- **Refresh Token** - رمز تحديث لتجديد Access Token
- **Token Storage** - يتم تخزين الـ jti في الـ token للإلغاء

### Authorization
- **Role-Based Access Control (RBAC)** - نظام صلاحيات قائم على الأدوار
- **Roles**:
  - ADMIN - المسؤول العام
  - MANAGER - المدير
  - RECEPTIONIST - الموظف المكتبي
  - MECHANIC - الفني

### Permissions
النظام يستخدم نظام صلاحيات دقيق (Fine-grained Permissions):

#### Permissions الموجودة
- **use_ai_assistant** - استخدام المساعد الذكي
- **view_analytics** - عرض التحليلات
- **view_audit_logs** - عرض سجلات التدقيق
- **manage_roles** - إدارة الأدوار
- **manage_settings** - إدارة الإعدادات
- **manage_branches** - إدارة الفروع
- **manage_inventory** - إدارة المخزون
- **manage_accounting** - إدارة المحاسبة

### Middleware
- **AuthMiddleware.authenticate** - التحقق من المصادقة
- **AuthMiddleware.authorize** - التحقق من الصلاحيات حسب الدور
- **AuthMiddleware.optionalAuthenticate** - مصادقة اختيارية
- **requirePermission** - التحقق من صلاحية محددة
- **branchIsolationMiddleware** - عزل الفروع
- **requireAdminAccess** - يتطلب صلاحية Admin

### Security Features
- **Helmet** - Security Headers
- **CORS** - Cross-Origin Resource Sharing
- **Rate Limiting** - تحديد معدل الطلبات
- **Sanitization** - تنظيف البيانات من XSS
- **Audit Logging** - تسجيل عمليات التدقيق
- **Security Event Logging** - تسجيل الأحداث الأمنية

---

## ملخص

النظام يستخدم:
- **Clean Architecture** مع Domain Events
- **JWT** للمصادقة
- **RBAC** للتفويض
- **BullMQ** للمعالجة غير المتزامنة
- **Socket.IO** للاتصال الحي
- **Multi-tenancy** دعم العملاء المتعددين
- **Multi-branch** دعم الفروع المتعددة
- **Multi-currency** دعم العملات المتعددة (SYP, USD)

---

**تم إنشاء هذا التقرير في:** يونيو 2026  
**بواسطة:** Cascade AI Assistant  
**الإصدار:** 1.0
