// src/components/ModernAccountSettings.jsx
import React, { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { Eye, EyeOff, Camera, Save, Edit3, X, Check, AlertCircle, Upload, User, ArrowLeft } from "lucide-react";
import api from "../api";

const ModernAccountSettings = ({ userRole, roleDisplayName, onNavigate }) => {
  // State management
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  
  // Profile data
  const [profileData, setProfileData] = useState({
    displayName: "",
    email: "",
    phone: "",
    gender: "",
    profile_image: "",
    avatarPreview: ""
  });
  
  // Form data (for editing)
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    phone: "",
    gender: "",
    newPassword: "",
    oldPassword: ""
  });
  
  // UI states
  const [message, setMessage] = useState({ type: "", text: "" });
  const [avatarFile, setAvatarFile] = useState(null);
  const fileInputRef = useRef(null);
  
  const token = localStorage.getItem("token");
  
  // Determine API endpoint based on role
  const getApiEndpoint = () => {
    switch (userRole) {
      case "MasterAdmin":
        return "/master-admin/profile";
      case "SuperAdmin":
        return "/super-admin/account";
      case "Admin":
        return "/admin/account";
      case "Dealer":
        return "/dealer/account";
      case "Marketer":
        return "/marketer/account";
      default:
        return "/auth/me";
    }
  };

  // Load profile data
  const loadProfileData = async () => {
    setIsLoading(true);
    try {
      const endpoint = getApiEndpoint();
      console.log(`🔍 Loading profile data for ${userRole} from endpoint: ${endpoint}`);
      
      const response = await api.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`✅ Profile data response:`, response.data);
      
      let account = null;
      
      // Handle different response formats based on role
      if (userRole === "MasterAdmin") {
        // MasterAdmin uses /profile endpoint with different format
        account = response.data.user;
        console.log("🔍 MasterAdmin response data:", response.data);
      } else if (response.data.success && response.data.account) {
        // Other roles use standardized account format
        account = response.data.account;
        console.log("🔍 Other role response data:", response.data);
      } else if (response.data.user) {
        // Fallback for auth/me endpoint
        account = response.data.user;
        console.log("🔍 Auth/me response data:", response.data);
      }
      
      console.log("🔍 Extracted account data:", account);
      
      if (account) {
        // Construct display name from first_name and last_name
        const displayName = account.displayName || 
          (account.first_name && account.last_name ? 
            `${account.first_name} ${account.last_name}` : 
            account.first_name || account.last_name || "");
        
        // Capitalize gender for display
        const displayGender = account.gender ? 
          account.gender.charAt(0).toUpperCase() + account.gender.slice(1).toLowerCase() : "";
        
        // Construct proper image URL
        let avatarPreview = "";
        if (account.profile_image) {
          // Remove any existing path prefixes if they exist
          const imageName = account.profile_image.replace(/^uploads\//, '');
          avatarPreview = `${import.meta.env.VITE_API_URL || 'http://localhost:5007'}/uploads/${imageName}`;
        }
        
        const data = {
          displayName: displayName,
          email: account.email || "",
          phone: account.phone || "",
          gender: displayGender,
          profile_image: account.profile_image || "",
          avatarPreview: avatarPreview
        };
        
        console.log(`📊 Setting profile data:`, data);
        console.log(`🖼️ Avatar preview URL:`, avatarPreview);
        
        setProfileData(data);
        setFormData({
          displayName: data.displayName,
          email: data.email,
          phone: data.phone,
          gender: data.gender,
          newPassword: "",
          oldPassword: ""
        });
      } else {
        console.error("❌ No account data found in response");
        setMessage({ type: "error", text: "No profile data found" });
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Show specific error message
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          "Failed to load profile data";
      setMessage({ type: "error", text: errorMessage });
      
      // Set empty data to prevent "Not set" display
      setProfileData({
        displayName: "",
        email: "",
        phone: "",
        gender: "",
        profile_image: "",
        avatarPreview: ""
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

  // Handle avatar file selection
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: "error", text: "Please select an image file" });
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: "error", text: "File size must be less than 5MB" });
        return;
      }
      
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setProfileData(prev => ({ ...prev, avatarPreview: previewUrl }));
      setHasChanges(true);
    }
  };

  // Save profile changes
  const saveProfile = async () => {
    setIsSaving(true);
    setMessage({ type: "", text: "" });
    
    try {
      const endpoint = getApiEndpoint();
      console.log(`💾 Saving profile data for ${userRole} to endpoint: ${endpoint}`);
      console.log(`📝 Form data:`, {
        displayName: formData.displayName,
        email: formData.email,
        phone: formData.phone,
        gender: formData.gender,
        hasAvatar: !!avatarFile,
        hasNewPassword: !!formData.newPassword
      });
      
      const formDataToSend = new FormData();
      
      // Handle different field names for MasterAdmin
      if (userRole === "MasterAdmin") {
        // MasterAdmin uses different field names
        formDataToSend.append("email", formData.email || "");
        formDataToSend.append("phone", formData.phone || "");
        // Send gender as-is (database now accepts both cases)
        formDataToSend.append("gender", formData.gender || "");
        
        if (avatarFile) {
          formDataToSend.append("profileImage", avatarFile);
        }
        
        if (formData.newPassword) {
          formDataToSend.append("newPassword", formData.newPassword);
        }
      } else {
        // Other roles use standardized field names
        formDataToSend.append("displayName", formData.displayName || "");
        formDataToSend.append("email", formData.email || "");
        formDataToSend.append("phone", formData.phone || "");
        // Send gender as-is (database now accepts both cases)
        formDataToSend.append("gender", formData.gender || "");
        
        if (avatarFile) {
          formDataToSend.append("profile_image", avatarFile);
        }
        
        if (formData.newPassword) {
          formDataToSend.append("newPassword", formData.newPassword);
          formDataToSend.append("oldPassword", formData.oldPassword);
        }
      }
      
      // Use PUT for MasterAdmin, PATCH for others
      const method = userRole === "MasterAdmin" ? "put" : "patch";
      const response = await api[method](getApiEndpoint(), formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });
      
      // Handle different success responses
      const isSuccess = response.data.success || response.data.message?.includes('successfully');
      
      if (isSuccess) {
        setMessage({ type: "success", text: "Profile updated successfully!" });
        setIsEditing(false);
        setHasChanges(false);
        setAvatarFile(null);
        setFormData(prev => ({ ...prev, newPassword: "", oldPassword: "" }));
        
        // Update profile data with response
        let updatedAccount = null;
        if (response.data.account) {
          updatedAccount = response.data.account;
        } else if (response.data.user) {
          updatedAccount = response.data.user;
        }
        
        if (updatedAccount) {
          const displayName = updatedAccount.displayName || 
            (updatedAccount.first_name && updatedAccount.last_name ? 
              `${updatedAccount.first_name} ${updatedAccount.last_name}` : 
              updatedAccount.first_name || updatedAccount.last_name || "");
          
          // Capitalize gender for display
          const displayGender = updatedAccount.gender ? 
            updatedAccount.gender.charAt(0).toUpperCase() + updatedAccount.gender.slice(1).toLowerCase() : 
            "";
          
          // Construct proper image URL
          let avatarPreview = "";
          if (updatedAccount.profile_image) {
            // Remove any existing path prefixes if they exist
            const imageName = updatedAccount.profile_image.replace(/^uploads\//, '');
            avatarPreview = `${import.meta.env.VITE_API_URL || 'http://localhost:5007'}/uploads/${imageName}`;
          }
          
          const updatedData = {
            displayName: displayName,
            email: updatedAccount.email || "",
            phone: updatedAccount.phone || "",
            gender: displayGender,
            profile_image: updatedAccount.profile_image || "",
            avatarPreview: avatarPreview
          };
          
          console.log(`✅ Updated profile data:`, updatedData);
          
          setProfileData(updatedData);
          setFormData(prev => ({
            ...prev,
            displayName: updatedData.displayName,
            email: updatedData.email,
            phone: updatedData.phone,
            gender: updatedData.gender
          }));
        }
      } else {
        throw new Error(response.data.message || "Update failed");
      }
    } catch (error) {
      console.error("Save error:", error);
      console.error("Save error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Show specific error message
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          "Failed to update profile";
      setMessage({ 
        type: "error", 
        text: errorMessage 
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    setFormData({
      displayName: profileData.displayName,
      email: profileData.email,
      phone: profileData.phone,
      gender: profileData.gender,
      newPassword: "",
      oldPassword: ""
    });
    setAvatarFile(null);
    setHasChanges(false);
    setIsEditing(false);
    setMessage({ type: "", text: "" });
  };

  // Load data on component mount
  useEffect(() => {
    loadProfileData();
  }, []);

  // Auto-hide success messages
  useEffect(() => {
    if (message.type === "success") {
      const timer = setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Back to Overview Navigation */}
      {onNavigate && (
        <div className="mb-6">
          <button
            onClick={() => onNavigate('overview')}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Overview</span>
          </button>
        </div>
      )}

        {/* Message Display */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-center ${
            message.type === "success" 
              ? "bg-green-50 text-green-800 border border-green-200" 
              : "bg-red-50 text-red-800 border border-red-200"
          }`}>
            {message.type === "success" ? (
              <Check className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Overview Card */}
          <div className="lg:col-span-1">
            <Card className="h-fit">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">Profile Overview</CardTitle>
                <CardDescription>Your public information</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                {/* Avatar */}
                <div className="relative inline-block mb-6">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
                    {profileData.avatarPreview ? (
                      <img
                        src={profileData.avatarPreview}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <User className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 shadow-lg hover:bg-blue-700 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Profile Info */}
                <div className="space-y-3 text-left">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Display Name</span>
                    <p className="text-lg font-semibold text-gray-900">
                      {profileData.displayName || "Not set"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Email</span>
                    <p className="text-lg font-semibold text-gray-900">
                      {profileData.email || "Not set"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Phone</span>
                    <p className="text-lg font-semibold text-gray-900">
                      {profileData.phone || "Not set"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Gender</span>
                    <p className="text-lg font-semibold text-gray-900">
                      {profileData.gender || "Not set"}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 space-y-2">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <button
                        onClick={saveProfile}
                        disabled={isSaving || !hasChanges}
                        className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                      >
                        {isSaving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Profile Information</CardTitle>
                <CardDescription>
                  {isEditing ? "Update your personal details" : "View your personal details"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Display Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your display name"
                      />
                    ) : (
                      <p className="text-lg text-gray-900">{profileData.displayName || "Not set"}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your email"
                      />
                    ) : (
                      <p className="text-lg text-gray-900">{profileData.email || "Not set"}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your phone number"
                      />
                    ) : (
                      <p className="text-lg text-gray-900">{profileData.phone || "Not set"}</p>
                    )}
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    {isEditing ? (
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <p className="text-lg text-gray-900">{profileData.gender || "Not set"}</p>
                    )}
                  </div>

                  {/* Password Section - Only show when editing */}
                  {isEditing && (
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Password
                          </label>
                          <div className="relative">
                            <input
                              type={showOldPassword ? "text" : "password"}
                              name="oldPassword"
                              value={formData.oldPassword}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter current password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowOldPassword(!showOldPassword)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                              {showOldPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              name="newPassword"
                              value={formData.newPassword}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter new password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500">
                          Leave password fields empty to keep current password
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
        />
    </div>
  );
};

export default ModernAccountSettings;
