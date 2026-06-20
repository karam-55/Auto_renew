const prisma = require('../dist/config/database.js').default;

async function test() {
  try {
    const customer = await prisma.customer.findFirst();
    console.log('Customer found:', customer ? customer.fullName : 'none');
    console.log('deletedAt field exists:', customer && 'deletedAt' in customer);
    console.log('deletedAt value:', customer ? customer.deletedAt : 'N/A');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
