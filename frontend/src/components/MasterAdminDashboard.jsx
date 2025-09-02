// src/components/MasterAdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  User,
  Users as UsersIcon,
  FileText,
  TrendingUp,
  Package,
  CheckCircle,
  UserPlus,
  ShoppingCart,
  ClipboardList,
  LogOut,
  Menu,
  X,
  MessageSquare,
  Moon,
  Sun,
} from "lucide-react";

import MasterAdminOverview from "./MasterAdminOverview";
import AvatarDropdown from "./AvatarDropdown";
import ProfileUpdate from "./ProfileUpdate";
import profileStorage from "../utils/profileStorage";
import UsersManagement from "./UsersManagement";
import ProfitReport from "./ProfitReport";
import MasterAdminWallet from "./MasterAdminWallet";
import Performance from "./Performance";
import StockUpdate from "./StockUpdate";
import Verification from "./Verification";
import RegisterSuperAdmin from "./RegisterSuperAdmin";
import AssignUsers from "./AssignUsers";
import Product from "./Product";
import ManageOrders from "./ManageOrders";
import Messaging from "./Messaging";
import Submissions from "./Submissions";
import NotificationBell from "./NotificationBell";

function MasterAdminDashboard() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  const [user] = useState(storedUser ? JSON.parse(storedUser) : null);

  const [activeModule, setActiveModule] = useState("overview");
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [isDarkMode, setIsDarkMode]     = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [greeting, setGreeting]         = useState("Welcome");
  const [avatarUrl, setAvatarUrl]       = useState(null);

  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  // Apply dark mode to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const hasVisited = localStorage.getItem("hasVisitedDashboard");
    if (hasVisited) {
      setGreeting("Welcome back");
    } else {
      setGreeting("Welcome");
      localStorage.setItem("hasVisitedDashboard", "true");
    }
  }, []);

  // Load avatar from profile storage
  useEffect(() => {
    const loadAvatar = () => {
      try {
        console.log('🔍 Loading avatar from profile storage...');
        const profileData = profileStorage.loadProfileData();
        console.log('📊 Profile data:', profileData);
        
        if (profileData && (profileData.profile_image || profileData.profileImage || profileData.profileimage)) {
          const imageName = profileData.profile_image || profileData.profileImage || profileData.profileimage;
          const avatarUrl = `http://localhost:5005/uploads/${imageName}`;
          console.log('🖼️ Setting avatar URL:', avatarUrl);
          setAvatarUrl(avatarUrl);
        } else {
          console.log('❌ No avatar image found in profile data');
        }
      } catch (error) {
        console.log('❌ Error loading avatar:', error);
      }
    };

    loadAvatar();

    // Listen for window focus to refresh avatar
    const handleFocus = () => loadAvatar();
    window.addEventListener('focus', handleFocus);
    
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const newMode = !prev;
      localStorage.setItem('darkMode', JSON.stringify(newMode));
      return newMode;
    });
  };

  const renderModule = () => {
    switch (activeModule) {
      case "overview":
        return <MasterAdminOverview />;
      case "profile":
        return <ProfileUpdate />;
      case "users":
        return <UsersManagement />;
      case "profit":
        return <ProfitReport />;
      case "wallet":
        return <MasterAdminWallet />;
      case "performance":
        return <Performance />;
      case "stock":
        return <StockUpdate />;
      case "verification":
        return <Verification />;
      case "register-super-admin":
        return <RegisterSuperAdmin />;
      case "assign":
        return <AssignUsers />;
      case "product":
        return <Product />;
      case "manage-orders":
        return <ManageOrders />;
      case "messages":
        return <Messaging />;
      case "submissions":
        return <Submissions />;
      default:
        return <MasterAdminOverview />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-800 dark:text-white">
      {/* Mobile Top Navbar */}
                    <header className="md:hidden h-16 flex items-center justify-between px-4 border-b bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X size={20}/> : <Menu size={20}/>}
        </button>
        <div className="flex items-center gap-2">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              className="h-8 w-8 rounded-full object-cover border border-gray-200"
              onError={(e) => {
                console.log('❌ Mobile avatar image failed to load:', avatarUrl);
                e.target.style.display = 'none';
              }}
              onLoad={() => {
                console.log('✅ Mobile avatar image loaded successfully:', avatarUrl);
              }}
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gray-200 border border-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-xs">A</span>
            </div>
          )}
          <h2 className="font-bold">Vistapro</h2>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <NotificationBell />
          <AvatarDropdown
            user={user}
            handleLogout={handleLogout}
            toggleDarkMode={toggleDarkMode}
            isDarkMode={isDarkMode}
            setActiveModule={setActiveModule}
          />
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? "block" : "hidden"} md:block w-64 border-r bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700`}>
          <div className="p-4 text-center font-bold text-lg border-b border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white">
            Vistapro
          </div>
          <nav className="p-3 overflow-auto">
            <ul className="space-y-2">
              <SidebarItem label="Overview"    Icon={Home}      moduleName="overview"        {...{activeModule,setActiveModule,setSidebarOpen,isDarkMode}}/>
              <SidebarItem label="Profile"     Icon={User}      moduleName="profile"         {...{activeModule,setActiveModule,setSidebarOpen,isDarkMode}}/>
              <SidebarItem label="Users"       Icon={UsersIcon} moduleName="users"           {...{activeModule,setActiveModule,setSidebarOpen,isDarkMode}}/>
              <SidebarItem label="Profit"      Icon={FileText}  moduleName="profit"          {...{activeModule,setActiveModule,setSidebarOpen,isDarkMode}}/>
              <SidebarItem label="Wallet"      Icon={()=><span className="text-lg">₦</span>} moduleName="wallet" {...{activeModule,setActiveModule,setSidebarOpen,isDarkMode}}/>
              <SidebarItem label="Performance" Icon={TrendingUp} moduleName="performance"    {...{activeModule,setActiveModule,setSidebarOpen,isDarkMode}}/>
              <SidebarItem label="Stock"       Icon={Package}   moduleName="stock"           {...{activeModule,setActiveModule,setSidebarOpen,isDarkMode}}/>
              <SidebarItem label="Verify"      Icon={CheckCircle} moduleName="verification"  {...{activeModule,setActiveModule,setSidebarOpen,isDarkMode}}/>
              <SidebarItem label="Submissions" Icon={FileText}   moduleName="submissions"    {...{activeModule,setActiveModule,setSidebarOpen,isDarkMode}}/>
              <SidebarItem label="Assign"      Icon={UserPlus}   moduleName="assign"         {...{activeModule,setActiveModule,setSidebarOpen,isDarkMode}}/>
              <SidebarItem label="Products"    Icon={ShoppingCart} moduleName="product"       {...{activeModule,setActiveModule,setSidebarOpen,isDarkMode}}/>
              <SidebarItem label="Orders"      Icon={ClipboardList} moduleName="manage-orders"{...{activeModule,setActiveModule,setSidebarOpen,isDarkMode}}/>
              <SidebarItem label="Messages"    Icon={MessageSquare} moduleName="messages"     {...{activeModule,setActiveModule,setSidebarOpen,isDarkMode}}/>
              <li>
                <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded hover:bg-gray-100">
                  <LogOut size={16}/> Logout
                </button>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Desktop Top Bar */}
                <header className="hidden md:flex items-center justify-between h-16 px-6 border-b bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                  onError={(e) => {
                    console.log('❌ Avatar image failed to load:', avatarUrl);
                    e.target.style.display = 'none';
                  }}
                  onLoad={() => {
                    console.log('✅ Avatar image loaded successfully:', avatarUrl);
                  }}
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gray-200 border-2 border-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 text-xs">No Avatar</span>
                </div>
              )}
              <div>
                <h2 className="font-bold text-xl">{greeting}, {user?.first_name}!</h2>
                <p className="text-sm">Unique ID: {user?.unique_id}</p>
                <p className="text-xs text-gray-400">Avatar URL: {avatarUrl || 'None'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <NotificationBell />
              <AvatarDropdown
                user={user}
                handleLogout={handleLogout}
                toggleDarkMode={toggleDarkMode}
                isDarkMode={isDarkMode}
                setActiveModule={setActiveModule}
              />
            </div>
          </header>

          <main className="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white flex-1">
            <div className="container mx-auto max-w-none md:max-w-7xl lg:max-w-[1440px] px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
              {renderModule()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function SidebarItem({ label, Icon, moduleName, activeModule, setActiveModule, setSidebarOpen, isDarkMode }) {
  const isActive = activeModule === moduleName;
  return (
    <li>
      <button
        onClick={() => { setActiveModule(moduleName); setSidebarOpen(false); }}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded transition-colors ${
          isActive 
            ? "bg-blue-100 dark:bg-gray-700 text-black dark:text-white font-semibold" 
            : "text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
        }`}
      >
        {Icon && <Icon size={16}/>}
        {label}
      </button>
    </li>
  );
}

export default MasterAdminDashboard;
