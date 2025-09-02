// src/components/MasterAdminOverview.jsx
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
} from "lucide-react";
import api from "../api";

export default function MasterAdminOverview() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    previousTotalUsers: 0,
    totalPendingOrders: 0,
    previousPendingOrders: 0,
    totalConfirmedOrders: 0,
    previousConfirmedOrders: 0,
    totalSales: 0,
    previousSales: 0,
    totalAvailableProducts: 0,
    previousAvailableProducts: 0,
    pendingVerification: 0,
    previousPendingVerification: 0,
    totalPickupStocks: 0,
    previousPickupStocks: 0,
  });
  const [dateFilter, setDateFilter] = useState("All Time");
  const [recentActivity, setRecentActivity] = useState([]);

  // Helper to compute percentage change
  const computeChange = (current, previous) => {
    if (previous === 0) return { text: "N/A", color: "text-gray-500" };
    const pct = ((current - previous) / previous) * 100;
    const sign = pct > 0 ? "+" : "";
    return {
      text: `${sign}${pct.toFixed(1)}%`,
      color: pct > 0 ? "text-green-600" : pct < 0 ? "text-red-600" : "text-gray-600",
    };
  };

  // 1) subscribe to real-time updates
  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL, { transports: ["websocket"] });

    socket.on("real-time-stats", (data) => {
      // assume server pushes the same shape as our /stats endpoint
      setStats(data);
    });

    return () => socket.disconnect();
  }, []);

  // 2) fetch initial stats
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await api.get("/master-admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
          params: { period: dateFilter }
        });
        setStats(data);
      } catch (err) {
        console.error("Failed to load master-admin stats:", err);
      }
    })();
  }, [dateFilter]);

  // 3) fetch recent activity
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await api.get("/master-admin/recent-activity", {
          headers: { Authorization: `Bearer ${token}` },
          params: { period: dateFilter },
        });
        
        // Process the simplified backend data to create descriptions
        const processedActivities = (data.activities || []).map(activity => ({
          ...activity,
          description: generateActivityDescription(activity)
        }));
        
        setRecentActivity(processedActivities);
      } catch (err) {
        console.error("Failed to load recent activity:", err);
      }
    })();
  }, [dateFilter]);

  // Helper function to generate activity descriptions from simplified backend data
  const generateActivityDescription = (activity) => {
    const { activity_type, entity_type, entity_unique_id } = activity;
    
    switch (activity_type) {
      case 'Create User':
        return `Created ${entity_type} ${entity_unique_id}`;
      case 'Update User':
        return `Updated ${entity_type} ${entity_unique_id}`;
      case 'Delete User':
        return `Deleted ${entity_type} ${entity_unique_id}`;
      case 'Lock User':
        return `Locked ${entity_type} ${entity_unique_id}`;
      case 'Unlock User':
        return `Unlocked ${entity_type} ${entity_unique_id}`;
      case 'Assign Marketers to Admin':
        return `Assigned marketers to Admin ${entity_unique_id}`;
      case 'Assign Admins to Super Admin':
        return `Assigned admins to Super Admin ${entity_unique_id}`;
      case 'Unassign Marketers from Admin':
        return `Unassigned marketers from Admin ${entity_unique_id}`;
      case 'Unassign Admins from Super Admin':
        return `Unassigned admins from Super Admin ${entity_unique_id}`;
      case 'Update Profile':
        return `Updated profile`;
      case 'Register Master Admin':
        return `Registered new Master Admin ${entity_unique_id}`;
      case 'Register Super Admin':
        return `Registered new Super Admin ${entity_unique_id}`;
      default:
        return `${activity_type} ${entity_type} ${entity_unique_id}`;
    }
  };

  // Helper function to safely format activity dates
  const formatActivityDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  // build our cards array, injecting computed change text + color
  const cards = useMemo(() => [
    {
      icon: <User size={20} />,
      label: "Total Users",
      value: stats.totalUsers,
      ...computeChange(stats.totalUsers, stats.previousTotalUsers),
    },
    {
      icon: <Clock size={20} />,
      label: "Pending Orders",
      value: stats.totalPendingOrders,
      ...computeChange(stats.totalPendingOrders, stats.previousPendingOrders),
    },
    {
      icon: <CheckCircle size={20} />,
      label: "Confirmed Orders",
      value: stats.totalConfirmedOrders,
      ...computeChange(stats.totalConfirmedOrders, stats.previousConfirmedOrders),
    },
    {
      icon: <BarChart2 size={20} />,
      label: "Total Sales",
      value: `₦${stats.totalSales.toLocaleString()}`,
      ...computeChange(stats.totalSales, stats.previousSales),
    },
    {
      icon: <Box size={20} />,
      label: "Available Products",
      value: stats.totalAvailableProducts,
      ...computeChange(stats.totalAvailableProducts, stats.previousAvailableProducts),
    },
    {
      icon: <ClipboardList size={20} />,
      label: "Pending Verification",
      value: stats.pendingVerification,
      ...computeChange(stats.pendingVerification, stats.previousPendingVerification),
    },
    {
      icon: <Package size={20} />,
      label: "Pickup Stocks",
      value: stats.totalPickupStocks,
      ...computeChange(stats.totalPickupStocks, stats.previousPickupStocks),
    },
  ], [stats]);

  return (
    <div className="p-6 space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cards.map(({ icon, label, value, text: change, color: changeColor }, i) => (
          <div key={i} className="bg-white p-5 rounded-lg shadow flex flex-col justify-between">
            <div className="flex justify-between items-start">
              {icon}
              <MoreVertical size={16} className="text-gray-400 cursor-pointer" />
            </div>
            <div className="mt-4">
              <h3 className="text-sm text-gray-500">{label}</h3>
              <p className="mt-2 text-2xl font-bold">{value}</p>
            </div>
            <p className={`mt-3 text-xs font-medium ${changeColor}`}>{change}</p>
            <p className="text-xs text-gray-400">from last period</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent Activity 📋</h2>
        <div className="flex items-center gap-3">
          <select
            className="border rounded px-3 py-1 text-sm"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            {["All Time", "Last 7 Days", "Last 30 Days"].map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </select>
          <button className="bg-[#f59e0b] text-black px-4 py-1 rounded text-sm hover:brightness-95">
            Go to Approvals
          </button>
          <button className="bg-purple-600 text-white px-4 py-1 rounded text-sm hover:bg-purple-700">
            Download Report
          </button>
        </div>
      </div>

      {/* Recent Activity List */}
      <div className="bg-white rounded-lg shadow p-6">
        {recentActivity.length > 0 ? (
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                {/* Activity Icon */}
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                
                {/* Activity Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.description}
                  </p>
                  <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {activity.actor_name}
                    </span>
                    <span className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatActivityDate(activity.created_at)}
                    </span>
                  </div>
                </div>
                
                {/* Activity Type Badge */}
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {activity.activity_type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by performing some administrative actions.</p>
          </div>
        )}
      </div>
    </div>
  );
}
