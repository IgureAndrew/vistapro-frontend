// src/components/UnifiedDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Menu,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  Crown,
  Shield,
  User as UserIcon,
  Settings,
  Clock
} from 'lucide-react';
import { getRoleConfig } from '../config/RoleConfig';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';
import { getAvatarUrl, getUserInitials } from '../utils/avatarUtils';
import Performance from './Performance';
import UsersManagement from './UsersManagement';
import MasterAdminWallet from './MasterAdminWallet';
import MarketerVerificationDashboard from './MarketerVerificationDashboard';

const UnifiedDashboard = ({ userRole = 'masteradmin' }) => {
  // State Management
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeModule, setActiveModule] = useState('overview');
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Hooks
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const roleConfig = getRoleConfig(userRole);

  // Computed: Check if current theme is dark
  const isDarkMode = theme === 'dark';

  // Load user data and listen for updates
  useEffect(() => {
    const loadUser = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        // Ensure user has avatar URL constructed from profile_image
        if (userData.profile_image && !userData.avatar) {
          userData.avatar = getAvatarUrl(userData.profile_image);
          setUser(userData);
          // Update localStorage with avatar URL
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          setUser(userData);
        }
      }
    };

    // Load user initially
    loadUser();

    // Listen for user updates from profile changes
    const handleUserUpdate = (event) => {
      const { user: updatedUser } = event.detail;
      setUser(updatedUser);
    };

    window.addEventListener('userUpdated', handleUserUpdate);
    return () => window.removeEventListener('userUpdated', handleUserUpdate);
  }, []);

  // Check verification status for marketers
  useEffect(() => {
    if (userRole === 'marketer' && user) {
      // Always refresh user data for marketers to get latest verification status
      const refreshUserData = async () => {
        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              const freshUserData = data.user;
              console.log('🔄 UnifiedDashboard: Refreshed user data:', freshUserData);
              setUser(freshUserData);
              localStorage.setItem('user', JSON.stringify(freshUserData));
            }
          }
        } catch (error) {
          console.error('❌ Error refreshing user data in UnifiedDashboard:', error);
        }
      };
      
      refreshUserData();
    }
  }, [userRole, user]);

  // Handle URL parameters for module navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const moduleParam = urlParams.get('module');
    
    if (moduleParam) {
      // Check if the module exists in the current role's configuration
      const moduleExists = roleConfig.modules.some(module => module.key === moduleParam);
      if (moduleExists) {
        setActiveModule(moduleParam);
        // Clean up the URL by removing the parameter
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [roleConfig.modules]);

  // Dark mode toggle using custom ThemeProvider
  const toggleDarkMode = () => {
    toggleTheme();
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Handle navigation
  const handleNavigate = (moduleKey) => {
    setActiveModule(moduleKey);
    setSidebarOpen(false); // Close mobile sidebar
  };

  // Generate URL for navigation links
  const getModuleUrl = (moduleKey) => {
    // For SPA routing, we need to include the module as a URL parameter or hash
    // This allows the dashboard to load and then navigate to the specific module
    const currentPath = window.location.pathname;
    return `${currentPath}?module=${moduleKey}`;
  };

  // Get current module component
  const getCurrentModuleComponent = () => {
    const module = roleConfig.modules.find(m => m.key === activeModule);
    if (module && module.component) {
      const Component = module.component;
      return <Component userRole={userRole} onNavigate={handleNavigate} isDarkMode={isDarkMode} />;
    }
    return null;
  };

  // Get role badge
  const getRoleBadge = () => {
    const badges = {
      masteradmin: { icon: Crown, text: 'Master Admin', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
      superadmin: { icon: Shield, text: 'Super Admin', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      admin: { icon: Shield, text: 'Admin', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      marketer: { icon: UserIcon, text: 'Marketer', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
      dealer: { icon: UserIcon, text: 'Dealer', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' },
    };
    return badges[userRole] || badges.marketer;
  };

  const roleBadge = getRoleBadge();
  const RoleBadgeIcon = roleBadge.icon;

  // Show loading state while user data is being loaded
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Sidebar Component
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <img
            src="/assets/logo/vistapro-logo-new.png"
            alt="VistaPro Logo"
            className="h-10 w-auto"
          />
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Vistapro</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{roleConfig.title}</p>
            {user?.unique_id && (
              <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-1">
                ID: {user.unique_id}
              </p>
            )}
          </div>
        </div>
        </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {(() => {
          // Filter modules based on verification status for marketers
          let modulesToShow = roleConfig.modules;
          
          if (userRole === 'marketer' && user && (user.overall_verification_status === null || user.overall_verification_status === undefined || user.overall_verification_status !== 'approved')) {
            // For unverified marketers, only show verification-related modules
            modulesToShow = roleConfig.modules.filter(module => 
              ['verification', 'account-settings'].includes(module.key)
            );
          }
          
          return modulesToShow.map((module) => {
            const Icon = module.icon;
            const isActive = activeModule === module.key;
            
            return (
              <a
                key={module.key}
                href={getModuleUrl(module.key)}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigate(module.key);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{module.label}</span>
              </a>
            );
          });
        })()}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
          <Avatar className="w-10 h-10">
            <AvatarImage 
              src={user?.avatar} 
              onError={(e) => {
                // Try fallback URL if original fails
                if (user?.profile_image && !user?.avatar?.includes('/api/uploads/')) {
                  const fallbackUrl = getAvatarUrl(user.profile_image);
                }
              }}
            />
            <AvatarFallback className="bg-orange-500 text-white">
              {getUserInitials(user)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.email}
              </p>
            </div>
          </div>
        
        {/* Mobile Logout Button */}
        <div className="mt-3 lg:hidden">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <SidebarContent />
        </aside>

        {/* Mobile Sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-64 p-0 bg-white dark:bg-gray-800">
            <SidebarContent />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header Bar */}
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between">
              {/* Left Section */}
              <div className="flex items-center space-x-2 sm:space-x-4">
                {/* Mobile Menu Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="w-5 h-5" />
                </Button>

                {/* Title */}
                <div>
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                    {roleConfig.title}
                  </h1>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={`${roleBadge.color} hidden sm:inline-flex`}>
                      <RoleBadgeIcon className="w-3 h-3 mr-1" />
                      {roleBadge.text}
                    </Badge>
                    {/* Verification Status for Marketers */}
                    {userRole === 'marketer' && user && (user.overall_verification_status === null || user.overall_verification_status === undefined || user.overall_verification_status !== 'approved') && (
                      <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        <Clock className="w-3 h-3 mr-1" />
                        Verification Required
                      </Badge>
                    )}
                  </div>
              </div>
            </div>

              {/* Right Section */}
              <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
              {/* Dark Mode Toggle */}
              <Button
                variant="ghost"
                size="sm"
                  onClick={toggleDarkMode}
                  className="rounded-full"
              >
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>

              {/* Notifications */}
              <NotificationBell />

              {/* Mobile Logout Button */}
              <Button
                variant="ghost"
                size="sm"
                className="sm:hidden"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </Button>

              {/* User Menu */}
                <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                    className="hidden sm:flex items-center space-x-2"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage 
                        src={user?.avatar} 
                        onError={(e) => {
                          // Handle avatar load error silently
                        }}
                      />
                      <AvatarFallback className="bg-orange-500 text-white text-xs">
                        {getUserInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="w-4 h-4" />
              </Button>

                  {/* User Dropdown */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.first_name} {user?.last_name}
                  </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                </div>
                      <div className="p-2">
                        <button
                          onClick={() => handleNavigate('profile')}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Settings</span>
                        </button>
                        <Separator className="my-1" />
                    <button
                          onClick={handleLogout}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                    </button>
          </div>
              </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <div className="w-full h-full">
              {/* Marketer Verification Check */}
              {(() => {
                console.log('🔍 Verification check debug:', {
                  userRole,
                  user: !!user,
                  verificationStatus: user?.overall_verification_status,
                  shouldShowVerification: userRole === 'marketer' && user && user.overall_verification_status !== undefined && (!user.overall_verification_status || user.overall_verification_status !== 'approved')
                });
                
                if (userRole === 'marketer' && user && (user.overall_verification_status === null || user.overall_verification_status === undefined || user.overall_verification_status !== 'approved')) {
                  console.log('✅ Showing MarketerVerificationDashboard');
                  return <MarketerVerificationDashboard user={user} />;
                } else if (userRole === 'masteradmin') {
                  console.log('✅ Showing MasterAdmin dashboard');
                  return (
                    <div className="p-3 sm:p-4 md:p-6">
                      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="mb-4 sm:mb-6">
                          <TabsTrigger value="overview">Overview</TabsTrigger>
                          <TabsTrigger value="analytics">Analytics</TabsTrigger>
                          <TabsTrigger value="users">Users</TabsTrigger>
                          <TabsTrigger value="wallet">Wallet</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
                          {getCurrentModuleComponent()}
                        </TabsContent>

                        <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
                          <Performance userRole={userRole} onNavigate={handleNavigate} isDarkMode={isDarkMode} />
                        </TabsContent>

                        <TabsContent value="users" className="space-y-4 sm:space-y-6">
                          <UsersManagement userRole={userRole} onNavigate={handleNavigate} isDarkMode={isDarkMode} />
                        </TabsContent>

                        <TabsContent value="wallet" className="space-y-4 sm:space-y-6">
                          <MasterAdminWallet userRole={userRole} onNavigate={handleNavigate} isDarkMode={isDarkMode} />
                        </TabsContent>
                      </Tabs>
                    </div>
                  );
                } else {
                  console.log('✅ Showing other role dashboard');
                  return (
                    <div className="p-3 sm:p-4 md:p-6">
                      {getCurrentModuleComponent()}
                    </div>
                  );
                }
              })()}
          </div>
        </main>
        </div>
      </div>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserMenu(false);
          }}
        />
      )}
    </div>
  );
};

export default UnifiedDashboard;
