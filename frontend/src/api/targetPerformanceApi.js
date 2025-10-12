// src/api/targetPerformanceApi.js
// API client for target-based performance analysis

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://vistapro-backend.onrender.com';

// Create axios instance
const targetPerformanceApi = axios.create({
  baseURL: `${API_BASE_URL}/api/target-performance`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
targetPerformanceApi.interceptors.request.use(
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

// Add response interceptor for error handling
targetPerformanceApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const targetPerformanceApiService = {
  // Get all users performance with filters
  getAllUsersPerformance: (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.period) params.append('period', filters.period);
    if (filters.location) params.append('location', filters.location);
    if (filters.targetType) params.append('targetType', filters.targetType);
    if (filters.performanceRange) params.append('performanceRange', filters.performanceRange);
    if (filters.role) params.append('role', filters.role);
    
    return targetPerformanceApi.get('/all', { params });
  },

  // Get specific user's performance
  getUserPerformance: (userId, startDate = null, endDate = null) => {
    const params = new URLSearchParams();
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    return targetPerformanceApi.get(`/user/${userId}`, { params });
  },

  // Get user's current targets for dashboard widget
  getMyTargets: () => {
    return targetPerformanceApi.get('/my-targets');
  },

  // Get performance statistics summary
  getPerformanceStats: (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.period) params.append('period', filters.period);
    if (filters.location) params.append('location', filters.location);
    if (filters.role) params.append('role', filters.role);
    
    return targetPerformanceApi.get('/stats', { params });
  }
};

export default targetPerformanceApiService;

