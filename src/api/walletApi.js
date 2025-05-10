// src/api/walletApi.js
import axios from 'axios';

const walletApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api/wallets',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
});

// before every request, pull the latest token and set the header
walletApi.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default walletApi;
