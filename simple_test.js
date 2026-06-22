const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const result = await prisma.dealerWarranty.findMany({
      where: {},
      select: { amountPaid: true, currency: true },
      take: 1,
    });
    console.log('SUCCESS:', JSON.stringify(result));
  } catch (e) {
    console.log('ERROR:', e.message);
    console.log('CODE:', e.code);
    console.log('META:', JSON.stringify(e.meta));
  } finally {
    await prisma.$disconnect();
  }
}
test();
