// src/components/MarketerDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate }               from "react-router-dom";
import io                            from "socket.io-client";
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
  CreditCard,
} from "lucide-react";

import MarketersOverview             from "./MarketersOverview";
import MarketerAccountSettings       from "./MarketerAccountSettings";
import Order                         from "./Order";
import Messaging                     from "./Messaging";
import VerificationMarketer          from "./VerificationMarketer";
import Wallet                        from "./Wallet";
import MarketerStockPickup           from "./MarketerStockPickup";
import AvatarDropdown                from "./AvatarDropdown";

// Init socket
const socket = io("https://vistapro-backend.onrender.com");

function NotificationBell({ count = 0, onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
    >
      <Bell size={18} />
      {count > 0 && (
        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 rounded-full">
          {count}
        </span>
      )}
    </button>
  );
}

export default function MarketerDashboard() {
  const navigate = useNavigate();
  const stored   = localStorage.getItem("user");
  const [user, setUser] = useState(stored ? JSON.parse(stored) : null);

  const [activeModule, setActiveModule] = useState("overview");
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [isDarkMode,   setIsDarkMode]   = useState(false);
  const [greeting,     setGreeting]     = useState("Welcome");
  const [notifCount,   setNotifCount]   = useState(0);

  // Only show wallet when marketer is verified
  const isVerified =
    user && user.overall_verification_status === "approved";

  // redirect if not logged in
  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  // greeting once per session
  useEffect(() => {
    if (localStorage.getItem("hasVisitedMarketerDashboard")) {
      setGreeting("Welcome back");
    } else {
      localStorage.setItem("hasVisitedMarketerDashboard", "true");
    }
  }, []);

  // socket listeners
  useEffect(() => {
    if (user?.unique_id) socket.emit("register", user.unique_id);

    socket.on("notification", ({ count }) => setNotifCount(count));
    socket.on("verificationApproved", (data) => {
      if (data.marketerUniqueId === user.unique_id) {
        const updated = { ...user, overall_verification_status: "approved" };
        setUser(updated);
        localStorage.setItem("user", JSON.stringify(updated));
        alert(data.message);
      }
    });
    socket.on("formReset", (data) => {
      if (data.marketerUniqueId === user.unique_id) {
        const formKey = data.formType.toLowerCase() + "_submitted";
        setUser(u => ({ ...u, [formKey]: false }));
        alert(data.message || `${data.formType} form reset.`);
      }
    });

    return () => {
      socket.off("notification");
      socket.off("verificationApproved");
      socket.off("formReset");
    };
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const toggleDarkMode = () => setIsDarkMode(d => !d);

  // Renders main content or locked view
  const renderContent = () => {
    if (!isVerified) {
      return (
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Dashboard Locked</h2>
          <p className="mb-4">
            Complete all verification forms to unlock your dashboard.
          </p>
          <VerificationMarketer />
        </div>
      );
    }
    switch (activeModule) {
      case "overview":
        return <MarketersOverview onNewOrder={() => setActiveModule("order")} />;
      case "order":
        return <Order />;
      case "account-settings":
        return <MarketerAccountSettings />;
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

  function SidebarItem({ label, Icon, moduleName, disabled }) {
    const isActive = activeModule === moduleName;
    const base = isActive
      ? isDarkMode ? "bg-gray-700 text-white" : "bg-blue-100 text-black"
      : isDarkMode ? "hover:bg-gray-700 text-white" : "hover:bg-gray-50 text-black";

    return (
      <li>
        <button
          onClick={() => {
            if (disabled) return alert("Complete verification to access this.");
            setActiveModule(moduleName);
            setSidebarOpen(false);
          }}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded ${base}`}
        >
          <Icon size={16} />
          <span>{label}</span>
        </button>
      </li>
    );
  }

  return (
    <div className={`min-h-screen flex ${isDarkMode ? "bg-gray-900" : "bg-white text-gray-800"}`}>
      {/* Mobile Navbar */}
      <header
        className={`h-16 flex items-center justify-between px-4 border-b md:hidden ${
          isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <h2 className="text-lg font-bold">Vistapro</h2>
        <div className="flex items-center gap-4">
          <NotificationBell
            count={notifCount}
            onClick={() => alert("Show notifications…")}
          />
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
          className={`${sidebarOpen ? "block" : "hidden"} md:block w-full md:w-64 border-r ${
            isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}
        >
          <div className="p-4 text-center font-bold text-xl border-b">
            Vistapro
          </div>
          <ul className="p-3 space-y-2 text-sm">
            <SidebarItem label="Overview"        Icon={Home}         moduleName="overview"       disabled={!isVerified}/>
            <SidebarItem label="Orders"          Icon={ShoppingCart} moduleName="order"          disabled={!isVerified}/>
            <SidebarItem label="Account"         Icon={User}         moduleName="account-settings"disabled={!isVerified}/>
            <SidebarItem label="Messages"        Icon={MessageSquare}moduleName="messages"        disabled={!isVerified}/>
            <SidebarItem label="Verification"    Icon={Bell}         moduleName="verification"    disabled={false}/>
            <SidebarItem
              label="Wallet"
              Icon={CreditCard}
              moduleName="wallet"
              disabled={!isVerified}
            />
            <SidebarItem label="Stock Pickup"    Icon={ShoppingCart} moduleName="stock-pickup"    disabled={!isVerified}/>
            {activeModule !== "overview" && (
              <li>
                <button
                  onClick={() => setActiveModule("overview")}
                  className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-50"
                >
                  <ArrowLeft size={16} />
                  Return
                </button>
              </li>
            )}
            <li>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-50"
              >
                <LogOut size={16} />
                Logout
              </button>
            </li>
          </ul>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Desktop Navbar */}
          <header
            className={`hidden md:flex h-16 items-center justify-between px-6 border-b ${
              isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            }`}
          >
            <div>
              <h2 className="text-xl font-bold">
                {greeting}, {user?.first_name}!
              </h2>
              <p className="text-sm text-gray-500">ID: {user?.unique_id}</p>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell
                count={notifCount}
                onClick={() => alert("Show notifications…")}
              />
              <AvatarDropdown
                user={user}
                handleLogout={handleLogout}
                toggleDarkMode={toggleDarkMode}
                isDarkMode={isDarkMode}
                setActiveModule={setActiveModule}
              />
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
}
