// src/api/notifApi.js
import axios from "axios";

const notifApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/notifications`,
});

notifApi.interceptors.request.use(cfg => {
  const t = localStorage.getItem("token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

export default notifApi;
