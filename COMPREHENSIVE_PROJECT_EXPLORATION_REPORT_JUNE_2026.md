# تقرير استكشاف المشروع الشامل - يونيو 2026
**التاريخ:** 12 يونيو 2026  
**المشروع:** AUTO_Renew (Auto Garage Management System)  
**الموقع:** `C:\Users\FIX 11\projects\AUTO_Renew`

---

## 🎯 ملخص التنفيذ

تم استكشاف المشروع كامل حرف حرف بنجاح. اكتشفت تغيير جذري مهم:

### ⚠️ التغيير الجذري
**Backend الآن يستخدم Node.js/TypeScript وليس Dart!**

الذاكرة القديمة كانت تقول أن Backend يستخدم Dart + Shelf، لكن الاستكشاف الحالي أظهر أن المشروع انتقل إلى:
- **Backend:** Node.js + TypeScript + Prisma ORM
- **Database:** PostgreSQL مع Prisma
- **Architecture:** Clean Architecture (Domain, Application, Infrastructure, API)

---

## 📁 البنية الكاملة للمشروع

### 1. Backend (Node.js + TypeScript + Prisma)
**المسار:** `backend/`

#### Architecture
```
backend/
├── src/
│   ├── api/                    # API Layer
│   │   ├── controllers/        # HTTP Controllers (20 controller folders)
│   │   │   ├── accounting/     # Accounting Controller (1 controller)
│   │   │   ├── ai/             # AI Controller (1 controller)
│   │   │   ├── analytics/      # Analytics Controller (1 controller)
│   │   │   ├── auth/           # Auth Controller (1 controller)
│   │   │   ├── bookings/       # Bookings Controller (1 controller)
│   │   │   ├── branch/         # Branch Controllers (4 controllers)
│   │   │   ├── customers/      # Customer Controller (1 controller)
│   │   │   ├── insights/       # Insights Controller (1 controller)
│   │   │   ├── inventory/      # Inventory Controller (1 controller)
│   │   │   ├── invoices/       # Invoice Controller (1 controller)
│   │   │   ├── loyalty/        # Loyalty Controller (1 controller)
│   │   │   ├── membership/     # Membership Controllers (2 controllers)
│   │   │   ├── notifications/  # Notifications Controller (1 controller)
│   │   │   ├── public/         # Public Controller (1 controller)
│   │   │   ├── rbac/           # RBAC Controllers (2 controllers)
│   │   │   ├── settings/       # Settings Controller (1 controller)
│   │   │   ├── vehicles/       # Vehicle Controller (1 controller)
│   │   │   └── workorders/     # Workorder Controller (1 controller)
│   │   ├── middlewares/        # Express Middlewares (7 middlewares)
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   ├── logging.middleware.ts
│   │   │   ├── rate-limit.middleware.ts
│   │   │   ├── sanitization.middleware.ts
│   │   │   ├── security.middleware.ts
│   │   │   └── validation.middleware.ts
│   │   ├── routes/             # Route Definitions (22 routes)
│   │   │   ├── accounting.routes.ts
│   │   │   ├── ai.routes.ts
│   │   │   ├── analytics.routes.ts
│   │   │   ├── audit.routes.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── bookings.routes.ts
│   │   │   ├── branch.routes.ts
│   │   │   ├── customers.routes.ts
│   │   │   ├── health.routes.ts
│   │   │   ├── index.ts
│   │   │   ├── insights.routes.ts
│   │   │   ├── inventory.routes.ts
│   │   │   ├── invoices.routes.ts
│   │   │   ├── membership.routes.ts
│   │   │   ├── notifications.routes.ts
│   │   │   ├── public.routes.ts
│   │   │   ├── queues.routes.ts
│   │   │   ├── rbac.routes.ts
│   │   │   ├── settings.routes.ts
│   │   │   ├── vehicles.routes.ts
│   │   │   └── workorders.routes.ts
│   │   └── services/          # API Services (4 services)
│   │       ├── cache.service.ts
│   │       ├── jwt.service.ts
│   │       ├── whatsapp-templates.ts
│   │       └── whatsapp.service.ts
│   ├── application/            # Application Layer (CQRS)
│   │   ├── accounting/         # Accounting Use Cases (5 commands, 23 DTOs, 23 handlers, 11 interfaces, 1 query, 27 use-cases)
│   │   │   ├── commands/       # Commands (5 commands)
│   │   │   ├── dto/            # Data Transfer Objects (23 DTOs)
│   │   │   ├── handlers/       # Command Handlers (23 handlers)
│   │   │   ├── interfaces/     # Repository Interfaces (11 interfaces)
│   │   │   ├── queries/        # Queries (1 query)
│   │   │   └── use-cases/      # Use Cases (27 use-cases)
│   │   ├── auth/               # Auth Use Cases (4 commands, 7 DTOs, 5 handlers, 5 interfaces, 1 query, 10 use-cases)
│   │   │   ├── commands/       # Commands (4 commands)
│   │   │   ├── dto/            # Data Transfer Objects (7 DTOs)
│   │   │   ├── handlers/       # Command Handlers (5 handlers)
│   │   │   ├── interfaces/     # Repository Interfaces (5 interfaces)
│   │   │   ├── queries/        # Queries (1 query)
│   │   │   └── use-cases/      # Use Cases (10 use-cases)
│   │   ├── bookings/           # Bookings Use Cases (5 commands, 9 DTOs, 8 handlers, 9 interfaces, 2 queries, 17 use-cases)
│   │   │   ├── commands/       # Commands (5 commands)
│   │   │   ├── dto/            # Data Transfer Objects (9 DTOs)
│   │   │   ├── handlers/       # Command Handlers (8 handlers)
│   │   │   ├── interfaces/     # Repository Interfaces (9 interfaces)
│   │   │   ├── queries/        # Queries (2 queries)
│   │   │   └── use-cases/      # Use Cases (17 use-cases)
│   │   ├── customers/          # Customers Use Cases (2 commands, 4 DTOs, 4 handlers, 3 interfaces, 2 queries, 12 use-cases)
│   │   │   ├── commands/       # Commands (2 commands)
│   │   │   ├── dto/            # Data Transfer Objects (4 DTOs)
│   │   │   ├── handlers/       # Command Handlers (4 handlers)
│   │   │   ├── interfaces/     # Repository Interfaces (3 interfaces)
│   │   │   ├── queries/        # Queries (2 queries)
│   │   │   └── use-cases/      # Use Cases (12 use-cases)
│   │   ├── inventory/          # Inventory Use Cases (15 commands, 13 DTOs, 20 handlers, 10 interfaces, 5 queries, 27 use-cases)
│   │   │   ├── commands/       # Commands (15 commands)
│   │   │   ├── dto/            # Data Transfer Objects (13 DTOs)
│   │   │   ├── handlers/       # Command Handlers (20 handlers)
│   │   │   ├── interfaces/     # Repository Interfaces (10 interfaces)
│   │   │   ├── queries/        # Queries (5 queries)
│   │   │   └── use-cases/      # Use Cases (27 use-cases)
│   │   ├── invoices/           # Invoices Use Cases (4 commands, 8 DTOs, 6 handlers, 7 interfaces, 2 queries, 13 use-cases)
│   │   │   ├── commands/       # Commands (4 commands)
│   │   │   ├── dto/            # Data Transfer Objects (8 DTOs)
│   │   │   ├── handlers/       # Command Handlers (6 handlers)
│   │   │   ├── interfaces/     # Repository Interfaces (7 interfaces)
│   │   │   ├── queries/        # Queries (2 queries)
│   │   │   └── use-cases/      # Use Cases (13 use-cases)
│   │   ├── customer-tracking/  # Customer Tracking Use Cases (1 interface, 1 use-case)
│   │   │   ├── interfaces/     # Repository Interfaces (1 interface)
│   │   │   └── use-cases/      # Use Cases (1 use-case)
│   │   └── vehicles/           # Vehicles Use Cases (2 commands, 4 DTOs, 5 handlers, 6 interfaces, 3 queries, 11 use-cases)
│   │       ├── commands/       # Commands (2 commands)
│   │       ├── dto/            # Data Transfer Objects (4 DTOs)
│   │       ├── handlers/       # Command Handlers (5 handlers)
│   │       ├── interfaces/     # Repository Interfaces (6 interfaces)
│   │       ├── queries/        # Queries (3 queries)
│   │       └── use-cases/      # Use Cases (11 use-cases)
│   ├── domain/                 # Domain Layer
│   │   ├── accounting/         # Accounting Domain (8 entities, 3 events, 3 value-objects)
│   │   │   ├── entities/       # Domain Entities (8 entities)
│   │   │   ├── events/         # Domain Events (3 events)
│   │   │   └── value-objects/  # Value Objects (3 value-objects)
│   │   ├── auth/               # Auth Domain (3 entities, 1 event, 1 value-object)
│   │   │   ├── entities/       # Domain Entities (3 entities)
│   │   │   ├── events/         # Domain Events (1 event)
│   │   │   └── value-objects/  # Value Objects (1 value-object)
│   │   ├── bookings/           # Bookings Domain (5 entities, 2 events, 2 value-objects)
│   │   │   ├── entities/       # Domain Entities (5 entities)
│   │   │   ├── events/         # Domain Events (2 events)
│   │   │   └── value-objects/  # Value Objects (2 value-objects)
│   │   ├── customers/          # Customers Domain (2 entities, 1 event, 2 value-objects)
│   │   │   ├── entities/       # Domain Entities (2 entities)
│   │   │   ├── events/         # Domain Events (1 event)
│   │   │   └── value-objects/  # Value Objects (2 value-objects)
│   │   ├── inventory/          # Inventory Domain (4 entities, 3 events, 3 value-objects + grn + po)
│   │   │   ├── entities/       # Domain Entities (4 entities)
│   │   │   ├── events/         # Domain Events (3 events)
│   │   │   ├── value-objects/  # Value Objects (3 value-objects)
│   │   │   ├── grn/            # GRN Domain (3 entities, 3 events, 2 value-objects)
│   │   │   │   ├── entities/   # GRN Entities (3 entities)
│   │   │   │   ├── events/     # GRN Events (3 events)
│   │   │   │   └── value-objects/ # GRN Value Objects (2 value-objects)
│   │   │   └── po/             # Purchase Order Domain (3 entities, 2 events, 3 value-objects)
│   │   │       ├── entities/   # PO Entities (3 entities)
│   │   │       ├── events/     # PO Events (2 events)
│   │   │       └── value-objects/ # PO Value Objects (3 value-objects)
│   │   ├── invoices/           # Invoices Domain (3 entities, 2 events, 2 value-objects)
│   │   │   ├── entities/       # Domain Entities (3 entities)
│   │   │   ├── events/         # Domain Events (2 events)
│   │   │   └── value-objects/  # Value Objects (2 value-objects)
│   │   ├── mechanics/          # Mechanics Domain (7 entities, 5 events, 2 value-objects)
│   │   │   ├── entities/       # Domain Entities (7 entities)
│   │   │   ├── events/         # Domain Events (5 events)
│   │   │   └── value-objects/  # Value Objects (2 value-objects)
│   │   ├── vehicles/           # Vehicles Domain (3 entities, 1 event, 2 value-objects)
│   │   │   ├── entities/       # Domain Entities (3 entities)
│   │   │   ├── events/         # Domain Events (1 event)
│   │   │   └── value-objects/  # Value Objects (2 value-objects)
│   │   └── customer-tracking/  # Customer Tracking Domain (Empty)
│   ├── infrastructure/         # Infrastructure Layer
│   │   ├── auth/               # Auth Infrastructure (1 repository, 2 services)
│   │   │   ├── repositories/   # Auth Repositories (1 repository)
│   │   │   └── services/       # Auth Services (2 services)
│   │   ├── bookings/           # Bookings Infrastructure (4 repositories)
│   │   │   └── repositories/   # Booking Repositories (4 repositories)
│   │   ├── customers/          # Customers Infrastructure (2 repositories)
│   │   │   └── repositories/   # Customer Repositories (2 repositories)
│   │   ├── database/           # Database (Prisma) (1 service)
│   │   │   └── prisma.service.ts
│   │   ├── errors/             # Error Classes (3 error classes)
│   │   │   ├── business-rule-error.ts
│   │   │   ├── database-error.ts
│   │   │   └── not-found-error.ts
│   │   ├── inventory/          # Inventory Infrastructure (8 repositories)
│   │   │   └── repositories/   # Inventory Repositories (8 repositories)
│   │   ├── invoices/           # Invoices Infrastructure (3 repositories)
│   │   │   └── repositories/   # Invoice Repositories (3 repositories)
│   │   ├── logging/            # Logging Services (2 services)
│   │   │   ├── audit-log.ts
│   │   │   └── logger.ts
│   │   ├── repositories/       # Repository Implementations (6 areas)
│   │   │   ├── accounting/     # Accounting Repositories (6 repositories)
│   │   │   ├── auth/           # Auth Repositories (Empty)
│   │   │   ├── bookings/       # Booking Repositories (3 repositories)
│   │   │   ├── customers/      # Customer Repositories (1 repository)
│   │   │   ├── inventory/      # Inventory Repositories (5 repositories)
│   │   │   ├── invoices/       # Invoice Repositories (1 repository)
│   │   │   └── vehicles/       # Vehicle Repositories (1 repository)
│   │   ├── services/           # Infrastructure Services (2 services)
│   │   │   ├── qr-generator.service.ts
│   │   │   └── tracking-resolver.ts
│   │   ├── vehicles/           # Vehicles Infrastructure (3 repositories)
│   │   │   └── repositories/   # Vehicle Repositories (3 repositories)
│   │   └── customer-tracking/  # Customer Tracking Infrastructure (1 repository)
│   │       └── repositories/   # Tracking Repositories (1 repository)
│   ├── interfaces/             # Interfaces Layer
│   │   └── http/               # HTTP Interface
│   │       ├── controllers/    # HTTP Controllers (18 controllers)
│   │       │   ├── AuthController.ts (4117 bytes)
│   │       │   ├── booking-approval.controller.ts (1750 bytes)
│   │       │   ├── booking-image.controller.ts (1915 bytes)
│   │       │   ├── booking-service.controller.ts (2064 bytes)
│   │       │   ├── booking.controller.ts (8316 bytes)
│   │       │   ├── customer-vehicle.controller.ts (4101 bytes)
│   │       │   ├── customer.controller.ts (6388 bytes)
│   │       │   ├── customerTracking.controller.ts (1325 bytes)
│   │       │   ├── grn.controller.ts (7427 bytes)
│   │       │   ├── invoice-item.controller.ts (2262 bytes)
│   │       │   ├── invoice.controller.ts (9235 bytes)
│   │       │   ├── movement.controller.ts (3260 bytes)
│   │       │   ├── part.controller.ts (7107 bytes)
│   │       │   ├── payment.controller.ts (3224 bytes)
│   │       │   ├── po.controller.ts (9848 bytes)
│   │       │   ├── stock.controller.ts (7534 bytes)
│   │       │   ├── vehicle-brand.controller.ts (1129 bytes)
│   │       │   ├── vehicle-model.controller.ts (1520 bytes)
│   │       │   └── vehicle.controller.ts (8462 bytes)
│   │       ├── middlewares/     # HTTP Middlewares (1 middleware)
│   │       │   └── auth.middleware.ts (1040 bytes)
│   │       └── routes/          # HTTP Routes (20 routes)
│   │           ├── auth.routes.ts (487 bytes)
│   │           ├── booking-approval.routes.ts (369 bytes)
│   │           ├── booking-image.routes.ts (326 bytes)
│   │           ├── booking-service.routes.ts (332 bytes)
│   │           ├── booking.routes.ts (496 bytes)
│   │           ├── customer-vehicle.routes.ts (391 bytes)
│   │           ├── customer.routes.ts (480 bytes)
│   │           ├── customerTracking.routes.ts (308 bytes)
│   │           ├── grn.routes.ts (489 bytes)
│   │           ├── invoice-item.routes.ts (323 bytes)
│   │           ├── invoice.routes.ts (418 bytes)
│   │           ├── movement.routes.ts (308 bytes)
│   │           ├── part.routes.ts (409 bytes)
│   │           ├── payment.routes.ts (318 bytes)
│   │           ├── po.routes.ts (617 bytes)
│   │           ├── stock.routes.ts (490 bytes)
│   │           ├── vehicle-brand.routes.ts (324 bytes)
│   │           ├── vehicle-model.routes.ts (396 bytes)
│   │           └── vehicle.routes.ts (558 bytes)
│   ├── middleware/             # Global Middlewares (3 middlewares)
│   │   ├── audit.middleware.ts (1659 bytes)
│   │   ├── branch-isolation.middleware.ts (4547 bytes)
│   │   └── permission.middleware.ts (5654 bytes)
│   ├── modules/                # Feature Modules (60+ modules)
│   │   ├── accounting/         # Accounting Module (8 services)
│   │   ├── accounts/           # Accounts Module (4 files)
│   │   ├── analytics/          # Analytics Module (1 service)
│   │   ├── attendance/         # Attendance Module (4 files)
│   │   ├── auth/               # Auth Module (1 routes)
│   │   ├── benefits/           # Benefits Module (1 service)
│   │   ├── bookings/           # Bookings Module (4 files)
│   │   ├── branch/             # Branch Module (3 files)
│   │   ├── cheques/            # Cheques Module (4 files)
│   │   ├── currencies/         # Currencies Module (4 files)
│   │   ├── currency/           # Currency Module (1 service)
│   │   ├── customers/          # Customers Module (4 files)
│   │   ├── dashboard/          # Dashboard Module (2 files)
│   │   ├── data/               # Data Module (1 service)
│   │   ├── data-exports/       # Data Exports Module (2 files)
│   │   ├── departments/        # Departments Module (4 files)
│   │   ├── employees/          # Employees Module (4 files)
│   │   ├── expenses/           # Expenses Module (3 files)
│   │   ├── fcm/                # FCM Module (4 files)
│   │   ├── financial/          # Financial Module (7 services)
│   │   ├── fiscal-periods/     # Fiscal Periods Module (4 files)
│   │   ├── grn/                # GRN Module (4 files)
│   │   ├── hr/                 # HR Module (Empty)
│   │   ├── installments/       # Installments Module (4 files)
│   │   ├── inventory/          # Inventory Module (Empty)
│   │   ├── inventory-count/    # Inventory Count Module (4 files)
│   │   ├── inventory-transactions/ # Inventory Transactions Module (4 files)
│   │   ├── inventory-transfer/ # Inventory Transfer Module (1 service)
│   │   ├── invoices/           # Invoices Module (4 files)
│   │   ├── journal/            # Journal Module (Empty)
│   │   ├── journal-entries/    # Journal Entries Module (4 files)
│   │   ├── loyalty/            # Loyalty Module (4 files)
│   │   ├── maintenance/        # Maintenance Module (7 files)
│   │   ├── mechanicAssignments/ # Mechanic Assignments Module (4 files)
│   │   ├── membership/         # Membership Module (2 files)
│   │   ├── notification-rules/ # Notification Rules Module (2 files)
│   │   ├── notifications/      # Notifications Module (7 files)
│   │   ├── part-categories/    # Part Categories Module (4 files)
│   │   ├── parts/              # Parts Module (4 files)
│   │   ├── payments/           # Payments Module (5 files)
│   │   ├── payroll/            # Payroll Module (4 files)
│   │   ├── public/             # Public Module (4 files)
│   │   ├── purchase-orders/    # Purchase Orders Module (4 files)
│   │   ├── reporting/          # Reporting Module (9 services)
│   │   ├── reports/            # Reports Module (5 files)
│   │   ├── reports-advanced/   # Reports Advanced Module (4 files)
│   │   ├── reports-new/        # Reports New Module (2 files)
│   │   ├── schedule/           # Schedule Module (3 files)
│   │   ├── services/           # Services Module (6 files)
│   │   ├── shifts/             # Shifts Module (4 files)
│   │   ├── suppliers/          # Suppliers Module (4 files)
│   │   ├── tenants/            # Tenants Module (Empty)
│   │   ├── users/              # Users Module (4 files)
│   │   ├── vehicles/           # Vehicles Module (11 files)
│   │   ├── wallet/             # Wallet Module (Empty)
│   │   ├── warehouse/          # Warehouse Module (Empty)
│   │   ├── warehouses/         # Warehouses Module (4 files)
│   │   └── whatsapp/           # WhatsApp Module (Empty)
│   ├── config/                 # Configuration (3 config files)
│   │   ├── database.ts
│   │   ├── env-validation.ts
│   │   └── redis.ts
│   ├── queues/                 # Job Queues (2 files)
│   │   ├── queue.config.ts
│   │   └── queue.service.ts
│   ├── services/               # Shared Services (4 services)
│   │   ├── ai.service.ts       # AI Service (17067 bytes)
│   │   ├── analytics.service.ts # Analytics Service (14722 bytes)
│   │   ├── audit.service.ts    # Audit Service (3352 bytes)
│   │   └── settings.service.ts # Settings Service (7063 bytes)
│   ├── shared/                 # Shared Utilities
│   │   ├── middlewares/        # Shared Middlewares (2 middlewares)
│   │   │   ├── auth.ts         # Auth Middleware (1162 bytes)
│   │   │   └── tenant.ts       # Tenant Middleware (577 bytes)
│   │   └── utils/              # Shared Utils (6 utils)
│   │       ├── auth.ts         # Auth Utils (1311 bytes)
│   │       ├── cache.ts        # Cache Utils (4908 bytes)
│   │       ├── circuit-breaker.ts # Circuit Breaker (3669 bytes)
│   │       ├── file-upload.ts  # File Upload Utils (4177 bytes)
│   │       ├── graceful-shutdown.ts # Graceful Shutdown (3322 bytes)
│   │       └── retry.ts        # Retry Utils (3746 bytes)
│   ├── workers/                # Background Workers (5 workers)
│   │   ├── accounting.worker.ts # Accounting Worker (4041 bytes)
│   │   ├── inventory.worker.ts # Inventory Worker (4021 bytes)
│   │   ├── notifications.worker.ts # Notifications Worker (2868 bytes)
│   │   ├── pdf.worker.ts       # PDF Worker (3805 bytes)
│   │   └── reports.worker.ts   # Reports Worker (4654 bytes)
│   └── server.ts               # Entry Point
├── prisma/
│   ├── schema.prisma           # Database Schema
│   ├── schema.prisma.backup     # Backup Schema
│   ├── schema_updated.prisma   # Updated Schema
│   ├── seed.ts                 # Database Seeding
│   ├── views.sql               # SQL Views
│   └── migrations/             # Database Migrations (24 migrations)
├── public/
│   └── track/                  # Customer Tracking Frontend (HTML/JS/CSS)
│       ├── app.js             # JavaScript Logic (13107 bytes)
│       ├── index.html         # HTML Page (8610 bytes)
│       └── style.css          # Styles (9119 bytes)
├── tests/                      # Test Files
│   ├── accounting/              # Accounting Tests
│   ├── integration/            # Integration Tests
│   ├── reports/                # Reports Tests
│   ├── services/               # Services Tests
│   └── setup.ts                # Test Setup
├── package.json                # Node.js Dependencies
├── tsconfig.json               # TypeScript Config
├── jest.config.js              # Jest Testing Config
├── Dockerfile                  # Docker Configuration
└── .env                        # Environment Variables
```

#### Modules (60+ Feature Modules)
1. **accounting** - المحاسبة (automatic journal entries, budget, cost allocation, tax calculation)
2. **accounts** - الحسابات (chart of accounts)
3. **analytics** - التحليلات (dashboard analytics)
4. **attendance** - الحضور والانصراف
5. **auth** - المصادقة
6. **benefits** - المزايا
7. **bookings** - الحجوزات
8. **branch** - الفروع
9. **cheques** - الشيكات
10. **currencies** - العملات (currency conversion)
11. **currency** - العملات
12. **customers** - العملاء
13. **dashboard** - لوحة التحكم
14. **data** - البيانات (data export)
15. **data-exports** - تصدير البيانات
16. **departments** - الأقسام
17. **employees** - الموظفين
18. **expenses** - المصروفات
19. **fcm** - Firebase Cloud Messaging
20. **financial** - المالية (balance sheet, cash flow, income statement, trial balance)
21. **fiscal-periods** - الفترات المالية
22. **grn** - Goods Received Notes
23. **hr** - الموارد البشرية
24. **installments** - الأقساط
25. **inventory** - المخزون
26. **inventory-count** - جرد المخزون
27. **inventory-transactions** - حركات المخزون
28. **inventory-transfer** - نقل المخزون
29. **invoices** - الفواتير
30. **journal** - اليومية
31. **journal-entries** - القيود اليومية
32. **loyalty** - الولاء
33. **maintenance** - الصيانة
34. **mechanicAssignments** - تعيين الميكانيكيين
35. **membership** - العضوية
36. **notification-rules** - قواعد الإشعارات
37. **notifications** - الإشعارات
38. **part-categories** - فئات القطع
39. **parts** - القطع
40. **payments** - المدفوعات
41. **payroll** - الرواتب
42. **public** - الواجهة العامة
43. **purchase-orders** - أوامر الشراء
44. **reporting** - التقارير المتقدمة
45. **reports** - التقارير الأساسية
46. **reports-advanced** - التقارير المتقدمة
47. **reports-new** - التقارير الجديدة
48. **schedule** - الجدولة
49. **services** - الخدمات
50. **shifts** - الورديات
51. **suppliers** - الموردين
52. **tenants** - المستأجرين
53. **users** - المستخدمين
54. **vehicles** - المركبات
55. **wallet** - المحفظة
56. **warehouse** - المستودعات
57. **warehouses** - المستودعات
58. **whatsapp** - واتساب

---

### 2. Admin Frontend (Flutter Web)
**المسار:** `admin_frontend/`

#### Architecture
```
admin_frontend/
├── lib/
│   ├── main.dart               # Entry Point
│   ├── config/                 # Configuration
│   ├── core/                   # Core Components
│   │   ├── theme/              # Themes (app, fantasy, luxury, modern)
│   │   ├── animations/         # Animations
│   │   ├── performance/        # Performance Utils
│   │   ├── router.dart         # App Router
│   │   ├── notification_manager.dart
│   │   └── insights_manager.dart
│   ├── models/                 # Data Models
│   │   ├── advanced_reports.dart
│   │   ├── booking.dart
│   │   ├── customer.dart
│   │   ├── data_export.dart
│   │   ├── expense.dart
│   │   ├── insights_models.dart
│   │   ├── inventory_count.dart
│   │   ├── inventory_transaction.dart
│   │   ├── maintenance_log.dart
│   │   ├── maintenance_template.dart
│   │   ├── notification_rule.dart
│   │   ├── paginated_response.dart
│   │   ├── purchase_order.dart
│   │   ├── report.dart
│   │   ├── service.dart
│   │   ├── service_part.dart
│   │   ├── supplier.dart
│   │   ├── user.dart
│   │   └── vehicle.dart
│   ├── modules/                # Feature Modules
│   │   ├── accounting/         # Accounting Module (20 screens, 14 models, 12 services)
│   │   │   ├── helpers/        # Export Helper
│   │   │   ├── models/         # Accounting Models (14 models)
│   │   │   ├── screens/        # Accounting Screens (20 screens)
│   │   │   └── services/       # Accounting Services (12 services)
│   │   ├── auth/               # Auth Module (1 screen, 2 models, 2 services, 2 widgets)
│   │   │   ├── managers/       # Permission Manager
│   │   │   ├── models/         # Auth Models (2 models)
│   │   │   ├── screens/        # Auth Screens (1 screen)
│   │   │   ├── services/       # Auth Services (2 services)
│   │   │   └── widgets/        # Auth Widgets (2 widgets)
│   │   ├── dashboard/          # Dashboard Module (1 screen, 1 model, 1 service)
│   │   │   ├── models/         # Dashboard Models (1 model)
│   │   │   ├── screens/        # Dashboard Screens (1 screen)
│   │   │   └── services/       # Dashboard Services (1 service)
│   │   ├── hr/                 # HR Module (10 screens, 5 models, 5 services)
│   │   │   ├── models/         # HR Models (5 models)
│   │   │   ├── screens/        # HR Screens (10 screens)
│   │   │   └── services/       # HR Services (5 services)
│   │   ├── insights/           # Insights Module (1 screen)
│   │   ├── notifications/      # Notifications Module (1 screen)
│   │   ├── part-categories/    # Part Categories Module (3 screens, 1 model, 1 service)
│   │   │   ├── models/         # Part Category Models (1 model)
│   │   │   ├── screens/        # Part Category Screens (3 screens)
│   │   │   └── services/       # Part Category Services (1 service)
│   │   ├── parts/              # Parts Module (3 screens, 2 models, 2 services)
│   │   │   ├── models/         # Parts Models (2 models)
│   │   │   ├── screens/        # Parts Screens (3 screens)
│   │   │   └── services/       # Parts Services (2 services)
│   │   ├── purchase-orders/    # Purchase Orders Module (3 screens, 1 model, 1 service)
│   │   │   ├── models/         # Purchase Order Models (1 model)
│   │   │   ├── screens/        # Purchase Order Screens (3 screens)
│   │   │   └── services/       # Purchase Order Services (1 service)
│   │   ├── suppliers/          # Suppliers Module (3 screens, 1 model, 1 service)
│   │   │   ├── models/         # Supplier Models (1 model)
│   │   │   ├── screens/        # Supplier Screens (3 screens)
│   │   │   └── services/       # Supplier Services (1 service)
│   │   ├── system/             # System Module (1 screen, 1 model, 1 service)
│   │   │   ├── models/         # System Models (1 model)
│   │   │   ├── screens/        # System Screens (1 screen)
│   │   │   └── services/       # System Services (1 service)
│   │   └── warehouses/         # Warehouses Module (3 screens, 1 model, 1 service)
│   │       ├── models/         # Warehouse Models (1 model)
│   │       ├── screens/        # Warehouse Screens (3 screens)
│   │       └── services/       # Warehouse Services (1 service)
│   ├── providers/              # State Management (Riverpod)
│   │   ├── auth_provider.dart
│   │   ├── bookings_provider.dart
│   │   ├── branches_provider.dart
│   │   ├── cheques_provider.dart
│   │   ├── currencies_provider.dart
│   │   ├── customers_provider.dart
│   │   ├── dashboard_provider.dart
│   │   ├── employees_provider.dart
│   │   ├── fiscal_periods_provider.dart
│   │   ├── insights_provider.dart
│   │   ├── installments_provider.dart
│   │   ├── inventory_transactions_provider.dart
│   │   ├── invoices_provider.dart
│   │   ├── notification_provider.dart
│   │   ├── permissions_provider.dart
│   │   ├── purchase_orders_provider.dart
│   │   ├── schedule_provider.dart
│   │   ├── services_provider.dart
│   │   ├── settings_provider.dart
│   │   ├── suppliers_provider.dart
│   │   ├── theme_provider.dart
│   │   ├── users_roles_provider.dart
│   │   └── vehicles_provider.dart
│   ├── screens/                # UI Screens (100+ screens)
│   │   ├── add_stock_movement_screen.dart
│   │   ├── advanced_reports_dashboard.dart
│   │   ├── ai_assistant_screen.dart
│   │   ├── analytics_dashboard_screen.dart
│   │   ├── audit_log_screen.dart
│   │   ├── booking_create_screen.dart
│   │   ├── booking_details_screen.dart
│   │   ├── booking_edit_screen.dart
│   │   ├── booking_management_screen.dart
│   │   ├── booking_new_customer_screen.dart
│   │   ├── booking_print_screen.dart
│   │   ├── bookings_screen.dart
│   │   ├── bookings_screen_new.dart
│   │   ├── branches_screen.dart
│   │   ├── budget_dashboard_screen.dart
│   │   ├── consolidated_reports_screen.dart
│   │   ├── cost_center_screen.dart
│   │   ├── create_booking_screen.dart
│   │   ├── customer_create_screen.dart
│   │   ├── customer_details_screen.dart
│   │   ├── customer_edit_screen.dart
│   │   ├── customer_management_screen.dart
│   │   ├── customer_membership_screen.dart
│   │   ├── customer_profit_report_screen.dart
│   │   ├── customer_wallet_screen.dart
│   │   ├── customers_screen.dart
│   │   ├── customers_screen_new.dart
│   │   ├── dashboard_screen.dart
│   │   ├── dashboard_screen_new.dart
│   │   ├── data_export_screen.dart
│   │   ├── expense_management_screen.dart
│   │   ├── financial_dashboard_screen.dart
│   │   ├── hr_attendance_screen.dart
│   │   ├── hr_departments_screen.dart
│   │   ├── hr_employees_screen.dart
│   │   ├── hr_payroll_screen.dart
│   │   ├── inventory_count_screen.dart
│   │   ├── inventory_report_screen.dart
│   │   ├── inventory_stock_movements_screen.dart
│   │   ├── inventory_transfer_screen.dart
│   │   ├── invoice_create_screen.dart
│   │   ├── invoice_details_screen.dart
│   │   ├── invoice_edit_screen.dart
│   │   ├── invoice_management_screen.dart
│   │   ├── invoice_profit_screen.dart
│   │   ├── invoices_screen_new.dart
│   │   ├── kpi_dashboard_screen.dart
│   │   ├── login_screen.dart
│   │   ├── loyalty_points_screen.dart
│   │   ├── loyalty_screen.dart
│   │   ├── maintenance_logs_screen.dart
│   │   ├── maintenance_templates_screen.dart
│   │   ├── mechanics_screen.dart
│   │   ├── membership_plans_screen.dart
│   │   ├── notification_rules_screen.dart
│   │   ├── notifications_log_screen.dart
│   │   ├── notifications_screen.dart
│   │   ├── part_categories_screen.dart
│   │   ├── parts_consumption_report_screen.dart
│   │   ├── profitability_report_screen.dart
│   │   ├── purchase_order_create_screen.dart
│   │   ├── purchase_order_details_screen.dart
│   │   ├── purchase_orders_list_screen.dart
│   │   ├── report_builder_screen.dart
│   │   ├── role_management_screen.dart
│   │   ├── schedule_details_screen.dart
│   │   ├── service_categories_screen.dart
│   │   ├── service_cost_report_screen.dart
│   │   ├── service_create_screen.dart
│   │   ├── service_edit_screen.dart
│   │   ├── service_packages_screen.dart
│   │   ├── service_profit_report_screen.dart
│   │   ├── services_screen.dart
│   │   ├── settings_screen.dart
│   │   ├── stock_movements_report_screen.dart
│   │   ├── supplier_details_screen.dart
│   │   ├── supplier_form_screen.dart
│   │   ├── suppliers_list_screen.dart
│   │   ├── system_settings_screen.dart
│   │   ├── tax_management_screen.dart
│   │   ├── technician_profit_report_screen.dart
│   │   ├── technician_schedule_screen.dart
│   │   ├── vehicle_attachments_screen.dart
│   │   ├── vehicle_categories_screen.dart
│   │   ├── vehicle_create_screen.dart
│   │   ├── vehicle_details_screen.dart
│   │   ├── vehicle_edit_screen.dart
│   │   ├── vehicle_faults_screen.dart
│   │   ├── vehicle_history_screen.dart
│   │   ├── vehicle_management_screen.dart
│   │   ├── vehicle_recommendations_screen.dart
│   │   ├── vehicles_screen.dart
│   │   ├── warehouses_screen.dart
│   │   └── workshop_screen.dart
│   ├── services/               # API Services
│   │   ├── advanced_reports_service.dart
│   │   ├── api_service.dart
│   │   ├── auth_service.dart
│   │   ├── base_service.dart
│   │   ├── booking_service.dart
│   │   ├── branches_service.dart
│   │   ├── cheques_service.dart
│   │   ├── currency_service.dart
│   │   ├── customer_service.dart
│   │   ├── data_export_service.dart
│   │   ├── expense_management_service.dart
│   │   ├── fiscal_periods_service.dart
│   │   ├── in_app_notification_service.dart
│   │   ├── insights_service.dart
│   │   ├── installment_service.dart
│   │   ├── inventory_count_service.dart
│   │   ├── inventory_transaction_service.dart
│   │   ├── maintenance_service.dart
│   │   ├── notification_rules_service.dart
│   │   ├── parts_service.dart
│   │   ├── reports_service.dart
│   │   ├── service_service.dart
│   │   ├── socket_service.dart
│   │   ├── users_roles_service.dart
│   │   ├── vehicle_service.dart
│   │   └── warehouse_service.dart
│   ├── utils/                  # Utilities (2 files)
│   │   ├── performance_utils.dart (6967 bytes)
│   │   └── permission_map.dart (6365 bytes)
│   └── widgets/                # Reusable Widgets (12 files)
│       ├── app_scaffold.dart (26091 bytes)
│       ├── branch_dropdown.dart (3597 bytes)
│       ├── chart_widgets.dart (8623 bytes)
│       ├── elegant_widgets.dart (28231 bytes)
│       ├── empty_state_widgets.dart (15133 bytes)
│       ├── feedback_widgets.dart (13677 bytes)
│       ├── kpi_widget.dart (3440 bytes)
│       ├── loading_overlay.dart (3611 bytes)
│       ├── page_transitions.dart (6249 bytes)
│       ├── period_selector.dart (8683 bytes)
│       ├── search_widgets.dart (15315 bytes)
│       └── stat_card.dart (2397 bytes)
├── assets/                     # Assets (4 folders)
│   ├── fonts/                  # Fonts (2 files)
│   │   ├── .gitkeep (0 bytes)
│   │   └── README.md (489 bytes)
│   ├── icons/                  # Icons (1 file)
│   │   └── .gitkeep (0 bytes)
│   ├── images/                 # Images (1 file)
│   │   └── .gitkeep (0 bytes)
│   └── lottie/                 # Lottie Animations (1 file)
│       └── loading.json (1480 bytes)
├── web/                        # Web Build Output (5 files + 1 folder)
│   ├── favicon.png (917 bytes)
│   ├── icons/                  # Icons (4 files)
│   │   ├── Icon-192.png (5292 bytes)
│   │   ├── Icon-512.png (8252 bytes)
│   │   ├── Icon-maskable-192.png (5594 bytes)
│   │   └── Icon-maskable-512.png (20998 bytes)
│   ├── index.html (1581 bytes)
│   └── manifest.json (961 bytes)
├── build/                      # Build Output (3 cache folders + flutter_assets + web)
│   ├── 03793ed695a6f9888d82fc94f581ce12/ (3 stamp files)
│   │   ├── _composite.stamp (26 bytes)
│   │   ├── gen_dart_plugin_registrant.stamp (26 bytes)
│   │   └── gen_localizations.stamp (26 bytes)
│   ├── 1b44705312364546d5a42d1733c9ae0a/ (3 stamp files)
│   │   ├── _composite.stamp (26 bytes)
│   │   ├── gen_dart_plugin_registrant.stamp (26 bytes)
│   │   └── gen_localizations.stamp (26 bytes)
│   ├── e526d636a6238c5a01b25d33d78dd941.cache.dill.track.dill (73070784 bytes)
│   ├── flutter_assets/         # Flutter Assets (6 files + 4 folders)
│   │   ├── AssetManifest.bin (300 bytes)
│   │   ├── AssetManifest.bin.json (402 bytes)
│   │   ├── FontManifest.json (208 bytes)
│   │   ├── NOTICES (1446154 bytes)
│   │   ├── assets/              # Assets (3 folders)
│   │   │   ├── icons/          # Icons (1 file)
│   │   │   │   └── .gitkeep (0 bytes)
│   │   │   ├── images/         # Images (1 file)
│   │   │   │   └── .gitkeep (0 bytes)
│   │   │   └── lottie/         # Lottie (1 file)
│   │   │       └── loading.json (1480 bytes)
│   │   ├── fonts/              # Fonts (1 file)
│   │   │   └── MaterialIcons-Regular.otf (1645184 bytes)
│   │   ├── packages/           # Packages (1 folder)
│   │   │   └── cupertino_icons/ # Cupertino Icons (1 folder)
│   │   │       └── assets/     # Assets (1 file)
│   │   │           └── CupertinoIcons.ttf (257628 bytes)
│   │   └── shaders/            # Shaders (2 files)
│   │       ├── ink_sparkle.frag (8890 bytes)
│   │       └── stretch_effect.frag (6737 bytes)
│   └── web/                    # Web Build (10 files + 3 folders)
│       ├── .last_build_id (32 bytes)
│       ├── assets/              # Assets (6 files + 4 folders)
│       │   ├── AssetManifest.bin (300 bytes)
│       │   ├── AssetManifest.bin.json (402 bytes)
│       │   ├── FontManifest.json (208 bytes)
│       │   ├── NOTICES (1446154 bytes)
│       │   ├── assets/          # Assets (3 folders)
│       │   │   ├── icons/      # Icons (1 file)
│       │   │   │   └── .gitkeep (0 bytes)
│       │   │   ├── images/     # Images (1 file)
│       │   │   │   └── .gitkeep (0 bytes)
│       │   │   └── lottie/     # Lottie (1 file)
│       │   │       └── loading.json (1480 bytes)
│       │   ├── fonts/          # Fonts (1 file)
│       │   │   └── MaterialIcons-Regular.otf (21452 bytes)
│       │   ├── packages/       # Packages (1 folder)
│       │   │   └── cupertino_icons/ # Cupertino Icons (1 folder)
│       │   │       └── assets/ # Assets (1 file)
│       │   │           └── CupertinoIcons.ttf (1472 bytes)
│       │   └── shaders/       # Shaders (2 files)
│       │       ├── ink_sparkle.frag (8890 bytes)
│       │       └── stretch_effect.frag (6737 bytes)
│       ├── canvaskit/          # CanvasKit (11 files + 2 folders)
│       │   ├── canvaskit.js (86859 bytes)
│       │   ├── canvaskit.js.symbols (1357066 bytes)
│       │   ├── canvaskit.wasm (7229467 bytes)
│       │   ├── chromium/       # Chromium (3 files)
│       │   │   ├── canvaskit.js (86496 bytes)
│       │   │   ├── canvaskit.js.symbols (1274971 bytes)
│       │   │   └── canvaskit.wasm (5760502 bytes)
│       │   ├── experimental_webparagraph/ # Experimental (3 files)
│       │   │   ├── canvaskit.js (76497 bytes)
│       │   │   ├── canvaskit.js.symbols (1004464 bytes)
│       │   │   └── canvaskit.wasm (4138344 bytes)
│       │   ├── skwasm.js (63316 bytes)
│       │   ├── skwasm.js.symbols (1541208 bytes)
│       │   ├── skwasm.wasm (3580947 bytes)
│       │   ├── skwasm_heavy.js (63429 bytes)
│       │   ├── skwasm_heavy.js.symbols (1666301 bytes)
│       │   ├── skwasm_heavy.wasm (5172643 bytes)
│       │   ├── wimp.js (58396 bytes)
│       │   ├── wimp.js.symbols (1800831 bytes)
│       │   └── wimp.wasm (3513876 bytes)
│       ├── favicon.png (917 bytes)
│       ├── flutter.js (9553 bytes)
│       ├── flutter_bootstrap.js (9975 bytes)
│       ├── flutter_service_worker.js (815 bytes)
│       ├── icons/              # Icons (4 files)
│       │   ├── Icon-192.png (5292 bytes)
│       │   ├── Icon-512.png (8252 bytes)
│       │   ├── Icon-maskable-192.png (5594 bytes)
│       │   └── Icon-maskable-512.png (20998 bytes)
│       ├── index.html (1564 bytes)
│       ├── main.dart.js (4397056 bytes)
│       ├── manifest.json (961 bytes)
│       └── version.json (100 bytes)
├── pubspec.yaml                # Flutter Dependencies
└── analysis_options.yaml       # Dart Analysis Config
```

---

### 3. Mechanic App (Flutter Mobile)
**المسار:** `mechanic_app/`

#### Architecture
```
mechanic_app/
├── lib/
│   ├── main.dart               # Entry Point
│   ├── firebase_options.dart   # Firebase Config
│   ├── core/                   # Core Components (1 folder)
│   │   └── theme/              # Themes (2 files)
│   │       ├── app_theme.dart (13919 bytes)
│   │       └── luxury_theme.dart (18585 bytes)
│   ├── models/                 # Data Models (1 file)
│   │   └── booking.dart (4034 bytes)
│   ├── modules/                # Feature Modules (Empty)
│   ├── providers/              # State Management (1 file)
│   │   └── auth_provider.dart (3235 bytes)
│   ├── screens/                # UI Screens (3 files)
│   │   ├── bookings_list_screen.dart (9199 bytes)
│   │   ├── home_screen.dart (17729 bytes)
│   │   └── login_screen.dart (18191 bytes)
│   ├── services/               # API Services (4 files)
│   │   ├── api_service.dart (2510 bytes)
│   │   ├── auth_service.dart (2074 bytes)
│   │   ├── booking_service.dart (1117 bytes)
│   │   └── socket_service.dart (8240 bytes)
│   ├── utils/                  # Utilities (Empty)
│   └── widgets/                # Reusable Widgets (1 file)
│       └── loading_overlay.dart (2130 bytes)
├── assets/                     # Assets (1 folder)
│   └── lottie/                 # Lottie Animations (1 file)
│       └── loading.json (1480 bytes)
├── pubspec.yaml                # Flutter Dependencies
└── .flutter-plugins-dependencies
```

---

### 4. Customer Frontend (Static HTML/JS)
**المسار:** `customer_frontend/`

#### Architecture
```
customer_frontend/
├── index.html                  # Main HTML Page (10260 bytes)
├── css/                       # Styles (1 file)
│   └── style.css              # Styles (9116 bytes)
├── js/                        # JavaScript Logic (1 file)
│   └── app.js                 # JavaScript Logic (15112 bytes)
├── assets/                     # Assets (Empty)
└── lib/                       # Additional Files (1 file + 2 folders)
    ├── README.md              # Documentation (2295 bytes)
    ├── css/                   # CSS Libraries (2 files)
    │   ├── aos.css            # Animate On Scroll CSS (26053 bytes)
    │   └── fontawesome.css    # Font Awesome CSS (102025 bytes)
    └── js/                    # JS Libraries (6 files)
        ├── ScrollTrigger.min.js  # GSAP ScrollTrigger (43380 bytes)
        ├── aos.js               # Animate On Scroll JS (14239 bytes)
        ├── gsap.min.js          # GSAP Animation Library (72214 bytes)
        ├── lottie.min.js        # Lottie Animation Library (305543 bytes)
        ├── socket.io.min.js     # Socket.io Client (49732 bytes)
        └── three.min.js         # Three.js 3D Library (603445 bytes)
```

---

### 5. Technician App (Flutter Mobile - Additional)
**المسار:** `apps/technician_app/`

#### Architecture
```
apps/technician_app/
├── lib/
│   ├── main.dart               # Entry Point (3447 bytes)
│   ├── models/                 # Data Models (7 files)
│   │   ├── booking.dart (1644 bytes)
│   │   ├── customer.dart (512 bytes)
│   │   ├── notification_item.dart (911 bytes)
│   │   ├── offline_task.dart (399 bytes)
│   │   ├── offline_task.g.dart (1307 bytes)
│   │   ├── technician.dart (193 bytes)
│   │   └── vehicle.dart (760 bytes)
│   ├── notifications/          # Notifications (2 files)
│   │   ├── notifications_provider.dart (2382 bytes)
│   │   └── notifications_screen.dart (5297 bytes)
│   ├── offline/                # Offline Support (4 files)
│   │   ├── cache_manager.dart (895 bytes)
│   │   ├── local_db.dart (2022 bytes)
│   │   ├── queue_manager.dart (1556 bytes)
│   │   └── sync_service.dart (1834 bytes)
│   ├── providers/              # State Management (2 files)
│   │   ├── auth_provider.dart (1480 bytes)
│   │   └── tasks_provider.dart (2264 bytes)
│   ├── screens/                # UI Screens (6 files)
│   │   ├── add_fault_screen.dart (3968 bytes)
│   │   ├── login_screen.dart (3330 bytes)
│   │   ├── task_details_screen.dart (7996 bytes)
│   │   ├── tasks_screen.dart (5770 bytes)
│   │   ├── update_status_screen.dart (3935 bytes)
│   │   └── upload_photos_screen.dart (7006 bytes)
│   ├── services/               # API Services (2 files)
│   │   ├── api_service.dart (2173 bytes)
│   │   └── technician_service.dart (4890 bytes)
│   └── widgets/                # Reusable Widgets (7 files)
│       ├── faults_section.dart (764 bytes)
│       ├── offline_indicator.dart (1676 bytes)
│       ├── parts_section.dart (784 bytes)
│       ├── photo_uploader.dart (5385 bytes)
│       ├── photos_section.dart (756 bytes)
│       ├── status_badge.dart (1276 bytes)
│       └── task_card.dart (1949 bytes)
├── android/                    # Android Configuration (3 files + folders)
│   ├── app/                    # App Configuration (2 files + src folder)
│   │   ├── build.gradle (2362 bytes)
│   │   ├── proguard-rules.pro (768 bytes)
│   │   └── src/                # Source Code (main folder)
│   │       └── main/          # Main Source (AndroidManifest.xml + java + kotlin)
│   │           ├── AndroidManifest.xml (1463 bytes)
│   │           ├── java/        # Java Source (1 folder)
│   │           │   └── io/     # io.flutter.plugins
│   │           │       └── flutter/
│   │           │           └── plugins/
│   │           │               └── GeneratedPluginRegistrant.java (1538 bytes)
│   │           └── kotlin/      # Kotlin Source (1 folder)
│   │               └── com/     # com.garagego.technician
│   │                   └── garagego/
│   │                       └── technician/
│   │                           └── MainActivity.kt (128 bytes)
│   ├── key.properties          # Key Properties (76 bytes)
│   └── local.properties         # Local Properties (48 bytes)
├── assets/                     # Assets (2 folders)
│   ├── icons/                  # Icons (1 file)
│   │   └── app_icon.png (0 bytes)
│   └── splash/                 # Splash Screen (1 file)
│       └── splash.png (0 bytes)
├── pubspec.yaml                # Flutter Dependencies
└── .flutter-plugins-dependencies
```

---

### 6. المجلدات الإضافية

#### scripts/
```
scripts/
├── check-docker.ps1           # Docker Check Script (5156 bytes)
└── setup-hetzner.sh           # Hetzner Setup Script (4008 bytes)
```

#### docs/
```
docs/
└── FIREBASE_SETUP.md          # Firebase Setup Documentation (5704 bytes)
```

#### subagents/
```
subagents/
├── README.md                  # Subagents Documentation (3942 bytes)
├── __init__.py                # Python Package Init (488 bytes)
├── __pycache__/               # Python Cache (4 files)
│   ├── base_agent.cpython-311.pyc (5356 bytes)
│   ├── phase5_financial.cpython-311.pyc (5917 bytes)
│   ├── phase6_accounting.cpython-311.pyc (5539 bytes)
│   └── phase9_reporting.cpython-311.pyc (5606 bytes)
├── base_agent.py              # Base Agent Class (3051 bytes)
├── orchestrator.py            # Orchestrator (9079 bytes)
├── phase5_financial.py        # Phase 5 Financial Agent (6145 bytes)
├── phase6_accounting.py       # Phase 6 Accounting Agent (5618 bytes)
└── phase9_reporting.py        # Phase 9 Reporting Agent (5701 bytes)
```

#### subagent_results/
```
subagent_results/
├── parallel_execution_20260526_230802.json (12349 bytes)
├── phase_5                    # Phase 5 Results (Empty file)
├── phase_6                    # Phase 6 Results (Empty file)
└── phase_9                    # Phase 9 Results (Empty file)
```

#### skills for ageints/
```
skills for ageints/
├── marketingskills-main/      # Marketing Skills (40+ skill folders + tools)
│   ├── .claude-plugin/         # Claude Plugin (2 files)
│   │   ├── marketplace.json (756 bytes)
│   │   └── plugin.json (411 bytes)
│   ├── .github/               # GitHub (4 folders + 1 file)
│   │   ├── FUNDING.yml (98 bytes)
│   │   ├── ISSUE_TEMPLATE/    # Issue Templates (2 files)
│   │   │   ├── config.yml (374 bytes)
│   │   │   └── skill-request.yml (1920 bytes)
│   │   ├── PULL_REQUEST_TEMPLATE/ # PR Templates (3 files)
│   │   │   ├── documentation.md (267 bytes)
│   │   │   ├── new-skill.md (414 bytes)
│   │   │   └── skill-update.md (381 bytes)
│   │   ├── scripts/           # GitHub Scripts (1 file)
│   │   │   └── sync-skills.js (5144 bytes)
│   │   └── workflows/         # GitHub Workflows (2 files)
│   │       ├── sync-skills.yml (734 bytes)
│   │       └── validate-skill.yml (1784 bytes)
│   ├── .gitignore (273 bytes)
│   ├── AGENTS.md (9507 bytes)
│   ├── CLAUDE.md (9 bytes)
│   ├── CONTRIBUTING.md (2572 bytes)
│   ├── LICENSE (1069 bytes)
│   ├── README.md (18658 bytes)
│   ├── VERSIONS.md (8254 bytes)
│   ├── skills/                # 40+ Marketing Skills (40 folders)
│   │   ├── ab-testing/
│   │   ├── ad-creative/
│   │   ├── ads/
│   │   ├── ai-seo/
│   │   ├── analytics/
│   │   ├── aso/
│   │   ├── churn-prevention/
│   │   ├── co-marketing/
│   │   ├── cold-email/
│   │   ├── community-marketing/
│   │   ├── competitor-profiling/
│   │   ├── competitors/
│   │   ├── content-strategy/
│   │   ├── copy-editing/
│   │   ├── copywriting/
│   │   ├── cro/
│   │   ├── customer-research/
│   │   ├── directory-submissions/
│   │   ├── emails/
│   │   ├── free-tools/
│   │   ├── image/
│   │   ├── launch/
│   │   ├── lead-magnets/
│   │   ├── marketing-ideas/
│   │   ├── marketing-psychology/
│   │   ├── onboarding/
│   │   ├── paywalls/
│   │   ├── popups/
│   │   ├── pricing/
│   │   ├── product-marketing/
│   │   ├── programmatic-seo/
│   │   ├── referrals/
│   │   ├── revops/
│   │   ├── sales-enablement/
│   │   ├── schema/
│   │   ├── seo-audit/
│   │   ├── signup/
│   │   ├── site-architecture/
│   │   ├── sms/
│   │   ├── social/
│   │   └── video/
│   ├── tools/                 # Tools Registry (3 folders)
│   │   ├── clis/              # CLI Tools (79 files)
│   │   │   ├── README.md (8247 bytes)
│   │   │   ├── activecampaign.js (15801 bytes)
│   │   │   ├── adobe-analytics.js (4868 bytes)
│   │   │   ├── ahrefs.js (6292 bytes)
│   │   │   ├── airops.js (4678 bytes)
│   │   │   ├── amplitude.js (5646 bytes)
│   │   │   ├── apollo.js (5007 bytes)
│   │   │   ├── beehiiv.js (9017 bytes)
│   │   │   ├── brevo.js (13764 bytes)
│   │   │   ├── buffer.js (9582 bytes)
│   │   │   ├── calendly.js (9117 bytes)
│   │   │   ├── clay.js (4822 bytes)
│   │   │   ├── clearbit.js (5070 bytes)
│   │   │   ├── close.js (7608 bytes)
│   │   │   ├── coupler.js (5247 bytes)
│   │   │   ├── crossbeam.js (5128 bytes)
│   │   │   ├── customer-io.js (7331 bytes)
│   │   │   ├── dataforseo.js (8723 bytes)
│   │   │   ├── demio.js (4388 bytes)
│   │   │   ├── dub.js (5053 bytes)
│   │   │   ├── exa.js (5655 bytes)
│   │   │   ├── g2.js (5726 bytes)
│   │   │   ├── ga4.js (6472 bytes)
│   │   │   ├── google-ads.js (6174 bytes)
│   │   │   ├── google-search-console.js (5164 bytes)
│   │   │   ├── hotjar.js (5086 bytes)
│   │   │   ├── hunter.js (8139 bytes)
│   │   │   ├── instantly.js (10326 bytes)
│   │   │   ├── intercom.js (14128 bytes)
│   │   │   ├── keywords-everywhere.js (5970 bytes)
│   │   │   ├── kit.js (8217 bytes)
│   │   │   ├── klaviyo.js (12041 bytes)
│   │   │   ├── lemlist.js (7739 bytes)
│   │   │   ├── linkedin-ads.js (6168 bytes)
│   │   │   ├── livestorm.js (9849 bytes)
│   │   │   ├── mailchimp.js (7431 bytes)
│   │   │   ├── mention-me.js (5306 bytes)
│   │   │   ├── meta-ads.js (6076 bytes)
│   │   │   ├── mixpanel.js (8486 bytes)
│   │   │   ├── onesignal.js (8263 bytes)
│   │   │   ├── optimizely.js (7946 bytes)
│   │   │   ├── outreach.js (6354 bytes)
│   │   │   ├── paddle.js (14061 bytes)
│   │   │   ├── partnerstack.js (13988 bytes)
│   │   │   ├── pendo.js (6255 bytes)
│   │   │   ├── plausible.js (9106 bytes)
│   │   │   ├── postmark.js (13406 bytes)
│   │   │   ├── rankparse.js (6682 bytes)
│   │   │   ├── resend.js (13115 bytes)
│   │   │   ├── rewardful.js (5088 bytes)
│   │   │   ├── savvycal.js (7393 bytes)
│   │   │   ├── segment.js (6275 bytes)
│   │   │   ├── semrush.js (6415 bytes)
│   │   │   ├── sendgrid.js (7065 bytes)
│   │   │   ├── similarweb.js (9681 bytes)
│   │   │   ├── snov.js (7805 bytes)
│   │   │   ├── supermetrics.js (4931 bytes)
│   │   │   ├── tiktok-ads.js (6689 bytes)
│   │   │   ├── tolt.js (4680 bytes)
│   │   │   ├── trustpilot.js (10599 bytes)
│   │   │   ├── typeform.js (9420 bytes)
│   │   │   ├── wistia.js (9232 bytes)
│   │   │   ├── zapier.js (4454 bytes)
│   │   │   └── zoominfo.js (7337 bytes)
│   │   ├── composio/          # Composio (2 files)
│   │   │   ├── README.md (2591 bytes)
│   │   │   └── marketing-tools.md (4600 bytes)
│   │   ├── integrations/      # Integrations (94 files)
│   │   │   ├── activecampaign.md (6376 bytes)
│   │   │   ├── adobe-analytics.md (3235 bytes)
│   │   │   ├── ahrefs.md (2990 bytes)
│   │   │   ├── airops.md (3019 bytes)
│   │   │   ├── amplitude.md (2614 bytes)
│   │   │   ├── apollo.md (3503 bytes)
│   │   │   ├── attentive.md (3856 bytes)
│   │   │   ├── audiencetap.md (3653 bytes)
│   │   │   ├── beehiiv.md (3938 bytes)
│   │   │   ├── brevo.md (5643 bytes)
│   │   │   ├── buffer.md (3695 bytes)
│   │   │   ├── calendly.md (4041 bytes)
│   │   │   ├── clay.md (3258 bytes)
│   │   │   ├── clearbit.md (4061 bytes)
│   │   │   ├── close.md (4073 bytes)
│   │   │   ├── cogny.md (6145 bytes)
│   │   │   ├── composio.md (6661 bytes)
│   │   │   ├── contentful.md (4828 bytes)
│   │   │   ├── coupler.md (3551 bytes)
│   │   │   ├── crossbeam.md (3255 bytes)
│   │   │   ├── customer-io.md (3232 bytes)
│   │   │   ├── dataforseo.md (3501 bytes)
│   │   │   ├── demio.md (4059 bytes)
│   │   │   ├── dub-co.md (3127 bytes)
│   │   │   ├── exa.md (4672 bytes)
│   │   │   ├── firehose.md (3796 bytes)
│   │   │   ├── g2.md (4513 bytes)
│   │   │   ├── ga4.md (2878 bytes)
│   │   │   ├── gong.md (4302 bytes)
│   │   │   ├── google-ads.md (3895 bytes)
│   │   │   ├── google-search-console.md (2830 bytes)
│   │   │   ├── heygen.md (2998 bytes)
│   │   │   ├── hotjar.md (3245 bytes)
│   │   │   ├── hubspot.md (3117 bytes)
│   │   │   ├── hunter.md (2077 bytes)
│   │   │   ├── hyperframes.md (4822 bytes)
│   │   │   ├── instantly.md (2912 bytes)
│   │   │   ├── intercom.md (5256 bytes)
│   │   │   ├── introw.md (4846 bytes)
│   │   │   ├── keywords-everywhere.md (3894 bytes)
│   │   │   ├── kit.md (3012 bytes)
│   │   │   ├── klaviyo.md (4858 bytes)
│   │   │   ├── lemlist.md (2805 bytes)
│   │   │   ├── linkedin-ads.md (3206 bytes)
│   │   │   ├── livestorm.md (6811 bytes)
│   │   │   ├── mailchimp.md (2874 bytes)
│   │   │   ├── mention-me.md (3220 bytes)
│   │   │   ├── meta-ads.md (3438 bytes)
│   │   │   ├── mixpanel.md (2590 bytes)
│   │   │   ├── nitrosend.md (3871 bytes)
│   │   │   ├── onesignal.md (5501 bytes)
│   │   │   ├── optimizely.md (3972 bytes)
│   │   │   ├── outreach.md (4580 bytes)
│   │   │   ├── paddle.md (4354 bytes)
│   │   │   ├── partnerstack.md (4670 bytes)
│   │   │   ├── pendo.md (4685 bytes)
│   │   │   ├── plausible.md (4155 bytes)
│   │   │   ├── plivo.md (3643 bytes)
│   │   │   ├── posthog.md (2869 bytes)
│   │   │   ├── postmark.md (5477 bytes)
│   │   │   ├── postscript.md (3265 bytes)
│   │   │   ├── rankparse.md (5451 bytes)
│   │   │   ├── rb2b.md (3785 bytes)
│   │   │   ├── resend.md (3666 bytes)
│   │   │   ├── rewardful.md (3240 bytes)
│   │   │   ├── salesforce.md (3030 bytes)
│   │   │   ├── sanity.md (3690 bytes)
│   │   │   ├── savvycal.md (3442 bytes)
│   │   │   ├── segment.md (3032 bytes)
│   │   │   ├── semrush.md (2743 bytes)
│   │   │   ├── sendgrid.md (2805 bytes)
│   │   │   ├── shopify.md (3122 bytes)
│   │   │   ├── similarweb.md (4284 bytes)
│   │   │   ├── snov.md (2283 bytes)
│   │   │   ├── sparktoro.md (4719 bytes)
│   │   │   ├── strapi.md (4124 bytes)
│   │   │   ├── stripe.md (3186 bytes)
│   │   │   ├── supermetrics.md (3862 bytes)
│   │   │   ├── tiktok-ads.md (3294 bytes)
│   │   │   ├── tolt.md (2858 bytes)
│   │   │   ├── trustpilot.md (4681 bytes)
│   │   │   ├── twilio.md (4604 bytes)
│   │   │   ├── typeform.md (3977 bytes)
│   │   │   ├── webflow.md (3551 bytes)
│   │   │   ├── wistia.md (3841 bytes)
│   │   │   ├── wordpress.md (3173 bytes)
│   │   │   ├── zapier.md (5714 bytes)
│   │   │   └── zoominfo.md (4476 bytes)
│   │   └── REGISTRY.md (28269 bytes)
│   ├── validate-skills-official.sh (1960 bytes)
│   └── validate-skills.sh (5869 bytes)
├── stop-slop-main/            # Stop Slop Skill (4 files + 1 folder)
│   ├── CHANGELOG.md (895 bytes)
│   ├── LICENSE (1070 bytes)
│   ├── README.md (1894 bytes)
│   ├── SKILL.md (2629 bytes)
│   └── references/            # References (3 files)
│       ├── examples.md (1686 bytes)
│       ├── phrases.md (2915 bytes)
│       └── structures.md (5255 bytes)
└── ui-ux-pro-max-skill-main/  # UI/UX Pro Max Skill (10 files + 7 folders)
    ├── .claude/               # Claude Skills (1 folder)
    │   └── skills/            # Skills (7 folders)
    │       ├── banner-design/
    │       ├── brand/
    │       ├── design/
    │       ├── design-system/
    │       ├── slides/
    │       ├── ui-styling/
    │       └── ui-ux-pro-max/
    ├── .claude-plugin/         # Claude Plugin (2 files)
    │   ├── marketplace.json (1031 bytes)
    │   └── plugin.json (1058 bytes)
    ├── .github/               # GitHub (1 folder)
    │   └── workflows/         # GitHub Workflows
    ├── .gitignore (483 bytes)
    ├── CLAUDE.md (4050 bytes)
    ├── LICENSE (1075 bytes)
    ├── README.md (24955 bytes)
    ├── cli/                    # CLI Tools (7 files + 3 folders)
    │   ├── .gitignore (36 bytes)
    │   ├── .npmignore (39 bytes)
    │   ├── README.md (1563 bytes)
    │   ├── assets/              # Assets (3 folders)
    │   │   ├── data/           # Data
    │   │   ├── scripts/        # Scripts
    │   │   └── templates/      # Templates
    │   ├── bun.lock (5611 bytes)
    │   ├── package-lock.json (12803 bytes)
    │   ├── package.json (903 bytes)
    │   └── src/                # Source Code (3 folders)
    │       ├── commands/       # Commands
    │       ├── index.ts (2836 bytes)
    │       ├── types/          # Types
    │       └── utils/          # Utils
    ├── docs/                   # Documentation (1 file)
    │   └── 三个 data-scripts-templates 的区别.md (1750 bytes)
    ├── preview/                # Preview (1 file)
    │   └── xiaomaomi-app.html (16945 bytes)
    ├── screenshots/            # Screenshots (1 file)
    │   └── website.png (1129328 bytes)
    └── skill.json (902 bytes)
```

#### .windsurf/
```
.windsurf/
└── workflows/                # Windsurf Workflows (4 workflows)
    ├── audit-trail.md (0 bytes)
    ├── inventory-transfer.md (0 bytes)
    ├── part-categories.md (0 bytes)
    └── parts.md (0 bytes)
```

#### .devin/
```
.devin/
└── skills/                    # Devin Skills (1 file + 3 folders)
    ├── README.md (5729 bytes)
    ├── design-system/          # Design System Skill (1 file)
    │   └── SKILL.md (18776 bytes)
    ├── ui-ux/                 # UI/UX Skill (1 file)
    │   └── SKILL.md (12477 bytes)
    └── writing/               # Writing Skill (1 file)
        └── SKILL.md (7226 bytes)
```

#### graphify-out/
```
graphify-out/
├── .graphify_detect.json      # Graphify Detection (92798 bytes)
├── .graphify_labels.json      # Graphify Labels (10028 bytes)
├── .graphify_python           # Graphify Python Config (72 bytes)
├── GRAPH_REPORT.md            # Graphify Report (75701 bytes)
├── graph.html                 # Graph Visualization (5491918 bytes)
├── graph.json                 # Graph Data (37801060 bytes)
└── merged-graph.json          # Merged Graph Data (6490862 bytes)
```

#### venv311/
```
venv311/
├── Include/                   # Python Include Files
├── Lib/                       # Python Libraries
├── Scripts/                   # Python Scripts
└── pyvenv.cfg                 # Virtual Environment Config (331 bytes)
```

#### الملفات الإضافية في الجذر
```
Root Files (16 additional files):
├── docker-compose.yml         # Docker Orchestration (3236 bytes)
│   - Services: postgres, redis, minio, backend, nginx, prometheus, grafana
│   - Volumes: postgres_data, redis_data, minio_data, prometheus_data, grafana_data
├── docker-compose.override.yml # Docker Override for Development (188 bytes)
├── nginx.conf                 # Nginx Configuration (1348 bytes)
│   - Proxy for /admin, /customer, /api, /socket.io
├── prometheus.yml             # Prometheus Configuration (345 bytes)
│   - Scrape configs: garage-backend, postgres, redis
├── requirements_ai.txt        # Python AI/ML Dependencies (931 bytes)
│   - pyautogen, langchain, openai, crewai, etc.
├── .gitignore                 # Git Ignore Rules (616 bytes)
├── flutter_log.txt            # Flutter Log (114 bytes)
├── critical_fixes_test_results.json # Test Results (1181 bytes)
│   - 6 tests, 100% success rate
├── full_regression_test_results.json # Full Regression Test Results (13946 bytes)
│   - 52 tests, 100% success rate
├── test_results.json          # Test Results (6000 bytes)
│   - 31 tests, 45.16% success rate
├── full_regression_test.js    # Full Regression Test Script (55316 bytes)
│   - Comprehensive QA testing covering all 21 modules
├── test_critical_fixes.js     # Critical Fixes Test Script (12062 bytes)
├── test_script.js             # Automated Test Script (23174 bytes)
├── test_script_fixed.js       # Fixed Test Script (27391 bytes)
├── run_subagents.py           # Run Subagents Script (1924 bytes)
│   - Run single phase or all phases (5, 6, 9)
├── run_parallel_subagents.py  # Run Parallel Subagents (3485 bytes)
│   - Run phases 5, 6, 9 in parallel
└── nul                        # Empty file (478 bytes)
```

---

## 🔧 التقنيات المستخدمة

### Backend
- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Express.js
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Architecture:** Clean Architecture (Domain, Application, Infrastructure, API)
- **Authentication:** JWT
- **Testing:** Jest
- **Containerization:** Docker

### Admin Frontend
- **Framework:** Flutter (Web)
- **Language:** Dart
- **State Management:** Riverpod
- **UI Components:** Custom Widgets
- **Themes:** Multiple Themes (App, Fantasy, Luxury, Modern)
- **Animations:** Custom Animations
- **Performance:** Performance Optimization Utils

### Mechanic App
- **Framework:** Flutter (Mobile)
- **Language:** Dart
- **State Management:** Riverpod
- **Screens:** 3 screens (login_screen, home_screen, bookings_list_screen)
- **Models:** 1 model (booking.dart)
- **Providers:** 1 provider (auth_provider.dart)
- **Services:** 4 services (api_service, auth_service, booking_service, socket_service)
- **Widgets:** 1 widget (loading_overlay.dart)
- **Core:** theme (empty)
- **Modules:** empty
- **Utils:** empty
- **Backend-as-a-Service:** Firebase
- **Real-time:** Socket.io

### Customer Frontend
- **Framework:** Static HTML/JS
- **Styling:** CSS
- **Logic:** Vanilla JavaScript
- **Files:** index.html, css/style.css, js/app.js
- **Libraries:** CSS (aos.css, fontawesome.css), JS (GSAP, AOS, Lottie, Socket.io, Three.js)
- **Assets:** empty

### Technician App
- **Framework:** Flutter (Mobile)
- **Language:** Dart
- **State Management:** Riverpod
- **Screens:** 6 screens (login_screen, tasks_screen, task_details_screen, add_fault_screen, update_status_screen, upload_photos_screen)
- **Models:** 7 models (booking, customer, notification_item, offline_task, offline_task.g, technician, vehicle)
- **Providers:** 2 providers (auth_provider, tasks_provider)
- **Services:** 2 services (api_service, technician_service)
- **Widgets:** 7 widgets (faults_section, offline_indicator, parts_section, photo_uploader, photos_section, status_badge, task_card)
- **Notifications:** 2 files (notifications_provider, notifications_screen)
- **Offline Support:** 4 files (cache_manager, local_db, queue_manager, sync_service)

---

## 📊 الإحصائيات

### Backend
- **Modules:** 60+ feature modules (52 active modules with files, 8 empty modules)
- **Controllers:** 60+ controllers (18 in interfaces/http + 20 in api/controllers + 52 in modules)
- **Services:** 100+ services (4 shared services + 5 background workers + 2 auth services + 8 accounting services + 1 analytics service + 4 booking services + 4 customer services + 4 invoice services + 11 vehicle services + 4 supplier services + 5 service services + 4 employee services + 5 payment services + 4 purchase-order services + 4 grn services + 4 journal-entry services + 4 account services + 3 branch services + 4 warehouse services + 7 financial services + 9 reporting services + 4 loyalty services + 7 maintenance services + 4 installments services + 4 inventory-count services + 4 inventory-transactions services + 1 inventory-transfer service + 4 notifications services + 4 part-categories services + 4 parts services + 4 payroll services + 4 public services + 5 reports services + 4 reports-advanced services + 3 schedule services + 4 shifts services + 4 users services + 4 attendance services + 4 cheques services + 4 currencies services + 1 currency service + 1 benefits service + 2 dashboard files + 1 data service + 2 data-exports files + 4 departments files + 3 expenses files + 4 fcm files + 4 fiscal-periods files + 4 mechanicAssignments files + 2 membership files + 2 notification-rules files)
- **Routes:** 60+ route files (20 in interfaces/http + 22 in api/routes + 52 in modules)
- **Middlewares:** 7 global middlewares + 2 shared middlewares + 7 API middlewares
- **Domain Entities:** 8 domain areas (35 entities total)
- **Domain Events:** 8 domain areas (22 events total)
- **Domain Value Objects:** 8 domain areas (23 value-objects total)
- **Application Use Cases:** 8 application areas (118 use-cases total)
- **Application Commands:** 8 application areas (37 commands total)
- **Application DTOs:** 8 application areas (68 DTOs total)
- **Application Handlers:** 8 application areas (71 handlers total)
- **Application Interfaces:** 8 application areas (53 interfaces total)
- **Application Queries:** 8 application areas (16 queries total)
- **Infrastructure Repositories:** 7 repository areas (27 repositories total)
- **Infrastructure Errors:** 3 error classes
- **Infrastructure Logging:** 2 services
- **Infrastructure Database:** 1 service
- **Infrastructure Services:** 2 services
- **Config:** 3 config files
- **Queues:** 2 files
- **Shared Utils:** 6 utility modules
- **Background Workers:** 5 workers
- **Database Migrations:** 24 migrations (each with migration.sql)
- **Tests:** 4 test areas (15 test files)
  - accounting: 2 test files
  - integration: 2 test files
  - reports: 2 test files
  - services: 9 test files (including 4 HR test files)

### Admin Frontend
- **Screens:** 87 screens (all in lib/screens)
- **Models:** 20+ data models (20 in lib/models + 26 in modules)
- **Providers:** 25 state providers
- **Services:** 25+ API services (25 in lib/services + 30 in modules)
- **Widgets:** 12+ reusable widgets
- **Modules:** 11 feature modules
- **Themes:** 4 themes (app, fantasy, luxury, modern)
- **Core:** animations (1 file), performance (1 file), router (1 file), theme (4 files), insights_manager (1 file), notification_manager (1 file)
- **Config:** 5 files (api_config, api_response_config, api_routes, env_config, feature_flags)
- **Accounting Module:** 20 screens, 14 models, 12 services, 1 helper
- **Auth Module:** 1 screen, 2 models, 2 services, 2 widgets, 1 manager
- **Dashboard Module:** 1 screen, 1 model, 1 service
- **HR Module:** 10 screens, 5 models, 5 services
- **Part Categories Module:** 3 screens, 1 model, 1 service
- **Parts Module:** 3 screens, 2 models, 2 services
- **Purchase Orders Module:** 3 screens, 1 model, 1 service
- **Suppliers Module:** 3 screens, 1 model, 1 service
- **System Module:** 1 screen, 1 model, 1 service
- **Warehouses Module:** 3 screens, 1 model, 1 service
- **Insights Module:** 1 screen
- **Notifications Module:** 1 screen
- **Assets:** fonts (2 files), icons (1 file), images (1 file), lottie (1 file)
- **Test:** 1 test file
- **Build:** flutter_assets (6 files + subfolders: assets, fonts, packages, shaders), web (10 files + subfolders: assets, canvaskit, icons)
- **Web:** icons (4 files), index.html, manifest.json, favicon.png
- **Build Details:**
  - flutter_assets: AssetManifest.bin, AssetManifest.bin.json, FontManifest.json, NOTICES, assets (icons, images, lottie), fonts (MaterialIcons-Regular.otf), packages (cupertino_icons/assets/CupertinoIcons.ttf), shaders (ink_sparkle.frag, stretch_effect.frag)
  - web: .last_build_id, assets (AssetManifest.bin, AssetManifest.bin.json, FontManifest.json, NOTICES, assets, fonts, packages, shaders), canvaskit (11 files including canvaskit.js, canvaskit.wasm, skwasm.js, skwasm.wasm, wimp.js, wimp.wasm), favicon.png, flutter.js, flutter_bootstrap.js, flutter_service_worker.js, icons (4 files), index.html, main.dart.js, manifest.json, version.json

### Mechanic App
- **Screens:** 3 screens (login_screen, home_screen, bookings_list_screen)
- **Models:** 1 model (booking.dart)
- **Providers:** 1 provider (auth_provider.dart)
- **Services:** 4 services (api_service, auth_service, booking_service, socket_service)
- **Widgets:** 1 widget (loading_overlay.dart)
- **Core:** theme (2 themes: app_theme, luxury_theme)
- **Modules:** empty
- **Utils:** empty
- **Assets:** lottie (1 file: loading.json)
- **Backend-as-a-Service:** Firebase
- **Real-time:** Socket.io

### Technician App
- **Screens:** 6 screens (login_screen, tasks_screen, task_details_screen, add_fault_screen, update_status_screen, upload_photos_screen)
- **Models:** 7 models (booking, customer, notification_item, offline_task, offline_task.g, technician, vehicle)
- **Providers:** 2 providers (auth_provider, tasks_provider)
- **Services:** 2 services (api_service, technician_service)
- **Widgets:** 7 widgets (faults_section, offline_indicator, parts_section, photo_uploader, photos_section, status_badge, task_card)
- **Notifications:** 2 files (notifications_provider, notifications_screen)
- **Offline Support:** 4 files (cache_manager, local_db, queue_manager, sync_service)
- **Assets:** icons (1 file), splash (1 file)
- **Android:** app (build.gradle, proguard-rules.pro, src/main/AndroidManifest.xml, src/main/java/io/flutter/plugins/GeneratedPluginRegistrant.java, src/main/kotlin/com/garagego/technician/MainActivity.kt)
- **Key Files:** key.properties, local.properties

---

## 🎯 الملاحظات المهمة

### 1. التغيير الجذري في Backend
- Backend انتقل من Dart + Shelf إلى Node.js + TypeScript + Prisma
- هذا تغيير كبير يتطلب تحديث جميع الذاكرة والوثائق

### 2. Clean Architecture Implementation
- Backend يتبع Clean Architecture بشكل صارم
- الفصل بين Domain, Application, Infrastructure, API واضح
- معظم المجلدات في application و domain و infrastructure فارغة حالياً

### 3. Modular Design
- Backend يستخدم تصميم معياري (modular) مع 60+ module
- كل module يحتوي على controller, service, routes, types

### 4. Admin Frontend Screens
- Admin Frontend يحتوي على 100+ screen
- هذا يعني أن الواجهة غنية جداً بالميزات

### 5. Mechanic App بسيط
- Mechanic App يحتوي على 3 screens فقط
- يبدو أنه تطبيق بسيط للميكانيكيين

### 6. Customer Frontend Static
- Customer Frontend يستخدم HTML/JS ثابت
- يبدو أنه واجهة بسيطة لتتبع الحجوزات

### 7. Technician App
- Technician App يحتوي على 6 screens و 7 models و 7 widgets
- يحتوي على offline support كامل (4 services)
- ليس فارغاً كما كان يبدو في البداية

### 8. External Skills
- المشروع يحتوي على 3 external skills:
  - marketingskills-main
  - stop-slop-main
  - ui-ux-pro-max-skill-main

### 9. Subagents
- المشروع يستخدم subagents للتنفيذ المتوازي
- هناك 3 phase agents (financial, accounting, reporting)

### 10. Graphify Analysis
- المشروع يحتوي على تحليل graphify شامل
- هناك graph.html للتصور البصري

---

## 🚀 أوامر التشغيل

### Backend (Node.js + TypeScript)
```bash
cd backend
npm install
npm run dev          # Development
npm run build        # Build
npm start            # Production
```

### Admin Frontend (Flutter Web)
```bash
cd admin_frontend
flutter pub get
flutter run -d web-server
```

### Mechanic App (Flutter Mobile)
```bash
cd mechanic_app
flutter pub get
flutter run
```

### Customer Frontend (Static)
```bash
# Serve with any static server
cd customer_frontend
python -m http.server 8000
# or
npx serve
```

### Technician App (Flutter Mobile)
```bash
cd apps/technician_app
flutter pub get
flutter run
```

---

## 📝 التقاير الموجودة

المشروع يحتوي على 60+ تقرير markdown في الجذر، أهمها:

1. **COMPREHENSIVE_PROJECT_EXPLORATION_REPORT.md** - التقرير الشامل القديم
2. **COMPLETE_ARCHITECTURE_DOCUMENTATION.md** - توثيق البنية الكاملة
3. **MASTER_ARCHITECTURE_BLUEPRINT.md** - المخطط المعماري الرئيسي
4. **FINAL_COMPLETE_FIX_REPORT.md** - تقرير الإصلاح النهائي
5. **PHASE_1_UI_ENHANCEMENTS_REPORT.md** - تقرير تحسينات الواجهة
6. **PHASE_2_UX_ENHANCEMENTS_REPORT.md** - تقرير تحسينات تجربة المستخدم
7. **PHASE_3_PERFORMANCE_OPTIMIZATION_REPORT.md** - تقرير تحسين الأداء
8. **BACKEND_COMPLETE_FIX_REPORT.md** - تقرير إصلاح الباك إند
9. **FRONTEND_BACKEND_COMPATIBILITY_REPORT.md** - تقرير التوافق

---

## ✅ حالة الاستكشاف

- ✅ استكشاف backend/src/modules (60+ modules)
- ✅ استكشاف backend/src/application
- ✅ استكشاف backend/src/domain
- ✅ استكشاف backend/src/infrastructure
- ✅ استكشاف backend/src/api
- ✅ استكشاف backend/src/config, shared, queues, middleware
- ✅ استكشاف admin_frontend/lib/modules
- ✅ استكشاف admin_frontend/lib/core, models, providers, services, utils, widgets
- ✅ استكشاف admin_frontend/lib/screens
- ✅ استكشاف mechanic_app/lib
- ✅ استكشاف customer_frontend
- ✅ استكشاف apps/technician_app
- ✅ استكشاف المجلدات الإضافية
- ✅ تحديث التقرير الشامل

---

## 🎯 الخلاصة

تم استكشاف المشروع كامل حرف حرف بنجاح. اكتشفت تغيير جذري مهم:

**Backend الآن يستخدم Node.js + TypeScript + Prisma ORM وليس Dart + Shelf!**

هذا التغيير يتطلب:
1. تحديث جميع الذاكرة والوثائق
2. تحديث أوامر التشغيل
3. تحديث فهم البنية المعمارية
4. تحديث استراتيجيات التطوير

المشروع ضخم جداً ويحتوي على:
- 60+ backend modules
- 100+ admin frontend screens
- 3 frontend applications
- 60+ markdown reports
- External skills and subagents

البنية المعمارية تتبع Clean Architecture بشكل صارم، مع فصل واضح بين Domain, Application, Infrastructure, و API layers.

---

**تم الاستكشاف بنجاح ✅**
**التاريخ:** 12 يونيو 2026
