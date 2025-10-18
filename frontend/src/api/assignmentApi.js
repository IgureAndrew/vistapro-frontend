// src/api/assignmentApi.js
// API service for user assignment management

import axios from './index';

const assignmentApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/master-admin`,
});

// Request interceptor to add auth token
assignmentApi.interceptors.request.use(
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
assignmentApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Assignment API functions
export const assignmentApiService = {
  // Get assignments for a specific user
  getAssignmentsByUser: (userId) => assignmentApi.get(`/user/${userId}`),
  
  // Get marketers assigned to a specific admin/superadmin
  getAssignedMarketers: (userId) => assignmentApi.get(`/assigned/${userId}`),
  
  // Get the admin/superadmin assigned to a specific marketer
  getMarketerAssignment: (marketerId) => assignmentApi.get(`/marketer/${marketerId}`),
  
  // Get unassigned marketers
  getUnassignedMarketers: () => assignmentApi.get('/unassigned-marketers'),
  
  // Get available assignees (admins and superadmins)
  getAvailableAssignees: () => axios.get(`${import.meta.env.VITE_API_URL}/api/assignments/assignees`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  }),
  
  // Get assignment statistics
  getAssignmentStats: () => assignmentApi.get('/assignment-stats'),

  // Get current assignments with hierarchical structure
  getCurrentAssignments: () => assignmentApi.get('/hierarchical-assignments'),

  // Get all available locations
  getAllLocations: () => assignmentApi.get('/locations'),

  // Get users by location for reassignment
  getUsersByLocation: (location) => assignmentApi.get(`/location/${location}`),
  
  // Assign a marketer to an admin/superadmin
  assignMarketer: (data) => assignmentApi.post('/assign-marketer', data),

  // Reassign a marketer to a different admin
  reassignMarketer: (data) => assignmentApi.post('/reassign/marketer', data),

  // Reassign an admin to a different superadmin
  reassignAdmin: (data) => assignmentApi.post('/reassign/admin', data),
  
  // Bulk assign marketers
  bulkAssignMarketers: (data) => assignmentApi.post('/bulk-assign', data),
  
  // Update an assignment
  updateAssignment: (assignmentId, data) => assignmentApi.put(`/${assignmentId}`, data),
  
  // Deactivate an assignment
  deactivateAssignment: (assignmentId) => assignmentApi.delete(`/${assignmentId}`)
};

export default assignmentApiService;