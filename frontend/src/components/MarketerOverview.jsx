import React, { useState, useEffect } from "react";
import { 
  CheckCircle, 
  Package, 
  ShoppingCart, 
  Wallet as WalletIcon, 
  TrendingUp, 
  Clock,
  AlertCircle,
  BarChart3,
  Activity,
  DollarSign,
  Target,
  ArrowUpRight,
  Eye,
  Download,
  ChevronRight,
  Calendar,
  Filter,
  X
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import api from "../api";

// Import reusable components
import { MetricCard } from "./common/MetricCard";
import { WelcomeSection } from "./common/WelcomeSection";
import { SectionHeader } from "./common/SectionHeader";

const MarketerOverview = ({ onNavigate, isDarkMode = false }) => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    verificationStatus: "pending",
    totalPickups: 0,
    totalOrders: 0,
    walletBalance: 0,
    pendingOrders: 0,
    completedOrders: 0,
    weeklyCommission: 0,
    lastWeekCommission: 0,
    confirmedOrdersThisWeek: 0,
    confirmedDevicesThisWeek: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  
  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);
  const [dateFilter, setDateFilter] = useState({
    startDate: null,
    endDate: null
  });
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [filteredActivities, setFilteredActivities] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      // 1. Load user from localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setStats(prev => ({
          ...prev,
          verificationStatus: parsedUser.overall_verification_status || "pending"
        }));
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }

      // 2. Fetch orders from API
      let orders = [];
      try {
        const token = localStorage.getItem("token");
        
        const { data: orderData } = await api.get("/marketer/orders/history", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        orders = orderData.orders || [];
        
        // Filter for confirmed orders only
        const confirmedOrders = orders.filter(order => 
          order.status === "released_confirmed"
        );
        
        // Calculate stats from all orders
        const orderStats = orders.reduce((acc, order) => {
          acc.totalOrders++;
          if (order.status === "pending") acc.pendingOrders++;
          if (order.status === "completed" || order.status === "released_confirmed") {
            acc.completedOrders++;
          }
          return acc;
        }, { totalOrders: 0, pendingOrders: 0, completedOrders: 0 });
        
        // Calculate weekly commission
        const { weekStart, weekEnd } = getCurrentWeekRange();
        const { weekStart: lastWeekStart, weekEnd: lastWeekEnd } = getLastWeekRange();
        
        const weeklyCommission = calculateWeeklyCommission(confirmedOrders, weekStart, weekEnd);
        const lastWeekCommission = calculateWeeklyCommission(confirmedOrders, lastWeekStart, lastWeekEnd);
        
        // Calculate device counts for this week
        const thisWeekOrders = confirmedOrders.filter(order => {
          const orderDate = new Date(order.sale_date);
          return orderDate >= weekStart && orderDate <= weekEnd;
        });
        
        const confirmedOrdersThisWeek = thisWeekOrders.length;
        const confirmedDevicesThisWeek = thisWeekOrders.reduce((total, order) => {
          return total + (Number(order.number_of_devices) || 1);
        }, 0);
        
        setStats(prev => ({
          ...prev,
          ...orderStats,
          weeklyCommission,
          lastWeekCommission,
          confirmedOrdersThisWeek,
          confirmedDevicesThisWeek
        }));
      } catch (err) {
        console.error("Error loading orders:", err);
      }

      // 3. Fetch wallet balance from API
      try {
        const token = localStorage.getItem("token");
        
        const { data: walletData } = await api.get("/wallets", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        setStats(prev => ({
          ...prev,
          walletBalance: Number(walletData.wallet?.available_balance) || 0
        }));
      } catch (err) {
        console.error("Error loading wallet:", err);
      }

      // 4. Fetch stock pickups from API
      try {
        const token = localStorage.getItem("token");
        
        const { data: stockData } = await api.get("/stock/marketer", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const pickups = stockData.data || [];
        
        setStats(prev => ({
          ...prev,
          totalPickups: pickups.length
        }));
        
        // Create recent activities from stock pickups and orders
        const activities = [];
        
        // Add stock activities (most recent 5)
        pickups.slice(0, 5).forEach(item => {
          activities.push({
            id: `stock-${item.id}`,
            type: 'stock',
            title: item.status === 'sold' ? 'Stock sold' : 
                   item.status === 'returned' ? 'Stock returned' :
                   item.status === 'expired' ? 'Stock expired' : 'Stock pickup',
            description: `Product #${item.product_id}`,
            timestamp: item.updated_at || item.pickup_date,
            status: item.status
          });
        });
        
        // Add order activities (most recent 5)
        orders.slice(0, 5).forEach(order => {
          activities.push({
            id: `order-${order.id}`,
            type: 'order',
            title: 'Order placed',
            description: `${order.customer_name} - ${formatCurrency(order.sold_amount)}`,
            timestamp: order.created_at || order.sale_date,
            status: order.status
          });
        });
        
        // Sort by timestamp (newest first)
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setRecentActivities(activities);
        
        // Initialize filtered activities
        setFilteredActivities(activities);
      } catch (err) {
        console.error("Error loading stock pickups:", err);
      }
    };

    loadDashboardData();
  }, []);

  const getVerificationStatus = () => {
    const status = stats.verificationStatus;
    switch (status) {
      case "approved":
        return { 
          text: "Approved", 
          color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
          icon: CheckCircle
        };
      case "pending":
        return { 
          text: "Pending Review", 
          color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
          icon: Clock
        };
      case "rejected":
        return { 
          text: "Rejected", 
          color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
          icon: AlertCircle
        };
      default:
        return { 
          text: "Not Started", 
          color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
          icon: AlertCircle
        };
    }
  };

  const verificationStatus = getVerificationStatus();
  const StatusIcon = verificationStatus.icon;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Format timestamp to relative time
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Recently';
    
    const now = new Date();
    const activityDate = new Date(timestamp);
    const diffInSeconds = Math.floor((now - activityDate) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return activityDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Get current week range (Monday to Sunday)
  const getCurrentWeekRange = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Handle Sunday
    
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + daysToMonday);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    return { weekStart, weekEnd };
  };

  // Get last week range
  const getLastWeekRange = () => {
    const { weekStart } = getCurrentWeekRange();
    const lastWeekEnd = new Date(weekStart);
    lastWeekEnd.setMilliseconds(lastWeekEnd.getMilliseconds() - 1);
    
    const lastWeekStart = new Date(lastWeekEnd);
    lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
    lastWeekStart.setHours(0, 0, 0, 0);
    
    return { weekStart: lastWeekStart, weekEnd: lastWeekEnd };
  };

  // Get commission rate based on device type
  const getCommissionRate = (deviceType) => {
    const rates = {
      'android': 10000,  // ₦10,000 per Android device
      'ios': 15000       // ₦15,000 per iOS device
    };
    return rates[deviceType?.toLowerCase()] || 10000; // Default to Android rate
  };

  // Calculate commission for a given week
  const calculateWeeklyCommission = (confirmedOrders, weekStart, weekEnd) => {
    return confirmedOrders
      .filter(order => {
        const orderDate = new Date(order.sale_date);
        return orderDate >= weekStart && orderDate <= weekEnd;
      })
      .reduce((total, order) => {
        // Use earnings field if available, otherwise calculate from device type and quantity
        const commission = order.earnings 
          ? Number(order.earnings)
          : (Number(order.number_of_devices) || 1) * getCommissionRate(order.device_type);
        return total + commission;
      }, 0);
  };

  // Get commission trend text
  const getCommissionTrend = (currentWeek, lastWeek) => {
    if (lastWeek === 0) {
      return currentWeek > 0 ? 'New this week' : 'No commission yet';
    }
    
    const percentage = Math.round(((currentWeek - lastWeek) / lastWeek) * 100);
    const direction = percentage >= 0 ? '+' : '';
    return `${direction}${percentage}% from last week`;
  };

  // Get status badge for activities
  const getStatusBadge = (type, status) => {
    if (type === 'stock') {
      if (status === 'sold') return { text: 'Sold', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' };
      if (status === 'returned') return { text: 'Returned', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' };
      if (status === 'expired') return { text: 'Expired', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' };
      if (status === 'pending') return { text: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' };
    }
    if (type === 'order') {
      if (status === 'released_confirmed') return { text: 'Completed', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' };
      if (status === 'pending') return { text: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' };
      if (status === 'cancelled') return { text: 'Cancelled', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' };
    }
    return { text: status || 'Active', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' };
  };

  // Get icon background color
  const getIconBackground = (type, status) => {
    if (type === 'stock') {
      if (status === 'sold') return 'bg-green-50 dark:bg-green-900/20';
      if (status === 'returned') return 'bg-blue-50 dark:bg-blue-900/20';
      if (status === 'expired') return 'bg-red-50 dark:bg-red-900/20';
      return 'bg-purple-50 dark:bg-purple-900/20';
    }
    if (type === 'order') {
      if (status === 'released_confirmed') return 'bg-green-50 dark:bg-green-900/20';
      if (status === 'cancelled') return 'bg-gray-50 dark:bg-gray-900/20';
      return 'bg-orange-50 dark:bg-orange-900/20';
    }
    return 'bg-gray-50 dark:bg-gray-900/20';
  };

  // Get icon color
  const getIconColor = (type, status) => {
    if (type === 'stock') {
      if (status === 'sold') return 'text-green-600 dark:text-green-400';
      if (status === 'returned') return 'text-blue-600 dark:text-blue-400';
      if (status === 'expired') return 'text-red-600 dark:text-red-400';
      return 'text-purple-600 dark:text-purple-400';
    }
    if (type === 'order') {
      if (status === 'released_confirmed') return 'text-green-600 dark:text-green-400';
      if (status === 'cancelled') return 'text-gray-600 dark:text-gray-400';
      return 'text-orange-600 dark:text-orange-400';
    }
    return 'text-gray-600 dark:text-gray-400';
  };

  // Handle activity click
  const handleActivityClick = (activity) => {
    if (activity.type === 'order') {
      onNavigate('order');
    } else if (activity.type === 'stock') {
      onNavigate('stock-pickup');
    }
  };

  // Filter activities by date
  const filterActivitiesByDate = (activities, startDate, endDate) => {
    if (!startDate && !endDate) return activities;
    
    return activities.filter(activity => {
      const activityDate = new Date(activity.timestamp);
      if (startDate && activityDate < startDate) return false;
      if (endDate && activityDate > endDate) return false;
      return true;
    });
  };

  // Get paginated activities
  const getPaginatedActivities = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredActivities.slice(startIndex, endIndex);
  };

  // Get total pages
  const totalPages = Math.ceil(filteredActivities.length / pageSize);

  // Quick filter handlers
  const handleQuickFilter = (filterType) => {
    const now = new Date();
    let startDate = null;
    let endDate = null;

    switch (filterType) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'thisWeek':
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        startDate = new Date(now);
        startDate.setDate(now.getDate() + daysToMonday);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'last7Days':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'last30Days':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        startDate = null;
        endDate = null;
    }

    setDateFilter({ startDate, endDate });
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Clear date filter
  const clearDateFilter = () => {
    setDateFilter({ startDate: null, endDate: null });
    setCurrentPage(1);
  };

  // Apply date filter
  const applyDateFilter = () => {
    const filtered = filterActivitiesByDate(recentActivities, dateFilter.startDate, dateFilter.endDate);
    setFilteredActivities(filtered);
    setCurrentPage(1);
    setShowDateFilter(false);
  };

  const quickActions = [
    {
      title: "Complete Verification",
      description: "Submit required documents for account verification",
      icon: CheckCircle,
      color: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      action: () => onNavigate('verification')
    },
    {
      title: "Request Stock Pickup",
      description: "Request stock items for your marketing activities",
      icon: Package,
      color: "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400",
      action: () => onNavigate('stock-pickup')
    },
    {
      title: "Place Order",
      description: "Create new orders for your customers",
      icon: ShoppingCart,
      color: "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
      action: () => onNavigate('order')
    },
    {
      title: "View Wallet",
      description: "Check your earnings and transaction history",
      icon: WalletIcon,
      color: "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
      action: () => onNavigate('wallet')
    }
  ];

  // Recent activities loaded from stock pickups and orders

  const getActivityIcon = (type) => {
    switch (type) {
      case "verification":
        return CheckCircle;
      case "stock":
        return Package;
      case "order":
        return ShoppingCart;
      case "payment":
        return DollarSign;
      default:
        return Activity;
    }
  };

  const getActivityColor = (status) => {
    switch (status) {
      case "success":
        return "text-green-600 dark:text-green-400";
      case "pending":
        return "text-yellow-600 dark:text-yellow-400";
      case "error":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-blue-600 dark:text-blue-400";
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Section */}
      <WelcomeSection
        title={`Welcome back, ${user?.first_name || 'Marketer'}!`}
        subtitle="Here's what's happening with your account today."
        gradientFrom="from-blue-50"
        gradientTo="to-indigo-50"
        badge={
            <Badge className={verificationStatus.color}>
              <StatusIcon className="h-4 w-4 mr-1" />
              {verificationStatus.text}
            </Badge>
        }
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <MetricCard
          label="Verification Status"
          value={verificationStatus.text}
          description={stats.verificationStatus === "approved" ? "Account verified" : "Verification required"}
          icon={StatusIcon}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />

        <MetricCard
          label="Stock Pickups"
          value={stats.totalPickups}
          description="Total pickups this month"
          icon={Package}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />

        <MetricCard
          label="Total Orders"
          value={stats.totalOrders}
          description="Orders placed this month"
          icon={ShoppingCart}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />

        <MetricCard
          label="Wallet Balance"
          value={formatCurrency(stats.walletBalance)}
          description="Available balance"
          icon={WalletIcon}
          iconColor="text-orange-600"
          iconBgColor="bg-orange-100"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <SectionHeader title="Quick Actions" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card 
                key={index} 
                className="cursor-pointer hover:shadow-md transition-shadow hover:border-blue-200 dark:hover:border-blue-800"
                onClick={action.action}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${action.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {action.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {action.description}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowDateFilter(!showDateFilter)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
          </div>
        </div>

        {/* Date Filter Panel */}
        {showDateFilter && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Filter by Date</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowDateFilter(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Date
                    </label>
                    <DatePicker
                      selected={dateFilter.startDate}
                      onChange={(date) => setDateFilter(prev => ({ ...prev, startDate: date }))}
                      dateFormat="dd MMM yyyy"
                      placeholderText="Select start date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Date
                    </label>
                    <DatePicker
                      selected={dateFilter.endDate}
                      onChange={(date) => setDateFilter(prev => ({ ...prev, endDate: date }))}
                      dateFormat="dd MMM yyyy"
                      placeholderText="Select end date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
                
                {/* Quick Filters */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quick Filters
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleQuickFilter('today')}
                    >
                      Today
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleQuickFilter('thisWeek')}
                    >
                      This Week
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleQuickFilter('thisMonth')}
                    >
                      This Month
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleQuickFilter('last7Days')}
                    >
                      Last 7 Days
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleQuickFilter('last30Days')}
                    >
                      Last 30 Days
                    </Button>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearDateFilter}
                  >
                    Clear Filter
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={applyDateFilter}
                  >
                    Apply Filter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-0">
            {getPaginatedActivities().length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {getPaginatedActivities().map((activity) => {
                  const ActivityIcon = getActivityIcon(activity.type);
                  const statusBadge = getStatusBadge(activity.type, activity.status);
                  
                  return (
                    <div 
                      key={activity.id} 
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                      onClick={() => handleActivityClick(activity)}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Icon with dynamic background */}
                        <div className={`p-2.5 rounded-lg ${getIconBackground(activity.type, activity.status)}`}>
                          <ActivityIcon className={`h-5 w-5 ${getIconColor(activity.type, activity.status)}`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          {/* Title and Badge */}
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                              {activity.title}
                            </h3>
                            <Badge variant="secondary" className={`text-xs px-2 py-0.5 ${statusBadge.color} border-0`}>
                              {statusBadge.text}
                            </Badge>
                          </div>
                          
                          {/* Description */}
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {activity.description}
                          </p>
                          
                          {/* Timestamp */}
                          <div className="flex items-center mt-2 space-x-1">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatTimeAgo(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                        
                        {/* Arrow indicator */}
                        <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {filteredActivities.length === 0 && recentActivities.length > 0 
                    ? 'No activities match your filter'
                    : 'No Recent Activity'
                  }
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {filteredActivities.length === 0 && recentActivities.length > 0
                    ? 'Try adjusting your date filter to see more activities.'
                    : 'Your recent activities will appear here once you start using the platform.'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredActivities.length)} of {filteredActivities.length} activities
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="cursor-pointer"
                  />
                </PaginationItem>
                
                {/* Page Numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <PaginationItem key={pageNum}>
                      <Button
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="cursor-pointer"
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Performance Overview */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Overview</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Weekly Commission</CardTitle>
              <CardDescription>Your commission from confirmed Android/iOS devices this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(stats.weeklyCommission)}
              </div>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400 mr-1" />
                <span className="text-sm text-green-600 dark:text-green-400">
                  {getCommissionTrend(stats.weeklyCommission, stats.lastWeekCommission)}
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {stats.confirmedDevicesThisWeek} confirmed device{stats.confirmedDevicesThisWeek !== 1 ? 's' : ''} this week
                {stats.confirmedOrdersThisWeek > 0 && (
                  <span className="ml-2">
                    ({stats.confirmedOrdersThisWeek} order{stats.confirmedOrdersThisWeek !== 1 ? 's' : ''})
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Status</CardTitle>
              <CardDescription>Current order breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
                  <span className="text-sm font-medium">{stats.completedOrders}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Pending</span>
                  <span className="text-sm font-medium">{stats.pendingOrders}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ 
                      width: `${stats.totalOrders > 0 ? (stats.completedOrders / stats.totalOrders) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MarketerOverview;
