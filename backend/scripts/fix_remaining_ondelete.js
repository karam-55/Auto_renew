const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let s = fs.readFileSync(schemaPath, 'utf-8');

const fixes = [
  // GoodsReceiptNote
  { old: 'purchaseOrder   PurchaseOrder          @relation(fields: [purchaseOrderId], references: [id])', new: 'purchaseOrder   PurchaseOrder          @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)' },
  { old: 'supplier        Supplier               @relation(fields: [supplierId], references: [id])', new: 'supplier        Supplier               @relation(fields: [supplierId], references: [id], onDelete: Cascade)' },
  { old: 'warehouse       Warehouse?             @relation(fields: [warehouseId], references: [id])', new: 'warehouse       Warehouse?             @relation(fields: [warehouseId], references: [id], onDelete: SetNull)' },
  
  // Review
  { old: 'Booking    Booking   @relation(fields: [bookingId], references: [id])', new: 'Booking    Booking   @relation(fields: [bookingId], references: [id], onDelete: Cascade)' },
  
  // AppointmentLog
  { old: 'booking         Booking           @relation(fields: [bookingId], references: [id])', new: 'booking         Booking           @relation(fields: [bookingId], references: [id], onDelete: Cascade)' },
  
  // WarrantyClaim
  { old: 'warranty       Warranty            @relation(fields: [warrantyId], references: [id])', new: 'warranty       Warranty            @relation(fields: [warrantyId], references: [id], onDelete: Cascade)' },
  
  // BookingExtraCharge
  { old: 'booking           Booking         @relation(fields: [bookingId], references: [id])', new: 'booking           Booking         @relation(fields: [bookingId], references: [id], onDelete: Cascade)' },
  { old: 'extraChargeType   ExtraChargeType @relation(fields: [extraChargeTypeId], references: [id])', new: 'extraChargeType   ExtraChargeType @relation(fields: [extraChargeTypeId], references: [id], onDelete: Cascade)' },
  
  // PreventiveMaintenanceLog
  { old: 'template      PreventiveMaintenanceTemplate @relation(fields: [templateId], references: [id])', new: 'template      PreventiveMaintenanceTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)' },
  { old: 'vehicle       Vehicle                       @relation(fields: [vehicleId], references: [id])', new: 'vehicle       Vehicle                       @relation(fields: [vehicleId], references: [id], onDelete: Cascade)' },
  
  // MaintenancePackage
  { old: 'template    PreventiveMaintenanceTemplate @relation(fields: [templateId], references: [id])', new: 'template    PreventiveMaintenanceTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)' },
  
  // MaintenancePackageItem
  { old: 'part      Part?              @relation(fields: [partId], references: [id])', new: 'part      Part?              @relation(fields: [partId], references: [id], onDelete: SetNull)' },
  { old: 'service   Service?           @relation(fields: [serviceId], references: [id])', new: 'service   Service?           @relation(fields: [serviceId], references: [id], onDelete: SetNull)' },
  
  // InventoryCount
  { old: 'warehouse     Warehouse?                 @relation(fields: [warehouseId], references: [id])', new: 'warehouse     Warehouse?                 @relation(fields: [warehouseId], references: [id], onDelete: SetNull)' },
  { old: 'counter       User?                      @relation("InventoryCountCounter", fields: [countedBy], references: [id])', new: 'counter       User?                      @relation("InventoryCountCounter", fields: [countedBy], references: [id], onDelete: SetNull)' },
  { old: 'approver      User?                      @relation("InventoryCountApprover", fields: [approvedBy], references: [id])', new: 'approver      User?                      @relation("InventoryCountApprover", fields: [approvedBy], references: [id], onDelete: SetNull)' },
  
  // InventoryCountItem
  { old: 'part        Part             @relation(fields: [partId], references: [id], onDelete: Cascade)', new: 'part        Part             @relation(fields: [partId], references: [id], onDelete: Cascade)' }, // already has it
  
  // InventoryTransfer
  { old: 'tenant   Tenant   @relation(fields: [tenantId], references: [id])\n\n  @@index([tenantId])\n  @@index([fromWarehouseId])', new: 'tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)\n\n  @@index([tenantId])\n  @@index([fromWarehouseId])' },
  
  // Warranty
  { old: 'tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)\n  vehicle  Vehicle  @relation(fields: [vehicleId], references: [id], onDelete: Cascade)', new: 'tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)\n  vehicle  Vehicle  @relation(fields: [vehicleId], references: [id], onDelete: Cascade)' }, // already fixed
  
  // InstallmentPlan
  { old: 'tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)\n  customer Customer   @relation(fields: [customerId], references: [id])', new: 'tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)\n  customer Customer   @relation(fields: [customerId], references: [id], onDelete: Cascade)' },
  
  // InstallmentPayment
  { old: 'plan     InstallmentPlan @relation(fields: [installmentPlanId], references: [id], onDelete: Cascade)', new: 'plan     InstallmentPlan @relation(fields: [installmentPlanId], references: [id], onDelete: Cascade)' }, // already has it
  
  // Cheque
  { old: 'tenant   Tenant   @relation(fields: [tenantId], references: [id])\n\n  @@index([tenantId])\n  @@index([chequeNumber])', new: 'tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)\n\n  @@index([tenantId])\n  @@index([chequeNumber])' },
  
  // ChequeTransaction
  { old: 'cheque   Cheque   @relation(fields: [chequeId], references: [id], onDelete: Cascade)', new: 'cheque   Cheque   @relation(fields: [chequeId], references: [id], onDelete: Cascade)' }, // already has it
  
  // MechanicRating
  { old: 'tenant   Tenant   @relation(fields: [tenantId], references: [id])\n\n  @@index([tenantId])', new: 'tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)\n\n  @@index([tenantId])' },
];

for (const fix of fixes) {
  if (s.includes(fix.old)) {
    s = s.replace(fix.old, fix.new);
  }
}

fs.writeFileSync(schemaPath, s, 'utf-8');
console.log('Remaining onDelete fixes applied!');
