const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf-8');
const lines = content.split('\n');
const newLines = [];

let inModel = false;
let modelName = null;
let hasDeletedAt = false;
let hasUpdatedAt = false;
let hasCreatedAt = false;

const modelsNeedingTenantId = [
  'AuditLog', 'Branch', 'CashRegister', 'CashRegisterSession',
  'CouponUsage', 'CustomerMembership', 'CustomerWallet', 'DataExport',
  'Expense', 'GoodsReceiptNote', 'GoodsReceiptNoteLine', 'InventoryCount',
  'InventoryCountItem', 'InventoryTransfer', 'InventoryTransferItem',
  'LoyaltyPoint', 'LoyaltyPointTransaction', 'MaintenancePackage',
  'MaintenancePackageItem', 'MembershipPlan', 'PreventiveMaintenanceLog',
  'Promotion', 'PromotionCondition', 'Report', 'Review', 'Role',
  'RolePermission', 'Warranty', 'WarrantyClaim'
];

const relationFixes = {
  'Service': [
    { old: 'category                 ServiceCategory?         @relation(fields: [categoryId], references: [id])',
      new: 'category                 ServiceCategory?         @relation(fields: [categoryId], references: [id], onDelete: SetNull)' },
  ],
  'Part': [
    { old: 'category                PartCategory?            @relation(fields: [categoryId], references: [id])',
      new: 'category                PartCategory?            @relation(fields: [categoryId], references: [id], onDelete: SetNull)' },
    { old: 'supplier                Supplier?                @relation(fields: [supplierId], references: [id])',
      new: 'supplier                Supplier?                @relation(fields: [supplierId], references: [id], onDelete: SetNull)' },
  ],
  'PartCategory': [
    { old: 'parent      PartCategory?  @relation("CategoryHierarchy", fields: [parentId], references: [id])',
      new: 'parent      PartCategory?  @relation("CategoryHierarchy", fields: [parentId], references: [id], onDelete: SetNull)' },
  ],
  'Invoice': [
    { old: 'booking               Booking?         @relation(fields: [bookingId], references: [id])',
      new: 'booking               Booking?         @relation(fields: [bookingId], references: [id], onDelete: SetNull)' },
    { old: 'customer              Customer?        @relation(fields: [customerId], references: [id])',
      new: 'customer              Customer?        @relation(fields: [customerId], references: [id], onDelete: SetNull)' },
    { old: 'branch                Branch?          @relation(fields: [branchId], references: [id])',
      new: 'branch                Branch?          @relation(fields: [branchId], references: [id], onDelete: SetNull)' },
    { old: 'installmentPlan       InstallmentPlan? @relation(fields: [installmentPlanId], references: [id])',
      new: 'installmentPlan       InstallmentPlan? @relation(fields: [installmentPlanId], references: [id], onDelete: SetNull)' },
    { old: 'taxRate               TaxRate?         @relation(fields: [taxRateId], references: [id])',
      new: 'taxRate               TaxRate?         @relation(fields: [taxRateId], references: [id], onDelete: SetNull)' },
  ],
  'InvoiceItem': [
    { old: 'part        Part?    @relation(fields: [partId], references: [id])',
      new: 'part        Part?    @relation(fields: [partId], references: [id], onDelete: SetNull)' },
    { old: 'service     Service? @relation("InvoiceItems", fields: [serviceId], references: [id])',
      new: 'service     Service? @relation("InvoiceItems", fields: [serviceId], references: [id], onDelete: SetNull)' },
  ],
  'Payment': [
    { old: 'CashRegisterSession   CashRegisterSession? @relation(fields: [cashRegisterSessionId], references: [id])',
      new: 'CashRegisterSession   CashRegisterSession? @relation(fields: [cashRegisterSessionId], references: [id], onDelete: SetNull)' },
  ],
  'Account': [
    { old: 'parent       Account?      @relation("AccountHierarchy", fields: [parentId], references: [id])',
      new: 'parent       Account?      @relation("AccountHierarchy", fields: [parentId], references: [id], onDelete: SetNull)' },
  ],
  'JournalEntry': [
    { old: 'fiscalPeriod   FiscalPeriod?      @relation(fields: [fiscalPeriodId], references: [id])',
      new: 'fiscalPeriod   FiscalPeriod?      @relation(fields: [fiscalPeriodId], references: [id], onDelete: SetNull)' },
    { old: 'approvedBy     User?              @relation("JournalEntryApprover", fields: [approvedById], references: [id])',
      new: 'approvedBy     User?              @relation("JournalEntryApprover", fields: [approvedById], references: [id], onDelete: SetNull)' },
    { old: 'createdBy      User?              @relation("JournalEntryCreator", fields: [createdById], references: [id])',
      new: 'createdBy      User?              @relation("JournalEntryCreator", fields: [createdById], references: [id], onDelete: SetNull)' },
  ],
  'JournalLine': [
    { old: 'account     Account      @relation(fields: [accountId], references: [id])',
      new: 'account     Account      @relation(fields: [accountId], references: [id], onDelete: Cascade)' },
  ],
  'Employee': [
    { old: 'department       Department      @relation(fields: [departmentId], references: [id])',
      new: 'department       Department      @relation(fields: [departmentId], references: [id], onDelete: Cascade)' },
    { old: 'branch           Branch?         @relation(fields: [branchId], references: [id])',
      new: 'branch           Branch?         @relation(fields: [branchId], references: [id], onDelete: SetNull)' },
    { old: 'user             User?           @relation(fields: [userId], references: [id])',
      new: 'user             User?           @relation(fields: [userId], references: [id], onDelete: SetNull)' },
    { old: 'role             Role?           @relation(fields: [roleId], references: [id])',
      new: 'role             Role?           @relation(fields: [roleId], references: [id], onDelete: SetNull)' },
  ],
  'Attachment': [
    { old: 'Booking                    Booking?                  @relation(fields: [bookingId], references: [id])',
      new: 'Booking                    Booking?                  @relation(fields: [bookingId], references: [id], onDelete: Cascade)' },
    { old: 'Invoice                    Invoice?                  @relation(fields: [invoiceId], references: [id])',
      new: 'Invoice                    Invoice?                  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)' },
    { old: 'Part                       Part?                     @relation(fields: [partId], references: [id])',
      new: 'Part                       Part?                     @relation(fields: [partId], references: [id], onDelete: Cascade)' },
    { old: 'PreventiveMaintenanceLog   PreventiveMaintenanceLog? @relation(fields: [preventiveMaintenanceLogId], references: [id])',
      new: 'PreventiveMaintenanceLog   PreventiveMaintenanceLog? @relation(fields: [preventiveMaintenanceLogId], references: [id], onDelete: Cascade)' },
    { old: 'Vehicle                    Vehicle?                  @relation(fields: [vehicleId], references: [id])',
      new: 'Vehicle                    Vehicle?                  @relation(fields: [vehicleId], references: [id], onDelete: Cascade)' },
  ],
  'PurchaseOrder': [
    { old: 'branch      Branch?             @relation(fields: [branchId], references: [id])',
      new: 'branch      Branch?             @relation(fields: [branchId], references: [id], onDelete: SetNull)' },
    { old: 'supplier    Supplier            @relation(fields: [supplierId], references: [id])',
      new: 'supplier    Supplier            @relation(fields: [supplierId], references: [id], onDelete: Cascade)' },
  ],
  'GoodsReceiptNote': [
    { old: 'purchaseOrder PurchaseOrder @relation(fields: [purchaseOrderId], references: [id])',
      new: 'purchaseOrder PurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)' },
  ],
  'InventoryTransaction': [
    { old: 'part        Part            @relation(fields: [partId], references: [id])',
      new: 'part        Part            @relation(fields: [partId], references: [id], onDelete: Cascade)' },
    { old: 'warehouse   Warehouse?      @relation(fields: [warehouseId], references: [id])',
      new: 'warehouse   Warehouse?      @relation(fields: [warehouseId], references: [id], onDelete: SetNull)' },
    { old: 'branch      Branch?         @relation(fields: [branchId], references: [id])',
      new: 'branch      Branch?         @relation(fields: [branchId], references: [id], onDelete: SetNull)' },
    { old: 'supplier    Supplier?       @relation(fields: [supplierId], references: [id])',
      new: 'supplier    Supplier?       @relation(fields: [supplierId], references: [id], onDelete: SetNull)' },
  ],
  'Vehicle': [
    { old: 'category                  VehicleCategory?             @relation(fields: [categoryId], references: [id])',
      new: 'category                  VehicleCategory?             @relation(fields: [categoryId], references: [id], onDelete: SetNull)' },
  ],
  'AuditLog': [
    { old: 'user        User?      @relation(fields: [userId], references: [id])',
      new: 'user        User?      @relation(fields: [userId], references: [id], onDelete: SetNull)' },
    { old: 'branch      Branch?    @relation(fields: [branchId], references: [id])',
      new: 'branch      Branch?    @relation(fields: [branchId], references: [id], onDelete: SetNull)' },
    { old: 'undoOf      AuditLog?  @relation("AuditUndo", fields: [undoOfId], references: [id])',
      new: 'undoOf      AuditLog?  @relation("AuditUndo", fields: [undoOfId], references: [id], onDelete: SetNull)' },
  ],
  'InventoryCount': [
    { old: 'warehouse   Warehouse @relation(fields: [warehouseId], references: [id])',
      new: 'warehouse   Warehouse @relation(fields: [warehouseId], references: [id], onDelete: Cascade)' },
  ],
  'InventoryCountItem': [
    { old: 'part        Part             @relation(fields: [partId], references: [id])',
      new: 'part        Part             @relation(fields: [partId], references: [id], onDelete: Cascade)' },
    { old: 'inventoryCount InventoryCount @relation(fields: [inventoryCountId], references: [id], onDelete: Cascade)',
      new: 'inventoryCount InventoryCount @relation(fields: [inventoryCountId], references: [id], onDelete: Cascade)' },
  ],
  'InventoryTransfer': [
    { old: 'fromWarehouse Warehouse @relation("FromWarehouse", fields: [fromWarehouseId], references: [id])',
      new: 'fromWarehouse Warehouse @relation("FromWarehouse", fields: [fromWarehouseId], references: [id], onDelete: Cascade)' },
    { old: 'toWarehouse   Warehouse @relation("ToWarehouse", fields: [toWarehouseId], references: [id])',
      new: 'toWarehouse   Warehouse @relation("ToWarehouse", fields: [toWarehouseId], references: [id], onDelete: Cascade)' },
  ],
  'InventoryTransferItem': [
    { old: 'part     Part              @relation(fields: [partId], references: [id])',
      new: 'part     Part              @relation(fields: [partId], references: [id], onDelete: Cascade)' },
    { old: 'transfer InventoryTransfer @relation(fields: [transferId], references: [id], onDelete: Cascade)',
      new: 'transfer InventoryTransfer @relation(fields: [transferId], references: [id], onDelete: Cascade)' },
  ],
  'MaintenancePackageItem': [
    { old: 'maintenancePackage MaintenancePackage @relation(fields: [maintenancePackageId], references: [id], onDelete: Cascade)',
      new: 'maintenancePackage MaintenancePackage @relation(fields: [maintenancePackageId], references: [id], onDelete: Cascade)' },
    { old: 'part               Part               @relation(fields: [partId], references: [id])',
      new: 'part               Part               @relation(fields: [partId], references: [id], onDelete: Cascade)' },
    { old: 'service            Service            @relation(fields: [serviceId], references: [id])',
      new: 'service            Service            @relation(fields: [serviceId], references: [id], onDelete: Cascade)' },
  ],
  'Task': [
    { old: 'Booking     Booking?         @relation(fields: [bookingId], references: [id])',
      new: 'Booking     Booking?         @relation(fields: [bookingId], references: [id], onDelete: SetNull)' },
  ],
  'TaskAssignment': [
    { old: 'User        User      @relation(fields: [userId], references: [id])',
      new: 'User        User      @relation(fields: [userId], references: [id], onDelete: Cascade)' },
  ],
  'VehicleMileageLog': [
    { old: 'vehicle   Vehicle     @relation(fields: [vehicleId], references: [id])',
      new: 'vehicle   Vehicle     @relation(fields: [vehicleId], references: [id], onDelete: Cascade)' },
  ],
  'VehicleIssue': [
    { old: 'Vehicle     Vehicle     @relation(fields: [vehicleId], references: [id])',
      new: 'Vehicle     Vehicle     @relation(fields: [vehicleId], references: [id], onDelete: Cascade)' },
  ],
  'VehicleInspectionChecklist': [
    { old: 'Vehicle        Vehicle  @relation(fields: [vehicleId], references: [id])',
      new: 'Vehicle        Vehicle  @relation(fields: [vehicleId], references: [id], onDelete: Cascade)' },
  ],
  'PurchaseOrderItem': [
    { old: 'part            Part          @relation(fields: [partId], references: [id])',
      new: 'part            Part          @relation(fields: [partId], references: [id], onDelete: Cascade)' },
  ],
  'GoodsReceiptNoteLine': [
    { old: 'part     Part             @relation(fields: [partId], references: [id])',
      new: 'part     Part             @relation(fields: [partId], references: [id], onDelete: Cascade)' },
    { old: 'grn      GoodsReceiptNote @relation(fields: [grnId], references: [id], onDelete: Cascade)',
      new: 'grn      GoodsReceiptNote @relation(fields: [grnId], references: [id], onDelete: Cascade)' },
  ],
  'PreventiveMaintenanceLog': [
    { old: 'vehicle   Vehicle  @relation(fields: [vehicleId], references: [id])',
      new: 'vehicle   Vehicle  @relation(fields: [vehicleId], references: [id], onDelete: Cascade)' },
  ],
  'AppointmentLog': [
    { old: 'booking   Booking  @relation(fields: [bookingId], references: [id])',
      new: 'booking   Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)' },
  ],
  'BookingExtraCharge': [
    { old: 'booking   Booking  @relation(fields: [bookingId], references: [id])',
      new: 'booking   Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)' },
  ],
  'Review': [
    { old: 'customer  Customer @relation(fields: [customerId], references: [id])',
      new: 'customer  Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)' },
  ],
  'WarrantyClaim': [
    { old: 'warranty  Warranty @relation(fields: [warrantyId], references: [id])',
      new: 'warranty  Warranty @relation(fields: [warrantyId], references: [id], onDelete: Cascade)' },
  ],
  'TechnicianSchedule': [
    { old: 'booking  Booking?  @relation(fields: [bookingId], references: [id], onDelete: Cascade)',
      new: 'booking  Booking?  @relation(fields: [bookingId], references: [id], onDelete: SetNull)' },
    { old: 'service  Service   @relation(fields: [serviceId], references: [id], onDelete: Cascade)',
      new: 'service  Service   @relation(fields: [serviceId], references: [id], onDelete: SetNull)' },
    { old: 'mechanic User      @relation(fields: [mechanicId], references: [id], onDelete: Cascade)',
      new: 'mechanic User      @relation(fields: [mechanicId], references: [id], onDelete: SetNull)' },
    { old: 'vehicle  Vehicle   @relation(fields: [vehicleId], references: [id], onDelete: Cascade)',
      new: 'vehicle  Vehicle   @relation(fields: [vehicleId], references: [id], onDelete: SetNull)' },
    { old: 'branch   Branch?   @relation(fields: [branchId], references: [id], onDelete: Cascade)',
      new: 'branch   Branch?   @relation(fields: [branchId], references: [id], onDelete: SetNull)' },
  ],
  'PromotionCondition': [
    { old: 'promotion   Promotion     @relation(fields: [promotionId], references: [id], onDelete: Cascade)',
      new: 'promotion   Promotion     @relation(fields: [promotionId], references: [id], onDelete: Cascade)' },
  ],
  'CouponUsage': [
    { old: 'Invoice   Invoice   @relation(fields: [invoiceId], references: [id])',
      new: 'Invoice   Invoice   @relation(fields: [invoiceId], references: [id], onDelete: Cascade)' },
    { old: 'promotion   Promotion @relation(fields: [promotionId], references: [id])',
      new: 'promotion   Promotion @relation(fields: [promotionId], references: [id], onDelete: Cascade)' },
  ],
  'PushNotificationToken': [
    { old: 'User       User      @relation(fields: [userId], references: [id])',
      new: 'User       User      @relation(fields: [userId], references: [id], onDelete: Cascade)' },
  ],
  'ElectronicSignature': [
    { old: 'booking       Booking  @relation(fields: [bookingId], references: [id])',
      new: 'booking       Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)' },
  ],
  'CashRegisterSession': [
    { old: 'cashRegister      CashRegister  @relation(fields: [cashRegisterId], references: [id])',
      new: 'cashRegister      CashRegister  @relation(fields: [cashRegisterId], references: [id], onDelete: Cascade)' },
    { old: 'cashier           User?         @relation("CashRegisterSessionCashier", fields: [cashierUserId], references: [id])',
      new: 'cashier           User?         @relation("CashRegisterSessionCashier", fields: [cashierUserId], references: [id], onDelete: SetNull)' },
  ],
  'CashRegister': [
    { old: 'cashier       User?                 @relation(fields: [cashierUserId], references: [id])',
      new: 'cashier       User?                 @relation(fields: [cashierUserId], references: [id], onDelete: SetNull)' },
  ],
  'Role': [
    { old: 'tenant   Tenant   @relation(fields: [tenantId], references: [id])',
      new: 'tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)' },
  ],
  'RolePermission': [
    { old: 'role       Role       @relation(fields: [roleId], references: [id])',
      new: 'role       Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)' },
  ],
  'Expense': [
    { old: 'tenant   Tenant   @relation(fields: [tenantId], references: [id])',
      new: 'tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)' },
  ],
  'DataExport': [
    { old: 'tenant   Tenant   @relation(fields: [tenantId], references: [id])',
      new: 'tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)' },
  ],
  'Report': [
    { old: 'tenant   Tenant   @relation(fields: [tenantId], references: [id])',
      new: 'tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)' },
  ],
  'LoyaltyPointTransaction': [
    { old: 'tenant   Tenant   @relation(fields: [tenantId], references: [id])',
      new: 'tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)' },
  ],
  'CustomerMembership': [
    { old: 'tenant   Tenant   @relation(fields: [tenantId], references: [id])',
      new: 'tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)' },
  ],
  'CustomerWallet': [
    { old: 'tenant   Tenant   @relation(fields: [tenantId], references: [id])',
      new: 'tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)' },
  ],
  'MembershipPlan': [
    { old: 'tenant   Tenant   @relation(fields: [tenantId], references: [id])',
      new: 'tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)' },
  ],
  'Branch': [
    { old: 'tenant   Tenant   @relation(fields: [tenantId], references: [id])',
      new: 'tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)' },
  ],
  'Warranty': [
    { old: 'tenant   Tenant   @relation(fields: [tenantId], references: [id])',
      new: 'tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)' },
  ],
  'WarrantyClaim': [
    { old: 'tenant   Tenant   @relation(fields: [tenantId], references: [id])',
      new: 'tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)' },
  ],
  'InstallmentPlan': [
    { old: 'tenant   Tenant   @relation(fields: [tenantId], references: [id])',
      new: 'tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)' },
  ],
  'InstallmentPayment': [
    { old: 'tenant   Tenant   @relation(fields: [tenantId], references: [id])',
      new: 'tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)' },
  ],
};

let i = 0;
while (i < lines.length) {
  let line = lines[i];

  // Detect model start
  const modelMatch = line.match(/^model (\w+) \{/);
  if (modelMatch) {
    modelName = modelMatch[1];
    inModel = true;
    hasDeletedAt = false;
    hasUpdatedAt = false;
    hasCreatedAt = false;
  }

  if (inModel) {
    if (line.includes('deletedAt')) hasDeletedAt = true;
    if (line.includes('updatedAt')) hasUpdatedAt = true;
    if (line.includes('createdAt')) hasCreatedAt = true;

    // Apply relation fixes
    if (relationFixes[modelName]) {
      for (const fix of relationFixes[modelName]) {
        if (line.includes(fix.old)) {
          line = line.replace(fix.old, fix.new);
          break;
        }
      }
    }

    // Detect model end
    if (line.match(/^\}/)) {
      // Add deletedAt before closing brace
      if (!hasDeletedAt && modelName !== 'Enum' && !modelName.includes('Enum')) {
        const indent = '  ';
        newLines.push(`${indent}deletedAt DateTime?`);
      }
      inModel = false;
      modelName = null;
    }
  }

  newLines.push(line);
  i++;
}

// Fix CompanySettings - remove duplicates
let fixedContent = newLines.join('\n');

// Remove duplicate fields in CompanySettings
const companySettingsFixes = [
  { old: '  companyNameAr             String?\n  companyNameEn             String?', new: '  companyNameAr             String?\n  companyNameEn             String?' },
  // Actually let's be more careful - we need to remove the duplicate fields but keep one
];

// Actually, CompanySettings has both `companyName` and `companyNameAr/En` which is fine
// But it has `address` + `companyAddress` AND `phone` + `companyPhone` AND `logoUrl` + `companyLogoUrl`
// These are true duplicates that should be cleaned up

// For now, let's keep the schema additive only (safe migration)
// and note the CompanySettings issue for a future cleanup

fs.writeFileSync(schemaPath, fixedContent, 'utf-8');
console.log('Schema updated successfully!');
console.log('- Added deletedAt to all models missing it');
console.log('- Added onDelete rules to orphaned relations');
console.log('- Fixed relation cascades for data integrity');
