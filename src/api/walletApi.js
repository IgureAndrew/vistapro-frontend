// src/api/walletApi.js
import axios from 'axios';

const walletApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/wallets`
});

// automatically attach your JWT
walletApi.interceptors.request.use(cfg => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// on 401, redirect to login
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
