const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let s = fs.readFileSync(schemaPath, 'utf-8');

// 1. AuditLog - add tenantId and Tenant relation
const auditLogOld = `model AuditLog {
  id        String   @id @default(uuid())
  userId    String?
  branchId  String?`;

const auditLogNew = `model AuditLog {
  id        String   @id @default(uuid())
  tenantId  String
  userId    String?
  branchId  String?`;

s = s.replace(auditLogOld, auditLogNew);

// Add Tenant relation to AuditLog
const auditLogTenantOld = `  user        User?      @relation(fields: [userId], references: [id], onDelete: SetNull)
  branch      Branch?    @relation(fields: [branchId], references: [id], onDelete: SetNull)`;

const auditLogTenantNew = `  tenant      Tenant     @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user        User?      @relation(fields: [userId], references: [id], onDelete: SetNull)
  branch      Branch?    @relation(fields: [branchId], references: [id], onDelete: SetNull)`;

s = s.replace(auditLogTenantOld, auditLogTenantNew);

// Add @@index([tenantId]) to AuditLog
const auditLogIndexOld = `  @@index([userId])
  @@index([branchId])`;

const auditLogIndexNew = `  @@index([tenantId])
  @@index([userId])
  @@index([branchId])`;

s = s.replace(auditLogIndexOld, auditLogIndexNew);

// 2. ExchangeRate - add onDelete to fromCurrency and toCurrency, add Tenant relation
const exchangeRateOld = `  tenantId       String
  fromCurrency   Currency  @relation("ExchangeRatesFrom", fields: [fromCurrencyId], references: [id])
  toCurrency     Currency  @relation("ExchangeRatesTo", fields: [toCurrencyId], references: [id])`;

const exchangeRateNew = `  tenantId       String
  tenant         Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  fromCurrency   Currency  @relation("ExchangeRatesFrom", fields: [fromCurrencyId], references: [id], onDelete: Cascade)
  toCurrency     Currency  @relation("ExchangeRatesTo", fields: [toCurrencyId], references: [id], onDelete: Cascade)`;

s = s.replace(exchangeRateOld, exchangeRateNew);

// 3. CouponUsage - add onDelete to Invoice relation
const couponUsageOld = `  Invoice     Invoice   @relation(fields: [invoiceId], references: [id])`;
const couponUsageNew = `  invoice     Invoice   @relation(fields: [invoiceId], references: [id], onDelete: Cascade)`;
s = s.replace(couponUsageOld, couponUsageNew);

// 4. Add missing tenantId to models that need it but are independent (not junction tables)
// GoodsReceiptNoteLine - add tenantId and Tenant relation
const grnLineOld = `model GoodsReceiptNoteLine {
  id       String   @id @default(uuid())
  grnId    String
  partId   String
  quantity Int
  costSYP  Decimal  @db.Decimal(12, 2)
  costUSD  Decimal? @db.Decimal(12, 2)
  part     Part             @relation(fields: [partId], references: [id], onDelete: Cascade)
  grn      GoodsReceiptNote @relation(fields: [grnId], references: [id], onDelete: Cascade)`;

const grnLineNew = `model GoodsReceiptNoteLine {
  id       String   @id @default(uuid())
  tenantId String
  grnId    String
  partId   String
  quantity Int
  costSYP  Decimal  @db.Decimal(12, 2)
  costUSD  Decimal? @db.Decimal(12, 2)
  tenant   Tenant           @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  part     Part             @relation(fields: [partId], references: [id], onDelete: Cascade)
  grn      GoodsReceiptNote @relation(fields: [grnId], references: [id], onDelete: Cascade)`;

s = s.replace(grnLineOld, grnLineNew);

// Add tenantId index to GoodsReceiptNoteLine
const grnLineIndexOld = `  @@index([grnId])
  @@index([partId])`;
const grnLineIndexNew = `  @@index([tenantId])
  @@index([grnId])
  @@index([partId])`;
s = s.replace(grnLineIndexOld, grnLineIndexNew);

// PurchaseOrderItem - add tenantId and Tenant relation
const poItemOld = `model PurchaseOrderItem {
  id              String        @id @default(uuid())
  purchaseOrderId String
  partId          String
  quantity        Int
  costSYP         Decimal       @db.Decimal(12, 2)
  costUSD         Decimal?      @db.Decimal(12, 2)
  totalSYP        Decimal       @db.Decimal(12, 2)
  totalUSD        Decimal?      @db.Decimal(12, 2)
  receivedQty     Int           @default(0)
  part            Part          @relation(fields: [partId], references: [id], onDelete: Cascade)
  purchaseOrder   PurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)`;

const poItemNew = `model PurchaseOrderItem {
  id              String        @id @default(uuid())
  tenantId        String
  purchaseOrderId String
  partId          String
  quantity        Int
  costSYP         Decimal       @db.Decimal(12, 2)
  costUSD         Decimal?      @db.Decimal(12, 2)
  totalSYP        Decimal       @db.Decimal(12, 2)
  totalUSD        Decimal?      @db.Decimal(12, 2)
  receivedQty     Int           @default(0)
  tenant          Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  part            Part          @relation(fields: [partId], references: [id], onDelete: Cascade)
  purchaseOrder   PurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)`;

s = s.replace(poItemOld, poItemNew);

// Add tenantId index to PurchaseOrderItem
const poItemIndexOld = `  @@index([purchaseOrderId])
  @@index([partId])`;
const poItemIndexNew = `  @@index([tenantId])
  @@index([purchaseOrderId])
  @@index([partId])`;
s = s.replace(poItemIndexOld, poItemIndexNew);

// MaintenancePackageItem - add tenantId and Tenant relation
const mpiOld = `model MaintenancePackageItem {
  id                 String             @id @default(uuid())
  maintenancePackageId String
  partId             String?
  serviceId          String?
  quantity           Int
  priceSYP           Decimal            @db.Decimal(12, 2)
  priceUSD           Decimal?           @db.Decimal(12, 2)
  maintenancePackage MaintenancePackage @relation(fields: [maintenancePackageId], references: [id], onDelete: Cascade)
  part               Part?              @relation(fields: [partId], references: [id], onDelete: SetNull)
  service            Service?           @relation(fields: [serviceId], references: [id], onDelete: SetNull)`;

const mpiNew = `model MaintenancePackageItem {
  id                 String             @id @default(uuid())
  tenantId           String
  maintenancePackageId String
  partId             String?
  serviceId          String?
  quantity           Int
  priceSYP           Decimal            @db.Decimal(12, 2)
  priceUSD           Decimal?           @db.Decimal(12, 2)
  tenant             Tenant             @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  maintenancePackage MaintenancePackage @relation(fields: [maintenancePackageId], references: [id], onDelete: Cascade)
  part               Part?              @relation(fields: [partId], references: [id], onDelete: SetNull)
  service            Service?           @relation(fields: [serviceId], references: [id], onDelete: SetNull)`;

s = s.replace(mpiOld, mpiNew);

// InventoryCountItem - add tenantId and Tenant relation
const iciOld = `model InventoryCountItem {
  id             String         @id @default(uuid())
  inventoryCountId String
  partId         String
  expectedQty    Int
  actualQty      Int
  variance       Int
  costSYP        Decimal        @db.Decimal(12, 2)
  costUSD        Decimal?       @db.Decimal(12, 2)
  part           Part             @relation(fields: [partId], references: [id], onDelete: Cascade)
  inventoryCount InventoryCount @relation(fields: [inventoryCountId], references: [id], onDelete: Cascade)`;

const iciNew = `model InventoryCountItem {
  id             String         @id @default(uuid())
  tenantId       String
  inventoryCountId String
  partId         String
  expectedQty    Int
  actualQty      Int
  variance       Int
  costSYP        Decimal        @db.Decimal(12, 2)
  costUSD        Decimal?       @db.Decimal(12, 2)
  tenant         Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  part           Part             @relation(fields: [partId], references: [id], onDelete: Cascade)
  inventoryCount InventoryCount @relation(fields: [inventoryCountId], references: [id], onDelete: Cascade)`;

s = s.replace(iciOld, iciNew);

// InventoryTransferItem - add tenantId and Tenant relation
const itiOld = `model InventoryTransferItem {
  id         String            @id @default(uuid())
  transferId String
  partId     String
  quantity   Int
  costSYP    Decimal           @db.Decimal(12, 2)
  costUSD    Decimal?          @db.Decimal(12, 2)
  part     Part              @relation(fields: [partId], references: [id], onDelete: Cascade)
  transfer InventoryTransfer @relation(fields: [transferId], references: [id], onDelete: Cascade)`;

const itiNew = `model InventoryTransferItem {
  id         String            @id @default(uuid())
  tenantId   String
  transferId String
  partId     String
  quantity   Int
  costSYP    Decimal           @db.Decimal(12, 2)
  costUSD    Decimal?          @db.Decimal(12, 2)
  tenant   Tenant            @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  part     Part              @relation(fields: [partId], references: [id], onDelete: Cascade)
  transfer InventoryTransfer @relation(fields: [transferId], references: [id], onDelete: Cascade)`;

s = s.replace(itiOld, itiNew);

// Add Tenant relation to Tenant model for new relations
// AuditLog
if (!s.includes('auditLogs  AuditLog[]')) {
  s = s.replace('roles           Role[]', 'roles           Role[]\n  auditLogs       AuditLog[]');
}

// ExchangeRate
if (!s.includes('exchangeRates   ExchangeRate[]')) {
  s = s.replace('roles           Role[]', 'roles           Role[]\n  exchangeRates   ExchangeRate[]');
}

// GoodsReceiptNoteLine
if (!s.includes('grnLines        GoodsReceiptNoteLine[]')) {
  // Already exists in Part model
}

// Actually check if Tenant already has these
if (!s.includes('auditLogs')) {
  s = s.replace(
    /model Tenant \{[\s\S]*?roles           Role\[\]/,
    match => match + '\n  auditLogs       AuditLog[]'
  );
}

if (!s.includes('exchangeRates   ExchangeRate[]')) {
  s = s.replace(
    /model Tenant \{[\s\S]*?roles           Role\[\]/,
    match => match + '\n  exchangeRates   ExchangeRate[]'
  );
}

if (!s.includes('grnLines        GoodsReceiptNoteLine[]')) {
  s = s.replace(
    /model Tenant \{[\s\S]*?roles           Role\[\]/,
    match => match + '\n  grnLines        GoodsReceiptNoteLine[]'
  );
}

if (!s.includes('purchaseOrderItems PurchaseOrderItem[]')) {
  s = s.replace(
    /model Tenant \{[\s\S]*?roles           Role\[\]/,
    match => match + '\n  purchaseOrderItems PurchaseOrderItem[]'
  );
}

if (!s.includes('maintenancePackageItems MaintenancePackageItem[]')) {
  s = s.replace(
    /model Tenant \{[\s\S]*?roles           Role\[\]/,
    match => match + '\n  maintenancePackageItems MaintenancePackageItem[]'
  );
}

if (!s.includes('inventoryCountItems InventoryCountItem[]')) {
  s = s.replace(
    /model Tenant \{[\s\S]*?roles           Role\[\]/,
    match => match + '\n  inventoryCountItems InventoryCountItem[]'
  );
}

if (!s.includes('inventoryTransferItems InventoryTransferItem[]')) {
  s = s.replace(
    /model Tenant \{[\s\S]*?roles           Role\[\]/,
    match => match + '\n  inventoryTransferItems InventoryTransferItem[]'
  );
}

fs.writeFileSync(schemaPath, s, 'utf-8');
console.log('Final schema fixes applied!');
