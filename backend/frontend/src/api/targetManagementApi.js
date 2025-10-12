// src/api/targetManagementApi.js
// API service for target management

import axios from './index';

const targetManagementApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/target-management`,
});

// Request interceptor to add auth token
targetManagementApi.interceptors.request.use(
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
targetManagementApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Target Management API functions
export const targetManagementApiService = {
  // Get all target types
  getTargetTypes: () => targetManagementApi.get('/types'),
  
  // Get targets for a specific user
  getUserTargets: (userId, periodType = null) => {
    const params = periodType ? { periodType } : {};
    return targetManagementApi.get(`/user/${userId}`, { params });
  },
  
  // Get all targets with optional filters
  getAllTargets: (filters = {}) => targetManagementApi.get('/all', { params: filters }),
  
  // Get targets by period
  getTargetsByPeriod: (periodType, periodStart, periodEnd) => 
    targetManagementApi.get('/period', { 
      params: { periodType, periodStart, periodEnd } 
    }),
  
  // Get target statistics
  getTargetStats: () => targetManagementApi.get('/stats'),
  
  // Get users without targets
  getUsersWithoutTargets: (role = null) => {
    const params = role ? { role } : {};
    return targetManagementApi.get('/users-without-targets', { params });
  },
  
  // Get users filtered by role and location for target creation
  getUsersForTargetCreation: (role = null, location = null) => {
    const params = {};
    if (role) params.role = role;
    if (location) params.location = location;
    return targetManagementApi.get('/users-for-target-creation', { params });
  },
  
  // Get target history
  getTargetHistory: (targetId) => targetManagementApi.get(`/history/${targetId}`),
  
  // Create a new target
  createTarget: (data) => targetManagementApi.post('/create', data),
  
  // Bulk create targets
  bulkCreateTargets: (data) => targetManagementApi.post('/bulk-create', data),
  
  // Update an existing target
  updateTarget: (targetId, data) => targetManagementApi.put(`/${targetId}`, data),
  
  // Deactivate a target
  deactivateTarget: (targetId) => targetManagementApi.delete(`/${targetId}`)
};

export default targetManagementApiService;
