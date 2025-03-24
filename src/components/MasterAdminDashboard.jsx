import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  User,
  Users as UsersIcon,
  FileText,
  Package,
  Shield,
  UserPlus,
  ShoppingCart,
  ClipboardList,
  LogOut,
  Bell,
  Menu,
  X,
} from "lucide-react";

import DashboardOverview from "./DashboardOverview";
import ProfileUpdate from "./ProfileUpdate";
import UsersManagement from "./UsersManagement";
import Reports from "./Reports";
import CashOut from "./CashOut";
import Performance from "./Performance";
import StockManagement from "./StockManagement";
import Verification from "./Verification";
import RegisterSuperAdmin from "./RegisterSuperAdmin";
import AssignMarketer from "./AssignMarketer";
import Product from "./Product";
import ManageOrders from "./ManageOrders";

function MasterAdminDashboard() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  const [user] = useState(storedUser ? JSON.parse(storedUser) : null);
  const [activeModule, setActiveModule] = useState("overview");
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        return <StockManagement />;
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
      default:
        return <DashboardOverview />;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-800">
      {/* Top Navbar for small screens */}
      <header className="h-16 flex items-center justify-between px-4 bg-white border-b border-gray-200 md:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded hover:bg-gray-100"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h2 className="text-lg font-bold">Vistapro</h2>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded hover:bg-gray-100">
            <Bell size={18} className="text-black" />
            <span className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 rounded-full">
              3
            </span>
          </button>
          {/* Small-screen avatar logic */}
          {user?.profile_image ? (
            <img
              src={user.profile_image}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-white font-bold">
              {user ? user.name.charAt(0).toUpperCase() : "M"}
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "block" : "hidden"
          } md:block w-full md:w-64 bg-white border-r border-gray-200 flex-shrink-0`}
        >
          <div className="p-4 text-center font-bold text-xl border-b border-gray-200 md:text-2xl">
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
              />
              <SidebarItem
                label="Profile"
                Icon={User}
                moduleName="profile"
                activeModule={activeModule}
                setActiveModule={setActiveModule}
                setSidebarOpen={setSidebarOpen}
              />
              <SidebarItem
                label="Users"
                Icon={UsersIcon}
                moduleName="users"
                activeModule={activeModule}
                setActiveModule={setActiveModule}
                setSidebarOpen={setSidebarOpen}
              />
              <SidebarItem
                label="Reports"
                Icon={FileText}
                moduleName="reports"
                activeModule={activeModule}
                setActiveModule={setActiveModule}
                setSidebarOpen={setSidebarOpen}
              />
              <SidebarItem
                label="Cash Out"
                // Naira sign
                Icon={() => <span className="text-black text-lg">₦</span>}
                moduleName="cashout"
                activeModule={activeModule}
                setActiveModule={setActiveModule}
                setSidebarOpen={setSidebarOpen}
              />
              <SidebarItem
                label="Performance"
                Icon={Package}
                moduleName="performance"
                activeModule={activeModule}
                setActiveModule={setActiveModule}
                setSidebarOpen={setSidebarOpen}
              />
              <SidebarItem
                label="Stock"
                Icon={Package}
                moduleName="stock"
                activeModule={activeModule}
                setActiveModule={setActiveModule}
                setSidebarOpen={setSidebarOpen}
              />
              <SidebarItem
                label="Verification"
                Icon={Shield}
                moduleName="verification"
                activeModule={activeModule}
                setActiveModule={setActiveModule}
                setSidebarOpen={setSidebarOpen}
              />
              <SidebarItem
                label="Register Super Admin"
                Icon={Shield}
                moduleName="register-super-admin"
                activeModule={activeModule}
                setActiveModule={setActiveModule}
                setSidebarOpen={setSidebarOpen}
              />
              <SidebarItem
                label="Assign Marketers"
                Icon={UserPlus}
                moduleName="assign-marketer"
                activeModule={activeModule}
                setActiveModule={setActiveModule}
                setSidebarOpen={setSidebarOpen}
              />
              <SidebarItem
                label="Products"
                Icon={ShoppingCart}
                moduleName="product"
                activeModule={activeModule}
                setActiveModule={setActiveModule}
                setSidebarOpen={setSidebarOpen}
              />
              <SidebarItem
                label="Manage Orders"
                Icon={ClipboardList}
                moduleName="manage-orders"
                activeModule={activeModule}
                setActiveModule={setActiveModule}
                setSidebarOpen={setSidebarOpen}
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
          {/* Top Bar for larger screens */}
          <header className="hidden md:flex h-16 bg-white border-b border-gray-200 px-4 md:px-6 items-center justify-between">
            <div>
              <h2 className="text-lg md:text-xl font-bold">
                Welcome Back, {user ? user.name : "Master Admin"}!
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
              {/* Large-screen avatar logic */}
              {user?.profile_image ? (
                <img
                  src={user.profile_image}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-white font-bold">
                  {user ? user.name.charAt(0).toUpperCase() : "M"}
                </div>
              )}
            </div>
          </header>

          {/* Render Active Module */}
          <main className="p-3 md:p-6 overflow-auto flex-1">{renderModule()}</main>
        </div>
      </div>
    </div>
  );
}

export default MasterAdminDashboard;

/* Reusable Sidebar Item Component */
function SidebarItem({
  label,
  Icon,
  moduleName,
  activeModule,
  setActiveModule,
  setSidebarOpen
}) {
  const isActive = activeModule === moduleName;
  const handleClick = () => {
    setActiveModule(moduleName);
    // On small screens, close the sidebar after clicking
    setSidebarOpen(false);
  };

  return (
    <li>
      <button
        onClick={handleClick}
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
