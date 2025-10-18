// src/api/adminAssignmentApi.js
// API service for Admin assignment management

import axios from './index';

const adminAssignmentApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/admin`,
});

// Request interceptor to add auth token
adminAssignmentApi.interceptors.request.use(
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
adminAssignmentApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const adminAssignmentApiService = {
  // Get marketers assigned to this admin
  getAssignedMarketers: () => adminAssignmentApi.get('/assigned-marketers'),
  
  // Get assignment statistics for this admin
  getAssignmentStats: () => adminAssignmentApi.get('/assignment-stats'),
  
  // Get dashboard summary (includes assigned marketers data)
  getDashboardSummary: () => adminAssignmentApi.get('/dashboard-summary'),
  
  // Get wallet summary
  getWalletSummary: () => adminAssignmentApi.get('/wallet-summary'),
  
  // Get recent activities
  getRecentActivities: () => adminAssignmentApi.get('/recent-activities'),
  
  // Get verification submissions
  getVerificationSubmissions: () => adminAssignmentApi.get('/verification-submissions'),
  
  // Assign admin to superadmin (MasterAdmin only)
  assignAdminToSuperAdmin: (data) => axios.post(`${import.meta.env.VITE_API_URL}/api/assignments/reassign/admin`, data, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  }),
};

export default adminAssignmentApiService;
