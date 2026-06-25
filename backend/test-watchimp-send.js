const axios = require('axios');

const API_KEY = '21423JUx94zwkdxZfOdvYwb9fdapp3R1b1CTdT4o4Yp14e195e91d';
const PHONE_NUMBER_ID = '1150123448190988';
const BASE_URL = 'https://app.whatchimp.com/api/v1';
const TEST_PHONE = '+963XXXXXXXXX'; // Replace with your phone number for testing

async function testSend() {
  try {
    const response = await axios.post(
      `${BASE_URL}/whatsapp/send`,
      {
        apiToken: API_KEY,
        phone_number_id: PHONE_NUMBER_ID,
        message: 'Test message from Auto Renew backend',
        phone_number: TEST_PHONE,
      },
      { timeout: 10000, headers: { 'Content-Type': 'application/json' } }
    );

    console.log('✅ SUCCESS:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ ERROR:', error.response?.status, JSON.stringify(error.response?.data || error.message, null, 2));
  }
}

console.log('⚠️  Replace TEST_PHONE with a real phone number before running');
// testSend(); // Uncomment after setting TEST_PHONE
