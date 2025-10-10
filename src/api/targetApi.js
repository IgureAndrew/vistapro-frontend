// src/api/targetApi.js
// API client for target management

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://vistapro-backend.onrender.com';

const targetApi = axios.create({
  baseURL: `${API_URL}/api/target-management`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
targetApi.interceptors.request.use(
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
targetApi.interceptors.response.use(
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

// API methods for target management
export const targetApiService = {
  // Get unique user locations
  getLocations: () => {
    return targetApi.get('/locations');
  },

  // Get all targets (Master Admin)
  getAllTargets: (filters = {}) => {
    return targetApi.get('/', { params: filters });
  },

  // Get targets for a specific user
  getUserTargets: (userId) => {
    return targetApi.get(`/user/${userId}`);
  },

  // Get target statistics
  getTargetStats: () => {
    return targetApi.get('/stats');
  },

  // Get target types
  getTargetTypes: () => {
    return targetApi.get('/target-types');
  },

  // Create a new target
  createTarget: (targetData) => {
    return targetApi.post('/', targetData);
  },

  // Update a target
  updateTarget: (targetId, targetData) => {
    return targetApi.put(`/${targetId}`, targetData);
  },

  // Delete a target
  deleteTarget: (targetId) => {
    return targetApi.delete(`/${targetId}`);
  },

  // Activate/Deactivate a target
  toggleTargetStatus: (targetId, isActive) => {
    return targetApi.patch(`/${targetId}/status`, { is_active: isActive });
  },

  // Get users for target creation
  getUsersForTargetCreation: (role = null, location = null) => {
    const params = {};
    if (role) params.role = role;
    if (location) params.location = location;
    return targetApi.get('/users-for-target-creation', { params });
  },

  // Bulk create targets
  bulkCreateTargets: (targetsData) => {
    return targetApi.post('/bulk-create', targetsData);
  },

  // Deactivate target (alias for deleteTarget)
  deactivateTarget: (targetId) => {
    return targetApi.delete(`/${targetId}`);
  }
};

export default targetApi;
