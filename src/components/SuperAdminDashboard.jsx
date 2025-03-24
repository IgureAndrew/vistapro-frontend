import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// Import lucide-react icons
import {
  Home,
  User,
  FileText,
  Package,
  ShoppingCart,
  ClipboardList,
  LogOut,
  Bell,
} from "lucide-react";

// Import your module components (or placeholders)
import DashboardOverview from "./DashboardOverview";
import ProfileUpdate from "./ProfileUpdate";
import Reports from "./Reports";
import StockManagement from "./StockManagement";
import Product from "./Product";
import ManageOrders from "./ManageOrders";

function SuperAdminDashboard() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  const [user] = useState(storedUser ? JSON.parse(storedUser) : null);
  const [activeModule, setActiveModule] = useState("overview");
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

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
      default:
        return <DashboardOverview />;
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
              label="Overview"
              Icon={Home}
              moduleName="overview"
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
              label="Reports"
              Icon={FileText}
              moduleName="reports"
              activeModule={activeModule}
              setActiveModule={setActiveModule}
            />
            <SidebarItem
              label="Stock"
              Icon={Package}
              moduleName="stock"
              activeModule={activeModule}
              setActiveModule={setActiveModule}
            />
            <SidebarItem
              label="Products"
              Icon={ShoppingCart}
              moduleName="product"
              activeModule={activeModule}
              setActiveModule={setActiveModule}
            />
            <SidebarItem
              label="Manage Orders"
              Icon={ClipboardList}
              moduleName="manage-orders"
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
              Welcome Back, {user ? user.name : "Super Admin"}!
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
              {user ? user.name.charAt(0).toUpperCase() : "S"}
            </div>
          </div>
        </header>

        {/* Render Active Module */}
        <main className="p-3 md:p-6 overflow-auto flex-1">{renderModule()}</main>
      </div>
    </div>
  );
}

export default SuperAdminDashboard;

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
