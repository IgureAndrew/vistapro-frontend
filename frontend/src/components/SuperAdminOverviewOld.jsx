// src/components/SuperAdminOverview.jsx
import React, { useState, useEffect, useMemo } from "react";
import { io } from "socket.io-client";
import {
  User,
  Clock,
  CheckCircle,
  BarChart2,
  Box,
  ClipboardList,
  Package,
  MoreVertical,
  Users,
  Activity,
  Wallet,
  TrendingUp,
  Shield,
  AlertCircle,
} from "lucide-react";
import api from "../api";

export default function SuperAdminOverview({ onNavigate, isDarkMode = false }) {
  const [stats, setStats] = useState({
    // Personal Performance
    personalSales: 0,
    personalOrders: 0,
    personalPickups: 0,
    personalCommission: 0,
    
    // Team Management
    assignedAdmins: 0,
    teamSales: 0,
    teamOrders: 0,
    activeTeamMembers: 0,
    
    // Operational Status
    teamPendingOrders: 0,
    teamStockRequests: 0,
    teamWithdrawals: 0,
    
    // Percentage changes
    personalSalesChange: 0,
    personalOrdersChange: 0,
    personalPickupsChange: 0,
    teamSalesChange: 0,
    teamOrdersChange: 0
  });
  const [dateFilter, setDateFilter] = useState("All Time");
  const [recentActivity, setRecentActivity] = useState([]);
  const [wallet, setWallet] = useState({
    total_balance: 0,
    available_balance: 0,
    withheld_balance: 0,
    breakdown: null
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // compute % change
  const computeChange = (current, previous) => {
    if (previous === 0) return { text: "N/A", color: "text-gray-500" };
    const pct = ((current - previous) / previous) * 100;
    const sign = pct > 0 ? "+" : "";
    return {
      text: `${sign}${pct.toFixed(1)}%`,
      color: pct > 0 ? "text-green-600" : pct < 0 ? "text-red-600" : "text-gray-600",
    };
  };

  // 1) Real-time socket updates
  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL, { transports: ["websocket"] });
    socket.on("superadmin-stats", (data) => {
      setStats(data);
    });
    return () => void socket.disconnect();
  }, []);

  // 2) Initial fetch of stats
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await api.get("/super-admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
          params: { period: dateFilter },
        });
        setStats(data);
      } catch (err) {
        console.error("Failed to load super-admin stats:", err);
      }
    })();
  }, [dateFilter]);

  // 3) Fetch recent activity
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await api.get("/super-admin/recent-activities", {
          headers: { Authorization: `Bearer ${token}` },
          params: { period: dateFilter },
        });
        setRecentActivity(data.activities || []);
      } catch (err) {
        console.error("Failed to load recent activity:", err);
      }
    })();
  }, [dateFilter]);

  // 4) Fetch wallet data
  const fetchWallet = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await api.get("/super-admin/wallet-summary", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWallet(data);
    } catch (err) {
      console.error("Failed to load wallet:", err);
    }
  };

  // 5) Fetch activities data
  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await api.get("/super-admin/recent-activities?limit=5", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActivities(data.activities || []);
    } catch (err) {
      console.error("Failed to load activities:", err);
    }
  };

  // 6) Load all dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchWallet(),
          fetchActivities()
        ]);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  // build cards organized by sections
  const cards = useMemo(
    () => [
      // Personal Performance Section
      {
        Icon: BarChart2,
        label: "My Personal Sales",
        value: `₦${stats.personalSales.toLocaleString()}`,
        change: `${stats.personalSalesChange}% from last month`,
        color: "text-blue-600",
        section: "Personal"
      },
      {
        Icon: ClipboardList,
        label: "My Orders Placed",
        value: stats.personalOrders,
        change: `${stats.personalOrdersChange}% from last month`,
        color: "text-green-600",
        section: "Personal"
      },
      {
        Icon: Package,
        label: "My Stock Pickups",
        value: stats.personalPickups,
        change: `${stats.personalPickupsChange}% from last month`,
        color: "text-purple-600",
        section: "Personal"
      },
      {
        Icon: Wallet,
        label: "My Commission",
        value: `₦${stats.personalCommission.toLocaleString()}`,
        change: `${stats.personalSalesChange}% from last month`,
        color: "text-green-600",
        section: "Personal"
      },
      
      // Team Management Section
      {
        Icon: Users,
        label: "Assigned Admins",
        value: stats.assignedAdmins,
        change: "— from last month",
        color: "text-orange-600",
        section: "Team"
      },
      {
        Icon: BarChart2,
        label: "Team Sales",
        value: `₦${stats.teamSales.toLocaleString()}`,
        change: `${stats.teamSalesChange}% from last month`,
        color: "text-blue-600",
        section: "Team"
      },
      {
        Icon: ClipboardList,
        label: "Team Orders",
        value: stats.teamOrders,
        change: `${stats.teamOrdersChange}% from last month`,
        color: "text-indigo-600",
        section: "Team"
      },
      {
        Icon: Activity,
        label: "Active Team Members",
        value: stats.activeTeamMembers,
        change: "— from last month",
        color: "text-teal-600",
        section: "Team"
      },
      
      // Operational Status Section
      {
        Icon: Clock,
        label: "Team Pending Orders",
        value: stats.teamPendingOrders,
        change: "— from last month",
        color: "text-red-600",
        section: "Operational"
      },
      {
        Icon: Box,
        label: "Team Stock Requests",
        value: stats.teamStockRequests,
        change: "— from last month",
        color: "text-orange-600",
        section: "Operational"
      },
      {
        Icon: Users,
        label: "Team Withdrawals",
        value: stats.teamWithdrawals,
        change: "— from last month",
        color: "text-pink-600",
        section: "Operational"
      }
    ],
    [stats]
  );

  if (loading) {
    return (
      <div className="px-4 py-6 md:px-6 lg:px-12 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 md:px-6 lg:px-12 space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl p-6 border border-purple-100 dark:border-purple-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Super Admin Dashboard 👑
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Oversee all operations and manage system-wide activities
            </p>
            </div>
          <div className="hidden md:block">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-bold">S</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Overview Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          System Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.filter(card => card.section === "System").map(({ Icon, label, value, change, color }, idx) => {
            const colorMap = {
              "text-blue-600": { bgColor: "bg-white", iconBg: "bg-blue-100" },
              "text-green-600": { bgColor: "bg-white", iconBg: "bg-green-100" },
              "text-purple-600": { bgColor: "bg-white", iconBg: "bg-purple-100" },
            };
            const { bgColor, iconBg } = colorMap[color] || { bgColor: "bg-white", iconBg: "bg-gray-100" };
            
            return (
              <div
                key={label}
                className={`${bgColor} dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`${iconBg} dark:bg-gray-700 p-3 rounded-lg`}>
                    <Icon className={`${color} dark:text-gray-300`} size={24} />
                  </div>
                  <MoreVertical className="text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300" size={20} />
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{label}</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{value}</p>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${color}`}>{change}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">from last period</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Management Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-orange-600" />
          Order Management
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.filter(card => card.section === "Orders").map(({ Icon, label, value, change, color }, idx) => {
            const colorMap = {
              "text-orange-600": { bgColor: "bg-white", iconBg: "bg-orange-100" },
              "text-green-600": { bgColor: "bg-white", iconBg: "bg-green-100" },
              "text-cyan-600": { bgColor: "bg-white", iconBg: "bg-cyan-100" },
            };
            const { bgColor, iconBg } = colorMap[color] || { bgColor: "bg-white", iconBg: "bg-gray-100" };
            
            return (
              <div
                key={label}
                className={`${bgColor} dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`${iconBg} dark:bg-gray-700 p-3 rounded-lg`}>
                    <Icon className={`${color} dark:text-gray-300`} size={24} />
                  </div>
                  <MoreVertical className="text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300" size={20} />
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{label}</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{value}</p>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${color}`}>{change}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">from last period</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* System Health Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-red-600" />
          System Health
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.filter(card => card.section === "Health").map(({ Icon, label, value, change, color }, idx) => {
            const colorMap = {
              "text-red-600": { bgColor: "bg-white", iconBg: "bg-red-100" },
              "text-indigo-600": { bgColor: "bg-white", iconBg: "bg-indigo-100" },
              "text-emerald-600": { bgColor: "bg-white", iconBg: "bg-emerald-100" },
            };
            const { bgColor, iconBg } = colorMap[color] || { bgColor: "bg-white", iconBg: "bg-gray-100" };
            
            return (
              <div
                key={label}
                className={`${bgColor} dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`${iconBg} dark:bg-gray-700 p-3 rounded-lg`}>
                    <Icon className={`${color} dark:text-gray-300`} size={24} />
                  </div>
                  <MoreVertical className="text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300" size={20} />
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{label}</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{value}</p>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${color}`}>{change}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">from last period</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: <User className="w-5 h-5" />, label: "Manage Users", action: () => onNavigate('assigned') },
            { icon: <CheckCircle className="w-5 h-5" />, label: "Approve Orders", action: () => onNavigate('manage-orders') },
            { icon: <BarChart2 className="w-5 h-5" />, label: "View Reports", action: () => onNavigate('performance') },
            { icon: <Package className="w-5 h-5" />, label: "Stock Pickups", action: () => onNavigate('stock') },
            { icon: <ClipboardList className="w-5 h-5" />, label: "Place Orders", action: () => onNavigate('order') },
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

      {/* Wallet Summary and Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wallet Summary Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-purple-600" />
            System Wallet Summary
          </h2>
          {wallet.breakdown ? (
            <div className="space-y-4">
              {/* System Revenue */}
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">System Revenue</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Available</p>
                    <p className="text-lg font-bold text-green-600">₦{wallet.breakdown.available?.toLocaleString() || 0}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Withheld</p>
                    <p className="text-lg font-bold text-orange-600">₦{wallet.breakdown.withheld?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </div>
              
              {/* Total Balance */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Total System Balance</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">₦{wallet.total_balance?.toLocaleString() || 0}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Total Balance</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">₦{wallet.total_balance?.toLocaleString() || 0}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Available</p>
                <p className="text-lg font-bold text-green-600">₦{wallet.available_balance?.toLocaleString() || 0}</p>
              </div>
            </div>
          )}
        </div>

        {/* Recent Activities Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            Recent System Activities
          </h2>
          <div className="space-y-3">
            {activities.length > 0 ? (
              activities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No recent activities</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <ClipboardList className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">System-wide activities and updates</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            {["All Time", "Last 7 Days", "Last 30 Days"].map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </select>
          <button className="bg-[#f59e0b] text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#f59e0b]/90 transition-colors">
            Go to Approvals
          </button>
          <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
            Download Report
          </button>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {["Activity", "Entity", "Entity ID", "Performed By", "When"].map(
                (hdr) => (
                  <th
                    key={hdr}
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    {hdr}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {recentActivity.length > 0 ? (
              recentActivity.map((act) => (
                <tr key={act.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {act.activityType}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {act.entityType}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {act.entityId}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {act.actorName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(act.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="px-6 py-12 text-center"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                      <ClipboardList className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No recent activity</h3>
                    <p className="text-gray-500 dark:text-gray-400">System activities will appear here</p>
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
