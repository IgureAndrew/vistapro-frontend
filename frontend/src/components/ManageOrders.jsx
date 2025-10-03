import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Order from "./Order";
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CheckSquare,
  Square,
  ArrowLeft
} from "lucide-react";
import { useToast } from "./ui/use-toast";

// Import mobile components
import MobileTable from "./MobileTable";
import MobileCard from "./MobileCard";
import MobileGrid from "./MobileGrid";
import MobileSearch from "./MobileSearch";

// BNPL Analytics Component
const BnplAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadAnalytics();
  }, [period, startDate, endDate]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({ period });
      if (period === 'custom') {
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
      }
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/manage-orders/analytics/bnpl?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to load BNPL analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="text-center py-8 text-gray-500">No analytics data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('day')}
            className={`px-3 py-1 rounded text-sm ${
              period === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-1 rounded text-sm ${
              period === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setPeriod('custom')}
            className={`px-3 py-1 rounded text-sm ${
              period === 'custom' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Custom
          </button>
        </div>
        
        {period === 'custom' && (
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
              placeholder="Start Date"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
              placeholder="End Date"
            />
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800">Total Orders</h3>
          <p className="text-2xl font-bold text-blue-900">{analytics.summary.total_orders}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-800">Total Devices</h3>
          <p className="text-2xl font-bold text-green-900">{analytics.summary.total_devices}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-purple-800">Total Amount</h3>
          <p className="text-2xl font-bold text-purple-900">{formatCurrency(analytics.summary.total_amount)}</p>
        </div>
      </div>

      {/* Platform Breakdown */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Platform Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(analytics.summary.platforms).map(([platform, data]) => (
            <div key={platform} className="bg-white p-3 rounded border">
              <h4 className="font-medium text-gray-900">{platform}</h4>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <div>Orders: {data.orders}</div>
                <div>Devices: {data.devices}</div>
                <div>Amount: {formatCurrency(data.amount)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Data Table */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Detailed Analytics</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Period</th>
                <th className="text-left py-2">Platform</th>
                <th className="text-right py-2">Orders</th>
                <th className="text-right py-2">Devices</th>
                <th className="text-right py-2">Total Amount</th>
                <th className="text-right py-2">Avg Amount</th>
              </tr>
            </thead>
            <tbody>
              {analytics.data.map((row, index) => (
                <tr key={index} className="border-b hover:bg-gray-100">
                  <td className="py-2">{formatDate(row.period)}</td>
                  <td className="py-2 font-medium">{row.bnpl_platform}</td>
                  <td className="py-2 text-right">{row.order_count}</td>
                  <td className="py-2 text-right">{row.total_devices}</td>
                  <td className="py-2 text-right font-medium">{formatCurrency(row.total_amount)}</td>
                  <td className="py-2 text-right">{formatCurrency(row.avg_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default function ManageOrders({ onNavigate }) {
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  
  const stored = localStorage.getItem("user");
  const currentUser = stored ? JSON.parse(stored) : {};
  const role = currentUser.role;
  const uid = currentUser.unique_id;
  const token = localStorage.getItem("token");

  // Tab state - switch between "My Actions" and "Team Monitoring" (for Admin/SuperAdmin)
  const [activeTab, setActiveTab] = useState("my-actions");

  const API_ROOT = import.meta.env.VITE_API_URL + "/api/manage-orders";
  const SUPERADMIN_API_ROOT = import.meta.env.VITE_API_URL + "/api/super-admin";
  const PENDING_URL = `${API_ROOT}/orders`;
  const HISTORY_URL = `${API_ROOT}/orders/history`;
  const SUPERADMIN_HISTORY_URL = `${SUPERADMIN_API_ROOT}/orders/history`;
  const CONFIRM_URL = id => `${API_ROOT}/orders/${id}/confirm`;
  const CANCEL_URL = id => `${API_ROOT}/orders/${id}/cancel`;

  // State management
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  
  // User summary popover state
  const [hoveredUser, setHoveredUser] = useState(null);
  const [userSummary, setUserSummary] = useState(null);
  const [showPopover, setShowPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [hoverTimeout, setHoverTimeout] = useState(null);
  
  // MasterAdmin toggle behavior state
  const [isPinned, setIsPinned] = useState(false);
  const [pinnedUserId, setPinnedUserId] = useState(null);
  const isMasterAdmin = role === "MasterAdmin";
  const canPinPopover = role === "MasterAdmin" || role === "Admin";
  
  // Popover action state
  const [userPendingOrders, setUserPendingOrders] = useState([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [isLoadingActions, setIsLoadingActions] = useState(false);
  
  // Items per page
  const [itemsPerPage] = useState(10);
  
  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // table or card

  // Role-based permissions - Only MasterAdmin can perform actions
  const canPerformActions = role === "MasterAdmin";
  
  // Debug: Log the current role
  console.log("🔍 Current user role:", role);
  console.log("🔍 Can perform actions:", canPerformActions);
  console.log("🔍 Current user data:", currentUser);

  // Fetch user summary for popover
  const fetchUserSummary = async (userId) => {
    try {
      console.log('📡 Fetching user summary for userId:', userId);
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_ROOT}/user-summary/${userId}`, { headers });
      console.log('✅ User summary response:', response.data);
      setUserSummary(response.data);
    } catch (error) {
      console.error('❌ Error fetching user summary:', error);
    }
  };

  // Fetch user pending orders for popover actions
  const fetchUserPendingOrders = async (userId) => {
    try {
      console.log('📡 Fetching user pending orders for userId:', userId);
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_ROOT}/user-pending-orders/${userId}`, { headers });
      console.log('✅ User pending orders response:', response.data);
      setUserPendingOrders(response.data.orders || []);
    } catch (error) {
      console.error('❌ Error fetching user pending orders:', error);
      setUserPendingOrders([]);
    }
  };

  // Perform bulk actions on selected orders
  const performBulkAction = async (action) => {
    if (selectedOrderIds.length === 0) {
      showWarning("Please select at least one order to perform this action.");
      return;
    }

    const actionText = action === 'confirm' ? 'confirm' : action === 'cancel' ? 'cancel' : 'reject';
    const confirmMessage = `Are you sure you want to ${actionText} ${selectedOrderIds.length} selected order(s)?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsLoadingActions(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post(`${API_ROOT}/bulk-actions`, {
        orderIds: selectedOrderIds,
        action: action
      }, { headers });

      console.log('✅ Bulk action response:', response.data);
      
      if (response.data.successCount > 0) {
        showSuccess(`Successfully ${actionText}ed ${response.data.successCount} order(s)!`);
      }
      
      if (response.data.errorCount > 0) {
        showError(`Failed to ${actionText} ${response.data.errorCount} order(s). Check console for details.`);
        console.error('Bulk action errors:', response.data.errors);
      }

      // Refresh data
      setSelectedOrderIds([]);
      if (pinnedUserId) {
        await fetchUserPendingOrders(pinnedUserId);
        await fetchUserSummary(pinnedUserId);
      }
      reload(); // Refresh main order lists
      
    } catch (error) {
      console.error('❌ Error performing bulk action:', error);
      const errorMsg = error.response?.data?.message || `Failed to ${actionText} orders.`;
      showError(errorMsg);
    } finally {
      setIsLoadingActions(false);
    }
  };

  // Handle user hover (for non-MasterAdmin roles)
  const handleUserHover = (e, userId) => {
    // Only handle hover for non-MasterAdmin roles
    if (isMasterAdmin) return;
    
    console.log('🖱️ User hover triggered with userId:', userId);
    
    // Clear any existing timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    
    const rect = e.target.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate optimal position
    let x = rect.left + rect.width / 2;
    let y = rect.bottom + 10;
    
    // Mobile-friendly positioning
    const isMobile = viewportWidth < 768;
    const popoverWidth = isMobile ? Math.min(viewportWidth - 32, 320) : 384; // max-w-sm = 384px
    const popoverHeight = 300; // estimated height
    
    // Adjust horizontal position to stay within viewport
    if (x - popoverWidth / 2 < 16) {
      x = 16 + popoverWidth / 2;
    } else if (x + popoverWidth / 2 > viewportWidth - 16) {
      x = viewportWidth - 16 - popoverWidth / 2;
    }
    
    // Adjust vertical position to stay within viewport
    if (y + popoverHeight > viewportHeight - 16) {
      y = rect.top - popoverHeight - 10; // Show above instead
    }
    
    setPopoverPosition({ x, y });
    setHoveredUser(userId);
    
    // Add small delay for mobile to prevent accidental triggers
    const delay = isMobile ? 100 : 0;
    const timeout = setTimeout(() => {
      setShowPopover(true);
      fetchUserSummary(userId);
    }, delay);
    
    setHoverTimeout(timeout);
  };

  // Handle user click (MasterAdmin toggle behavior)
  const handleUserClick = (e, userId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (canPinPopover) {
      // MasterAdmin/Admin toggle behavior
      if (isPinned && pinnedUserId === userId) {
        // Clicking same user - close popover
        setIsPinned(false);
        setPinnedUserId(null);
        setShowPopover(false);
        setHoveredUser(null);
        setUserSummary(null);
      } else {
        // Clicking different user or opening popover
        const rect = e.target.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Calculate optimal position
        let x = rect.left + rect.width / 2;
        let y = rect.bottom + 10;
        
        // Mobile-friendly positioning
        const isMobile = viewportWidth < 768;
        const popoverWidth = isMobile ? Math.min(viewportWidth - 32, 320) : 384;
        const popoverHeight = 300;
        
        // Adjust horizontal position to stay within viewport
        if (x - popoverWidth / 2 < 16) {
          x = 16 + popoverWidth / 2;
        } else if (x + popoverWidth / 2 > viewportWidth - 16) {
          x = viewportWidth - 16 - popoverWidth / 2;
        }
        
        // Adjust vertical position to stay within viewport
        if (y + popoverHeight > viewportHeight - 16) {
          y = rect.top - popoverHeight - 10;
        }
        
        setPopoverPosition({ x, y });
        setHoveredUser(userId);
        setPinnedUserId(userId);
        setIsPinned(true);
        setShowPopover(true);
        setSelectedOrderIds([]); // Clear selections when opening new popover
        fetchUserSummary(userId);
        fetchUserPendingOrders(userId);
      }
    } else {
      // Non-MasterAdmin hover behavior
      handleUserHover(e, userId);
    }
  };

  const handleUserLeave = () => {
    // Only handle leave for non-pinning roles
    if (canPinPopover) return;
    
    // Clear any pending timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    
    setShowPopover(false);
    setHoveredUser(null);
    setUserSummary(null);
  };

  // Handle order selection in popover
  const toggleOrderSelection = (orderId) => {
    setSelectedOrderIds(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  // Select all pending orders in popover
  const selectAllPendingOrders = () => {
    setSelectedOrderIds(userPendingOrders.map(order => order.id));
  };

  // Clear all selections in popover
  const clearAllSelections = () => {
    setSelectedOrderIds([]);
  };

  // Handle click outside to close pinned popover (MasterAdmin/Admin only)
  const handleClickOutside = (e) => {
    if (canPinPopover && isPinned) {
      // Check if click is outside the popover
      const popover = document.querySelector('[data-popover="user-summary"]');
      if (popover && !popover.contains(e.target)) {
        setIsPinned(false);
        setPinnedUserId(null);
        setShowPopover(false);
        setHoveredUser(null);
        setUserSummary(null);
        setUserPendingOrders([]);
        setSelectedOrderIds([]);
      }
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    // Reload data with new page
    reload();
  };

  // Reload both lists
  const reload = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    
    try {
      const headers = { Authorization: `Bearer ${token}` };

      if (role === "MasterAdmin") {
        const [pendingRes, historyRes] = await Promise.all([
          axios.get(PENDING_URL, { headers }),
          axios.get(HISTORY_URL, { 
            headers,
            params: { page: currentPage, limit: itemsPerPage }
          })
        ]);
        setPending(pendingRes.data.orders);
        setHistory(historyRes.data.orders);
        setPagination(historyRes.data.pagination);
        
        // Debug: Log order data structure
        if (historyRes.data.orders.length > 0) {
          console.log('📊 Sample order data:', historyRes.data.orders[0]);
        }
      } else if (role === "Admin") {
        const historyRes = await axios.get(HISTORY_URL, { 
          headers, 
          params: { adminId: uid } 
        });
        setHistory(historyRes.data.orders);
      } else if (role === "SuperAdmin") {
        const historyRes = await axios.get(SUPERADMIN_HISTORY_URL, { 
          headers
        });
        setHistory(historyRes.data.orders);
      } else {
        navigate("/dashboard");
      }
    } catch (e) {
      const errorMsg = e.response?.data?.message || e.message;
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, [role, uid, token, navigate]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  // Add click outside listener for MasterAdmin/Admin pinned popover
  useEffect(() => {
    if (canPinPopover && isPinned) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [canPinPopover, isPinned]);

  // Toggle bulk-select
  const toggle = (id) => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };

  // Select all visible items
  const selectAll = () => {
    const visiblePending = getFilteredPendingData(pending);
    if (selected.length === visiblePending.length) {
      setSelected([]);
    } else {
      setSelected(visiblePending.map(o => o.id));
    }
  };

  // Confirm selected
  const confirmAll = async () => {
    if (!selected.length) {
      showWarning("Select at least one order to confirm.");
      return;
    }
    
    try {
      setLoading(true);
      await Promise.all(
        selected.map(id =>
          axios.patch(CONFIRM_URL(id), {}, {
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );
      showSuccess(`Successfully confirmed ${selected.length} order(s)!`);
      setSelected([]);
      reload();
    } catch (e) {
      const errorMsg = e.response?.data?.message || "Failed to confirm orders.";
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Cancel one order
  const cancelOne = async (id) => {
    try {
      await axios.patch(CANCEL_URL(id), {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showSuccess("Order canceled and inventory returned.");
      reload();
    } catch (e) {
      const errorMsg = e.response?.data?.message || "Failed to cancel order.";
      showError(errorMsg);
    }
  };

  // Date-range matcher
  const inRange = (o) => {
    const sd = new Date(o.sale_date);
    if (fromDate && sd < new Date(fromDate)) return false;
    if (toDate && sd > new Date(toDate + "T23:59:59")) return false;
    return true;
  };

  // Search and filter data
  // Filter for pending orders (no search, only date and status filters)
  const getFilteredPendingData = (data) => {
    return data.filter(o => {
      // Date filter
      if (!inRange(o)) return false;
      
      // Status filter
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      
      return true;
    });
  };

  // Filter for order history (includes search, date, and status filters)
  const getFilteredHistoryData = (data) => {
    const filtered = data.filter(o => {
      // Date filter
      if (!inRange(o)) return false;
      
      // Status filter
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matches = (
          o.id?.toString().includes(searchLower) ||
          o.user_name?.toLowerCase().includes(searchLower) ||
          o.device_name?.toLowerCase().includes(searchLower) ||
          o.device_model?.toLowerCase().includes(searchLower) ||
          o.bnpl_platform?.toLowerCase().includes(searchLower) ||
          o.customer_name?.toLowerCase().includes(searchLower) ||
          o.user_location?.toLowerCase().includes(searchLower)
        );
        
        // Debug logging
        if (searchTerm && matches) {
          console.log('🔍 Search match found:', {
            searchTerm,
            orderId: o.id,
            user_name: o.user_name,
            device_name: o.device_name,
            customer_name: o.customer_name,
            user_location: o.user_location
          });
        }
        
        return matches;
      }
      
      return true;
    });
    
    // Debug logging
    console.log('🔍 Search results:', {
      searchTerm,
      totalData: data.length,
      filteredCount: filtered.length,
      hasSearchTerm: !!searchTerm
    });
    
    return filtered;
  };

  // Pagination - for MasterAdmin, use backend pagination; for others, use client-side
  const getPaginatedData = (data) => {
    if (role === "MasterAdmin") {
      // Backend handles pagination for MasterAdmin
      return data;
    } else {
      // Client-side pagination for other roles
    const filtered = role === "MasterAdmin" ? getFilteredPendingData(data) : getFilteredHistoryData(data);
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
    }
  };

  const totalPages = role === "MasterAdmin" 
    ? pagination.totalPages 
    : Math.ceil((role === "MasterAdmin" ? getFilteredPendingData(pending) : getFilteredHistoryData(history)).length / itemsPerPage);

  // Export functionality
  const exportData = () => {
    const data = role === "MasterAdmin" ? getFilteredPendingData(pending) : getFilteredHistoryData(history);
    const csvContent = [
      ["ID", "User", "Role", "Customer", "Device", "Type", "Qty", "Amount", "Date", "Status", "BNPL Options"],
      ...data.map(o => [
        o.id,
        o.user_name,
        o.user_role,
        o.customer_name || "—",
        `${o.device_name} ${o.device_model}`,
        o.device_type,
        o.number_of_devices,
        o.sold_amount,
        new Date(o.sale_date).toLocaleDateString(),
        o.status,
        o.bnpl_platform || "—"
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showSuccess("Orders exported successfully!");
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      confirmed: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      cancelled: { color: "bg-red-100 text-red-800", icon: XCircle },
      released_confirmed: { color: "bg-blue-100 text-blue-800", icon: CheckCircle }
    };
    
    const config = statusConfig[status] || { color: "bg-gray-100 text-gray-800", icon: AlertCircle };
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {status.replace("_", " ").toUpperCase()}
      </span>
    );
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="animate-pulse space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-gray-200 h-16 rounded"></div>
      ))}
    </div>
  );

  // Card view component
  const OrderCard = ({ order, isPending = false }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500">#{order.id}</span>
          {getStatusBadge(order.status)}
        </div>
        {isPending && (
          <input
            type="checkbox"
            checked={selected.includes(order.id)}
            onChange={() => toggle(order.id)}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">User:</span>
          <span className="text-sm font-medium">{order.user_name}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Role:</span>
          <span className="text-sm font-medium">{order.user_role}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Customer:</span>
          <span className="text-sm font-medium">{order.customer_name || "—"}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Phone:</span>
          <span className="text-sm font-medium">{order.customer_phone || "—"}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Location:</span>
          <span className="text-sm font-medium">{order.user_location || "—"}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Device:</span>
          <span className="text-sm font-medium">{order.device_name} {order.device_model}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Amount:</span>
          <span className="text-sm font-bold text-green-600">₦{order.sold_amount}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Date:</span>
          <span className="text-sm">{new Date(order.sale_date).toLocaleDateString()}</span>
        </div>
        
        {order.bnpl_platform && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">BNPL Options:</span>
            <span className="text-sm">{order.bnpl_platform}</span>
          </div>
        )}
      </div>
      
      {isPending && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <button
            onClick={() => cancelOne(order.id)}
            className="w-full px-3 py-2 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors"
          >
            Cancel Order
          </button>
        </div>
      )}
    </div>
  );

  if (!token) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">Please log in to access this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back to Overview Navigation */}
        {onNavigate && (
          <div className="mb-6">
            <button
              onClick={() => onNavigate('overview')}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Overview</span>
            </button>
          </div>
        )}
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manage Orders</h1>
              <p className="text-gray-600 mt-1">
                {role === "MasterAdmin" ? "Manage pending orders and view order history" : "View order history"}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setViewMode(viewMode === "table" ? "card" : "table")}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                {viewMode === "table" ? "Card View" : "Table View"}
              </button>
              
              <button
                onClick={exportData}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              
              <button
                onClick={reload}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation for Admin/SuperAdmin */}
        {(role === "Admin" || role === "SuperAdmin") && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab("my-actions")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "my-actions"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  My Orders
                </button>
                <button
                  onClick={() => setActiveTab("team-monitoring")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "team-monitoring"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Team Monitoring
                </button>
              </nav>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Pending Orders (MasterAdmin only) */}
        {role === "MasterAdmin" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Pending Orders</h2>
              <div className="flex items-center gap-4">
                {canPerformActions && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected.length > 0 && selected.length === getFilteredPendingData(pending).length}
                      onChange={selectAll}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">
                      {selected.length} of {getFilteredPendingData(pending).length} selected
                    </span>
                  </div>
                )}
                
                {canPerformActions && (
                  <button
                    onClick={confirmAll}
                    disabled={!selected.length || loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    Confirm Selected ({selected.length})
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <LoadingSkeleton />
            ) : getFilteredPendingData(pending).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No pending orders found.</p>
              </div>
            ) : viewMode === "table" ? (
              <div className="overflow-x-auto">
                <table className="w-full table-auto border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      {canPerformActions && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                          Select
                        </th>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Customer
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Location
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Device
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        BNPL
                      </th>
                      {canPerformActions && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getPaginatedData(pending).map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        {canPerformActions && (
                          <td className="px-4 py-3 border-b border-gray-200">
                            <input
                              type="checkbox"
                              checked={selected.includes(order.id)}
                              onChange={() => toggle(order.id)}
                              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                          </td>
                        )}
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b border-gray-200">
                          #{order.id}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">
                          <span 
                            className={`cursor-pointer transition-colors touch-manipulation ${
                              isMasterAdmin 
                                ? (isPinned && pinnedUserId === order.marketer_id 
                                    ? 'text-blue-800 font-semibold border-b-2 border-blue-500' 
                                    : 'hover:text-blue-600 active:text-blue-800')
                                : 'hover:text-blue-600 active:text-blue-800'
                            }`}
                            onMouseEnter={(e) => handleUserHover(e, order.marketer_id)}
                            onMouseLeave={handleUserLeave}
                            onClick={(e) => handleUserClick(e, order.marketer_id)}
                          >
                            {order.user_name}
                            {canPinPopover && isPinned && pinnedUserId === order.marketer_id && (
                              <span className="ml-1 text-xs">📌</span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.user_role === 'MasterAdmin' ? 'bg-purple-100 text-purple-800' :
                            order.user_role === 'SuperAdmin' ? 'bg-red-100 text-red-800' :
                            order.user_role === 'Admin' ? 'bg-blue-100 text-blue-800' :
                            order.user_role === 'Marketer' ? 'bg-green-100 text-green-800' :
                            order.user_role === 'Dealer' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.user_role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">
                          <div>
                            <div className="font-medium">{order.customer_name || "—"}</div>
                            <div className="text-gray-500 text-xs">{order.customer_phone || "—"}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {order.user_location || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">
                          <div>
                            <div className="font-medium">{order.device_name}</div>
                            <div className="text-gray-500">{order.device_model}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-green-600 border-b border-gray-200">
                          ₦{order.sold_amount}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">
                          {new Date(order.sale_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">
                          {order.bnpl_platform || "—"}
                        </td>
                        {canPerformActions && (
                          <td className="px-4 py-3 text-sm border-b border-gray-200">
                            <button
                              onClick={() => cancelOne(order.id)}
                              className="px-3 py-1 bg-red-500 text-white text-xs rounded-md hover:bg-red-600 transition-colors"
                            >
                              Cancel
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getPaginatedData(pending).map((order) => (
                  <OrderCard key={order.id} order={order} isPending={true} />
                ))}
              </div>
            )}
          </div>
        )}


        {/* Order History */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Order History</h2>
          
          {/* Search and Filters */}
          <div className="mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search orders by ID, marketer, device, customer, location..."
                    value={searchTerm}
                    onChange={(e) => {
                      const value = e.target.value;
                      console.log('🔍 Search input changed:', { 
                        value, 
                        length: value.length,
                        hasValue: !!value,
                        trimmed: value.trim(),
                        currentSearchTerm: searchTerm
                      });
                      setSearchTerm(value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
              
              {/* Clear Filters */}
              {(searchTerm || statusFilter !== "all" || fromDate || toDate) && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
            
            {/* Expanded Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="released_confirmed">Released & Confirmed</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => {
                      setFromDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => {
                      setToDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
          
          {loading ? (
            <LoadingSkeleton />
          ) : getFilteredHistoryData(history).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No orders found in history for the selected criteria.</p>
            </div>
          ) : viewMode === "table" ? (
            <div className="overflow-x-auto">
              <table className="w-full table-auto border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Device
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      BNPL
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getPaginatedData(history).map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b border-gray-200">
                        #{order.id}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">
                        <span 
                          className={`cursor-pointer transition-colors touch-manipulation ${
                            isMasterAdmin 
                              ? (isPinned && pinnedUserId === order.marketer_id 
                                  ? 'text-blue-800 font-semibold border-b-2 border-blue-500' 
                                  : 'hover:text-blue-600 active:text-blue-800')
                              : 'hover:text-blue-600 active:text-blue-800'
                          }`}
                          onMouseEnter={(e) => handleUserHover(e, order.marketer_id)}
                          onMouseLeave={handleUserLeave}
                          onClick={(e) => handleUserClick(e, order.marketer_id)}
                        >
                          {order.user_name}
                          {canPinPopover && isPinned && pinnedUserId === order.marketer_id && (
                            <span className="ml-1 text-xs">📌</span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.user_role === 'MasterAdmin' ? 'bg-purple-100 text-purple-800' :
                          order.user_role === 'SuperAdmin' ? 'bg-red-100 text-red-800' :
                          order.user_role === 'Admin' ? 'bg-blue-100 text-blue-800' :
                          order.user_role === 'Marketer' ? 'bg-green-100 text-green-800' :
                          order.user_role === 'Dealer' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.user_role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">
                        {order.customer_name || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {order.user_location || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">
                        <div>
                          <div className="font-medium">{order.device_name}</div>
                          <div className="text-gray-500">{order.device_model}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-green-600 border-b border-gray-200">
                        ₦{order.sold_amount}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">
                        {new Date(order.sale_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm border-b border-gray-200">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">
                        {order.bnpl_platform || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getPaginatedData(history).map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                {role === "MasterAdmin" ? (
                  <>Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                  {pagination.total} results</>
                ) : (
                  <>Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, getFilteredHistoryData(history).length)} of{" "}
                  {getFilteredHistoryData(history).length} results</>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={role === "MasterAdmin" ? !pagination.hasPrev : currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <span className="px-3 py-2 text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={role === "MasterAdmin" ? !pagination.hasNext : currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Mobile Backdrop */}
      {showPopover && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-25 sm:hidden"
          onClick={handleUserLeave}
        />
      )}

      {/* User Summary Popover */}
      {showPopover && userSummary && (
        <div
          data-popover="user-summary"
          className={`fixed z-50 bg-white border rounded-lg shadow-lg p-4 w-80 sm:w-96 max-w-[calc(100vw-32px)] max-h-[calc(100vh-32px)] overflow-y-auto ${
            canPinPopover && isPinned 
              ? 'border-blue-500 border-2 shadow-xl' 
              : 'border-gray-200'
          }`}
          style={{
            left: `${popoverPosition.x}px`,
            top: `${popoverPosition.y}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="text-black">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{userSummary.user.name}</h3>
                {canPinPopover && isPinned && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">📌 Pinned</span>
                )}
              </div>
              <button
                onClick={() => {
                  if (isMasterAdmin) {
                    setIsPinned(false);
                    setPinnedUserId(null);
                  }
                  setShowPopover(false);
                  setHoveredUser(null);
                  setUserSummary(null);
                  setUserPendingOrders([]);
                  setSelectedOrderIds([]);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 -m-1"
                aria-label="Close popover"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-3">ID: {userSummary.user.unique_id} | {userSummary.user.role}</p>
            
            <div className="space-y-2 mb-3">
              <div className="flex justify-between">
                <span className="text-sm">Total Orders:</span>
                <span className="text-sm font-medium">{userSummary.summary.total_orders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total Value:</span>
                <span className="text-sm font-medium">₦{userSummary.summary.total_value.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Pending:</span>
                <span className="text-sm font-medium">{userSummary.summary.pending_orders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Confirmed:</span>
                <span className="text-sm font-medium">{userSummary.summary.confirmed_orders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Canceled:</span>
                <span className="text-sm font-medium">{userSummary.summary.canceled_orders}</span>
              </div>
            </div>
            
            {/* MasterAdmin Pending Orders Actions */}
            {canPinPopover && userPendingOrders.length > 0 && (
              <div className="border-t border-gray-200 pt-3 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">Pending Orders ({userPendingOrders.length})</h4>
                  <div className="flex gap-1">
                    <button
                      onClick={selectAllPendingOrders}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      onClick={clearAllSelections}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 max-h-32 overflow-y-auto mb-3">
                  {userPendingOrders.map((order) => (
                    <div key={order.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.includes(order.id)}
                        onChange={() => toggleOrderSelection(order.id)}
                        className="w-3 h-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <span className="font-medium">#{order.id}</span>
                          <span className="font-semibold text-green-600">₦{parseFloat(order.sold_amount).toLocaleString()}</span>
                        </div>
                        <div className="text-gray-500 truncate">{order.customer_name}</div>
                        <div className="text-gray-400">
                          {order.device_name} {order.device_model}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {selectedOrderIds.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => performBulkAction('confirm')}
                      disabled={isLoadingActions}
                      className="flex-1 px-3 py-2 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {isLoadingActions ? 'Processing...' : `Confirm (${selectedOrderIds.length})`}
                    </button>
                    <button
                      onClick={() => performBulkAction('cancel')}
                      disabled={isLoadingActions}
                      className="flex-1 px-3 py-2 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {isLoadingActions ? 'Processing...' : `Cancel (${selectedOrderIds.length})`}
                    </button>
                    <button
                      onClick={() => performBulkAction('reject')}
                      disabled={isLoadingActions}
                      className="flex-1 px-3 py-2 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 disabled:opacity-50 transition-colors"
                    >
                      {isLoadingActions ? 'Processing...' : `Reject (${selectedOrderIds.length})`}
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {userSummary.recent_orders.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2">Recent Orders:</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {userSummary.recent_orders.map((order) => (
                    <div key={order.id} className="text-xs border-b border-gray-100 pb-2 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <span className="font-medium">#{order.id}</span>
                        <span className="font-semibold text-green-600">₦{parseFloat(order.sold_amount).toLocaleString()}</span>
                      </div>
                      <div className="text-gray-500 truncate">{order.customer_name}</div>
                      <div className="text-gray-400 text-xs">
                        {new Date(order.sale_date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BNPL Analytics (MasterAdmin only) */}
      {role === "MasterAdmin" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">BNPL Analytics</h2>
          <BnplAnalytics />
        </div>
      )}
    </div>
  );
}
