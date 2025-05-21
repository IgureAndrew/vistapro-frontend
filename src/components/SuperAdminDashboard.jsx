import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  LogOut,
  Home,
  User,
  Package,
  ShoppingCart,
  ClipboardList,
  MessageSquare,
  CheckCircle,
  FilePlus,
  UserPlus
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

  // Define sidebar items
  const sidebarItems = [
    { label: 'Overview', icon: Home,         key: 'overview' },
    { label: 'Profile',  icon: User,         key: 'profile' },
    { label: 'Stock',    icon: Package,      key: 'stock' },
    { label: 'Products', icon: ShoppingCart, key: 'product' },
    { label: 'Orders',   icon: ClipboardList,key: 'manage-orders' },
    { label: 'Wallet',   icon: () => <span className="text-xl">₦</span>, key: 'wallet' },
    { label: 'Messages', icon: MessageSquare,key: 'messages' },
    { label: 'Verify',   icon: CheckCircle,  key: 'verification' },
    { label: 'Subs',     icon: FilePlus,     key: 'submissions' },
    { label: 'Assign',   icon: UserPlus,     key: 'assign' }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-white border-r p-4 flex flex-col transition-transform ease-in-out duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="text-2xl font-bold mb-8 text-center">Vistapro</div>
        <nav className="flex-1 overflow-auto">
          <ul className="space-y-2">
            {sidebarItems.map(({ label, icon: Icon, key }) => (
              <li key={key}>
                <button
                  onClick={() => { setActiveModule(key); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${activeModule===key ? 'bg-blue-100 font-semibold' : 'hover:bg-gray-100'}`}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <button
          onClick={handleLogout}
          className="mt-auto flex items-center gap-2 text-red-600 hover:text-red-800 p-2 rounded-lg"
        >
          <LogOut size={16} /> Logout
        </button>
      </aside>

      <div className="flex-1 flex flex-col ml-0 md:ml-64">
        {/* Header */}
        <header className="flex items-center justify-between h-16 bg-white border-b px-6">
          <div className="flex items-center gap-4 md:hidden">
            <button onClick={() => setSidebarOpen(o => !o)}>
              {sidebarOpen ? <X size={20}/> : <Menu size={20}/>}
            </button>
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{greeting}, {user && `${user.first_name} ${user.last_name}`}!</h1>
            <p className="text-sm text-gray-500">ID: {user?.unique_id}</p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <AvatarDropdown user={user} onLogout={handleLogout} onNavigate={setActiveModule}/>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 overflow-auto p-6">
          {/* Metric Cards (only on overview) */}
          {activeModule === 'overview' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold">--</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-500">Pending Orders</p>
                <p className="text-2xl font-bold">--</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-500">Confirmed Sales</p>
                <p className="text-2xl font-bold">--</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-500">Total Commission</p>
                <p className="text-2xl font-bold">₦--</p>
              </div>
            </div>
          )}

          {/* Content Panel */}
          <div className="bg-white rounded-lg shadow p-6">
            { renderModule() }
          </div>
        </main>
      </div>
    </div>
  );
}
