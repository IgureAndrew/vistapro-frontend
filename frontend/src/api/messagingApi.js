import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://vistapro-backend.onrender.com';

const messagingApi = axios.create({
  baseURL: `${API_URL}/api/messaging`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
messagingApi.interceptors.request.use(
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

// Add response interceptor for error handling
messagingApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const messagingService = {
  // Get contacts for the current user
  getContacts: async () => {
    const response = await messagingApi.get('/contacts');
    return response.data;
  },

  // Get conversation with a specific contact
  getConversation: async (contactId) => {
    const response = await messagingApi.get(`/${contactId}`);
    return response.data;
  },

  // Send a message
  sendMessage: async (receiverId, message) => {
    const response = await messagingApi.post('/', {
      receiverId,
      message
    });
    return response.data;
  },

  // Mark messages as read
  markAsRead: async (contactId) => {
    const response = await messagingApi.put(`/${contactId}/read`);
    return response.data;
  },

  // Get unread message count
  getUnreadCount: async () => {
    const response = await messagingApi.get('/unread-count');
    return response.data;
  }
};

export default messagingApi;

