import React from 'react';
import { 
  Users, 
  ShoppingCart, 
  DollarSign, 
  CheckCircle, 
  Package, 
  TrendingUp, 
  Activity,
  Wallet,
  Target,
  BarChart3,
  Shield,
  Crown,
  Store
} from 'lucide-react';

export const getRoleMetrics = (role, data = {}) => {
  const baseMetrics = {
    masteradmin: [
      {
        title: "Total Users",
        value: data.totalUsers || "2,847",
        change: "+15.3% from last month",
        icon: Users,
        color: "text-blue-600",
        trend: "up"
      },
      {
        title: "Total Orders", 
        value: data.totalOrders || "1,426",
        change: "+8.2% from last week",
        icon: ShoppingCart,
        color: "text-green-600",
        trend: "up"
      },
      {
        title: "Total Sales",
        value: data.totalSales || "₦2,847,500",
        change: "+12.1% from last month", 
        icon: DollarSign,
        color: "text-purple-600",
        trend: "up"
      },
      {
        title: "Pending Verification",
        value: data.pendingVerification || "23",
        change: "-5.2% from last week",
        icon: CheckCircle,
        color: "text-orange-600",
        trend: "down"
      }
    ],
    superadmin: [
      {
        title: "Assigned Users",
        value: data.assignedUsers || "156",
        change: "+12.3% from last month",
        icon: Users,
        color: "text-blue-600",
        trend: "up"
      },
      {
        title: "Stock Pickups",
        value: data.totalPickupStocks || "89",
        change: "+18.7% from last week",
        icon: Package,
        color: "text-green-600", 
        trend: "up"
      },
      {
        title: "Pending Orders",
        value: data.totalPendingOrders || "34",
        change: "+4.2% from last week",
        icon: ShoppingCart,
        color: "text-purple-600",
        trend: "up"
      },
      {
        title: "Verifications",
        value: data.pendingVerification || "12",
        change: "-8.1% from last week",
        icon: CheckCircle,
        color: "text-orange-600",
        trend: "down"
      }
    ],
    admin: [
      {
        title: "Assigned Marketers",
        value: data.assignedMarketers || "24",
        change: "+6.7% from last month",
        icon: Users,
        color: "text-blue-600",
        trend: "up"
      },
      {
        title: "Stock Pickups",
        value: data.totalPickupStocks || "67",
        change: "+15.2% from last week",
        icon: Package,
        color: "text-green-600",
        trend: "up"
      },
      {
        title: "Pending Orders",
        value: data.totalPendingOrders || "19",
        change: "+2.8% from last week",
        icon: ShoppingCart,
        color: "text-purple-600",
        trend: "up"
      },
      {
        title: "Verifications",
        value: data.pendingVerification || "8",
        change: "-12.5% from last week",
        icon: CheckCircle,
        color: "text-orange-600",
        trend: "down"
      }
    ],
    dealer: [
      {
        title: "Total Orders",
        value: data.totalOrders || "342",
        change: "+22.1% from last month",
        icon: ShoppingCart,
        color: "text-green-600",
        trend: "up"
      },
      {
        title: "Completed Orders",
        value: data.totalConfirmedOrders || "298",
        change: "+18.7% from last month",
        icon: CheckCircle,
        color: "text-blue-600",
        trend: "up"
      },
      {
        title: "Revenue",
        value: data.totalSales || "₦1,847,300",
        change: "+25.3% from last month",
        icon: DollarSign,
        color: "text-purple-600",
        trend: "up"
      },
      {
        title: "Pending Orders",
        value: data.totalPendingOrders || "44",
        change: "+5.7% from last week",
        icon: Activity,
        color: "text-orange-600",
        trend: "up"
      }
    ],
    marketer: [
      {
        title: "Verification Status",
        value: data.verificationStatus === "verified" ? "Verified" : "Pending",
        change: data.verificationStatus === "verified" ? "Account verified" : "Under review",
        icon: CheckCircle,
        color: data.verificationStatus === "verified" ? "text-green-600" : "text-orange-600",
        trend: data.verificationStatus === "verified" ? "up" : "neutral"
      },
      {
        title: "Stock Pickups",
        value: data.totalPickupStocks || "23",
        change: "+8.3% from last week",
        icon: Package,
        color: "text-blue-600",
        trend: "up"
      },
      {
        title: "Orders",
        value: data.totalOrders || "45",
        change: "+15.7% from last week",
        icon: ShoppingCart,
        color: "text-purple-600",
        trend: "up"
      },
      {
        title: "Wallet Balance",
        value: data.walletBalance || "₦127,500",
        change: "+12.4% from last month",
        icon: Wallet,
        color: "text-green-600",
        trend: "up"
      }
    ]
  };

  return baseMetrics[role] || baseMetrics.masteradmin;
};

export default getRoleMetrics;
