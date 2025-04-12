// src/components/MarketerDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  ShoppingCart,
  User,
  Bell,
  LogOut,
  Menu,
  X,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";

// Import your dashboard modules for marketers.
import MarketersOverview from "./MarketersOverview"; // Overview module for marketers
import ProfileUpdate from "./ProfileUpdate";
import Order from "./Order";
import Messaging from "./Messaging";
import VerificationMarketer from "./VerificationMarketer";
import Wallet from "./Wallet";
import MarketerStockPickup from "./MarketerStockPickup";
import AvatarDropdown from "./AvatarDropdown";

function MarketerDashboard() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  const [user] = useState(storedUser ? JSON.parse(storedUser) : null);
  const [activeModule, setActiveModule] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [greeting, setGreeting] = useState("Welcome");

  // Temporary flag to unlock dashboard during testing.
  // Set this to true to bypass verification locking logic.
  const tempUnlockDashboard = true;

  // Redirect if user is not logged in.
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Set greeting based on previous visits.
  useEffect(() => {
    const hasVisited = localStorage.getItem("hasVisitedMarketerDashboard");
    if (hasVisited) {
      setGreeting("Welcome back");
    } else {
      setGreeting("Welcome");
      localStorage.setItem("hasVisitedMarketerDashboard", "true");
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

  // Determine if the marketer is verified. If tempUnlockDashboard is true, dashboard will be unlocked regardless.
  const isVerified = tempUnlockDashboard || (user && user.overall_verification_status === "approved");

  // Render different modules based on the activeModule state.
  const renderModule = () => {
    // If the account is not verified (and temporary unlock is off), force the Verification module.
    if (!isVerified) {
      return (
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">
            Your Dashboard is Currently Locked.
          </h2>
          <p className="mb-4 text-md">
            You must complete and submit all verification forms. Once your information is reviewed and approved, your dashboard will be unlocked.
          </p>
          <VerificationMarketer />
        </div>
      );
    }

    // If verified, render the module based on the activeModule state.
    switch (activeModule) {
      case "overview":
        return <MarketersOverview />;
      case "order":
        return <Order />;
      case "profile":
        return <ProfileUpdate />;
      case "messages":
        return <Messaging />;
      case "verification":
        return <VerificationMarketer />;
      case "wallet":
        return <Wallet />;
      case "stock-pickup":
        return <MarketerStockPickup />;
      default:
        return <MarketersOverview />;
    }
  };

  // SidebarItem component renders each item in the sidebar.
  const SidebarItem = ({ label, Icon, moduleName, activeModule, setActiveModule, setSidebarOpen, isDarkMode }) => {
    const isActive = activeModule === moduleName;
    const handleClick = () => {
      // If the dashboard is locked and the module isn't verification, prevent navigation.
      if (!isVerified && moduleName !== "verification") {
        alert("Your dashboard is locked until your verification is approved. Please complete your verification forms.");
        return;
      }
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

  // Helper to return the user's initial (for avatar fallback).
  const getUserInitial = () => {
    if (user) {
      if (user.name) return user.name.charAt(0).toUpperCase();
      if (user.first_name) return user.first_name.charAt(0).toUpperCase();
    }
    return "M";
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
          <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-white font-bold">
            {user && user.first_name ? user.first_name.charAt(0).toUpperCase() : "M"}
          </div>
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
                Icon={Home}
                moduleName="overview"
                activeModule={activeModule}
                setActiveModule={setActiveModule}
                setSidebarOpen={setSidebarOpen}
                isDarkMode={isDarkMode}
              />
              <SidebarItem
                label="Order"
                Icon={ShoppingCart}
                moduleName="order"
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
                label="Messages"
                Icon={MessageSquare}
                moduleName="messages"
                activeModule={activeModule}
                setActiveModule={setActiveModule}
                setSidebarOpen={setSidebarOpen}
                isDarkMode={isDarkMode}
              />
              <SidebarItem
                label="Verification"
                Icon={Bell}
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
              <SidebarItem
                label="Stock Pickup"
                Icon={ShoppingCart}
                moduleName="stock-pickup"
                activeModule={activeModule}
                setActiveModule={setActiveModule}
                setSidebarOpen={setSidebarOpen}
                isDarkMode={isDarkMode}
              />
              {activeModule !== "overview" && (
                <li>
                  <button
                    onClick={() => setActiveModule("overview")}
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
                {greeting}, {user ? `${user.first_name} ${user.last_name}` : "Marketer"}!
              </h2>
              <p className="text-xs md:text-sm text-gray-500">
                Unique ID: {user ? user.unique_id : ""}
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

export default MarketerDashboard;

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

/**
 * Temporary Dashboard Lock:
 * The following snippet can be placed at the top of your MarketerDashboard component’s render logic
 * to force a locked view if the marketer’s overall_verification_status is not "approved" 
 * (unless temporary unlock is enabled for testing).
 *
 * For example, right inside the MarketerDashboard component (before returning the main dashboard):
 *
 * if (user.overall_verification_status !== "approved") {
 *   return (
 *     <div className="p-4">
 *       <h2>Your dashboard is locked until verification is complete.</h2>
 *       <p>Please complete all verification forms and await approval.</p>
 *     </div>
 *   );
 * }
 *
 * You can comment out this block when you're ready to unlock the dashboard.
 */
