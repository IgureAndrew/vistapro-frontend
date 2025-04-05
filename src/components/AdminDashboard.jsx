// src/components/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  User,
  FileText,
  Package,
  ShoppingCart,
  ClipboardList,
  LogOut,
  Bell,
  Menu,
  X,
  MessageSquare,
} from "lucide-react";

// Import module components (adjust these as needed for Admin)
import DashboardOverview from "./DashboardOverview";
import ProfileUpdate from "./ProfileUpdate";
import Reports from "./Reports";
import StockManagement from "./StockManagement";
import Product from "./Product";
import ManageOrders from "./ManageOrders";
import Messaging from "./Messaging";
import Submissions from "./Submissions";
import AvatarDropdown from "./AvatarDropdown";

function AdminDashboard() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  const [user] = useState(storedUser ? JSON.parse(storedUser) : null);
  const [activeModule, setActiveModule] = useState("overview");
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [greeting, setGreeting] = useState("Welcome");

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    const hasVisited = localStorage.getItem("hasVisitedAdminDashboard");
    if (hasVisited) {
      setGreeting("Welcome back");
    } else {
      setGreeting("Welcome");
      localStorage.setItem("hasVisitedAdminDashboard", "true");
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
    setIsDarkMode((prev) => !prev);
  };

  const renderModule = () => {
    switch (activeModule) {
      case "overview":
        return <DashboardOverview />;
      case "profile":
        return <ProfileUpdate />;
      case "reports":
        return <Reports />;
      case "stock":
        return <StockManagement />;
      case "product":
        return <Product />;
      case "manage-orders":
        return <ManageOrders />;
      case "messages":
        return <Messaging />;
      case "submissions":
        return <Submissions />;
      default:
        return <DashboardOverview />;
    }
  };

  // Helper to return the user's initial for the avatar
  const getUserInitial = () => {
    if (user) {
      if (user.name) {
        return user.name.charAt(0).toUpperCase();
      } else if (user.first_name) {
        return user.first_name.charAt(0).toUpperCase();
      }
    }
    return "A";
  };

  return (
    <div
      className={`min-h-screen flex flex-col md:flex-row transition-colors duration-300 ${
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
            <Bell size={18} className="text-black" />
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
          <div className="p-4 text-center font-bold text-xl md:text-2xl border-b transition-colors duration-300">
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
                label="Reports"
                Icon={FileText}
                moduleName="reports"
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
              <SidebarItem
                label="Submissions"
                Icon={FileText}
                moduleName="submissions"
                activeModule={activeModule}
                setActiveModule={setActiveModule}
                setSidebarOpen={setSidebarOpen}
                isDarkMode={isDarkMode}
              />
              <SidebarItem
                label="Assign"
                Icon={() => <span className="text-lg">+</span>}
                moduleName="assign"
                activeModule={activeModule}
                setActiveModule={setActiveModule}
                setSidebarOpen={setSidebarOpen}
                isDarkMode={isDarkMode}
              />
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
                {greeting}, {user ? (user.name || `${user.first_name} ${user.last_name}`) : "Admin"}!
              </h2>
              <p className="text-xs md:text-sm text-gray-500">
                Unique ID: {user ? user.unique_id : "N/A"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                <Bell size={18} className="text-black" />
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

          <main className="p-3 md:p-6 overflow-auto flex-1 transition-colors duration-300">
            {renderModule()}
          </main>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;

function SidebarItem({ label, Icon, moduleName, activeModule, setActiveModule, setSidebarOpen, isDarkMode }) {
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
