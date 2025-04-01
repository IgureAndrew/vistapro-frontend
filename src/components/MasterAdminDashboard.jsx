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
  Shield,
  UserPlus,
  ShoppingCart,
  ClipboardList,
  LogOut,
  Bell,
  Menu,
  X,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";

import DashboardOverview from "./DashboardOverview";
import AvatarDropdown from "./AvatarDropdown"; // Ensure this is correctly implemented
import ProfileUpdate from "./ProfileUpdate";
import UsersManagement from "./UsersManagement";
import Reports from "./Reports";
import CashOut from "./CashOut";
import Performance from "./Performance";
import StockUpdate from "./StockUpdate";
import Verification from "./Verification";
import RegisterSuperAdmin from "./RegisterSuperAdmin";
import AssignMarketer from "./AssignMarketer";
import Product from "./Product";
import ManageOrders from "./ManageOrders";
import Messaging from "./Messaging";
import Submissions from "./Submissions"; // Import the new Submissions component

function MasterAdminDashboard() {
  const navigate = useNavigate();
  const baseUrl = "https://vistapro-backend.onrender.com";
  const storedUser = localStorage.getItem("user");
  const [user] = useState(storedUser ? JSON.parse(storedUser) : null);

  // Current active module
  const [activeModule, setActiveModule] = useState("overview");

  // Track online/offline status
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);

  // Toggle sidebar for mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Dark mode toggle
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Greeting state
  const [greeting, setGreeting] = useState("Welcome");

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
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

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Return function to go back to overview
  const handleReturn = () => {
    setActiveModule("overview");
  };

  const renderModule = () => {
    switch (activeModule) {
      case "overview":
        return <DashboardOverview />;
      case "profile":
        return <ProfileUpdate />;
      case "users":
        return <UsersManagement />;
      case "reports":
        return <Reports />;
      case "cashout":
        return <CashOut />;
      case "performance":
        return <Performance />;
      case "stock":
        return <StockUpdate />;
      case "verification":
        return <Verification />;
      case "register-super-admin":
        return <RegisterSuperAdmin />;
      case "assign-marketer":
        return <AssignMarketer />;
      case "product":
        return <Product />;
      case "manage-orders":
        return <ManageOrders />;
      case "messages":
        return <Messaging />;
      case "submissions":
        return <Submissions />; // New Submissions module
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"
      }`}
    >
      {/* Top Navbar for small screens */}
      <header
        className={`h-16 flex items-center justify-between px-4 border-b md:hidden transition-colors duration-300 ${
          isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h2 className="text-lg font-bold">Vistapro</h2>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <Bell size={18} />
            <span className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 rounded-full">
              3
            </span>
          </button>
          <AvatarDropdown
            user={user}
            handleLogout={handleLogout}
            toggleDarkMode={toggleDarkMode}
            isDarkMode={isDarkMode}
            setActiveModule={setActiveModule}
          />
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "block" : "hidden"
          } md:block w-full md:w-64 flex-shrink-0 transition-colors duration-300 ${
            isDarkMode
              ? "bg-gray-800 border-r border-gray-700"
              : "bg-white border-r border-gray-200"
          }`}
        >
          <div className="p-4 text-center font-bold text-xl md:text-2xl border-b transition-colors duration-300 dark:border-gray-700">
            Vistapro
          </div>
          <nav className="p-3 flex-1">
            <ul className="list-none space-y-2 text-sm">
              <SidebarItem
                label="Overview"
                Icon={Home}
                moduleName="overview"
                activeModule={activeModule}
                setActiveModule={setActiveModule}
                setSidebarOpen={setSidebarOpen}
                isDarkMode={isDarkMode}
              />
              <SidebarItem
                label="Profile"
                Icon={User}
                moduleName="profile"
                activeModule={activeModule}
                setActiveModule={setActiveModule}
                setSidebarOpen={setSidebarOpen}
                isDarkMode={isDarkMode}
              />
              <SidebarItem
                label="Users"
                Icon={UsersIcon}
                moduleName="users"
                activeModule={activeModule}
                setActiveModule={setActiveModule}
                setSidebarOpen={setSidebarOpen}
                isDarkMode={isDarkMode}
              />
              <SidebarItem
                label="Reports"
                Icon={FileText}
                moduleName="reports"
                activeModule={activeModule}
                setActiveModule={setActiveModule}
                setSidebarOpen={setSidebarOpen}
                isDarkMode={isDarkMode}
              />
              <SidebarItem
                label="Cash Out"
                Icon={() => <span className="text-lg">₦</span>}
                moduleName="cashout"
                activeModule={activeModule}
                setActiveModule={setActiveModule}
                setSidebarOpen={setSidebarOpen}
                isDarkMode={isDarkMode}
              />
              <SidebarItem
                label="Performance"
                Icon={TrendingUp}
                moduleName="performance"
                activeModule={activeModule}
                setActiveModule={setActiveModule}
                setSidebarOpen={setSidebarOpen}
                isDarkMode={isDarkMode}
              />
              <SidebarItem
                label="Stock"
                Icon={Package}
                moduleName="stock"
                activeModule={activeModule}
                setActiveModule={setActiveModule}
                setSidebarOpen={setSidebarOpen}
                isDarkMode={isDarkMode}
              />
              <SidebarItem
                label="Verification"
                Icon={CheckCircle}
                moduleName="verification"
                activeModule={activeModule}
                setActiveModule={setActiveModule}
                setSidebarOpen={setSidebarOpen}
                isDarkMode={isDarkMode}
              />
              <SidebarItem
                label="Submissions"
                Icon={FileText}  // or any other icon you prefer
                moduleName="submissions"
                activeModule={activeModule}
                setActiveModule={setActiveModule}
                setSidebarOpen={setSidebarOpen}
                isDarkMode={isDarkMode}
              />
              <SidebarItem
                label="Register Super Admin"
                Icon={Shield}
                moduleName="register-super-admin"
                activeModule={activeModule}
                setActiveModule={setActiveModule}
                setSidebarOpen={setSidebarOpen}
                isDarkMode={isDarkMode}
              />
              <SidebarItem
                label="Assign Marketers"
                Icon={UserPlus}
                moduleName="assign-marketer"
                activeModule={activeModule}
                setActiveModule={setActiveModule}
                setSidebarOpen={setSidebarOpen}
                isDarkMode={isDarkMode}
              />
              <SidebarItem
                label="Products"
                Icon={ShoppingCart}
                moduleName="product"
                activeModule={activeModule}
                setActiveModule={setActiveModule}
                setSidebarOpen={setSidebarOpen}
                isDarkMode={isDarkMode}
              />
              <SidebarItem
                label="Manage Orders"
                Icon={ClipboardList}
                moduleName="manage-orders"
                activeModule={activeModule}
                setActiveModule={setActiveModule}
                setSidebarOpen={setSidebarOpen}
                isDarkMode={isDarkMode}
              />
              <SidebarItem
                label="Messages"
                Icon={MessageSquare}
                moduleName="messages"
                activeModule={activeModule}
                setActiveModule={setActiveModule}
                setSidebarOpen={setSidebarOpen}
                isDarkMode={isDarkMode}
              />
              {/* Return Button: Only show if not in overview */}
              {activeModule !== "overview" && (
                <li>
                  <button
                    onClick={handleReturn}
                    className="w-full text-left px-3 py-2 rounded flex items-center gap-2 transition-colors hover:bg-gray-50"
                  >
                    <ArrowLeft size={16} />
                    <span>Return</span>
                  </button>
                </li>
              )}
              <li>
                <button
                  onClick={handleLogout}
                  className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 transition-colors ${
                    isDarkMode ? "hover:bg-gray-700 text-white" : "hover:bg-gray-50 text-black"
                  }`}
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar for larger screens */}
          <header
            className={`hidden md:flex h-16 border-b px-4 md:px-6 items-center justify-between transition-colors duration-300 ${
              isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-800"
            }`}
          >
            <div>
              <h2 className="text-lg md:text-xl font-bold">
                {greeting}, {user ? `${user.first_name} ${user.last_name}` : "Master Admin"}!
              </h2>
              <p className="text-xs md:text-sm">
                {isOnline ? "You are online" : "You are offline"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                <Bell size={18} />
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 rounded-full">
                  3
                </span>
              </button>
              <AvatarDropdown
                user={user}
                handleLogout={handleLogout}
                toggleDarkMode={toggleDarkMode}
                isDarkMode={isDarkMode}
                setActiveModule={setActiveModule}
              />
            </div>
          </header>

          <main className={`p-3 md:p-6 overflow-auto flex-1 transition-colors duration-300 ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-800"}`}>
            {renderModule()}
          </main>
        </div>
      </div>
    </div>
  );
}

// Reusable SidebarItem Component for MasterAdminDashboard
function SidebarItem({
  label,
  Icon,
  moduleName,
  activeModule,
  setActiveModule,
  setSidebarOpen,
  isDarkMode,
}) {
  const isActive = activeModule === moduleName;

  const handleClick = () => {
    setActiveModule(moduleName);
    setSidebarOpen(false);
  };

  return (
    <li>
      <button
        onClick={handleClick}
        className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 transition-colors ${
          isActive
            ? isDarkMode
              ? "bg-gray-700 font-semibold text-white"
              : "bg-blue-100 font-semibold text-black"
            : isDarkMode
            ? "hover:bg-gray-700 text-white"
            : "hover:bg-gray-50 text-black"
        }`}
      >
        {Icon && <Icon size={16} />}
        <span>{label}</span>
      </button>
    </li>
  );
}

export default MasterAdminDashboard;
