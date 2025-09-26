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
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import api from "../api";

export default function MasterAdminOverview({ onNavigate, isDarkMode = false }) {
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
  const [dateFilter, setDateFilter] = useState("Last 30 Days");
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Helper to compute percentage change with better formatting
  const computeChange = (current, previous, cardIcon) => {
    if (previous === 0 || previous === null || previous === undefined) {
      return { 
        text: "New", 
        color: "text-gray-600",
        bgColor: "bg-gray-100",
        icon: React.cloneElement(cardIcon, { size: 12 }),
        trend: "new"
      };
    }
    
    const pct = ((current - previous) / previous) * 100;
    const sign = pct > 0 ? "+" : "";
    const absPct = Math.abs(pct);
    
    let color, bgColor, trend;
    
    if (pct > 0) {
      color = "text-gray-600";
      bgColor = "bg-gray-100";
      trend = "up";
    } else if (pct < 0) {
      color = "text-gray-600";
      bgColor = "bg-gray-100";
      trend = "down";
    } else {
      color = "text-gray-600";
      bgColor = "bg-gray-100";
      trend = "neutral";
    }
    
    return {
      text: `${sign}${absPct.toFixed(1)}%`,
      color,
      bgColor,
      icon: React.cloneElement(cardIcon, { size: 12 }),
      trend
    };
  };

  // Helper to format large numbers
  const formatNumber = (num) => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B';
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Helper to format currency
  const formatCurrency = (amount) => {
    if (amount >= 1000000000) {
      return `₦${(amount / 1000000000).toFixed(1)}B`;
    } else if (amount >= 1000000) {
      return `₦${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `₦${(amount / 1000).toFixed(1)}K`;
    }
    return `₦${amount.toLocaleString()}`;
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
        setIsLoading(true);
        const token = localStorage.getItem("token");
        
        // Convert dateFilter to period parameter
        const periodParam = dateFilter === 'All Time' ? '30d' : 
                           dateFilter === 'Last 7 Days' ? '7d' :
                           dateFilter === 'Last 30 Days' ? '30d' :
                           dateFilter === 'Last 90 Days' ? '90d' : '30d';
        
        const { data } = await api.get("/master-admin/dashboard-summary", {
          headers: { Authorization: `Bearer ${token}` },
          params: { period: periodParam }
        });
        setStats(data);
        setLastUpdated(new Date());
      } catch (err) {
        console.error("Failed to load master-admin stats:", err);
      } finally {
        setIsLoading(false);
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

  // build our cards array with enhanced styling and data
  const cards = useMemo(() => {
    const cardIcons = [
      <User size={24} />,
      <Clock size={24} />,
      <CheckCircle size={24} />,
      <BarChart2 size={24} />,
      <Box size={24} />,
      <ClipboardList size={24} />,
      <Package size={24} />
    ];

    return [
      {
        icon: cardIcons[0],
        label: "Total Users",
        value: formatNumber(stats.totalUsers),
        rawValue: stats.totalUsers,
        iconBg: "bg-gray-100",
        iconColor: "text-gray-600",
        ...computeChange(stats.currentPeriodUsers || stats.totalUsers, stats.previousTotalUsers, cardIcons[0]),
      },
      {
        icon: cardIcons[1],
        label: "Pending Orders",
        value: formatNumber(stats.totalPendingOrders),
        rawValue: stats.totalPendingOrders,
        iconBg: "bg-gray-100",
        iconColor: "text-gray-600",
        ...computeChange(stats.currentPeriodPendingOrders || stats.totalPendingOrders, stats.previousPendingOrders, cardIcons[1]),
      },
      {
        icon: cardIcons[2],
        label: "Confirmed Orders",
        value: formatNumber(stats.totalConfirmedOrders),
        rawValue: stats.totalConfirmedOrders,
        iconBg: "bg-gray-100",
        iconColor: "text-gray-600",
        ...computeChange(stats.currentPeriodConfirmedOrders || stats.totalConfirmedOrders, stats.previousConfirmedOrders, cardIcons[2]),
      },
      {
        icon: cardIcons[3],
        label: "Total Sales",
        value: formatCurrency(stats.totalSales),
        rawValue: stats.totalSales,
        iconBg: "bg-gray-100",
        iconColor: "text-gray-600",
        ...computeChange(stats.currentPeriodSales || stats.totalSales, stats.previousSales, cardIcons[3]),
      },
      {
        icon: cardIcons[4],
        label: "Available Products",
        value: formatNumber(stats.totalAvailableProducts),
        rawValue: stats.totalAvailableProducts,
        iconBg: "bg-gray-100",
        iconColor: "text-gray-600",
        ...computeChange(stats.currentPeriodAvailableProducts || stats.totalAvailableProducts, stats.previousAvailableProducts, cardIcons[4]),
      },
      {
        icon: cardIcons[5],
        label: "Pending Verification",
        value: formatNumber(stats.pendingVerification),
        rawValue: stats.pendingVerification,
        iconBg: "bg-gray-100",
        iconColor: "text-gray-600",
        ...computeChange(stats.currentPeriodPendingVerification || stats.pendingVerification, stats.previousPendingVerification, cardIcons[5]),
      },
      {
        icon: cardIcons[6],
        label: "Pickup Stocks",
        value: formatNumber(stats.totalPickupStocks),
        rawValue: stats.totalPickupStocks,
        iconBg: "bg-gray-100",
        iconColor: "text-gray-600",
        ...computeChange(stats.currentPeriodPickupStocks || stats.totalPickupStocks, stats.previousPickupStocks, cardIcons[6]),
      },
    ];
  }, [stats]);

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 animate-pulse">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="px-4 py-6 md:px-6 lg:px-12 space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-indigo-100 dark:border-indigo-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Master Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Complete system oversight and management control
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-bold">M</span>
            </div>
          </div>
        </div>
      </div>

      {/* Last Updated Indicator */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#f59e0b' }}></div>
          <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="text-sm text-[#f59e0b] hover:text-[#d97706] transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Enhanced Stat Cards */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cards.map(({ 
          icon, 
          label, 
          value, 
          rawValue,
          iconBg,
          iconColor,
          text: change, 
          color: changeColor,
          bgColor: changeBgColor,
          icon: trendIcon,
          trend
        }, i) => (
          <div 
            key={i} 
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200"
          >
            {/* Header with icon and menu */}
            <div className="flex justify-between items-start mb-4">
              <div className={`${iconBg} dark:bg-gray-700 p-3 rounded-lg`}>
                <div className={`${iconColor} dark:text-gray-300`}>
                  {icon}
                </div>
              </div>
              <MoreVertical size={16} className="text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
            </div>
            
            {/* Content */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">{label}</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
              
              {/* Trend indicator */}
              <div className="flex items-center space-x-2">
                <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${changeBgColor} ${changeColor}`}>
                  {trendIcon}
                  <span className="ml-1">{change}</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">from last period</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: <User className="w-5 h-5" />, label: "Manage Users", action: () => onNavigate('users') },
            { icon: <CheckCircle className="w-5 h-5" />, label: "Approve Orders", action: () => onNavigate('manage-orders') },
            { icon: <BarChart2 className="w-5 h-5" />, label: "View Reports", action: () => onNavigate('performance') },
            { icon: <Package className="w-5 h-5" />, label: "Manage Products", action: () => onNavigate('product') },
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
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <ClipboardList size={20} className="text-gray-600 dark:text-gray-300" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Latest system activities and updates</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent transition-all"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            {["Last 7 Days", "Last 30 Days", "Last 90 Days"].map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </select>
          <button className="bg-[#f59e0b] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#d97706] transition-colors flex items-center space-x-2">
            <ArrowUpRight size={16} />
            <span>Go to Approvals</span>
          </button>
          <button className="bg-[#f59e0b] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#d97706] transition-colors flex items-center space-x-2">
            <ArrowDownRight size={16} />
            <span>Download Report</span>
          </button>
        </div>
      </div>

      {/* Recent Activity List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {recentActivity.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {recentActivity.map((activity, index) => (
              <div key={activity.id} className="group p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200">
                <div className="flex items-start space-x-4">
                  {/* Activity Icon */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: '#f59e0b' }}>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  
                  {/* Activity Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-[#f59e0b] transition-colors">
                          {activity.description}
                        </p>
                        <div className="mt-2 flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="font-medium">{activity.actor_name}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{formatActivityDate(activity.created_at)}</span>
                          </span>
                        </div>
                      </div>
                      
                      {/* Activity Type Badge */}
                      <div className="flex-shrink-0 ml-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600">
                          {activity.activity_type}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <ClipboardList size={32} className="text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No recent activity</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              Get started by performing some administrative actions. Your recent activities will appear here.
            </p>
            <button className="mt-4 bg-[#f59e0b] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#d97706] transition-colors">
              Start Managing
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
