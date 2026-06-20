const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function safeCount(model) {
  try {
    if (!prisma[model] || !prisma[model].count) return 'N/A';
    return await prisma[model].count();
  } catch (e) {
    return `Error: ${e.message}`;
  }
}

async function checkDatabase() {
  try {
    console.log('=== Database Status ===');
    console.log(`bookings: ${await safeCount('booking')}`);
    console.log(`customers: ${await safeCount('customer')}`);
    console.log(`vehicles: ${await safeCount('vehicle')}`);
    console.log(`invoices: ${await safeCount('invoice')}`);
    console.log(`users: ${await safeCount('user')}`);
    console.log(`services: ${await safeCount('service')}`);
    console.log(`payments: ${await safeCount('payment')}`);
    console.log(`accounts: ${await safeCount('account')}`);
    console.log(`inventoryItems: ${await safeCount('inventoryItem')}`);
    console.log(`auditLogs: ${await safeCount('auditLog')}`);
    console.log(`fiscalPeriods: ${await safeCount('fiscalPeriod')}`);
    console.log(`journalEntries: ${await safeCount('journalEntry')}`);
    console.log(`memberships: ${await safeCount('membership')}`);
    console.log(`workOrders: ${await safeCount('workOrder')}`);
    console.log(`mechanics: ${await safeCount('mechanic')}`);

    // Check migrations
    const migrations = await prisma.$queryRaw`SELECT migration_name, finished_at FROM "_prisma_migrations" ORDER BY finished_at DESC LIMIT 5`;
    console.log('\n=== Latest Migrations ===');
    migrations.forEach(m => {
      console.log(`${m.migration_name} - ${m.finished_at}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
