// src/components/DealerDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate }              from "react-router-dom";
import io                           from "socket.io-client";
import {
  Home,
  User,
  ClipboardList,
  LogOut,
  Menu,
  X,
  Bell,
} from "lucide-react";

import DealerOverview    from "./DealerOverview";
import ProfileUpdate     from "./ProfileUpdate";
import ManageOrders      from "./ManageOrders";
import AvatarDropdown    from "./AvatarDropdown";
import NotificationBell  from "./NotificationBell";

const socket = io("https://vistapro-backend.onrender.com");

export default function DealerDashboard() {
  const navigate = useNavigate();
  const stored   = localStorage.getItem("user");
  const [user, setUser]                 = useState(stored ? JSON.parse(stored) : null);
  const [activeModule, setActiveModule] = useState("overview"); // default to overview
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [notifCount, setNotifCount]     = useState(0);

  // sync & register for notifications
  useEffect(() => {
    if (!user) {
      navigate("/", { replace: true });
      return;
    }
    socket.emit("register", user.unique_id);
    socket.on("notificationCount", ({ count }) => setNotifCount(count));
    return () => socket.off("notificationCount");
  }, [user, navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/", { replace: true });
  };

  const renderModule = () => {
    switch (activeModule) {
      case "overview":
        return <DealerOverview />;
      case "profile":
        return <ProfileUpdate />;
      case "manage-orders":
        return <ManageOrders />;
      default:
        return <DealerOverview />;
    }
  };

  function SidebarItem({ label, Icon, moduleName }) {
    const isActive = activeModule === moduleName;
    return (
      <li>
        <button
          onClick={() => {
            setActiveModule(moduleName);
            setSidebarOpen(false);
          }}
          className={`flex items-center gap-2 px-3 py-2 w-full rounded transition-colors
            ${isActive
              ? "bg-blue-100 text-black"
              : "hover:bg-gray-50 text-gray-800"
            }`}
        >
          <Icon size={16} />
          <span>{label}</span>
        </button>
      </li>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white text-gray-800 overflow-hidden">
      {/* Mobile header */}
      <header className="md:hidden flex items-center justify-between px-4 h-16 border-b">
        <button onClick={() => setSidebarOpen(o => !o)} className="p-2">
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <h2 className="text-lg font-bold">Vistapro</h2>
        <div className="flex items-center gap-3">
          <NotificationBell count={notifCount} />
          <AvatarDropdown user={user} handleLogout={handleLogout} />
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
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 w-3/4 sm:w-64 bg-white border-r
            transform transition-transform duration-200 flex flex-col
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            md:relative md:translate-x-0
          `}
        >
          <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
            <h2 className="text-xl font-bold">Vistapro</h2>
            <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
              <X size={24} />
            </button>
          </div>
          <ul className="flex-1 overflow-y-auto p-4 space-y-2 text-sm">
            <SidebarItem label="Overview"       Icon={Home}         moduleName="overview" />
            <SidebarItem label="Profile"        Icon={User}         moduleName="profile" />
            <SidebarItem label="Manage Orders"  Icon={ClipboardList} moduleName="manage-orders" />
          </ul>
          <div className="flex-shrink-0 p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 w-full rounded hover:bg-gray-50 text-gray-700"
            >
              <LogOut size={16} /> 
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          {/* Desktop header */}
          <header className="hidden md:flex items-center justify-between px-6 h-16 border-b">
            <div>
              <h2 className="text-xl font-bold">
                Welcome, {user?.first_name || "Dealer"}!
              </h2>
              <p className="text-sm text-gray-500">ID: {user?.unique_id}</p>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell count={notifCount} />
              <AvatarDropdown user={user} handleLogout={handleLogout} />
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6 bg-gray-50">
            {renderModule()}
          </main>
        </div>
      </div>
    </div>
  );
}
