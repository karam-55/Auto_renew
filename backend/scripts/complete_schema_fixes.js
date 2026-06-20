const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let s = fs.readFileSync(schemaPath, 'utf-8');

// Helper: Add field before deletedAt line in a model block
function addFieldBeforeDeletedAt(modelBlock, fieldLine) {
  const lines = modelBlock.split('\n');
  const newLines = [];
  for (const line of lines) {
    if (line.trim().startsWith('deletedAt')) {
      newLines.push(fieldLine);
    }
    newLines.push(line);
  }
  return newLines.join('\n');
}

// 1. Add createdAt to models missing it (that don't have any timestamps)
const modelsNeedingCreatedAt = [
  'MechanicAssignment', 'InvoiceItem', 'ElectronicSignature', 
  'CashRegisterSession', 'CouponUsage', 'TaskAssignment',
  'VehicleMileageLog', 'VehicleIssue', 'PurchaseOrderItem',
  'Installment', 'MaintenancePackageItem', 'InventoryCountItem',
  'CustomerWallet'
];

for (const modelName of modelsNeedingCreatedAt) {
  const regex = new RegExp(`(model ${modelName} \{[\\s\\S]*?)(  deletedAt DateTime\\?)`, 'g');
  s = s.replace(regex, (match, before, deletedAt) => {
    if (match.includes('createdAt')) return match;
    return before + '  createdAt   DateTime  @default(now())\n' + deletedAt;
  });
}

// 2. Add updatedAt to models missing it (that have createdAt but not updatedAt)
const modelsNeedingUpdatedAt = [
  'VehicleFault', 'VehicleRecommendation', 'InvoiceItem', 'Attachment',
  'VehicleIssue', 'VehicleInspectionChecklist', 'PurchaseOrderItem',
  'Installment', 'Review', 'MechanicRating', 'BookingExtraCharge',
  'ChequeTransaction', 'InventoryCountAdjustment', 'Report',
  'DataExport', 'Expense', 'LoyaltyPointTransaction', 'RolePermission',
  'MechanicAssignment', 'ElectronicSignature', 'CashRegisterSession',
  'CouponUsage', 'TaskAssignment', 'VehicleMileageLog',
  'MaintenancePackageItem', 'InventoryCountItem', 'CustomerWallet'
];

for (const modelName of modelsNeedingUpdatedAt) {
  const regex = new RegExp(`(model ${modelName} \{[\\s\\S]*?)(  deletedAt DateTime\\?)`, 'g');
  s = s.replace(regex, (match, before, deletedAt) => {
    if (match.includes('updatedAt')) return match;
    return before + '  updatedAt   DateTime  @updatedAt\n' + deletedAt;
  });
}

// 3. Fix remaining onDelete rules
const onDeleteFixes = [
  // User relations
  { model: 'User', old: 'employee               Employee?', new: 'employee               Employee? @relation(fields: [id], references: [userId], onDelete: SetNull)' },
  { model: 'User', old: 'cashRegister           CashRegister?', new: 'cashRegister           CashRegister? @relation(fields: [id], references: [cashierUserId], onDelete: SetNull)' },
  
  // Currency
  { model: 'Currency', old: 'exchangeRatesFrom ExchangeRate[] @relation("ExchangeRatesFrom")', new: 'exchangeRatesFrom ExchangeRate[] @relation("ExchangeRatesFrom")' }, // already has relation name
  { model: 'Currency', old: 'exchangeRatesTo   ExchangeRate[] @relation("ExchangeRatesTo")', new: 'exchangeRatesTo   ExchangeRate[] @relation("ExchangeRatesTo")' },
  
  // ExchangeRate
  { model: 'ExchangeRate', old: 'fromCurrency   Currency @relation("ExchangeRatesFrom", fields: [fromCurrencyId], references: [id])', new: 'fromCurrency   Currency @relation("ExchangeRatesFrom", fields: [fromCurrencyId], references: [id], onDelete: Cascade)' },
  { model: 'ExchangeRate', old: 'toCurrency     Currency @relation("ExchangeRatesTo", fields: [toCurrencyId], references: [id])', new: 'toCurrency     Currency @relation("ExchangeRatesTo", fields: [toCurrencyId], references: [id], onDelete: Cascade)' },
  
  // Attendance
  { model: 'Attendance', old: 'employee    Employee  @relation(fields: [employeeId], references: [id])', new: 'employee    Employee  @relation(fields: [employeeId], references: [id], onDelete: Cascade)' },
  
  // PayrollRecord
  { model: 'PayrollRecord', old: 'employee       Employee      @relation(fields: [employeeId], references: [id])', new: 'employee       Employee      @relation(fields: [employeeId], references: [id], onDelete: Cascade)' },
  
  // GoodsReceiptNote
  { model: 'GoodsReceiptNote', old: 'warehouse   Warehouse @relation(fields: [warehouseId], references: [id])', new: 'warehouse   Warehouse @relation(fields: [warehouseId], references: [id], onDelete: Cascade)' },
  { model: 'GoodsReceiptNote', old: 'supplier    Supplier  @relation(fields: [supplierId], references: [id])', new: 'supplier    Supplier  @relation(fields: [supplierId], references: [id], onDelete: Cascade)' },
  
  // Review
  { model: 'Review', old: 'booking   Booking  @relation(fields: [bookingId], references: [id])', new: 'booking   Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)' },
  
  // AppointmentLog
  { model: 'AppointmentLog', old: 'tenant   Tenant   @relation(fields: [tenantId], references: [id])', new: 'tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)' },
  
  // BookingExtraCharge
  { model: 'BookingExtraCharge', old: 'tenant   Tenant   @relation(fields: [tenantId], references: [id])', new: 'tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)' },
  
  // PreventiveMaintenanceLog
  { model: 'PreventiveMaintenanceLog', old: 'tenant   Tenant   @relation(fields: [tenantId], references: [id])', new: 'tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)' },
  
  // MaintenancePackage
  { model: 'MaintenancePackage', old: 'tenant   Tenant   @relation(fields: [tenantId], references: [id])', new: 'tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)' },
  
  // InventoryCount
  { model: 'InventoryCount', old: 'tenant   Tenant   @relation(fields: [tenantId], references: [id])', new: 'tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)' },
  { model: 'InventoryCount', old: 'counter   User      @relation("InventoryCountCounter", fields: [counterId], references: [id])', new: 'counter   User      @relation("InventoryCountCounter", fields: [counterId], references: [id], onDelete: SetNull)' },
  { model: 'InventoryCount', old: 'approver  User?     @relation("InventoryCountApprover", fields: [approverId], references: [id])', new: 'approver  User?     @relation("InventoryCountApprover", fields: [approverId], references: [id], onDelete: SetNull)' },
  
  // InventoryTransfer
  { model: 'InventoryTransfer', old: 'tenant   Tenant   @relation(fields: [tenantId], references: [id])', new: 'tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)' },
  
  // Warranty
  { model: 'Warranty', old: 'tenant   Tenant   @relation(fields: [tenantId], references: [id])', new: 'tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)' },
  { model: 'Warranty', old: 'vehicle  Vehicle  @relation(fields: [vehicleId], references: [id])', new: 'vehicle  Vehicle  @relation(fields: [vehicleId], references: [id], onDelete: Cascade)' },
  
  // WarrantyClaim
  { model: 'WarrantyClaim', old: 'tenant   Tenant   @relation(fields: [tenantId], references: [id])', new: 'tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)' },
  
  // InstallmentPlan
  { model: 'InstallmentPlan', old: 'tenant   Tenant   @relation(fields: [tenantId], references: [id])', new: 'tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)' },
  
  // InstallmentPayment
  { model: 'InstallmentPayment', old: 'tenant   Tenant   @relation(fields: [tenantId], references: [id])', new: 'tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)' },
  { model: 'InstallmentPayment', old: 'plan     InstallmentPlan @relation(fields: [installmentPlanId], references: [id])', new: 'plan     InstallmentPlan @relation(fields: [installmentPlanId], references: [id], onDelete: Cascade)' },
  
  // Cheque
  { model: 'Cheque', old: 'tenant   Tenant   @relation(fields: [tenantId], references: [id])', new: 'tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)' },
  
  // ChequeTransaction
  { model: 'ChequeTransaction', old: 'cheque   Cheque   @relation(fields: [chequeId], references: [id])', new: 'cheque   Cheque   @relation(fields: [chequeId], references: [id], onDelete: Cascade)' },
  
  // InventoryCountAdjustment
  { model: 'InventoryCountAdjustment', old: 'countItem InventoryCountItem @relation(fields: [countItemId], references: [id])', new: 'countItem InventoryCountItem @relation(fields: [countItemId], references: [id], onDelete: Cascade)' },
  
  // MechanicRating
  { model: 'MechanicRating', old: 'tenant   Tenant   @relation(fields: [tenantId], references: [id])', new: 'tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)' },
];

for (const fix of onDeleteFixes) {
  if (s.includes(fix.old)) {
    s = s.replace(fix.old, fix.new);
  }
}

// 4. Fix CompanySettings - remove duplicate fields
// Remove: companyAddress (keep address), companyPhone (keep phone), companyLogoUrl (keep logoUrl)
// These are true duplicates
s = s.replace(/  companyAddress\s+String\?\n/, '');
s = s.replace(/  companyPhone\s+String\?\n/, '');
s = s.replace(/  companyLogoUrl\s+String\?\n/, '');

fs.writeFileSync(schemaPath, s, 'utf-8');
console.log('Complete schema fixes applied!');
console.log('- Added createdAt to 13 models');
console.log('- Added updatedAt to 25+ models');
console.log('- Fixed remaining onDelete rules');
console.log('- Removed duplicate fields from CompanySettings');
