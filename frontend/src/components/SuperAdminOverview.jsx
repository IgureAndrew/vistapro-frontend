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
  Phone,
  MapPin,
  UserCheck
} from "lucide-react";
import api from "../api";
import VerificationNotifications from "./VerificationNotifications";

// Import reusable components
import { MetricCard } from "./common/MetricCard";
import { WelcomeSection } from "./common/WelcomeSection";
import { SectionHeader } from "./common/SectionHeader";

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
    
    // Verification Status
    pendingPhoneVerification: 0,
    completedPhoneVerification: 0,
    pendingMasterAdminApproval: 0,
    
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
      },
      
      // Verification Status Section
      {
        Icon: Phone,
        label: "Pending Phone Verification",
        value: stats.pendingPhoneVerification,
        change: "— verification status",
        color: "text-purple-600",
        section: "Verification"
      },
      {
        Icon: CheckCircle,
        label: "Completed Phone Verification",
        value: stats.completedPhoneVerification,
        change: "— verification status",
        color: "text-green-600",
        section: "Verification"
      },
      {
        Icon: UserCheck,
        label: "Pending MasterAdmin Approval",
        value: stats.pendingMasterAdminApproval,
        change: "— verification status",
        color: "text-blue-600",
        section: "Verification"
      }
    ],
    [stats]
  );

  if (loading) {
    return (
      <div className="w-full space-y-4 sm:space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  // Group cards by section for better organization
  const personalCards = cards.filter(c => c.section === "Personal");
  const teamCards = cards.filter(c => c.section === "Team");
  const operationalCards = cards.filter(c => c.section === "Operational");
  const verificationCards = cards.filter(c => c.section === "Verification");
            
            return (
    <div className="w-full space-y-4 sm:space-y-6">
      {/* Welcome Section */}
      <WelcomeSection
        title="SuperAdmin Dashboard"
        subtitle="Monitor team performance and manage assigned admins"
        gradientFrom="from-purple-50"
        gradientTo="to-blue-50"
      />

      {/* Personal Performance */}
      <div>
        <SectionHeader title="Personal Performance" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {personalCards.map((card, idx) => (
            <MetricCard
              key={idx}
              label={card.label}
              value={card.value}
              change={card.change}
              icon={card.Icon}
              iconColor={card.color}
              iconBgColor={card.color.replace('text-', 'bg-').replace('600', '100')}
            />
          ))}
        </div>
      </div>

      {/* Team Management */}
      <div>
        <SectionHeader title="Team Management" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {teamCards.map((card, idx) => (
            <MetricCard
              key={idx}
              label={card.label}
              value={card.value}
              change={card.change}
              icon={card.Icon}
              iconColor={card.color}
              iconBgColor={card.color.replace('text-', 'bg-').replace('600', '100')}
            />
          ))}
        </div>
      </div>

      {/* Operational Status */}
      <div>
        <SectionHeader title="Operational Status" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {operationalCards.map((card, idx) => (
            <MetricCard
              key={idx}
              label={card.label}
              value={card.value}
              change={card.change}
              icon={card.Icon}
              iconColor={card.color}
              iconBgColor={card.color.replace('text-', 'bg-').replace('600', '100')}
            />
          ))}
                </div>
              </div>
              
      {/* Verification Status */}
      <div>
        <SectionHeader title="Verification Status" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {verificationCards.map((card, idx) => (
            <MetricCard
              key={idx}
              label={card.label}
              value={card.value}
              change={card.change}
              icon={card.Icon}
              iconColor={card.color}
              iconBgColor={card.color.replace('text-', 'bg-').replace('600', '100')}
            />
          ))}
                </div>
              </div>
              
      {/* Wallet Summary */}
      {wallet?.breakdown && (
        <div>
          <SectionHeader title="Wallet Summary" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            <MetricCard
              label="Available Balance"
              value={`₦${(wallet.available_balance || 0).toLocaleString()}`}
              icon={Wallet}
              iconColor="text-green-600"
              iconBgColor="bg-green-100"
            />
            <MetricCard
              label="Withheld Balance"
              value={`₦${(wallet.withheld_balance || 0).toLocaleString()}`}
              icon={Clock}
              iconColor="text-orange-600"
              iconBgColor="bg-orange-100"
            />
            <MetricCard
              label="Total Balance"
              value={`₦${(wallet.total_balance || 0).toLocaleString()}`}
              icon={TrendingUp}
              iconColor="text-blue-600"
              iconBgColor="bg-blue-100"
            />
              </div>
            </div>
          )}

      {/* Verification Notifications */}
      <VerificationNotifications userRole="superadmin" />
    </div>
  );
}
