import React, { useState, useEffect } from "react";
import { 
  Users, 
  Package, 
  TrendingUp, 
  DollarSign, 
  Activity, 
  Settings, 
  BarChart3, 
  Bell, 
  Search,
  Menu,
  X,
  Home,
  User,
  ShoppingCart,
  Wallet,
  Target,
  ArrowUpRight,
  ChevronDown,
  Sun,
  Moon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const UnifiedDashboard = ({ user, userRole }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeModule, setActiveModule] = useState("overview");

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const greeting = getGreeting();

  // Role configuration
  const roleConfig = {
    masteradmin: {
      title: "Master Admin Dashboard",
      modules: [
        { key: "overview", label: "Overview", icon: Home },
        { key: "users", label: "User Management", icon: Users },
        { key: "orders", label: "Orders", icon: ShoppingCart },
        { key: "analytics", label: "Analytics", icon: BarChart3 },
        { key: "settings", label: "Settings", icon: Settings }
      ],
      metrics: [
        { label: "Total Users", value: "2,847", change: "+12.5%", trend: "up", icon: Users },
        { label: "Total Orders", value: "1,234", change: "+8.2%", trend: "up", icon: Package },
        { label: "Revenue", value: "₦45.2M", change: "+15.3%", trend: "up", icon: DollarSign },
        { label: "Active Sessions", value: "23", change: "-5.1%", trend: "down", icon: Activity }
      ]
    },
    superadmin: {
      title: "Super Admin Dashboard",
      modules: [
        { key: "overview", label: "Overview", icon: Home },
        { key: "users", label: "User Management", icon: Users },
        { key: "orders", label: "Orders", icon: ShoppingCart },
        { key: "analytics", label: "Analytics", icon: BarChart3 },
        { key: "settings", label: "Settings", icon: Settings }
      ],
      metrics: [
        { label: "Total Users", value: "1,234", change: "+8.2%", trend: "up", icon: Users },
        { label: "Total Orders", value: "567", change: "+12.1%", trend: "up", icon: Package },
        { label: "Revenue", value: "₦23.8M", change: "+18.7%", trend: "up", icon: DollarSign },
        { label: "Active Sessions", value: "15", change: "+2.3%", trend: "up", icon: Activity }
      ]
    },
    admin: {
      title: "Admin Dashboard",
      modules: [
        { key: "overview", label: "Overview", icon: Home },
        { key: "users", label: "User Management", icon: Users },
        { key: "orders", label: "Orders", icon: ShoppingCart },
        { key: "analytics", label: "Analytics", icon: BarChart3 }
      ],
      metrics: [
        { label: "Total Users", value: "456", change: "+5.2%", trend: "up", icon: Users },
        { label: "Total Orders", value: "234", change: "+7.8%", trend: "up", icon: Package },
        { label: "Revenue", value: "₦12.4M", change: "+11.2%", trend: "up", icon: DollarSign },
        { label: "Active Sessions", value: "8", change: "-1.2%", trend: "down", icon: Activity }
      ]
    },
    dealer: {
      title: "Dealer Dashboard",
      modules: [
        { key: "overview", label: "Overview", icon: Home },
        { key: "orders", label: "Orders", icon: ShoppingCart },
        { key: "inventory", label: "Inventory", icon: Package },
        { key: "analytics", label: "Analytics", icon: BarChart3 }
      ],
      metrics: [
        { label: "Total Orders", value: "89", change: "+15.7%", trend: "up", icon: ShoppingCart },
        { label: "Inventory Items", value: "234", change: "+3.2%", trend: "up", icon: Package },
        { label: "Revenue", value: "₦8.9M", change: "+22.1%", trend: "up", icon: DollarSign },
        { label: "Pending Orders", value: "12", change: "-8.5%", trend: "down", icon: Activity }
      ]
    },
    marketer: {
      title: "Marketer Dashboard",
      modules: [
        { key: "overview", label: "Overview", icon: Home },
        { key: "campaigns", label: "Campaigns", icon: Target },
        { key: "analytics", label: "Analytics", icon: BarChart3 },
        { key: "reports", label: "Reports", icon: TrendingUp }
      ],
      metrics: [
        { label: "Active Campaigns", value: "7", change: "+2", trend: "up", icon: Target },
        { label: "Lead Conversion", value: "23.4%", change: "+5.2%", trend: "up", icon: TrendingUp },
        { label: "ROI", value: "312%", change: "+18.7%", trend: "up", icon: DollarSign },
        { label: "New Leads", value: "156", change: "+12.3%", trend: "up", icon: Users }
      ]
    }
  };

  const config = roleConfig[userRole] || roleConfig.masteradmin;

  // Recent activity data
  const recentActivity = [
    { id: 1, type: "user", action: "New user registration", user: "John Doe", time: "2 minutes ago", status: "success" },
    { id: 2, type: "order", action: "Order completed", user: "Jane Smith", time: "5 minutes ago", status: "success" },
    { id: 3, type: "payment", action: "Payment received", user: "Mike Johnson", time: "10 minutes ago", status: "success" },
    { id: 4, type: "user", action: "Profile updated", user: "Sarah Wilson", time: "15 minutes ago", status: "info" },
    { id: 5, type: "order", action: "New order placed", user: "David Brown", time: "20 minutes ago", status: "pending" }
  ];

  // Quick actions
  const quickActions = [
    { icon: <Users className="h-5 w-5" />, label: "Add User", color: "blue" },
    { icon: <Package className="h-5 w-5" />, label: "New Order", color: "green" },
    { icon: <BarChart3 className="h-5 w-5" />, label: "Analytics", color: "purple" },
    { icon: <Settings className="h-5 w-5" />, label: "Settings", color: "gray" }
  ];

  // Helper functions
  const getActivityIcon = (type) => {
    switch (type) {
      case "user": return <Users className="h-4 w-4" />;
      case "order": return <Package className="h-4 w-4" />;
      case "payment": return <DollarSign className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type, status) => {
    if (status === "success") return "text-green-500";
    if (status === "pending") return "text-yellow-500";
    if (status === "error") return "text-red-500";
    return "text-blue-500";
  };

  const getActivityBgColor = (type, status) => {
    if (status === "success") return "bg-green-100 dark:bg-green-900/30";
    if (status === "pending") return "bg-yellow-100 dark:bg-yellow-900/30";
    if (status === "error") return "bg-red-100 dark:bg-red-900/30";
    return "bg-blue-100 dark:bg-blue-900/30";
  };

  const renderOverviewContent = () => (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {config.metrics.map((metric, index) => {
          const Icon = metric.icon;
          const isPositive = metric.trend === "up";
          
          return (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30">
                    <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`${
                      isPositive 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    } rounded-full px-2 py-1 text-xs font-medium`}
                  >
                    {isPositive ? '+' : ''}{metric.change}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {metric.value}
                  </p>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {metric.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Recent Activity */}
        <div className="xl:col-span-8">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                Recent Activity
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Latest updates and notifications from your account
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div 
                    key={activity.id} 
                    className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200"
                  >
                    <div className={`p-2.5 rounded-lg ${getActivityBgColor(activity.type, activity.status)}`}>
                      <div className={getActivityColor(activity.type, activity.status)}>
                        {getActivityIcon(activity.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.action}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        by {activity.user}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.time}
                    </p>
                    <ArrowUpRight className="h-4 w-4 text-gray-400" />
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Button variant="outline" className="w-full">
                  View All Activity
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="xl:col-span-4">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                Quick Actions
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    {action.icon}
                    <span className="text-xs font-medium">{action.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Performance Insights */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
            Performance Insights
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Key metrics and trends for your business
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <Target className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Conversion Rate
              </h4>
              <p className="text-3xl font-bold text-green-500 mb-1">24.5%</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                +2.1% from last month
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
                <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Growth Rate
              </h4>
              <p className="text-3xl font-bold text-blue-500 mb-1">18.7%</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                +3.2% from last month
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
                <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Efficiency
              </h4>
              <p className="text-3xl font-bold text-purple-500 mb-1">92.3%</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                +1.8% from last month
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderModule = () => {
    switch (activeModule) {
      case "overview":
        return renderOverviewContent();
      case "users":
        return <div className="text-center py-12"><p className="text-gray-500">User Management Module</p></div>;
      case "orders":
        return <div className="text-center py-12"><p className="text-gray-500">Orders Module</p></div>;
      case "analytics":
        return <div className="text-center py-12"><p className="text-gray-500">Analytics Module</p></div>;
      case "settings":
        return <div className="text-center py-12"><p className="text-gray-500">Settings Module</p></div>;
      default:
        return renderOverviewContent();
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Top Navigation Bar */}
      <nav className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-50`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Logo and Mobile Menu */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              
              {/* Vistapro Logo */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">V</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Vistapro
                </span>
              </div>
            </div>

            {/* Center - Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search anything..."
                  className="pl-10 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                />
              </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center space-x-3">
              {/* Dark Mode Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              {/* Notifications */}
              <Button
                variant="ghost"
                size="sm"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 relative"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </Button>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium">{user?.first_name} {user?.last_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{userRole}</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user?.first_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:static inset-y-0 left-0 z-40 w-72 ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } border-r transform transition-transform duration-200 ease-in-out`}>
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {config.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Welcome back, {user?.first_name}!
              </p>
            </div>

            {/* User Profile Section */}
            <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-lg">
                    {user?.first_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {userRole}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    ID: {user?.id || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-6">
              <ul className="space-y-2">
                {config.modules.map((module) => (
                  <li key={module.key}>
                    <button
                      onClick={() => setActiveModule(module.key)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
                        activeModule === module.key
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <module.icon className="h-5 w-5" />
                      <span className="font-medium">{module.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-72">
          {/* Page Header */}
          <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-8 py-6`}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {greeting}, {user?.first_name}! 👋
                </h1>
                <p className={`mt-2 text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Here's what's happening with your {userRole?.toLowerCase()} dashboard today.
                </p>
              </div>
              
              {/* Quick Stats */}
              <div className="hidden lg:flex items-center space-x-4">
                <div className={`px-4 py-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Last Login</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">2 hours ago</p>
                </div>
                <div className={`px-4 py-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Status</p>
                  <p className="text-lg font-semibold text-green-500">Active</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-8">
            {renderModule()}
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default UnifiedDashboard;
