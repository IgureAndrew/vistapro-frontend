// src/api/authApi.js
import axios from "axios";

const authApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/auth`
});

// automatically attach token on every request
authApi.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// if we ever get a 401 here, force a logout
authApi.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // if you’re using react‐router you might do:
      window.location.replace("/");
    }
    return Promise.reject(err);
  }
);

export default authApi;
