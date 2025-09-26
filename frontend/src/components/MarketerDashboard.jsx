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

// Import Shadcn/ui components for consistent design
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import MarketersOverview         from "./MarketersOverview";
import MarketerAccountSettings   from "./MarketerAccountSettings";
import Order                     from "./Order";
import Messaging                 from "./Messaging";
import VerificationMarketer      from "./VerificationMarketer";
import VerificationProgress      from "./VerificationProgress";
import MarketerStockPickup       from "./MarketerStockPickup";
import Wallet                    from "./Wallet";               // ← your new Wallet view
import AvatarDropdown            from "./AvatarDropdown";
import NotificationBell          from "./NotificationBell";
import AssignmentPending         from "./AssignmentPending";
import MarketerVerificationDashboard from "./MarketerVerificationDashboard";
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

  // Redirect logic for marketer access control
  useEffect(() => {
    if (!user) return;

    // Check if marketer is not assigned to an admin
    if (user.role === 'Marketer' && !user.admin_id) {
      // This should be handled by the login API, but as a fallback
      return;
    }

    // Check if marketer is assigned but not verified
    if (user.role === 'Marketer' && user.admin_id && user.overall_verification_status !== 'approved') {
      // This will be handled by the component render logic
      return;
    }
  }, [user]);

  // redirect to landing if not logged in
  useEffect(() => {
    if (!user) navigate("/", { replace: true });
  }, [user, navigate]);


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

    socket.on("verificationStatusChanged", (data) => {
      if (data.marketerUniqueId === user.unique_id) {
        const updated = {
          ...user,
          overall_verification_status: data.newStatus,
        };
        setUser(updated);
        localStorage.setItem("user", JSON.stringify(updated));
        console.log(`🔄 Verification status updated to: ${data.newStatus}`);
        // Optionally show a toast notification instead of alert
        // alert(data.message);
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
      socket.off("verificationStatusChanged");
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          {/* Mobile-First Locked Dashboard Header */}
          <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
            <div className="px-4 py-4">
              <div className="flex items-center justify-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Dashboard Locked</h2>
                  <p className="text-sm text-gray-600">Complete verification to unlock all features</p>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Status Card */}
          <div className="px-4 py-6">
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Verification Required</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Your dashboard is currently locked. Complete the verification process below to access all features including orders, wallet, and stock management.
                </p>
                
                {/* Quick Status Overview */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Verification Progress</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Biodata Form</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${user?.bio_submitted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {user?.bio_submitted ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Guarantor Form</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${user?.guarantor_submitted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {user?.guarantor_submitted ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Commitment Form</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${user?.commitment_submitted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {user?.commitment_submitted ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Forms */}
            <VerificationMarketer onComplete={() => {
              // Refresh user data when verification is complete
              window.location.reload();
            }} />
          </div>
        </div>
      );
    }
    switch (activeModule) {
      case "overview":
        return <MarketersOverview onNavigate={(module) => setActiveModule(module)} />;
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
      case "performance":
        return <div className="p-6"><h2 className="text-xl font-semibold">Performance Reports</h2><p className="text-gray-600">Performance reports coming soon...</p></div>;
      case "manage-orders":
        return <div className="p-6"><h2 className="text-xl font-semibold">Manage Orders</h2><p className="text-gray-600">Order management coming soon...</p></div>;
      default:
        return <MarketersOverview onNavigate={(module) => setActiveModule(module)} />;
    }
  };


  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const greeting = getGreeting();

  // Conditional rendering based on marketer status
  if (user?.role === 'Marketer' && !user.admin_id) {
    return <AssignmentPending />;
  }

  // Check if marketer account is locked (regardless of verification status)
  if (user?.role === 'Marketer' && user.admin_id && user.locked === true) {
    return <MarketerVerificationDashboard user={user} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Modern Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r transform transition-all duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0 flex-shrink-0 bg-card border-border flex flex-col`}>
          <div className={`flex items-center justify-between p-6 border-b transition-colors duration-200 border-border`}>
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.profile_image ? `${import.meta.env.VITE_API_URL}/uploads/${String(user.profile_image).split(/[\\/]/).pop()}` : undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user?.first_name?.[0] || user?.email?.[0] || 'M'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className={`text-sm font-medium transition-colors duration-200 text-foreground`}>
                  {greeting}, {user?.first_name || 'Marketer'}!
                </p>
                <p className={`text-xs transition-colors duration-200 text-muted-foreground`}>
                  {user?.role || 'Marketer'}
                </p>
                <p className={`text-xs transition-colors duration-200 text-muted-foreground`}>
                  ID: {user?.unique_id || 'N/A'}
                </p>
                {isVerified && (
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-600 font-medium">Verified</span>
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation Menu */}
          <nav className="p-4 space-y-2">
            <Button
              variant={activeModule === "overview" ? "default" : "ghost"}
              className={`w-full justify-start space-x-3 transition-all duration-200 ${
                activeModule === "overview" 
                  ? 'bg-primary text-primary-foreground hover:brightness-95' 
                  : 'hover:bg-muted text-foreground'
              }`}
              onClick={() => {
                if (!isVerified) {
                  alert("Complete verification to unlock this feature");
                  return;
                }
                setActiveModule("overview");
                setSidebarOpen(false);
              }}
              disabled={!isVerified}
            >
              <Home className="h-5 w-5" />
              <span>Overview</span>
            </Button>

            <Button
              variant={activeModule === "order" ? "default" : "ghost"}
              className={`w-full justify-start space-x-3 transition-all duration-200 ${
                activeModule === "order" 
                  ? 'bg-primary text-primary-foreground hover:brightness-95' 
                  : 'hover:bg-muted text-foreground'
              }`}
              onClick={() => {
                if (!isVerified) {
                  alert("Complete verification to unlock this feature");
                  return;
                }
                setActiveModule("order");
                setSidebarOpen(false);
              }}
              disabled={!isVerified}
            >
              <ShoppingCart className="h-5 w-5" />
              <span>Orders</span>
            </Button>

            <Button
              variant={activeModule === "account-settings" ? "default" : "ghost"}
              className={`w-full justify-start space-x-3 transition-all duration-200 ${
                activeModule === "account-settings" 
                  ? 'bg-primary text-primary-foreground hover:brightness-95' 
                  : 'hover:bg-muted text-foreground'
              }`}
              onClick={() => {
                if (!isVerified) {
                  alert("Complete verification to unlock this feature");
                  return;
                }
                setActiveModule("account-settings");
                setSidebarOpen(false);
              }}
              disabled={!isVerified}
            >
              <User className="h-5 w-5" />
              <span>Account</span>
            </Button>

            <Button
              variant={activeModule === "messages" ? "default" : "ghost"}
              className={`w-full justify-start space-x-3 transition-all duration-200 ${
                activeModule === "messages" 
                  ? 'bg-primary text-primary-foreground hover:brightness-95' 
                  : 'hover:bg-muted text-foreground'
              }`}
              onClick={() => {
                if (!isVerified) {
                  alert("Complete verification to unlock this feature");
                  return;
                }
                setActiveModule("messages");
                setSidebarOpen(false);
              }}
              disabled={!isVerified}
            >
              <MessageSquare className="h-5 w-5" />
              <span>Messages</span>
            </Button>

            <Button
              variant={activeModule === "verification" ? "default" : "ghost"}
              className={`w-full justify-start space-x-3 transition-all duration-200 ${
                activeModule === "verification" 
                  ? 'bg-primary text-primary-foreground hover:brightness-95' 
                  : 'hover:bg-muted text-foreground'
              }`}
              onClick={() => {
                setActiveModule("verification");
                setSidebarOpen(false);
              }}
            >
              <Bell className="h-5 w-5" />
              <span>Verification</span>
            </Button>

            <Button
              variant={activeModule === "stock-pickup" ? "default" : "ghost"}
              className={`w-full justify-start space-x-3 transition-all duration-200 ${
                activeModule === "stock-pickup" 
                  ? 'bg-primary text-primary-foreground hover:brightness-95' 
                  : 'hover:bg-muted text-foreground'
              }`}
              onClick={() => {
                if (!isVerified) {
                  alert("Complete verification to unlock this feature");
                  return;
                }
                setActiveModule("stock-pickup");
                setSidebarOpen(false);
              }}
              disabled={!isVerified}
            >
              <ShoppingCart className="h-5 w-5" />
              <span>Stock Pickup</span>
            </Button>

            <Button
              variant={activeModule === "wallet" ? "default" : "ghost"}
              className={`w-full justify-start space-x-3 transition-all duration-200 ${
                activeModule === "wallet" 
                  ? 'bg-primary text-primary-foreground hover:brightness-95' 
                  : 'hover:bg-muted text-foreground'
              }`}
              onClick={() => {
                if (!isVerified) {
                  alert("Complete verification to unlock this feature");
                  return;
                }
                setActiveModule("wallet");
                setSidebarOpen(false);
              }}
              disabled={!isVerified}
            >
              <CreditCard className="h-5 w-5" />
              <span>Wallet</span>
            </Button>
          </nav>

          {/* Logout Button */}
          <div className={`mt-auto p-4 border-t transition-colors duration-200 border-border`}>
            <Button
              variant="ghost"
              className={`w-full justify-start space-x-3 transition-colors duration-200 text-destructive hover:text-destructive hover:bg-destructive/10`}
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 w-full min-w-0 transition-colors duration-200 bg-background ${sidebarOpen ? 'ml-64 lg:ml-0' : ''}`}>
          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="p-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
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
          </div>

          {/* Desktop Header */}
          <header className="hidden lg:flex items-center justify-between px-6 h-16 border-b border-border">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {greeting}, {user?.first_name || "Marketer"}!
              </h2>
              <p className="text-sm text-muted-foreground">ID: {user?.unique_id}</p>
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

          {/* Content Area */}
          <div className="flex-1 overflow-auto p-6">
            {renderModule()}
          </div>
        </main>
      </div>
    </div>
  );
}
