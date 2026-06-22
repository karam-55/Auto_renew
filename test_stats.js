const jwt = require('jsonwebtoken');
const http = require('http');

const JWT_SECRET = 'KrfWZpe5S7CznwBTagd6iqXFOv8xyA41MQjEumotGc9shN0bk3RL2DVPHlJUYI';
const dealerId = '1ea616a9-52cd-4a23-af38-25d34262d2c1';
const tenantId = 'default';

const token = jwt.sign({ dealerId, tenantId }, JWT_SECRET, { expiresIn: '1h' });
console.log('Token:', token);

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/dealers/me/stats',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (e) => console.error('Request error:', e.message));
req.end();
