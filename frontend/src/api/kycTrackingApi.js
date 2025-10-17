// src/api/kycTrackingApi.js
// API service for KYC tracking

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://vistapro-backend.onrender.com';

const kycTrackingApi = axios.create({
  baseURL: `${API_URL}/api/kyc-tracking`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
kycTrackingApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
kycTrackingApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const kycTrackingService = {
  // Get KYC timeline for a specific submission
  getKYCTimeline: async (submissionId) => {
    const response = await kycTrackingApi.get(`/${submissionId}/timeline`);
    return response.data;
  },

  // Get all KYC tracking data
  getAllKYCTracking: async (params = {}) => {
    const response = await kycTrackingApi.get('/', { params });
    return response.data;
  },

  // Log a KYC action
  logKYCAction: async (actionData) => {
    const response = await kycTrackingApi.post('/log', actionData);
    return response.data;
  },

  // Get KYC statistics
  getKYCStatistics: async (days = 30) => {
    const response = await kycTrackingApi.get('/statistics/overview', {
      params: { days }
    });
    return response.data;
  }
};

export default kycTrackingApi;

