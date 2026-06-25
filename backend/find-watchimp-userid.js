const axios = require('axios');

const API_KEY = '21423JUx94zwkdxZfOdvYwb9fdapp3R1b1CTdT4o4Yp14e195e91d';
const BASE_URL = 'https://app.whatchimp.com/api/v1';

const endpoints = [
  '/me',
  '/auth/me',
  '/user/me',
  '/user/profile',
  '/account/profile',
  '/profile',
  '/user',
  '/account',
];

async function testEndpoints() {
  console.log('🔍 Searching for Watchimp User ID...\n');

  for (const endpoint of endpoints) {
    try {
      const url = `${BASE_URL}${endpoint}?apiToken=${API_KEY}`;
      console.log(`Testing: ${url}`);
      const response = await axios.get(url, { timeout: 10000 });
      console.log('✅ SUCCESS:', JSON.stringify(response.data, null, 2));
      
      // Look for user ID in response
      const findUserId = (obj, path = '') => {
        for (const key in obj) {
          const currentPath = path ? `${path}.${key}` : key;
          if (key.toLowerCase().includes('user_id') || key.toLowerCase() === 'id' || key.toLowerCase() === 'userid') {
            console.log(`\n🎯 FOUND USER ID at ${currentPath}: ${obj[key]}`);
            return obj[key];
          }
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            const result = findUserId(obj[key], currentPath);
            if (result) return result;
          }
        }
        return null;
      };
      
      const userId = findUserId(response.data);
      if (userId) {
        console.log(`\n✅ User ID: ${userId}`);
        return;
      }
      console.log('---');
    } catch (error) {
      console.log(`❌ FAILED: ${error.response?.status || error.message}\n`);
    }
  }

  console.log('\n⚠️ Could not find User ID automatically. Please contact Watchimp support.');
}

testEndpoints();
