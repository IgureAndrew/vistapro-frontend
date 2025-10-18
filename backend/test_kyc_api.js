// test_kyc_api.js
// Test the KYC tracking API endpoints

const axios = require('axios');

const API_BASE = 'https://vistapro-backend.onrender.com/api';

async function testKYCAPI() {
  try {
    console.log('🧪 Testing KYC Tracking API...\n');
    
    // Test 1: Get all KYC tracking data
    console.log('📊 Test 1: GET /kyc-tracking/?days=30');
    try {
      const response = await axios.get(`${API_BASE}/kyc-tracking/?days=30`, {
        headers: {
          'Authorization': 'Bearer test-token' // This will fail auth, but we'll see if endpoint exists
        }
      });
      console.log('✅ Success:', response.data);
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) {
          console.log('✅ Endpoint exists (401 Unauthorized - expected without valid token)');
        } else {
          console.log('❌ Error:', error.response.status, error.response.data);
        }
      } else {
        console.log('❌ Network Error:', error.message);
      }
    }
    
    console.log('\n📊 Test 2: GET /kyc-tracking/statistics/overview');
    try {
      const response = await axios.get(`${API_BASE}/kyc-tracking/statistics/overview`, {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      console.log('✅ Success:', response.data);
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) {
          console.log('✅ Endpoint exists (401 Unauthorized - expected without valid token)');
        } else {
          console.log('❌ Error:', error.response.status, error.response.data);
        }
      } else {
        console.log('❌ Network Error:', error.message);
      }
    }
    
    console.log('\n✅ All tests completed!\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testKYCAPI();


