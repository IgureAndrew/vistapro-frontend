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

// Import reusable components
import { MetricCard } from "./common/MetricCard";
import { WelcomeSection } from "./common/WelcomeSection";
import { SectionHeader } from "./common/SectionHeader";

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

  // Prepare data for MobileDashboard
  const metrics = {
    walletBalance: stats.wallet,
    totalOrders: stats.totalOrders,
    totalSales: stats.totalSales,
    stockCount: stats.stockCount || 0
  };

  const quickActions = [
    { key: 'new-order', label: 'New Order', icon: ShoppingCart, action: () => onNavigate('orders') },
    { key: 'stock-mgmt', label: 'Stock Mgmt', icon: MoreVertical, action: () => onNavigate('stock') }
  ];

  const activityData = [
    { id: 1, text: 'Order #3456 confirmed', time: '2 hours ago', icon: ShoppingCart },
    { id: 2, text: 'Stock level updated', time: '4 hours ago', icon: MoreVertical },
    { id: 3, text: 'Commission earned', time: '6 hours ago', icon: Wallet }
  ];

  if (isLoading) {
  return (
      <div className="w-full space-y-4 sm:space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      {/* Welcome Section */}
      <WelcomeSection
        title={`Welcome back, ${dealerName}!`}
        subtitle={`Dealer ID: ${dealerId}`}
        gradientFrom="from-orange-50"
        gradientTo="to-amber-50"
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <MetricCard
          label="Total Orders"
          value={stats.totalOrders}
          description="All time orders"
          icon={ShoppingCart}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />

        <MetricCard
          label="Total Sales"
          value={`₦${stats.totalSales.toLocaleString()}`}
          description="Revenue generated"
          icon={BarChart2}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />

        <MetricCard
          label="Pending Orders"
          value={stats.pendingOrders}
          description="Awaiting action"
          icon={Clock}
          iconColor="text-orange-600"
          iconBgColor="bg-orange-100"
        />

        <MetricCard
          label="Wallet Balance"
          value={`₦${stats.wallet.toLocaleString()}`}
          description="Available funds"
          icon={Wallet}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
      </div>

      {/* Recent Orders by Date Filter */}
      <div>
        <SectionHeader 
          title="Recent Orders"
          action={
          <div className="flex space-x-2">
            {["Today", "This Week", "This Month", "All Time"].map((filter) => (
            <button
                key={filter}
                onClick={() => setDateFilter(filter)}
                className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-colors ${
                  dateFilter === filter
                    ? "bg-orange-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {filter}
            </button>
          ))}
          </div>
          }
        />

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm sm:text-base">No orders found for this period</p>
          </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Date</th>
            </tr>
          </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredOrders.slice(0, 10).map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">#{order.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 hidden sm:table-cell">{order.customer_name}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">₦{order.sold_amount?.toLocaleString() || 0}</td>
                      <td className="px-4 py-3 text-sm hidden md:table-cell">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {order.status}
                    </span>
                  </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                        {new Date(order.created_at).toLocaleDateString()}
                </td>
              </tr>
                  ))}
          </tbody>
        </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
