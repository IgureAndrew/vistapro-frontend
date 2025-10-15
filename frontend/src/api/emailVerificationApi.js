// Email Verification API service for VistaPro
const API_BASE_URL = import.meta.env.VITE_API_URL || process.env.REACT_APP_API_URL || 'https://vistapro-backend.onrender.com';

/**
 * Send email verification email
 */
export const sendVerificationEmail = async (email) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/resend-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send verification email');
    }

    return data;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

/**
 * Verify email with token
 */
export const verifyEmail = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/verify-email/${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to verify email');
    }

    return data;
  } catch (error) {
    console.error('Error verifying email:', error);
    throw error;
  }
};

/**
 * Check email verification status
 */
export const checkVerificationStatus = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to check verification status');
    }

    return data;
  } catch (error) {
    console.error('Error checking verification status:', error);
    throw error;
  }
};

// Default export for backward compatibility
const emailVerificationApi = {
  sendVerificationEmail,
  verifyEmail,
  checkVerificationStatus
};

export default emailVerificationApi;
