// src/components/MarketerDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// Import lucide-react icons for sidebar items
import {
  ShoppingCart,   // Order module
  MapPin,         // Outlet module
  User,           // Profile
  DollarSign,     // Cashout (or customize with Naira sign if needed)
  Package,        // Stock Update
  CheckCircle,    // Verification
  LogOut,
  Bell,
} from "lucide-react";

// Import module components (or placeholders)
import Order from "./Order";                // Order module component
import Outlet from "./Outlet";              // Outlet module component
import ProfileUpdate from "./ProfileUpdate"; // Profile update component
import CashOut from "./CashOut";            // Cashout component
import StockUpdate from "./StockUpdate";    // Stock update component
import Verification from "./Verification";  // Verification component

function MarketerDashboard() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  const [user] = useState(storedUser ? JSON.parse(storedUser) : null);
  const [activeModule, setActiveModule] = useState("order");
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);

  // Redirect if no user is logged in
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Listen for online/offline events
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

   // Logout function: clear auth data and redirect to landing page.
   const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // Render the active module based on the selected sidebar item
  const renderModule = () => {
    switch (activeModule) {
      case "order":
        return <Order />;
      case "outlet":
        return <Outlet />;
      case "profile":
        return <ProfileUpdate />;
      case "cashout":
        return <CashOut />;
      case "stockupdate":
        return <StockUpdate />;
      case "verification":
        return <Verification />;
      default:
        return <Order />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white text-gray-800">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white flex flex-col border-r border-gray-200">
        <div className="p-4 text-center font-bold text-xl md:text-2xl border-b border-gray-200">
          Vistapro
        </div>
        <nav className="p-3 flex-1">
          <ul className="list-none space-y-2 text-sm">
            <SidebarItem
              label="Order"
              Icon={ShoppingCart}
              moduleName="order"
              activeModule={activeModule}
              setActiveModule={setActiveModule}
            />
            <SidebarItem
              label="Outlet"
              Icon={MapPin}
              moduleName="outlet"
              activeModule={activeModule}
              setActiveModule={setActiveModule}
            />
            <SidebarItem
              label="Profile"
              Icon={User}
              moduleName="profile"
              activeModule={activeModule}
              setActiveModule={setActiveModule}
            />
            <SidebarItem
              label="Cashout"
              Icon={DollarSign}
              moduleName="cashout"
              activeModule={activeModule}
              setActiveModule={setActiveModule}
            />
            <SidebarItem
              label="Stock Update"
              Icon={Package}
              moduleName="stockupdate"
              activeModule={activeModule}
              setActiveModule={setActiveModule}
            />
            <SidebarItem
              label="Verification"
              Icon={CheckCircle}
              moduleName="verification"
              activeModule={activeModule}
              setActiveModule={setActiveModule}
            />
            <li>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded flex items-center gap-2 hover:bg-gray-50 transition"
              >
                <LogOut size={16} className="text-black" />
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 px-4 md:px-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg md:text-xl font-bold">
              Welcome Back, {user ? user.name : "Marketer"}!
            </h2>
            <p className="text-xs md:text-sm text-gray-500">
              {isOnline ? "You are online" : "You are offline"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded hover:bg-gray-100">
              <Bell size={18} className="text-black" />
              <span className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 rounded-full">
                3
              </span>
            </button>
            <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-white font-bold">
              {user ? user.name.charAt(0).toUpperCase() : "M"}
            </div>
          </div>
        </header>

        {/* Render Active Module */}
        <main className="p-3 md:p-6 overflow-auto flex-1">{renderModule()}</main>
      </div>
    </div>
  );
}

export default MarketerDashboard;

/* Reusable Sidebar Item Component */
function SidebarItem({ label, Icon, moduleName, activeModule, setActiveModule }) {
  const isActive = activeModule === moduleName;
  return (
    <li>
      <button
        onClick={() => setActiveModule(moduleName)}
        className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 transition-colors ${
          isActive ? "bg-blue-100 font-semibold" : "hover:bg-blue-50"
        }`}
      >
        {Icon && <Icon size={16} className="text-black" />}
        <span>{label}</span>
      </button>
    </li>
  );
}
