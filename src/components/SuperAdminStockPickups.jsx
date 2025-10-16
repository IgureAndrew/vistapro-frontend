// src/components/SuperAdminStockPickups.jsx
import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import MarketerStockPickup from "./MarketerStockPickup";

export default function SuperAdminStockPickups() {
  const API_URL = import.meta.env.VITE_API_URL + "/api/stock/superadmin/stock-updates";
  const token   = localStorage.getItem("token") || "";

  // Tab state - switch between "My Actions" and "Team Monitoring"
  const [activeTab, setActiveTab] = useState("my-actions");

  // Team monitoring state (existing functionality)
  const [pickups, setPickups] = useState([]);
  const [now,     setNow]     = useState(Date.now());
  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [noHierarchy, setNoHierarchy] = useState(false);
  
  // New state for enhanced features
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // WebSocket connection for real-time updates
  const socketRef = useRef(null);

  // live clock tick for countdowns
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket setup
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Connect to WebSocket
    socketRef.current = io(import.meta.env.VITE_API_URL, {
      auth: { token }
    });

    // Listen for stock pickup updates
    socketRef.current.on('stock_pickup_updated', (data) => {
      console.log('Real-time stock pickup update:', data);
      // Refresh the data
      fetchPickups();
    });

    // Listen for new stock pickups
    socketRef.current.on('stock_pickup_created', (data) => {
      console.log('New stock pickup created:', data);
      // Show notification
      showNotification('New Stock Pickup', `${data.marketer_name} picked up ${data.quantity}x ${data.device_name}`);
      // Refresh the data
      fetchPickups();
    });

    // Listen for stock pickup deletions
    socketRef.current.on('stock_pickup_deleted', (data) => {
      console.log('Stock pickup deleted:', data);
      // Refresh the data
      fetchPickups();
    });

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // fetch pickups
  const fetchPickups = async () => {
    setLoading(true);
    setError(null);
    setNoHierarchy(false);
    try {
      const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to load pickups");
      setPickups(json.data || []);
      setNoHierarchy(json.noHierarchy || false);
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPickups();
  }, []);

  // Filter and paginate data
  const filteredPickups = pickups.filter(pickup => {
    const matchesSearch = 
      pickup.marketer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pickup.admin_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pickup.device_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pickup.device_model?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || pickup.status === statusFilter;
    const matchesLocation = locationFilter === "all" || pickup.location_name === locationFilter;
    
    return matchesSearch && matchesStatus && matchesLocation;
  });

  const totalPages = Math.ceil(filteredPickups.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPickups = filteredPickups.slice(startIndex, startIndex + itemsPerPage);

  // Get unique locations for filter
  const uniqueLocations = [...new Set(pickups.map(p => p.location_name).filter(Boolean))];

  // Enhanced countdown function that continues counting for expired items
  function formatCountdown(deadline) {
    const diff = new Date(deadline).getTime() - now;
    
    if (diff >= 0) {
      // Still pending - show remaining time (countdown)
      const days = Math.floor(diff / 86_400_000);
      const hrs = Math.floor((diff % 86_400_000) / 3_600_000);
      const mins = Math.floor((diff % 3_600_000) / 60_000);
      const secs = Math.floor((diff % 60_000) / 1_000);
      
      if (days > 0) {
        return `${days}d ${hrs}h ${mins}m ${secs}s`;
      } else if (hrs > 0) {
        return `${hrs}h ${mins}m ${secs}s`;
      } else if (mins > 0) {
        return `${mins}m ${secs}s`;
      } else {
        return `${secs}s`;
      }
    } else {
      // Expired - show how long ago it expired (count-up)
      const absDiff = Math.abs(diff);
      const days = Math.floor(absDiff / 86_400_000);
      const hrs = Math.floor((absDiff % 86_400_000) / 3_600_000);
      const mins = Math.floor((absDiff % 3_600_000) / 60_000);
      const secs = Math.floor((absDiff % 60_000) / 1_000);
      
      if (days > 0) {
        return `Expired ${days}d ${hrs}h ${mins}m ago`;
      } else if (hrs > 0) {
        return `Expired ${hrs}h ${mins}m ago`;
      } else if (mins > 0) {
        return `Expired ${mins}m ${secs}s ago`;
      } else {
        return `Expired ${secs}s ago`;
      }
    }
  }

  // Helper functions
  const showNotification = (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setLocationFilter("all");
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    const headers = ["ID", "Marketer", "Admin", "Device", "Model", "Qty", "Pickup Date", "Deadline", "Status", "Location"];
    const csvContent = [
      headers.join(","),
      ...filteredPickups.map(p => [
        p.id,
        `"${p.marketer_name}"`,
        `"${p.admin_name}"`,
        `"${p.device_name}"`,
        `"${p.device_model}"`,
        p.quantity,
        `"${new Date(p.pickup_date).toLocaleString()}"`,
        `"${new Date(p.deadline).toLocaleString()}"`,
        p.status,
        `"${p.location_name || 'N/A'}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stock-pickups-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading stock pickups</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
              <div className="mt-4">
                <button
                  onClick={fetchPickups}
                  className="bg-red-100 text-red-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 md:px-6 lg:px-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Stock Pickups</h2>
        <div className="flex space-x-3">
          {activeTab === "team-monitoring" && (
            <>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span>Filters</span>
              </button>
              <button
                onClick={exportToCSV}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export CSV</span>
          </button>
          <button
            onClick={fetchPickups}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
            </>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
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
              My Stock Pickups
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

      {/* Tab Content */}
      {activeTab === "my-actions" ? (
        <MarketerStockPickup />
      ) : (
        <>
          {/* No Hierarchy Message */}
      {noHierarchy && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">No Hierarchy Assigned</h3>
              <div className="mt-2 text-sm text-yellow-700">
                No admins are currently assigned to you. Contact the MasterAdmin to set up your hierarchy.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters Section */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search marketers, admins, devices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="sold">Sold</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Locations</option>
                {uniqueLocations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm font-medium text-gray-500">Total Pickups</div>
          <div className="text-2xl font-bold text-gray-900">{filteredPickups.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm font-medium text-gray-500">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">
            {filteredPickups.filter(p => p.status === 'pending').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm font-medium text-gray-500">Sold</div>
          <div className="text-2xl font-bold text-green-600">
            {filteredPickups.filter(p => p.status === 'sold').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm font-medium text-gray-500">Expired</div>
          <div className="text-2xl font-bold text-red-600">
            {filteredPickups.filter(p => p.status === 'expired').length}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full text-sm divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[
                "ID",
                "Marketer",
                "Admin",
                "Device",
                "Model",
                "Qty",
                "Pickup Date",
                "Deadline",
                "Countdown",
                "Status",
                "Location"
              ].map((hdr) => (
                <th
                  key={hdr}
                  className="px-4 py-2 text-left font-medium text-gray-600 uppercase"
                >
                  {hdr}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedPickups.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-4 text-center text-gray-500">
                  {filteredPickups.length === 0 ? "No pickups found." : "No pickups match the current filters."}
                </td>
              </tr>
            ) : (
              paginatedPickups.map((p) => {
                // Show countdown/count-up based on status and time
                let countdown;
                
                // Stop countdown for completed statuses
                if (p.status === 'sold' || p.status === 'returned' || p.status === 'transferred') {
                  // Show status instead of countdown for completed items
                  const statusLabel = p.status.charAt(0).toUpperCase() + p.status.slice(1).replace(/_/g, " ");
                  countdown = <span className="text-green-600 font-semibold">{statusLabel}</span>;
                } else {
                  // For pending/expired statuses, show countdown/count-up based on time
                  const isExpired = new Date(p.deadline).getTime() < now;
                  countdown = isExpired ? (
                    <span className="text-red-600">
                      {formatCountdown(p.deadline)}
                    </span>
                  ) : (
                    <span className="text-green-600">
                      {formatCountdown(p.deadline)}
                    </span>
                  );
                }
                
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{p.id}</td>
                    <td className="px-4 py-2">{p.marketer_name} ({p.marketer_unique_id})</td>
                    <td className="px-4 py-2">{p.admin_name} ({p.admin_unique_id})</td>
                    <td className="px-4 py-2">{p.device_name}</td>
                    <td className="px-4 py-2">{p.device_model}</td>
                    <td className="px-4 py-2">{p.quantity}</td>
                    <td className="px-4 py-2">
                      {new Date(p.pickup_date).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      {new Date(p.deadline).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      {countdown}
                    </td>
                    <td className="px-4 py-2 capitalize">{p.status}</td>
                    <td className="px-4 py-2">{p.location_name || 'N/A'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredPickups.length)} of {filteredPickups.length} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1;
              const isCurrentPage = page === currentPage;
              const isNearCurrent = Math.abs(page - currentPage) <= 2;
              
              if (isCurrentPage || isNearCurrent || page === 1 || page === totalPages) {
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      isCurrentPage
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (page === 2 && currentPage > 4) {
                return <span key={page} className="px-3 py-2 text-gray-500">...</span>;
              } else if (page === totalPages - 1 && currentPage < totalPages - 3) {
                return <span key={page} className="px-3 py-2 text-gray-500">...</span>;
              }
              return null;
            })}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
