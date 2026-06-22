const { DealerController } = require('/app/dist/modules/dealers/controller.js');
const { DealerService } = require('/app/dist/modules/dealers/service.js');

async function test() {
  try {
    const service = new DealerService();
    const controller = new DealerController(service);
    
    const req = {
      dealerId: '1ea616a9-52cd-4a23-af38-25d34262d2c1',
      tenantId: 'default',
      requestId: 'test_req_123'
    };
    const res = {
      status: (code) => ({ json: (data) => console.log('STATUS', code, 'JSON', JSON.stringify(data)) }),
      json: (data) => console.log('JSON', JSON.stringify(data))
    };
    
    await controller.getDealerStats(req, res);
  } catch (e) {
    console.log('ERROR:', e.message);
    console.log('STACK:', e.stack);
  }
}
test();
