// OTP API service for VistaPro
const API_BASE_URL = import.meta.env.VITE_API_URL || process.env.REACT_APP_API_URL || 'https://vistapro-backend.onrender.com';

/**
 * Send OTP to user's email
 */
export const sendOTP = async (email) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/otp/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send OTP');
    }

    return data;
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw error;
  }
};

/**
 * Verify OTP code
 */
export const verifyOTP = async (email, otpCode) => {
  try {
    console.log('🔍 Frontend: Sending OTP verification request...', { email, otpCode });
    
    const response = await fetch(`${API_BASE_URL}/api/otp/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otpCode }),
    });

    console.log('🔍 Frontend: Response status:', response.status, response.ok);
    
    const data = await response.json();
    console.log('🔍 Frontend: Response data:', data);

    if (!response.ok) {
      console.error('❌ Frontend: Response not OK, throwing error:', data.message);
      throw new Error(data.message || 'Invalid OTP code');
    }

    console.log('✅ Frontend: Response OK, returning data:', data);
    return data;
  } catch (error) {
    console.error('❌ Frontend: Error in verifyOTP:', error);
    throw error;
  }
};

/**
 * Get grace period status for user
 */
export const getGracePeriodStatus = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/otp/grace-period-status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get grace period status');
    }

    return data;
  } catch (error) {
    console.error('Error getting grace period status:', error);
    throw error;
  }
};

/**
 * Update user's email address
 */
export const updateEmail = async (token, newEmail) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/otp/update-email`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ newEmail }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update email');
    }

    return data;
  } catch (error) {
    console.error('Error updating email:', error);
    throw error;
  }
};

/**
 * Send email update reminder
 */
export const sendEmailUpdateReminder = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/otp/send-reminder`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send reminder');
    }

    return data;
  } catch (error) {
    console.error('Error sending reminder:', error);
    throw error;
  }
};

// Default export for backward compatibility
const otpApiService = {
  sendOTP,
  verifyOTP,
  getGracePeriodStatus,
  updateEmail,
  sendEmailUpdateReminder
};

export default otpApiService;