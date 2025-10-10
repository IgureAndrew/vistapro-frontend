import api from '../api';

/**
 * Profile Service
 * Handles all profile-related API calls with proper error handling
 */
class ProfileService {
  /**
   * Update user profile with image
   * @param {Object} profileData - Profile data including image
   * @param {string} profileData.profileImage - Base64 encoded image
   * @param {string} profileData.first_name - User's first name
   * @param {string} profileData.last_name - User's last name
   * @param {string} profileData.email - User's email
   * @param {string} profileData.phone - User's phone
   * @param {string} profileData.location - User's location
   * @returns {Promise<Object>} Updated profile data
   */
  async updateProfile(profileData) {
    try {
      console.log('📤 Updating profile with data:', {
        hasImage: !!profileData.profileImage,
        imageLength: profileData.profileImage?.length || 0,
        firstName: profileData.first_name,
        lastName: profileData.last_name
      });

      const response = await api.put('/master-admin/profile', profileData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('✅ Profile updated successfully:', response.data);
      return response.data;

    } catch (error) {
      console.error('❌ Profile update failed:', error);
      
      // Enhanced error handling
      if (error.response) {
        const { status, data } = error.response;
        console.error('Server responded with error:', { status, data });
        
        switch (status) {
          case 400:
            throw new Error(data.message || 'Invalid profile data provided');
          case 401:
            throw new Error('Authentication required. Please log in again.');
          case 403:
            throw new Error('You do not have permission to update this profile');
          case 413:
            throw new Error('Image file too large. Please choose a smaller image.');
          case 422:
            throw new Error(data.message || 'Profile data validation failed');
          case 500:
            throw new Error('Server error occurred. Please try again later.');
          default:
            throw new Error(data.message || `Update failed with status ${status}`);
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
        throw new Error('Network error. Please check your connection and try again.');
      } else {
        console.error('Request setup error:', error.message);
        throw new Error('Failed to update profile. Please try again.');
      }
    }
  }

  /**
   * Get current user profile
   * @returns {Promise<Object>} User profile data
   */
  async getProfile() {
    try {
      const response = await api.get('/master-admin/profile');
      console.log('✅ Profile fetched successfully');
      return response.data;

    } catch (error) {
      console.error('❌ Failed to fetch profile:', error);
      
      if (error.response) {
        const { status, data } = error.response;
        throw new Error(data.message || `Failed to fetch profile (${status})`);
      } else if (error.request) {
        throw new Error('Network error. Please check your connection.');
      } else {
        throw new Error('Failed to fetch profile. Please try again.');
      }
    }
  }

  /**
   * Validate profile data before submission
   * @param {Object} profileData - Profile data to validate
   * @returns {Object} Validation result with isValid and errors
   */
  validateProfileData(profileData) {
    const errors = {};

    // Required fields validation
    if (!profileData.first_name?.trim()) {
      errors.first_name = 'First name is required';
    }

    if (!profileData.last_name?.trim()) {
      errors.last_name = 'Last name is required';
    }

    if (!profileData.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!profileData.phone?.trim()) {
      errors.phone = 'Phone number is required';
    } else {
      // More flexible phone number validation for international numbers
      const phoneRegex = /^[\+]?[0-9][\d\s\-\(\)]{7,15}$/;
      const cleanPhone = profileData.phone.replace(/\s/g, '');
      
      if (!phoneRegex.test(cleanPhone)) {
        errors.phone = 'Please enter a valid phone number (e.g., 07049159042, +2347049159042)';
      }
    }

    // Image validation (if provided)
    if (profileData.profileImage) {
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (profileData.profileImage.length > maxSize * 1.4) { // Base64 is ~33% larger
        errors.profileImage = 'Image file is too large. Please choose a smaller image.';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

export default new ProfileService();