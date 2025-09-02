// Test script for ProfileStorageManager
// Run this in browser console to test the hybrid storage system

import profileStorage from './profileStorage.js';

const testProfileStorage = () => {
  console.log('🧪 Testing ProfileStorageManager...');
  
  // Test data
  const testProfile = {
    email: 'test@example.com',
    phone: '+1234567890',
    gender: 'Male',
    profile_image: 'test-avatar.jpg',
    uniqueid: 'SM000001',
    role: 'SuperAdmin'
  };
  
  // Test 1: Save profile data
  console.log('Test 1: Saving profile data...');
  const saveResult = profileStorage.saveProfileData(testProfile);
  console.log('Save result:', saveResult);
  
  // Test 2: Load profile data
  console.log('Test 2: Loading profile data...');
  const loadedProfile = profileStorage.loadProfileData();
  console.log('Loaded profile:', loadedProfile);
  
  // Test 3: Check storage status
  console.log('Test 3: Checking storage status...');
  const status = profileStorage.getStorageStatus();
  console.log('Storage status:', status);
  
  // Test 4: Update specific field
  console.log('Test 4: Updating specific field...');
  const updateResult = profileStorage.updateProfileField('phone', '+9876543210');
  console.log('Update result:', updateResult);
  
  // Test 5: Load updated data
  console.log('Test 5: Loading updated data...');
  const updatedProfile = profileStorage.loadProfileData();
  console.log('Updated profile:', updatedProfile);
  
  // Test 6: Get avatar data
  console.log('Test 6: Getting avatar data...');
  const avatarData = profileStorage.getAvatarData();
  console.log('Avatar data:', avatarData);
  
  console.log('✅ All tests completed!');
  
  return {
    saveResult,
    loadedProfile,
    status,
    updateResult,
    updatedProfile,
    avatarData
  };
};

// Export for use in browser console
window.testProfileStorage = testProfileStorage;

export default testProfileStorage;
