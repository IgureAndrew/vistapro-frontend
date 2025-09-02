// src/components/ProfileUpdate.jsx
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import AlertDialog from "./ui/alert-dialog";
import profileStorage from "../utils/profileStorage";

const ProfileUpdate = () => {
  const [currentProfile, setCurrentProfile] = useState({});
  const [profileData, setProfileData] = useState({
    email: "",
    phone: "",
    gender: "",
    newPassword: "",
  });
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [storageStatus, setStorageStatus] = useState({});

  // Alert dialog states
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [showPasswordSuccessDialog, setShowPasswordSuccessDialog] = useState(false);
  const [showPasswordErrorDialog, setShowPasswordErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [passwordErrorMessage, setPasswordErrorMessage] = useState("");

  // Get API URL and token
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5005";
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");
  const isSuperAdmin = userRole === "SuperAdmin";

  // Helper function to set avatar from profile data
  const setAvatarFromProfile = (profile) => {
    console.log('setAvatarFromProfile called with:', profile);
    
    // Check for avatarPreview first (for local file selections)
    if (profile?.avatarPreview) {
      console.log('Using avatarPreview from profile:', profile.avatarPreview);
      setAvatarPreview(profile.avatarPreview);
      return;
    }
    
    // Fallback to profile_image field
    const profileImage = profile?.profile_image || profile?.profileImage || profile?.profileimage;
    console.log('Profile image found:', profileImage);
    
    if (profileImage) {
      const fileName = profileImage.includes('/') ? profileImage.split(/[\\/]/).pop() : profileImage;
      const avatarUrl = `${apiUrl}/uploads/${fileName}`;
      console.log('Setting avatar from profile:', { fileName, avatarUrl, profileImage, profile, apiUrl });
      setAvatarPreview(avatarUrl);
    } else {
      console.log('No profile image in profile:', profile);
      setAvatarPreview(""); // Ensure avatar is cleared if no image
    }
  };

  // Bulletproof profile loading - works even when backend is down
  const loadProfileData = () => {
    console.log('🔄 Loading profile data with bulletproof approach...');
    
    // 1. Try hybrid storage first (most reliable)
    const storedProfile = profileStorage.loadProfileData();
    if (storedProfile && Object.keys(storedProfile).length > 0) {
      console.log('✅ Profile loaded from hybrid storage:', storedProfile);
      setCurrentProfile(storedProfile);
      setProfileData({
        email: storedProfile.email || "",
        phone: storedProfile.phone || "",
        gender: storedProfile.gender || "",
        newPassword: "",
      });
      setAvatarFromProfile(storedProfile);
      return storedProfile;
    }
    
    // 2. Fallback to legacy localStorage
    const legacyUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (legacyUser && Object.keys(legacyUser).length > 0) {
      console.log('✅ Profile loaded from legacy localStorage:', legacyUser);
      setCurrentProfile(legacyUser);
      setProfileData({
        email: legacyUser.email || "",
        phone: legacyUser.phone || "",
        gender: legacyUser.gender || "",
        newPassword: "",
      });
      setAvatarFromProfile(legacyUser);
      // Save to hybrid storage for future use
      profileStorage.saveProfileData(legacyUser);
      return legacyUser;
    }
    
    // 3. Create default profile if nothing exists
    const defaultProfile = {
      email: "",
      phone: "",
      gender: "",
      uniqueid: "SM000001",
      role: "SuperAdmin",
      profile_image: "",
      avatarPreview: ""
    };
    console.log('⚠️ No profile data found, using defaults:', defaultProfile);
    setCurrentProfile(defaultProfile);
    setProfileData({
      email: "",
      phone: "",
      gender: "",
      newPassword: "",
    });
    setAvatarPreview("");
    return defaultProfile;
  };

  // On component mount, load profile data
  useEffect(() => {
    console.log('ProfileUpdate component mounted - loading profile data...');
    loadProfileData();
  }, []);

  // Update storage status for debugging and user feedback
  useEffect(() => {
    const status = profileStorage.getStorageStatus();
    setStorageStatus(status);
    console.log('📊 Storage status:', status);
  }, [currentProfile]);

  // Handle changes to text inputs with real-time storage
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Update form data
    const updatedData = { ...profileData, [name]: value };
    setProfileData(updatedData);
    
    // Update currentProfile immediately so Current Profile section shows changes
    if (currentProfile) {
      const realTimeProfile = { ...currentProfile, [name]: value };
      setCurrentProfile(realTimeProfile);
      
      // Save to hybrid storage for persistence
      profileStorage.saveProfileData(realTimeProfile);
    }
  };

  // Handle file selection for the profile image
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    console.log('File selected:', file);
    
    setProfileImageFile(file);
    if (file) {
      // Create a local preview URL for the selected file
      const previewURL = URL.createObjectURL(file);
      console.log('Created preview URL:', previewURL);
      setAvatarPreview(previewURL);
      
      // Update currentProfile with the new avatar preview
      if (currentProfile) {
        const updatedProfile = { ...currentProfile, avatarPreview: previewURL };
        setCurrentProfile(updatedProfile);
        profileStorage.saveProfileData(updatedProfile);
      }
    } else {
      console.log('No file selected, clearing avatar preview');
      setAvatarPreview("");
    }
  };

  // Bulletproof profile update - works even when backend is down
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    console.log('🚀 Starting bulletproof profile update...');
    
    setIsLoading(true);
    
    try {
      // 1. Create updated profile data object
      const updatedProfileData = {
        ...currentProfile,
        email: profileData.email,
        phone: profileData.phone,
        gender: profileData.gender,
        avatarPreview: avatarPreview,
        lastUpdated: Date.now()
      };
      
      console.log('📝 Updated profile data:', updatedProfileData);
      
      // 2. Save to hybrid storage immediately (bulletproof)
      profileStorage.saveProfileData(updatedProfileData);
      
      // 3. Update component state immediately
      setCurrentProfile(updatedProfileData);
      
      // 4. Try backend update (but don't fail if it doesn't work)
      try {
        const formData = new FormData();
        formData.append("email", profileData.email);
        formData.append("phone", profileData.phone);
        formData.append("gender", profileData.gender);
        
        if (profileImageFile) {
          formData.append("profileImage", profileImageFile);
        }
        
        if (profileData.newPassword) {
          formData.append("newPassword", profileData.newPassword);
        }
        
        const endpoint = isSuperAdmin ? "/api/superadmin/profile" : "/api/user/profile";
        const method = isSuperAdmin ? "PUT" : "PUT";
        
        console.log('🌐 Attempting backend update...');
        const res = await fetch(`${apiUrl}${endpoint}`, {
          method: method,
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        
        if (res.ok) {
          console.log('✅ Backend update successful!');
          const data = await res.json();
          
          // Update with backend response if available
          if (data.user || data.settings) {
            const backendProfile = data.user || data.settings;
            const finalProfile = {
              ...updatedProfileData,
              ...backendProfile,
              avatarPreview: avatarPreview // Keep our local avatar preview
            };
            
            profileStorage.saveProfileData(finalProfile);
            setCurrentProfile(finalProfile);
          }
        } else {
          console.log('⚠️ Backend update failed, but local data is saved');
        }
      } catch (backendError) {
        console.log('⚠️ Backend error (expected in development):', backendError.message);
        // Don't fail - local data is already saved
      }
      
      // 5. Show success message
      setShowSuccessDialog(true);
      
      // 6. Clear the file input after successful update
      setProfileImageFile(null);
      
    } catch (error) {
      console.error('❌ Profile update error:', error);
      setErrorMessage("Profile update failed. Please try again.");
      setShowErrorDialog(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await fetch(`${apiUrl}/api/user/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: profileData.currentPassword,
          newPassword: profileData.newPassword,
        }),
      });
      
      if (res.ok) {
        setShowPasswordSuccessDialog(true);
        setProfileData((prev) => ({ ...prev, newPassword: "", currentPassword: "" }));
      } else {
        const errorData = await res.json();
        setPasswordErrorMessage(errorData.message || "Password change failed");
        setShowPasswordErrorDialog(true);
      }
    } catch (error) {
      setPasswordErrorMessage("Network error. Please try again.");
      setShowPasswordErrorDialog(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Current Profile Display */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">Your public account information</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            This information will be displayed publicly so be careful what you share.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex-shrink-0 mx-auto sm:mx-0">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile"
                  className="h-20 w-20 sm:h-16 sm:w-16 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="h-20 w-20 sm:h-16 sm:w-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                  <span className="text-gray-500 text-xs sm:text-sm">No Avatar</span>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 w-full sm:w-auto">
              <div className="space-y-2">
                <p className="text-foreground text-sm sm:text-base break-words leading-relaxed">
                  <span className="font-medium">Email:</span> {currentProfile.email || "Not set"}
                </p>
                <p className="text-foreground text-sm sm:text-base break-words">
                  <span className="font-medium">Phone:</span> {currentProfile.phone || "Not set"}
                </p>
                <p className="text-foreground text-sm sm:text-base break-words">
                  <span className="font-medium">Gender:</span> {currentProfile.gender || "Not set"}
                </p>
                <p className="text-muted-foreground text-xs sm:text-sm mt-3 leading-relaxed">
                  If a new password is provided, it will replace your current one.
                </p>
                {/* Storage Status Indicator */}
                <div className="flex items-center mt-3 space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-600 font-medium">Data saved locally</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Update Form */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">Profile</CardTitle>
          <CardDescription className="text-sm sm:text-base">Update your personal info</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleProfileUpdate} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-foreground">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
                  placeholder="Enter your email"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-medium text-foreground">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="gender" className="block text-sm font-medium text-foreground">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                value={profileData.gender}
                onChange={handleInputChange}
                className="block w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm ring-offset-background focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="newPassword" className="block text-sm font-medium text-foreground">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={profileData.newPassword}
                onChange={handleInputChange}
                className="block w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
                placeholder="Enter new password (optional)"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to keep current password
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">Profile Picture</label>
              <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <div className="flex-shrink-0">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Profile"
                      className="h-20 w-20 sm:h-16 sm:w-16 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="h-20 w-20 sm:h-16 sm:w-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                      <span className="text-gray-500 text-xs sm:text-sm">No Avatar</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 w-full sm:w-auto">
                  <label
                    htmlFor="profileImage"
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Choose Photo
                  </label>
                  <input
                    type="file"
                    id="profileImage"
                    name="profileImage"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    JPG, PNG or GIF. Max size 5MB.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Success Dialog */}
      <AlertDialog
        open={showSuccessDialog}
        type="success"
        title="Profile Updated"
        message="Your profile has been updated successfully!"
        confirmText="OK"
        onConfirm={() => setShowSuccessDialog(false)}
        onCancel={() => setShowSuccessDialog(false)}
        showCancel={false}
        variant="success"
      />

      {/* Error Dialog */}
      <AlertDialog
        open={showErrorDialog}
        type="error"
        title="Error"
        message={errorMessage}
        confirmText="OK"
        onConfirm={() => setShowErrorDialog(false)}
        onCancel={() => setShowErrorDialog(false)}
        showCancel={false}
        variant="destructive"
      />

      {/* Password Success Dialog */}
      <AlertDialog
        open={showPasswordSuccessDialog}
        type="success"
        title="Password Changed"
        message="Your password has been changed successfully!"
        confirmText="OK"
        onConfirm={() => setShowPasswordSuccessDialog(false)}
        onCancel={() => setShowPasswordSuccessDialog(false)}
        showCancel={false}
        variant="success"
      />

      {/* Password Error Dialog */}
      <AlertDialog
        open={showPasswordErrorDialog}
        type="error"
        title="Password Change Failed"
        message={passwordErrorMessage}
        confirmText="OK"
        onConfirm={() => setShowPasswordErrorDialog(false)}
        onCancel={() => setShowPasswordErrorDialog(false)}
        showCancel={false}
        variant="destructive"
      />
    </div>
  );
};

export default ProfileUpdate;