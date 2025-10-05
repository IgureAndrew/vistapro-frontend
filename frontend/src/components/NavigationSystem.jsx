import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu'; // Removed - using simple buttons instead
import {
  Menu,
  X,
  LogOut,
  User,
  Settings,
  Bell,
  Search,
  Sun,
  Moon
} from 'lucide-react';

const NavigationSystem = ({
  userRole,
  user,
  activeModule,
  setActiveModule,
  modules = [],
  mobileNav = [],
  isMobile,
  isTablet,
  onLogout,
  onToggleTheme,
  isDarkMode = false
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Get role display info
  const getRoleInfo = (role) => {
    switch (role) {
      case 'masteradmin':
        return { icon: 'M', color: '#f59e0b', label: 'Master Admin' };
      case 'superadmin':
        return { icon: 'S', color: '#f59e0b', label: 'Super Admin' };
      case 'admin':
        return { icon: 'A', color: '#f59e0b', label: 'Admin' };
      case 'marketer':
        return { icon: 'M', color: '#f59e0b', label: 'Marketer' };
      case 'dealer':
        return { icon: 'D', color: '#f59e0b', label: 'Dealer' };
      default:
        return { icon: 'U', color: '#f59e0b', label: 'User' };
    }
  };

  const roleInfo = getRoleInfo(userRole);

  // Handle navigation click
  const handleNavClick = (key) => {
    if (key === 'more') {
      setSidebarOpen(true);
    } else {
      setActiveModule(key);
    }
  };

  // Right-click handler for opening in new tab
  const handleRightClick = (e, key) => {
    e.preventDefault();
    
    // Get the current URL and construct the new tab URL
    const currentPath = window.location.pathname;
    const basePath = currentPath.split('/').slice(0, -1).join('/'); // Remove last segment
    const newUrl = `${window.location.origin}${basePath}/${key}`;
    
    // Open in new tab
    window.open(newUrl, '_blank');
  };
    if (isMobile || isTablet) {
      setSidebarOpen(false);
    }
  };

  // Desktop Sidebar
  const DesktopSidebar = () => (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-50">
      <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
        {/* Sidebar Header */}
        <div className="flex items-center flex-shrink-0 px-4 py-4">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: roleInfo.color }}
            >
              {roleInfo.icon}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {user?.first_name} {user?.last_name}
              </h2>
              <p className="text-sm text-gray-500">{roleInfo.label}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {modules.map((module) => {
            const Icon = module.icon;
            const isActive = activeModule === module.key;
            
            return (
              <Button
                key={module.key}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start ${
                  isActive 
                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => handleNavClick(module.key)}
                onContextMenu={(e) => handleRightClick(e, module.key)}
              >
                <Icon className="mr-3 h-5 w-5" />
                {module.label}
              </Button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={onLogout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </Button>
        </div>
      </div>
    </div>
  );

  // Mobile Header
  const MobileHeader = () => (
    <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
      <div className="flex items-center space-x-3">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: roleInfo.color }}
        >
          {roleInfo.icon}
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900 capitalize">
            {userRole} Dashboard
          </h1>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" onClick={onToggleTheme}>
          {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {notifications.length > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
              {notifications.length}
            </Badge>
          )}
        </Button>

        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <div className="flex flex-col h-full">
              {/* Sheet Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: roleInfo.color }}
                  >
                    {roleInfo.icon}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {user?.first_name} {user?.last_name}
                    </h2>
                    <p className="text-sm text-gray-500">{roleInfo.label}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Sheet Navigation */}
              <nav className="flex-1 space-y-1">
                {modules.map((module) => {
                  const Icon = module.icon;
                  const isActive = activeModule === module.key;
                  
                  return (
                    <Button
                      key={module.key}
                      variant={isActive ? "default" : "ghost"}
                      className={`w-full justify-start ${
                        isActive 
                          ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => handleNavClick(module.key)}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {module.label}
                    </Button>
                  );
                })}
              </nav>

              {/* Sheet Footer */}
              <div className="border-t border-gray-200 pt-4">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={onLogout}
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Logout
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );

  // Bottom Navigation (Mobile Only)
  const BottomNavigation = () => (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2">
      <div className="flex justify-around">
        {mobileNav.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.key;
          
          return (
            <Button
              key={item.key}
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center space-y-1 h-auto py-2 px-3 ${
                isActive 
                  ? 'text-orange-600 bg-orange-50' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => handleNavClick(item.key)}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <DesktopSidebar />
      <MobileHeader />
      <BottomNavigation />
    </>
  );
};

export default NavigationSystem;
