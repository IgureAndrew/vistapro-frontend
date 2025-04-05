import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // This value comes from your .env file
});

// Add an interceptor to handle 401 errors (expired/invalid token)
api.interceptors.response.use(
  (response) => response, // Pass through successful responses
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token is invalid or expired: clear token and redirect to login
      localStorage.removeItem("token");
      window.location.href = "/login"; // Adjust based on your routing
    }
    return Promise.reject(error);
  }
);

export default api;
