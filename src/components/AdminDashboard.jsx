// src/components/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  ClipboardList,
  Package,
  MessageSquare,
  FileText,
  ShoppingCart,
  LogOut,
} from "lucide-react";

// Import module components for each section.
import ProfileUpdate from "./ProfileUpdate";
import ManageOrders from "./ManageOrders";
import AdminStockPickups from "./AdminStockPickups";
import Messaging from "./Messaging";
import Submissions from "./Submissions";
import Verification from "./Verification";
import AdminOverview from "./AdminOverview"; // Import the new AdminOverview component
import AvatarDropdown from "./AvatarDropdown";
import AssignedMarketers from "./AssignedMarketers";
import AdminWallet from "./AdminWallet";

function AdminDashboard() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  const [user] = useState(storedUser ? JSON.parse(storedUser) : null);
  // Set default active module to "overview" (AdminOverview)
  const [activeModule, setActiveModule] = useState("overview");
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Renders the currently selected module.
  const renderModule = () => {
    switch (activeModule) {
      case "overview":
        return <AdminOverview />;
      case "profile":
        return <ProfileUpdate />;
      case "manage-orders":
        return <ManageOrders />;
      case "stock":
        return <AdminStockPickups />;
      case "marketers":
        return <AssignedMarketers />;
      case "messages":
        return <Messaging />;
      case "submissions":
        return <Submissions />;
      case "verification":
        return <Verification />;
      case "wallet":
        return <AdminWallet />;
      default:
        return <AdminOverview />;
    }
  };

  // SidebarItem component for each sidebar option.
  const SidebarItem = ({
    label,
    Icon,
    moduleName,
    activeModule,
    setActiveModule,
    setSidebarOpen,
    isDarkMode,
  }) => {
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
  };

  // Helper to return the user's initial for the avatar.
  const getUserInitial = () => {
    if (user) {
      if (user.name) return user.name.charAt(0).toUpperCase();
      if (user.first_name) return user.first_name.charAt(0).toUpperCase();
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
            {sidebarOpen ? "Close" : "Menu"}
          </button>
          <h2 className="text-lg font-bold">Vistapro</h2>
        </div>
        <div className="flex items-center gap-4">
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
          <nav className="p-3">
            <ul className="list-none space-y-2 text-sm">
              <SidebarItem
                label="Overview"
                Icon={ClipboardList} // You can change this icon as desired.
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
                label="Manage Orders"
                Icon={ClipboardList}
                moduleName="manage-orders"
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
                label="Messages"
                Icon={MessageSquare}
                moduleName="messages"
                activeModule={activeModule}
                setActiveModule={setActiveModule}
                setSidebarOpen={setSidebarOpen}
                isDarkMode={isDarkMode}
              />
            
              <SidebarItem
                label="Marketers"
                Icon={User} // Use an appropriate icon
                moduleName="marketers"
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
                label="Verification"
                Icon={FileText}
                moduleName="verification"
                activeModule={activeModule}
                setActiveModule={setActiveModule}
                setSidebarOpen={setSidebarOpen}
                isDarkMode={isDarkMode}
              />
              <SidebarItem
                label="Wallet"
                Icon={ShoppingCart}
                moduleName="wallet"
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

// SidebarItem component renders each item in the sidebar.
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
