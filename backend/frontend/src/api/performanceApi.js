// src/api/performanceApi.js
// API service for performance metrics

import axios from './index';

const performanceApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/performance`,
});

// Request interceptor to add auth token
performanceApi.interceptors.request.use(
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

// Response interceptor for error handling
performanceApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Performance API functions
export const performanceApiService = {
  // Get performance overview for all roles
  getPerformanceOverview: () => performanceApi.get('/overview'),
  
  // Get performance for a specific marketer
  getMarketerPerformance: (marketerId) => performanceApi.get(`/marketer/${marketerId}`),
  
  // Get performance for a specific admin
  getAdminPerformance: (adminId) => performanceApi.get(`/admin/${adminId}`),
  
  // Get performance for a specific superadmin
  getSuperAdminPerformance: (superAdminId) => performanceApi.get(`/superadmin/${superAdminId}`)
};

export default performanceApiService;
