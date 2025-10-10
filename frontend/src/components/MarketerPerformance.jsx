// src/components/MarketerPerformance.jsx
import React, { useState, useEffect, useMemo } from "react";
import { 
  ShoppingCart,
  Clock,
  BarChart2,
  Wallet,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Calendar,
  Filter,
  CheckCircle
} from "lucide-react";
import api from "../api";

export default function MarketerPerformance({ onNavigate }) {
  const stored = localStorage.getItem("user");
  const currentUser = stored ? JSON.parse(stored) : {};
  const marketerId = currentUser.unique_id || "";

  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSales: 0,
    pendingOrders: 0,
    wallet: 0,
    completedOrders: 0,
    monthlyEarnings: 0,
    weeklyEarnings: 0
  });
  const [dateFilter, setDateFilter] = useState("Last 30 Days");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        
        // Fetch orders history
        const { data: orderData } = await api.get("/marketer/orders/history", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const fetched = orderData.orders || [];
        setOrders(fetched);

        // Calculate stats
        const derived = fetched.reduce((acc, o) => {
          acc.totalOrders++;
          acc.totalSales += Number(o.sold_amount) || 0;
          if (o.status === "pending") acc.pendingOrders++;
          if (o.status === "completed") acc.completedOrders++;
          return acc;
        }, { totalOrders: 0, totalSales: 0, pendingOrders: 0, completedOrders: 0 });

        // Fetch wallet
        const { data: walletData } = await api.get("/wallets", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setStats({
          ...derived,
          wallet: Number(walletData.wallet.available_balance) || 0,
          monthlyEarnings: derived.totalSales * 0.4, // Assuming 40% commission
          weeklyEarnings: derived.totalSales * 0.4 * 0.25 // Weekly estimate
        });
      } catch (err) {
        console.error("Error loading performance data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter orders by date
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
      if (dateFilter === "Last 3 Months") {
        return d >= new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      }
      return true;
    });
  }, [orders, dateFilter]);

  // Calculate trends (mock data for now)
  const trends = {
    orders: { value: 12, direction: "up" },
    sales: { value: 8, direction: "up" },
    wallet: { value: 15, direction: "up" },
    pending: { value: 5, direction: "down" }
  };

  const performanceCards = [
    {
      icon: <ShoppingCart className="w-6 h-6" />,
      label: "Total Orders",
      value: stats.totalOrders,
      change: `+${trends.orders.value}%`,
      trend: trends.orders.direction,
      description: "All time orders",
      color: "blue"
    },
    {
      icon: CheckCircle,
      label: "Completed Orders",
      value: stats.completedOrders,
      change: `+${trends.orders.value}%`,
      trend: trends.orders.direction,
      description: "Successfully delivered",
      color: "green"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      label: "Pending Orders",
      value: stats.pendingOrders,
      change: `${trends.pending.direction === 'up' ? '+' : ''}${trends.pending.value}%`,
      trend: trends.pending.direction,
      description: "Awaiting confirmation",
      color: "orange"
    },
    {
      icon: <BarChart2 className="w-6 h-6" />,
      label: "Total Sales",
      value: `₦${stats.totalSales.toLocaleString()}`,
      change: `+${trends.sales.value}%`,
      trend: trends.sales.direction,
      description: "Revenue generated",
      color: "purple"
    },
    {
      icon: <Wallet className="w-6 h-6" />,
      label: "Wallet Balance",
      value: `₦${stats.wallet.toLocaleString()}`,
      change: `+${trends.wallet.value}%`,
      trend: trends.wallet.direction,
      description: "Available for withdrawal",
      color: "indigo"
    },
    {
      icon: <Target className="w-6 h-6" />,
      label: "Monthly Earnings",
      value: `₦${stats.monthlyEarnings.toLocaleString()}`,
      change: `+${trends.sales.value}%`,
      trend: trends.sales.direction,
      description: "This month's commission",
      color: "emerald"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f59e0b]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-black">Performance Analytics</h1>
            <p className="text-sm text-black/60 mt-1">Track your sales performance and earnings</p>
          </div>
          <button
            onClick={() => onNavigate('overview')}
            className="w-10 h-10 bg-black rounded-full flex items-center justify-center"
          >
            <span className="text-white text-sm font-bold">←</span>
          </button>
        </div>

        {/* Date Filter */}
        <div className="flex items-center space-x-3">
          <Filter className="w-4 h-4 text-black/60" />
          <select
            className="border border-black/10 bg-white text-black rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
          >
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="Last 3 Months">Last 3 Months</option>
            <option value="All Time">All Time</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-24 space-y-6">

        {/* Performance Cards */}
        <div className="grid grid-cols-1 gap-4">
          {performanceCards.map((card, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-lg border border-black/5 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-black/5 rounded-xl flex items-center justify-center">
                    <div className="text-black">
                      {card.icon}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-black mb-1">
                      {card.label}
                    </h3>
                    <p className="text-xs text-black/60">
                      {card.description}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-black mb-1">
                    {card.value}
                  </div>
                  <div className="flex items-center space-x-1">
                    {card.trend === 'up' ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-xs font-semibold ${
                      card.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {card.change}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order History */}
        <div className="bg-white rounded-2xl shadow-lg border border-black/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-black">Order History</h2>
            <span className="text-sm text-black/60">{filteredOrders.length} orders</span>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredOrders.length > 0 ? filteredOrders.map(o => (
              <div key={o.id} className="flex items-start space-x-3 py-3 border-b border-black/5 last:border-b-0">
                <div className="w-10 h-10 bg-black/5 rounded-full flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="w-5 h-5 text-[#f59e0b]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold text-black truncate">{o.device_name} {o.device_model}</h4>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      o.status === "completed" ? "bg-green-100 text-green-800" :
                      o.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {o.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs text-black/60 mb-2">{o.device_type}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-xs text-black/60">₦{Number(o.sold_amount).toLocaleString()}</span>
                      <span className="text-xs text-black/60">{o.bnpl_platform || "No BNPL"}</span>
                    </div>
                    <span className="text-xs text-black/60">
                      {new Date(o.sale_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <BarChart2 className="w-12 h-12 text-black/40 mx-auto mb-3" />
                <p className="text-sm text-black/60">No orders found for this period</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onNavigate('order')}
            className="bg-[#f59e0b] text-white rounded-2xl p-4 text-center hover:bg-[#f59e0b]/90 transition-colors"
          >
            <ShoppingCart className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm font-semibold">New Order</span>
          </button>
          <button
            onClick={() => onNavigate('wallet')}
            className="bg-black text-white rounded-2xl p-4 text-center hover:bg-black/90 transition-colors"
          >
            <Wallet className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm font-semibold">View Wallet</span>
          </button>
        </div>
      </div>
    </div>
  );
}
