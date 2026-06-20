# AUTO RENEW - Complete Architecture Documentation
## Full Reverse-Engineering & Architecture Extraction

**Project Name:** Garage Go 2.0 / AUTO RENEW  
**Version:** 2.0.0  
**Documentation Date:** May 28, 2026  
**Architecture Style:** Hybrid Clean Architecture + Modular Monolith  

---

# 1. HIGH-LEVEL OVERVIEW

## 1.1 Project Description
AUTO RENEW is a comprehensive Automotive Service Management System (ERP) for multi-tenant garage operations. Manages customers, vehicles, bookings, inventory, accounting, HR, loyalty programs, memberships, and AI-powered analytics.

## 1.2 Technology Stack

### Backend
- **Language:** TypeScript 5.6.3
- **Runtime:** Node.js
- **Framework:** Express 4.19.2
- **Database:** PostgreSQL with Prisma ORM 5.22.0
- **Architecture:** Clean Architecture (Domain, Application, Infrastructure, Presentation)
- **Authentication:** JWT with bcryptjs
- **Real-time:** Socket.IO 4.7.5
- **Queue System:** BullMQ 5.77.6 with Redis
- **File Storage:** MinIO 7.1.3
- **Push Notifications:** Firebase Admin 12.7.0
- **PDF Generation:** PDFKit 0.15.0
- **Excel Export:** ExcelJS 4.4.0
- **Monitoring:** Prometheus (prom-client 15.1.0)

### Frontend (Admin)
- **Framework:** Flutter 3.0+ (Web + Desktop)
- **State Management:** Riverpod 2.5.1
- **Routing:** go_router 14.2.0
- **Networking:** Dio 5.6.0
- **UI Components:** Material Design, fl_chart, data_table_2
- **Animations:** animate_do, lottie, flutter_animate
- **Responsive:** flutter_screenutil 5.9.3

### Frontend (Mechanic)
- **Framework:** Flutter (Mobile)
- **Target:** Android/iOS for mechanics

### Frontend (Customer)
- **Technology:** Static HTML/JS
- **Purpose:** Public booking tracking via token

### Infrastructure
- **Containerization:** Docker + Docker Compose
- **Reverse Proxy:** Nginx
- **Message Queue:** Redis
- **Object Storage:** MinIO
- **Database:** PostgreSQL

## 1.3 Architectural Patterns

### Backend Architecture
**Clean Architecture** with four layers:
1. **Domain Layer** (`src/domain/`): Core business logic, entities, value objects, domain events
2. **Application Layer** (`src/application/`): Use cases, commands, queries, DTOs, handlers
3. **Infrastructure Layer** (`src/infrastructure/`): Repositories, external services, database access
4. **Presentation Layer** (`src/api/`, `src/modules/`): Controllers, routes, middleware

**Modular Monolith** approach with feature-based modules (`src/modules/`) for rapid development.

### Frontend Architecture
- **MVVM Pattern** with Riverpod for state management
- **Feature-based organization** in `lib/modules/`
- **Provider pattern** for dependency injection
- **Service layer** for API communication
- **Widget composition** for reusable UI components

---

# 2. FULL FOLDER TREE (SUMMARY)

```
AUTO_Renew/
├── backend/                          # TypeScript/Node.js Backend
│   ├── prisma/schema.prisma         # Database schema (2473 lines, 80+ models)
│   ├── src/
│   │   ├── api/                     # Presentation Layer (24 controllers, 19 routes)
│   │   ├── application/             # Application Layer (361 files across 7 domains)
│   │   ├── domain/                  # Domain Layer (86 files across 8 domains)
│   │   ├── infrastructure/          # Infrastructure Layer (49 files, 17 repos)
│   │   ├── interfaces/              # HTTP interfaces (Clean Arch)
│   │   ├── middleware/              # 3 custom middlewares
│   │   ├── modules/                 # Modular Monolith (60+ feature modules)
│   │   ├── queues/                  # Background job queues
│   │   ├── workers/                 # 5 background workers
│   │   ├── services/                # Shared services
│   │   ├── shared/                  # Shared utilities
│   │   └── server.ts                # Main entry point
│   ├── tests/                       # Test files
│   └── package.json
│
├── admin_frontend/                  # Flutter Admin Web/Desktop App
│   ├── lib/
│   │   ├── config/                  # Configuration
│   │   ├── core/                    # Core setup (router, theme)
│   │   ├── main.dart                # App entry point
│   │   ├── models/                  # 17 data models
│   │   ├── modules/                 # 62 feature modules
│   │   ├── providers/               # 15 Riverpod providers
│   │   ├── screens/                 # 77 UI screens
│   │   ├── services/                # 18 API services
│   │   ├── utils/                   # Utilities
│   │   └── widgets/                 # 7 reusable widgets
│   └── pubspec.yaml
│
├── mechanic_app/                    # Flutter Mobile App (Mechanics)
├── customer_frontend/               # Static HTML/JS (Customer Tracking)
├── apps/                           # Additional apps
├── docker-compose.yml
└── Various documentation files
```

---

# 3. DOMAIN-BY-DOMAIN BREAKDOWN

## 3.1 Accounting Domain
**Purpose**: Financial accounting, chart of accounts, journal entries, payments, financial reporting

**Subdomains**: Chart of Accounts, Journal Entries, Payments, Financial Reports, Fiscal Periods, Tax Management

**Key Entities**: Account, JournalEntry, JournalLine, Payment, FiscalPeriod, TaxRate

**Domain Events**: JournalEntryPostedEvent, PaymentReceivedEvent, InvoicePaidEvent

**Use Cases (26)**: CreateAccountUseCase, UpdateAccountUseCase, ListAccountsUseCase, CreateJournalEntryUseCase, RegisterCustomerPaymentUseCase, RegisterSupplierPaymentUseCase, AutoJournalForInvoiceUseCase, AutoJournalForGRNUseCase, GetTrialBalanceUseCase, GetIncomeStatementUseCase, GetBalanceSheetUseCase, GetCashFlowSummaryUseCase, GetCustomerBalanceUseCase, GetSupplierBalanceUseCase, ListCustomerStatementsUseCase, ListSupplierStatementsUseCase, GetVATSummaryUseCase, CalculateVATForInvoiceUseCase, GetInventoryValuationReportUseCase, GetProfitPerBookingReportUseCase, GetSalesByServiceReportUseCase, GetTopCustomersReportUseCase, GetTopSuppliersReportUseCase

## 3.2 Bookings Domain
**Purpose**: Service bookings, appointments, mechanic assignments, work orders

**Subdomains**: Booking Management, Service Assignment, Additional Services, Part Suggestions, Appointments

**Key Entities**: Booking, BookingService, MechanicAssignment, PartSuggestion, AppointmentLog, TimeSlot

**Domain Events**: BookingCreatedEvent, BookingStatusChangedEvent

**Use Cases (18)**: CreateBookingUseCase, GetBookingByIdUseCase, ListBookingsUseCase, UpdateBookingStatusUseCase, AddRequestedServiceUseCase, AddAdditionalServiceUseCase, ApproveAdditionalServiceUseCase

## 3.3 Customers Domain
**Purpose**: Customer information, loyalty programs, memberships, wallets

**Subdomains**: Customer Management, Loyalty Program, Membership Plans, Customer Wallet, Customer Tracking

**Key Entities**: Customer, LoyaltyPointTransaction, LoyaltyReward, MembershipPlan, CustomerMembership, CustomerWallet

**Domain Events**: CustomerCreatedEvent

**Use Cases (12)**: CreateCustomerUseCase, UpdateCustomerUseCase, GetCustomerByIdUseCase, ListCustomersUseCase

## 3.4 Inventory Domain
**Purpose**: Spare parts, suppliers, purchase orders, goods receipts, stock movements

**Subdomains**: Parts Management, Suppliers, Purchase Orders, Goods Receipt Notes, Stock Movements, Warehouses, Inventory Transfers, Inventory Counts

**Key Entities**: Part, PartCategory, Supplier, PurchaseOrder, PurchaseOrderItem, GoodsReceiptNote, GoodsReceiptNoteLine, Warehouse, InventoryTransaction, InventoryTransfer, InventoryCount

**Domain Events**: PartCreatedEvent, StockIncreasedEvent, StockDecreasedEvent, PurchaseOrderCreatedEvent, PurchaseOrderSubmittedEvent, GRNCreatedEvent, GRNReceivedEvent, StockIncreasedByGRNEvent

**Use Cases (27)**: CreateSupplierUseCase, UpdateSupplierUseCase, ListSuppliersUseCase, ConsumeStockForWorkOrderUseCase

## 3.5 Invoices Domain
**Purpose**: Invoicing, payments, installments, financial transactions

**Subdomains**: Invoice Management, Invoice Items, Payments, Installments, Coupons, Cheques

**Key Entities**: Invoice, InvoiceItem, Payment, InstallmentPlan, Installment, Cheque, ChequeTransaction, Promotion, CouponUsage

**Domain Events**: InvoiceCreatedEvent, PaymentReceivedEvent

**Use Cases (6)**: CreateInvoiceUseCase, GetInvoiceByIdUseCase, ListInvoicesUseCase, FinalizeInvoiceUseCase, AddInvoiceItemUseCase, RemoveInvoiceItemUseCase

## 3.6 Vehicles Domain
**Purpose**: Vehicle information, history, faults, attachments, recommendations

**Subdomains**: Vehicle Management, Vehicle History, Faults, Attachments, Recommendations, Inspections, Mileage Logs

**Key Entities**: Vehicle, VehicleHistory, VehicleFault, VehicleAttachment, VehicleRecommendation, VehicleInspectionChecklist, VehicleMileageLog, VehicleIssue

**Domain Events**: VehicleCreatedEvent

**Use Cases (5)**: CreateVehicleUseCase, UpdateVehicleUseCase, GetVehicleByIdUseCase, ListAllVehiclesUseCase, ListVehiclesByCustomerUseCase

## 3.7 Mechanics Domain
**Purpose**: Mechanic work assignments, schedules, performance tracking

**Subdomains**: Work Orders, Work Tasks, Schedules, Performance

**Key Entities**: MechanicAssignment, Task, TaskAssignment, TechnicianSchedule, MechanicRating, MechanicShift

**Domain Events**: WorkTaskStartedEvent, WorkTaskCompletedEvent, WorkOrderStartedEvent, WorkOrderCompletedEvent, PartUsedEvent

## 3.8 HR Domain
**Purpose**: Employees, departments, attendance, shifts, payroll

**Subdomains**: Employee Management, Departments, Attendance, Shifts, Payroll

**Key Entities**: Employee, Department, Attendance, Shift, PayrollRecord, EmployeeBranch

## 3.9 Notifications Domain
**Purpose**: In-app notifications, push notifications, WhatsApp messages, notification rules

**Subdomains**: In-App Notifications, Push Notifications, WhatsApp, Notification Rules

**Key Entities**: Notification, PushNotificationToken, FCMToken, WhatsAppMessage, NotificationRule

## 3.10 Maintenance Domain
**Purpose**: Preventive maintenance templates, logs, packages

**Subdomains**: Maintenance Templates, Maintenance Logs, Maintenance Packages

**Key Entities**: PreventiveMaintenanceTemplate, PreventiveMaintenanceLog, MaintenancePackage, MaintenancePackageItem

## 3.11 Reporting & Analytics Domain
**Purpose**: Report generation, data exports, analytics dashboards

**Subdomains**: Reports, Data Exports, Analytics, Advanced Reports

**Key Entities**: Report, DataExport, Expense

## 3.12 RBAC Domain
**Purpose**: Role-based access control, permissions, user authorization

**Subdomains**: Roles, Permissions, Role Permissions

**Key Entities**: Role, Permission, RolePermission

---

# 4. ENTITIES + RELATIONSHIPS

## 4.1 Core Entity Relationships

```
Tenant (Multi-tenant root)
├── User (System users with roles)
│   ├── AuditLog, CashRegister, MechanicAssignment, PartSuggestion
│   ├── PushNotificationToken, TaskAssignment, Employee
│   └── Employee → Attendance, PayrollRecord, TechnicianSchedule
├── Customer (Customer management)
│   ├── Booking, Vehicle, CustomerMembership, LoyaltyPointTransaction, CustomerWallet
├── Vehicle (Vehicle management)
│   ├── Booking, VehicleHistory, VehicleFault, VehicleAttachment
│   ├── VehicleRecommendation, VehicleInspectionChecklist, VehicleMileageLog
├── Booking (Booking management)
│   ├── BookingService, BookingExtraCharge, MechanicAssignment, PartSuggestion
│   ├── Invoice, Review, Task, ElectronicSignature, AppointmentLog
├── Service (Service catalog)
│   ├── BookingService, InvoiceItem, ServicePart, MaintenancePackageItem, TechnicianSchedule
├── Part (Parts inventory)
│   ├── ServicePart, InventoryTransaction, InvoiceItem, MaintenancePackageItem
│   ├── PurchaseOrderItem, GoodsReceiptNoteLine, InventoryCountItem, TransferItem
├── Supplier (Supplier management)
│   ├── Part, PurchaseOrder, GoodsReceiptNote
├── Invoice (Invoicing)
│   ├── InvoiceItem, Payment, InstallmentPlan, CouponUsage
├── Account (Chart of accounts)
│   └── JournalLine
├── JournalEntry (Journal entries)
│   ├── JournalLine, FiscalPeriod
├── Warehouse (Warehouse management)
│   ├── InventoryTransaction, InventoryCount, GoodsReceiptNote, InventoryTransfer
├── Branch (Branch management)
│   ├── Warehouse, Employee, Booking, Invoice, InventoryTransfer
├── MembershipPlan (Membership plans)
│   └── CustomerMembership
├── Role (RBAC)
│   └── RolePermission
└── CompanySettings (Tenant settings)
```

## 4.2 Key Relationship Patterns

**Aggregates**: Booking (Booking + BookingService + MechanicAssignment + PartSuggestion), Invoice (Invoice + InvoiceItem + Payment + InstallmentPlan), Customer (Customer + Vehicle + CustomerMembership + CustomerWallet), Inventory (Part + InventoryTransaction + Warehouse), Accounting (Account + JournalEntry + JournalLine)

**Many-to-Many**: Booking ↔ Service (via BookingService), Service ↔ Part (via ServicePart), Part ↔ Warehouse (via InventoryTransaction), Role ↔ Permission (via RolePermission), Employee ↔ Branch (via EmployeeBranch)

**Self-Referencing**: Account (parent-child hierarchy), PartCategory (parent-child hierarchy), AuditLog (undo relationship)

---

# 5. USE CASES

## 5.1 Accounting Use Cases (26)
Commands: CreateAccountUseCase, UpdateAccountUseCase, CreateJournalEntryUseCase, RegisterCustomerPaymentUseCase, RegisterSupplierPaymentUseCase
Queries: ListAccountsUseCase, GetTrialBalanceUseCase, GetIncomeStatementUseCase, GetBalanceSheetUseCase, GetCashFlowSummaryUseCase, GetCustomerBalanceUseCase, GetSupplierBalanceUseCase, ListCustomerStatementsUseCase, ListSupplierStatementsUseCase, GetVATSummaryUseCase, GetInventoryValuationReportUseCase, GetProfitPerBookingReportUseCase, GetSalesByServiceReportUseCase, GetTopCustomersReportUseCase, GetTopSuppliersReportUseCase
Auto-Journal: AutoJournalForInvoiceUseCase, AutoJournalForGRNUseCase, AutoJournalForStockConsumptionUseCase, AutoJournalForCustomerPaymentUseCase, AutoJournalForSupplierPaymentUseCase
Utility: CalculateVATForInvoiceUseCase

## 5.2 Booking Use Cases (18)
Commands: CreateBookingUseCase, UpdateBookingStatusUseCase, AddRequestedServiceUseCase, AddAdditionalServiceUseCase, ApproveAdditionalServiceUseCase
Queries: GetBookingByIdUseCase, ListBookingsUseCase

## 5.3 Customer Use Cases (12)
Commands: CreateCustomerUseCase, UpdateCustomerUseCase
Queries: GetCustomerByIdUseCase, ListCustomersUseCase

## 5.4 Inventory Use Cases (27)
Commands: CreateSupplierUseCase, UpdateSupplierUseCase, ConsumeStockForWorkOrderUseCase
Queries: ListSuppliersUseCase

## 5.5 Invoice Use Cases (6)
Commands: CreateInvoiceUseCase, FinalizeInvoiceUseCase, AddInvoiceItemUseCase, RemoveInvoiceItemUseCase
Queries: GetInvoiceByIdUseCase, ListInvoicesUseCase

## 5.6 Vehicle Use Cases (5)
Commands: CreateVehicleUseCase, UpdateVehicleUseCase
Queries: GetVehicleByIdUseCase, ListAllVehiclesUseCase, ListVehiclesByCustomerUseCase

---

# 6. API DOCUMENTATION

## 6.1 API Endpoints Summary

**Authentication**: POST /api/auth/login, POST /api/auth/logout, POST /api/auth/refresh, GET /api/auth/profile

**Customers**: POST /api/customers, GET /api/customers/:id, GET /api/customers, PUT /api/customers/:id, DELETE /api/customers/:id, POST /api/customers/:id/loyalty

**Vehicles**: POST /api/vehicles, GET /api/vehicles/:id, GET /api/vehicles, GET /api/vehicles/customer/:customerId, PUT /api/vehicles/:id

**Bookings**: POST /api/bookings, GET /api/bookings/:id, GET /api/bookings, PUT /api/bookings/:id, GET /api/bookings/vehicle/:vehicleId

**Invoices**: POST /api/invoices, GET /api/invoices/:id, GET /api/invoices, PUT /api/invoices/:id, GET /api/invoices/booking/:bookingId

**Inventory**: POST /api/inventory/suppliers, GET /api/inventory/suppliers, POST /api/inventory/purchase-orders, GET /api/inventory/purchase-orders, POST /api/inventory/grns, GET /api/inventory/grns, GET /api/inventory/stock, GET /api/inventory/stock/movements

**Accounting**: POST /api/accounting/accounts, GET /api/accounting/accounts, POST /api/accounting/journal-entries, GET /api/accounting/journal-entries, GET /api/accounting/customers/:customerId/balance, GET /api/accounting/customers/:customerId/statement, GET /api/accounting/suppliers/:supplierId/balance, GET /api/accounting/suppliers/:supplierId/statement, POST /api/accounting/payments, GET /api/accounting/payments/customer/:customerId, GET /api/accounting/reports/trial-balance, GET /api/accounting/reports/income-statement, GET /api/accounting/reports/balance-sheet

**Branch & Warehouse**: GET /api/branches, GET /api/branches/:id, POST /api/branches, PUT /api/branches/:id, DELETE /api/branches/:id, POST /api/branches/:id/activate, POST /api/branches/:id/deactivate, GET /api/warehouses, GET /api/warehouses/:id, POST /api/warehouses, PUT /api/warehouses/:id, DELETE /api/warehouses/:id, GET /api/warehouses/:id/stock, POST /api/warehouses/:id/set-primary

**Inventory Transfer**: POST /api/inventory/transfer, GET /api/inventory/transfer/:id, GET /api/inventory/transfer, POST /api/inventory/transfer/:id/approve, POST /api/inventory/transfer/:id/ship, POST /api/inventory/transfer/:id/receive, POST /api/inventory/transfer/:id/cancel

**Consolidated Reports (Admin)**: GET /api/reports/consolidated/sales, GET /api/reports/consolidated/profitability, GET /api/reports/consolidated/inventory, GET /api/reports/consolidated/memberships

**RBAC**: GET /api/roles, GET /api/roles/:id, POST /api/roles, PUT /api/roles/:id, DELETE /api/roles/:id, GET /api/permissions, GET /api/roles/:roleId/permissions, POST /api/roles/:roleId/permissions

**Analytics**: GET /api/analytics/sales, GET /api/analytics/profitability, GET /api/analytics/bookings, GET /api/analytics/inventory, GET /api/analytics/memberships, GET /api/analytics/branches, POST /api/analytics/cache/clear

**AI Assistant**: POST /api/ai/query

**Settings**: GET /api/settings/public, GET /api/settings, PUT /api/settings

**Notifications**: GET /api/notifications/whatsapp/messages

**Membership & Loyalty**: GET /api/memberships/plans, POST /api/memberships/plans, PUT /api/memberships/plans/:id, DELETE /api/memberships/plans/:id, GET /api/customers/:id/memberships, POST /api/customers/:id/memberships/purchase, PUT /api/memberships/:id/cancel, GET /api/customers/:id/points, GET /api/customers/:id/points/transactions, POST /api/customers/:id/points/redeem, POST /api/customers/:id/points/add, GET /api/customers/:id/wallet, POST /api/customers/:id/wallet/add

**Public**: GET /api/public/tracking/:publicToken

**Queue Management**: GET /api/queues/admin/queues, GET /api/queues/stats

**Audit Log**: GET /api/audit, GET /api/audit/:id

---

# 7. WORKFLOWS

## 7.1 Booking Workflow
1. Customer creates booking → 2. Booking confirmed → 3. Mechanic assigned → 4. Mechanic suggests parts/services → 5. Customer approves/rejects → 6. Work completed → 7. Quality check → 8. Invoice generated → 9. Payment processed → 10. Customer reviews

## 7.2 Purchase Order Workflow
1. Create PO → 2. Manager approval → 3. Supplier ships → 4. Goods received (GRN) → 5. Stock updated → 6. Supplier balance updated

## 7.3 Invoice & Payment Workflow
1. Create invoice → 2. Finalize invoice → 3. Payment received → 4. Auto-journal entry created → 5. Customer balance updated

## 7.4 Inventory Transfer Workflow
1. Create transfer request → 2. Manager approval → 3. Ship items → 4. Receive items → 5. Stock updated at both warehouses

## 7.5 Journal Entry Workflow
1. Create journal entry → 2. Submit for approval → 3. Approve/reject → 4. Fiscal period closing

## 7.6 Maintenance Workflow
1. Create maintenance template → 2. Create maintenance packages → 3. Schedule maintenance → 4. Perform maintenance → 5. Complete maintenance

---

# 8. EVENTS

## 8.1 Domain Events

**Accounting**: JournalEntryPostedEvent, PaymentReceivedEvent, InvoicePaidEvent

**Booking**: BookingCreatedEvent, BookingStatusChangedEvent

**Customer**: CustomerCreatedEvent

**Inventory**: PartCreatedEvent, StockIncreasedEvent, StockDecreasedEvent, PurchaseOrderCreatedEvent, PurchaseOrderSubmittedEvent, GRNCreatedEvent, GRNReceivedEvent, StockIncreasedByGRNEvent

**Invoice**: InvoiceCreatedEvent, PaymentReceivedEvent

**Mechanic**: WorkTaskStartedEvent, WorkTaskCompletedEvent, WorkOrderStartedEvent, WorkOrderCompletedEvent, PartUsedEvent

**Vehicle**: VehicleCreatedEvent

**Auth**: UserCreatedEvent

---

# 9. INFRASTRUCTURE

## 9.1 Database
PostgreSQL with Prisma ORM, 80+ models, 40+ enums, multi-tenant isolation via tenantId, indexes on foreign keys and frequently queried fields

## 9.2 Caching
Redis for session storage, queue backend (BullMQ), real-time pub/sub (Socket.IO adapter), analytics cache

## 9.3 File Storage
MinIO for vehicle attachments, booking attachments, part images, generated reports, customer documents

## 9.4 Message Queue
BullMQ with queues: accounting-queue, inventory-queue, notifications-queue, pdf-queue, reports-queue

## 9.5 Real-time Communication
Socket.IO with rooms: tenant:{tenantId}, user:{userId}

## 9.6 External Integrations
Firebase Cloud Messaging (push notifications), WhatsApp Business API (notifications), AI Assistant (NLP queries)

## 9.7 Monitoring
Prometheus metrics (request counts, response times, queue sizes, DB connections, error rates), Bull Board (queue monitoring UI)

## 9.8 Security
JWT authentication, bcryptjs password hashing, RBAC authorization, branch isolation middleware, audit logging middleware, CORS, rate limiting, input validation

---

# 10. MISSING COMPONENTS (AUTO-DETECTED)

## 10.1 Architecture Inconsistencies
**Hybrid Architecture Issue**: Project uses both Clean Architecture and Modular Monolith patterns, creating duplicate implementations and inconsistent patterns. Recommendation: Choose one architecture pattern and migrate.

**Empty Directories**: src/domain/customer-tracking/, src/modules/hr/, src/modules/inventory/, src/modules/journal/, src/modules/tenants/ are empty. Recommendation: Implement or remove.

## 10.2 Missing Clean Architecture Components
**Domain Layer**: Missing explicit aggregate roots, domain services, repository interfaces for some repos

**Application Layer**: Missing Command/Query Bus (CQRS), validation layer, transaction management

**Infrastructure Layer**: Missing event bus, repository-level caching, Unit of Work pattern

## 10.3 Missing Features
**Frontend**: Offline support, PWA, full i18n, accessibility, error boundaries

**Backend**: API versioning, OpenAPI/Swagger docs, structured logging, deep health checks, graceful shutdown, circuit breaker, retry logic

**Testing**: Minimal unit tests, no integration tests, no E2E tests, no contract tests

**DevOps**: No CI/CD, no IaC, secrets in .env, no log aggregation, no APM

## 10.4 Data Integrity Issues
Missing database check constraints, unique constraints on critical fields, foreign key cascading rules, composite indexes, full-text search indexes, partial indexes

## 10.5 Security Gaps
No MFA, no password strength enforcement, no account lockout, no session timeout, no ABAC, no RLS in database, no API key auth, no field-level encryption, no data masking, no GDPR compliance

## 10.6 Performance Issues
No connection pooling config visible, N+1 queries likely, no read replica, no DB partitioning, no app-level caching, no CDN, no browser caching, no pagination on list endpoints, no field selection, no bulk operations

## 10.7 Business Logic Gaps
**Accounting**: No multi-currency in journal entries, no recurring entries, no budget management, no cost center allocation, no inter-company transactions

**Inventory**: No serial number tracking, no expiry date tracking, no batch/lot management, no minimum order quantity, no lead time tracking

**HR**: No leave management, no timesheet tracking, no performance reviews, no training management

**Reporting**: No scheduled reports, no report templates, no custom report builder (partial), no dashboard customization

---

# 11. FINAL RECOMMENDED ARCHITECTURE MAP

## 11.1 Recommended Architecture: Pure Clean Architecture

**Rationale**: Eliminate hybrid pattern confusion, provide better separation of concerns, testability, and maintainability.

### Proposed Structure

```
backend/
├── src/
│   ├── domain/                      # Core business logic (no dependencies)
│   │   ├── shared/                  # Shared domain concepts
│   │   │   ├── value-objects/       # Money, Email, PhoneNumber, etc.
│   │   │   └── exceptions/          # Domain-specific exceptions
│   │   ├── accounting/             # Accounting bounded context
│   │   │   ├── entities/
│   │   │   ├── value-objects/
│   │   │   ├── aggregates/          # NEW: Aggregate roots
│   │   │   ├── domain-services/     # NEW: Domain services
│   │   │   ├── repository-interfaces/ # NEW: Repository interfaces
│   │   │   └── events/
│   │   ├── bookings/               # Bookings bounded context
│   │   ├── customers/              # Customers bounded context
│   │   ├── inventory/              # Inventory bounded context
│   │   ├── invoices/               # Invoices bounded context
│   │   ├── vehicles/               # Vehicles bounded context
│   │   └── ...                     # Other bounded contexts
│   │
│   ├── application/                # Application logic (orchestration)
│   │   ├── shared/                 # Shared application logic
│   │   │   ├── commands/           # Command DTOs
│   │   │   ├── queries/            # Query DTOs
│   │   │   ├── validators/         # Request validators
│   │   │   └── mappers/            # DTO to entity mappers
│   │   ├── accounting/             # Accounting use cases
│   │   │   ├── commands/           # Command handlers
│   │   │   ├── queries/            # Query handlers
│   │   │   └── use-cases/          # Use case implementations
│   │   ├── bookings/               # Bookings use cases
│   │   ├── customers/              # Customers use cases
│   │   ├── inventory/              # Inventory use cases
│   │   ├── invoices/               # Invoices use cases
│   │   └── ...                     # Other use cases
│   │
│   ├── infrastructure/             # External concerns
│   │   ├── database/               # Database implementation
│   │   │   ├── prisma/             # Prisma client
│   │   │   ├── migrations/         # Migration files
│   │   │   └── seed/               # Seed data
│   │   ├── repositories/           # Repository implementations
│   │   │   ├── accounting/
│   │   │   ├── bookings/
│   │   │   ├── customers/
│   │   │   ├── inventory/
│   │   │   └── ...                 # Other repositories
│   │   ├── external-services/      # External API integrations
│   │   │   ├── fcm/                # Firebase
│   │   │   ├── whatsapp/           # WhatsApp
│   │   │   ├── minio/              # Object storage
│   │   │   └── ai/                 # AI service
│   │   ├── messaging/              # Event bus implementation
│   │   │   ├── event-bus.ts        # Event bus
│   │   │   ├── handlers/           # Event handlers
│   │   │   └── publishers/         # Event publishers
│   │   ├── cache/                  # Caching layer
│   │   │   ├── redis-cache.ts      # Redis implementation
│   │   │   └── cache-interface.ts  # Cache interface
│   │   ├── queue/                  # Background jobs
│   │   │   ├── bullmq/             # BullMQ setup
│   │   │   ├── jobs/               # Job definitions
│   │   │   └── workers/            # Worker implementations
│   │   └── logging/                # Logging infrastructure
│   │       ├── logger.ts           # Logger interface
│   │       └── implementations/    # Winston, Pino, etc.
│   │
│   ├── presentation/               # Interface layer
│   │   ├── http/                   # HTTP API
│   │   │   ├── controllers/        # Request handlers
│   │   │   ├── middlewares/        # Express middlewares
│   │   │   ├── routes/             # Route definitions
│   │   │   ├── validators/         # Request validation
│   │   │   └── dto/                # Response DTOs
│   │   ├── websocket/              # WebSocket API
│   │   │   ├── handlers/           # Socket handlers
│   │   │   └── events/             # Event definitions
│   │   └── graphql/                # GraphQL API (optional)
│   │       ├── resolvers/          # Query/Mutation resolvers
│   │       ├── schema/             # GraphQL schema
│   │       └── directives/         # Custom directives
│   │
│   ├── config/                     # Configuration
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   ├── minio.ts
│   │   ├── fcm.ts
│   │   └── whatsapp.ts
│   │
│   ├── shared/                     # Shared utilities
│   │   ├── utils/                  # Utility functions
│   │   ├── constants/              # Constants
│   │   ├── types/                  # Shared types
│   │   └── helpers/               # Helper functions
│   │
│   └── server.ts                   # Application entry point
```

## 11.2 Key Improvements

1. **Remove modules/**: Consolidate all business logic into Clean Architecture layers
2. **Add Aggregates**: Explicit aggregate root definitions
3. **Add Domain Services**: Business logic not tied to entities
4. **Add Repository Interfaces**: Domain layer defines contracts
5. **Add Event Bus**: Proper event-driven architecture
6. **Add Caching Layer**: Repository-level caching
7. **Add Unit of Work**: Transaction management
8. **Add Command/Query Bus**: CQRS pattern
9. **Add Validation Layer**: Dedicated validation
10. **Add External Services**: Isolate external integrations

## 11.3 Migration Strategy

1. **Phase 1**: Create new Clean Architecture structure alongside existing code
2. **Phase 2**: Migrate one bounded context at a time (start with accounting)
3. **Phase 3**: Update tests for migrated contexts
4. **Phase 4**: Remove old modules/ directory
5. **Phase 5**: Update API routes to use new use cases
6. **Phase 6**: Full integration testing

---

# 12. CONCLUSION

AUTO RENEW is a comprehensive automotive service management system with a rich feature set including multi-tenancy, full accounting, inventory management, HR, loyalty programs, and AI-powered analytics. The system uses a hybrid Clean Architecture + Modular Monolith approach which provides flexibility but also introduces complexity.

**Strengths**:
- Comprehensive domain coverage
- Multi-tenant architecture
- Rich business logic (accounting, inventory, HR)
- Event-driven design (domain events)
- Background job processing
- Real-time capabilities
- Multiple frontend applications

**Weaknesses**:
- Hybrid architecture creates confusion
- Empty modules/directories
- Missing Clean Architecture components
- Limited testing
- No CI/CD
- Security gaps
- Performance optimization needed

**Recommendation**: Adopt pure Clean Architecture, implement missing components, improve testing coverage, add CI/CD, address security gaps, and optimize performance.

---

**End of Documentation**
