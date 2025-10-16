import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Create axios instance with auth header
const api = axios.create({
  baseURL: `${API_URL}/api/user-management`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Lock a user account
 * @param {number} userId - User ID to lock
 * @param {string} reason - Reason for locking
 */
export const lockUser = async (userId, reason) => {
  try {
    const response = await api.put(`/${userId}/lock`, { reason });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Unlock a user account
 * @param {number} userId - User ID to unlock
 */
export const unlockUser = async (userId) => {
  try {
    const response = await api.put(`/${userId}/unlock`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Soft delete a user account (preserve data)
 * @param {number} userId - User ID to soft delete
 */
export const softDeleteUser = async (userId) => {
  try {
    const response = await api.delete(`/${userId}/soft`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Hard delete a user account (permanent deletion)
 * @param {number} userId - User ID to hard delete
 */
export const hardDeleteUser = async (userId) => {
  try {
    const response = await api.delete(`/${userId}/hard`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Restore a soft-deleted user account
 * @param {number} userId - User ID to restore
 */
export const restoreUser = async (userId) => {
  try {
    const response = await api.put(`/${userId}/restore`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get all soft-deleted users
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 */
export const getDeletedUsers = async (page = 1, limit = 20) => {
  try {
    const response = await api.get('/deleted', {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get user activity history
 * @param {number} userId - User ID
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 */
export const getUserActivity = async (userId, page = 1, limit = 50) => {
  try {
    const response = await api.get(`/${userId}/activity`, {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Check user status (locked/deleted)
 * @param {number} userId - User ID
 */
export const checkUserStatus = async (userId) => {
  try {
    const response = await api.get(`/${userId}/status`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export default {
  lockUser,
  unlockUser,
  softDeleteUser,
  hardDeleteUser,
  restoreUser,
  getDeletedUsers,
  getUserActivity,
  checkUserStatus
};

