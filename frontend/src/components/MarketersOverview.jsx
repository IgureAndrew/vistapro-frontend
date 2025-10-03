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

  const activityData = [
    { id: 1, text: 'Order #5678 completed', time: '2 hours ago', icon: CheckCircle },
    { id: 2, text: 'Commission earned: ₦2,400', time: '4 hours ago', icon: Wallet },
    { id: 3, text: 'New order placed', time: '6 hours ago', icon: ShoppingCart }
  ];

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
