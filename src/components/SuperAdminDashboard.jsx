// src/components/SuperAdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  Home,
  User,
  FileText,
  Package,
  ShoppingCart,
  ClipboardList,
  LogOut,
  MessageSquare,
  CheckCircle,
  FilePlus,
  UserPlus,
} from 'lucide-react';

import SuperAdminOverview   from './SuperAdminOverview';
import SuperAdminAccountSettings       from './SuperAdminAccountSettings';
import SuperAdminStockPickups      from './SuperAdminStockPickups';
import Product              from './Product';
import SuperAdminManageOrders         from './SuperAdminManageOrders';
import SuperAdminWallet    from './SuperAdminWallet';
import Messaging            from './Messaging';
import Verification         from './Verification';
import Submissions          from './Submissions';
import AssignUsers          from './AssignUsers';
import NotificationBell     from './NotificationBell';
import AvatarDropdown       from './AvatarDropdown';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const stored   = localStorage.getItem('user');
  const user     = stored ? JSON.parse(stored) : null;

  const [activeModule, setActiveModule] = useState('overview');
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [greeting,     setGreeting]     = useState('Welcome');

  useEffect(() => {
    if (!user) navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    if (localStorage.getItem('hasVisitedDashboard')) {
      setGreeting('Welcome back');
    } else {
      setGreeting('Welcome');
      localStorage.setItem('hasVisitedDashboard','true');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const renderModule = () => {
    switch (activeModule) {
      case 'overview':      return <SuperAdminOverview />;
      case 'account-settings':       return <SuperAdminAccountSettings />;
      case 'stock':         return <SuperAdminStockPickups />;
      case 'product':       return <Product />;
      case 'manage-orders': return <SuperAdminManageOrders />;
      case 'wallet':        return <SuperAdminWallet />;
      case 'messages':      return <Messaging />;
      case 'verification':  return <Verification />;
      case 'submissions':   return <Submissions />;
      case 'assign':        return <AssignUsers />;
      default:              return <SuperAdminOverview />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Mobile Header */}
      <header className="md:hidden h-16 flex items-center justify-between px-4 border-b border-gray-200 bg-white">
        <button onClick={() => setSidebarOpen(o => !o)} className="p-2">
          {sidebarOpen ? <X size={20}/> : <Menu size={20}/>}
        </button>
        <h2 className="font-bold text-lg">Vistapro</h2>
        <div className="flex items-center gap-4">
          <NotificationBell />
          <AvatarDropdown
            user={user}
            onLogout={handleLogout}
            onNavigate={setActiveModule}
          />
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'block' : 'hidden'} md:block w-64 bg-white border-r border-gray-200`}>
          <div className="p-4 text-center font-bold text-xl border-b border-gray-200">
            Vistapro
          </div>
          <nav className="p-3">
            <ul className="space-y-2 text-sm">
              <SidebarItem label="Overview"      Icon={Home}          moduleName="overview"      {...{activeModule,setActiveModule,setSidebarOpen}}/>
              <SidebarItem label="Profile"       Icon={User}          moduleName="profile"       {...{activeModule,setActiveModule,setSidebarOpen}}/>
              <SidebarItem label="Stock"         Icon={Package}       moduleName="stock"         {...{activeModule,setActiveModule,setSidebarOpen}}/>
              <SidebarItem label="Products"      Icon={ShoppingCart}  moduleName="product"       {...{activeModule,setActiveModule,setSidebarOpen}}/>
              <SidebarItem label="Manage Orders" Icon={ClipboardList} moduleName="manage-orders" {...{activeModule,setActiveModule,setSidebarOpen}}/>
              <SidebarItem
                label="Wallet"
                Icon={() => <span className="text-xl">₦</span>}
                moduleName="wallet"
                {...{activeModule,setActiveModule,setSidebarOpen}}
              />
              <SidebarItem label="Messages"     Icon={MessageSquare} moduleName="messages"      {...{activeModule,setActiveModule,setSidebarOpen}}/>
              <SidebarItem label="Verification" Icon={CheckCircle}   moduleName="verification"  {...{activeModule,setActiveModule,setSidebarOpen}}/>
              <SidebarItem label="Submissions"  Icon={FilePlus}      moduleName="submissions"   {...{activeModule,setActiveModule,setSidebarOpen}}/>
              <SidebarItem label="Assign"       Icon={UserPlus}      moduleName="assign"        {...{activeModule,setActiveModule,setSidebarOpen}}/>
              <li>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100"
                >
                  <LogOut size={16}/> Logout
                </button>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Desktop Header */}
          <header className="hidden md:flex h-16 items-center justify-between px-6 border-b border-gray-200 bg-white">
            <div>
              <h2 className="text-xl font-bold">
                {greeting}, {user ? `${user.first_name} ${user.last_name}` : 'Super Admin'}!
              </h2>
              {user?.unique_id && (
                <p className="text-sm text-gray-500">ID: {user.unique_id}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <AvatarDropdown
                user={user}
                onLogout={handleLogout}
                onNavigate={setActiveModule}
              />
            </div>
          </header>

          {/* Rendered Module */}
          <main className="flex-1 overflow-auto p-6 bg-gray-50">
            {renderModule()}
          </main>
        </div>
      </div>
    </div>
  );
}

// Sidebar item helper
function SidebarItem({
  label,
  Icon,
  moduleName,
  activeModule,
  setActiveModule,
  setSidebarOpen
}) {
  const isActive = activeModule === moduleName;
  const onClick = () => {
    setActiveModule(moduleName);
    setSidebarOpen(false);
  };
  return (
    <li>
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded transition ${
          isActive ? 'bg-blue-100 font-semibold' : 'hover:bg-gray-100'
        }`}
      >
        {Icon && <Icon size={16}/>}
        <span>{label}</span>
      </button>
    </li>
  );
}
