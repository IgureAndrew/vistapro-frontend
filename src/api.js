import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // or your backend base URL
});

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    // If the response is successful, just pass it through
    return response;
  },
  (error) => {
    // If the error response status is 401 and the message is about token expiry,
    // remove token and redirect to login
    if (error.response && error.response.status === 401) {
      const errorMsg = error.response.data?.message;
      if (errorMsg && errorMsg.includes("expired")) {
        // Clear any localStorage items
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // Redirect the user to login
        window.location.href = "/login"; 
      }
    }
    // Otherwise, reject the promise so we can handle other errors
    return Promise.reject(error);
  }
);

export default api;
