// src/components/MarketerDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  ShoppingCart,
  MapPin,
  User,
  DollarSign,
  Package,
  Bell,
  LogOut,
  Menu,
  X,
  ArrowLeft,
} from "lucide-react";

// Import your dashboard modules for marketers
import DashboardOverview from "./DashboardOverview";
import ProfileUpdate from "./ProfileUpdate";
import Order from "./Order";
import Outlet from "./Outlet";
import CashOut from "./CashOut";
import StockUpdate from "./StockUpdate";
import VerificationMarketer from "./VerificationMarketer";
import AvatarDropdown from "./AvatarDropdown";

function MarketerDashboard() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  const [user] = useState(storedUser ? JSON.parse(storedUser) : null);
  const [activeModule, setActiveModule] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [greeting, setGreeting] = useState("Welcome");

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Greeting logic (welcome or welcome back)
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

  const handleReturn = () => {
    setActiveModule("overview");
  };

  const renderModule = () => {
    // If the marketer isn't yet approved, display an access restriction message and the verification form
    // if (user && user.overall_verification_status !== "approved") {
    //  return (
    //    <div className="max-w-3xl mx-auto p-4">
    //      <h2 className="text-2xl font-bold mb-4">Access Restricted</h2>
    //      <p className="mb-4">
    //        Dear {user.first_name}, you cannot access your dashboard until your registration is complete and approved.
    //        Please complete your registration and wait for administrative approval.
    //      </p>
    //      <VerificationMarketer />
    //    </div>
    //  );
    // }
    // If approved, render the selected module
    switch (activeModule) {
      case "overview":
        return <DashboardOverview />;
      case "order":
        return <Order />;
      case "outlet":
        return <Outlet />;
      case "profile":
        return <ProfileUpdate />;
      case "cashout":
        return <CashOut />;
      case "stock":
        return <StockUpdate />;
      case "verification":
        return <VerificationMarketer />;
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
                label="Order"
                Icon={ShoppingCart}
                moduleName="order"
                activeModule={activeModule}
                setActiveModule={setActiveModule}
                setSidebarOpen={setSidebarOpen}
                isDarkMode={isDarkMode}
              />
              <SidebarItem
                label="Outlet"
                Icon={MapPin}
                moduleName="outlet"
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
                label="Cashout"
                Icon={DollarSign}
                moduleName="cashout"
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
              {/* Always accessible verification */}
              <SidebarItem
                label="Verification"
                Icon={Bell}
                moduleName="verification"
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
                {greeting}, {user ? `${user.first_name} ${user.last_name}` : "Marketer"}!
              </h2>
              <p className="text-xs md:text-sm">
                Unique ID: {user ? user.unique_id : ""}
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

          <main className="p-3 md:p-6 overflow-auto flex-1 transition-colors duration-300">
            {renderModule()}
          </main>
        </div>
      </div>
    </div>
  );
}

// Reusable SidebarItem Component for MarketerDashboard
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

export default MarketerDashboard;
