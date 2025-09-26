import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useTheme } from "next-themes";
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
  Box,
  Shield
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
import TargetManagement from "./TargetManagement";
import UserAssignmentManagement from "./UserAssignmentManagement";
import StockUpdate from "./StockUpdate";
import Verification from "./Verification";
import SuperAdminAssignedUsers from "./SuperAdminAssignedUsers";
import Product from "./Product";
import ManageOrders from "./ManageOrders";
import SuperAdminManageOrders from "./SuperAdminManageOrders";
import Messaging from "./Messaging";
import NotificationBell from "./NotificationBell";
import VerificationMarketer from "./VerificationMarketer";
import Submissions from "./Submissions";
import AdminSubmissionsNew from "./AdminSubmissionsNew";
import SuperAdminSubmissionsNew from "./SuperAdminSubmissionsNew";
import MasterAdminSubmissions from "./MasterAdminSubmissions";
import MasterAdminStockPickups from "./MasterAdminStockPickups";
import MasterAdminBlockedAccounts from "./MasterAdminBlockedAccounts";
import MarketerAssignment from "./MarketerAssignment";

// Import overview components
import MasterAdminOverview from "./MasterAdminOverview";
import SuperAdminOverview from "./SuperAdminOverview";
import AdminOverview from "./AdminOverview";
import DealerOverview from "./DealerOverview";
import MarketerOverview from "./MarketerOverview";
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
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeModule, setActiveModule] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("All Time");
  
  // Derived state for dark mode
  const isDarkMode = theme === 'dark';
  
  // Debug theme state
  console.log('🌙 Theme state:', { theme, isDarkMode, documentClass: document.documentElement.className });
  
  // Get user data from localStorage
  const [user, setUser] = useState(null);
  
  // Initialize theme on mount
  useEffect(() => {
    // Set default theme if none is set
    if (!theme) {
      console.log('🌙 Initializing theme to light');
      setTheme('light');
    } else {
      console.log('🌙 Current theme:', theme);
    }
  }, [theme, setTheme]);
  
  // Force dark class on document when theme changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      console.log('🌙 Applied dark class to document');
    } else {
      document.documentElement.classList.remove('dark');
      console.log('🌙 Removed dark class from document');
    }
  }, [theme]);
  
  // Force light class on mount
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    console.log('🌙 Force applied light class on mount');
  }, []);
  
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
        { key: "target-management", label: "Target Management", icon: Target, component: TargetManagement },
        { key: "user-assignments", label: "User Assignments", icon: UsersIcon, component: UserAssignmentManagement },
        { key: "stock", label: "Stock Update", icon: Package, component: StockUpdate },
        { key: "verification", label: "Verification", icon: CheckCircle, component: Verification },
          { key: "submissions", label: "Submissions", icon: FileText, component: MasterAdminSubmissions },
          { key: "stock-pickups", label: "Stock Pickups", icon: Package, component: MasterAdminStockPickups },
          { key: "blocked-accounts", label: "Blocked Accounts", icon: Shield, component: MasterAdminBlockedAccounts },
        { key: "marketer-assignment", label: "Marketer Assignment", icon: UserPlus, component: MarketerAssignment },
        { key: "product", label: "Products", icon: Package, component: Product },
        { key: "manage-orders", label: "Manage Orders", icon: ShoppingCart, component: ManageOrders },
        { key: "messages", label: "Messages", icon: MessageSquare, component: Messaging },
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
        { key: "submissions", label: "Submissions", icon: FileText, component: SuperAdminSubmissionsNew },
        { key: "assigned", label: "Assigned Users", icon: UserPlus, component: SuperAdminAssignedUsers }
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
        { key: "marketers", label: "Assigned Marketers", icon: UsersIcon, component: UserAssignmentManagement },
        { key: "submissions", label: "Submissions", icon: FileText, component: AdminSubmissionsNew },
        { key: "messages", label: "Messages", icon: MessageSquare, component: Messaging },
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

  const toggleDarkMode = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    console.log('🌙 Theme toggle:', { currentTheme: theme, newTheme });
    setTheme(newTheme);
  };

  const renderModule = () => {
    const module = config.modules.find(m => m.key === activeModule);
    if (!module) return null;

    const Component = module.component;
    return <Component isDarkMode={isDarkMode} onNavigate={setActiveModule} />;
  };

  // Quick actions (role-specific)
  const getQuickActions = () => {
    switch (userRole) {
      case "masteradmin":
        return [
          { icon: <UsersIcon className="h-5 w-5" />, label: "Add User", color: "blue", action: () => setActiveModule("users") },
          { icon: <Package className="h-5 w-5" />, label: "Stock Pickups", color: "green", action: () => setActiveModule("stock-pickups") },
          { icon: <Shield className="h-5 w-5" />, label: "Blocked Accounts", color: "red", action: () => setActiveModule("blocked-accounts") },
          { icon: <BarChart3 className="h-5 w-5" />, label: "Analytics", color: "purple", action: () => setActiveModule("performance") }
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
          { icon: <ShoppingCart className="h-5 w-5" />, label: "New Order", color: "blue", action: () => setActiveModule("order") },
          { icon: <CheckCircle className="h-5 w-5" />, label: "Verification Status", color: "green", action: () => setActiveModule("verification") },
          { icon: <WalletIcon className="h-5 w-5" />, label: "Check Wallet", color: "purple", action: () => setActiveModule("wallet") },
          { icon: <Package className="h-5 w-5" />, label: "Stock Pickup", color: "orange", action: () => setActiveModule("stock-pickup") }
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
    <div className={`min-h-screen bg-background text-foreground ${isDarkMode ? 'dark' : ''}`}>
      {isLoading ? (
        <div className="flex justify-center items-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-muted-foreground">Loading dashboard...</p>
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
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r transform transition-all duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0 flex-shrink-0 bg-card border-border flex flex-col`}>
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
                    <p className={`text-xs transition-colors duration-200 text-muted-foreground`}>
                      ID: {user?.unique_id || 'N/A'}
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
              <div className={`mt-auto p-4 border-t transition-colors duration-200 border-border`}>
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
                  // Role-specific Overview Components
                  (() => {
                    switch (userRole) {
                      case 'masteradmin':
                        return <MasterAdminOverview onNavigate={setActiveModule} isDarkMode={isDarkMode} />;
                      case 'superadmin':
                        return <SuperAdminOverview onNavigate={setActiveModule} isDarkMode={isDarkMode} />;
                      case 'admin':
                        return <AdminOverview onNavigate={setActiveModule} isDarkMode={isDarkMode} />;
                      case 'dealer':
                        return <DealerOverview onNavigate={setActiveModule} isDarkMode={isDarkMode} />;
                      case 'marketer':
                        return <MarketerOverview onNavigate={setActiveModule} isDarkMode={isDarkMode} />;
                      default:
                        return <div className="text-center py-8">Unknown role: {userRole}</div>;
                    }
                  })()
                ) : (
                  // Other Module Content
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        {activeModule !== 'performance' && activeModule !== 'user-assignments' && activeModule !== 'wallet' && (
                          <h1 className={`text-3xl font-bold transition-colors duration-200 text-foreground`}>
                            {config.modules.find(m => m.key === activeModule)?.label}
                          </h1>
                        )}
                        {activeModule !== 'performance' && activeModule !== 'user-assignments' && activeModule !== 'submissions' && activeModule !== 'wallet' && (
                          <p className={`transition-colors duration-200 mt-2 text-muted-foreground`}>
                            {activeModule === 'account-settings' 
                              ? `Manage your ${userRole} profile and preferences`
                              : `Manage your ${activeModule} settings and configurations.`
                            }
                          </p>
                        )}
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