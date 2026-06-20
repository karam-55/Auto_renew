# AUTO RENEW - MASTER ARCHITECTURE BLUEPRINT
## Complete System Documentation for Copilot Refactoring & Development

**Project Name:** Garage Go 2.0 / AUTO RENEW  
**Version:** 2.0.0  
**Documentation Date:** May 28, 2026  
**Architecture Style:** Hybrid Clean Architecture + Modular Monolith

---

# TABLE OF CONTENTS

1. [PHASE 1: PROJECT STRUCTURE](#phase-1-project-structure)
2. [PHASE 2: DOMAIN MODEL](#phase-2-domain-model)
3. [PHASE 3: APPLICATION LAYER](#phase-3-application-layer)
4. [PHASE 4: API ENDPOINTS](#phase-4-api-endpoints)
5. [PHASE 5: WORKFLOWS](#phase-5-workflows)
6. [PHASE 6: INFRASTRUCTURE](#phase-6-infrastructure)
7. [PHASE 7: MISSING COMPONENTS](#phase-7-missing-components)
8. [PHASE 8: FINAL BLUEPRINT](#phase-8-final-blueprint)

---

# PHASE 1: PROJECT STRUCTURE

## 1.1 Full Folder Tree Summary

```
AUTO_Renew/
├── backend/ (850 items)
│   ├── prisma/schema.prisma (2473 lines, 80+ models, 40+ enums)
│   ├── src/
│   │   ├── api/ (55 items) - Presentation Layer: 24 controllers, 19 routes, 7 middlewares
│   │   ├── application/ (361 items) - Application Layer: 8 domains, 87+ use cases
│   │   ├── domain/ (86 items) - Domain Layer: 8 domains, entities, VOs, events
│   │   ├── infrastructure/ (49 items) - Infrastructure: 17 repositories, DB, services
│   │   ├── interfaces/ (39 items) - HTTP interfaces: 15+ route files
│   │   ├── middleware/ (3 items) - Custom middlewares
│   │   ├── modules/ (201 items) - Modular Monolith: 60+ feature modules
│   │   ├── queues/ (2 items) - Queue configuration
│   │   ├── workers/ (5 items) - Background workers
│   │   ├── services/ (4 items) - Shared services
│   │   ├── shared/ (3 items) - Shared utilities
│   │   └── server.ts (223 lines)
│   ├── tests/ (18 items)
│   └── package.json
│
├── admin_frontend/ (214 items)
│   ├── lib/
│   │   ├── config/ (2 items)
│   │   ├── core/ (4 items) - router, theme
│   │   ├── main.dart
│   │   ├── models/ (17 items)
│   │   ├── modules/ (62 items)
│   │   ├── providers/ (15 items) - Riverpod
│   │   ├── screens/ (77 items)
│   │   ├── services/ (18 items)
│   │   ├── utils/ (1 item)
│   │   └── widgets/ (7 items)
│   └── pubspec.yaml
│
├── mechanic_app/ (17 items)
├── customer_frontend/ (7 items)
├── apps/ (42 items)
├── docker-compose.yml
└── Various documentation files
```

## 1.2 Architectural Layers

### Backend - Hybrid Architecture Issue

**Clean Architecture Layers**:
- Domain: 8 domains (accounting, auth, bookings, customers, inventory, invoices, mechanics, vehicles)
- Application: 8 domains with use cases, commands, DTOs, handlers
- Infrastructure: 17 repositories, database, external services
- Presentation: 24 controllers, 19 routes

**Modular Monolith Layers**:
- 60+ feature modules in `src/modules/`
- Direct controller implementations
- Route definitions

**Inconsistencies**:
- Duplicate implementations (e.g., accounting exists in both domain/ and modules/)
- Empty directories: customer-tracking/, hr/, inventory/, journal/, tenants/
- Mixed route patterns (interfaces/http/routes/ vs api/routes/)

### Frontend - MVVM with Riverpod

- Core: Router, Theme
- Data: 17 models, 18 API services
- State: 15 Riverpod providers
- UI: 77 screens, 7 widgets
- Features: 62 modules

---

# PHASE 2: DOMAIN MODEL

## 2.1 Database Schema (80+ Models)

### Core Models

**Tenant**: Multi-tenant root with relations to all entities
**User**: System users with roles (OWNER, MANAGER, RECEPTIONIST, ACCOUNTANT, MECHANIC, SALES, CASHIER, HR_MANAGER)
**Customer**: Customer management with loyalty points, VIP status
**Vehicle**: Vehicle management with public tracking ID, mileage tracking
**Service**: Service catalog with pricing
**Booking**: Service bookings with status workflow
**Part**: Spare parts inventory with cost/price tracking
**Supplier**: Supplier management with balance tracking
**Warehouse**: Multi-warehouse support
**Account**: Chart of accounts with hierarchy
**JournalEntry**: Double-entry bookkeeping
**JournalLine**: Debit/credit lines
**Invoice**: Invoicing with line items
**InvoiceItem**: Invoice line items
**Payment**: Payment processing
**Employee**: HR management
**Department**: Organizational structure
**Attendance**: Attendance tracking
**Shift**: Shift management
**PayrollRecord**: Payroll processing

### Additional Models (40+)

Currency, ExchangeRate, CompanySettings, Notification, WhatsAppMessage, NotificationRule, FCMToken, PushNotificationToken, Attachment, Task, TaskAssignment, Note, VehicleHistory, VehicleFault, VehicleAttachment, VehicleRecommendation, VehicleInspectionChecklist, VehicleMileageLog, VehicleIssue, PurchaseOrder, PurchaseOrderItem, GoodsReceiptNote, GoodsReceiptNoteLine, InventoryTransaction, InventoryCount, InventoryCountItem, InventoryCountAdjustment, InventoryTransfer, InventoryTransferItem, InstallmentPlan, Installment, Cheque, ChequeTransaction, Promotion, PromotionCondition, CouponUsage, PreventiveMaintenanceTemplate, PreventiveMaintenanceLog, MaintenancePackage, MaintenancePackageItem, Warranty, WarrantyClaim, Review, MechanicRating, TimeSlot, AppointmentLog, CashRegister, CashRegisterSession, ExtraChargeType, BookingExtraCharge, LoyaltyPoint, LoyaltyReward, MembershipPlan, CustomerMembership, LoyaltyPointTransaction, CustomerWallet, Role, Permission, RolePermission, Branch, TechnicianSchedule, AuditLog, Report, DataExport, Expense

## 2.2 Enums (40+)

UserRole, ContractType, EmployeeStatus, PayrollStatus, BookingStatus, AssignmentStatus, PartType, SuggestionStatus, AppointmentStatus, SupplierStatus, WarehouseStatus, TransactionType, OrderStatus, GRNStatus, CountType, CountStatus, AdjustmentType, TransferStatus, AccountType, JournalEntryStatus, FiscalPeriodStatus, PaymentMethod, InvoiceStatus, PaymentFrequency, InstallmentStatus, InstallmentPaymentStatus, ChequeType, ChequeStatus, ChequeTransactionType, NotificationType, MessageStatus, MaintenanceType, MaintenanceStatus, TaskPriority, TaskStatus, VehicleHistoryType, FaultSeverity, FaultStatus, AttachmentType, RecommendationStatus, MileageType, IssueStatus, WarrantyType, WarrantyClaimStatus, PromotionType, ConditionType, RewardType, MembershipStatus, PointTransactionType, PointTransactionSource, ScheduleStatus, TaxAppliesTo, SessionStatus

## 2.3 Domain Entities (Clean Architecture)

### Accounting Domain
- Account, AccountType, JournalEntry, JournalEntryItem, JournalStatus, LedgerEntry, Payment, PaymentMethod
- VOs: AccountCode, Money, EntryDate
- Events: JournalEntryPostedEvent, PaymentReceivedEvent, InvoicePaidEvent

### Bookings Domain
- Booking, BookingStatus, BookingService, BookingApproval, BookingImage
- VOs: PublicToken, BookingCode
- Events: BookingCreatedEvent, BookingStatusChangedEvent

### Customers Domain
- Customer, CustomerVehicle
- VOs: PhoneNumber, PlateNumber
- Events: CustomerCreatedEvent

### Inventory Domain
- Part, StockItem, StockMovement, InventoryAdjustment, PurchaseOrder, PurchaseOrderItem, GRN, GRNItem
- VOs: PartNumber, Quantity, MovementReference, UnitPrice, SupplierId, OrderNumber, GRNNumber, ReceivedQuantity
- Events: PartCreatedEvent, StockIncreasedEvent, StockDecreasedEvent, PurchaseOrderCreatedEvent, PurchaseOrderSubmittedEvent, GRNCreatedEvent, GRNReceivedEvent, StockIncreasedByGRNEvent

### Invoices Domain
- Invoice, InvoiceItem, Payment
- VOs: InvoiceNumber, PaymentReference
- Events: InvoiceCreatedEvent, PaymentReceivedEvent

### Mechanics Domain
- Mechanic, WorkOrder, WorkTask, PartUsage
- VOs: TaskDescription, Hours
- Events: WorkTaskStartedEvent, WorkTaskCompletedEvent, WorkOrderStartedEvent, WorkOrderCompletedEvent, PartUsedEvent

### Vehicles Domain
- Vehicle, VehicleModel, VehicleBrand
- VOs: VIN, PlateNumber
- Events: VehicleCreatedEvent

### Auth Domain
- User, Role, Permission
- VOs: Password
- Events: UserCreatedEvent

## 2.4 Aggregates (Inferred)

**Booking Aggregate**: Booking + BookingService + MechanicAssignment + PartSuggestion
**Invoice Aggregate**: Invoice + InvoiceItem + Payment + InstallmentPlan
**Customer Aggregate**: Customer + Vehicle + CustomerMembership + CustomerWallet
**Inventory Aggregate**: Part + InventoryTransaction + Warehouse
**Accounting Aggregate**: Account + JournalEntry + JournalLine

---

# PHASE 3: APPLICATION LAYER

## 3.1 Use Cases (94+)

### Accounting Use Cases (26)
Commands: CreateAccountUseCase, UpdateAccountUseCase, CreateJournalEntryUseCase, RegisterCustomerPaymentUseCase, RegisterSupplierPaymentUseCase
Queries: ListAccountsUseCase, GetTrialBalanceUseCase, GetIncomeStatementUseCase, GetBalanceSheetUseCase, GetCashFlowSummaryUseCase, GetCustomerBalanceUseCase, GetSupplierBalanceUseCase, ListCustomerStatementsUseCase, ListSupplierStatementsUseCase, GetVATSummaryUseCase, GetInventoryValuationReportUseCase, GetProfitPerBookingReportUseCase, GetSalesByServiceReportUseCase, GetTopCustomersReportUseCase, GetTopSuppliersReportUseCase
Auto-Journal: AutoJournalForInvoiceUseCase, AutoJournalForGRNUseCase, AutoJournalForStockConsumptionUseCase, AutoJournalForCustomerPaymentUseCase, AutoJournalForSupplierPaymentUseCase
Utility: CalculateVATForInvoiceUseCase

### Bookings Use Cases (18)
Commands: CreateBookingUseCase, UpdateBookingStatusUseCase, AddRequestedServiceUseCase, AddAdditionalServiceUseCase, ApproveAdditionalServiceUseCase
Queries: GetBookingByIdUseCase, ListBookingsUseCase

### Customers Use Cases (12)
Commands: CreateCustomerUseCase, UpdateCustomerUseCase
Queries: GetCustomerByIdUseCase, ListCustomersUseCase

### Inventory Use Cases (27)
Commands: CreateSupplierUseCase, UpdateSupplierUseCase, ConsumeStockForWorkOrderUseCase
Queries: ListSuppliersUseCase

### Invoices Use Cases (6)
Commands: CreateInvoiceUseCase, FinalizeInvoiceUseCase, AddInvoiceItemUseCase, RemoveInvoiceItemUseCase
Queries: GetInvoiceByIdUseCase, ListInvoicesUseCase

### Vehicles Use Cases (5)
Commands: CreateVehicleUseCase, UpdateVehicleUseCase
Queries: GetVehicleByIdUseCase, ListAllVehiclesUseCase, ListVehiclesByCustomerUseCase

---

# PHASE 4: API ENDPOINTS

## 4.1 API Endpoints Summary (80+)

### Authentication
POST /api/auth/login, POST /api/auth/logout, POST /api/auth/refresh, GET /api/auth/profile

### Customers
POST /api/customers, GET /api/customers/:id, GET /api/customers, PUT /api/customers/:id, DELETE /api/customers/:id, POST /api/customers/:id/loyalty

### Vehicles
POST /api/vehicles, GET /api/vehicles/:id, GET /api/vehicles, GET /api/vehicles/customer/:customerId, PUT /api/vehicles/:id

### Bookings
POST /api/bookings, GET /api/bookings/:id, GET /api/bookings, PUT /api/bookings/:id, GET /api/bookings/vehicle/:vehicleId

### Invoices
POST /api/invoices, GET /api/invoices/:id, GET /api/invoices, PUT /api/invoices/:id, GET /api/invoices/booking/:bookingId

### Inventory
POST /api/inventory/suppliers, GET /api/inventory/suppliers, POST /api/inventory/purchase-orders, GET /api/inventory/purchase-orders, POST /api/inventory/grns, GET /api/inventory/grns, GET /api/inventory/stock, GET /api/inventory/stock/movements

### Accounting
POST /api/accounting/accounts, GET /api/accounting/accounts, POST /api/accounting/journal-entries, GET /api/accounting/journal-entries, GET /api/accounting/customers/:customerId/balance, GET /api/accounting/customers/:customerId/statement, GET /api/accounting/suppliers/:supplierId/balance, GET /api/accounting/suppliers/:supplierId/statement, POST /api/accounting/payments, GET /api/accounting/payments/customer/:customerId, GET /api/accounting/reports/trial-balance, GET /api/accounting/reports/income-statement, GET /api/accounting/reports/balance-sheet

### Branch & Warehouse
GET /api/branches, GET /api/branches/:id, POST /api/branches, PUT /api/branches/:id, DELETE /api/branches/:id, POST /api/branches/:id/activate, POST /api/branches/:id/deactivate, GET /api/warehouses, GET /api/warehouses/:id, POST /api/warehouses, PUT /api/warehouses/:id, DELETE /api/warehouses/:id, GET /api/warehouses/:id/stock, POST /api/warehouses/:id/set-primary

### Inventory Transfer
POST /api/inventory/transfer, GET /api/inventory/transfer/:id, GET /api/inventory/transfer, POST /api/inventory/transfer/:id/approve, POST /api/inventory/transfer/:id/ship, POST /api/inventory/transfer/:id/receive, POST /api/inventory/transfer/:id/cancel

### Consolidated Reports (Admin)
GET /api/reports/consolidated/sales, GET /api/reports/consolidated/profitability, GET /api/reports/consolidated/inventory, GET /api/reports/consolidated/memberships

### RBAC
GET /api/roles, GET /api/roles/:id, POST /api/roles, PUT /api/roles/:id, DELETE /api/roles/:id, GET /api/permissions, GET /api/roles/:roleId/permissions, POST /api/roles/:roleId/permissions

### Analytics
GET /api/analytics/sales, GET /api/analytics/profitability, GET /api/analytics/bookings, GET /api/analytics/inventory, GET /api/analytics/memberships, GET /api/analytics/branches, POST /api/analytics/cache/clear

### AI Assistant
POST /api/ai/query

### Settings
GET /api/settings/public, GET /api/settings, PUT /api/settings

### Notifications
GET /api/notifications/whatsapp/messages

### Membership & Loyalty
GET /api/memberships/plans, POST /api/memberships/plans, PUT /api/memberships/plans/:id, DELETE /api/memberships/plans/:id, GET /api/customers/:id/memberships, POST /api/customers/:id/memberships/purchase, PUT /api/memberships/:id/cancel, GET /api/customers/:id/points, GET /api/customers/:id/points/transactions, POST /api/customers/:id/points/redeem, POST /api/customers/:id/points/add, GET /api/customers/:id/wallet, POST /api/customers/:id/wallet/add

### Public
GET /api/public/tracking/:publicToken

### Queue Management
GET /api/queues/admin/queues, GET /api/queues/stats

### Audit Log
GET /api/audit, GET /api/audit/:id

---

# PHASE 5: WORKFLOWS

## 5.1 Booking Workflow

1. **Create Booking**: Customer/Receptionist creates booking → Select customer, vehicle, services → Set scheduled date/time → Generate public token → Status: PENDING
2. **Confirm Booking**: Receptionist confirms → Status: CONFIRMED
3. **Assign Mechanic**: Manager assigns mechanic → MechanicAssignment created → Status: IN_PROGRESS
4. **Mechanic Suggests**: Mechanic suggests parts/services → PartSuggestion created → Status: PENDING_CUSTOMER_APPROVAL
5. **Customer Approves**: Customer approves/rejects → If approved: Added to booking → If rejected: Marked REJECTED
6. **Complete Work**: Mechanic completes work → Status: READY
7. **Quality Check**: Vehicle inspection checklist completed
8. **Generate Invoice**: Services and parts added → Discounts applied → Tax calculated → Status: DRAFT
9. **Finalize Invoice**: Invoice number generated → Status: SENT → Auto-journal entry created
10. **Process Payment**: Payment recorded → Invoice status updated → Auto-journal entry created → Customer balance updated → Status: PAID
11. **Deliver Vehicle**: Status: DELIVERED
12. **Customer Review**: Optional review created → Mechanic rating updated

## 5.2 Purchase Order Workflow

1. **Create PO**: Create purchase order → Select supplier → Add parts with quantities → Set order date → Status: PENDING
2. **Manager Approval**: Manager reviews → If approved: Status: APPROVED → If rejected: Status: CANCELLED
3. **Supplier Ships**: PO sent to supplier
4. **Receive Goods**: Create GRN → Record received quantities → Record damaged quantities → Status: COMPLETED
5. **Update Stock**: InventoryTransaction created (type: PURCHASE) → Part quantities increased → Auto-journal entry created
6. **Update Supplier**: Supplier balance increased

## 5.3 Invoice & Payment Workflow

1. **Create Invoice**: Select booking (optional) → Add services → Add parts → Apply discounts/coupons → Calculate tax → Status: DRAFT
2. **Finalize Invoice**: Invoice number generated → Status: SENT → Auto-journal entry (debit Accounts Receivable, credit Revenue)
3. **Receive Payment**: Payment recorded → Invoice status (PARTIALLY_PAID or PAID) → Auto-journal entry (debit Cash/Bank, credit Accounts Receivable) → Customer balance updated
4. **Installment Plan**: Create installment plan → Generate installment schedule → Track payments per installment

## 5.4 Inventory Transfer Workflow

1. **Create Transfer**: Select from warehouse → Select to warehouse → Add parts with quantities → Status: REQUESTED
2. **Manager Approval**: Manager approves → Status: APPROVED
3. **Ship Items**: Status: SHIPPED → Stock decreased from source warehouse
4. **Receive Items**: Status: RECEIVED → Stock increased at destination warehouse → InventoryTransaction created for both warehouses

## 5.5 Journal Entry Workflow

1. **Create Entry**: Enter entry date → Add debit lines → Add credit lines → Ensure debits = credits → Status: DRAFT
2. **Submit for Approval**: Manager reviews
3. **Approve/Reject**: If approved: Status: POSTED → If rejected: Status: CANCELLED
4. **Fiscal Period Closing**: All entries in period locked → Period status: CLOSED

## 5.6 Maintenance Workflow

1. **Create Template**: Define service interval (km/months) → Define priority
2. **Create Packages**: Group services/parts → Set pricing
3. **Schedule Maintenance**: Based on vehicle mileage/time → Create PreventiveMaintenanceLog → Status: SCHEDULED
4. **Perform Maintenance**: Status: IN_PROGRESS → Record actual km/date → Attach documents
5. **Complete Maintenance**: Status: COMPLETED → Update vehicle last service date → Schedule next maintenance

---

# PHASE 6: INFRASTRUCTURE

## 6.1 Database

**Technology**: PostgreSQL with Prisma ORM
**Schema**: 80+ models, 40+ enums
**Connection**: Connection pooling via Prisma Client
**Multi-tenancy**: Tenant isolation via tenantId
**Indexes**: On all foreign keys and frequently queried fields

## 6.2 Caching

**Redis**: Session storage, queue backend (BullMQ), real-time pub/sub (Socket.IO adapter), analytics cache

## 6.3 File Storage

**MinIO**: Vehicle attachments, booking attachments, part images, generated reports, customer documents

## 6.4 Message Queue

**BullMQ with Redis**:
- accounting-queue: Journal entries, payments
- inventory-queue: Stock updates, PO/GRN processing
- notifications-queue: Push notifications, WhatsApp messages
- pdf-queue: PDF generation
- reports-queue: Report generation

**Workers**: accounting.worker.ts, inventory.worker.ts, notifications.worker.ts, pdf.worker.ts, reports.worker.ts

## 6.5 Real-time Communication

**Socket.IO**:
- Rooms: tenant:{tenantId}, user:{userId}
- Events: booking:created, booking:updated, invoice:created, payment:received, notification:new

## 6.6 External Integrations

**Firebase Cloud Messaging**: Push notifications
**WhatsApp Business API**: Notifications
**AI Assistant**: NLP queries

## 6.7 Monitoring

**Prometheus**: Request counts, response times, queue sizes, DB connections, error rates
**Bull Board**: Queue monitoring UI

## 6.8 Security

**Authentication**: JWT with bcryptjs
**Authorization**: RBAC with permissions
**Branch Isolation**: Branch isolation middleware
**Audit Logging**: Audit log middleware
**CORS**: Configured for development
**Rate Limiting**: express-rate-limit
**Input Validation**: express-validator

---

# PHASE 7: MISSING COMPONENTS

## 7.1 Architecture Inconsistencies

**Hybrid Architecture**: Duplicate implementations in Clean Architecture and Modular Monolith
**Empty Directories**: customer-tracking/, hr/, inventory/, journal/, tenants/
**Mixed Routes**: interfaces/http/routes/ vs api/routes/

## 7.2 Missing Clean Architecture Components

**Domain Layer**: Missing explicit aggregate roots, domain services, repository interfaces
**Application Layer**: Missing Command/Query Bus (CQRS), validation layer, transaction management
**Infrastructure Layer**: Missing event bus, repository-level caching, Unit of Work pattern

## 7.3 Missing Features

**Frontend**: Offline support, PWA, full i18n, accessibility, error boundaries
**Backend**: API versioning, OpenAPI/Swagger docs, structured logging, deep health checks, graceful shutdown, circuit breaker, retry logic
**Testing**: Minimal unit tests, no integration tests, no E2E tests, no contract tests
**DevOps**: No CI/CD, no IaC, secrets in .env, no log aggregation, no APM

## 7.4 Data Integrity Issues

Missing database check constraints, unique constraints on critical fields, foreign key cascading rules, composite indexes, full-text search indexes, partial indexes

## 7.5 Security Gaps

No MFA, no password strength enforcement, no account lockout, no session timeout, no ABAC, no RLS in database, no API key auth, no field-level encryption, no data masking, no GDPR compliance

## 7.6 Performance Issues

No connection pooling config visible, N+1 queries likely, no read replica, no DB partitioning, no app-level caching, no CDN, no browser caching, no pagination on list endpoints, no field selection, no bulk operations

## 7.7 Business Logic Gaps

**Accounting**: No multi-currency in journal entries, no recurring entries, no budget management, no cost center allocation, no inter-company transactions
**Inventory**: No serial number tracking, no expiry date tracking, no batch/lot management, no minimum order quantity, no lead time tracking
**HR**: No leave management, no timesheet tracking, no performance reviews, no training management
**Reporting**: No scheduled reports, no report templates, no custom report builder (partial), no dashboard customization

---

# PHASE 8: FINAL BLUEPRINT

## 8.1 Recommended Architecture: Pure Clean Architecture

### Rationale
Eliminate hybrid pattern confusion, provide better separation of concerns, testability, and maintainability.

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
│   │   ├── mechanics/              # Mechanics bounded context
│   │   ├── hr/                     # HR bounded context (NEW)
│   │   ├── maintenance/            # Maintenance bounded context (NEW)
│   │   ├── notifications/          # Notifications bounded context (NEW)
│   │   ├── reporting/              # Reporting bounded context (NEW)
│   │   └── rbac/                   # RBAC bounded context (NEW)
│   │
│   ├── application/                # Application logic (orchestration)
│   │   ├── shared/                 # Shared application logic
│   │   │   ├── commands/           # Command DTOs
│   │   │   ├── queries/            # Query DTOs
│   │   │   ├── validators/         # Request validators
│   │   │   ├── mappers/            # DTO to entity mappers
│   │   │   └── command-bus/        # NEW: Command bus
│   │   │   └── query-bus/          # NEW: Query bus
│   │   ├── accounting/             # Accounting use cases
│   │   │   ├── commands/           # Command handlers
│   │   │   ├── queries/            # Query handlers
│   │   │   └── use-cases/          # Use case implementations
│   │   ├── bookings/               # Bookings use cases
│   │   ├── customers/              # Customers use cases
│   │   ├── inventory/              # Inventory use cases
│   │   ├── invoices/               # Invoices use cases
│   │   ├── vehicles/               # Vehicles use cases
│   │   ├── mechanics/              # Mechanics use cases
│   │   ├── hr/                     # HR use cases (NEW)
│   │   ├── maintenance/            # Maintenance use cases (NEW)
│   │   ├── notifications/          # Notifications use cases (NEW)
│   │   ├── reporting/              # Reporting use cases (NEW)
│   │   └── rbac/                   # RBAC use cases (NEW)
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
│   │   │   ├── invoices/
│   │   │   ├── vehicles/
│   │   │   ├── mechanics/
│   │   │   ├── hr/
│   │   │   ├── maintenance/
│   │   │   ├── notifications/
│   │   │   ├── reporting/
│   │   │   └── rbac/
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
│   │   ├── unit-of-work/           # NEW: Unit of Work
│   │   │   └── unit-of-work.ts
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
│   │   │   ├── dto/                # Response DTOs
│   │   │   └── openapi/            # NEW: OpenAPI/Swagger
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
│   │   ├── whatsapp.ts
│   │   └── ai.ts
│   │
│   ├── shared/                     # Shared utilities
│   │   ├── utils/                  # Utility functions
│   │   ├── constants/              # Constants
│   │   ├── types/                  # Shared types
│   │   └── helpers/               # Helper functions
│   │
│   └── server.ts                   # Application entry point
```

## 8.2 Migration Strategy

**Phase 1**: Create new Clean Architecture structure alongside existing code
**Phase 2**: Migrate one bounded context at a time (start with accounting)
**Phase 3**: Update tests for migrated contexts
**Phase 4**: Remove old modules/ directory
**Phase 5**: Update API routes to use new use cases
**Phase 6**: Full integration testing

## 8.3 Key Improvements

1. **Remove modules/**: Consolidate all business logic into Clean Architecture layers
2. **Add Aggregates**: Explicit aggregate root definitions
3. **Add Domain Services**: Business logic not tied to entities
4. **Add Repository Interfaces**: Domain layer defines contracts
5. **Add Event Bus**: Proper event-driven architecture
6. **Add Caching Layer**: Repository-level caching
7. **Add Unit of Work**: Transaction management
8. **Add Command/Query Bus**: CQRS pattern
9. **Add Validation Layer**: Dedicated validation
10. **Add OpenAPI**: API documentation

---

**End of Master Architecture Blueprint**
