const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let s = fs.readFileSync(schemaPath, 'utf-8');

// Helper function to safely replace
function r(oldStr, newStr) {
  if (s.includes(oldStr)) {
    s = s.replace(oldStr, newStr);
    return true;
  }
  return false;
}

// 1. Fix mechanicAssignments to one-to-many
r('mechanicAssignments     MechanicAssignment?', 'mechanicAssignments     MechanicAssignment[]');

// 2. Fix Service category
r('category                 ServiceCategory?         @relation(fields: [categoryId], references: [id])\n\n  @@index([tenantId])', 'category                 ServiceCategory?         @relation(fields: [categoryId], references: [id], onDelete: SetNull)\n\n  @@index([tenantId])');

// 3. Fix Part relations
r('category                PartCategory?            @relation(fields: [categoryId], references: [id])', 'category                PartCategory?            @relation(fields: [categoryId], references: [id], onDelete: SetNull)');
r('supplier                Supplier?                @relation(fields: [supplierId], references: [id])', 'supplier                Supplier?                @relation(fields: [supplierId], references: [id], onDelete: SetNull)');

// 4. Fix Invoice relations
r('booking               Booking?         @relation(fields: [bookingId], references: [id])', 'booking               Booking?         @relation(fields: [bookingId], references: [id], onDelete: SetNull)');
r('customer              Customer?        @relation(fields: [customerId], references: [id])', 'customer              Customer?        @relation(fields: [customerId], references: [id], onDelete: SetNull)');
r('branch                Branch?          @relation(fields: [branchId], references: [id])\n  installmentPlan', 'branch                Branch?          @relation(fields: [branchId], references: [id], onDelete: SetNull)\n  installmentPlan');
r('installmentPlan       InstallmentPlan? @relation(fields: [installmentPlanId], references: [id])', 'installmentPlan       InstallmentPlan? @relation(fields: [installmentPlanId], references: [id], onDelete: SetNull)');
r('taxRate               TaxRate?         @relation(fields: [taxRateId], references: [id])\n  tenant', 'taxRate               TaxRate?         @relation(fields: [taxRateId], references: [id], onDelete: SetNull)\n  tenant');

// 5. Fix InvoiceItem
r('part        Part?    @relation(fields: [partId], references: [id])', 'part        Part?    @relation(fields: [partId], references: [id], onDelete: SetNull)');
r('service     Service? @relation("InvoiceItems", fields: [serviceId], references: [id])', 'service     Service? @relation("InvoiceItems", fields: [serviceId], references: [id], onDelete: SetNull)');

// 6. Fix Payment
r('CashRegisterSession   CashRegisterSession? @relation(fields: [cashRegisterSessionId], references: [id])', 'CashRegisterSession   CashRegisterSession? @relation(fields: [cashRegisterSessionId], references: [id], onDelete: SetNull)');

// 7. Fix Account parent
r('parent       Account?      @relation("AccountHierarchy", fields: [parentId], references: [id])', 'parent       Account?      @relation("AccountHierarchy", fields: [parentId], references: [id], onDelete: SetNull)');

// 8. Fix JournalEntry
r('fiscalPeriod   FiscalPeriod?      @relation(fields: [fiscalPeriodId], references: [id])', 'fiscalPeriod   FiscalPeriod?      @relation(fields: [fiscalPeriodId], references: [id], onDelete: SetNull)');
r('approvedBy     User?              @relation("JournalEntryApprover", fields: [approvedById], references: [id])', 'approvedBy     User?              @relation("JournalEntryApprover", fields: [approvedById], references: [id], onDelete: SetNull)');
r('createdBy      User?              @relation("JournalEntryCreator", fields: [createdById], references: [id])', 'createdBy      User?              @relation("JournalEntryCreator", fields: [createdById], references: [id], onDelete: SetNull)');

// 9. Fix JournalLine
r('account     Account      @relation(fields: [accountId], references: [id])', 'account     Account      @relation(fields: [accountId], references: [id], onDelete: Cascade)');

// 10. Fix Employee
r('department       Department      @relation(fields: [departmentId], references: [id])', 'department       Department      @relation(fields: [departmentId], references: [id], onDelete: Cascade)');
r('branch           Branch?         @relation(fields: [branchId], references: [id])\n  user', 'branch           Branch?         @relation(fields: [branchId], references: [id], onDelete: SetNull)\n  user');
r('user             User?           @relation(fields: [userId], references: [id])\n  payrollRecords', 'user             User?           @relation(fields: [userId], references: [id], onDelete: SetNull)\n  payrollRecords');
r('role             Role?           @relation(fields: [roleId], references: [id])\n\n  @@unique', 'role             Role?           @relation(fields: [roleId], references: [id], onDelete: SetNull)\n\n  @@unique');

// 11. Fix Attachment
r('Booking                    Booking?                  @relation(fields: [bookingId], references: [id])', 'Booking                    Booking?                  @relation(fields: [bookingId], references: [id], onDelete: Cascade)');
r('Invoice                    Invoice?                  @relation(fields: [invoiceId], references: [id])', 'Invoice                    Invoice?                  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)');
r('Part                       Part?                     @relation(fields: [partId], references: [id])', 'Part                       Part?                     @relation(fields: [partId], references: [id], onDelete: Cascade)');
r('PreventiveMaintenanceLog   PreventiveMaintenanceLog? @relation(fields: [preventiveMaintenanceLogId], references: [id])', 'PreventiveMaintenanceLog   PreventiveMaintenanceLog? @relation(fields: [preventiveMaintenanceLogId], references: [id], onDelete: Cascade)');
r('Vehicle                    Vehicle?                  @relation(fields: [vehicleId], references: [id])', 'Vehicle                    Vehicle?                  @relation(fields: [vehicleId], references: [id], onDelete: Cascade)');

// 12. Fix PartCategory
r('parent      PartCategory?  @relation("CategoryHierarchy", fields: [parentId], references: [id])', 'parent      PartCategory?  @relation("CategoryHierarchy", fields: [parentId], references: [id], onDelete: SetNull)');

// 13. Fix Vehicle
r('category                  VehicleCategory?             @relation(fields: [categoryId], references: [id])', 'category                  VehicleCategory?             @relation(fields: [categoryId], references: [id], onDelete: SetNull)');

// 14. Fix PurchaseOrder
r('branch      Branch?             @relation(fields: [branchId], references: [id])\n  supplier', 'branch      Branch?             @relation(fields: [branchId], references: [id], onDelete: SetNull)\n  supplier');
r('supplier    Supplier            @relation(fields: [supplierId], references: [id])', 'supplier    Supplier            @relation(fields: [supplierId], references: [id], onDelete: Cascade)');

// 15. Fix GoodsReceiptNote
r('purchaseOrder PurchaseOrder @relation(fields: [purchaseOrderId], references: [id])', 'purchaseOrder PurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)');

// 16. Fix InventoryTransaction
r('part        Part            @relation(fields: [partId], references: [id])\n  warehouse', 'part        Part            @relation(fields: [partId], references: [id], onDelete: Cascade)\n  warehouse');
r('warehouse   Warehouse?      @relation(fields: [warehouseId], references: [id])', 'warehouse   Warehouse?      @relation(fields: [warehouseId], references: [id], onDelete: SetNull)');
r('branch      Branch?         @relation(fields: [branchId], references: [id])\n  supplier', 'branch      Branch?         @relation(fields: [branchId], references: [id], onDelete: SetNull)\n  supplier');
r('supplier    Supplier?       @relation(fields: [supplierId], references: [id])', 'supplier    Supplier?       @relation(fields: [supplierId], references: [id], onDelete: SetNull)');

// 17. Fix AuditLog
r('user        User?      @relation(fields: [userId], references: [id])\n  branch', 'user        User?      @relation(fields: [userId], references: [id], onDelete: SetNull)\n  branch');
r('branch      Branch?    @relation(fields: [branchId], references: [id])\n  undoOf', 'branch      Branch?    @relation(fields: [branchId], references: [id], onDelete: SetNull)\n  undoOf');
r('undoOf      AuditLog?  @relation("AuditUndo", fields: [undoOfId], references: [id])', 'undoOf      AuditLog?  @relation("AuditUndo", fields: [undoOfId], references: [id], onDelete: SetNull)');

// 18. Fix InventoryCount
r('warehouse   Warehouse @relation(fields: [warehouseId], references: [id])\n  counter', 'warehouse   Warehouse @relation(fields: [warehouseId], references: [id], onDelete: Cascade)\n  counter');

// 19. Fix InventoryCountItem
r('part        Part             @relation(fields: [partId], references: [id])\n  inventoryCount', 'part        Part             @relation(fields: [partId], references: [id], onDelete: Cascade)\n  inventoryCount');

// 20. Fix InventoryTransfer
r('fromWarehouse Warehouse @relation("FromWarehouse", fields: [fromWarehouseId], references: [id])', 'fromWarehouse Warehouse @relation("FromWarehouse", fields: [fromWarehouseId], references: [id], onDelete: Cascade)');
r('toWarehouse   Warehouse @relation("ToWarehouse", fields: [toWarehouseId], references: [id])', 'toWarehouse   Warehouse @relation("ToWarehouse", fields: [toWarehouseId], references: [id], onDelete: Cascade)');

// 21. Fix InventoryTransferItem
r('part     Part              @relation(fields: [partId], references: [id])\n  transfer', 'part     Part              @relation(fields: [partId], references: [id], onDelete: Cascade)\n  transfer');

// 22. Fix MaintenancePackageItem
r('part               Part               @relation(fields: [partId], references: [id])\n  service', 'part               Part               @relation(fields: [partId], references: [id], onDelete: Cascade)\n  service');
r('service            Service            @relation(fields: [serviceId], references: [id])', 'service            Service            @relation(fields: [serviceId], references: [id], onDelete: Cascade)');

// 23. Fix Task
r('Booking     Booking?         @relation(fields: [bookingId], references: [id])\n  assignments', 'Booking     Booking?         @relation(fields: [bookingId], references: [id], onDelete: SetNull)\n  assignments');

// 24. Fix TaskAssignment
r('User        User      @relation(fields: [userId], references: [id])', 'User        User      @relation(fields: [userId], references: [id], onDelete: Cascade)');

// 25. Fix VehicleMileageLog
r('vehicle   Vehicle     @relation(fields: [vehicleId], references: [id])\n\n  @@index([tenantId])', 'vehicle   Vehicle     @relation(fields: [vehicleId], references: [id], onDelete: Cascade)\n\n  @@index([tenantId])');

// 26. Fix VehicleIssue
r('Vehicle     Vehicle     @relation(fields: [vehicleId], references: [id])\n\n  @@index([tenantId])', 'Vehicle     Vehicle     @relation(fields: [vehicleId], references: [id], onDelete: Cascade)\n\n  @@index([tenantId])');

// 27. Fix VehicleInspectionChecklist
r('Vehicle        Vehicle  @relation(fields: [vehicleId], references: [id])\n\n  @@index([tenantId])', 'Vehicle        Vehicle  @relation(fields: [vehicleId], references: [id], onDelete: Cascade)\n\n  @@index([tenantId])');

// 28. Fix PurchaseOrderItem
r('part            Part          @relation(fields: [partId], references: [id])\n  purchaseOrder', 'part            Part          @relation(fields: [partId], references: [id], onDelete: Cascade)\n  purchaseOrder');

// 29. Fix GoodsReceiptNoteLine
r('part     Part             @relation(fields: [partId], references: [id])\n  grn', 'part     Part             @relation(fields: [partId], references: [id], onDelete: Cascade)\n  grn');

// 30. Fix PreventiveMaintenanceLog
r('vehicle   Vehicle  @relation(fields: [vehicleId], references: [id])\n\n  @@index([tenantId])', 'vehicle   Vehicle  @relation(fields: [vehicleId], references: [id], onDelete: Cascade)\n\n  @@index([tenantId])');

// 31. Fix AppointmentLog
r('booking   Booking  @relation(fields: [bookingId], references: [id])\n\n  @@index([tenantId])', 'booking   Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)\n\n  @@index([tenantId])');

// 32. Fix BookingExtraCharge
r('booking   Booking  @relation(fields: [bookingId], references: [id])\n\n  @@index([tenantId])', 'booking   Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)\n\n  @@index([tenantId])');

// 33. Fix Review
r('customer  Customer @relation(fields: [customerId], references: [id])\n\n  @@index([tenantId])', 'customer  Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)\n\n  @@index([tenantId])');

// 34. Fix WarrantyClaim
r('warranty  Warranty @relation(fields: [warrantyId], references: [id])', 'warranty  Warranty @relation(fields: [warrantyId], references: [id], onDelete: Cascade)');

// 35. Fix TechnicianSchedule
r('booking  Booking?  @relation(fields: [bookingId], references: [id], onDelete: Cascade)\n  service', 'booking  Booking?  @relation(fields: [bookingId], references: [id], onDelete: SetNull)\n  service');
r('service  Service   @relation(fields: [serviceId], references: [id], onDelete: Cascade)\n  mechanic', 'service  Service   @relation(fields: [serviceId], references: [id], onDelete: SetNull)\n  mechanic');
r('mechanic User      @relation(fields: [mechanicId], references: [id], onDelete: Cascade)\n  vehicle', 'mechanic User      @relation(fields: [mechanicId], references: [id], onDelete: SetNull)\n  vehicle');
r('vehicle  Vehicle   @relation(fields: [vehicleId], references: [id], onDelete: Cascade)\n  branch', 'vehicle  Vehicle   @relation(fields: [vehicleId], references: [id], onDelete: SetNull)\n  branch');
r('branch   Branch?   @relation(fields: [branchId], references: [id], onDelete: Cascade)', 'branch   Branch?   @relation(fields: [branchId], references: [id], onDelete: SetNull)');

// 36. Fix CouponUsage
r('Invoice   Invoice   @relation(fields: [invoiceId], references: [id])', 'Invoice   Invoice   @relation(fields: [invoiceId], references: [id], onDelete: Cascade)');
r('promotion   Promotion @relation(fields: [promotionId], references: [id])', 'promotion   Promotion @relation(fields: [promotionId], references: [id], onDelete: Cascade)');

// 37. Fix PushNotificationToken
r('User       User      @relation(fields: [userId], references: [id])\n\n  @@unique', 'User       User      @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@unique');

// 38. Fix ElectronicSignature
r('booking       Booking  @relation(fields: [bookingId], references: [id])\n\n  @@index([tenantId])', 'booking       Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)\n\n  @@index([tenantId])');

// 39. Fix CashRegisterSession
r('cashRegister      CashRegister  @relation(fields: [cashRegisterId], references: [id])\n  cashier', 'cashRegister      CashRegister  @relation(fields: [cashRegisterId], references: [id], onDelete: Cascade)\n  cashier');
r('cashier           User?         @relation("CashRegisterSessionCashier", fields: [cashierUserId], references: [id])', 'cashier           User?         @relation("CashRegisterSessionCashier", fields: [cashierUserId], references: [id], onDelete: SetNull)');

// 40. Fix CashRegister
r('cashier       User?                 @relation(fields: [cashierUserId], references: [id])', 'cashier       User?                 @relation(fields: [cashierUserId], references: [id], onDelete: SetNull)');

// 41. Fix Role tenant
r('tenant   Tenant   @relation(fields: [tenantId], references: [id])\n\n  @@index([tenantId])\n}', 'tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)\n\n  @@index([tenantId])\n}');

// 42. Fix RolePermission
r('role       Role       @relation(fields: [roleId], references: [id])', 'role       Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)');

// 43-52. Fix tenant onDelete for models without it
const tenantModels = [
  ['Expense', 'tenant   Tenant   @relation(fields: [tenantId], references: [id])'],
  ['DataExport', 'tenant   Tenant   @relation(fields: [tenantId], references: [id])'],
  ['Report', 'tenant   Tenant   @relation(fields: [tenantId], references: [id])'],
  ['LoyaltyPointTransaction', 'tenant   Tenant   @relation(fields: [tenantId], references: [id])'],
  ['CustomerMembership', 'tenant   Tenant   @relation(fields: [tenantId], references: [id])'],
  ['CustomerWallet', 'tenant   Tenant   @relation(fields: [tenantId], references: [id])'],
  ['MembershipPlan', 'tenant   Tenant   @relation(fields: [tenantId], references: [id])'],
  ['Branch', 'tenant   Tenant   @relation(fields: [tenantId], references: [id])'],
  ['Warranty', 'tenant   Tenant   @relation(fields: [tenantId], references: [id])'],
  ['WarrantyClaim', 'tenant   Tenant   @relation(fields: [tenantId], references: [id])'],
  ['InstallmentPlan', 'tenant   Tenant   @relation(fields: [tenantId], references: [id])'],
  ['InstallmentPayment', 'tenant   Tenant   @relation(fields: [tenantId], references: [id])'],
];

for (const [modelName, oldStr] of tenantModels) {
  const newStr = oldStr.replace('references: [id])', 'references: [id], onDelete: Cascade)');
  // Only replace within the specific model block
  const modelRegex = new RegExp(`model ${modelName} \\{[\\s\\S]*?${oldStr}[\\s\\S]*?\\}`, 'g');
  s = s.replace(modelRegex, (match) => match.replace(oldStr, newStr));
}

fs.writeFileSync(schemaPath, s, 'utf-8');
console.log('Relation fixes applied!');
