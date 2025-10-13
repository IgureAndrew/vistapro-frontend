import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import accountApi from '../api/accountApi';
import { 
  Home,
  User, 
  Shield, 
  Settings, 
  Bell,
  Camera,
  Mail,
  Phone,
  MapPin,
  Key,
  Smartphone,
  History,
  Palette,
  Globe,
  Volume2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { getUserInitials } from '../utils/avatarUtils';

const AccountSettings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Form states
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: ''
  });
  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'en',
    timezone: 'Africa/Lagos'
  });
  const [notificationPreferences, setNotificationPreferences] = useState({
    emailNotifications: true,
    pushNotifications: false,
    orderUpdates: true,
    securityAlerts: true
  });
  
  // UI states
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [profileImage, setProfileImage] = useState(null);
  const [loginHistory, setLoginHistory] = useState([]);

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          
          // Load fresh account data from API
          try {
            const accountData = await accountApi.getAccount();
            setProfileData({
              firstName: accountData.first_name || accountData.firstName || '',
              lastName: accountData.last_name || accountData.lastName || '',
              email: accountData.email || '',
              phone: accountData.phone || '',
              location: accountData.location || ''
            });
            
            // Load preferences
            try {
              const prefs = await accountApi.getPreferences();
              setPreferences(prefs);
            } catch (error) {
              console.log('Preferences not available yet');
            }
            
            // Load notification preferences
            try {
              const notifPrefs = await accountApi.getNotificationPreferences();
              setNotificationPreferences(notifPrefs);
            } catch (error) {
              console.log('Notification preferences not available yet');
            }
            
            // Load login history
            try {
              const history = await accountApi.getLoginHistory();
              setLoginHistory(history);
            } catch (error) {
              console.log('Login history not available yet');
            }
            
          } catch (error) {
            console.error('Error loading account data:', error);
            setMessage({ type: 'error', text: 'Failed to load account data' });
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setMessage({ type: 'error', text: 'Failed to load user data' });
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleReturnToOverview = () => {
    // Navigate to the appropriate dashboard overview based on user role
    const role = user?.role?.toLowerCase();
    console.log('Return to Overview clicked, user role:', role);
    
    if (role === 'masteradmin') {
      navigate('/dashboard/masteradmin');
    } else if (role === 'superadmin') {
      navigate('/dashboard/superadmin');
    } else if (role === 'admin') {
      navigate('/dashboard/admin');
    } else if (role === 'marketer') {
      navigate('/dashboard/marketer');
    } else if (role === 'dealer') {
      navigate('/dashboard/dealer');
    } else {
      console.log('Unknown role, navigating to default dashboard');
      navigate('/dashboard/masteradmin'); // Default fallback
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      'MasterAdmin': 'bg-red-100 text-red-800',
      'SuperAdmin': 'bg-purple-100 text-purple-800',
      'Admin': 'bg-blue-100 text-blue-800',
      'Marketer': 'bg-green-100 text-green-800',
      'Dealer': 'bg-orange-100 text-orange-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  // Form submission handlers
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const updateData = {
        displayName: `${profileData.firstName} ${profileData.lastName}`.trim(),
        email: profileData.email,
        phone: profileData.phone,
        location: profileData.location,
        profile_image: profileImage
      };

      await accountApi.updateAccount(updateData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      // Update localStorage user data
      const updatedUser = { ...user, ...updateData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await accountApi.changePassword(passwordData);
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to change password' });
    } finally {
      setSaving(false);
    }
  };

  const handlePreferencesUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await accountApi.updatePreferences(preferences);
      setMessage({ type: 'success', text: 'Preferences saved successfully!' });
    } catch (error) {
      console.error('Error updating preferences:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save preferences' });
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationPreferencesUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await accountApi.updateNotificationPreferences(notificationPreferences);
      setMessage({ type: 'success', text: 'Notification preferences saved successfully!' });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save notification preferences' });
    } finally {
      setSaving(false);
    }
  };

  const handleOTPToggle = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const newOTPStatus = !user.otpEnabled;
      await accountApi.toggleOTP(newOTPStatus);
      setMessage({ type: 'success', text: `OTP ${newOTPStatus ? 'enabled' : 'disabled'} successfully!` });
      
      // Update user state
      const updatedUser = { ...user, otpEnabled: newOTPStatus };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error toggling OTP:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to toggle OTP' });
    } finally {
      setSaving(false);
    }
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size must be less than 2MB' });
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select an image file' });
        return;
      }
      
      setProfileImage(file);
      setMessage({ type: 'success', text: 'Image selected successfully! Click "Save Changes" to upload.' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading account settings...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Unable to load user data</p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Return to Overview Button */}
        <div className="flex justify-end mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReturnToOverview}
            className="flex items-center space-x-2"
          >
            <Home className="h-4 w-4" />
            <span>Return to Overview</span>
          </Button>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              {message.type === 'success' ? (
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span>{message.text}</span>
            </div>
          </div>
        )}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab Navigation */}
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Preferences</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Picture Section */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Camera className="h-5 w-5" />
                    <span>Profile Picture</span>
                  </CardTitle>
                  <CardDescription>
                    Upload a profile picture to personalize your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                        <AvatarImage 
                          src={profileImage ? URL.createObjectURL(profileImage) : (user?.profile_image || user?.avatar)} 
                          alt="Profile" 
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl">
                          {getUserInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                      {profileImage && (
                        <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-center space-y-3">
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfileImageChange}
                          className="hidden"
                          id="profile-image-upload"
                        />
                        <label htmlFor="profile-image-upload">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
                            asChild
                          >
                            <span>
                              <Camera className="h-4 w-4 mr-2" />
                              {profileImage ? 'Change Picture' : 'Upload Picture'}
                            </span>
                          </Button>
                        </label>
                        
                        {profileImage && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setProfileImage(null)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>Supported formats: PNG, JPG, GIF</p>
                        <p>Maximum file size: 2MB</p>
                        {profileImage && (
                          <p className="text-green-600 font-medium">
                            Selected: {profileImage.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Personal Information Section */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Personal Information</span>
                  </CardTitle>
                  <CardDescription>
                    Update your personal details and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form onSubmit={handleProfileUpdate}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input 
                          id="firstName" 
                          value={profileData.firstName} 
                          onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                          placeholder="Enter your first name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input 
                          id="lastName" 
                          value={profileData.lastName} 
                          onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                          placeholder="Enter your last name"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input 
                          id="email" 
                          type="email"
                          value={profileData.email} 
                          onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                          placeholder="Enter your email address"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input 
                          id="phone" 
                          type="tel"
                          value={profileData.phone} 
                          onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                          placeholder="Enter your phone number"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input 
                          id="location" 
                          value={profileData.location} 
                          onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                          placeholder="Enter your location"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>Role</Label>
                      <div className="flex items-center space-x-2">
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {user.role}
                        </Badge>
                        <span className="text-sm text-gray-500">(Read-only)</span>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <Button type="button" variant="outline">Cancel</Button>
                      <Button type="submit" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Security Settings</span>
                </CardTitle>
                <CardDescription>
                  Manage your account security and authentication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Password Change */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Key className="h-5 w-5 text-gray-500" />
                    <h3 className="text-lg font-medium">Password</h3>
                  </div>
                  <form onSubmit={handlePasswordChange}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input 
                          id="currentPassword" 
                          type="password" 
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                          placeholder="Enter current password" 
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input 
                          id="newPassword" 
                          type="password" 
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                          placeholder="Enter new password" 
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" variant="outline" disabled={saving}>
                      {saving ? 'Changing...' : 'Change Password'}
                    </Button>
                  </form>
                </div>

                <Separator />

                {/* Two-Factor Authentication */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="h-5 w-5 text-gray-500" />
                    <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">OTP Authentication</p>
                      <p className="text-sm text-gray-500">Secure your account with one-time passwords</p>
                    </div>
                    <Badge variant={user.otpEnabled ? "default" : "secondary"}>
                      {user.otpEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleOTPToggle}
                    disabled={saving}
                  >
                    {saving ? 'Updating...' : (user.otpEnabled ? "Disable" : "Enable")} OTP
                  </Button>
                </div>

                <Separator />

                {/* Login History */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <History className="h-5 w-5 text-gray-500" />
                    <h3 className="text-lg font-medium">Login History</h3>
                  </div>
                  {loginHistory.length > 0 ? (
                    <div className="space-y-3">
                      {loginHistory.slice(0, 5).map((login, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{login.device || 'Unknown Device'}</p>
                            <p className="text-sm text-gray-500">{login.location || 'Unknown Location'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{new Date(login.created_at).toLocaleDateString()}</p>
                            <p className="text-xs text-gray-500">{new Date(login.created_at).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Login history will be available soon</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Preferences</span>
                </CardTitle>
                <CardDescription>
                  Customize your application experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Theme Settings */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Palette className="h-5 w-5 text-gray-500" />
                    <h3 className="text-lg font-medium">Appearance</h3>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Theme</p>
                      <p className="text-sm text-gray-500">Choose your preferred theme</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant={preferences.theme === 'light' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setPreferences({...preferences, theme: 'light'})}
                      >
                        Light
                      </Button>
                      <Button 
                        variant={preferences.theme === 'dark' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setPreferences({...preferences, theme: 'dark'})}
                      >
                        Dark
                      </Button>
                      <Button 
                        variant={preferences.theme === 'system' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setPreferences({...preferences, theme: 'system'})}
                      >
                        System
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Language Settings */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Globe className="h-5 w-5 text-gray-500" />
                    <h3 className="text-lg font-medium">Language & Region</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Input id="language" value="English" readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Input id="timezone" value="UTC+1 (West Africa Time)" readOnly />
                    </div>
                  </div>
                </div>

                <form onSubmit={handlePreferencesUpdate}>
                  <div className="flex justify-end space-x-3">
                    <Button type="button" variant="outline">Reset</Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Preferences'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Notification Preferences</span>
                </CardTitle>
                <CardDescription>
                  Manage how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <h3 className="text-lg font-medium">Email Notifications</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Order Updates</p>
                        <p className="text-sm text-gray-500">Get notified about order status changes</p>
                      </div>
                      <Button 
                        variant={notificationPreferences.orderUpdates ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setNotificationPreferences({...notificationPreferences, orderUpdates: !notificationPreferences.orderUpdates})}
                      >
                        {notificationPreferences.orderUpdates ? 'Enabled' : 'Disabled'}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Security Alerts</p>
                        <p className="text-sm text-gray-500">Important security notifications</p>
                      </div>
                      <Button 
                        variant={notificationPreferences.securityAlerts ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setNotificationPreferences({...notificationPreferences, securityAlerts: !notificationPreferences.securityAlerts})}
                      >
                        {notificationPreferences.securityAlerts ? 'Enabled' : 'Disabled'}
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Volume2 className="h-5 w-5 text-gray-500" />
                    <h3 className="text-lg font-medium">Push Notifications</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Browser Notifications</p>
                        <p className="text-sm text-gray-500">Receive notifications in your browser</p>
                      </div>
                      <Button 
                        variant={notificationPreferences.pushNotifications ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setNotificationPreferences({...notificationPreferences, pushNotifications: !notificationPreferences.pushNotifications})}
                      >
                        {notificationPreferences.pushNotifications ? 'Enabled' : 'Disabled'}
                      </Button>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleNotificationPreferencesUpdate}>
                  <div className="flex justify-end space-x-3">
                    <Button type="button" variant="outline">Reset</Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Notifications'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Message Display */}
        {message.text && (
          <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 
            message.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' : 
            'bg-blue-100 text-blue-800 border border-blue-200'
          }`}>
            <div className="flex items-center space-x-2">
              <span>{message.text}</span>
              <button 
                onClick={() => setMessage({ type: '', text: '' })}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountSettings;
