import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarUrl, getUserInitials } from '../../utils/avatarUtils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Shield, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Menu, 
  Download, 
  Calendar,
  Bell,
  Sun,
  Moon,
  Grid3X3,
  ClipboardList,
  Users,
  Lock,
  Settings,
  Code,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  Home,
  User,
  Package,
  FileText,
  MessageSquare,
  BarChart3,
  Wallet,
  UserPlus,
  Target,
  Activity,
  Coins,
  CheckCircle,
  ShoppingCart,
  LogOut,
  FileSpreadsheet,
  FileText as FileTextIcon,
  FileDown,
  Filter,
  X,
  Crown
} from 'lucide-react';
import api from '../../api';
import { getRoleConfig } from '../../config/RoleConfig';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const ShadcnblocksLayout = ({ userRole, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeModule, setActiveModule] = useState('overview');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [usersData, setUsersData] = useState([]);
  const [walletData, setWalletData] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [dateRange, setDateRange] = useState({ from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), to: new Date() });
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [filteredData, setFilteredData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);
  const [userRegistrationTrends, setUserRegistrationTrends] = useState([]);
  const [systemActivities, setSystemActivities] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  // Get role configuration
  const roleConfig = getRoleConfig(userRole);
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  // Load user data
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      // Ensure user has avatar URL constructed from profile_image
      if (userData.profile_image && !userData.avatar) {
        userData.avatar = getAvatarUrl(userData.profile_image);
        setUser(userData);
        // Update localStorage with avatar URL
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        setUser(userData);
      }
    }
  }, []);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (dateRange.from && dateRange.to) {
          params.append('startDate', dateRange.from.toISOString().split('T')[0]);
          params.append('endDate', dateRange.to.toISOString().split('T')[0]);
        }
        const response = await api.get(`/master-admin/dashboard-summary?${params.toString()}`);
        setDashboardData(response.data);
        console.log('Dashboard data loaded:', response.data);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Set fallback data if API fails
        setDashboardData({
          totalUsers: 0,
          totalOrders: 0,
          totalSales: 0,
          pendingVerification: 0,
          previousTotalUsers: 0,
          previousTotalOrders: 0,
          previousSales: 0,
          previousPendingVerification: 0
        });
      } finally {
        setLoading(false);
      }
    };

    if (userRole === 'masteradmin') {
      loadDashboardData();
    }
  }, [userRole, dateRange]);

  // Load notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await api.get('/notifications');
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unread || 0);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };

    loadNotifications();
  }, []);

  // Socket.IO for real-time notifications
  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL, { transports: ["websocket"] });
    
    socket.on('connect', () => {
      console.log('Connected to notification socket');
    });

    socket.on('notification:new', (notification) => {
      console.log('New notification received:', notification);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    socket.on('notification:read', (notificationId) => {
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Load recent orders
  useEffect(() => {
    const loadRecentOrders = async () => {
      try {
        const response = await api.get('/manage-orders/orders/history?limit=10');
        setRecentOrders(response.data.orders || []);
      } catch (error) {
        console.error('Error loading recent orders:', error);
        // Set fallback data
        setRecentOrders([
          { id: 1, status: 'confirmed', customer_name: 'John Doe', sold_amount: 45000, created_at: new Date().toISOString() },
          { id: 2, status: 'pending', customer_name: 'Jane Smith', sold_amount: 32500, created_at: new Date(Date.now() - 3600000).toISOString() },
          { id: 3, status: 'processing', customer_name: 'Mike Johnson', sold_amount: 28000, created_at: new Date(Date.now() - 7200000).toISOString() },
          { id: 4, status: 'confirmed', customer_name: 'Sarah Wilson', sold_amount: 51200, created_at: new Date(Date.now() - 10800000).toISOString() }
        ]);
      }
    };

    if (userRole === 'masteradmin') {
      loadRecentOrders();
    }
  }, [userRole, dateRange]);

  // Load user registration trends
  useEffect(() => {
    const loadUserRegistrationTrends = async () => {
      try {
        // For now, we'll create mock data based on the dashboard data
        // In a real implementation, this would come from a dedicated API endpoint
        const trends = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthName = date.toLocaleDateString('en-US', { month: 'short' });
          const count = Math.floor(Math.random() * 20) + 5; // Mock data
          trends.push({ month: monthName, count });
        }
        setUserRegistrationTrends(trends);
      } catch (error) {
        console.error('Error loading user registration trends:', error);
      }
    };

    if (userRole === 'masteradmin') {
      loadUserRegistrationTrends();
    }
  }, [userRole, dateRange]);

  // Load system activities
  useEffect(() => {
    const loadSystemActivities = async () => {
      try {
        const response = await api.get('/master-admin/recent-activity?limit=10');
        setSystemActivities(response.data.activities || []);
      } catch (error) {
        console.error('Error loading system activities:', error);
        // Set fallback data
        setSystemActivities([
          {
            id: 1,
            activity_type: 'User Management',
            description: 'Approved 3 user verifications',
            timestamp: new Date().toISOString()
          },
          {
            id: 2,
            activity_type: 'Order Management',
            description: 'Confirmed 5 pending orders',
            timestamp: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: 3,
            activity_type: 'System',
            description: 'Updated system settings',
            timestamp: new Date(Date.now() - 7200000).toISOString()
          }
        ]);
      }
    };

    if (userRole === 'masteradmin') {
      loadSystemActivities();
    }
  }, [userRole, dateRange]);

  // Dark mode effect
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    setIsDarkMode(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Load analytics data
  useEffect(() => {
    const loadAnalyticsData = async () => {
      try {
        // Use existing dashboard data for analytics
        const response = await api.get('/master-admin/dashboard-summary');
        const data = response.data;
        
        // Transform dashboard data into analytics format
        setAnalyticsData({
          performanceMetrics: {
            totalMarketers: data.totalUsers || 0,
            totalAdmins: Math.floor((data.totalUsers || 0) * 0.1), // Estimate 10% are admins
            totalSuperAdmins: Math.floor((data.totalUsers || 0) * 0.05), // Estimate 5% are superadmins
            totalRevenue: data.totalSales || 0,
            totalOrders: data.totalOrders || 0,
            averageOrderValue: data.totalSales && data.totalOrders ? data.totalSales / data.totalOrders : 0
          },
          rolePerformance: [
            { role: 'Marketers', count: data.totalUsers || 0, sales: data.totalSales || 0, orders: data.totalOrders || 0 },
            { role: 'Admins', count: Math.floor((data.totalUsers || 0) * 0.1), sales: (data.totalSales || 0) * 0.3, orders: Math.floor((data.totalOrders || 0) * 0.3) },
            { role: 'SuperAdmins', count: Math.floor((data.totalUsers || 0) * 0.05), sales: (data.totalSales || 0) * 0.2, orders: Math.floor((data.totalOrders || 0) * 0.2) }
          ],
          monthlyTrends: [
            { month: 'Jan', revenue: (data.totalSales || 0) * 0.1, orders: Math.floor((data.totalOrders || 0) * 0.1) },
            { month: 'Feb', revenue: (data.totalSales || 0) * 0.15, orders: Math.floor((data.totalOrders || 0) * 0.15) },
            { month: 'Mar', revenue: (data.totalSales || 0) * 0.2, orders: Math.floor((data.totalOrders || 0) * 0.2) },
            { month: 'Apr', revenue: (data.totalSales || 0) * 0.18, orders: Math.floor((data.totalOrders || 0) * 0.18) },
            { month: 'May', revenue: (data.totalSales || 0) * 0.22, orders: Math.floor((data.totalOrders || 0) * 0.22) },
            { month: 'Jun', revenue: (data.totalSales || 0) * 0.15, orders: Math.floor((data.totalOrders || 0) * 0.15) }
          ]
        });
      } catch (error) {
        console.error('Error loading analytics data:', error);
        // Set fallback data
        setAnalyticsData({
          performanceMetrics: {
            totalMarketers: 0,
            totalAdmins: 0,
            totalSuperAdmins: 0,
            totalRevenue: 0,
            totalOrders: 0,
            averageOrderValue: 0
          },
          rolePerformance: [],
          monthlyTrends: []
        });
      }
    };

    if (userRole === 'masteradmin' && activeTab === 'analytics') {
      loadAnalyticsData();
    }
  }, [userRole, activeTab]);

  // Load users data
  useEffect(() => {
    const loadUsersData = async () => {
      try {
        // Try to get real users data from the users management endpoint
        const response = await api.get('/users');
        const users = response.data.users || response.data || [];
        
        // Transform the data to match our table structure
        const transformedUsers = users.map((user, index) => ({
          id: user.id || user.user_id || index + 1,
          name: user.name || user.full_name || user.first_name + ' ' + user.last_name || 'Unknown User',
          email: user.email || 'No email',
          role: user.role || 'user',
          status: user.status || user.is_active ? 'active' : 'inactive',
          location: user.location || user.city || 'N/A',
          joinDate: user.created_at ? new Date(user.created_at).toISOString().split('T')[0] : 'N/A',
          totalOrders: user.total_orders || user.orders_count || 0,
          totalSales: user.total_sales || user.sales_amount || 0
        }));
        
        setUsersData(transformedUsers);
      } catch (error) {
        console.error('Error loading users data:', error);
        // Set fallback data with realistic users
        setUsersData([
          {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            role: 'marketer',
            status: 'active',
            location: 'Lagos',
            joinDate: '2024-01-15',
            totalOrders: 25,
            totalSales: 4500000
          },
          {
            id: 2,
            name: 'Jane Smith',
            email: 'jane@example.com',
            role: 'admin',
            status: 'active',
            location: 'Abuja',
            joinDate: '2024-02-20',
            totalOrders: 18,
            totalSales: 3200000
          },
          {
            id: 3,
            name: 'Mike Johnson',
            email: 'mike@example.com',
            role: 'superadmin',
            status: 'active',
            location: 'Kano',
            joinDate: '2024-03-10',
            totalOrders: 32,
            totalSales: 5800000
          },
          {
            id: 4,
            name: 'Sarah Wilson',
            email: 'sarah@example.com',
            role: 'marketer',
            status: 'active',
            location: 'Port Harcourt',
            joinDate: '2024-04-05',
            totalOrders: 15,
            totalSales: 2800000
          },
          {
            id: 5,
            name: 'David Brown',
            email: 'david@example.com',
            role: 'admin',
            status: 'active',
            location: 'Ibadan',
            joinDate: '2024-05-12',
            totalOrders: 22,
            totalSales: 3800000
          }
        ]);
      }
    };

    if (userRole === 'masteradmin' && activeTab === 'users') {
      loadUsersData();
    }
  }, [userRole, activeTab]);

  // Load wallet data
  useEffect(() => {
    const loadWalletData = async () => {
      try {
        const response = await api.get('/master-admin/wallet');
        setWalletData(response.data);
      } catch (error) {
        console.error('Error loading wallet data:', error);
        // Set fallback data
        setWalletData({
          totalBalance: 2500000,
          availableBalance: 1800000,
          pendingWithdrawals: 700000,
          totalEarnings: 15000000,
          monthlyEarnings: 2500000,
          transactions: [
            {
              id: 1,
              type: 'commission',
              amount: 150000,
              description: 'Commission from Marketer Sales',
              date: '2024-09-28',
              status: 'completed'
            },
            {
              id: 2,
              type: 'withdrawal',
              amount: -500000,
              description: 'Withdrawal to Bank Account',
              date: '2024-09-25',
              status: 'completed'
            },
            {
              id: 3,
              type: 'commission',
              amount: 200000,
              description: 'Commission from Admin Sales',
              date: '2024-09-22',
              status: 'completed'
            }
          ]
        });
      }
    };

    if (userRole === 'masteradmin' && activeTab === 'wallet') {
      loadWalletData();
    }
  }, [userRole, activeTab]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Navigation data based on role - show all modules in one section
  const navigationItems = roleConfig.modules.map(module => ({
    label: module.label,
    icon: module.icon,
    key: module.key,
    active: activeModule === module.key
  }));

  // Real metrics data based on dashboard data
  const getMetrics = () => {
    if (!dashboardData || loading) {
      return [
        { title: 'Total Users', value: '0', change: '0%', trend: 'up', period: 'Loading...', icon: Users },
        { title: 'Total Orders', value: '0', change: '0%', trend: 'up', period: 'Loading...', icon: ShoppingCart },
        { title: 'Total Sales', value: '₦0', change: '0%', trend: 'up', period: 'Loading...', icon: Coins },
        { title: 'Pending Verification', value: '0', change: '0%', trend: 'up', period: 'Loading...', icon: CheckCircle }
      ];
    }

    const calculatePercentageChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    // Use current period data for percentage calculations (not all-time totals)
    const currentUsers = Number(dashboardData.currentPeriodUsers) || 0;
    const currentOrders = Number(dashboardData.currentPeriodOrders) || 0;
    const currentSales = Number(dashboardData.currentPeriodSales) || 0;
    const currentPendingVerification = Number(dashboardData.currentPeriodPendingVerification) || 0;
    
    // Previous period data for comparison
    const previousUsers = Number(dashboardData.previousTotalUsers) || 0;
    const previousOrders = Number(dashboardData.previousTotalOrders) || 0;
    const previousSales = Number(dashboardData.previousSales) || 0;
    const previousPendingVerification = Number(dashboardData.previousPendingVerification) || 0;

    // Display all-time totals but calculate percentages from current vs previous period
    const totalUsers = Number(dashboardData.totalUsers) || 0;
    const totalOrders = Number(dashboardData.totalOrders) || 0;
    const totalSales = Number(dashboardData.totalSales) || 0;
    const pendingVerification = Number(dashboardData.pendingVerification) || 0;

    return [
      {
        title: 'Total Users',
        value: totalUsers.toLocaleString(),
        change: `${calculatePercentageChange(currentUsers, previousUsers)}%`,
        trend: currentUsers >= previousUsers ? 'up' : 'down',
        period: 'vs previous period',
        icon: Users
      },
      {
        title: 'Total Orders',
        value: totalOrders.toLocaleString(),
        change: `${calculatePercentageChange(currentOrders, previousOrders)}%`,
        trend: currentOrders >= previousOrders ? 'up' : 'down',
        period: 'vs previous period',
        icon: ShoppingCart
      },
      {
        title: 'Total Sales',
        value: `₦${totalSales.toLocaleString()}`,
        change: `${calculatePercentageChange(currentSales, previousSales)}%`,
        trend: currentSales >= previousSales ? 'up' : 'down',
        period: 'vs previous period',
        icon: Coins
      },
      {
        title: 'Pending Verification',
        value: pendingVerification.toLocaleString(),
        change: `${calculatePercentageChange(currentPendingVerification, previousPendingVerification)}%`,
        trend: currentPendingVerification >= previousPendingVerification ? 'up' : 'down',
        period: 'vs previous period',
        icon: CheckCircle
      }
    ];
  };

  const metrics = getMetrics();

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Handle view order details
  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  // Handle notification actions
  const markNotificationAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Handle export actions
  const handleExport = (format) => {
    // TODO: Implement actual export functionality
    console.log(`Exporting data as ${format}`);
    // This would typically trigger a download or open a modal
  };

  // Format date range for display
  const formatDateRange = () => {
    if (!dateRange.from || !dateRange.to) return 'Select date range';
    const from = dateRange.from.toLocaleDateString();
    const to = dateRange.to.toLocaleDateString();
    return `${from} - ${to}`;
  };

  // Render active module component
  const renderActiveModule = () => {
    if (activeModule === 'overview') {
      return (
        <div className="space-y-6">
          {/* Metrics Grid */}
          <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            {metrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <Card key={index} className="p-6 flex flex-col justify-between h-full border border-gray-200 dark:border-gray-700">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{metric.title}</h3>
                      <Icon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-gray-50">{metric.value}</p>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className={`font-medium ${metric.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {metric.change}
                    </span>
                    <span className="ml-1 text-gray-500 dark:text-gray-400">{metric.period}</span>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Charts and Tables Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Charts Section */}
            <div className="space-y-6">
              {/* User Registration Trends */}
              <Card className="p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">User Registration Trends</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Showing user registrations for the last 6 months</p>
                  </div>
                </div>
                <div className="h-64 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  {userRegistrationTrends.length > 0 ? (
                    <div className="h-full flex items-end justify-between space-x-2">
                      {userRegistrationTrends.map((trend, index) => (
                        <div key={index} className="flex flex-col items-center flex-1">
                          <div 
                            className="w-full bg-gradient-to-t from-orange-400 to-red-500 rounded-t"
                            style={{ height: `${(trend.count / Math.max(...userRegistrationTrends.map(t => t.count))) * 200}px` }}
                          />
                          <span className="text-xs text-gray-600 dark:text-gray-400 mt-2">{trend.month}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-500">{trend.count}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">Loading chart data...</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Total Sales */}
              <Card className="p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Total Sales</h3>
                    <div className="flex items-center mt-2">
                      <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">₦{dashboardData?.totalSales?.toLocaleString() || '0'}</span>
                      <span className="text-sm text-green-600 dark:text-green-400 font-medium ml-2">Total Revenue</span>
                    </div>
                  </div>
                </div>
                <div className="h-32 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-600">
                  <span className="text-white font-medium">Revenue Chart</span>
                </div>
              </Card>
            </div>

            {/* Tables Section */}
            <div className="space-y-6">
              {/* Recent Orders Table */}
              <Card className="p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Orders</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Latest order activity across the platform.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      placeholder="Filter orders..."
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                    <Button variant="outline" size="sm" className="border-gray-200 dark:border-gray-600">
                      <Filter className="w-4 h-4 mr-1" />
                      Filter
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-600">
                          <th className="text-left py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                          <th className="text-left py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Marketer</th>
                          <th className="text-left py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Amount</th>
                          <th className="text-left py-3 text-sm font-medium text-gray-500 dark:text-gray-400"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOrders.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                              No recent orders found
                            </td>
                          </tr>
                        ) : (
                          recentOrders.slice(0, 5).map((order, index) => (
                            <tr key={order.id || index} className="border-b border-gray-100 dark:border-gray-700">
                              <td className="py-3">
                                <Badge 
                                  variant={
                                    order.status === 'confirmed' || order.status === 'released_confirmed' ? 'default' : 
                                    order.status === 'processing' || order.status === 'on_progress' ? 'secondary' : 
                                    'destructive'
                                  }
                                  className="text-xs"
                                >
                                  {order.status === 'released_confirmed' ? 'confirmed' : order.status}
                                </Badge>
                              </td>
                              <td className="py-3 text-sm text-gray-900 dark:text-gray-100">
                                <div>
                                  <div className="font-medium">{order.user_name || 'N/A'}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    ID: {order.user_unique_id || 'N/A'}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 text-sm text-gray-900 dark:text-gray-100">
                                ₦{Number(order.sold_amount || order.amount || 0).toLocaleString()}
                              </td>
                              <td className="py-3">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleViewOrderDetails(order)}>
                                      View Details
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>

              {/* Recent Activities */}
              <Card className="p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Activities</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">MasterAdmin system activities and actions.</p>
                  </div>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {systemActivities.length === 0 ? (
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
                      No recent activities
                    </div>
                  ) : (
                    systemActivities.slice(0, 8).map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                            {activity.activity_type || activity.description || 'System Activity'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {activity.actor_name && `By: ${activity.actor_name}`}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(activity.created_at || activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

            </div>
          </div>
        </div>
      );
    }

    // Find and render the actual MasterAdmin component
    const module = roleConfig.modules.find(m => m.key === activeModule);
    if (module && module.component) {
      const Component = module.component;
      return <Component />;
    }

    // Fallback for modules without components
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{module?.label || 'Module'}</h2>
        <p className="text-gray-600">This module is under development.</p>
      </div>
    );
  };

  // Sample payments data
  const payments = [
    { status: 'success', email: 'ken99@yahoo.com', amount: '$316.00' },
    { status: 'success', email: 'abe45@gmail.com', amount: '$242.00' },
    { status: 'processing', email: 'monserrat44@gmail.com', amount: '$837.00' },
    { status: 'failed', email: 'carmella@hotmail.com', amount: '$721.00' }
  ];

  // Sample team members
  const teamMembers = [
    { name: 'Dale Komen', email: 'dale@example.com', role: 'Member', initials: 'DK' },
    { name: 'Sofia Davis', email: 'm@example.com', role: 'Owner', initials: 'SD' },
    { name: 'Jackson Lee', email: 'p@example.com', role: 'Member', initials: 'JL' },
    { name: 'Isabella Nguyen', email: 'i@example.com', role: 'Member', initials: 'IN' },
    { name: 'Hugan Romex', email: 'kai@example.com', role: 'Member', initials: 'HR' }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'users', label: 'Users' },
    { id: 'wallet', label: 'Wallet' }
  ];

  return (
    <div className={`flex h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="flex h-screen bg-white dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        {/* Sidebar Header */}
        <div className="flex items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{roleConfig.title}</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.unique_id ? `MA-${user.unique_id}` : 'Vistapro Management'}
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded">⌘K</kbd>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 pb-4 space-y-1 overflow-y-auto">
          <div className="space-y-1">
            {navigationItems.map((item, index) => (
              <div 
                key={index}
                className={`flex items-center space-x-3 px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${
                  item.active 
                    ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 font-medium' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => setActiveModule(item.key)}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </nav>

        {/* User Profile */}
        <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="relative">
            <div 
              className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-2 -m-2"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.avatar || getAvatarUrl(user?.profile_image)} />
                <AvatarFallback className="text-xs">
                  {getUserInitials(user)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
            </div>
            
            {/* User Dropdown */}
            {showUserDropdown && (
              <div className="absolute bottom-full left-4 right-4 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 z-50">
                <button 
                  onClick={() => {
                    setShowUserDropdown(false);
                    // Navigate to profile page
                    navigate('/profile');
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                >
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </button>
                <button 
                  onClick={() => {
                    setShowUserDropdown(false);
                    // Navigate to settings page
                    navigate('/settings');
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
                <button 
                  onClick={() => {
                    setShowUserDropdown(false);
                    setShowNotifications(true);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                >
                  <Bell className="w-4 h-4" />
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <Badge className="ml-auto text-xs bg-red-500 text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </button>
                <hr className="my-2 border-gray-200 dark:border-gray-700" />
                <button 
                  onClick={() => {
                    setShowUserDropdown(false);
                    handleLogout();
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex flex-col h-full">
            {/* Mobile Sidebar Header */}
            <div className="flex items-center px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-gray-900">Shadcnblocks - Admin Kit</h1>
                  <p className="text-xs text-gray-500">Nextjs + shadcn/ui</p>
                </div>
              </div>
            </div>

            {/* Mobile Search Bar */}
            <div className="px-4 py-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">⌘K</kbd>
                </div>
              </div>
            </div>

            {/* Mobile Navigation - Same as desktop but in sheet */}
            <nav className="flex-1 px-4 pb-4 space-y-1 overflow-y-auto">
              <div className="space-y-1">
                {navigationItems.map((item, index) => (
                  <div 
                    key={index}
                    className={`flex items-center space-x-3 px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${
                      item.active 
                        ? 'bg-orange-50 text-orange-700 font-medium' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      setActiveModule(item.key);
                      setSidebarOpen(false);
                    }}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </nav>

            {/* Mobile User Profile */}
            <div className="px-4 py-4 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="/api/placeholder/32/32" />
                  <AvatarFallback className="text-xs">CN</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">ausrobdev</p>
                  <p className="text-xs text-gray-500 truncate">rob@shadcnblocks.com</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 overflow-auto bg-gray-50 dark:bg-gray-900 w-full min-w-0">
        {/* Header Bar */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Mobile Menu Button */}
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="sm">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{roleConfig.title}</h1>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
              {/* Export Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="hidden md:flex">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport('csv')}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Export to CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Export to XLSX
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    <FileTextIcon className="w-4 h-4 mr-2" />
                    Export to PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Date Range Picker */}
              <Popover open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="hidden sm:flex">
                    <Calendar className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">{formatDateRange()}</span>
                    <ChevronDown className="w-4 h-4 sm:ml-1" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <div className="p-3 space-y-3">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Quick Select</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" onClick={() => {
                          const today = new Date();
                          setDateRange({ from: today, to: today });
                          setDateRangeOpen(false);
                        }}>
                          Today
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => {
                          const today = new Date();
                          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                          setDateRange({ from: weekAgo, to: today });
                          setDateRangeOpen(false);
                        }}>
                          Last 7 Days
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => {
                          const today = new Date();
                          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                          setDateRange({ from: monthAgo, to: today });
                          setDateRangeOpen(false);
                        }}>
                          Last 30 Days
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => {
                          const today = new Date();
                          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                          setDateRange({ from: monthStart, to: today });
                          setDateRangeOpen(false);
                        }}>
                          This Month
                        </Button>
                      </div>
                    </div>
                    <div className="border-t pt-3">
                      <h4 className="font-medium text-sm mb-2">Custom Range</h4>
                      <CalendarComponent
                        mode="range"
                        selected={dateRange}
                        onSelect={(range) => {
                          if (range?.from && range?.to) {
                            setDateRange(range);
                            setDateRangeOpen(false);
                            // Trigger data reload with new date range
                            loadDashboardData();
                            loadRecentOrders();
                            loadUserRegistrationTrends();
                            loadSystemActivities();
                          }
                        }}
                        numberOfMonths={2}
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Dark Mode Toggle */}
              <Button variant="ghost" size="sm" onClick={toggleDarkMode}>
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>

              {/* Notifications */}
              <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-red-500">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="p-3 border-b">
                    <h4 className="font-medium text-sm">Notifications</h4>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <DropdownMenuItem
                          key={notification.id}
                          className="p-3 border-b last:border-b-0"
                          onClick={() => markNotificationAsRead(notification.id)}
                        >
                          <div className="flex-1">
                            <p className="text-sm text-gray-900 dark:text-gray-100">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {new Date(notification.created_at).toLocaleString()}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full ml-2" />
                          )}
                        </DropdownMenuItem>
                      ))
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Tab Navigation - Only show for MasterAdmin (when no children) */}
        {!children && (
          <div className="px-4 py-1 border-b border-gray-200 dark:border-gray-700">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-800 h-8 gap-1">
                {tabs.map((tab) => (
                  <TabsTrigger 
                    key={tab.id} 
                    value={tab.id}
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100 text-xs font-medium px-2 py-1"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}

        {/* Tab Content */}
        <div className="w-full">
          {/* If children are provided (for non-MasterAdmin roles), render them directly */}
          {children ? (
            <div className="w-full h-full">
              {typeof children === 'function' ? children({ onNavigate: setActiveModule, isDarkMode, activeModule }) : children}
            </div>
          ) : (
            /* Otherwise, use the tabs system for MasterAdmin */
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsContent value="overview" className="space-y-3 sm:space-y-4 md:space-y-6 w-full">
                {/* Overview Content */}
                <div className="w-full">
                  {renderActiveModule()}
                </div>
              </TabsContent>

            <TabsContent value="analytics" className="space-y-3 sm:space-y-4 md:space-y-6">
              {/* Analytics Content - Performance Overview */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Performance Analytics</h2>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Marketer, Admin & SuperAdmin Performance</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                  <Card className="p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Marketers</p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                          {analyticsData?.performanceMetrics?.totalMarketers || '0'}
                        </p>
                      </div>
                      <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                        <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Admins</p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                          {analyticsData?.performanceMetrics?.totalAdmins || '0'}
                        </p>
                      </div>
                      <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900 rounded-full">
                        <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total SuperAdmins</p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                          {analyticsData?.performanceMetrics?.totalSuperAdmins || '0'}
                        </p>
                      </div>
                      <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                        <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          ₦{analyticsData?.performanceMetrics?.totalRevenue?.toLocaleString() || '0'}
                        </p>
                      </div>
                      <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
                        <Coins className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Role Performance</h3>
                    <div className="space-y-4">
                      {analyticsData?.rolePerformance?.map((role, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{role.role}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{role.count} users</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">₦{role.sales.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{role.orders} orders</p>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-4">No performance data available</div>
                      )}
                    </div>
                  </Card>

                  <Card className="p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Monthly Trends</h3>
                    <div className="space-y-3">
                      {analyticsData?.monthlyTrends?.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{item.month}</span>
                          <div className="text-right">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">₦{item.revenue.toLocaleString()}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({item.orders} orders)</span>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-4">No trend data available</div>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="users" className="space-y-3">
              {/* Users Content */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">User Management</h2>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </div>

                <Card className="border border-gray-200 dark:border-gray-700">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Location</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Orders</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sales</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {usersData.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                                    {user.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name || 'Unknown User'}</div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">{user.email || 'No email'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant="secondary" className="capitalize">{user.role}</Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                                {user.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{user.location || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{user.totalOrders || 0}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">₦{(user.totalSales || 0).toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="wallet" className="space-y-3">
              {/* Wallet Content */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Balance</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          ₦{walletData?.totalBalance?.toLocaleString() || '0'}
                        </p>
                      </div>
                      <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                        <Wallet className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Available Balance</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          ₦{walletData?.availableBalance?.toLocaleString() || '0'}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                        <Coins className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Earnings</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          ₦{walletData?.monthlyEarnings?.toLocaleString() || '0'}
                        </p>
                      </div>
                      <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                        <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Transactions</h3>
                    <div className="space-y-3">
                      {walletData?.transactions?.map((transaction) => (
                        <div key={transaction.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{transaction.description}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{transaction.date}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-medium ${
                              transaction.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                              {transaction.amount > 0 ? '+' : ''}₦{Math.abs(transaction.amount).toLocaleString()}
                            </p>
                            <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                              {transaction.status}
                            </Badge>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-4">No transactions available</div>
                      )}
                    </div>
                  </Card>

                  <Card className="p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <Button className="w-full justify-start" variant="outline">
                        <FileDown className="w-4 h-4 mr-2" />
                        Withdraw Funds
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <FileText className="w-4 h-4 mr-2" />
                        Generate Statement
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <Settings className="w-4 h-4 mr-2" />
                        Wallet Settings
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          )}
        </div>
      </main>
      </div>

      {/* Order Details Popover */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Order Details
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowOrderDetails(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Order ID</label>
                  <p className="text-sm text-gray-900 dark:text-gray-100">{selectedOrder.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                  <Badge 
                    variant={selectedOrder.status === 'released_confirmed' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {selectedOrder.status === 'released_confirmed' ? 'confirmed' : selectedOrder.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount</label>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    ₦{Number(selectedOrder.sold_amount || selectedOrder.amount || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Sale Date</label>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {new Date(selectedOrder.sale_date || selectedOrder.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Marketer Info */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Marketer Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{selectedOrder.user_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">ID</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{selectedOrder.user_unique_id || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{selectedOrder.user_role || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{selectedOrder.user_location || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Customer Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{selectedOrder.customer_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{selectedOrder.customer_phone || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{selectedOrder.customer_address || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Product Info */}
              {(selectedOrder.device_name || selectedOrder.device_model) && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Product Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Device</label>
                      <p className="text-sm text-gray-900 dark:text-gray-100">{selectedOrder.device_name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Model</label>
                      <p className="text-sm text-gray-900 dark:text-gray-100">{selectedOrder.device_model || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</label>
                      <p className="text-sm text-gray-900 dark:text-gray-100">{selectedOrder.device_type || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Quantity</label>
                      <p className="text-sm text-gray-900 dark:text-gray-100">{selectedOrder.number_of_devices || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* IMEIs */}
              {selectedOrder.imeis && selectedOrder.imeis.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">IMEIs</h4>
                  <div className="space-y-1">
                    {selectedOrder.imeis.map((imei, index) => (
                      <p key={index} className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                        {imei}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <Button onClick={() => setShowOrderDetails(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShadcnblocksLayout;