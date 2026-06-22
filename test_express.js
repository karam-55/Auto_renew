const express = require('express');
const { DealerController } = require('/app/dist/modules/dealers/controller.js');
const { DealerService } = require('/app/dist/modules/dealers/service.js');
const { dealerAuth } = require('/app/dist/modules/dealers/middleware.js');

const app = express();
app.use(express.json());

const service = new DealerService();
const controller = new DealerController(service);

app.get('/api/dealers/me/stats', dealerAuth, (req, res) => controller.getDealerStats(req, res));

const server = app.listen(9999, async () => {
  try {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { dealerId: '1ea616a9-52cd-4a23-af38-25d34262d2c1', tenantId: 'default' },
      'KrfWZpe5S7CznwBTagd6iqXFOv8xyA41MQjEumotGc9shN0bk3RL2DVPHlJUYI',
      { expiresIn: '1h' }
    );
    
    const http = require('http');
    const options = {
      hostname: 'localhost',
      port: 9999,
      path: '/api/dealers/me/stats',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', data);
        server.close();
      });
    });
    req.on('error', (e) => { console.error('Request error:', e.message); server.close(); });
    req.end();
  } catch (e) {
    console.error('Setup error:', e);
    server.close();
  }
});
