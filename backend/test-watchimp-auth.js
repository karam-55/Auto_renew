const axios = require('axios');

const API_KEY = '21423JUx94zwkdxZfOdvYwb9fdapp3R1b1CTdT4o4Yp14e195e91d';
const BASE_URL = 'https://app.whatchimp.com/api/v1';
const PAYLOAD = {
  whatsapp_business_account_id: '1995628294419623',
  access_token: 'EAATULkdE5F8BRzOJxfCtWqq0RLJRlkWZCx8LpU4n685hCXLd5jWTkegj3zZBZAElDY1TcuK4d66VJHgeL4D8IZAhfWCVWZCSHw2kt4QR9GqaZAuBiSpbUYxed9UZCels6hGugOA5o135CqlpWlwElKzUeG7vZBI8TREJF10cCqIamBq3e2hZAkheFS4oUGqbIOwZDZD'
};

async function testAuth() {
  const methods = [
    { name: 'apiToken in body', body: { ...PAYLOAD, apiToken: API_KEY } },
    { name: 'apiKey in body', body: { ...PAYLOAD, apiKey: API_KEY } },
    { name: 'api_token in body', body: { ...PAYLOAD, api_token: API_KEY } },
    { name: 'token in body', body: { ...PAYLOAD, token: API_KEY } },
  ];

  for (const method of methods) {
    try {
      console.log(`\nTesting: ${method.name}`);
      const response = await axios.post(`${BASE_URL}/whatsapp/account/connect`, method.body, { timeout: 10000 });
      console.log('✅ SUCCESS:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('❌ ERROR:', error.response?.status, JSON.stringify(error.response?.data || error.message));
    }
  }
}

testAuth();
