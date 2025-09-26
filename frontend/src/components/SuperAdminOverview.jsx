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
      <div className="px-4 py-6 md:px-6 lg:px-12 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 md:px-6 lg:px-12 space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-100 dark:border-green-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Super Admin Dashboard 👑
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage your assigned admins and track team performance
            </p>
            </div>
          <div className="flex items-center space-x-4">
            <VerificationNotifications 
              userRole="SuperAdmin"
              userId={localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).unique_id : null}
              onNotificationClick={(notification) => {
                console.log('Notification clicked:', notification);
                // Handle notification click - could navigate to relevant page
              }}
            />
            <div className="hidden md:block">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">S</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Performance Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Personal Performance
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.filter(card => card.section === "Personal").map(({ Icon, label, value, change, color }, idx) => {
            const colorMap = {
              "text-blue-600": { bgColor: "bg-white", iconBg: "bg-blue-100" },
              "text-green-600": { bgColor: "bg-white", iconBg: "bg-green-100" },
              "text-purple-600": { bgColor: "bg-white", iconBg: "bg-purple-100" },
            };
            const { bgColor, iconBg } = colorMap[color] || { bgColor: "bg-white", iconBg: "bg-gray-100" };
            
            return (
              <div
                key={label}
                className={`${bgColor} dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`${iconBg} dark:bg-gray-700 p-3 rounded-lg`}>
                    <Icon className={`${color} dark:text-gray-300`} size={24} />
                  </div>
                  <MoreVertical className="text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300" size={20} />
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{label}</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{value}</p>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${color}`}>{change}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Team Management Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-orange-600" />
          Team Management
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.filter(card => card.section === "Team").map(({ Icon, label, value, change, color }, idx) => {
            const colorMap = {
              "text-orange-600": { bgColor: "bg-white", iconBg: "bg-orange-100" },
              "text-blue-600": { bgColor: "bg-white", iconBg: "bg-blue-100" },
              "text-indigo-600": { bgColor: "bg-white", iconBg: "bg-indigo-100" },
              "text-teal-600": { bgColor: "bg-white", iconBg: "bg-teal-100" },
            };
            const { bgColor, iconBg } = colorMap[color] || { bgColor: "bg-white", iconBg: "bg-gray-100" };
            
            return (
              <div
                key={label}
                className={`${bgColor} dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`${iconBg} dark:bg-gray-700 p-3 rounded-lg`}>
                    <Icon className={`${color} dark:text-gray-300`} size={24} />
                  </div>
                  <MoreVertical className="text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300" size={20} />
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{label}</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{value}</p>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${color}`}>{change}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Operational Status Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-600" />
          Operational Status
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.filter(card => card.section === "Operational").map(({ Icon, label, value, change, color }, idx) => {
            const colorMap = {
              "text-red-600": { bgColor: "bg-white", iconBg: "bg-red-100" },
              "text-orange-600": { bgColor: "bg-white", iconBg: "bg-orange-100" },
              "text-pink-600": { bgColor: "bg-white", iconBg: "bg-pink-100" },
            };
            const { bgColor, iconBg } = colorMap[color] || { bgColor: "bg-white", iconBg: "bg-gray-100" };
            
            return (
              <div
                key={label}
                className={`${bgColor} dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`${iconBg} dark:bg-gray-700 p-3 rounded-lg`}>
                    <Icon className={`${color} dark:text-gray-300`} size={24} />
                  </div>
                  <MoreVertical className="text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300" size={20} />
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{label}</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{value}</p>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${color}`}>{change}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Verification Status Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Verification Status
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.filter(card => card.section === "Verification").map(({ Icon, label, value, change, color }, idx) => {
              const colorMap = {
                "text-purple-600": { bgColor: "bg-white", iconBg: "bg-purple-100" },
                "text-green-600": { bgColor: "bg-white", iconBg: "bg-green-100" },
                "text-blue-600": { bgColor: "bg-white", iconBg: "bg-blue-100" },
              };
              const { bgColor, iconBg } = colorMap[color] || { bgColor: "bg-white", iconBg: "bg-gray-100" };
              
              return (
                <div
                  key={label}
                  className={`${bgColor} dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`${iconBg} dark:bg-gray-700 p-3 rounded-lg`}>
                      <Icon className={`${color} dark:text-gray-300`} size={24} />
                    </div>
                    <MoreVertical className="text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300" size={20} />
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{label}</h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{value}</p>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${color}`}>{change}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Wallet Summary and Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wallet Summary Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-green-600" />
            Wallet Summary
          </h2>
          
          {wallet.breakdown ? (
            <div className="space-y-4">
              {/* Personal Earnings */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Personal Earnings</h3>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Available</span>
                  <span className="text-sm font-semibold text-green-600">₦{wallet.breakdown.personal.available.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Withheld</span>
                  <span className="text-sm font-semibold text-orange-600">₦{wallet.breakdown.personal.withheld.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Personal</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">₦{wallet.breakdown.personal.total.toLocaleString()}</span>
                </div>
              </div>
              
              {/* Team Management */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Team Management</h3>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Available</span>
                  <span className="text-sm font-semibold text-blue-600">₦{wallet.breakdown.teamManagement.available.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Withheld</span>
                  <span className="text-sm font-semibold text-purple-600">₦{wallet.breakdown.teamManagement.withheld.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Team</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">₦{wallet.breakdown.teamManagement.total.toLocaleString()}</span>
                </div>
              </div>
              
              {/* Combined Total */}
              <div className="space-y-2 border-t border-gray-300 dark:border-gray-600 pt-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Combined Total</h3>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Available</span>
                  <span className="text-sm font-semibold text-green-600">₦{wallet.breakdown.combined.available.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Withheld</span>
                  <span className="text-sm font-semibold text-orange-600">₦{wallet.breakdown.combined.withheld.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">Grand Total</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">₦{wallet.breakdown.combined.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Balance</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">₦{wallet.total_balance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Available</span>
                <span className="text-sm font-semibold text-green-600">₦{wallet.available_balance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Withheld</span>
                <span className="text-sm font-semibold text-orange-600">₦{wallet.withheld_balance.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Recent Activities Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Recent Activities
          </h2>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {activities.length > 0 ? (
              activities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 py-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">{activity.description}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </span>
                      {activity.amount && activity.amount > 0 && (
                        <span className="text-xs font-semibold text-green-600">
                          ₦{parseFloat(activity.amount).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No recent activities</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
