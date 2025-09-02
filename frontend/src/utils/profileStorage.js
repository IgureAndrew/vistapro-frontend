// Profile Storage Manager - Hybrid localStorage + sessionStorage approach
// This ensures profile data persists even when backend is down

class ProfileStorageManager {
  constructor() {
    this.STORAGE_KEYS = {
      PROFILE: 'userProfile',
      SESSION_PROFILE: 'currentProfile',
      AVATAR: 'userAvatar',
      BACKUP: 'profileBackup'
    };
  }

  // Save profile data to multiple storage locations for redundancy
  saveProfileData(profileData) {
    try {
      console.log('💾 Saving profile data to multiple storage locations:', profileData);
      
      // 1. localStorage (persistent across sessions)
      localStorage.setItem(this.STORAGE_KEYS.PROFILE, JSON.stringify(profileData));
      
      // 2. sessionStorage (current session only)
      sessionStorage.setItem(this.STORAGE_KEYS.SESSION_PROFILE, JSON.stringify(profileData));
      
      // 3. Backup in localStorage with different key
      localStorage.setItem(this.STORAGE_KEYS.BACKUP, JSON.stringify(profileData));
      
      // 4. Save avatar separately for quick access
      if (profileData.profile_image || profileData.profileImage || profileData.profileimage) {
        const avatarData = {
          profile_image: profileData.profile_image || profileData.profileImage || profileData.profileimage,
          timestamp: Date.now()
        };
        localStorage.setItem(this.STORAGE_KEYS.AVATAR, JSON.stringify(avatarData));
      }
      
      console.log('✅ Profile data saved successfully to all storage locations');
      return true;
    } catch (error) {
      console.error('❌ Error saving profile data:', error);
      return false;
    }
  }

  // Load profile data from multiple sources with fallback
  loadProfileData() {
    try {
      console.log('📂 Loading profile data from storage...');
      
      // Try localStorage first (most persistent)
      let profileData = localStorage.getItem(this.STORAGE_KEYS.PROFILE);
      if (profileData) {
        const parsed = JSON.parse(profileData);
        console.log('✅ Loaded from localStorage:', parsed);
        return parsed;
      }
      
      // Fallback to sessionStorage
      profileData = sessionStorage.getItem(this.STORAGE_KEYS.SESSION_PROFILE);
      if (profileData) {
        const parsed = JSON.parse(profileData);
        console.log('✅ Loaded from sessionStorage:', parsed);
        return parsed;
      }
      
      // Fallback to backup
      profileData = localStorage.getItem(this.STORAGE_KEYS.BACKUP);
      if (profileData) {
        const parsed = JSON.parse(profileData);
        console.log('✅ Loaded from backup storage:', parsed);
        return parsed;
      }
      
      console.log('⚠️ No profile data found in any storage location');
      return null;
    } catch (error) {
      console.error('❌ Error loading profile data:', error);
      return null;
    }
  }

  // Get avatar data specifically
  getAvatarData() {
    try {
      const avatarData = localStorage.getItem(this.STORAGE_KEYS.AVATAR);
      if (avatarData) {
        const parsed = JSON.parse(avatarData);
        console.log('🖼️ Loaded avatar data:', parsed);
        return parsed;
      }
      return null;
    } catch (error) {
      console.error('❌ Error loading avatar data:', error);
      return null;
    }
  }

  // Update specific profile field
  updateProfileField(field, value) {
    try {
      const currentProfile = this.loadProfileData();
      if (currentProfile) {
        currentProfile[field] = value;
        this.saveProfileData(currentProfile);
        console.log(`✅ Updated ${field} to:`, value);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`❌ Error updating ${field}:`, error);
      return false;
    }
  }

  // Clear all profile data
  clearProfileData() {
    try {
      localStorage.removeItem(this.STORAGE_KEYS.PROFILE);
      sessionStorage.removeItem(this.STORAGE_KEYS.SESSION_PROFILE);
      localStorage.removeItem(this.STORAGE_KEYS.BACKUP);
      localStorage.removeItem(this.STORAGE_KEYS.AVATAR);
      console.log('🗑️ Cleared all profile data');
      return true;
    } catch (error) {
      console.error('❌ Error clearing profile data:', error);
      return false;
    }
  }

  // Check if profile data exists
  hasProfileData() {
    return !!(this.loadProfileData());
  }

  // Get storage status for debugging
  getStorageStatus() {
    return {
      localStorage: !!localStorage.getItem(this.STORAGE_KEYS.PROFILE),
      sessionStorage: !!sessionStorage.getItem(this.STORAGE_KEYS.SESSION_PROFILE),
      backup: !!localStorage.getItem(this.STORAGE_KEYS.BACKUP),
      avatar: !!localStorage.getItem(this.STORAGE_KEYS.AVATAR)
    };
  }

  // Sync with API data (when available)
  syncWithAPI(apiData) {
    try {
      if (apiData) {
        console.log('🔄 Syncing local storage with API data:', apiData);
        this.saveProfileData(apiData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error syncing with API:', error);
      return false;
    }
  }

  // Get profile data with automatic refresh
  getProfileWithRefresh() {
    const profileData = this.loadProfileData();
    if (profileData) {
      // Update timestamp to show data is fresh
      profileData.lastUpdated = Date.now();
      this.saveProfileData(profileData);
    }
    return profileData;
  }
}

// Create singleton instance
const profileStorage = new ProfileStorageManager();

export default profileStorage;
