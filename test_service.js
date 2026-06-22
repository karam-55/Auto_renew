const { DealerService } = require('/app/dist/modules/dealers/service.js');

async function test() {
  try {
    const service = new DealerService();
    const result = await service.getDealerStats('1ea616a9-52cd-4a23-af38-25d34262d2c1');
    console.log('SUCCESS:', JSON.stringify(result));
  } catch (e) {
    console.log('ERROR:', e.message);
    console.log('STACK:', e.stack);
  }
}
test();
