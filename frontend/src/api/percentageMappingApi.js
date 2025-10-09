// src/api/percentageMappingApi.js
// API service for target percentage mappings

import axios from './index';

const percentageMappingApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/percentage-mappings`,
});

// Request interceptor to add auth token
percentageMappingApi.interceptors.request.use(
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
percentageMappingApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

/**
 * Get all percentage mappings with optional filters
 */
export const getPercentageMappings = async (filters = {}) => {
  try {
    const response = await percentageMappingApi.get('/', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error getting percentage mappings:', error);
    throw error;
  }
};

/**
 * Get percentage mapping by ID
 */
export const getPercentageMappingById = async (id) => {
  try {
    const response = await percentageMappingApi.get(`/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error getting percentage mapping by ID:', error);
    throw error;
  }
};

/**
 * Create a new percentage mapping
 */
export const createPercentageMapping = async (mappingData) => {
  try {
    const response = await percentageMappingApi.post('/', mappingData);
    return response.data;
  } catch (error) {
    console.error('Error creating percentage mapping:', error);
    throw error;
  }
};

/**
 * Update a percentage mapping
 */
export const updatePercentageMapping = async (id, mappingData) => {
  try {
    const response = await percentageMappingApi.put(`/${id}`, mappingData);
    return response.data;
  } catch (error) {
    console.error('Error updating percentage mapping:', error);
    throw error;
  }
};

/**
 * Delete a percentage mapping
 */
export const deletePercentageMapping = async (id) => {
  try {
    const response = await percentageMappingApi.delete(`/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting percentage mapping:', error);
    throw error;
  }
};

/**
 * Get orders count for a specific percentage
 */
export const getOrdersCountForPercentage = async (percentage, targetType, bnplPlatform = null, location = null) => {
  try {
    const params = { percentage, targetType };
    if (bnplPlatform) params.bnplPlatform = bnplPlatform;
    if (location) params.location = location;
    
    const response = await percentageMappingApi.get('/utility/orders-count', { params });
    return response.data;
  } catch (error) {
    console.error('Error getting orders count for percentage:', error);
    throw error;
  }
};

/**
 * Get available percentages for a target type
 */
export const getAvailablePercentages = async (targetType, bnplPlatform = null, location = null) => {
  try {
    const params = { targetType };
    if (bnplPlatform) params.bnplPlatform = bnplPlatform;
    if (location) params.location = location;
    
    const response = await percentageMappingApi.get('/utility/available-percentages', { params });
    return response.data;
  } catch (error) {
    console.error('Error getting available percentages:', error);
    throw error;
  }
};

export default percentageMappingApi;
