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
  Crown,
} from "lucide-react";
import api from "../api";
import { WelcomeSection } from "./common/WelcomeSection";
import { MetricCard } from "./common/MetricCard";
import { SectionHeader } from "./common/SectionHeader";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";

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
  const [productActivities, setProductActivities] = useState([]);
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
          params: { 
            period: periodParam,
            _t: Date.now() // Cache busting
          }
        });
        
        console.log('🔍 Dashboard API Response:', data);
        console.log('📊 Total Users from API:', data.totalUsers);
        
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
          description: generateActivityDescription(activity),
          timestamp: activity.created_at // Map created_at to timestamp for consistency
        }));
        
        setRecentActivity(processedActivities);
      } catch (err) {
        console.error("Failed to load recent activity:", err);
      }
    })();
  }, [dateFilter]);

  // 4) fetch product activities
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await api.get("/products/recent-activities", {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 5 },
        });
        
        setProductActivities(data.activities || []);
      } catch (err) {
        console.error("Failed to load product activities:", err);
      }
    })();
  }, []);

  // Helper functions for product activities
  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getProductActivityIcon = (actionType) => {
    switch (actionType) {
      case 'created': return <Package className="h-4 w-4 text-green-600" />;
      case 'updated': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'deleted': return <MoreVertical className="h-4 w-4 text-red-600" />;
      case 'quantity_added': return <ArrowUpRight className="h-4 w-4 text-green-600" />;
      case 'quantity_removed': return <ArrowDownRight className="h-4 w-4 text-orange-600" />;
      default: return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const getProductActivityColor = (actionType) => {
    switch (actionType) {
      case 'created': return 'bg-green-100 text-green-800';
      case 'updated': return 'bg-blue-100 text-blue-800';
      case 'deleted': return 'bg-red-100 text-red-800';
      case 'quantity_added': return 'bg-green-100 text-green-800';
      case 'quantity_removed': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to generate activity descriptions from simplified backend data
  const generateActivityDescription = (activity) => {
    const { activity_type, entity_type, entity_unique_id, actor_name, entity_display_name } = activity;
    
    // Use entity_display_name if available (includes user's full name), otherwise use entity_unique_id
    const displayName = entity_display_name || entity_unique_id;
    const actor = actor_name || 'System';
    
    switch (activity_type) {
      case 'Create User':
        return `${actor} created ${entity_type} ${displayName}`;
      case 'Update User':
        return `${actor} updated ${entity_type} ${displayName}`;
      case 'Delete User':
        return `${actor} deleted ${entity_type} ${displayName}`;
      case 'Lock User':
        return `${actor} locked ${entity_type} ${displayName}`;
      case 'Unlock User':
        return `${actor} unlocked ${entity_type} ${displayName}`;
      case 'Assign Marketers to Admin':
        return `${actor} assigned marketers to Admin ${displayName}`;
      case 'Assign Admins to Super Admin':
        return `${actor} assigned admins to Super Admin ${displayName}`;
      case 'Unassign Marketers from Admin':
        return `${actor} unassigned marketers from Admin ${displayName}`;
      case 'Unassign Admins from Super Admin':
        return `${actor} unassigned admins from Super Admin ${displayName}`;
      case 'Update Profile':
        return `${actor} updated profile`;
      case 'Register Master Admin':
        return `${actor} registered new Master Admin ${displayName}`;
      case 'Register Super Admin':
        return `${actor} registered new Super Admin ${displayName}`;
      default:
        return `${actor} performed ${activity_type} on ${entity_type} ${displayName}`;
    }
  };

  // Helper function to safely format activity dates
  const formatActivityDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);
      
      // Show relative time for recent activities
      if (diffInSeconds < 60) {
        return 'Just now';
      } else if (diffInSeconds < 3600) {
        return `${Math.floor(diffInSeconds / 60)}m ago`;
      } else if (diffInSeconds < 86400) {
        return `${Math.floor(diffInSeconds / 3600)}h ago`;
      } else if (diffInSeconds < 604800) { // 7 days
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
      } else {
        // For older activities, show full date and time
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
      }
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
        ...computeChange(stats.totalUsers, stats.previousTotalUsers, cardIcons[0]),
      },
      {
        icon: cardIcons[1],
        label: "Pending Orders",
        value: formatNumber(stats.totalPendingOrders),
        rawValue: stats.totalPendingOrders,
        iconBg: "bg-gray-100",
        iconColor: "text-gray-600",
        ...computeChange(stats.totalPendingOrders, stats.previousPendingOrders, cardIcons[1]),
      },
      {
        icon: cardIcons[2],
        label: "Confirmed Orders",
        value: formatNumber(stats.totalConfirmedOrders),
        rawValue: stats.totalConfirmedOrders,
        iconBg: "bg-gray-100",
        iconColor: "text-gray-600",
        ...computeChange(stats.totalConfirmedOrders, stats.previousConfirmedOrders, cardIcons[2]),
      },
      {
        icon: cardIcons[3],
        label: "Total Sales",
        value: formatCurrency(stats.totalSales),
        rawValue: stats.totalSales,
        iconBg: "bg-gray-100",
        iconColor: "text-gray-600",
        ...computeChange(stats.totalSales, stats.previousSales, cardIcons[3]),
      },
      {
        icon: cardIcons[4],
        label: "Available Products",
        value: formatNumber(stats.totalAvailableProducts),
        rawValue: stats.totalAvailableProducts,
        iconBg: "bg-gray-100",
        iconColor: "text-gray-600",
        ...computeChange(stats.totalAvailableProducts, stats.previousAvailableProducts, cardIcons[4]),
      },
      {
        icon: cardIcons[5],
        label: "Pending Verification",
        value: formatNumber(stats.pendingVerification),
        rawValue: stats.pendingVerification,
        iconBg: "bg-gray-100",
        iconColor: "text-gray-600",
        ...computeChange(stats.pendingVerification, stats.previousPendingVerification, cardIcons[5]),
      },
      {
        icon: cardIcons[6],
        label: "Pickup Stocks",
        value: formatNumber(stats.totalPickupStocks),
        rawValue: stats.totalPickupStocks,
        iconBg: "bg-gray-100",
        iconColor: "text-gray-600",
        ...computeChange(stats.totalPickupStocks, stats.previousPickupStocks, cardIcons[6]),
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

  // Prepare data for MobileDashboard
  const metrics = {
    totalUsers: stats.totalUsers,
    totalOrders: stats.totalConfirmedOrders + stats.totalPendingOrders,
    totalSales: stats.totalSales,
    systemHealth: 98
  };

  const quickActions = [
    { key: 'manage-users', label: 'Manage Users', icon: User, action: () => onNavigate('users') },
    { key: 'approve-orders', label: 'Approve Orders', icon: CheckCircle, action: () => onNavigate('manage-orders') },
    { key: 'view-reports', label: 'View Reports', icon: BarChart2, action: () => onNavigate('performance') },
    { key: 'manage-products', label: 'Manage Products', icon: Package, action: () => onNavigate('product') }
  ];

  const activityData = recentActivity.map(activity => ({
    id: activity.id,
    text: activity.description,
    time: formatActivityDate(activity.timestamp),
    icon: ClipboardList
  }));

  if (isLoading) {
    return (
      <div className="w-full space-y-4 sm:space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      {/* Welcome Section */}
      <WelcomeSection
        title="Master Admin Dashboard"
        subtitle="Oversee all operations and manage the entire platform"
        gradientFrom="from-orange-50"
        gradientTo="to-amber-50"
        badge={
          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
            <Crown className="h-4 w-4 mr-1" />
            Master Admin
          </Badge>
        }
      />

      {/* Key Metrics */}
      <div>
        <SectionHeader title="Platform Overview" subtitle="Key metrics across the entire system" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <MetricCard
            label="Total Users"
            value={cards[0].value}
            description={`${cards[0].rawValue.toLocaleString()} users registered`}
            icon={User}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
            change={cards[0].text}
            changeType={cards[0].trend === 'up' ? 'increase' : cards[0].trend === 'down' ? 'decrease' : undefined}
          />
          <MetricCard
            label="Pending Orders"
            value={cards[1].value}
            description={`${cards[1].rawValue.toLocaleString()} awaiting approval`}
            icon={Clock}
            iconColor="text-yellow-600"
            iconBgColor="bg-yellow-100"
            change={cards[1].text}
            changeType={cards[1].trend === 'up' ? 'increase' : cards[1].trend === 'down' ? 'decrease' : undefined}
          />
          <MetricCard
            label="Confirmed Orders"
            value={cards[2].value}
            description={`${cards[2].rawValue.toLocaleString()} orders completed`}
            icon={CheckCircle}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
            change={cards[2].text}
            changeType={cards[2].trend === 'up' ? 'increase' : cards[2].trend === 'down' ? 'decrease' : undefined}
          />
          <MetricCard
            label="Total Sales"
            value={cards[3].value}
            description="Revenue generated"
            icon={BarChart2}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
            change={cards[3].text}
            changeType={cards[3].trend === 'up' ? 'increase' : cards[3].trend === 'down' ? 'decrease' : undefined}
          />
        </div>
      </div>

      {/* Operational Metrics */}
      <div>
        <SectionHeader title="Operational Metrics" subtitle="System-wide operational statistics" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <MetricCard
            label="Available Products"
            value={cards[4].value}
            description={`${cards[4].rawValue.toLocaleString()} products in stock`}
            icon={Box}
            iconColor="text-indigo-600"
            iconBgColor="bg-indigo-100"
            change={cards[4].text}
            changeType={cards[4].trend === 'up' ? 'increase' : cards[4].trend === 'down' ? 'decrease' : undefined}
          />
          <MetricCard
            label="Pending Verification"
            value={cards[5].value}
            description={`${cards[5].rawValue.toLocaleString()} awaiting review`}
            icon={ClipboardList}
            iconColor="text-orange-600"
            iconBgColor="bg-orange-100"
            change={cards[5].text}
            changeType={cards[5].trend === 'up' ? 'increase' : cards[5].trend === 'down' ? 'decrease' : undefined}
          />
          <MetricCard
            label="Pickup Stocks"
            value={cards[6].value}
            description={`${cards[6].rawValue.toLocaleString()} stock pickups`}
            icon={Package}
            iconColor="text-teal-600"
            iconBgColor="bg-teal-100"
            change={cards[6].text}
            changeType={cards[6].trend === 'up' ? 'increase' : cards[6].trend === 'down' ? 'decrease' : undefined}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <SectionHeader title="Recent Activity" subtitle="Latest system actions and events" />
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No recent activity</p>
            ) : (
              recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{activity.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatActivityDate(activity.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Product Activities */}
      {productActivities.length > 0 && (
        <div>
          <SectionHeader title="Recent Product Activities" subtitle="Latest product management actions" />
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="space-y-3">
              {productActivities.map((activity, index) => (
                <div key={activity.id || index} className="flex items-start space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <div className="flex-shrink-0 mt-1">
                    {getProductActivityIcon(activity.action_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getProductActivityColor(activity.action_type)}`}>
                        {activity.action_type.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimeAgo(activity.created_at)}</span>
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                      {activity.actor_name} ({activity.actor_role})
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {activity.description}
                    </p>
                    {activity.device_name && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Product: {activity.device_name} {activity.device_model} ({activity.device_type})
                      </p>
                    )}
                    {activity.quantity_change !== 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Quantity: {activity.quantity_change > 0 ? '+' : ''}{activity.quantity_change}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
