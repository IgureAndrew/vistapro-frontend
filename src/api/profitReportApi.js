// src/api/profitReportApi.js
import axios from 'axios';

const profitApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api/profit-report',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// pull the JWT from localStorage before each request
profitApi.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default profitApi;
