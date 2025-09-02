import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import {
  Home,
  User,
  Users as UsersIcon,
  FileText,
  TrendingUp,
  Package,
  CheckCircle,
  UserPlus,
  ShoppingCart,
  ClipboardList,
  LogOut,
  Menu,
  X,
  MessageSquare,
  Bell,
  Search,
  Sun,
  Moon,
  Settings,
  BarChart3,
  Wallet as WalletIcon,
  Target,
  Activity,
  DollarSign,
  ArrowUpRight,
  ChevronDown,
  Plus,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Clock,
  BarChart2,
  Box
} from "lucide-react";

// Import existing components to preserve functionality
import AvatarDropdown from "./AvatarDropdown";
import ProfileUpdate from "./ProfileUpdate";
import UsersManagement from "./UsersManagement";
import ProfitReport from "./ProfitReport";
import MasterAdminWallet from "./MasterAdminWallet";
import SuperAdminWallet from "./SuperAdminWallet";
import AdminWallet from "./AdminWallet";
import Performance from "./Performance";
import StockUpdate from "./StockUpdate";
import Verification from "./Verification";
import AssignUsers from "./AssignUsers";
import Product from "./Product";
import ManageOrders from "./ManageOrders";
import SuperAdminManageOrders from "./SuperAdminManageOrders";
import Messaging from "./Messaging";
import Submissions from "./Submissions";
import NotificationBell from "./NotificationBell";
import VerificationMarketer from "./VerificationMarketer";
import MarketerStockPickup from "./MarketerStockPickup";
import AdminStockPickups from "./AdminStockPickups";
import SuperAdminStockPickups from "./SuperAdminStockPickups";
import Order from "./Order";
import Wallet from "./Wallet";

// Import Shadcn/ui components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ModernUnifiedDashboard = ({ userRole }) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeModule, setActiveModule] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("All Time");
  
  // Get user data from localStorage
  const [user, setUser] = useState(null);
  
  // Stats state for real data
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
    assignedUsers: 0,
    previousAssignedUsers: 0,
    assignedMarketers: 0,
    previousAssignedMarketers: 0,
    walletBalance: 0,
    previousWalletBalance: 0,
    activeSessions: 0,
    previousActiveSessions: 0
  });

  // Recent activity state
  const [recentActivity, setRecentActivity] = useState([]);
  const [activityPage, setActivityPage] = useState(0);
  const [activityTotal, setActivityTotal] = useState(0);
  const activityLimit = 6;

  useEffect(() => {
    console.log("ModernUnifiedDashboard mounted with userRole:", userRole);
    
    const loadUserData = () => {
      const storedUser = localStorage.getItem("user");
      console.log("Stored user data:", storedUser);
      
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log("Parsed user:", parsedUser);
          setUser(parsedUser);
          setIsLoading(false);
          
          // Set initial stats immediately
          // const initialStats = getFallbackStats(userRole || 'masteradmin');
          // console.log("Setting initial stats:", initialStats);
          // setStats(initialStats);
          
          // Set initial activity
          // setRecentActivity(getFallbackActivity()); // Removed fallback activity
        } catch (error) {
          console.error("Error parsing user data:", error);
          navigate("/");
        }
      } else {
        console.log("No user data found, redirecting to login");
        navigate("/");
      }
    };

    loadUserData();
  }, [navigate, userRole]);

  // Helper to compute percentage change
  const computeChange = (current, previous) => {
    if (!previous || previous === 0) return { text: "N/A", color: "text-gray-500" };
    const pct = ((current - previous) / previous) * 100;
    const sign = pct > 0 ? "+" : "";
    return {
      text: `${sign}${pct.toFixed(1)}%`,
      color: pct > 0 ? "text-green-600" : pct < 0 ? "text-red-600" : "text-gray-600",
    };
  };

  // Fetch stats based on user role
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.log("No token found, cannot fetch stats");
          return;
        }

        let endpoint = "";
        switch (userRole) {
          case "masteradmin":
            endpoint = "/api/master-admin/stats";
            break;
          case "superadmin":
            endpoint = "/api/super-admin/stats";
            break;
          case "admin":
            endpoint = "/api/admin/stats";
            break;
          case "dealer":
            endpoint = "/api/dealer/stats";
            break;
          case "marketer":
            endpoint = "/api/marketer/stats";
            break;
          default:
            endpoint = "/api/master-admin/stats";
        }

        console.log(`Attempting to fetch stats from: ${import.meta.env.VITE_API_URL}${endpoint}`);

        // Create URL with query parameters properly
        const url = new URL(`${import.meta.env.VITE_API_URL}${endpoint}`);
        url.searchParams.append('period', dateFilter);

        const response = await fetch(url, {
          method: 'GET',
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log("API response data:", data);
          setStats(data);
        } else {
          console.error(`API returned ${response.status}, stats will remain at 0`);
          // Don't set fallback data - let it show 0 until API works
        }
      } catch (err) {
        console.error(`Failed to load ${userRole} stats:`, err);
        // Don't set fallback data - let it show 0 until API works
      }
    };

    if (user && userRole) {
      console.log("Fetching stats for role:", userRole);
      fetchStats();
    }
  }, [userRole, user, dateFilter]);

  // Fetch recent activity
  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        let endpoint = "";
        switch (userRole) {
          case "masteradmin":
            endpoint = "/api/master-admin/recent-activity";
            break;
          case "superadmin":
            endpoint = "/api/super-admin/recent-activity";
            break;
          case "admin":
            endpoint = "/api/admin/recent-activity";
            break;
          case "dealer":
            endpoint = "/api/dealer/recent-activity";
            break;
          case "marketer":
            endpoint = "/api/marketer/recent-activity";
            break;
          default:
            endpoint = "/api/master-admin/recent-activity";
        }

        // Create URL with query parameters properly
        const url = new URL(`${import.meta.env.VITE_API_URL}${endpoint}`);
        url.searchParams.append('period', dateFilter);
        url.searchParams.append('limit', String(activityLimit));
        url.searchParams.append('offset', String(activityPage * activityLimit));

        const response = await fetch(url, {
          method: 'GET',
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Recent activity API response:", data);
          console.log("Raw activities:", data.activities);
          if (data.activities && data.activities.length > 0) {
            console.log("First activity sample:", data.activities[0]);
          }
          
          // Process the simplified backend data
          const processedActivities = (data.activities || []).map(activity => {
            const processed = {
              ...activity,
              action: generateActivityDescription(activity),
              entity_type: activity.entity_type || 'Unknown',
              entity_id: activity.entity_display_name || activity.entity_unique_id || '',
              actor_name: activity.actor_name || 'System',
              timestamp: activity.created_at,
              status: 'success' // Default status for now
            };
            console.log("Processed activity:", processed);
            return processed;
          });
          
          setRecentActivity(processedActivities);
          // Set total count for pagination
          if (typeof data.total === 'number') {
            setActivityTotal(data.total);
          } else {
            // Fallback: estimate total based on current results
            setActivityTotal((activityPage + 1) * activityLimit + (data.activities?.length || 0));
          }
        } else {
          console.error(`Activity API returned ${response.status}, activity will remain empty`);
          setRecentActivity([]); // Clear any existing data
        }
      } catch (err) {
        console.error(`Failed to load ${userRole} recent activity:`, err);
        // Don't set fallback activity - let it show empty until API works
      }
    };

    if (user && userRole) {
      fetchRecentActivity();
    }
  }, [userRole, user, dateFilter, activityPage]);

  // Reset pagination when date filter changes
  useEffect(() => {
    setActivityPage(0);
    setActivityTotal(0);
  }, [dateFilter]);

  // Helper function to generate activity descriptions from simplified backend data
  const generateActivityDescription = (activity) => {
    const { activity_type, entity_type, entity_display_name, entity_unique_id } = activity;
    
    // Use display name if available, fallback to unique_id
    const displayName = entity_display_name || entity_unique_id;
    
    switch (activity_type) {
      case 'Create User':
        return `Created ${entity_type} ${displayName}`;
      case 'Update User':
        return `Updated ${entity_type} ${displayName}`;
      case 'Delete User':
        return `Deleted ${entity_type} ${displayName}`;
      case 'Lock User':
        return `Locked ${entity_type} ${displayName}`;
      case 'Unlock User':
        return `Unlocked ${entity_type} ${displayName}`;
      case 'Assign Marketers to Admin':
        return `Assigned marketers to Admin ${displayName}`;
      case 'Assign Admins to Super Admin':
        return `Assigned admins to Super Admin ${displayName}`;
      case 'Unassign Marketers from Admin':
        return `Unassigned marketers from Admin ${displayName}`;
      case 'Unassign Admins from Super Admin':
        return `Unassigned admins from Super Admin ${displayName}`;
      case 'Update Profile':
        return `Updated profile`;
      case 'Register Master Admin':
        return `Registered new Master Admin ${displayName}`;
      case 'Register Super Admin':
        return `Registered new Super Admin ${displayName}`;
      default:
        return `${activity_type} ${entity_type} ${displayName}`;
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

  // Real-time socket updates
  useEffect(() => {
    if (!user || !userRole) return;

    const socket = io(import.meta.env.VITE_API_URL, { transports: ["websocket"] });
    
    let eventName = "";
    switch (userRole) {
      case "masteradmin":
        eventName = "real-time-stats";
        break;
      case "superadmin":
        eventName = "superadmin-stats";
        break;
      case "admin":
        eventName = "admin-stats";
        break;
      case "dealer":
        eventName = "dealer-stats";
        break;
      case "marketer":
        eventName = "marketer-stats";
        break;
      default:
        eventName = "real-time-stats";
    }

    socket.on(eventName, (data) => {
      setStats(data);
    });

    return () => socket.disconnect();
  }, [userRole, user]);

  // Remove the second useEffect that was causing the redirect loop
  // The user state will be set by the first useEffect, and we don't need to redirect again

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const greeting = getGreeting();

  // Helper: compact NGN currency to keep large values inside cards
  const formatCurrencyCompact = (amount) => {
    try {
      const value = Number(amount || 0);
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 2
      }).format(value);
    } catch {
      return `₦${(amount || 0).toString()}`;
    }
  };

  // Role configuration with all existing modules and features
  const roleConfig = {
    masteradmin: {
      title: "Master Admin Dashboard",
      modules: [
        { key: "overview", label: "Overview", icon: Home, component: null }, // Overview handled directly in dashboard
        { key: "profile", label: "Profile", icon: User, component: ProfileUpdate },
        { key: "users", label: "User Management", icon: UsersIcon, component: UsersManagement },
        { key: "profit", label: "Profit Report", icon: TrendingUp, component: ProfitReport },
        { key: "wallet", label: "Wallet", icon: WalletIcon, component: MasterAdminWallet },
        { key: "performance", label: "Performance", icon: BarChart3, component: Performance },
        { key: "stock", label: "Stock Update", icon: Package, component: StockUpdate },
        { key: "verification", label: "Verification", icon: CheckCircle, component: Verification },
        { key: "assign", label: "Assign Users", icon: UsersIcon, component: AssignUsers },
        { key: "product", label: "Products", icon: Package, component: Product },
        { key: "manage-orders", label: "Manage Orders", icon: ShoppingCart, component: ManageOrders },
        { key: "messages", label: "Messages", icon: MessageSquare, component: Messaging },
        { key: "submissions", label: "Submissions", icon: ClipboardList, component: Submissions }
      ],
      getMetrics: () => [
        { 
          label: "Total Users", 
          value: stats.totalUsers?.toLocaleString() || "0", 
          change: computeChange(stats.totalUsers, stats.previousTotalUsers).text, 
          trend: (stats.totalUsers > stats.previousTotalUsers) ? "up" : (stats.totalUsers < stats.previousTotalUsers ? "down" : "flat"), 
          icon: UsersIcon, 
          color: "blue" 
        },
        { 
          label: "Pending Orders", 
          value: stats.totalPendingOrders?.toLocaleString() || "0", 
          change: computeChange(stats.totalPendingOrders, stats.previousPendingOrders).text, 
          trend: (stats.totalPendingOrders > stats.previousPendingOrders) ? "up" : (stats.totalPendingOrders < stats.previousPendingOrders ? "down" : "flat"), 
          icon: Clock, 
          color: "orange" 
        },
        { 
          label: "Confirmed Orders", 
          value: stats.totalConfirmedOrders?.toLocaleString() || "0", 
          change: computeChange(stats.totalConfirmedOrders, stats.previousConfirmedOrders).text, 
          trend: (stats.totalConfirmedOrders > stats.previousConfirmedOrders) ? "up" : (stats.totalConfirmedOrders < stats.previousConfirmedOrders ? "down" : "flat"), 
          icon: CheckCircle, 
          color: "green" 
        },
        { 
          label: "Total Sales", 
          value: formatCurrencyCompact(stats.totalSales), 
          change: computeChange(stats.totalSales, stats.previousSales).text, 
          trend: (Number(stats.totalSales||0) > Number(stats.previousSales||0)) ? "up" : (Number(stats.totalSales||0) < Number(stats.previousSales||0) ? "down" : "flat"), 
          icon: BarChart2, 
          color: "purple" 
        },
        { 
          label: "Available Products", 
          value: stats.totalAvailableProducts?.toLocaleString() || "0", 
          change: computeChange(stats.totalAvailableProducts, stats.previousAvailableProducts).text, 
          trend: (stats.totalAvailableProducts > stats.previousAvailableProducts) ? "up" : (stats.totalAvailableProducts < stats.previousAvailableProducts ? "down" : "flat"), 
          icon: Box, 
          color: "indigo" 
        },
        { 
          label: "Pending Verification", 
          value: stats.pendingVerification?.toLocaleString() || "0", 
          change: computeChange(stats.pendingVerification, stats.previousPendingVerification).text, 
          trend: (stats.pendingVerification > stats.previousPendingVerification) ? "up" : (stats.pendingVerification < stats.previousPendingVerification ? "down" : "flat"), 
          icon: ClipboardList, 
          color: "yellow" 
        },
        { 
          label: "Pickup Stocks", 
          value: stats.totalPickupStocks?.toLocaleString() || "0", 
          change: computeChange(stats.totalPickupStocks, stats.previousPickupStocks).text, 
          trend: (stats.totalPickupStocks > stats.previousPickupStocks) ? "up" : (stats.totalPickupStocks < stats.previousPickupStocks ? "down" : "flat"), 
          icon: Package, 
          color: "teal" 
        }
      ]
    },
    superadmin: {
      title: "Super Admin Dashboard",
      modules: [
        { key: "overview", label: "Overview", icon: Home, component: null }, // Overview handled directly in dashboard
        { key: "account-settings", label: "Account Settings", icon: User, component: ProfileUpdate },
        { key: "stock", label: "Stock Pickups", icon: Package, component: SuperAdminStockPickups },
        { key: "manage-orders", label: "Manage Orders", icon: ClipboardList, component: SuperAdminManageOrders },
        { key: "wallet", label: "Wallet", icon: WalletIcon, component: SuperAdminWallet },
        { key: "messages", label: "Messages", icon: MessageSquare, component: Messaging },
        { key: "verification", label: "Verification", icon: CheckCircle, component: Verification },
        { key: "submissions", label: "Submissions", icon: FileText, component: Submissions },
        { key: "assigned", label: "Assigned Users", icon: UserPlus, component: AssignUsers }
      ],
      getMetrics: () => [
        { 
          label: "Assigned Users", 
          value: stats.assignedUsers.toLocaleString(), 
          change: computeChange(stats.assignedUsers, stats.previousAssignedUsers).text, 
          trend: stats.assignedUsers > stats.previousAssignedUsers ? "up" : "down", 
          icon: UsersIcon, 
          color: "blue" 
        },
        { 
          label: "Stock Pickups", 
          value: stats.totalPickupStocks.toLocaleString(), 
          change: computeChange(stats.totalPickupStocks, stats.previousPickupStocks).text, 
          trend: stats.totalPickupStocks > stats.previousPickupStocks ? "up" : "down", 
          icon: Package, 
          color: "green" 
        },
        { 
          label: "Pending Orders", 
          value: stats.totalPendingOrders.toLocaleString(), 
          change: computeChange(stats.totalPendingOrders, stats.previousPendingOrders).text, 
          trend: stats.totalPendingOrders > stats.previousPendingOrders ? "up" : "down", 
          icon: ShoppingCart, 
          color: "purple" 
        },
        { 
          label: "Verifications", 
          value: stats.pendingVerification.toLocaleString(), 
          change: computeChange(stats.pendingVerification, stats.previousPendingVerification).text, 
          trend: stats.pendingVerification > stats.previousPendingVerification ? "up" : "down", 
          icon: CheckCircle, 
          color: "orange" 
        }
      ]
    },
    admin: {
      title: "Admin Dashboard",
      modules: [
        { key: "overview", label: "Overview", icon: Home, component: null }, // Overview handled directly in dashboard
        { key: "profile", label: "Profile", icon: User, component: ProfileUpdate },
        { key: "manage-orders", label: "Manage Orders", icon: ClipboardList, component: ManageOrders },
        { key: "stock", label: "Stock Pickups", icon: Package, component: AdminStockPickups },
        { key: "marketers", label: "Assigned Marketers", icon: UsersIcon, component: AssignUsers },
        { key: "messages", label: "Messages", icon: MessageSquare, component: Messaging },
        { key: "submissions", label: "Submissions", icon: FileText, component: Submissions },
        { key: "verification", label: "Verification", icon: CheckCircle, component: Verification },
        { key: "wallet", label: "Wallet", icon: WalletIcon, component: AdminWallet }
      ],
      getMetrics: () => [
        { 
          label: "Assigned Marketers", 
          value: stats.assignedMarketers.toLocaleString(), 
          change: computeChange(stats.assignedMarketers, stats.previousAssignedMarketers).text, 
          trend: stats.assignedMarketers > stats.previousAssignedMarketers ? "up" : "down", 
          icon: UsersIcon, 
          color: "blue" 
        },
        { 
          label: "Stock Pickups", 
          value: stats.totalPickupStocks.toLocaleString(), 
          change: computeChange(stats.totalPickupStocks, stats.previousPickupStocks).text, 
          trend: stats.totalPickupStocks > stats.previousPickupStocks ? "up" : "down", 
          icon: Package, 
          color: "green" 
        },
        { 
          label: "Pending Orders", 
          value: stats.totalPendingOrders.toLocaleString(), 
          change: computeChange(stats.totalPendingOrders, stats.previousPendingOrders).text, 
          trend: stats.totalPendingOrders > stats.previousPendingOrders ? "up" : "down", 
          icon: ShoppingCart, 
          color: "purple" 
        },
        { 
          label: "Verifications", 
          value: stats.pendingVerification.toLocaleString(), 
          change: computeChange(stats.pendingVerification, stats.previousPendingVerification).text, 
          trend: stats.pendingVerification > stats.previousPendingVerification ? "up" : "down", 
          icon: CheckCircle, 
          color: "orange" 
        }
      ]
    },
    dealer: {
      title: "Dealer Dashboard",
      modules: [
        { key: "overview", label: "Overview", icon: Home, component: null }, // Overview handled directly in dashboard
        { key: "profile", label: "Profile", icon: User, component: ProfileUpdate },
        { key: "manage-orders", label: "Manage Orders", icon: ClipboardList, component: ManageOrders }
      ],
      getMetrics: () => [
        { 
          label: "Total Orders", 
          value: (stats.totalPendingOrders + stats.totalConfirmedOrders).toLocaleString(), 
          change: computeChange(stats.totalPendingOrders + stats.totalConfirmedOrders, stats.previousPendingOrders + stats.previousConfirmedOrders).text, 
          trend: (stats.totalPendingOrders + stats.totalConfirmedOrders) > (stats.previousPendingOrders + stats.previousConfirmedOrders) ? "up" : "down", 
          icon: ShoppingCart, 
          color: "green" 
        },
        { 
          label: "Completed Orders", 
          value: stats.totalConfirmedOrders.toLocaleString(), 
          change: computeChange(stats.totalConfirmedOrders, stats.previousConfirmedOrders).text, 
          trend: stats.totalConfirmedOrders > stats.previousConfirmedOrders ? "up" : "down", 
          icon: CheckCircle, 
          color: "blue" 
        },
        { 
          label: "Revenue", 
          value: formatCurrencyCompact(stats.totalSales), 
          change: computeChange(stats.totalSales, stats.previousSales).text, 
          trend: stats.totalSales > stats.previousSales ? "up" : "down", 
          icon: () => <span className="text-xl font-bold">₦</span>, 
          color: "purple" 
        },
        { 
          label: "Pending Orders", 
          value: stats.totalPendingOrders.toLocaleString(), 
          change: computeChange(stats.totalPendingOrders, stats.previousPendingOrders).text, 
          trend: stats.totalPendingOrders > stats.previousPendingOrders ? "up" : "down", 
          icon: Activity, 
          color: "orange" 
        }
      ]
    },
    marketer: {
      title: "Marketer Dashboard",
      modules: [
        { key: "overview", label: "Overview", icon: Home, component: null }, // Overview handled directly in dashboard
        { key: "account-settings", label: "Account Settings", icon: User, component: ProfileUpdate },
        { key: "verification", label: "Verification", icon: CheckCircle, component: VerificationMarketer },
        { key: "stock-pickup", label: "Stock Pickup", icon: Package, component: MarketerStockPickup },
        { key: "order", label: "Order", icon: ShoppingCart, component: Order },
        { key: "wallet", label: "Wallet", icon: WalletIcon, component: Wallet },
        { key: "messages", label: "Messages", icon: MessageSquare, component: Messaging }
      ],
      getMetrics: () => [
        { 
          label: "Verification Status", 
          value: user?.overall_verification_status === "approved" ? "Approved" : "Pending", 
          change: user?.overall_verification_status === "approved" ? "✓" : "⏳", 
          trend: user?.overall_verification_status === "approved" ? "up" : "pending", 
          icon: CheckCircle, 
          color: user?.overall_verification_status === "approved" ? "green" : "orange" 
        },
        { 
          label: "Stock Pickups", 
          value: stats.totalPickupStocks.toLocaleString(), 
          change: computeChange(stats.totalPickupStocks, stats.previousPickupStocks).text, 
          trend: stats.totalPickupStocks > stats.previousPickupStocks ? "up" : "down", 
          icon: Package, 
          color: "blue" 
        },
        { 
          label: "Orders", 
          value: (stats.totalPendingOrders + stats.totalConfirmedOrders).toLocaleString(), 
          change: computeChange(stats.totalPendingOrders + stats.totalConfirmedOrders, stats.previousPendingOrders + stats.previousConfirmedOrders).text, 
          trend: (stats.totalPendingOrders + stats.totalConfirmedOrders) > (stats.previousPendingOrders + stats.previousConfirmedOrders) ? "up" : "down", 
          icon: ShoppingCart, 
          color: "purple" 
        },
        { 
          label: "Wallet Balance", 
          value: formatCurrencyCompact(stats.walletBalance), 
          change: computeChange(stats.walletBalance, stats.previousWalletBalance).text, 
          trend: stats.walletBalance > stats.previousWalletBalance ? "up" : "down", 
          icon: WalletIcon, 
          color: "green" 
        }
      ]
    }
  };

  const config = roleConfig[userRole] || roleConfig.masteradmin;
  
  console.log("Role config for", userRole, ":", config);
  console.log("Available roles:", Object.keys(roleConfig));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  const renderModule = () => {
    const module = config.modules.find(m => m.key === activeModule);
    if (!module) return null;

    const Component = module.component;
    return <Component isDarkMode={isDarkMode} />;
  };

  // Quick actions (role-specific)
  const getQuickActions = () => {
    switch (userRole) {
      case "masteradmin":
        return [
          { icon: <UsersIcon className="h-5 w-5" />, label: "Add User", color: "blue", action: () => setActiveModule("users") },
          { icon: <Package className="h-5 w-5" />, label: "New Order", color: "green", action: () => setActiveModule("manage-orders") },
          { icon: <BarChart3 className="h-5 w-5" />, label: "Analytics", color: "purple", action: () => setActiveModule("performance") },
          { icon: <Settings className="h-5 w-5" />, label: "Settings", color: "gray", action: () => setActiveModule("profile") }
        ];
      case "superadmin":
        return [
          { icon: <Package className="h-5 w-5" />, label: "Stock Pickups", color: "blue", action: () => setActiveModule("stock") },
          { icon: <ClipboardList className="h-5 w-5" />, label: "Manage Orders", color: "green", action: () => setActiveModule("manage-orders") },
          { icon: <UserPlus className="h-5 w-5" />, label: "Assign Users", color: "purple", action: () => setActiveModule("assigned") },
          { icon: <Settings className="h-5 w-5" />, label: "Settings", color: "gray", action: () => setActiveModule("account-settings") }
        ];
      case "admin":
        return [
          { icon: <ClipboardList className="h-5 w-5" />, label: "Manage Orders", color: "blue", action: () => setActiveModule("manage-orders") },
          { icon: <Package className="h-5 w-5" />, label: "Stock Pickups", color: "green", action: () => setActiveModule("stock") },
          { icon: <UsersIcon className="h-5 w-5" />, label: "Assigned Marketers", color: "purple", action: () => setActiveModule("marketers") },
          { icon: <Settings className="h-5 w-5" />, label: "Settings", color: "gray", action: () => setActiveModule("profile") }
        ];
      case "dealer":
        return [
          { icon: <ClipboardList className="h-5 w-5" />, label: "Manage Orders", color: "blue", action: () => setActiveModule("manage-orders") },
          { icon: <Settings className="h-5 w-5" />, label: "Settings", color: "green", action: () => setActiveModule("profile") }
        ];
      case "marketer":
        return [
          { icon: <CheckCircle className="h-5 w-5" />, label: "Verification", color: "blue", action: () => setActiveModule("verification") },
          { icon: <Package className="h-5 w-5" />, label: "Stock Pickup", color: "green", action: () => setActiveModule("stock-pickup") },
          { icon: <ShoppingCart className="h-5 w-5" />, label: "Order", color: "purple", action: () => setActiveModule("order") },
          { icon: <Settings className="h-5 w-5" />, label: "Settings", color: "gray", action: () => setActiveModule("account-settings") }
        ];
      default:
        return [
          { icon: <UsersIcon className="h-5 w-5" />, label: "Add User", color: "blue", action: () => setActiveModule("users") },
          { icon: <Package className="h-5 w-5" />, label: "New Order", color: "green", action: () => setActiveModule("manage-orders") },
          { icon: <BarChart3 className="h-5 w-5" />, label: "Analytics", color: "purple", action: () => setActiveModule("performance") },
          { icon: <Settings className="h-5 w-5" />, label: "Settings", color: "gray", action: () => setActiveModule("profile") }
        ];
    }
  };

  const quickActions = getQuickActions();

  // Helper functions (preserved from existing)
  const getActivityIcon = (type) => {
    if (!type) return <Activity className="h-4 w-4" />;
    
    const normalizedType = type.toLowerCase();
    switch (normalizedType) {
      case "user":
      case "admin":
      case "marketer":
      case "superadmin":
      case "masteradmin":
      case "dealer":
        return <UsersIcon className="h-4 w-4" />;
      case "order":
        return <Package className="h-4 w-4" />;
      case "payment":
        return <DollarSign className="h-4 w-4" />;
      case "product":
        return <Package className="h-4 w-4" />;
      default: 
        return <Activity className="h-4 w-4" />;
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

  const getMetricColor = (color) => {
    const colors = {
      blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      green: "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400",
      purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
      orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
      indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
      yellow: "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
      teal: "bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400"
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''} bg-background text-foreground`}>
      {isLoading ? (
        <div className="flex justify-center items-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600 dark:text-gray-300">Loading dashboard...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Top Navigation Bar */}
          <nav className={`border-b transition-colors duration-200 bg-card border-border`}>
            <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4">
              {/* Left side - Logo and Title */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f59e0b' }}>
                    <span className="text-black font-bold text-sm">V</span>
                  </div>
                  <h1 className={`text-xl font-bold transition-colors duration-200 text-foreground hidden sm:block`}>Vistapro</h1>
                </div>
                <Separator orientation="vertical" className="h-6 hidden sm:block" />
                <h2 className={`text-sm sm:text-lg font-semibold transition-colors duration-200 text-muted-foreground hidden sm:block truncate max-w-[50vw]`}>{config.title}</h2>
              </div>

              {/* Right side - Search, Notifications, User Menu */}
              <div className="flex items-center space-x-4">
                {/* Search Bar */}
                <div className="relative hidden md:block">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors duration-200 text-muted-foreground`} />
                  <Input
                    placeholder="Search..."
                    className={`pl-10 w-64 bg-background text-foreground placeholder-muted-foreground border border-border focus:ring-2 focus:ring-ring transition-colors duration-200`}
                  />
                </div>

                {/* Dark Mode Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleDarkMode}
                  className={`p-2 transition-colors duration-200 hover:bg-muted text-foreground`}
                >
                  {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>

                {/* Notification Bell */}
                <NotificationBell />

                {/* User Menu */}
                <AvatarDropdown user={user} onLogout={handleLogout} />
              </div>
            </div>
          </nav>

          <div className="flex w-full">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r transform transition-all duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0 flex-shrink-0 bg-card border-border`}>
              <div className={`flex items-center justify-between p-6 border-b transition-colors duration-200 border-border`}>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.profile_image ? `${import.meta.env.VITE_API_URL}/uploads/${String(user.profile_image).split(/[\\/]/).pop()}` : undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user?.first_name?.[0] || user?.email?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className={`text-sm font-medium transition-colors duration-200 text-foreground`}>
                      {greeting}, {user?.first_name || 'User'}!
                    </p>
                    <p className={`text-xs transition-colors duration-200 text-muted-foreground`}>
                      {user?.role || 'User'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden p-1"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Navigation Menu */}
              <nav className="p-4 space-y-2">
                {config.modules.map((module) => {
                  const Icon = module.icon;
                  const isActive = activeModule === module.key;
                   
                  return (
                    <Button
                      key={module.key}
                      variant={isActive ? "default" : "ghost"}
                      className={`w-full justify-start space-x-3 transition-all duration-200 ${
                        isActive 
                          ? 'bg-primary text-primary-foreground hover:brightness-95' 
                          : 'hover:bg-muted text-foreground'
                      }`}
                      onClick={() => setActiveModule(module.key)}
                    >
                      {typeof Icon === 'function' ? <Icon /> : <Icon className="h-5 w-5" />}
                      <span>{module.label}</span>
                    </Button>
                  );
                })}
              </nav>

              {/* Logout Button */}
              <div className={`absolute bottom-0 left-0 right-0 p-4 border-t transition-colors duration-200 border-border`}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start space-x-3 transition-colors duration-200 text-destructive hover:text-destructive hover:bg-destructive/10`}
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </Button>
              </div>
            </aside>

            {/* Main Content */}
            <main
              className={`flex-1 w-full min-w-0 transition-colors duration-200 bg-background ${sidebarOpen ? 'ml-64 lg:ml-0' : ''}`}
            >
              {/* Mobile Menu Button */}
              <div className="lg:hidden p-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="p-2"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </div>

              {/* Content Area */}
              <div className="px-6 py-4 lg:py-6 w-full flex flex-col flex-1">
                {activeModule === "overview" ? (
                  // Overview Content
                  <div className="w-full space-y-6 flex-1" key="overview-content">
                    {/* Welcome Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 w-full">
                      <div className="space-y-1">
                        <h1 className={`text-2xl sm:text-3xl font-bold transition-colors duration-200 text-foreground`}>
                          Welcome back, {user?.first_name || 'User'}!
                        </h1>
                        <p className={`transition-colors duration-200 text-muted-foreground`}>
                          Here's what's happening with your {userRole} account today.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <Button variant="outline" size="sm" className="space-x-2 whitespace-nowrap px-2">
                          <Download className="h-4 w-4" />
                          <span className="hidden sm:inline">Export Report</span>
                        </Button>
                        <Button size="sm" className="space-x-2 whitespace-nowrap px-2">
                          <Plus className="h-4 w-4" />
                          <span className="hidden sm:inline">Quick Action</span>
                        </Button>
                      </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-3 gap-4 w-full">
                      {(() => {
                        // Safety check - ensure stats are loaded
                        if (!stats || Object.keys(stats).length === 0) {
                          console.log("Stats not ready yet, showing loading state");
                          return (
                            <div className="col-span-4 text-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                              <p className="text-gray-500">Loading dashboard data...</p>
                            </div>
                          );
                        }
                        
                        const metrics = config.getMetrics();
                        console.log("Generated metrics:", metrics);
                        console.log("Current stats:", stats);
                        
                        return metrics.map((metric, index) => {
                          const Icon = metric.icon;
                          const isPositive = metric.trend === "up";
                          
                          console.log(`Metric ${index}:`, metric);
                          
                          return (
                            <Card key={index} className={`border border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 w-full bg-card`}>
                              <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                  <div className={`p-3 rounded-xl ${getMetricColor(metric.color)}`}>
                                    {typeof Icon === 'function' ? <Icon /> : <Icon className="h-6 w-6" />}
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
                                  <p className={`text-3xl font-bold transition-colors duration-200 whitespace-nowrap overflow-hidden text-ellipsis text-foreground`}>
                                    {metric.value}
                                  </p>
                                  <p className={`text-sm font-medium transition-colors duration-200 text-muted-foreground`}>
                                    {metric.label}
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        });
                      })()}
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 w-full">
                      {/* Recent Activity */}
                      <div className="xl:col-span-8">
                        <Card className={`border border-border shadow-lg w-full transition-colors duration-200 bg-card`}>
                          <CardHeader className="pb-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <div className="flex items-center space-x-2">
                                <ClipboardList className={`h-5 w-5 transition-colors duration-200 text-muted-foreground`} />
                                <CardTitle className={`text-lg font-bold transition-colors duration-200 text-foreground`}>Recent Activity</CardTitle>
                              </div>
                              <div className="flex items-center flex-wrap gap-2">
                                <select 
                                  className={`text-xs sm:text-sm border rounded-md px-2 py-1 transition-colors duration-200 bg-background border-border text-foreground`}
                                  value={dateFilter}
                                  onChange={(e) => setDateFilter(e.target.value)}
                                >
                                  <option>All Time</option>
                                  <option>Last 7 Days</option>
                                  <option>Last 30 Days</option>
                                </select>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="px-2"
                                  onClick={() => setActiveModule('wallet')}
                                >
                                  Go to Approvals
                                </Button>
                                <Button size="sm" className="px-2" onClick={() => {
                                  try {
                                    const url = new URL(`${import.meta.env.VITE_API_URL}/api/master-admin/recent-activity`);
                                    url.searchParams.set('limit', '200');
                                    url.searchParams.set('format', 'csv');
                                    const a = document.createElement('a');
                                    a.href = url.toString();
                                    a.download = 'recent_activity.csv';
                                    document.body.appendChild(a);
                                    a.click();
                                    a.remove();
                                  } catch (e) {
                                    console.error('Failed to download report', e);
                                  }
                                }}>Download Report</Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {recentActivity.length > 0 ? (
                                recentActivity.map((activity) => (
                                  <div key={activity.id} className={`flex items-start sm:items-center gap-3 sm:gap-4 p-3 rounded-lg transition-all duration-200 hover:bg-muted`}> 
                                    <div className={`p-2 rounded-lg shrink-0 ${getActivityBgColor(activity.entity_type, activity.status)}`}>
                                      {getActivityIcon(activity.entity_type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm font-medium transition-colors duration-200 text-foreground break-words`}> 
                                        <span className="truncate inline-block max-w-[60vw] sm:max-w-none align-middle">{activity.action} • {activity.entity_type} {activity.entity_id || ''}</span>
                                      </p>
                                      <p className={`text-xs transition-colors duration-200 text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis`}> 
                                        by {activity.actor_name || 'Unknown User'} • {formatActivityDate(activity.timestamp)}
                                      </p>
                                    </div>
                                    <Badge 
                                      variant="secondary" 
                                      className={`${
                                        activity.status === "success" ? "bg-green-100 text-green-700" :
                                        activity.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                                        "bg-blue-100 text-blue-700"
                                      } inline-flex shrink-0`}
                                    >
                                      {activity.status}
                                    </Badge>
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-8">
                                  <p className={`text-muted-foreground transition-colors duration-200`}>
                                    No recent activity found
                                  </p>
                                </div>
                              )}
                              {/* Pagination Controls */}
                              <div className="flex items-center justify-between pt-2">
                                <p className={`text-xs text-muted-foreground`}>
                                  Showing {recentActivity.length} of {activityTotal || '...'}
                                  {activityTotal > 0 && (
                                    <span> • Page {activityPage + 1} of {Math.ceil((activityTotal || 0) / activityLimit)}</span>
                                  )}
                                </p>
                                <div className="space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={activityPage === 0}
                                    onClick={() => setActivityPage(p => Math.max(0, p - 1))}
                                  >
                                    Prev
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!activityTotal || (activityPage + 1) * activityLimit >= activityTotal}
                                    onClick={() => setActivityPage(p => p + 1)}
                                  >
                                    Next
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Quick Actions */}
                      <div className="xl:col-span-4">
                        <Card className={`border border-border shadow-lg w-full transition-colors duration-200 bg-card`}>
                          <CardHeader className="pb-4">
                            <div className="flex items-center space-x-2">
                              <Target className={`h-5 w-5 transition-colors duration-200 text-muted-foreground`} />
                              <CardTitle className={`text-lg font-bold transition-colors duration-200 text-foreground`}>Quick Actions</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-2">
                              {quickActions.map((action, index) => (
                                <Button
                                  key={index}
                                  variant="outline"
                                  className="h-20 flex-col space-y-2 hover:shadow-md transition-all"
                                  onClick={action.action}
                                >
                                  <div className={`p-2 rounded-lg bg-${action.color}-50 text-${action.color}-600`}>
                                    {action.icon}
                                  </div>
                                  <span className="text-xs font-medium">{action.label}</span>
                                </Button>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                  </div>
                ) : (
                  // Other Module Content
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className={`text-3xl font-bold transition-colors duration-200 text-foreground`}>
                          {config.modules.find(m => m.key === activeModule)?.label}
                        </h1>
                        <p className={`transition-colors duration-200 mt-2 text-muted-foreground`}>
                          Manage your {activeModule} settings and configurations.
                        </p>
                      </div>
                    </div>
                    
                    {renderModule()}
                  </div>
                )}
              </div>
            </main>
          </div>

          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ModernUnifiedDashboard;