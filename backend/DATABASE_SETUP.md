# Database Setup Instructions

## New Models Added

The following new models have been added to `prisma/schema.prisma`:

1. **NotificationRule** - For managing notification rules and triggers
2. **Report** - For report generation and storage
3. **DataExport** - For data export operations
4. **Expense** - For expense tracking

## Required Steps

### 1. Start PostgreSQL Database
Make sure PostgreSQL is running on `localhost:5433` with database `garage_master`.

### 2. Apply Schema Changes
Run one of the following commands:

```bash
# Option 1: Push schema directly (recommended for development)
npx prisma db push

# Option 2: Create and run migration (recommended for production)
npx prisma migrate dev --name add_notification_reporting_expense_models
```

### 3. Regenerate Prisma Client
```bash
npx prisma generate
```

### 4. Verify Services
After running the above commands, the following services will work with the database:
- `backend/src/modules/notifications/notification-rules.service.ts`
- `backend/src/modules/reporting/reports.service.ts`
- `backend/src/modules/data/data-export.service.ts`
- `backend/src/modules/expenses/expense-management.service.ts`

## Current Status

- ✅ Schema models added to `prisma/schema.prisma`
- ✅ Services updated to use Prisma (with @ts-ignore for now)
- ⏳ Waiting for database connection to apply changes
- ⏳ Waiting for Prisma Client regeneration

## After Database Setup

Once the database is connected and changes are applied:
1. Remove `@ts-ignore` comments from services
2. Verify all services work correctly
3. Test the new functionality
