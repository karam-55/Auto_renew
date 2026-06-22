const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');

const { DealerController } = require('/app/dist/modules/dealers/controller.js');
const { DealerService } = require('/app/dist/modules/dealers/service.js');
const { dealerAuth } = require('/app/dist/modules/dealers/middleware.js');
const { requestLoggerMiddleware } = require('/app/dist/middleware/request-logger.middleware.js');
const { securityHeaders, requestIdMiddleware } = require('/app/dist/middleware/security.middleware.js');
const { performanceMiddleware } = require('/app/dist/shared/utils/performance-monitor.js');

const app = express();

// Same middleware order as server.ts
app.use(securityHeaders);
app.use(helmet());
app.use(compression());
app.use(cors({ origin: '*', credentials: true }));
app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(performanceMiddleware);

const service = new DealerService();
const controller = new DealerController(service);

const apiRouter = express.Router();
apiRouter.use('/dealers', (() => {
  const router = express.Router();
  router.get('/me/stats', dealerAuth, (req, res) => controller.getDealerStats(req, res));
  return router;
})());

app.use('/api', apiRouter);

// Error handler (same as server.ts)
app.use((err, req, res, next) => {
  console.error('ERROR CAUGHT:', err.message);
  console.error('STACK:', err.stack);
  res.status(500).json({ error: err.message });
});

const server = app.listen(9998, async () => {
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
      port: 9998,
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
        process.exit(0);
      });
    });
    req.on('error', (e) => { console.error('Request error:', e.message); server.close(); process.exit(1); });
    req.end();
  } catch (e) {
    console.error('Setup error:', e);
    server.close();
    process.exit(1);
  }
});
