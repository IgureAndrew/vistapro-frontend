// src/api/walletApi.js
import axios from 'axios';

const walletApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/wallets`
});

// copy over any interceptors you need, e.g. auth:
walletApi.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
walletApi.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default walletApi;
