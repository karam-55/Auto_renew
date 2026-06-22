const http = require('http');
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { dealerId: '1ea616a9-52cd-4a23-af38-25d34262d2c1', tenantId: 'default' },
  'KrfWZpe5S7CznwBTagd6iqXFOv8xyA41MQjEumotGc9shN0bk3RL2DVPHlJUYI',
  { expiresIn: '1h' }
);

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/dealers/me/stats',
  method: 'GET',
  headers: { 'Authorization': `Bearer ${token}` },
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      const body = JSON.parse(data);
      console.log('Response:', JSON.stringify(body, null, 2));
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});
req.on('error', (e) => console.error('Request error:', e.message));
req.end();
