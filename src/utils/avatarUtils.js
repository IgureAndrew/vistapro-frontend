/**
 * Avatar Utility Functions
 * Provides consistent avatar URL construction across the application
 */

/**
 * Constructs a proper avatar URL from profile_image data
 * @param {string} profileImage - The profile_image value from database
 * @param {string} fallback - Fallback URL if no profile image
 * @returns {string} Complete avatar URL or fallback
 */
export const getAvatarUrl = (profileImage, fallback = null) => {
  if (!profileImage) {
    return fallback;
  }
  
  // Check if it's already a Base64 string
  if (profileImage.startsWith('data:image/')) {
    return profileImage;
  }
  
  // Handle both legacy (uploads/filename) and new (filename) formats
  const imageName = profileImage.startsWith('uploads/') 
    ? profileImage.replace(/^uploads\//, '') 
    : profileImage;
  
  // Use proxy URL to avoid CORS issues
  const isDevelopment = import.meta.env.DEV;
  let fullUrl;
  
  if (isDevelopment) {
    // In development, use the Vite proxy to avoid CORS
    fullUrl = `/api/uploads/${imageName}`;
  } else {
    // In production, use the full API URL
    const baseUrl = import.meta.env.VITE_API_URL || 'https://vistapro-backend.onrender.com';
    fullUrl = `${baseUrl}/uploads/${imageName}`;
  }
  
  return fullUrl;
};

/**
 * Gets user initials for avatar fallback
 * @param {Object} user - User object with first_name and last_name
 * @returns {string} User initials (e.g., "AI" for Andrew Igure)
 */
export const getUserInitials = (user) => {
  if (!user) return 'U';
  
  const firstName = user.first_name || '';
  const lastName = user.last_name || '';
  
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  } else if (firstName) {
    return firstName[0].toUpperCase();
  } else if (lastName) {
    return lastName[0].toUpperCase();
  }
  
  return 'U';
};

/**
 * Updates user data in localStorage with proper avatar URL
 * @param {Object} userData - User data object
 * @returns {Object} Updated user data with avatar URL
 */
export const updateUserWithAvatar = (userData) => {
  if (!userData) return null;
  
  const updatedUser = {
    ...userData,
    avatar: getAvatarUrl(userData.profile_image)
  };
  
  // Update localStorage
  localStorage.setItem('user', JSON.stringify(updatedUser));
  
  return updatedUser;
};
