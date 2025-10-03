// src/components/AdminOverview.jsx
import React, { useState, useEffect } from "react";
import {
  BarChart2,
  Users,
  CheckCircle,
  Clock,
  ClipboardList,
  Wallet,
  TrendingUp,
  Activity,
  ShoppingCart,
  Box,
  MapPin,
  History,
  User,
  Package,
  FileText,
  Calendar
} from "lucide-react";
import api from "../api";

// Import reusable components
import { MetricCard } from "./common/MetricCard";
import { WelcomeSection } from "./common/WelcomeSection";
import { SectionHeader } from "./common/SectionHeader";

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
      <div className="w-full space-y-4 sm:space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  // Group cards by section for better organization
  const personalCards = cards.filter(c => c.section === "Personal");
  const teamCards = cards.filter(c => c.section === "Team");
  const verificationCards = cards.filter(c => c.section === "Verification");

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      {/* Welcome Section */}
      <WelcomeSection
        title="Admin Dashboard"
        subtitle="Manage your team of marketers and monitor performance"
        gradientFrom="from-green-50"
        gradientTo="to-teal-50"
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
              value={`₦${(wallet.availableBalance || 0).toLocaleString()}`}
              icon={Wallet}
              iconColor="text-green-600"
              iconBgColor="bg-green-100"
            />
            <MetricCard
              label="Withheld Balance"
              value={`₦${(wallet.withheldBalance || 0).toLocaleString()}`}
              icon={Clock}
              iconColor="text-orange-600"
              iconBgColor="bg-orange-100"
            />
            <MetricCard
              label="Total Balance"
              value={`₦${(wallet.totalBalance || 0).toLocaleString()}`}
              icon={TrendingUp}
              iconColor="text-blue-600"
              iconBgColor="bg-blue-100"
            />
          </div>
        </div>
      )}

      {/* Recent Activities */}
      <div>
        <SectionHeader title="Recent Activities" />
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {activities.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">No recent activities</p>
              <p className="text-sm">Your recent actions and team activities will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {activities.map((activity, index) => {
                const getActivityIcon = (type) => {
                  switch (type?.toLowerCase()) {
                    case 'order':
                    case 'order_placed':
                      return ShoppingCart;
                    case 'verification':
                    case 'verification_submitted':
                    case 'verification_approved':
                      return CheckCircle;
                    case 'stock':
                    case 'stock_pickup':
                      return Package;
                    case 'user':
                    case 'marketer':
                      return User;
                    case 'submission':
                      return FileText;
                    default:
                      return Activity;
                  }
                };

                const getActivityColor = (type) => {
                  switch (type?.toLowerCase()) {
                    case 'order':
                    case 'order_placed':
                      return 'text-green-600';
                    case 'verification':
                    case 'verification_submitted':
                    case 'verification_approved':
                      return 'text-blue-600';
                    case 'stock':
                    case 'stock_pickup':
                      return 'text-purple-600';
                    case 'user':
                    case 'marketer':
                      return 'text-orange-600';
                    case 'submission':
                      return 'text-indigo-600';
                    default:
                      return 'text-gray-600';
                  }
                };

                const formatTimeAgo = (timestamp) => {
                  const now = new Date();
                  const activityTime = new Date(timestamp);
                  const diff = now - activityTime;
                  const minutes = Math.floor(diff / 60000);
                  const hours = Math.floor(diff / 3600000);
                  const days = Math.floor(diff / 86400000);

                  if (minutes < 1) return 'Just now';
                  if (minutes < 60) return `${minutes}m ago`;
                  if (hours < 24) return `${hours}h ago`;
                  return `${days}d ago`;
                };

                const IconComponent = getActivityIcon(activity.type);
                const iconColor = getActivityColor(activity.type);

                return (
                  <div key={index} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${iconColor.replace('text-', 'bg-').replace('-600', '-100')} dark:${iconColor.replace('text-', 'bg-').replace('-600', '-900/30')}`}>
                        <IconComponent className={`w-4 h-4 ${iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            {activity.title || activity.message || 'Activity'}
                          </h4>
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatTimeAgo(activity.timestamp || activity.created_at)}
                          </span>
                        </div>
                        {activity.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {activity.description}
                          </p>
                        )}
                        {activity.user_name && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            by {activity.user_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
