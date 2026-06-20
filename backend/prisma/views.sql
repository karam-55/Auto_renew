-- Database Views for Auto Renew System
-- These views are created at the database level (not Prisma models)
-- IMPORTANT: Run this SQL after every prisma migrate deploy to ensure views exist
-- Can be executed via: psql -U <user> -d <database> -f prisma/views.sql

-- Drop views if they exist (for recreation)
DROP VIEW IF EXISTS sales_by_service_view;
DROP VIEW IF EXISTS profit_per_booking_view;
DROP VIEW IF EXISTS inventory_valuation_view;

-- 1. Inventory Valuation View
-- Shows current quantity, cost price, and total value for each stock item
CREATE VIEW inventory_valuation_view AS
SELECT 
    p.id,
    p.tenantId,
    p.partNumber,
    p.name,
    p.nameAr,
    p.nameEn,
    p.quantity AS currentQuantity,
    p.costSYP AS unitCostSYP,
    p.costUSD AS unitCostUSD,
    p.sellingPriceSYP AS unitSellingPriceSYP,
    p.sellingPriceUSD AS unitSellingPriceUSD,
    (p.quantity * p.costSYP) AS totalValueSYP,
    (p.quantity * COALESCE(p.costUSD, 0)) AS totalValueUSD,
    p.minQuantity,
    p.categoryId,
    p.supplierId,
    p.location,
    p.isActive,
    p.updatedAt
FROM "Part" p
WHERE p.isActive = true;

-- 2. Profit Per Booking View
-- Shows revenue (from invoices), cost (from stock consumption), and profit for each booking
CREATE VIEW profit_per_booking_view AS
SELECT 
    b.id AS bookingId,
    b.tenantId,
    b.customerId,
    b.vehicleId,
    b.status,
    b.scheduledDate,
    b.createdAt,
    b.actualCompletionDate,
    -- Revenue from invoices
    COALESCE(
        (SELECT SUM(i.totalSYP) 
         FROM "Invoice" i 
         WHERE i.bookingId = b.id AND i.status != 'CANCELLED'), 
        0
    ) AS revenueSYP,
    COALESCE(
        (SELECT SUM(i.totalUSD) 
         FROM "Invoice" i 
         WHERE i.bookingId = b.id AND i.status != 'CANCELLED'), 
        0
    ) AS revenueUSD,
    -- Cost from services (estimated)
    COALESCE(
        (SELECT SUM(bs.priceSYP) 
         FROM "BookingService" bs 
         WHERE bs.bookingId = b.id), 
        0
    ) AS serviceCostSYP,
    COALESCE(
        (SELECT SUM(bs.priceUSD) 
         FROM "BookingService" bs 
         WHERE bs.bookingId = b.id), 
        0
    ) AS serviceCostUSD,
    -- Cost from parts (from invoice items)
    COALESCE(
        (SELECT SUM(ii.quantity * p.costSYP) 
         FROM "InvoiceItem" ii
         JOIN "Part" p ON ii.partId = p.id
         JOIN "Invoice" i ON ii.invoiceId = i.id
         WHERE i.bookingId = b.id AND ii.partId IS NOT NULL), 
        0
    ) AS partsCostSYP,
    COALESCE(
        (SELECT SUM(ii.quantity * COALESCE(p.costUSD, 0)) 
         FROM "InvoiceItem" ii
         JOIN "Part" p ON ii.partId = p.id
         JOIN "Invoice" i ON ii.invoiceId = i.id
         WHERE i.bookingId = b.id AND ii.partId IS NOT NULL), 
        0
    ) AS partsCostUSD,
    -- Total cost
    COALESCE(
        (SELECT SUM(bs.priceSYP) 
         FROM "BookingService" bs 
         WHERE bs.bookingId = b.id), 
        0
    ) + COALESCE(
        (SELECT SUM(ii.quantity * p.costSYP) 
         FROM "InvoiceItem" ii
         JOIN "Part" p ON ii.partId = p.id
         JOIN "Invoice" i ON ii.invoiceId = i.id
         WHERE i.bookingId = b.id AND ii.partId IS NOT NULL), 
        0
    ) AS totalCostSYP,
    COALESCE(
        (SELECT SUM(bs.priceUSD) 
         FROM "BookingService" bs 
         WHERE bs.bookingId = b.id), 
        0
    ) + COALESCE(
        (SELECT SUM(ii.quantity * COALESCE(p.costUSD, 0)) 
         FROM "InvoiceItem" ii
         JOIN "Part" p ON ii.partId = p.id
         JOIN "Invoice" i ON ii.invoiceId = i.id
         WHERE i.bookingId = b.id AND ii.partId IS NOT NULL), 
        0
    ) AS totalCostUSD,
    -- Profit
    COALESCE(
        (SELECT SUM(i.totalSYP) 
         FROM "Invoice" i 
         WHERE i.bookingId = b.id AND i.status != 'CANCELLED'), 
        0
    ) - (
        COALESCE(
            (SELECT SUM(bs.priceSYP) 
             FROM "BookingService" bs 
             WHERE bs.bookingId = b.id), 
            0
        ) + COALESCE(
            (SELECT SUM(ii.quantity * p.costSYP) 
             FROM "InvoiceItem" ii
             JOIN "Part" p ON ii.partId = p.id
             JOIN "Invoice" i ON ii.invoiceId = i.id
             WHERE i.bookingId = b.id AND ii.partId IS NOT NULL), 
            0
        )
    ) AS profitSYP,
    COALESCE(
        (SELECT SUM(i.totalUSD) 
         FROM "Invoice" i 
         WHERE i.bookingId = b.id AND i.status != 'CANCELLED'), 
        0
    ) - (
        COALESCE(
            (SELECT SUM(bs.priceUSD) 
             FROM "BookingService" bs 
             WHERE bs.bookingId = b.id), 
            0
        ) + COALESCE(
            (SELECT SUM(ii.quantity * COALESCE(p.costUSD, 0)) 
             FROM "InvoiceItem" ii
             JOIN "Part" p ON ii.partId = p.id
             JOIN "Invoice" i ON ii.invoiceId = i.id
             WHERE i.bookingId = b.id AND ii.partId IS NOT NULL), 
            0
        )
    ) AS profitUSD
FROM "Booking" b;

-- 3. Sales By Service View
-- Shows usage count and total sales amount for each service
CREATE VIEW sales_by_service_view AS
SELECT 
    s.id AS serviceId,
    s.tenantId,
    s.name,
    s.nameAr,
    s.nameEn,
    s.category,
    s.priceSYP AS unitPriceSYP,
    s.priceUSD AS unitPriceUSD,
    s.isActive,
    -- Count of times service was used
    COUNT(DISTINCT bs.bookingId) AS usageCount,
    -- Total quantity used
    COALESCE(SUM(bs.quantity), 0) AS totalQuantity,
    -- Total sales amount (SYP)
    COALESCE(SUM(bs.priceSYP), 0) AS totalSalesSYP,
    -- Total sales amount (USD)
    COALESCE(SUM(bs.priceUSD), 0) AS totalSalesUSD,
    -- Average price per service (SYP)
    COALESCE(AVG(bs.priceSYP), 0) AS avgPriceSYP,
    -- Average price per service (USD)
    COALESCE(AVG(bs.priceUSD), 0) AS avgPriceUSD,
    -- Last used date
    MAX(b.createdAt) AS lastUsedAt
FROM "Service" s
LEFT JOIN "BookingService" bs ON s.id = bs.serviceId
LEFT JOIN "Booking" b ON bs.bookingId = b.id
WHERE s.isActive = true
GROUP BY s.id, s.tenantId, s.name, s.nameAr, s.nameEn, s.category, s.priceSYP, s.priceUSD, s.isActive;

-- Grant permissions (adjust as needed for your database user)
-- GRANT SELECT ON inventory_valuation_view TO your_database_user;
-- GRANT SELECT ON profit_per_booking_view TO your_database_user;
-- GRANT SELECT ON sales_by_service_view TO your_database_user;
