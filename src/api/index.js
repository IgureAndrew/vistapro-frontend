import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,  // point at your /api namespace
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      const msg = error.response.data?.message || "";
      // if it’s a token‑expiry or unauthorized, clear and force login
      if (msg.toLowerCase().includes("expired") || msg.toLowerCase().includes("invalid")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
