# AUTO_Renew - Comprehensive Project Exploration Report

**Date:** June 10, 2026  
**Project:** Auto Garage Management System  
**Location:** `C:\Users\FIX 11\projects\AUTO_Renew\`

---

## 📋 Executive Summary

AUTO_Renew is a full-stack automotive service management system built with:
- **Backend:** TypeScript/Node.js with Clean Architecture
- **Admin Frontend:** Flutter Web for garage staff
- **Mechanic App:** Flutter Mobile for mechanics
- **Customer Frontend:** Static HTML/JS for customer tracking
- **Database:** PostgreSQL with Prisma ORM

---

## 🏗️ Project Structure

### Root Directory
```
AUTO_Renew/
├── backend/              # TypeScript/Node.js backend
├── admin_frontend/      # Flutter Web admin interface
├── mechanic_app/        # Flutter Mobile app for mechanics
├── customer_frontend/   # Static HTML/JS customer portal
├── apps/                # Additional apps (technician_app)
├── docs/                # Documentation
├── scripts/             # Setup and deployment scripts
├── subagents/           # Python automation agents
├── docker-compose.yml   # Docker orchestration
└── [Multiple report files]
```

---

## 🔧 Backend Architecture

### Technology Stack
- **Language:** TypeScript
- **Runtime:** Node.js
- **Architecture:** Clean Architecture (Domain, Application, Infrastructure, Presentation)
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** JWT-based with roles (ADMIN, MANAGER, RECEPTIONIST, MECHANIC)

### Directory Structure
```
backend/
├── src/
│   ├── api/                    # API layer
│   │   ├── controllers/        # API controllers
│   │   │   ├── accounting/
│   │   │   │   └── accounting.controller.ts
│   │   │   ├── ai/
│   │   │   │   └── ai.controller.ts
│   │   │   ├── analytics/
│   │   │   │   └── analytics.controller.ts
│   │   │   ├── auth/
│   │   │   │   └── auth.controller.ts
│   │   │   ├── audit.controller.ts
│   │   │   ├── bookings/
│   │   │   │   └── booking.controller.ts
│   │   │   ├── branch/
│   │   │   │   ├── branches.controller.ts
│   │   │   │   ├── consolidated-reports.controller.ts
│   │   │   │   ├── inventory-transfer.controller.ts
│   │   │   │   └── warehouses.controller.ts
│   │   │   ├── customers/
│   │   │   │   └── customer.controller.ts
│   │   │   ├── health.controller.ts
│   │   │   ├── insights/
│   │   │   │   ├── insights.controller.ts
│   │   │   │   └── insights.service.ts
│   │   │   ├── inventory/
│   │   │   │   └── inventory.controller.ts
│   │   │   ├── invoices/
│   │   │   │   └── invoice.controller.ts
│   │   │   ├── loyalty/
│   │   │   │   └── loyalty.controller.ts
│   │   │   ├── membership/
│   │   │   │   ├── customer-memberships.controller.ts
│   │   │   │   └── membership-plans.controller.ts
│   │   │   ├── notifications/
│   │   │   │   └── notifications.controller.ts
│   │   │   ├── public/
│   │   │   │   └── tracking.controller.ts
│   │   │   ├── rbac/
│   │   │   │   ├── permissions.controller.ts
│   │   │   │   └── roles.controller.ts
│   │   │   ├── settings/
│   │   │   │   └── settings.controller.ts
│   │   │   ├── vehicles/
│   │   │   │   └── vehicle.controller.ts
│   │   │   ├── wallet/
│   │   │   │   └── wallet.controller.ts
│   │   │   └── workorders/
│   │   │       └── workorder.controller.ts
│   │   ├── middlewares/        # API middlewares (7 files)
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   ├── logging.middleware.ts
│   │   │   ├── rate-limit.middleware.ts
│   │   │   ├── sanitization.middleware.ts
│   │   │   ├── security.middleware.ts
│   │   │   └── validation.middleware.ts
│   │   ├── routes/             # API routes (21 files)
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
│   │   └── services/           # API services (4 files)
│   │       ├── cache.service.ts
│   │       ├── jwt.service.ts
│   │       ├── whatsapp-templates.ts
│   │       └── whatsapp.service.ts
│   ├── application/            # Application logic (CQRS pattern)
│   │   ├── accounting/        # Empty structure (commands, dto, handlers, interfaces, queries, use-cases)
│   │   ├── auth/              # Empty structure (commands, dto, handlers, interfaces, queries, use-cases)
│   │   ├── bookings/          # Empty structure (commands, dto, handlers, interfaces, queries, use-cases)
│   │   ├── customer-tracking/ # Empty structure (interfaces, use-cases)
│   │   ├── customers/         # Empty structure (commands, dto, handlers, interfaces, queries, use-cases)
│   │   ├── inventory/         # Empty structure (commands, dto, handlers, interfaces, queries, use-cases)
│   │   ├── invoices/          # Empty structure (commands, dto, handlers, interfaces, queries, use-cases)
│   │   └── vehicles/          # Empty structure (commands, dto, handlers, interfaces, queries, use-cases)
│   ├── config/                 # Configuration
│   │   ├── database.ts
│   │   ├── env-validation.ts
│   │   └── redis.ts
│   ├── domain/                 # Domain models (DDD pattern)
│   │   ├── accounting/        # Empty structure (entities, events, value-objects)
│   │   ├── auth/              # Empty structure (entities, events, value-objects)
│   │   ├── bookings/          # Empty structure (entities, events, value-objects)
│   │   ├── customer-tracking/ # Empty directory
│   │   ├── customers/         # Empty structure (entities, events, value-objects)
│   │   ├── inventory/         # Empty structure (entities, events, value-objects)
│   │   ├── invoices/          # Empty structure (entities, events, value-objects)
│   │   ├── mechanics/         # Empty structure (entities, events, value-objects)
│   │   └── vehicles/          # Empty structure (entities, events, value-objects)
│   ├── infrastructure/         # Infrastructure layer
│   │   ├── auth/              # Empty structure (repositories, services)
│   │   ├── bookings/          # Empty structure (repositories)
│   │   ├── customer-tracking/ # Empty structure (repositories)
│   │   ├── customers/         # Empty structure (repositories)
│   │   ├── database/
│   │   │   └── prisma.service.ts
│   │   ├── errors/            # Error classes (3 files)
│   │   │   ├── business-rule-error.ts
│   │   │   ├── database-error.ts
│   │   │   └── not-found-error.ts
│   │   ├── inventory/         # Empty structure (repositories)
│   │   ├── invoices/          # Empty structure (repositories)
│   │   ├── logging/           # Logging utilities (2 files)
│   │   │   ├── audit-log.ts
│   │   │   └── logger.ts
│   │   ├── repositories/      # Repository interfaces (7 folders, empty)
│   │   │   ├── accounting/
│   │   │   ├── auth/
│   │   │   ├── bookings/
│   │   │   ├── customers/
│   │   │   ├── inventory/
│   │   │   ├── invoices/
│   │   │   └── vehicles/
│   │   ├── services/           # Infrastructure services (2 files)
│   │   │   ├── qr-generator.service.ts
│   │   │   └── tracking-resolver.ts
│   │   └── vehicles/          # Empty structure (repositories)
│   ├── interfaces/             # Interfaces
│   │   └── http/
│   │       ├── controllers/    # HTTP controllers (20 files)
│   │       │   ├── AuthController.ts
│   │       │   ├── booking-approval.controller.ts
│   │       │   ├── booking-image.controller.ts
│   │       │   ├── booking-service.controller.ts
│   │       │   ├── booking.controller.ts
│   │       │   ├── customer-vehicle.controller.ts
│   │       │   ├── customer.controller.ts
│   │       │   ├── customerTracking.controller.ts
│   │       │   ├── grn.controller.ts
│   │       │   ├── invoice-item.controller.ts
│   │       │   ├── invoice.controller.ts
│   │       │   ├── movement.controller.ts
│   │       │   ├── part.controller.ts
│   │       │   ├── payment.controller.ts
│   │       │   ├── po.controller.ts
│   │       │   ├── stock.controller.ts
│   │       │   ├── vehicle-brand.controller.ts
│   │       │   ├── vehicle-model.controller.ts
│   │       │   └── vehicle.controller.ts
│   │       ├── middlewares/     # HTTP middlewares
│   │       │   └── auth.middleware.ts
│   │       └── routes/         # HTTP routes (20 files)
│   │           ├── auth.routes.ts
│   │           ├── booking-approval.routes.ts
│   │           ├── booking-image.routes.ts
│   │           ├── booking-service.routes.ts
│   │           ├── booking.routes.ts
│   │           ├── customer-vehicle.routes.ts
│   │           ├── customer.routes.ts
│   │           ├── customerTracking.routes.ts
│   │           ├── grn.routes.ts
│   │           ├── invoice-item.routes.ts
│   │           ├── invoice.routes.ts
│   │           ├── movement.routes.ts
│   │           ├── part.routes.ts
│   │           ├── payment.routes.ts
│   │           ├── po.routes.ts
│   │           ├── stock.routes.ts
│   │           ├── vehicle-brand.routes.ts
│   │           ├── vehicle-model.routes.ts
│   │           └── vehicle.routes.ts
│   ├── middleware/             # Global middleware
│   │   ├── audit.middleware.ts
│   │   ├── branch-isolation.middleware.ts
│   │   └── permission.middleware.ts
│   ├── modules/                # Feature modules
│   │   ├── accounting/        # Accounting services
│   │   ├── accounts/          # Chart of accounts
│   │   ├── analytics/         # Analytics dashboard
│   │   ├── attendance/        # Employee attendance
│   │   ├── auth/              # Authentication
│   │   ├── benefits/          # Employee benefits
│   │   ├── bookings/          # Service bookings
│   │   ├── branch/            # Branch management
│   │   ├── cheques/           # Cheque management
│   │   ├── currencies/       # Multi-currency
│   │   ├── customers/         # Customer management
│   │   ├── dashboard/         # Dashboard
│   │   ├── data-exports/      # Data export
│   │   ├── departments/       # HR departments
│   │   ├── employees/         # Employee management
│   │   ├── expenses/          # Expense management
│   │   ├── fcm/               # Firebase Cloud Messaging
│   │   ├── financial/         # Financial services
│   │   ├── fiscal-periods/    # Fiscal periods
│   │   ├── grn/               # Goods Received Notes
│   │   ├── hr/                # HR module
│   │   ├── installments/      # Installment management
│   │   ├── inventory/         # Inventory management
│   │   ├── inventory-count/   # Inventory counting
│   │   ├── inventory-transactions/
│   │   ├── inventory-transfer/
│   │   ├── invoices/          # Invoice management
│   │   ├── journal/           # Journal entries
│   │   ├── journal-entries/   # Journal entries (v2)
│   │   ├── loyalty/           # Customer loyalty
│   │   ├── maintenance/       # Maintenance logs
│   │   ├── mechanicAssignments/
│   │   ├── membership/        # Membership plans
│   │   ├── notification-rules/
│   │   ├── notifications/     # Notifications
│   │   ├── part-categories/   # Parts categories
│   │   ├── parts/             # Parts management
│   │   ├── payments/          # Payment processing
│   │   ├── payroll/           # Payroll management
│   │   ├── public/            # Public endpoints
│   │   ├── purchase-orders/   # Purchase orders
│   │   ├── reporting/         # Reports
│   │   ├── reports/           # Reports (v2)
│   │   ├── reports-advanced/  # Advanced reports
│   │   ├── reports-new/       # New reports
│   │   ├── schedule/          # Scheduling
│   │   ├── services/          # Service catalog
│   │   ├── shifts/            # Shift management
│   │   ├── suppliers/         # Supplier management
│   │   ├── tenants/           # Multi-tenancy
│   │   ├── users/             # User management
│   │   ├── vehicles/          # Vehicle management
│   │   ├── wallet/            # Wallet management
│   │   ├── warehouse/         # Warehouse management
│   │   ├── warehouses/        # Warehouses (v2)
│   │   └── whatsapp/          # WhatsApp integration
│   ├── config/                # Configuration
│   │   ├── database.ts
│   │   ├── env-validation.ts
│   │   └── redis.ts
│   ├── interfaces/            # Interfaces
│   │   └── http/
│   │       ├── controllers/
│   │       ├── middlewares/
│   │       └── routes/
│   ├── middleware/            # Global middleware
│   │   ├── audit.middleware.ts
│   │   ├── branch-isolation.middleware.ts
│   │   └── permission.middleware.ts
│   ├── queues/                # Job queues
│   │   ├── queue.config.ts
│   │   └── queue.service.ts
│   ├── server.ts              # Main server entry
│   ├── services/              # Shared services
│   │   ├── ai.service.ts
│   │   ├── analytics.service.ts
│   │   ├── audit.service.ts
│   │   └── settings.service.ts
│   ├── shared/                # Shared utilities
│   │   ├── middlewares/
│   │   │   ├── auth.ts
│   │   │   └── tenant.ts
│   │   └── utils/
│   │       ├── auth.ts
│   │       ├── cache.ts
│   │       ├── circuit-breaker.ts
│   │       ├── file-upload.ts
│   │       ├── graceful-shutdown.ts
│   │       └── retry.ts
│   └── workers/               # Background workers
│       ├── accounting.worker.ts
│       ├── inventory.worker.ts
│       ├── notifications.worker.ts
│       ├── pdf.worker.ts
│       └── reports.worker.ts
├── prisma/                    # Database schema
│   ├── migrations/            # 23 migrations
│   ├── schema.prisma
│   ├── schema.prisma.backup
│   ├── schema_updated.prisma
│   ├── seed.ts
│   └── views.sql
├── public/                    # Public files
│   └── track/                 # Customer tracking portal
│       ├── app.js
│       ├── index.html
│       └── style.css
├── dist/                      # Compiled output
│   ├── api/
│   ├── application/
│   ├── config/
│   ├── domain/
│   ├── infrastructure/
│   ├── interfaces/
│   ├── middleware/
│   ├── modules/
│   ├── queues/
│   ├── server.d.ts
│   ├── server.d.ts.map
│   ├── server.js
│   ├── server.js.map
│   ├── services/
│   ├── shared/
│   └── workers/
├── graphify-out/              # Graphify output (outdated)
│   ├── .graphify_analysis.json
│   ├── .graphify_semantic_marker
│   ├── cache/
│   │   ├── ast/
│   │   ├── semantic/
│   │   └── stat-index.json
│   ├── graph.json
│   └── manifest.json
├── .github/                   # GitHub workflows
│   └── workflows/
│       └── ci-cd.yml
├── tests/                     # Test files
│   ├── accounting/            # Accounting tests
│   │   ├── accounting-integration.test.ts
│   │   └── automatic-journal-entries.test.ts
│   ├── integration/           # Integration tests
│   │   ├── auth.test.ts
│   │   └── inventory.integration.test.ts
│   ├── reports/               # Reports tests
│   │   ├── reports-api.test.ts
│   │   └── reports-rbac.test.ts
│   ├── services/              # Service tests
│   │   ├── customers.service.test.ts
│   │   ├── grn.service.test.ts
│   │   ├── hr/                 # HR service tests
│   │   │   ├── attendance.service.test.ts
│   │   │   ├── departments.service.test.ts
│   │   │   ├── employees.service.test.ts
│   │   │   └── payroll.service.test.ts
│   │   ├── inventory-transactions.service.test.ts
│   │   ├── parts.service.test.ts
│   │   ├── purchase-orders.service.test.ts
│   │   ├── suppliers.service.test.ts
│   │   └── users.service.test.ts
│   └── setup.ts
├── .env                       # Environment variables
├── .env.example               # Environment variables example
├── .gitignore                 # Git ignore rules
├── DATABASE_SETUP.md          # Database setup guide
├── Dockerfile                 # Docker configuration
├── backend_test_results.csv   # Test results
├── curl_api_test.sh           # API test script
├── jest.config.js             # Jest configuration
├── manual_api_test.ps1        # Manual API test script
├── seed-rbac-data.ts          # RBAC seed data
├── test_frontend_backend_compatibility.ps1 # Compatibility test
├── test_frontend_backend_compatibility.sh   # Compatibility test
├── package.json
└── tsconfig.json
```

### Key Backend Modules (60+ modules with all files)

**accounting** - Accounting services (8 files)
- automatic-journal-entries.ts (33715 bytes)
- budget-analysis.service.ts (7973 bytes)
- budget.service.ts (6853 bytes)
- cost-allocation.service.ts (7952 bytes)
- cost-center.service.ts (5934 bytes)
- multi-currency-journal.service.ts (9486 bytes)
- tax-calculation.service.ts (8082 bytes)
- tax-rate.service.ts (5222 bytes)

**accounts** - Chart of accounts (4 files)
- controller.ts (4819 bytes)
- routes.ts (1223 bytes)
- service.ts (10130 bytes)
- types.ts (1301 bytes)

**analytics** - Analytics dashboard (1 file)
- dashboard-analytics.service.ts (8514 bytes)

**attendance** - Employee attendance (4 files)
- controller.ts (4903 bytes)
- routes.ts (1699 bytes)
- service.ts (10892 bytes)
- types.ts (556 bytes)

**auth** - Authentication (1 file)
- routes.ts (6880 bytes)

**benefits** - Employee benefits (1 file)
- benefits.service.ts (7576 bytes)

**bookings** - Service bookings (4 files)
- controller.ts (4786 bytes)
- routes.ts (2656 bytes)
- service.ts (21542 bytes)
- types.ts (1471 bytes)

**branch** - Branch management (3 files)
- branch.service.ts (3271 bytes)
- controller.ts (3117 bytes)
- routes.ts (1311 bytes)

**cheques** - Cheque management (4 files)
- controller.ts (9828 bytes)
- routes.ts (2787 bytes)
- service.ts (18104 bytes)
- types.ts (2368 bytes)

**currencies** - Multi-currency (4 files)
- controller.ts (10075 bytes)
- routes.ts (2087 bytes)
- service.ts (11593 bytes)
- types.ts (1320 bytes)

**currency** - Currency conversion (1 file)
- currency-conversion.service.ts (8999 bytes)

**customers** - Customer management (4 files)
- controller.ts (4399 bytes)
- routes.ts (1725 bytes)
- service.ts (5984 bytes)
- types.ts (626 bytes)

**dashboard** - Dashboard (2 files)
- controller.ts (1987 bytes)
- routes.ts (495 bytes)

**data** - Data export (1 file)
- data-export.service.ts (11988 bytes)

**data-exports** - Data exports (2 files)
- controller.ts (2579 bytes)
- routes.ts (1533 bytes)

**departments** - HR departments (4 files)
- controller.ts (2973 bytes)
- routes.ts (1200 bytes)
- service.ts (4690 bytes)
- types.ts (536 bytes)

**employees** - Employee management (4 files)
- controller.ts (3852 bytes)
- routes.ts (1655 bytes)
- service.ts (10872 bytes)
- types.ts (1364 bytes)

**expenses** - Expense management (3 files)
- controller.ts (4072 bytes)
- expense-management.service.ts (10180 bytes)
- routes.ts (2155 bytes)

**fcm** - Firebase Cloud Messaging (4 files)
- controller.ts (6395 bytes)
- routes.ts (2487 bytes)
- service.ts (9180 bytes)
- types.ts (1139 bytes)

**financial** - Financial services (7 files)
- balance-sheet.service.ts (7885 bytes)
- cash-flow.service.ts (15746 bytes)
- export.service.ts (6527 bytes)
- fiscal-period.service.ts (8870 bytes)
- income-statement.service.ts (11818 bytes)
- statement-comparison.service.ts (10321 bytes)
- trial-balance.service.ts (10308 bytes)

**fiscal-periods** - Fiscal periods (4 files)
- controller.ts (6385 bytes)
- routes.ts (1659 bytes)
- service.ts (9488 bytes)
- types.ts (827 bytes)

**grn** - Goods Received Notes (4 files)
- controller.ts (5660 bytes)
- routes.ts (1250 bytes)
- service.ts (16795 bytes)
- types.ts (2006 bytes)

**hr** - HR (empty)

**installments** - Installment management (4 files)
- controller.ts (8079 bytes)
- routes.ts (2526 bytes)
- service.ts (22564 bytes)
- types.ts (2426 bytes)

**inventory** - Inventory (empty)

**inventory-count** - Inventory counting (4 files)
- controller.ts (7200 bytes)
- routes.ts (1918 bytes)
- service.ts (15298 bytes)
- types.ts (2067 bytes)

**inventory-transfer** - Inventory transfer (1 file)
- inventory-transfer.service.ts (6946 bytes)

**inventory-transactions** - Inventory transactions (4 files)
- controller.ts (7415 bytes)
- routes.ts (2418 bytes)
- service.ts (17546 bytes)
- types.ts (1608 bytes)

**invoices** - Invoice management (4 files)
- controller.ts (8503 bytes)
- routes.ts (2481 bytes)
- service.ts (23891 bytes)
- types.ts (1987 bytes)

**journal** - Journal (empty)

**journal-entries** - Journal entries (4 files)
- controller.ts (4965 bytes)
- routes.ts (1199 bytes)
- service.ts (13459 bytes)
- types.ts (1824 bytes)

**loyalty** - Customer loyalty (5 files)
- controller.ts (6572 bytes)
- loyalty.service.ts (4280 bytes)
- routes.ts (2358 bytes)
- service.ts (11166 bytes)
- types.ts (2376 bytes)

**maintenance** - Maintenance logs (4 files)
- controller.ts (10274 bytes)
- routes.ts (2539 bytes)
- service.ts (12990 bytes)
- types.ts (2663 bytes)

**mechanicAssignments** - Mechanic assignments (4 files)
- controller.ts (3749 bytes)
- routes.ts (2135 bytes)
- service.ts (9657 bytes)
- types.ts (798 bytes)

**membership** - Membership plans (2 files)
- membership.cron.ts (1081 bytes)
- membership.service.ts (11190 bytes)

**notification-rules** - Notification rules (2 files)
- controller.ts (2216 bytes)
- routes.ts (1590 bytes)

**notifications** - Notifications (7 files)
- controller.ts (4675 bytes)
- in-app-notification.service.ts (6222 bytes)
- notification-rules.service.ts (13762 bytes)
- routes.ts (2353 bytes)
- service.ts (5600 bytes)
- types.ts (709 bytes)
- whatsapp-notification.service.ts (6518 bytes)

**part-categories** - Parts categories (4 files)
- controller.ts (2922 bytes)
- routes.ts (1516 bytes)
- service.ts (6192 bytes)
- types.ts (689 bytes)

**parts** - Parts management (4 files)
- controller.ts (4612 bytes)
- routes.ts (1776 bytes)
- service.ts (8218 bytes)
- types.ts (1691 bytes)

**payments** - Payment processing (5 files)
- controller.ts (4661 bytes)
- payment-processing.service.ts (4659 bytes)
- routes.ts (1106 bytes)
- service.ts (9225 bytes)
- types.ts (1160 bytes)

**payroll** - Payroll management (4 files)
- controller.ts (4606 bytes)
- routes.ts (1803 bytes)
- service.ts (17391 bytes)
- types.ts (1343 bytes)

**public** - Public endpoints (4 files)
- controller.ts (1768 bytes)
- routes.ts (519 bytes)
- service.ts (7578 bytes)
- types.ts (3115 bytes)

**purchase-orders** - Purchase orders (4 files)
- controller.ts (6352 bytes)
- routes.ts (2249 bytes)
- service.ts (20773 bytes)
- types.ts (1963 bytes)

**reporting** - Reporting services (9 files)
- aging-reports.service.ts (7796 bytes)
- cost-analysis.service.ts (9552 bytes)
- kpi-calculation.service.ts (8785 bytes)
- kpi-definitions.service.ts (8596 bytes)
- margin-analysis.service.ts (10379 bytes)
- report-scheduler.service.ts (9010 bytes)
- reports.service.ts (12325 bytes)
- revenue-trend.service.ts (8899 bytes)
- service-profitability.service.ts (9810 bytes)

**reports** - Reports (5 files)
- controller.ts (15334 bytes)
- profitability.controller.ts (2689 bytes)
- profitability.service.ts (13234 bytes)
- routes.ts (4738 bytes)
- service.ts (45957 bytes)
- types.ts (6274 bytes)

**reports-advanced** - Advanced reports (4 files)
- controller.ts (6142 bytes)
- routes.ts (1309 bytes)
- service.ts (22397 bytes)
- types.ts (4878 bytes)

**reports-new** - New reports (2 files)
- controller.ts (2566 bytes)
- routes.ts (1503 bytes)

**schedule** - Scheduling (3 files)
- routes.ts (1177 bytes)
- schedule.controller.ts (4535 bytes)
- schedule.service.ts (9805 bytes)

**services** - Service catalog (4 files)
- controller.ts (4876 bytes)
- routes.ts (1488 bytes)
- service.ts (6910 bytes)
- types.ts (966 bytes)

**shifts** - Shift management (4 files)
- controller.ts (2728 bytes)
- routes.ts (1236 bytes)
- service.ts (4426 bytes)
- types.ts (491 bytes)

**suppliers** - Supplier management (4 files)
- controller.ts (2968 bytes)
- routes.ts (1266 bytes)
- service.ts (7207 bytes)
- types.ts (1076 bytes)

**tenants** - Multi-tenancy (empty)

**users** - User management (4 files)
- controller.ts (2701 bytes)
- routes.ts (1075 bytes)
- service.ts (4819 bytes)
- types.ts (671 bytes)

**vehicles** - Vehicle management (7 files)
- analytics.controller.ts (1471 bytes)
- analytics.service.ts (2458 bytes)
- controller.ts (3815 bytes)
- routes.ts (4429 bytes)
- service.ts (7226 bytes)
- types.ts (827 bytes)
- vehicle.controller.ts (6943 bytes)
- vehicle.service.ts (6273 bytes)

**wallet** - Wallet management (1 file)
- wallet.service.ts (1810 bytes)

**warehouse** - Warehouse (old) (1 file)
- warehouse.service.ts (4755 bytes)

**warehouses** - Warehouses (new) (4 files)
- controller.ts (2832 bytes)
- routes.ts (1340 bytes)
- service.ts (5839 bytes)
- types.ts (679 bytes)

**whatsapp** - WhatsApp integration (5 files)
- README.md (2625 bytes)
- controller.ts (8720 bytes)
- routes.ts (3708 bytes)
- service.ts (10414 bytes)
- types.ts (1217 bytes)

#### Core Business Modules
- **Bookings:** Service booking management
- **Customers:** Customer management and tracking
- **Vehicles:** Vehicle information and analytics
- **Services:** Service catalog management
- **Invoices:** Invoice generation and management
- **Payments:** Payment processing
- **Inventory:** Parts and inventory management
- **Employees:** HR and employee management
- **Journal Entries:** Financial journal entries

---

## 🖥️ Admin Frontend (Flutter Web)

### Technology Stack
- **Framework:** Flutter Web
- **State Management:** Riverpod
- **UI:** Custom modern theme with glassmorphism
- **Architecture:** Modular with clean separation

### Directory Structure
```
admin_frontend/
├── lib/
│   ├── main.dart              # App entry point
│   ├── config/               # Configuration files
│   │   ├── api_config.dart
│   │   ├── api_response_config.dart
│   │   ├── api_routes.dart
│   │   ├── env_config.dart
│   │   └── feature_flags.dart
│   ├── core/                 # Core functionality
│   │   ├── router.dart       # App routing
│   │   ├── theme/            # Theme definitions
│   │   │   ├── app_theme.dart
│   │   │   ├── luxury_theme.dart
│   │   │   └── modern_theme.dart
│   │   ├── notification_manager.dart
│   │   └── insights_manager.dart
│   ├── models/               # Data models (18 models)
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
│   ├── modules/              # Feature modules
│   │   ├── accounting/       # Accounting module
│   │   │   ├── screens/      # 21 accounting screens
│   │   │   ├── models/       # 14 accounting models
│   │   │   │   ├── account.dart
│   │   │   │   ├── ar_ap.dart
│   │   │   │   ├── balance_sheet.dart
│   │   │   │   ├── cash_flow.dart
│   │   │   │   ├── cheque.dart
│   │   │   │   ├── currency.dart
│   │   │   │   ├── fiscal_closing.dart
│   │   │   │   ├── fiscal_period.dart
│   │   │   │   ├── income_statement.dart
│   │   │   │   ├── installment.dart
│   │   │   │   ├── journal_entry.dart
│   │   │   │   ├── ledger.dart
│   │   │   │   ├── trial_balance.dart
│   │   │   │   └── vat.dart
│   │   │   ├── services/      # 12 accounting services
│   │   │   │   ├── account_service.dart
│   │   │   │   ├── ar_ap_service.dart
│   │   │   │   ├── balance_sheet_service.dart
│   │   │   │   ├── cash_flow_service.dart
│   │   │   │   ├── export_service.dart
│   │   │   │   ├── fiscal_closing_service.dart
│   │   │   │   ├── income_statement_service.dart
│   │   │   │   ├── journal_entry_service.dart
│   │   │   │   ├── ledger_service.dart
│   │   │   │   ├── report_service.dart
│   │   │   │   ├── trial_balance_service.dart
│   │   │   │   └── vat_service.dart
│   │   │   └── helpers/      # 1 helper
│   │   │       └── export_helper.dart
│   │   ├── dashboard/        # Dashboard module
│   │   │   ├── screens/
│   │   │   ├── models/       # 1 model
│   │   │   │   └── dashboard.dart
│   │   │   └── services/     # 1 service
│   │   │       └── dashboard_service.dart
│   │   ├── hr/               # HR module
│   │   │   ├── screens/      # 10 HR screens
│   │   │   ├── models/       # 5 HR models
│   │   │   │   ├── attendance.dart
│   │   │   │   ├── department.dart
│   │   │   │   ├── employee.dart
│   │   │   │   ├── payroll.dart
│   │   │   │   └── shift.dart
│   │   │   └── services/     # 5 HR services
│   │   │       ├── attendance_service.dart
│   │   │       ├── department_service.dart
│   │   │       ├── employee_service.dart
│   │   │       ├── payroll_service.dart
│   │   │       └── shift_service.dart
│   │   ├── insights/         # Insights module
│   │   │   └── insights_screen.dart
│   │   ├── notifications/    # Notifications
│   │   │   └── notification_center_screen.dart
│   │   ├── part-categories/  # Parts categories (empty structure)
│   │   ├── parts/            # Parts management (empty structure)
│   │   ├── purchase-orders/  # Purchase orders (empty structure)
│   │   ├── suppliers/        # Suppliers (empty structure)
│   │   ├── system/           # System settings (empty structure)
│   │   └── warehouses/       # Warehouse management (empty structure)
│   │   ├── auth/             # Auth module
│   │   │   ├── managers/     # 1 manager
│   │   │   │   └── permission_manager.dart
│   │   │   ├── models/       # 1 model
│   │   │   │   └── permissions.dart
│   │   │   ├── screens/      # 1 screen
│   │   │   │   └── role_assignment_screen.dart
│   │   │   ├── services/     # 1 service
│   │   │   │   └── permission_service.dart
│   │   │   └── widgets/      # 1 widget
│   │   │       └── permission_guard.dart
│   ├── providers/            # Riverpod providers (24 providers)
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
│   ├── screens/              # Standalone screens (90+ screens)
│   ├── utils/                # Utilities
│   │   ├── performance_utils.dart
│   │   └── permission_map.dart
│   └── widgets/              # Reusable widgets
│       ├── app_scaffold.dart
│       ├── elegant_widgets.dart
│       ├── empty_state_widgets.dart
│       ├── feedback_widgets.dart
│       ├── page_transitions.dart
│       ├── search_widgets.dart
│       ├── chart_widgets.dart
│       ├── kpi_widget.dart
│       ├── loading_overlay.dart
│       ├── period_selector.dart
│       └── stat_card.dart
├── assets/                   # Static assets
│   ├── fonts/                # Custom fonts
│   │   ├── .gitkeep
│   │   └── README.md
│   ├── icons/                # Custom icons
│   │   └── .gitkeep
│   ├── images/               # Custom images
│   │   └── .gitkeep
│   └── lottie/               # Lottie animations
│       └── loading.json
├── web/                      # Web-specific files
│   ├── favicon.png
│   ├── icons/                # PWA icons
│   │   ├── Icon-192.png
│   │   ├── Icon-512.png
│   │   ├── Icon-maskable-192.png
│   │   └── Icon-maskable-512.png
│   ├── index.html
│   └── manifest.json
├── build/                    # Build output
│   ├── web/                  # Web build output
│   │   ├── assets/
│   │   ├── canvaskit/
│   │   ├── favicon.png
│   │   ├── flutter.js
│   │   ├── flutter_bootstrap.js
│   │   ├── flutter_service_worker.js
│   │   ├── icons/
│   │   ├── index.html
│   │   ├── main.dart.js
│   │   ├── manifest.json
│   │   └── version.json
│   └── flutter_assets/
├── test/                     # Test files
│   └── widget_test.dart
├── .idea/                    # IDE configuration
│   ├── libraries/
│   │   ├── Dart_SDK.xml
│   │   └── KotlinJavaRuntime.xml
│   ├── modules.xml
│   ├── runConfigurations/
│   │   └── main_dart.xml
│   └── workspace.xml
├── graphify-out/             # Graphify output (outdated)
│   ├── .graphify_analysis.json
│   ├── .graphify_semantic_marker
│   ├── cache/
│   │   ├── ast/
│   │   ├── semantic/
│   │   └── stat-index.json
│   ├── graph.json
│   └── manifest.json
├── .dart_tool/               # Dart tool files
├── .flutter-plugins-dependencies
├── .gitignore
├── .metadata
├── analysis_options.yaml
├── flutter_output.txt
├── garage_go_admin.iml
├── pubspec.lock
└── pubspec.yaml
```

### Key Admin Frontend Screens

#### Accounting Screens (21 screens)
1. `accounting_dashboard_screen.dart` - Accounting dashboard
2. `accounts_tree_screen.dart` - Chart of accounts tree
3. `ar_ap_screen.dart` - Accounts Receivable/Payable
4. `balance_sheet_screen.dart` - Balance sheet
5. `cash_flow_screen.dart` - Cash flow statement
6. `cheques_screen.dart` - Cheque management
7. `currencies_screen.dart` - Currency management
8. `financial_reports_screen.dart` - Financial reports
9. `fiscal_closing_screen.dart` - Fiscal period closing
10. `fiscal_periods_screen.dart` - Fiscal periods
11. `general_ledger_screen.dart` - General ledger
12. `income_statement_screen.dart` - Income statement
13. `installments_screen.dart` - Installment management
14. `journal_entries_screen.dart` - Journal entries list
15. `journal_entry_details_screen.dart` - Journal entry details
16. `journal_entry_form_screen.dart` - Journal entry form
17. `journal_list_screen.dart` - Journal list
18. `manual_journal_entry_screen.dart` - Manual journal entry
19. `trial_balance_screen.dart` - Trial balance
20. `vat_screen.dart` - VAT management

#### HR Screens (10 screens)
1. `attendance_form_screen.dart` - Attendance form
2. `attendance_list_screen.dart` - Attendance list
3. `department_form_screen.dart` - Department form
4. `departments_list_screen.dart` - Departments list
5. `employee_form_screen.dart` - Employee form
6. `employees_list_screen.dart` - Employees list
7. `payroll_form_screen.dart` - Payroll form
8. `payroll_list_screen.dart` - Payroll list
9. `shift_form_screen.dart` - Shift form
10. `shifts_list_screen.dart` - Shifts list

#### Standalone Screens (90+ screens)
1. `add_stock_movement_screen.dart` - Add stock movement
2. `advanced_reports_dashboard.dart` - Advanced reports dashboard
3. `ai_assistant_screen.dart` - AI assistant
4. `analytics_dashboard_screen.dart` - Analytics dashboard
5. `audit_log_screen.dart` - Audit log
6. `booking_create_screen.dart` - Create booking
7. `booking_details_screen.dart` - Booking details
8. `booking_edit_screen.dart` - Edit booking
9. `bookings_screen.dart` - Bookings list
10. `bookings_screen_new.dart` - New bookings list
11. `branches_screen.dart` - Branches management
12. `budget_dashboard_screen.dart` - Budget dashboard
13. `consolidated_reports_screen.dart` - Consolidated reports
14. `cost_center_screen.dart` - Cost center management
15. `create_booking_screen.dart` - Create booking
16. `customer_create_screen.dart` - Create customer
17. `customer_details_screen.dart` - Customer details
18. `customer_edit_screen.dart` - Edit customer
19. `customer_membership_screen.dart` - Customer membership
20. `customer_profit_report_screen.dart` - Customer profit report
21. `customer_wallet_screen.dart` - Customer wallet
22. `customers_screen.dart` - Customers list
23. `customers_screen_new.dart` - New customers list
24. `dashboard_screen.dart` - Main dashboard
25. `dashboard_screen_new.dart` - New dashboard
26. `data_export_screen.dart` - Data export
27. `expense_management_screen.dart` - Expense management
28. `financial_dashboard_screen.dart` - Financial dashboard
29. `hr_attendance_screen.dart` - HR attendance
30. `hr_departments_screen.dart` - HR departments
31. `hr_employees_screen.dart` - HR employees
32. `hr_payroll_screen.dart` - HR payroll
33. `inventory_count_screen.dart` - Inventory count
34. `inventory_report_screen.dart` - Inventory report
35. `inventory_stock_movements_screen.dart` - Stock movements
36. `inventory_transfer_screen.dart` - Inventory transfer
37. `invoice_create_screen.dart` - Create invoice
38. `invoice_details_screen.dart` - Invoice details
39. `invoice_edit_screen.dart` - Edit invoice
40. `invoice_profit_screen.dart` - Invoice profit
41. `invoices_screen_new.dart` - New invoices list
42. `kpi_dashboard_screen.dart` - KPI dashboard
43. `login_screen.dart` - Login
44. `loyalty_points_screen.dart` - Loyalty points
45. `loyalty_screen.dart` - Loyalty management
46. `maintenance_logs_screen.dart` - Maintenance logs
47. `maintenance_templates_screen.dart` - Maintenance templates
48. `mechanics_screen.dart` - Mechanics management
49. `membership_plans_screen.dart` - Membership plans
50. `notification_rules_screen.dart` - Notification rules
51. `notifications_log_screen.dart` - Notifications log
52. `notifications_screen.dart` - Notifications
53. `part_categories_screen.dart` - Part categories
54. `parts_consumption_report_screen.dart` - Parts consumption report
55. `profitability_report_screen.dart` - Profitability report
56. `purchase_order_create_screen.dart` - Create purchase order
57. `purchase_order_details_screen.dart` - Purchase order details
58. `purchase_orders_list_screen.dart` - Purchase orders list
59. `report_builder_screen.dart` - Report builder
60. `role_management_screen.dart` - Role management
61. `schedule_details_screen.dart` - Schedule details
62. `service_categories_screen.dart` - Service categories
63. `service_cost_report_screen.dart` - Service cost report
64. `service_create_screen.dart` - Create service
65. `service_edit_screen.dart` - Edit service
66. `service_packages_screen.dart` - Service packages
67. `service_profit_report_screen.dart` - Service profit report
68. `services_screen.dart` - Services list
69. `settings_screen.dart` - Settings
70. `stock_movements_report_screen.dart` - Stock movements report
71. `supplier_details_screen.dart` - Supplier details
72. `supplier_form_screen.dart` - Supplier form
73. `suppliers_list_screen.dart` - Suppliers list
74. `system_settings_screen.dart` - System settings
75. `tax_management_screen.dart` - Tax management
76. `technician_profit_report_screen.dart` - Technician profit report
77. `technician_schedule_screen.dart` - Technician schedule
78. `vehicle_attachments_screen.dart` - Vehicle attachments
79. `vehicle_categories_screen.dart` - Vehicle categories
80. `vehicle_create_screen.dart` - Create vehicle
81. `vehicle_details_screen.dart` - Vehicle details
82. `vehicle_edit_screen.dart` - Edit vehicle
83. `vehicle_faults_screen.dart` - Vehicle faults
84. `vehicle_history_screen.dart` - Vehicle history
85. `vehicle_recommendations_screen.dart` - Vehicle recommendations
86. `vehicles_screen.dart` - Vehicles list
87. `warehouses_screen.dart` - Warehouses
88. `workshop_screen.dart` - Workshop

#### Services (28 services)
- `api_service.dart` - Base API service
- `auth_service.dart` - Authentication
- `booking_service.dart` - Bookings
- `branches_service.dart` - Branches
- `cheques_service.dart` - Cheques
- `currency_service.dart` - Currencies
- `customer_service.dart` - Customers
- `data_export_service.dart` - Data export
- `expense_management_service.dart` - Expenses
- `fiscal_periods_service.dart` - Fiscal periods
- `in_app_notification_service.dart` - Notifications
- `insights_service.dart` - Insights
- `installment_service.dart` - Installments
- `inventory_count_service.dart` - Inventory count
- `inventory_transaction_service.dart` - Inventory transactions
- `maintenance_service.dart` - Maintenance
- `notification_rules_service.dart` - Notification rules
- `parts_service.dart` - Parts
- `reports_service.dart` - Reports
- `service_service.dart` - Services
- `socket_service.dart` - WebSocket
- `users_roles_service.dart` - Users/Roles
- `vehicle_service.dart` - Vehicles
- `warehouse_service.dart` - Warehouses
- `advanced_reports_service.dart` - Advanced reports

---

## 📱 Mechanic App (Flutter Mobile)

### Technology Stack
- **Framework:** Flutter Mobile
- **State Management:** Riverpod
- **Auth:** Firebase
- **Target:** Android/iOS for mechanics

### Directory Structure
```
mechanic_app/
├── lib/
│   ├── main.dart              # App entry point
│   ├── firebase_options.dart  # Firebase config
│   ├── core/                  # Core functionality
│   │   └── theme/             # Theme definitions
│   │       ├── app_theme.dart
│   │       └── luxury_theme.dart
│   ├── models/                # Data models
│   │   └── booking.dart       # Booking model
│   ├── modules/               # Feature modules (empty)
│   ├── providers/             # Riverpod providers
│   │   └── auth_provider.dart # Auth provider
│   ├── screens/               # Screens
│   │   ├── home_screen.dart   # Home screen
│   │   ├── login_screen.dart  # Login screen
│   │   └── bookings_list_screen.dart # Bookings list
│   ├── services/              # API services
│   │   ├── api_service.dart   # Base API service
│   │   ├── auth_service.dart  # Auth service
│   │   ├── booking_service.dart # Booking service
│   │   └── socket_service.dart # WebSocket service
│   ├── utils/                 # Utilities (empty)
│   └── widgets/               # Reusable widgets
│       └── loading_overlay.dart
├── assets/                   # Static assets
└── pubspec.yaml
```

### Key Mechanic App Screens
1. `login_screen.dart` - Mechanic login
2. `home_screen.dart` - Mechanic dashboard
3. `bookings_list_screen.dart` - Assigned bookings

---

## 🌐 Customer Frontend (Static HTML/JS)

### Technology Stack
- **Framework:** Static HTML/CSS/JavaScript
- **Purpose:** Public customer booking tracking
- **Auth:** Token-based tracking

### Directory Structure
```
customer_frontend/
├── index.html                # Main HTML file
├── css/
│   └── style.css             # Styles
├── js/
│   └── app.js                # Application logic
├── lib/                      # Library files
│   ├── css/                  # CSS libraries
│   │   ├── aos.css           # Animate On Scroll
│   │   └── fontawesome.css   # Font Awesome icons
│   ├── js/                   # JavaScript libraries
│   │   ├── ScrollTrigger.min.js
│   │   ├── aos.js            # Animate On Scroll
│   │   ├── gsap.min.js       # GSAP animation
│   │   ├── lottie.min.js     # Lottie animations
│   │   ├── socket.io.min.js  # Socket.io client
│   │   └── three.min.js      # Three.js 3D library
│   └── README.md
└── assets/                   # Static assets (empty)
```

---

## 📦 Additional Components

### Apps
- `technician_app/` - Flutter app for technicians

#### Technician App Structure
```
technician_app/
├── lib/
│   ├── main.dart              # App entry point
│   ├── models/                # Data models
│   │   ├── booking.dart
│   │   ├── customer.dart
│   │   ├── notification_item.dart
│   │   ├── offline_task.dart
│   │   ├── offline_task.g.dart
│   │   ├── technician.dart
│   │   └── vehicle.dart
│   ├── notifications/         # Notifications
│   │   ├── notifications_provider.dart
│   │   └── notifications_screen.dart
│   ├── offline/               # Offline support
│   │   ├── cache_manager.dart
│   │   ├── local_db.dart
│   │   ├── queue_manager.dart
│   │   └── sync_service.dart
│   ├── providers/             # Riverpod providers
│   │   ├── auth_provider.dart
│   │   └── tasks_provider.dart
│   ├── screens/               # Screens
│   │   ├── add_fault_screen.dart
│   │   ├── login_screen.dart
│   │   ├── task_details_screen.dart
│   │   ├── tasks_screen.dart
│   │   ├── update_status_screen.dart
│   │   └── upload_photos_screen.dart
│   ├── services/              # API services
│   │   ├── api_service.dart
│   │   └── technician_service.dart
│   └── widgets/               # Reusable widgets
│       ├── faults_section.dart
│       ├── offline_indicator.dart
│       ├── parts_section.dart
│       ├── photo_uploader.dart
│       ├── photos_section.dart
│       ├── status_badge.dart
│       └── task_card.dart
├── android/                  # Android platform files
│   ├── app/
│   ├── key.properties
│   └── local.properties
├── assets/                   # Static assets
│   ├── icons/
│   └── splash/
└── pubspec.yaml
```

### Scripts
- `check-docker.ps1` - Docker setup check
- `setup-hetzner.sh` - Hetzner deployment setup

### Subagents (Python Automation)
- `README.md` (3942 bytes)
- `__init__.py` (488 bytes)
- `__pycache__/` - Python cache directory
- `orchestrator.py` (9079 bytes) - Agent orchestrator
- `base_agent.py` (3051 bytes) - Base agent class
- `phase5_financial.py` (6145 bytes) - Financial phase agent
- `phase6_accounting.py` (5618 bytes) - Accounting phase agent
- `phase9_reporting.py` (5701 bytes) - Reporting phase agent

### Subagent Results
- `subagent_results/` - Results from subagent executions
  - `parallel_execution_20260526_230802.json`
  - `phase_5/` (empty)
  - `phase_6/` (empty)
  - `phase_9/` (empty)

### Windsurf Workflows
- `.windsurf/workflows/` - Custom workflows
  - `inventory-transfer.md` (empty)
  - `part-categories.md` (empty)
  - `parts.md` (empty)

### Graphify Output (Outdated)
- `graphify-out/` - Knowledge graph analysis (outdated - May 17)
  - `.graphify_detect.json`
  - `.graphify_labels.json`
  - `.graphify_python`
  - `GRAPH_REPORT.md`
  - `graph.html`
  - `graph.json`
  - `merged-graph.json`

### External Skills
- `skills for ageints/` - External AI skills
  - `marketingskills-main/` - Marketing skills (40+ skill folders)
    - `.claude-plugin/` - Claude plugin config
    - `.github/` - GitHub workflows
      - `ISSUE_TEMPLATE/` - Issue templates
      - `PULL_REQUEST_TEMPLATE/` - PR templates
      - `scripts/` - GitHub scripts
      - `workflows/` - GitHub workflows
    - `skills/` - 40+ marketing skill folders (ab-testing, ads, ai-seo, analytics, aso, churn-prevention, co-marketing, cold-email, community-marketing, competitor-profiling, content-strategy, copy-editing, copywriting, cro, customer-research, directory-submissions, emails, free-tools, image, launch, lead-magnets, marketing-ideas, marketing-psychology, onboarding, paywalls, popups, pricing, product-marketing, programmatic-seo, referrals, revops, sales-enablement, schema, seo-audit, signup, site-architecture, sms, social, video)
    - `tools/` - Marketing tools registry
      - `clis/` - 80+ CLI tool files (activecampaign, adobe-analytics, ahrefs, airops, amplitude, apollo, beehiiv, brevo, buffer, calendly, clay, clearbit, close, coupler, crossbeam, customer-io, dataforseo, demio, dub, exa, g2, ga4, google-ads, google-search-console, hotjar, hunter, instantly, intercom, keywords-everywhere, kit, klaviyo, lemlist, linkedin-ads, livestorm, mailchimp, mention-me, meta-ads, mixpanel, onesignal, optimizely, outreach, paddle, partnerstack, pendo, plausible, postmark, rankparse, resend, rewardful, savvycal, segment, semrush, sendgrid, similarweb, snov, supermetrics, tiktok-ads, tolt, trustpilot, typeform, wistia, zapier, zoominfo)
      - `composio/` - Composio integration docs
      - `integrations/` - 100+ integration documentation files
  - `stop-slop-main/` - Stop/slop prevention
    - `references/` - References
  - `ui-ux-pro-max-skill-main/` - UI/UX skills
    - `.claude/` - Claude config
    - `.claude-plugin/` - Claude plugin
    - `.github/` - GitHub workflows
    - `cli/` - CLI tools
    - `docs/` - Documentation
    - `preview/` - Preview
    - `screenshots/` - Screenshots
    - `src/` - Source code

### Devin Skills
- `.devin/skills/` - Devin AI skills
  - `README.md`
  - `design-system/` - Design system skill
    - `SKILL.md`
  - `ui-ux/` - UI/UX skill
    - `SKILL.md`
  - `writing/` - Writing skill
    - `SKILL.md`

### Documentation
- `FIREBASE_SETUP.md` - Firebase setup guide

### Test Scripts & Results
- `full_regression_test.js` - Full regression test script
- `full_regression_test_results.json` - Full regression test results
- `test_script.js` - Test script
- `test_script_fixed.js` - Fixed test script
- `test_critical_fixes.js` - Critical fixes test script
- `critical_fixes_test_results.json` - Critical fixes test results
- `test_results.json` - Test results
- `flutter_log.txt` - Flutter log file

### Python Scripts
- `run_subagents.py` - Run subagents script
- `run_parallel_subagents.py` - Run parallel subagents script
- `requirements_ai.txt` - AI requirements

### Virtual Environment
- `venv311/` - Python 3.11 virtual environment

### Configuration Files
- `.gitignore` - Git ignore rules
- `docker-compose.yml` - Docker compose configuration
- `docker-compose.override.yml` - Docker compose override
- `nginx.conf` - Nginx configuration
- `prometheus.yml` - Prometheus monitoring configuration

---

## 🎨 UI/UX Enhancements (Recently Completed)

### Phase 1: UI Enhancements
- Glassmorphism implementation (sidebar, topbar, cards)
- Animated navigation with indicators
- Gradient buttons and badges
- Enhanced shadows and colors

### Phase 2: UX Enhancements
- Custom page transitions
- Feedback system (snackbars, toasts, animations)
- Enhanced search UX
- Empty states with illustrations

### Phase 3: Performance Optimization
- Rebuild minimization
- RepaintBoundary optimization
- GPU acceleration
- Layout optimization

---

## 🔐 Security & Permissions

### Permission System
- Permission models (Role, PermissionSet)
- PermissionService and PermissionManager
- Role Assignment screen
- PermissionGuard widget
- Integrated into all accounting screens

### Auth System
- JWT-based authentication
- Role-based access control (RBAC)
- Multi-tenant support

---

## 📊 Database Schema

### Key Entities
- Bookings
- Customers
- Vehicles
- Employees
- Mechanics
- Inventory
- Invoices
- Payments
- Journal Entries
- Accounts (Chart of Accounts)
- Fiscal Periods
- Branches
- Warehouses

---

## 🚀 Deployment

### Docker
- `docker-compose.yml` - Main orchestration
- `docker-compose.override.yml` - Override configuration
- `Dockerfile` - Backend container

### Infrastructure
- Nginx configuration
- Prometheus monitoring
- Hetzner deployment scripts

---

## 📝 Report Files (Documentation)

The project contains extensive documentation in the form of report files:
- Multiple phase delivery reports
- Architecture documentation
- Fix reports
- Test reports
- Enhancement plans

---

## 🔧 Development Tools

### WebSocket Bridge
- Location: `C:\Users\FIX 11\.openclaw\skills\windsurf-swe-bridge\`
- Purpose: Execute shell commands from Windsurf SWE
- Server: `server.js` (port 3030)
- Client: `windsurf-client.js`

---

## 📈 Project Status

### Completed
- ✅ Backend architecture
- ✅ Admin frontend with full accounting module
- ✅ Mechanic app (basic)
- ✅ Customer frontend
- ✅ UI/UX enhancements (3 phases)
- ✅ Permission system
- ✅ WebSocket bridge

### In Progress
- 🔄 Mechanic app modules (empty)
- 🔄 Additional features

---

## 🎯 Key Features

### Core Business Features
1. **Service Booking** - Book vehicle services
2. **Customer Management** - Track customer information
3. **Vehicle Management** - Vehicle records and analytics
4. **Inventory Management** - Parts and inventory tracking
5. **Invoicing** - Generate and manage invoices
6. **Payment Processing** - Handle payments
7. **Accounting** - Full accounting module with journal entries
8. **HR Management** - Employee, attendance, payroll
9. **Multi-branch** - Support multiple locations
10. **Multi-tenant** - Support multiple tenants

### Advanced Features
1. **Automatic Journal Entries** - Auto-generate accounting entries
2. **Multi-currency** - Support multiple currencies
3. **Fiscal Periods** - Fiscal period management
4. **Budget Management** - Budget tracking and analysis
5. **Cost Allocation** - Allocate costs across departments
6. **Tax Calculation** - Automated tax calculations
7. **Financial Reports** - Comprehensive financial reporting
8. **Real-time Notifications** - In-app and push notifications
9. **WebSocket Integration** - Real-time updates
10. **Data Export** - Export data in various formats

---

## 🔗 Integration Points

### External Services
- Firebase (authentication, notifications)
- WhatsApp (messaging)
- Payment gateways
- Email services

### Internal APIs
- REST API for all modules
- WebSocket for real-time updates
- MCP (Model Context Protocol) for AI integration

---

## 📋 Next Steps

### Immediate
1. Complete mechanic app modules
2. Add more customer frontend features
3. Enhance reporting capabilities

### Future
1. Mobile app enhancements
2. Advanced analytics
3. AI-powered insights
4. Enhanced automation

---

## 🎓 Architecture Patterns

### Backend
- Clean Architecture (Domain, Application, Infrastructure, Presentation)
- Service-oriented architecture
- Event-driven (with queues)
- Microservices-ready

### Frontend
- Modular architecture
- Provider pattern (Riverpod)
- Component-based UI
- Responsive design

---

## 📊 Statistics

### Backend
- **Total modules:** 60+
- **Services:** 60+
- **Controllers:** 60+ (20+ in api/controllers + 60+ in modules)
- **Routes:** 60+ (21 in api/routes + 60+ in modules)
- **Middleware:** 10 (3 global + 7 API + 2 shared)
- **Workers:** 5 background workers
- **Prisma migrations:** 23
- **Shared utilities:** 6 utils
- **Shared middlewares:** 2
- **API services:** 4 (cache, jwt, whatsapp-templates, whatsapp)

### Admin Frontend
- **Total screens:** 111+ (21 accounting + 10 HR + 88 standalone + 1 insights + 1 notifications + 1 role_assignment)
- **Services:** 28 (global) + 18 (module-specific) = 46
- **Providers:** 24
- **Widgets:** 12 (global) + 1 (auth) = 13
- **Modules:** 9 (accounting, dashboard, hr, insights, notifications, part-categories, parts, purchase-orders, suppliers, system, warehouses, auth)
- **Models:** 18 (global) + 20 (module-specific) = 38
- **Config files:** 5

### Mechanic App
- **Screens:** 3
- **Services:** 4
- **Providers:** 1
- **Widgets:** 1
- **Themes:** 2

### Technician App
- **Screens:** 6
- **Services:** 2
- **Providers:** 2
- **Widgets:** 7
- **Models:** 7
- **Offline support:** 4 modules

### Customer Frontend
- **Screens:** 1 (index.html)
- **JS files:** 1
- **CSS files:** 1

---

## 🎨 Theme System

### Admin Frontend Themes
1. `app_theme.dart` - Base theme
2. `luxury_theme.dart` - Luxury theme
3. `modern_theme.dart` - Modern theme with glassmorphism

### Theme Features
- Glassmorphism effects
- Gradient buttons
- Animated transitions
- Custom color schemes
- Responsive design

---

## 🔧 Configuration

### Environment Variables
- Database connection
- JWT secrets
- API keys
- Firebase config
- Third-party service credentials

### Configuration Files
- `.env` - Environment variables
- `tsconfig.json` - TypeScript config
- `package.json` - Node.js dependencies
- `pubspec.yaml` - Flutter dependencies

---

## 📝 Notes

### WebSocket Bridge Usage
Always use the WebSocket bridge for shell commands:
```bash
cd "C:\Users\FIX 11\.openclaw\skills\windsurf-swe-bridge"
node windsurf-client.js "<command>"
```

### Project Memory
Key project information is stored in MEMORY[user_global] for reference across sessions.

---

## 🎯 Conclusion

AUTO_Renew is a comprehensive, full-stack automotive service management system with:
- Modern architecture (Clean Architecture, modular design)
- Rich feature set (accounting, HR, inventory, invoicing, etc.)
- Multiple user interfaces (admin web, mechanic mobile, customer portal)
- Advanced features (multi-currency, fiscal periods, automation)
- Extensive documentation and reporting
- Active development with recent UI/UX enhancements

The project is well-structured, scalable, and ready for further development and deployment.
