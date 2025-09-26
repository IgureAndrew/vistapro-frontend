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
  Download
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const MarketerOverview = ({ onNavigate, isDarkMode = false }) => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    verificationStatus: "pending",
    totalPickups: 0,
    totalOrders: 0,
    walletBalance: 0,
    pendingOrders: 0,
    completedOrders: 0,
    monthlyEarnings: 0,
    weeklyEarnings: 0
  });

  useEffect(() => {
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

  // TODO: Replace with real API call to fetch recent activities
  const recentActivities = [];

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
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user?.first_name || 'Marketer'}!
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Here's what's happening with your account today.
            </p>
          </div>
          <div className="hidden md:block">
            <Badge className={verificationStatus.color}>
              <StatusIcon className="h-4 w-4 mr-1" />
              {verificationStatus.text}
            </Badge>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verification Status</CardTitle>
            <StatusIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{verificationStatus.text}</div>
            <p className="text-xs text-muted-foreground">
              {stats.verificationStatus === "approved" ? "Account verified" : "Verification required"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Pickups</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPickups}</div>
            <p className="text-xs text-muted-foreground">
              Total pickups this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Orders placed this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
            <WalletIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.walletBalance)}</div>
            <p className="text-xs text-muted-foreground">
              Available balance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
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
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            View All
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            {recentActivities.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentActivities.map((activity) => {
                  const ActivityIcon = getActivityIcon(activity.type);
                  return (
                    <div key={activity.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${getActivityColor(activity.status)}`}>
                          <ActivityIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            {activity.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">No Recent Activity</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Your recent activities will appear here once you start using the platform.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Overview</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly Earnings</CardTitle>
              <CardDescription>Your earnings for this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(stats.monthlyEarnings)}
              </div>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400 mr-1" />
                <span className="text-sm text-green-600 dark:text-green-400">
                  +12% from last month
                </span>
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
