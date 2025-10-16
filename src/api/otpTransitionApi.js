// OTP Transition API service for MasterAdmin
import api from './index';

const API_BASE_URL = import.meta.env.VITE_API_URL || process.env.REACT_APP_API_URL || 'https://vistapro-backend.onrender.com';

/**
 * Get OTP transition statistics
 */
export const getTransitionStats = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/otp-transition/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch transition stats');
    }

    return data;
  } catch (error) {
    console.error('Error fetching transition stats:', error);
    throw error;
  }
};

/**
 * Get users with transition status
 */
export const getTransitionUsers = async (token, filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.role) queryParams.append('role', filters.role);
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);

    const response = await fetch(`${API_BASE_URL}/api/otp-transition/users?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch transition users');
    }

    return data;
  } catch (error) {
    console.error('Error fetching transition users:', error);
    throw error;
  }
};

/**
 * Send bulk email reminders
 */
export const sendBulkReminders = async (token, userIds, reminderType) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/otp-transition/bulk-reminders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userIds, reminderType }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send bulk reminders');
    }

    return data;
  } catch (error) {
    console.error('Error sending bulk reminders:', error);
    throw error;
  }
};

/**
 * Export transition data to CSV
 */
export const exportTransitionData = async (token, filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.role) queryParams.append('role', filters.role);

    const response = await fetch(`${API_BASE_URL}/api/otp-transition/export?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export transition data');
    }

    // Get the CSV data as blob
    const blob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `otp-transition-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Error exporting transition data:', error);
    throw error;
  }
};

// Default export for backward compatibility
const otpTransitionApi = {
  getTransitionStats,
  getTransitionUsers,
  sendBulkReminders,
  exportTransitionData
};

export default otpTransitionApi;
