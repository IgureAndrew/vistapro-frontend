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
  Activity,
  TrendingUp,
  Users,
  ChevronRight,
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
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
        setIsLoading(true);
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

        // fetch recent activities
        const { data: activitiesData } = await api.get("/marketer/recent-activities?limit=5", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRecentActivity(activitiesData.activities || []);
        
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setIsLoading(false);
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

  // Prepare data for MobileDashboard
  const metrics = {
    walletBalance: stats.wallet,
    totalOrders: stats.totalOrders,
    totalSales: stats.totalSales,
    pendingOrders: stats.pendingOrders
  };

  const quickActions = [
    { key: 'new-order', label: 'New Order', icon: ShoppingCart, action: () => onNavigate('orders') },
    { key: 'stock-pickup', label: 'Stock Pickup', icon: Package, action: () => onNavigate('stock-pickup') }
  ];

  // Helper function to get activity icon
  const getActivityIcon = (type) => {
    switch (type) {
      case 'stock_pickup': return Package;
      case 'order_placed': return ShoppingCart;
      case 'stock_return': return Package;
      case 'stock_transfer': return Package;
      default: return Activity;
    }
  };

  // Helper function to format time ago
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
      case 'released_confirmed':
      case 'sold':
        return 'text-green-600';
      case 'pending':
      case 'pending_order':
        return 'text-yellow-600';
      case 'returned':
      case 'transfer_approved':
        return 'text-blue-600';
      case 'canceled':
      case 'transfer_rejected':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Transform real activity data
  const activityData = recentActivity.map(activity => {
    const IconComponent = getActivityIcon(activity.type);
    return {
      id: activity.id,
      text: activity.description,
      time: formatTimeAgo(activity.timestamp),
      icon: IconComponent,
      status: activity.status,
      statusColor: getStatusColor(activity.status),
      device: activity.device_name + ' ' + activity.device_model,
      quantity: activity.quantity,
      type: activity.type
    };
  });

  if (isLoading) {
  return (
      <div className="mobile-app">
        <div className="mobile-content">
          <div className="mobile-loading">
            <div className="mobile-skeleton" style={{ height: '200px', marginBottom: '24px' }}></div>
            <div className="mobile-grid mobile-grid-2x2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="mobile-skeleton" style={{ height: '120px' }}></div>
              ))}
              </div>
            </div>
          </div>
        </div>
    );
  }

  return (
    <MobileDashboard
      userRole="marketer"
      user={{ first_name: marketerName, last_name: "Marketer" }}
      metrics={metrics}
      recentActivity={activityData}
      quickActions={quickActions}
    />
  );
}
