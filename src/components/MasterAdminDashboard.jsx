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
} from "lucide-react";

import MasterAdminOverview from "./MasterAdminOverview";
import AvatarDropdown from "./AvatarDropdown";
import ProfileUpdate from "./ProfileUpdate";
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
  const [isDarkMode, setIsDarkMode]     = useState(false);
  const [greeting, setGreeting]         = useState("Welcome");

  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  useEffect(() => {
    const hasVisited = localStorage.getItem("hasVisitedDashboard");
    if (hasVisited) {
      setGreeting("Welcome back");
    } else {
      setGreeting("Welcome");
      localStorage.setItem("hasVisitedDashboard", "true");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

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
    <div className={`min-h-screen flex flex-col ${
      isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"
    }`}>
      {/* Mobile Top Navbar */}
      <header className={`md:hidden h-16 flex items-center justify-between px-4 border-b ${
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X size={20}/> : <Menu size={20}/>}
        </button>
        <h2 className="font-bold">Vistapro</h2>
        <div className="flex items-center gap-4">
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
        <aside className={`${sidebarOpen ? "block" : "hidden"} md:block w-64 border-r ${
          isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}>
          <div className="p-4 text-center font-bold text-lg border-b">
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
          <header className={`hidden md:flex items-center justify-between h-16 px-6 border-b ${
            isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}>
            <div>
              <h2 className="font-bold text-xl">{greeting}, {user?.first_name}!</h2>
              <p className="text-sm">Unique ID: {user?.unique_id}</p>
            </div>
            <div className="flex items-center gap-4">
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

          <main className={`flex-1 overflow-auto p-6 ${
            isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-800"
          }`}>
            {renderModule()}
          </main>
        </div>
      </div>
    </div>
  );
}

function SidebarItem({ label, Icon, moduleName, activeModule, setActiveModule, setSidebarOpen, isDarkMode }) {
  const isActive = activeModule === moduleName;
  const base    = isDarkMode ? "text-white hover:bg-gray-700" : "text-black hover:bg-gray-50";
  const active  = isDarkMode ? "bg-gray-700 text-white font-semibold" : "bg-blue-100 text-black font-semibold";
  return (
    <li>
      <button
        onClick={() => { setActiveModule(moduleName); setSidebarOpen(false); }}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded transition-colors ${
          isActive ? active : base
        }`}
      >
        {Icon && <Icon size={16}/>}
        {label}
      </button>
    </li>
  );
}

export default MasterAdminDashboard;
