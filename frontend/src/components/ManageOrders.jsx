import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
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
  Square
} from "lucide-react";
import { useToast } from "./ui/use-toast";

export default function ManageOrders() {
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  
  const stored = localStorage.getItem("user");
  const currentUser = stored ? JSON.parse(stored) : {};
  const role = currentUser.role;
  const uid = currentUser.unique_id;
  const token = localStorage.getItem("token");

  const API_ROOT = import.meta.env.VITE_API_URL + "/api/manage-orders";
  const PENDING_URL = `${API_ROOT}/orders`;
  const HISTORY_URL = `${API_ROOT}/orders/history`;
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
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // table or card

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
          axios.get(HISTORY_URL, { headers })
        ]);
        setPending(pendingRes.data.orders);
        setHistory(historyRes.data.orders);
      } else if (role === "Admin") {
        const historyRes = await axios.get(HISTORY_URL, { 
          headers, 
          params: { adminId: uid } 
        });
        setHistory(historyRes.data.orders);
      } else if (role === "SuperAdmin") {
        const historyRes = await axios.get(HISTORY_URL, { 
          headers, 
          params: { superAdminId: uid } 
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

  // Toggle bulk-select
  const toggle = (id) => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };

  // Select all visible items
  const selectAll = () => {
    const visiblePending = getFilteredData(pending);
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
  const getFilteredData = (data) => {
    return data.filter(o => {
      // Date filter
      if (!inRange(o)) return false;
      
      // Status filter
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          o.id?.toString().includes(searchLower) ||
          o.marketer_name?.toLowerCase().includes(searchLower) ||
          o.device_name?.toLowerCase().includes(searchLower) ||
          o.device_model?.toLowerCase().includes(searchLower) ||
          o.bnpl_platform?.toLowerCase().includes(searchLower) ||
          o.customer_name?.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  };

  // Pagination
  const getPaginatedData = (data) => {
    const filtered = getFilteredData(data);
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  };

  const totalPages = Math.ceil(getFilteredData(role === "MasterAdmin" ? pending : history).length / itemsPerPage);

  // Export functionality
  const exportData = () => {
    const data = getFilteredData(role === "MasterAdmin" ? pending : history);
    const csvContent = [
      ["ID", "Marketer", "Customer", "Device", "Type", "Qty", "Amount", "Date", "Status", "BNPL Platform"],
      ...data.map(o => [
        o.id,
        o.marketer_name,
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
          <span className="text-sm text-gray-600">Marketer:</span>
          <span className="text-sm font-medium">{order.marketer_name}</span>
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
            <span className="text-sm text-gray-600">BNPL:</span>
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

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search orders by ID, marketer, device, customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                  onChange={(e) => setStatusFilter(e.target.value)}
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
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </div>

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
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selected.length > 0 && selected.length === getFilteredData(pending).length}
                    onChange={selectAll}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">
                    {selected.length} of {getFilteredData(pending).length} selected
                  </span>
                </div>
                
                <button
                  onClick={confirmAll}
                  disabled={!selected.length || loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  Confirm Selected ({selected.length})
                </button>
              </div>
            </div>

            {loading ? (
              <LoadingSkeleton />
            ) : getFilteredData(pending).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No pending orders found.</p>
              </div>
            ) : viewMode === "table" ? (
              <div className="overflow-x-auto">
                <table className="w-full table-auto border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Select
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Marketer
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
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getPaginatedData(pending).map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 border-b border-gray-200">
                          <input
                            type="checkbox"
                            checked={selected.includes(order.id)}
                            onChange={() => toggle(order.id)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b border-gray-200">
                          #{order.id}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">
                          {order.marketer_name}
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
                          <button
                            onClick={() => cancelOne(order.id)}
                            className="px-3 py-1 bg-red-500 text-white text-xs rounded-md hover:bg-red-600 transition-colors"
                          >
                            Cancel
                          </button>
                        </td>
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
          
          {loading ? (
            <LoadingSkeleton />
          ) : getFilteredData(history).length === 0 ? (
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
                      Marketer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Customer
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
                        {order.marketer_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">
                        {order.customer_name || "—"}
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
                Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, getFilteredData(role === "MasterAdmin" ? pending : history).length)} of{" "}
                {getFilteredData(role === "MasterAdmin" ? pending : history).length} results
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <span className="px-3 py-2 text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
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
  );
}
