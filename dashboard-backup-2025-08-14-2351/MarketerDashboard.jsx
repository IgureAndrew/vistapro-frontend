// src/components/MarketerDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate }            from "react-router-dom";
import io                         from "socket.io-client";
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

import MarketersOverview         from "./MarketersOverview";
import MarketerAccountSettings   from "./MarketerAccountSettings";
import Order                     from "./Order";
import Messaging                 from "./Messaging";
import VerificationMarketer      from "./VerificationMarketer";
import MarketerStockPickup       from "./MarketerStockPickup";
import Wallet                    from "./Wallet";               // ← your new Wallet view
import AvatarDropdown            from "./AvatarDropdown";
import NotificationBell          from "./NotificationBell";
import api                       from "../api/";

// initialize socket.io client
const socket = io("https://vistapro-backend.onrender.com");

export default function MarketerDashboard() {
  const navigate = useNavigate();
  const stored   = localStorage.getItem("user");
  const [user, setUser]                   = useState(stored ? JSON.parse(stored) : null);
  const [activeModule, setActiveModule]   = useState("overview");
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [isDarkMode, setIsDarkMode]       = useState(false);
  const [greeting, setGreeting]           = useState("Welcome");
  const [notifCount, setNotifCount]       = useState(0);

  const isVerified = user?.overall_verification_status === "approved";

  // 1) on-mount: refresh user from /auth/me
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/auth/me");
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      } catch (err) {
        console.error("Couldn't fetch current user:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/", { replace: true });
      }
    })();
  }, [navigate]);

  // redirect to landing if not logged in
  useEffect(() => {
    if (!user) navigate("/", { replace: true });
  }, [user, navigate]);

  // one‐time greeting per session
  useEffect(() => {
    if (localStorage.getItem("hasVisitedMarketerDashboard")) {
      setGreeting("Welcome back");
    } else {
      localStorage.setItem("hasVisitedMarketerDashboard", "true");
    }
  }, []);

  // socket.io listeners
  useEffect(() => {
    if (user?.unique_id) {
      socket.emit("register", user.unique_id);
    }

    socket.on("notificationCount", ({ count }) => {
      setNotifCount(count);
    });

    socket.on("verificationApproved", (data) => {
      if (data.marketerUniqueId === user.unique_id) {
        const updated = {
          ...user,
          overall_verification_status: "approved",
        };
        setUser(updated);
        localStorage.setItem("user", JSON.stringify(updated));
        alert(data.message);
      }
    });

    socket.on("formReset", (data) => {
      if (data.marketerUniqueId === user.unique_id) {
        const key = data.formType.toLowerCase() + "_submitted";
        const updatedUser = { ...user, [key]: false };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        localStorage.setItem("resetFormType", data.formType.toLowerCase());
        alert(data.message);
      }
    });

    return () => {
      socket.off("notificationCount");
      socket.off("verificationApproved");
      socket.off("formReset");
    };
  }, [user]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/", { replace: true });
  };
  const toggleDarkMode = () => setIsDarkMode(d => !d);

  const renderModule = () => {
    if (!isVerified) {
      return (
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Dashboard Locked</h2>
          <p className="mb-4">Complete all verification forms to unlock.</p>
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
      case "stock-pickup":
        return <MarketerStockPickup />;
      case "wallet":
        return <Wallet />;          // ← our new wallet panel
      default:
        return <MarketersOverview />;
    }
  };

  function SidebarItem({ label, Icon, moduleName, disabled }) {
    const isActive = activeModule === moduleName;
    const base = isActive
      ? (isDarkMode ? "bg-gray-700 text-white" : "bg-blue-100 text-black")
      : (isDarkMode ? "hover:bg-gray-700 text-white" : "hover:bg-gray-50 text-black");

    return (
      <li>
        <button
          disabled={disabled}
          onClick={() => {
            if (disabled) return alert("Complete verification first");
            setActiveModule(moduleName);
            setSidebarOpen(false);
          }}
          className={`flex items-center gap-2 px-3 py-2 w-full rounded ${base}`}
        >
          {Icon && <Icon size={16} />}
          <span>{label}</span>
        </button>
      </li>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"}`}>
      {/* Mobile top bar */}
      <header className="md:hidden flex items-center justify-between px-4 h-16 border-b">
        <button onClick={() => setSidebarOpen(v => !v)} className="p-2">
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <h2 className="text-lg font-bold">Vistapro</h2>
        <div className="flex items-center gap-3">
          <NotificationBell count={notifCount} />
          <AvatarDropdown
            user={user}
            handleLogout={handleLogout}
            toggleDarkMode={toggleDarkMode}
            isDarkMode={isDarkMode}
            setActiveModule={setActiveModule}
          />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
            fixed inset-y-0 left-0 z-50
            w-full sm:w-3/4 md:w-64
            transform transition-transform duration-200
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            md:relative md:translate-x-0
            border-r ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}
          `}>
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-bold">Vistapro</h2>
            <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
              <X size={24} />
            </button>
          </div>
          <ul className="p-4 space-y-2 text-sm">
            <SidebarItem label="Overview"        Icon={Home}         moduleName="overview"        disabled={!isVerified} />
            <SidebarItem label="Orders"          Icon={ShoppingCart} moduleName="order"           disabled={!isVerified} />
            <SidebarItem label="Account"         Icon={User}         moduleName="account-settings" disabled={!isVerified} />
            <SidebarItem label="Messages"        Icon={MessageSquare}moduleName="messages"        disabled={!isVerified} />
            <SidebarItem label="Verification"    Icon={Bell}         moduleName="verification"    disabled={false}       />
            <SidebarItem label="Stock Pickup"    Icon={ShoppingCart} moduleName="stock-pickup"    disabled={!isVerified} />
            <SidebarItem label="Wallet"          Icon={CreditCard}   moduleName="wallet"          disabled={!isVerified} />
            {activeModule !== "overview" && (
              <li>
                <button
                  onClick={() => setActiveModule("overview")}
                  className="flex items-center gap-2 px-3 py-2 w-full rounded hover:bg-gray-50"
                >
                  <ArrowLeft size={16} /> Return
                </button>
              </li>
            )}
            <li>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 w-full rounded hover:bg-gray-50"
              >
                <LogOut size={16} /> Logout
              </button>
            </li>
          </ul>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Desktop top bar */}
          <header className="hidden md:flex items-center justify-between px-6 h-16 border-b">
            <div>
              <h2 className="text-xl font-bold">{greeting}, {user?.first_name}!</h2>
              <p className="text-sm text-gray-500">ID: {user?.unique_id}</p>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell count={notifCount} />
              <AvatarDropdown
                user={user}
                handleLogout={handleLogout}
                toggleDarkMode={toggleDarkMode}
                isDarkMode={isDarkMode}
                setActiveModule={setActiveModule}
              />
            </div>
          </header>

          {/* Page body */}
          <main className="flex-1 overflow-auto p-6 bg-gray-50">
            {renderModule()}
          </main>
        </div>
      </div>
    </div>
  );
}
