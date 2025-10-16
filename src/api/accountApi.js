import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || process.env.REACT_APP_API_URL || 'https://vistapro-backend.onrender.com';

// Create axios instance with auth token
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Account Management APIs
export const accountApi = {
  // Get current user's account details
  getAccount: async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = user.role?.toLowerCase();
    
    // Handle different route patterns for different roles
    let endpoint;
    if (role === 'masteradmin') {
      endpoint = `/api/master-admin/profile`;
    } else if (role === 'superadmin') {
      endpoint = `/api/super-admin/account`;
    } else if (role === 'admin') {
      endpoint = `/api/admin/account`;
    } else if (role === 'marketer') {
      endpoint = `/api/marketer/account`;
    } else if (role === 'dealer') {
      endpoint = `/api/dealer/account`;
    } else {
      throw new Error(`Unsupported role: ${role}`);
    }
    
    const response = await apiClient.get(endpoint);
    
    // Handle different response structures
    if (role === 'masteradmin' && response.data.user) {
      return response.data.user;
    }
    
    return response.data;
  },

  // Update account details
  updateAccount: async (accountData) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = user.role?.toLowerCase();
    
    // Handle different route patterns for different roles
    let endpoint;
    let method = 'PATCH';
    if (role === 'masteradmin') {
      endpoint = `/api/master-admin/profile`;
      method = 'PUT';
    } else if (role === 'superadmin') {
      endpoint = `/api/super-admin/account`;
    } else if (role === 'admin') {
      endpoint = `/api/admin/account`;
    } else if (role === 'marketer') {
      endpoint = `/api/marketer/account`;
    } else if (role === 'dealer') {
      endpoint = `/api/dealer/account`;
    } else {
      throw new Error(`Unsupported role: ${role}`);
    }
    
    // Handle file upload for profile picture
    const formData = new FormData();
    
    // Add text fields
    Object.keys(accountData).forEach(key => {
      if (key !== 'profile_image' && accountData[key] !== undefined && accountData[key] !== null) {
        formData.append(key, accountData[key]);
      }
    });
    
    // Add profile image if it's a file
    if (accountData.profile_image && accountData.profile_image instanceof File) {
      formData.append('profile_image', accountData.profile_image);
    } else if (accountData.profile_image && typeof accountData.profile_image === 'string') {
      // If it's a base64 string or URL, add it as a field
      formData.append('profile_image', accountData.profile_image);
    }
    
    const response = await apiClient({
      method,
      url: endpoint,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = user.role?.toLowerCase();
    
    // Handle different route patterns for different roles
    let endpoint;
    let method = 'PATCH';
    if (role === 'masteradmin') {
      endpoint = `/api/master-admin/profile`;
      method = 'PUT';
    } else if (role === 'superadmin') {
      endpoint = `/api/super-admin/account`;
    } else if (role === 'admin') {
      endpoint = `/api/admin/account`;
    } else if (role === 'marketer') {
      endpoint = `/api/marketer/account`;
    } else if (role === 'dealer') {
      endpoint = `/api/dealer/account`;
    } else {
      throw new Error(`Unsupported role: ${role}`);
    }
    
    const response = await apiClient({
      method,
      url: endpoint,
      data: {
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      }
    });
    return response.data;
  },

  // Get login history
  getLoginHistory: async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = user.role?.toLowerCase();
    
    let endpoint;
    if (role === 'masteradmin') {
      endpoint = `/api/master-admin/profile/login-history`;
    } else if (role === 'superadmin') {
      endpoint = `/api/super-admin/profile/login-history`;
    } else if (role === 'admin') {
      endpoint = `/api/admin/profile/login-history`;
    } else if (role === 'marketer') {
      endpoint = `/api/marketer/profile/login-history`;
    } else if (role === 'dealer') {
      endpoint = `/api/dealer/profile/login-history`;
    } else {
      throw new Error(`Unsupported role: ${role}`);
    }
    
    const response = await apiClient.get(endpoint);
    return response.data;
  },

  // Toggle OTP
  toggleOTP: async (enabled) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = user.role?.toLowerCase();
    
    let endpoint;
    if (role === 'masteradmin') {
      endpoint = `/api/master-admin/profile/otp-toggle`;
    } else if (role === 'superadmin') {
      endpoint = `/api/super-admin/profile/otp-toggle`;
    } else if (role === 'admin') {
      endpoint = `/api/admin/profile/otp-toggle`;
    } else if (role === 'marketer') {
      endpoint = `/api/marketer/profile/otp-toggle`;
    } else if (role === 'dealer') {
      endpoint = `/api/dealer/profile/otp-toggle`;
    } else {
      throw new Error(`Unsupported role: ${role}`);
    }
    
    const response = await apiClient.patch(endpoint, { enable: enabled });
    return response.data;
  },

  // Get user preferences
  getPreferences: async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = user.role?.toLowerCase();
    
    let endpoint;
    if (role === 'masteradmin') {
      endpoint = `/api/master-admin/profile/preferences`;
    } else if (role === 'superadmin') {
      endpoint = `/api/super-admin/profile/preferences`;
    } else if (role === 'admin') {
      endpoint = `/api/admin/profile/preferences`;
    } else if (role === 'marketer') {
      endpoint = `/api/marketer/profile/preferences`;
    } else if (role === 'dealer') {
      endpoint = `/api/dealer/profile/preferences`;
    } else {
      throw new Error(`Unsupported role: ${role}`);
    }
    
    const response = await apiClient.get(endpoint);
    return response.data;
  },

  // Update user preferences
  updatePreferences: async (preferences) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = user.role?.toLowerCase();
    
    let endpoint;
    if (role === 'masteradmin') {
      endpoint = `/api/master-admin/profile/preferences`;
    } else if (role === 'superadmin') {
      endpoint = `/api/super-admin/profile/preferences`;
    } else if (role === 'admin') {
      endpoint = `/api/admin/profile/preferences`;
    } else if (role === 'marketer') {
      endpoint = `/api/marketer/profile/preferences`;
    } else if (role === 'dealer') {
      endpoint = `/api/dealer/profile/preferences`;
    } else {
      throw new Error(`Unsupported role: ${role}`);
    }
    
    const response = await apiClient.patch(endpoint, preferences);
    return response.data;
  },

  // Get notification preferences
  getNotificationPreferences: async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = user.role?.toLowerCase();
    
    let endpoint;
    if (role === 'masteradmin') {
      endpoint = `/api/master-admin/profile/notification-preferences`;
    } else if (role === 'superadmin') {
      endpoint = `/api/super-admin/profile/notification-preferences`;
    } else if (role === 'admin') {
      endpoint = `/api/admin/profile/notification-preferences`;
    } else if (role === 'marketer') {
      endpoint = `/api/marketer/profile/notification-preferences`;
    } else if (role === 'dealer') {
      endpoint = `/api/dealer/profile/notification-preferences`;
    } else {
      throw new Error(`Unsupported role: ${role}`);
    }
    
    const response = await apiClient.get(endpoint);
    return response.data;
  },

  // Update notification preferences
  updateNotificationPreferences: async (preferences) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = user.role?.toLowerCase();
    
    let endpoint;
    if (role === 'masteradmin') {
      endpoint = `/api/master-admin/profile/notification-preferences`;
    } else if (role === 'superadmin') {
      endpoint = `/api/super-admin/profile/notification-preferences`;
    } else if (role === 'admin') {
      endpoint = `/api/admin/profile/notification-preferences`;
    } else if (role === 'marketer') {
      endpoint = `/api/marketer/profile/notification-preferences`;
    } else if (role === 'dealer') {
      endpoint = `/api/dealer/profile/notification-preferences`;
    } else {
      throw new Error(`Unsupported role: ${role}`);
    }
    
    const response = await apiClient.patch(endpoint, preferences);
    return response.data;
  },

  // Get notifications
  getNotifications: async () => {
    const response = await apiClient.get('/api/notifications');
    return response.data;
  },

  // Mark notification as read
  markNotificationAsRead: async (notificationId) => {
    const response = await apiClient.patch(`/api/notifications/${notificationId}/read`);
    return response.data;
  },
};

export default accountApi;
