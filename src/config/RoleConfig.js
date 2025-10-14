// Role Configuration - Single source of truth for all roles
import {
  Home,
  User,
  Users,
  Package,
  ShoppingCart,
  CheckCircle,
  MessageSquare,
  BarChart3,
  Settings,
  Wallet,
  FileText,
  UserPlus,
  Shield,
  Target,
  Activity,
  DollarSign,
  ClipboardList,
  TrendingUp,
  Bell,
  Search
} from 'lucide-react';

// Import existing components
import DashboardOverview from '../components/DashboardOverview';
import ProfileUpdate from '../components/ProfileUpdate';
import UsersManagement from '../components/UsersManagement';
import MasterAdminWallet from '../components/MasterAdminWallet';
import SuperAdminWallet from '../components/SuperAdminWallet';
import AdminWallet from '../components/AdminWallet';
import WalletComponent from '../components/Wallet';
import Order from '../components/Order';
import ManageOrders from '../components/ManageOrders';
import SuperAdminManageOrders from '../components/SuperAdminManageOrders';
import Product from '../components/Product';
import ProfitReport from '../components/ProfitReport';
import MarketerStockPickup from '../components/MarketerStockPickup';
import AdminStockPickups from '../components/AdminStockPickups';
import SuperAdminStockPickups from '../components/SuperAdminStockPickups';
import MasterAdminStockPickups from '../components/MasterAdminStockPickups';
import Verification from '../components/Verification';
import VerificationMarketer from '../components/VerificationMarketer';
import Messaging from '../components/Messaging';
import Performance from '../components/Performance';
import TargetManagement from '../components/TargetManagement';
import UserTargets from '../components/UserTargets';
import UserAssignmentManagement from '../components/UserAssignmentManagement';
import SuperAdminAssignedUsers from '../components/SuperAdminAssignedUsers';
import Submissions from '../components/Submissions';
import AdminSubmissionsNew from '../components/AdminSubmissionsNew';
import SuperAdminSubmissionsNew from '../components/SuperAdminSubmissionsNew';
import MasterAdminSubmissions from '../components/MasterAdminSubmissions';
import MasterAdminBlockedAccounts from '../components/MasterAdminBlockedAccounts';
import MarketersOverview from '../components/MarketersOverview';
import AccountSettings from '../components/AccountSettings';
import OTPTransitionDashboard from '../components/OTPTransitionDashboard';

export const ROLE_CONFIG = {
  masteradmin: {
    title: "Master Admin Dashboard",
    icon: "Shield",
    color: "#f59e0b",
    modules: [
      { key: "overview", label: "Overview", icon: Home, component: DashboardOverview },
      { key: "users", label: "Users", icon: Users, component: UsersManagement },
      { key: "products", label: "Products", icon: Package, component: Product },
      { key: "manage-orders", label: "Manage Orders", icon: ShoppingCart, component: ManageOrders },
      { key: "profit-report", label: "Profit Report", icon: BarChart3, component: ProfitReport },
      { key: "stock-pickups", label: "Stock Pickups", icon: Package, component: MasterAdminStockPickups },
      { key: "blocked-accounts", label: "Blocked Accounts", icon: Shield, component: MasterAdminBlockedAccounts },
      { key: "verification", label: "Verification", icon: CheckCircle, component: Verification },
      { key: "user-assignment", label: "User Assignment", icon: UserPlus, component: UserAssignmentManagement },
      { key: "targets", label: "Target Management", icon: Target, component: TargetManagement },
      { key: "performance", label: "Analytics", icon: BarChart3, component: Performance },
      { key: "wallet", label: "Wallets", icon: Wallet, component: MasterAdminWallet },
      { key: "messages", label: "Messages", icon: MessageSquare, component: Messaging },
      { key: "submissions", label: "Submissions", icon: FileText, component: MasterAdminSubmissions },
      { key: "otp-transition", label: "OTP Transition", icon: Shield, component: OTPTransitionDashboard },
      { key: "account-settings", label: "Account Settings", icon: Settings, component: AccountSettings }
    ],
    metrics: [
      { key: "totalUsers", label: "Total Users", icon: Users, color: "blue" },
      { key: "totalOrders", label: "Total Orders", icon: ShoppingCart, color: "green" },
      { key: "totalSales", label: "Total Sales", icon: DollarSign, color: "purple" },
      { key: "pendingVerification", label: "Pending Verification", icon: CheckCircle, color: "orange" }
    ],
    quickActions: [
      { key: "addUser", label: "Add User", icon: UserPlus, color: "blue" },
      { key: "products", label: "Products", icon: Package, color: "green" },
      { key: "manageOrders", label: "Manage Orders", icon: ShoppingCart, color: "orange" },
      { key: "profitReport", label: "Profit Report", icon: BarChart3, color: "purple" },
      { key: "stockPickups", label: "Stock Pickups", icon: Package, color: "green" },
      { key: "verification", label: "Verification", icon: CheckCircle, color: "orange" },
      { key: "userAssignment", label: "User Assignment", icon: UserPlus, color: "purple" },
      { key: "targets", label: "Target Management", icon: Target, color: "indigo" },
      { key: "blockedAccounts", label: "Blocked Accounts", icon: Shield, color: "red" },
      { key: "analytics", label: "Analytics", icon: BarChart3, color: "gray" }
    ]
  },

  superadmin: {
    title: "Super Admin Dashboard",
    icon: "Crown",
    color: "#f59e0b",
    modules: [
      { key: "overview", label: "Overview", icon: Home, component: DashboardOverview },
      { key: "targets", label: "My Targets", icon: Target, component: UserTargets },
      { key: "account-settings", label: "Account Settings", icon: User, component: ProfileUpdate },
      { key: "stock", label: "Stock Pickups", icon: Package, component: SuperAdminStockPickups },
      { key: "manage-orders", label: "Manage Orders", icon: ClipboardList, component: SuperAdminManageOrders },
      { key: "wallet", label: "Wallet", icon: Wallet, component: SuperAdminWallet },
      { key: "messages", label: "Messages", icon: MessageSquare, component: Messaging },
      { key: "verification", label: "Verification", icon: CheckCircle, component: Verification },
      { key: "submissions", label: "Submissions", icon: FileText, component: SuperAdminSubmissionsNew },
      { key: "assigned", label: "Assigned Users", icon: UserPlus, component: SuperAdminAssignedUsers },
      { key: "account-settings", label: "Account Settings", icon: Settings, component: AccountSettings }
    ],
    metrics: [
      { key: "assignedUsers", label: "Assigned Users", icon: Users, color: "blue" },
      { key: "totalPickupStocks", label: "Stock Pickups", icon: Package, color: "green" },
      { key: "totalPendingOrders", label: "Pending Orders", icon: ShoppingCart, color: "purple" },
      { key: "pendingVerification", label: "Verifications", icon: CheckCircle, color: "orange" }
    ],
    quickActions: [
      { key: "stockPickups", label: "Stock Pickups", icon: Package, color: "blue" },
      { key: "manageOrders", label: "Manage Orders", icon: ClipboardList, color: "green" },
      { key: "assignUsers", label: "Assign Users", icon: UserPlus, color: "purple" },
      { key: "settings", label: "Settings", icon: Settings, color: "gray" }
    ]
  },

  admin: {
    title: "Admin Dashboard",
    icon: "Shield",
    color: "#f59e0b",
    modules: [
      { key: "overview", label: "Overview", icon: Home, component: DashboardOverview },
      { key: "targets", label: "My Targets", icon: Target, component: UserTargets },
      { key: "profile", label: "Profile", icon: User, component: ProfileUpdate },
      { key: "manage-orders", label: "Manage Orders", icon: ClipboardList, component: ManageOrders },
      { key: "stock", label: "Stock Pickups", icon: Package, component: AdminStockPickups },
      { key: "marketers", label: "Assigned Marketers", icon: Users, component: UserAssignmentManagement },
      { key: "submissions", label: "Submissions", icon: FileText, component: AdminSubmissionsNew },
      { key: "messages", label: "Messages", icon: MessageSquare, component: Messaging },
      { key: "verification", label: "Verification", icon: CheckCircle, component: Verification },
      { key: "wallet", label: "Wallet", icon: Wallet, component: AdminWallet },
      { key: "account-settings", label: "Account Settings", icon: Settings, component: AccountSettings }
    ],
    metrics: [
      { key: "assignedMarketers", label: "Assigned Marketers", icon: Users, color: "blue" },
      { key: "totalPickupStocks", label: "Stock Pickups", icon: Package, color: "green" },
      { key: "totalPendingOrders", label: "Pending Orders", icon: ShoppingCart, color: "purple" },
      { key: "pendingVerification", label: "Verifications", icon: CheckCircle, color: "orange" }
    ],
    quickActions: [
      { key: "manageOrders", label: "Manage Orders", icon: ClipboardList, color: "blue" },
      { key: "stockPickups", label: "Stock Pickups", icon: Package, color: "green" },
      { key: "assignedMarketers", label: "Assigned Marketers", icon: Users, color: "purple" },
      { key: "settings", label: "Settings", icon: Settings, color: "gray" }
    ]
  },

  dealer: {
    title: "Dealer Dashboard",
    icon: "Store",
    color: "#f59e0b",
    modules: [
      { key: "overview", label: "Overview", icon: Home, component: DashboardOverview },
      { key: "account-settings", label: "Account Settings", icon: Settings, component: AccountSettings },
      { key: "manage-orders", label: "Manage Orders", icon: ClipboardList, component: ManageOrders }
    ],
    metrics: [
      { key: "totalOrders", label: "Total Orders", icon: ShoppingCart, color: "green" },
      { key: "totalConfirmedOrders", label: "Completed Orders", icon: CheckCircle, color: "blue" },
      { key: "totalSales", label: "Revenue", icon: DollarSign, color: "purple" },
      { key: "totalPendingOrders", label: "Pending Orders", icon: Activity, color: "orange" }
    ],
    quickActions: [
      { key: "newOrder", label: "New Order", icon: ShoppingCart, color: "green" },
      { key: "viewOrders", label: "View Orders", icon: ClipboardList, color: "blue" },
      { key: "analytics", label: "Analytics", icon: BarChart3, color: "purple" },
      { key: "settings", label: "Settings", icon: Settings, color: "gray" }
    ]
  },

  marketer: {
    title: "Marketer Dashboard",
    icon: "Target",
    color: "#f59e0b",
    modules: [
      { key: "overview", label: "Overview", icon: Home, component: MarketersOverview },
      { key: "targets", label: "My Targets", icon: Target, component: UserTargets },
      { key: "account-settings", label: "Account Settings", icon: User, component: ProfileUpdate },
      { key: "verification", label: "Verification", icon: CheckCircle, component: VerificationMarketer },
      { key: "stock-pickup", label: "Stock Pickup", icon: Package, component: MarketerStockPickup },
      { key: "order", label: "Orders", icon: ShoppingCart, component: Order },
      { key: "wallet", label: "Wallet", icon: Wallet, component: WalletComponent },
      { key: "messages", label: "Messages", icon: MessageSquare, component: Messaging }
    ],
    metrics: [
      { key: "verificationStatus", label: "Verification Status", icon: CheckCircle, color: "green" },
      { key: "totalPickupStocks", label: "Stock Pickups", icon: Package, color: "blue" },
      { key: "totalOrders", label: "Orders", icon: ShoppingCart, color: "purple" },
      { key: "walletBalance", label: "Wallet Balance", icon: Wallet, color: "green" }
    ],
    quickActions: [
      { key: "newOrder", label: "New Order", icon: ShoppingCart, color: "blue" },
      { key: "verificationStatus", label: "Verification Status", icon: CheckCircle, color: "green" },
      { key: "checkWallet", label: "Check Wallet", icon: Wallet, color: "purple" },
      { key: "stockPickup", label: "Stock Pickup", icon: Package, color: "orange" }
    ]
  }
};

// Navigation configuration for mobile
export const MOBILE_NAV_CONFIG = {
  masteradmin: [
    { key: 'overview', label: 'Home', icon: Home },
    { key: 'wallet', label: 'Wallet', icon: Wallet },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'manage-orders', label: 'Orders', icon: ShoppingCart },
    { key: 'performance', label: 'Stats', icon: BarChart3 },
    { key: 'more', label: 'More', icon: Settings }
  ],
  superadmin: [
    { key: 'overview', label: 'Home', icon: Home },
    { key: 'wallet', label: 'Wallet', icon: Wallet },
    { key: 'stock', label: 'Stock', icon: Package },
    { key: 'manage-orders', label: 'Orders', icon: ShoppingCart },
    { key: 'assigned', label: 'Team', icon: Users },
    { key: 'more', label: 'More', icon: Settings }
  ],
  admin: [
    { key: 'overview', label: 'Home', icon: Home },
    { key: 'wallet', label: 'Wallet', icon: Wallet },
    { key: 'stock', label: 'Stock', icon: Package },
    { key: 'manage-orders', label: 'Orders', icon: ShoppingCart },
    { key: 'performance', label: 'Stats', icon: BarChart3 },
    { key: 'more', label: 'More', icon: Settings }
  ],
  dealer: [
    { key: 'overview', label: 'Home', icon: Home },
    { key: 'wallet', label: 'Wallet', icon: Wallet },
    { key: 'orders', label: 'Orders', icon: ShoppingCart },
    { key: 'stock', label: 'Stock', icon: Package },
    { key: 'more', label: 'More', icon: Settings }
  ],
  marketer: [
    { key: 'overview', label: 'Home', icon: Home },
    { key: 'wallet', label: 'Wallet', icon: Wallet },
    { key: 'stock-pickup', label: 'Pickup', icon: Package },
    { key: 'order', label: 'Orders', icon: ShoppingCart },
    { key: 'more', label: 'More', icon: Settings }
  ]
};

// Helper function to get role config
export const getRoleConfig = (role) => {
  return ROLE_CONFIG[role] || ROLE_CONFIG.masteradmin;
};

// Helper function to get mobile nav config
export const getMobileNavConfig = (role) => {
  return MOBILE_NAV_CONFIG[role] || MOBILE_NAV_CONFIG.masteradmin;
};

export default ROLE_CONFIG;
