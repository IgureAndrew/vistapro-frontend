// src/components/AdminOverview.jsx
import React, { useState, useEffect } from "react";
import {
  BarChart2,
  Users,
  CheckCircle,
  CheckSquare,
  Clock,
  ClipboardList,
  Package,
  MoreVertical,
  Wallet,
  TrendingUp,
  Activity,
  UserCheck,
  ShoppingCart,
  Box,
  MapPin,
  Camera,
  Phone
} from "lucide-react";
import api from "../api";
import VerificationNotifications from "./VerificationNotifications";

export default function AdminOverview({ onNavigate, isDarkMode = false }) {
  const [summary, setSummary] = useState({
    // Personal Performance (Admin's own actions)
    personalSales:      0,
    personalOrders:     0,
    personalPickups:    0,
    personalCommission: 0,
    
    // Team Management (Monitoring assigned marketers)
    assignedMarketers:  0,
    teamSales:          0,
    teamOrders:         0,
    activeMarketers:    0,
    
    // Operational Status (Current state)
    teamPendingOrders:  0,
    teamStockRequests:  0,
    teamWithdrawals:    0,
    
    // Verification Status
    pendingPhysicalVerification: 0,
    completedPhysicalVerification: 0,
    awaitingSuperAdminReview: 0,
  });

  const [wallet, setWallet] = useState({
    totalBalance: 0,
    availableBalance: 0,
    withheldBalance: 0,
    breakdown: null
  });

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await api.get("/admin/dashboard-summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSummary({
        // Personal Performance
        personalSales:      data.personalSales      || 0,
        personalOrders:     data.personalOrders     || 0,
        personalPickups:    data.personalPickups    || 0,
        personalCommission: data.personalCommission || 0,
        
        // Team Management
        assignedMarketers:  data.assignedMarketers  || 0,
        teamSales:          data.teamSales          || 0,
        teamOrders:         data.teamOrders         || 0,
        activeMarketers:    data.activeMarketers    || 0,
        
        // Operational Status
        teamPendingOrders:  data.teamPendingOrders  || 0,
        teamStockRequests:  data.teamStockRequests  || 0,
        teamWithdrawals:    data.teamWithdrawals    || 0,
        
        // Verification Status
        pendingPhysicalVerification: data.pendingPhysicalVerification || 0,
        completedPhysicalVerification: data.completedPhysicalVerification || 0,
        awaitingSuperAdminReview: data.awaitingSuperAdminReview || 0,
        
        // Percentage changes
        personalSalesChange: data.personalSalesChange || 0,
        personalOrdersChange: data.personalOrdersChange || 0,
        personalPickupsChange: data.personalPickupsChange || 0,
        teamSalesChange: data.teamSalesChange || 0,
        teamOrdersChange: data.teamOrdersChange || 0,
      });
    } catch (err) {
      console.error("Error loading admin summary:", err);
    }
  };

  const fetchWallet = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await api.get("/admin/wallet-summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWallet({
        totalBalance: data.totalBalance || 0,
        availableBalance: data.availableBalance || 0,
        withheldBalance: data.withheldBalance || 0,
        breakdown: data.breakdown || null
      });
    } catch (err) {
      console.error("Error loading wallet summary:", err);
    }
  };

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await api.get("/admin/recent-activities?limit=5", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setActivities(data.activities || []);
    } catch (err) {
      console.error("Error loading recent activities:", err);
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      await Promise.all([
        fetchSummary(),
        fetchWallet(),
        fetchActivities()
      ]);
      setLoading(false);
    };
    
    loadAllData();
    const iv = setInterval(loadAllData, 30_000); // Refresh every 30 seconds
    return () => clearInterval(iv);
  }, []);

  const formatChange = (change) => {
    if (change > 0) return `+${change}%`;
    if (change < 0) return `${change}%`;
    return "0%";
  };

  const cards = [
    // Personal Performance Section
    {
      Icon: TrendingUp,
      label: "My Personal Sales",
      value: `₦${summary.personalSales.toLocaleString()}`,
      change: formatChange(summary.personalSalesChange),
      color: "text-blue-600",
      section: "Personal"
    },
    {
      Icon: ShoppingCart,
      label: "My Orders Placed",
      value: summary.personalOrders,
      change: formatChange(summary.personalOrdersChange),
      color: "text-green-600",
      section: "Personal"
    },
    {
      Icon: Box,
      label: "My Stock Pickups",
      value: summary.personalPickups,
      change: formatChange(summary.personalPickupsChange),
      color: "text-purple-600",
      section: "Personal"
    },
    {
      Icon: Wallet,
      label: "My Commission",
      value: `₦${summary.personalCommission.toLocaleString()}`,
      change: formatChange(summary.personalSalesChange), // Same as sales change
      color: "text-emerald-600",
      section: "Personal"
    },
    
    // Team Management Section
    {
      Icon: Users,
      label: "Assigned Marketers",
      value: summary.assignedMarketers,
      change: "—", // No change for count
      color: "text-orange-600",
      section: "Team"
    },
    {
      Icon: BarChart2,
      label: "Team Sales",
      value: `₦${summary.teamSales.toLocaleString()}`,
      change: formatChange(summary.teamSalesChange),
      color: "text-cyan-600",
      section: "Team"
    },
    {
      Icon: ClipboardList,
      label: "Team Orders",
      value: summary.teamOrders,
      change: formatChange(summary.teamOrdersChange),
      color: "text-indigo-600",
      section: "Team"
    },
    {
      Icon: Activity,
      label: "Active Marketers",
      value: summary.activeMarketers,
      change: "—", // No change for count
      color: "text-teal-600",
      section: "Team"
    },
    
    // Operational Status Section
    {
      Icon: Clock,
      label: "Team Pending Orders",
      value: summary.teamPendingOrders,
      change: "—", // No change for count
      color: "text-red-600",
      section: "Status"
    },
    {
      Icon: Package,
      label: "Team Stock Requests",
      value: summary.teamStockRequests,
      change: "—", // No change for count
      color: "text-amber-600",
      section: "Status"
    },
    {
      Icon: UserCheck,
      label: "Team Withdrawals",
      value: summary.teamWithdrawals,
      change: "—", // No change for count
      color: "text-rose-600",
      section: "Status"
    },
    
    // Verification Status Section
    {
      Icon: MapPin,
      label: "Pending Physical Verification",
      value: summary.pendingPhysicalVerification,
      change: "—", // No change for count
      color: "text-orange-600",
      section: "Verification"
    },
    {
      Icon: CheckCircle,
      label: "Completed Physical Verification",
      value: summary.completedPhysicalVerification,
      change: "—", // No change for count
      color: "text-green-600",
      section: "Verification"
    },
    {
      Icon: Clock,
      label: "Awaiting SuperAdmin Review",
      value: summary.awaitingSuperAdminReview,
      change: "—", // No change for count
      color: "text-blue-600",
      section: "Verification"
    },
  ];

  if (loading) {
    return (
      <div className="px-4 py-6 md:px-6 lg:px-12 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
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
              Admin Dashboard 👨‍💼
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage your assigned marketers and track performance
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <VerificationNotifications 
              userRole="Admin"
              userId={localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).unique_id : null}
              onNotificationClick={(notification) => {
                console.log('Notification clicked:', notification);
                // Handle notification click - could navigate to relevant page
              }}
            />
            <div className="hidden md:block">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">A</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards - Grouped by Sections */}
      <div className="space-y-8">
        {/* Personal Performance Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Personal Performance
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.filter(card => card.section === "Personal").map(({ Icon, label, value, change, color }, idx) => {
              const colorMap = {
                "text-blue-600": { bgColor: "bg-blue-50", iconBg: "bg-blue-100" },
                "text-green-600": { bgColor: "bg-green-50", iconBg: "bg-green-100" },
                "text-purple-600": { bgColor: "bg-purple-50", iconBg: "bg-purple-100" },
                "text-emerald-600": { bgColor: "bg-emerald-50", iconBg: "bg-emerald-100" },
              };
              const { bgColor, iconBg } = colorMap[color] || { bgColor: "bg-gray-50", iconBg: "bg-gray-100" };
              
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
                    <span className="text-xs text-gray-500 dark:text-gray-400">from last month</span>
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
                "text-cyan-600": { bgColor: "bg-white", iconBg: "bg-cyan-100" },
                "text-indigo-600": { bgColor: "bg-white", iconBg: "bg-indigo-100" },
                "text-teal-600": { bgColor: "bg-white", iconBg: "bg-teal-100" },
              };
              const { bgColor, iconBg } = colorMap[color] || { bgColor: "bg-gray-50", iconBg: "bg-gray-100" };
              
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
                    <span className="text-xs text-gray-500 dark:text-gray-400">from last month</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Operational Status Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-600" />
            Operational Status
          </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.filter(card => card.section === "Status").map(({ Icon, label, value, change, color }, idx) => {
              const colorMap = {
                "text-red-600": { bgColor: "bg-white", iconBg: "bg-red-100" },
                "text-amber-600": { bgColor: "bg-white", iconBg: "bg-amber-100" },
                "text-rose-600": { bgColor: "bg-white", iconBg: "bg-rose-100" },
              };
              const { bgColor, iconBg } = colorMap[color] || { bgColor: "bg-gray-50", iconBg: "bg-gray-100" };

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
                    <span className="text-xs text-gray-500 dark:text-gray-400">from last month</span>
            </div>
            </div>
              );
            })}
          </div>
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
                "text-orange-600": { bgColor: "bg-white", iconBg: "bg-orange-100" },
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
                    <span className="text-xs text-gray-500 dark:text-gray-400">verification status</span>
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
            <Wallet className="w-5 h-5 text-emerald-600" />
            Wallet Summary
          </h2>
          {wallet.breakdown ? (
            <div className="space-y-4">
              {/* Personal Earnings */}
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Personal Earnings</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Available (40%)</p>
                    <p className="text-lg font-bold text-emerald-600">₦{wallet.breakdown.personal?.available?.toLocaleString() || 0}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Withheld (60%)</p>
                    <p className="text-lg font-bold text-orange-600">₦{wallet.breakdown.personal?.withheld?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </div>
              
              {/* Team Earnings */}
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Team Management</h3>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Available</p>
                  <p className="text-lg font-bold text-blue-600">₦{wallet.breakdown.team?.available?.toLocaleString() || 0}</p>
                </div>
              </div>
              
              {/* Combined Total */}
              <div className="border-t border-emerald-200 dark:border-emerald-700 pt-3">
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Total Available</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">₦{wallet.breakdown.combined?.available?.toLocaleString() || 0}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Total Balance</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">₦{wallet.totalBalance.toLocaleString()}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Available</p>
                <p className="text-lg font-bold text-emerald-600">₦{wallet.availableBalance.toLocaleString()}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Withheld</p>
                <p className="text-lg font-bold text-orange-600">₦{wallet.withheldBalance.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>

        {/* Recent Activities Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Recent Activities
          </h2>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : activities.length > 0 ? (
              activities.map((activity, index) => (
                <div key={activity.id || index} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.category === 'personal' ? 'bg-blue-500' : 'bg-green-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">{activity.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                    {activity.amount && (
                      <p className="text-xs font-medium text-emerald-600">
                        ₦{activity.amount.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No recent activities</p>
            </div>
            )}
            </div>
            </div>
          </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: <Users className="w-5 h-5" />, label: "Manage Marketers", action: () => onNavigate('marketers') },
            { icon: <MapPin className="w-5 h-5" />, label: "Physical Verification", action: () => onNavigate('physical-verification') },
            { icon: <CheckCircle className="w-5 h-5" />, label: "Verify Marketers", action: () => onNavigate('verification') },
            { icon: <Clock className="w-5 h-5" />, label: "Team Orders", action: () => onNavigate('manage-orders') },
            { icon: <Package className="w-5 h-5" />, label: "Stock Pickups", action: () => onNavigate('stock') },
            { icon: <ClipboardList className="w-5 h-5" />, label: "Place Orders", action: () => onNavigate('order') },
            { icon: <Activity className="w-5 h-5" />, label: "Team Performance", action: () => onNavigate('performance') },
            { icon: <Wallet className="w-5 h-5" />, label: "My Wallet", action: () => onNavigate('wallet') },
            { icon: <UserCheck className="w-5 h-5" />, label: "Messages", action: () => onNavigate('messages') },
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
    </div>
  );
}
