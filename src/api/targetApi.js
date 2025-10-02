// src/api/targetApi.js
// API client for target management

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5007';

const targetApi = axios.create({
  baseURL: `${API_URL}/api/targets`,
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

export default targetApi;
