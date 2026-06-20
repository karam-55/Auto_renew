const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const content = fs.readFileSync(schemaPath, 'utf-8');
const lines = content.split('\n');

const models = [];
let currentModel = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.match(/^model \w+ \{/)) {
    const modelName = line.match(/^model (\w+) \{/)[1];
    currentModel = { name: modelName, line: i + 1, hasTenantId: false, hasCreatedAt: false, hasUpdatedAt: false, hasDeletedAt: false, relationCount: 0, cascadeCount: 0, noDeleteRule: [] };
    models.push(currentModel);
  } else if (currentModel && line.match(/^\}/)) {
    currentModel = null;
  } else if (currentModel) {
    if (line.includes('tenantId')) currentModel.hasTenantId = true;
    if (line.includes('createdAt')) currentModel.hasCreatedAt = true;
    if (line.includes('updatedAt')) currentModel.hasUpdatedAt = true;
    if (line.includes('deletedAt')) currentModel.hasDeletedAt = true;
    if (line.includes('@relation(')) {
      currentModel.relationCount++;
      if (line.includes('onDelete:')) {
        currentModel.cascadeCount++;
      } else if (!line.includes('?') && line.includes('@relation')) {
        // Relations without onDelete
        const match = line.match(/(\w+)\s+\w+\s+@relation/);
        if (match) currentModel.noDeleteRule.push(match[1]);
      }
    }
  }
}

console.log('=== SCHEMA WEAKNESS ANALYSIS ===\n');

// 1. Models without tenantId
console.log('1. MODELS WITHOUT tenantId (Multi-tenancy gap):');
models.filter(m => !m.hasTenantId).forEach(m => console.log(`   - ${m.name} (line ${m.line})`));

// 2. Models without soft delete
console.log('\n2. MODELS WITHOUT deletedAt (No soft delete):');
models.filter(m => !m.hasDeletedAt && m.name !== 'Enum' && m.name !== 'EnumType').forEach(m => console.log(`   - ${m.name}`));

// 3. Models without createdAt
console.log('\n3. MODELS WITHOUT createdAt (Missing audit trail):');
models.filter(m => !m.hasCreatedAt).forEach(m => console.log(`   - ${m.name}`));

// 4. Models without updatedAt
console.log('\n4. MODELS WITHOUT updatedAt (Missing update tracking):');
models.filter(m => !m.hasUpdatedAt && !['JournalLine','VehicleHistory','LoyaltyPoint','VehicleMileageLog','Notification','WhatsAppMessage','AuditLog','ExchangeRate','EmployeeBranch','Attendance','CouponUsage','VehicleAttachment','BookingService','ServicePart','PartSuggestion','MechanicAssignment','JournalLine','PromotionCondition','InventoryTransferItem','InventoryCountItem','GoodsReceiptNoteLine','MaintenancePackageItem','TaskAssignment','Note','ElectronicSignature','PushNotificationToken','CashRegisterSession','Payment'].includes(m.name)).forEach(m => console.log(`   - ${m.name}`));

// 5. Relations summary
console.log('\n5. RELATION CASCADE SUMMARY:');
models.forEach(m => {
  if (m.relationCount > 0 && m.cascadeCount < m.relationCount) {
    console.log(`   - ${m.name}: ${m.cascadeCount}/${m.relationCount} have onDelete`);
  }
});

console.log(`\n=== TOTAL MODELS: ${models.length} ===`);
console.log(`Models without tenantId: ${models.filter(m => !m.hasTenantId).length}`);
console.log(`Models without soft delete: ${models.filter(m => !m.hasDeletedAt).length}`);
