// src/components/DealerOverview.jsx
import React, { useEffect, useState, useMemo } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Clock,
  BarChart2,
  Wallet,
  MoreVertical
} from "lucide-react";
import api from "../api";

export default function DealerOverview({ onNavigate, isDarkMode = false }) {
  const navigate   = useNavigate();
  const storedUser = localStorage.getItem("user");
  const dealer     = storedUser ? JSON.parse(storedUser) : {};
  const dealerName = dealer.first_name
    ? `${dealer.first_name} ${dealer.last_name}`
    : dealer.name || "You";
  const dealerId   = dealer.unique_id || "";

  // All orders (or stock‐pickup requests) fetched/pushed
  const [orders, setOrders] = useState([]);

  // Dashboard stats
  const [stats, setStats] = useState({
    totalOrders:    0,
    totalSales:     0,
    pendingOrders:  0,
    wallet:         0,  // you can repurpose this to "Total Commission" or whatever
  });

  // Date filter
  const [dateFilter, setDateFilter] = useState("All Time");

  // 1) Real‐time socket listener for any new dealer‐order events
  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL, { transports: ["websocket"] });
    socket.on("new-dealer-order", newOrder => {
      if (newOrder.dealer_unique_id === dealerId) {
        const amount = Number(newOrder.sold_amount) || 0;
        setOrders(prev => [newOrder, ...prev]);
        setStats(prev => ({
          totalOrders:    prev.totalOrders + 1,
          totalSales:     prev.totalSales + amount,
          pendingOrders:  prev.pendingOrders + (newOrder.status === "pending" ? 1 : 0),
          wallet:         prev.wallet
        }));
      }
    });
    return () => socket.disconnect();
  }, [dealerId]);

  // 2) Initial fetch of dealer’s orders + wallet (commission) balance
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");

        // a) Fetch dealer orders
        const { data: orderData } = await api.get("/dealer/orders", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const fetched = orderData.orders || [];
        setOrders(fetched);

        // derive summary stats
        const derived = fetched.reduce(
          (acc, o) => {
            acc.totalOrders++;
            acc.totalSales += Number(o.sold_amount) || 0;
            if (o.status === "pending") acc.pendingOrders++;
            return acc;
          },
          { totalOrders: 0, totalSales: 0, pendingOrders: 0 }
        );
        setStats({ ...derived, wallet: 0 });

        // b) Fetch dealer’s wallet/commission
        const { data: walletData } = await api.get("/wallets", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(prev => ({
          ...prev,
          wallet: walletData.available_balance ?? 0
        }));
      } catch (err) {
        console.error("Error loading dealer overview:", err);
      }
    })();
  }, []);

  // 3) Filter by date
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
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-amber-100 dark:border-amber-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back, {dealerName}! 🏪
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Track your orders and manage your commission earnings
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-bold">
                {dealerName.charAt(0).toUpperCase()}
              </span>
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
            change: "+5%",
            changeColor: "text-green-600",
            bgColor: "bg-green-50",
            iconBg: "bg-green-100"
          },
          {
            icon: <Clock className="w-6 h-6" />,
            label: "Pending Orders",
            value: stats.pendingOrders,
            change: "+8%",
            changeColor: "text-red-600",
            bgColor: "bg-red-50",
            iconBg: "bg-red-100"
          },
          {
            icon: <BarChart2 className="w-6 h-6" />,
            label: "Total Sales",
            value: `₦${stats.totalSales.toLocaleString()}`,
            change: "+8%",
            changeColor: "text-blue-600",
            bgColor: "bg-blue-50",
            iconBg: "bg-blue-100"
          },
          {
            icon: <Wallet className="w-6 h-6" />,
            label: "Available Commission",
            value: `₦${stats.wallet.toLocaleString()}`,
            change: "+12%",
            changeColor: "text-purple-600",
            bgColor: "bg-purple-50",
            iconBg: "bg-purple-100"
          },
        ].map((card, i) => (
          <div key={i} className={`${card.bgColor} dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.iconBg} dark:bg-gray-700 p-3 rounded-lg`}>
                <div className={`${card.changeColor} dark:text-gray-300`}>{card.icon}</div>
              </div>
              <MoreVertical className="text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300" size={20} />
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{card.label}</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{card.value}</p>
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${card.changeColor}`}>{card.change}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">vs last period</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: <ShoppingCart className="w-5 h-5" />, label: "View Orders", action: () => onNavigate('manage-orders') },
            { icon: <BarChart2 className="w-5 h-5" />, label: "Sales Report", action: () => onNavigate('performance') },
            { icon: <Wallet className="w-5 h-5" />, label: "Check Commission", action: () => onNavigate('wallet') },
            { icon: <Clock className="w-5 h-5" />, label: "Pending Orders", action: () => onNavigate('manage-orders') },
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

      {/* Recent Activity Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <BarChart2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Your latest orders and commissions</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
          >
            {["All Time", "Last 7 Days", "Last 30 Days"].map(opt => (
              <option key={opt}>{opt}</option>
            ))}
          </select>
          <button
            onClick={() => navigate("/manage-orders/orders")}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            New Order
          </button>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {[
                "Dealer Name",
                "Unique ID",
                "Device Name",
                "Model",
                "Type",
                "Price",
                "Platform",
                "Status"
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
            {filteredOrders.length > 0 ? (
              filteredOrders.map(o => (
                <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{dealerName}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{dealerId}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{o.device_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{o.device_model}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{o.device_type}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">₦{Number(o.sold_amount).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{o.bnpl_platform || "N/A"}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        o.status === "completed"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                          : o.status === "pending"
                          ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
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
