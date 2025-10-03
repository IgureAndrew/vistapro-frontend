// src/components/ModernAccountSettings.jsx
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Eye, 
  EyeOff, 
  Save, 
  Edit3, 
  X, 
  Check, 
  AlertCircle, 
  User, 
  ArrowLeft,
  Loader2
} from 'lucide-react';
import ImageUpload from './ImageUpload';
import profileService from '../services/profileService';
import { updateUserWithAvatar } from '../utils/avatarUtils';

/**
 * Modern Account Settings Component
 * Clean, maintainable, and user-friendly profile management
 */
const ModernAccountSettings = ({ userRole, roleDisplayName, onNavigate }) => {
  // UI State
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  
  // Profile Data
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    location: '',
    profile_image: '',
    avatarPreview: ''
  });

  // Form Data (for editing)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    location: '',
    profileImage: null,
    newPassword: '',
    oldPassword: ''
  });

  // Messages and Errors
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formErrors, setFormErrors] = useState({});

  // Load profile data on component mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const account = JSON.parse(localStorage.getItem('user') || '{}');
      
      const profile = {
        first_name: account.first_name || '',
        last_name: account.last_name || '',
        email: account.email || '',
        phone: account.phone || '',
        location: account.location || '',
        profile_image: account.profile_image || '',
        avatarPreview: account.profile_image || ''
      };

      setProfileData(profile);
      setFormData(profile);
    } catch (error) {
      console.error('Failed to load profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile data' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleImageChange = (base64Data) => {
    setFormData(prev => ({
      ...prev,
      profileImage: base64Data
    }));
  };

  const handleImageError = (error) => {
    setMessage({ type: 'error', text: error });
  };

  const validateForm = () => {
    const validation = profileService.validateProfileData(formData);
    
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return false;
    }

    setFormErrors({});
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      setMessage({ type: 'error', text: 'Please fix the errors below' });
        return;
      }
      
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      // Prepare request data
      const requestData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        location: formData.location
      };

      // Add image if provided
      if (formData.profileImage) {
        requestData.profileImage = formData.profileImage;
      }

      // Add password if provided
        if (formData.newPassword) {
        requestData.newPassword = formData.newPassword;
        requestData.oldPassword = formData.oldPassword;
      }


      // Update profile
      const response = await profileService.updateProfile(requestData);
      
      // Update local state with the response from backend
      const updatedProfile = {
        ...profileData,
        ...formData,
        profile_image: response.user.profile_image, // Backend returns filename
        avatarPreview: response.user.profile_image // Use filename for preview too
      };

      setProfileData(updatedProfile);
        setIsEditing(false);

      // Update global user context and localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = updateUserWithAvatar({
        ...currentUser,
        ...response.user, // Use the complete user object from backend
        profile_image: response.user.profile_image // Ensure profile_image is set
      });

      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update the global user context by dispatching a custom event
      window.dispatchEvent(new CustomEvent('userUpdated', { 
        detail: { user: updatedUser } 
      }));

      setMessage({ 
        type: 'success', 
        text: 'Profile updated successfully!' 
      });


    } catch (error) {
      console.error('❌ Save failed:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to update profile. Please try again.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(profileData);
    setFormErrors({});
    setMessage({ type: '', text: '' });
    setIsEditing(false);
  };

  const hasChanges = () => {
    return JSON.stringify(formData) !== JSON.stringify(profileData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onNavigate}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
                  <div>
            <h1 className="text-2xl font-bold">Account Settings</h1>
            <p className="text-gray-600">Manage your profile and preferences</p>
                  </div>
                </div>

                  {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="flex items-center space-x-2">
            <Edit3 className="h-4 w-4" />
            <span>Edit Profile</span>
          </Button>
        ) : (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasChanges()}
              className="flex items-center space-x-2"
                      >
                        {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </Button>
                    </div>
                  )}
                </div>

      {/* Message Alert */}
      {message.text && (
        <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Image */}
            <Card>
              <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Profile Picture</span>
            </CardTitle>
                <CardDescription>
              Upload a profile picture to personalize your account
                </CardDescription>
              </CardHeader>
              <CardContent>
            <ImageUpload
              value={formData.profileImage || formData.avatarPreview}
              onChange={handleImageChange}
              onError={handleImageError}
              disabled={!isEditing}
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your personal details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  disabled={!isEditing}
                  className={formErrors.first_name ? 'border-red-300' : ''}
                />
                {formErrors.first_name && (
                  <p className="text-sm text-red-600">{formErrors.first_name}</p>
                    )}
                  </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  disabled={!isEditing}
                  className={formErrors.last_name ? 'border-red-300' : ''}
                />
                {formErrors.last_name && (
                  <p className="text-sm text-red-600">{formErrors.last_name}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                        type="email"
                        value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={!isEditing}
                className={formErrors.email ? 'border-red-300' : ''}
              />
              {formErrors.email && (
                <p className="text-sm text-red-600">{formErrors.email}</p>
                    )}
                  </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                        type="tel"
                        value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={!isEditing}
                className={formErrors.phone ? 'border-red-300' : ''}
              />
              {formErrors.phone && (
                <p className="text-sm text-red-600">{formErrors.phone}</p>
                    )}
                  </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                disabled={!isEditing}
                placeholder="Enter your location"
              />
            </div>
          </CardContent>
        </Card>
                  </div>

      {/* Password Section */}
                  {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Leave blank to keep your current password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="oldPassword">Current Password</Label>
                          <div className="relative">
                <Input
                  id="oldPassword"
                  type={showOldPassword ? 'text' : 'password'}
                              value={formData.oldPassword}
                  onChange={(e) => handleInputChange('oldPassword', e.target.value)}
                              placeholder="Enter current password"
                            />
                <Button
                              type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowOldPassword(!showOldPassword)}
                >
                  {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                          </div>
                        </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
                          <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                              value={formData.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                              placeholder="Enter new password"
                            />
                <Button
                              type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                      </div>
                </div>
              </CardContent>
            </Card>
      )}
    </div>
  );
};

export default ModernAccountSettings;