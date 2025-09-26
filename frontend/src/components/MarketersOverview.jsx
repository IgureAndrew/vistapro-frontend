// src/components/MarketersOverview.jsx
import React, { useEffect, useState, useMemo } from "react";
import { io } from "socket.io-client";
import {
  ShoppingCart,
  Clock,
  BarChart2,
  Wallet,
  MoreVertical,
  CheckCircle,
  Package,
} from "lucide-react";
import api from "../api";
import VerificationProgress from "./VerificationProgress";
import VerificationNotifications from "./VerificationNotifications";

export default function MarketersOverview({ onNavigate }) {
  const stored      = localStorage.getItem("user");
  const currentUser = stored ? JSON.parse(stored) : {};
  const marketerName = currentUser.first_name
    ? `${currentUser.first_name} ${currentUser.last_name}`
    : currentUser.name || "You";
  const marketerId = currentUser.unique_id || "";
  const isVerified = currentUser?.overall_verification_status === "approved";

  const [orders, setOrders] = useState([]);
  const [stats, setStats]   = useState({
    totalOrders:   0,
    totalSales:    0,
    pendingOrders: 0,
    wallet:        0,
  });
  const [dateFilter, setDateFilter] = useState("All Time");

  // ── Live socket updates ────────────────────────────────────────
  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL, { transports: ["websocket"] });
    socket.on("new-order", newOrder => {
      if (newOrder.marketer_unique_id === marketerId) {
        const amt = Number(newOrder.sold_amount) || 0;
        setOrders(prev => [newOrder, ...prev]);
        setStats(prev => ({
          ...prev,
          totalOrders:   prev.totalOrders + 1,
          totalSales:    prev.totalSales + amt,
          pendingOrders: prev.pendingOrders + (newOrder.status === "pending" ? 1 : 0),
        }));
      }
    });
    return () => socket.disconnect();
  }, [marketerId]);

  // ── Initial fetch ─────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        // fetch orders history
        const { data: orderData } = await api.get("/marketer/orders/history", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const fetched = orderData.orders || [];
        setOrders(fetched);

        // derive stats
        const derived = fetched.reduce((acc, o) => {
          acc.totalOrders++;
          acc.totalSales += Number(o.sold_amount) || 0;
          if (o.status === "pending") acc.pendingOrders++;
          return acc;
        }, { totalOrders: 0, totalSales: 0, pendingOrders: 0 });
        setStats({ ...derived, wallet: 0 });

        // fetch wallet
        const { data: walletData } = await api.get("/wallets", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(prev => ({
          ...prev,
          wallet: Number(walletData.wallet.available_balance) || 0,
        }));
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      }
    })();
  }, []);

  // ── Filter orders by date ────────────────────────────────────
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter(o => {
      const d = new Date(o.sale_date);
      if (dateFilter === "Last 7 Days") {
        return d >= new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      }
      if (dateFilter === "Last 30 Days") {
        return d >= new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
      }
      return true;
    });
  }, [orders, dateFilter]);

  return (
    <div className="px-4 py-6 md:px-6 lg:px-12 space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back, {marketerName}! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Here's what's happening with your sales today
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <VerificationNotifications 
              userRole="Marketer"
              userId={marketerId}
              onNotificationClick={(notification) => {
                console.log('Notification clicked:', notification);
                // Handle notification click - could navigate to verification page
                if (notification.type === 'verification_reminder' || notification.type === 'verification_update') {
                  onNavigate('verification');
                }
              }}
            />
            <div className="hidden md:block">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {marketerName.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            icon: <ShoppingCart className="w-6 h-6" />, 
            label: "Total Orders",   
            value: stats.totalOrders,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
            iconBg: "bg-blue-100"
          },
          { 
            icon: <Clock className="w-6 h-6" />,        
            label: "Pending Orders", 
            value: stats.pendingOrders,
            color: "text-orange-600",
            bgColor: "bg-orange-50",
            iconBg: "bg-orange-100"
          },
          {
            icon: <BarChart2 className="w-6 h-6" />,
            label: "Total Sales",
            value: `₦${stats.totalSales.toLocaleString()}`,
            color: "text-green-600",
            bgColor: "bg-green-50",
            iconBg: "bg-green-100"
          },
          {
            icon: <Wallet className="w-6 h-6" />,
            label: "Wallet Balance",
            value: `₦${stats.wallet.toLocaleString()}`,
            color: "text-purple-600",
            bgColor: "bg-purple-50",
            iconBg: "bg-purple-100"
          },
        ].map(({ icon, label, value, color, bgColor, iconBg }, idx) => (
          <div
            key={idx}
            className={`${bgColor} dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${iconBg} dark:bg-gray-700 p-3 rounded-lg`}>
                <div className={`${color} dark:text-gray-300`}>{icon}</div>
              </div>
              <MoreVertical className="text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300" size={20} />
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{label}</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: <ShoppingCart className="w-5 h-5" />, label: "New Order", action: () => onNavigate('order') },
            { icon: <CheckCircle className="w-5 h-5" />, label: "Verification Status", action: () => onNavigate('verification') },
            { icon: <Wallet className="w-5 h-5" />, label: "Check Wallet", action: () => onNavigate('wallet') },
            { icon: <Package className="w-5 h-5" />, label: "Stock Pickup", action: () => onNavigate('stock-pickup') },
          ].map(({ icon, label, action }, idx) => (
            <button
              key={idx}
              onClick={action}
              className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-4 py-3 rounded-lg flex items-center space-x-2 transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-600 text-black dark:text-white cursor-pointer"
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f59e0b';
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '';
                e.target.style.color = '';
              }}
            >
              {icon}
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Verification Progress Widget */}
      {!isVerified && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Verification Progress</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Track your verification status</p>
              </div>
            </div>
          </div>
          <VerificationProgress 
            marketerUniqueId={marketerId} 
            onStatusChange={(data) => {
              // Handle status changes if needed
              console.log('Verification status updated:', data);
            }} 
          />
        </div>
      )}

      {/* Recent Activity Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <BarChart2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Your latest sales and orders</p>
          </div>
        </div>
        <select
          className="w-full sm:w-auto border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
        >
          {["All Time", "Last 7 Days", "Last 30 Days"].map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {/* Mobile List View */}
      <div className="sm:hidden space-y-4">
        {filteredOrders.length > 0 ? filteredOrders.map(o => (
          <div key={o.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{o.device_name} {o.device_model}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{o.device_type}</p>
              </div>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                o.status === "completed"
                  ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                  : o.status === "pending"
                  ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
              }`}>
                {o.status.replace(/_/g, " ")}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Price</span>
                <span className="font-semibold text-gray-900 dark:text-white">₦{Number(o.sold_amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">BNPL</span>
                <span className="text-sm text-gray-900 dark:text-white">{o.bnpl_platform || "No"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Date</span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {new Date(o.sale_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        )) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No orders found</h3>
            <p className="text-gray-500 dark:text-gray-400">Start by creating your first order</p>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {[
                "Marketer","ID","Device","Model","Type","Price","BNPL","Status"
              ].map(hdr => (
                <th
                  key={hdr}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {hdr}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredOrders.length > 0 ? filteredOrders.map(o => (
              <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">{marketerName}</td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{marketerId}</td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white whitespace-nowrap">{o.device_name}</td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{o.device_model}</td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{o.device_type}</td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white text-right">₦{Number(o.sold_amount).toLocaleString()}</td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{o.bnpl_platform || "No"}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                    o.status === "completed"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                      : o.status === "pending"
                      ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                  }`}>
                    {o.status.replace(/_/g, " ")}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                      <ShoppingCart className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No orders found</h3>
                    <p className="text-gray-500 dark:text-gray-400">Start by creating your first order</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
