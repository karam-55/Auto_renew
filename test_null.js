const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const result = await prisma.dealerWarranty.findMany({
      where: {},
      select: { amountPaid: true, currency: true },
    });
    console.log('Count:', result.length);
    result.forEach((w, i) => {
      console.log(`Row ${i}: amountPaid=${w.amountPaid} (type=${typeof w.amountPaid}), currency=${w.currency} (type=${typeof w.currency})`);
    });
  } catch (e) {
    console.log('ERROR:', e.message);
    console.log('STACK:', e.stack);
  } finally {
    await prisma.$disconnect();
  }
}
test();
