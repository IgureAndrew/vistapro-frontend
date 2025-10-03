// src/components/Order.jsx
import React, { useState, useEffect } from "react";
import AlertDialog from './ui/alert-dialog';
import { useAlert } from '../hooks/useAlert';

export default function Order() {
  const API_ROOT    = import.meta.env.VITE_API_URL + "/api/marketer";
  const PLACE_URL   = `${API_ROOT}/orders`;
  const HISTORY_URL = `${API_ROOT}/orders/history`;
  const token       = localStorage.getItem("token") || "";

  // Alert dialog hook
  const { alert, showSuccess, showError, hideAlert } = useAlert();

  // state
  const [pending,  setPending]  = useState([]);
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);

  const [selectedPickupId, setSelectedPickupId] = useState("");
  const [imeis,            setImeis]            = useState([]);

  const [form, setForm] = useState({
    bnpl_platform:   "",
    customer_name:   "",
    customer_phone:  "",
    customer_address:""
  });
  const [errors,     setErrors]     = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Expandable order state
  const [expandedOrders, setExpandedOrders] = useState(new Set());

  useEffect(() => {
    (async () => {
      await Promise.all([loadPending(), loadOrders()]);
      setLoading(false);
    })();
  }, []);

  async function loadPending() {
    const res  = await fetch(PLACE_URL, { headers:{ Authorization:`Bearer ${token}` }});
    const data = await res.json();
    setPending(data.pending || []);
  }

  async function loadOrders() {
    const res  = await fetch(HISTORY_URL, { headers:{ Authorization:`Bearer ${token}` }});
    const data = await res.json();
    setOrders(data.orders || []);
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateFilter("all");
    setSortBy("newest");
  };

  // Toggle order expansion
  const toggleOrderExpansion = (orderId) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  // Export orders functionality
  const exportOrders = (format) => {
    const dataToExport = filteredAndSortedOrders.map(order => ({
      'Order ID': order.id,
      'Device Name': order.device_name,
      'Device Model': order.device_model,
      'Customer Name': order.customer_name || 'N/A',
      'Customer Phone': order.customer_phone || 'N/A',
      'Customer Address': order.customer_address || 'N/A',
      'Quantity': order.number_of_devices,
      'Amount': `₦${Number(order.sold_amount).toLocaleString()}`,
      'Status': order.status.charAt(0).toUpperCase() + order.status.slice(1),
      'Order Date': new Date(order.sale_date).toLocaleDateString('en-US'),
      'Order Time': new Date(order.sale_date).toLocaleTimeString('en-US')
    }));

    if (format === 'csv') {
      // Convert to CSV
      const headers = Object.keys(dataToExport[0] || {});
      const csvContent = [
        headers.join(','),
        ...dataToExport.map(row => headers.map(header => `"${row[header]}"`).join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showSuccess('Orders exported to CSV successfully!');
    } else if (format === 'pdf') {
      // For PDF, we'll show a success message for now
      // In a real implementation, you'd use a library like jsPDF
      showSuccess('PDF export feature coming soon!');
    }
  };

  // Filter and sort orders
  const filteredAndSortedOrders = React.useMemo(() => {
    let filtered = orders.filter(order => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        order.customer_name?.toLowerCase().includes(searchLower) ||
        order.customer_phone?.toLowerCase().includes(searchLower) ||
        order.id?.toString().includes(searchTerm);

      // Status filter
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;

      // Date filter
      const orderDate = new Date(order.sale_date);
      const now = new Date();
      let matchesDate = true;
      
      if (dateFilter === "today") {
        matchesDate = orderDate.toDateString() === now.toDateString();
      } else if (dateFilter === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = orderDate >= weekAgo;
      } else if (dateFilter === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = orderDate >= monthAgo;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });

    // Sort orders
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.sale_date) - new Date(a.sale_date);
        case "oldest":
          return new Date(a.sale_date) - new Date(b.sale_date);
        case "amount-high":
          return Number(b.sold_amount) - Number(a.sold_amount);
        case "amount-low":
          return Number(a.sold_amount) - Number(b.sold_amount);
        default:
          return 0;
      }
    });

    return filtered;
  }, [orders, searchTerm, statusFilter, dateFilter, sortBy]);

  const selectedPickup = pending.find(p => p.stock_update_id === +selectedPickupId);

  function handlePickupChange(e) {
    const id = e.target.value;
    setSelectedPickupId(id);
    setErrors({});
    if (!id) return setImeis([]);
    const count = pending.find(p=>p.stock_update_id===+id)?.qty_reserved||0;
    setImeis(Array(count).fill(""));
  }

  function handleImeiChange(i, v) {
    setImeis(a => {
      const c = [...a]; c[i]=v; return c;
    });
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function validate() {
    const errs = {};
    if (!selectedPickupId)           errs.pickup = "Select a pickup";
    if (!imeis.length)               errs.imeis  = "Enter at least one IMEI";
    else if (imeis.some(i=>!/^\d{15}$/.test(i)))
                                     errs.imeis  = "Every IMEI must be 15 digits";

    if (!form.bnpl_platform)         errs.bnpl_platform   = "Select a BNPL option";
    if (!form.customer_name.trim())  errs.customer_name   = "Customer name is required";
    if (!/^[0-9]{7,15}$/.test(form.customer_phone))
                                     errs.customer_phone  = "Enter a valid phone number";
    if (!form.customer_address.trim())
                                     errs.customer_address = "Customer address is required";

    setErrors(errs);
    return !Object.keys(errs).length;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting || !validate()) return;

    const body = {
      stock_update_id:   +selectedPickupId,
      number_of_devices: imeis.length,
      imeis,
      bnpl_platform:     form.bnpl_platform,
      customer_name:     form.customer_name,
      customer_phone:    form.customer_phone,
      customer_address:  form.customer_address,
    };

    setSubmitting(true);
    const res = await fetch(PLACE_URL, {
      method: "POST",
      headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) {
      showError(data.message || "Failed to place order", "Order Failed");
      setSubmitting(false);
      return;
    }

    showSuccess("Order placed successfully!", "Order Confirmed");
    await Promise.all([loadPending(), loadOrders()]);
    setSubmitting(false);
    setSelectedPickupId(""); setImeis([]); setForm({
      bnpl_platform:"", customer_name:"", customer_phone:"", customer_address:""
    });
  }

  if (loading) return <div className="p-4">Loading…</div>;

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      {/* Alert Dialog */}
      <AlertDialog
        open={alert.open}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        confirmText={alert.confirmText}
        cancelText={alert.cancelText}
        onConfirm={alert.onConfirm}
        onCancel={alert.onCancel}
        showCancel={alert.showCancel}
        variant={alert.variant}
      />
      
      {/* ── PLACE ORDER ───────────────── */}
      <section className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 space-y-4 sm:space-y-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Place Order</h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Create a new order for your picked up stock</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Pickup selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Pickup</label>
            <select
              value={selectedPickupId}
              onChange={handlePickupChange}
              disabled={!pending.length || submitting}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">— choose one —</option>
              {pending.map(p => (
                <option key={p.stock_update_id} value={p.stock_update_id}>
                  [{p.qty_reserved}] {p.device_name} {p.device_model} — {p.dealer_name}
                </option>
              ))}
            </select>
            {errors.pickup && <p className="text-red-600 text-sm mt-1">{errors.pickup}</p>}
          </div>

          {/* Show selected pickup's details */}
          {selectedPickup && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-sm font-medium text-blue-900">Selected Pickup Details</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Device:</span>
                  <span className="ml-2 text-gray-900">{selectedPickup.device_name} {selectedPickup.device_model}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Type:</span>
                  <span className="ml-2 text-gray-900">{selectedPickup.device_type}</span>
                </div>
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-700">Dealer:</span>
                  <span className="ml-2 text-gray-900">{selectedPickup.dealer_name} ({selectedPickup.dealer_location})</span>
                </div>
              </div>
            </div>
          )}

          {/* IMEI inputs */}
          {imeis.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">IMEI Numbers</label>
              <div className="space-y-3">
          {imeis.map((val,i) => (
                  <div key={i} className="relative">
              <input
                type="text"
                value={val}
                maxLength={15}
                onChange={e=>handleImeiChange(i,e.target.value)}
                disabled={submitting}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder={`IMEI ${i+1} (15 digits)`}
              />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
            </div>
          ))}
              </div>
              {errors.imeis && <p className="text-red-600 text-sm mt-1">{errors.imeis}</p>}
            </div>
          )}

          {/* BNPL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">BNPL Options</label>
            <select
              name="bnpl_platform"
              value={form.bnpl_platform}
              onChange={handleFormChange}
              disabled={submitting}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">None</option>
              <option>WATU</option>
              <option>EASYBUY</option>
              <option>PALMPAY</option>
              <option>CREDLOCK</option>
            </select>
            {errors.bnpl_platform && <p className="text-red-600 text-sm mt-1">{errors.bnpl_platform}</p>}
          </div>

          {/* Customer info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
            <input
              name="customer_name"
              value={form.customer_name}
              onChange={handleFormChange}
              disabled={submitting}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter customer name"
            />
              {errors.customer_name && <p className="text-red-600 text-sm mt-1">{errors.customer_name}</p>}
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer Phone</label>
            <input
              name="customer_phone"
              value={form.customer_phone}
              onChange={handleFormChange}
              disabled={submitting}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter phone number"
            />
              {errors.customer_phone && <p className="text-red-600 text-sm mt-1">{errors.customer_phone}</p>}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Customer Address</label>
            <textarea
              name="customer_address"
              value={form.customer_address}
              onChange={handleFormChange}
              disabled={submitting}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter customer address"
            />
            {errors.customer_address && <p className="text-red-600 text-sm mt-1">{errors.customer_address}</p>}
          </div>

          <div className="pt-4">
          <button
            type="submit"
            disabled={!pending.length || submitting}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
                !pending.length || submitting 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              }`}
            >
              {submitting ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Placing Order...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Place Order
                </div>
              )}
          </button>
          </div>
        </form>
      </section>

      {/* ── YOUR ORDERS ───────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Your Orders</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Total Orders:</span>
            <span className="bg-[#f59e0b] text-white text-sm font-medium px-2.5 py-0.5 rounded-full">
              {orders.length}
            </span>
          </div>
        </div>

        {/* Search and Filter Bar */}
        {orders.length > 0 && (
          <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search orders by customer name, phone, or order ID..."
                className="w-full px-4 py-3 pl-10 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent transition-all duration-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Filter Options */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {/* Date Filter */}
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>

              {/* Sort Options */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="amount-high">Amount (High to Low)</option>
                <option value="amount-low">Amount (Low to High)</option>
              </select>

              {/* Clear Filters */}
              {(searchTerm || statusFilter !== 'all' || dateFilter !== 'all') && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors duration-200"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        )}
        
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h4>
            <p className="text-gray-500">Your order history will appear here once you place your first order.</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredAndSortedOrders.map((order, index) => {
              const isExpanded = expandedOrders.has(order.id);
              
              return (
                <div key={order.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-black/10 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 ease-out w-full">
                  {/* Order Header - Clickable */}
                  <div 
                    className="p-6 pr-8 cursor-pointer"
                    onClick={() => toggleOrderExpansion(order.id)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[#f59e0b] rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">#{order.id}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-black">{order.device_name}</h4>
                          <p className="text-sm text-gray-600">{order.device_model}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : order.status === 'confirmed' || order.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'cancelled' || order.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {order.status.includes('_') ? (
                            <div className="text-center">
                              <div>{order.status.split('_')[0].charAt(0).toUpperCase() + order.status.split('_')[0].slice(1)}</div>
                              <div>{order.status.split('_')[1].charAt(0).toUpperCase() + order.status.split('_')[1].slice(1)}</div>
                            </div>
                          ) : (
                            order.status.charAt(0).toUpperCase() + order.status.slice(1)
                          )}
                        </div>
                        <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''} flex items-center justify-center w-6 h-6 rounded-full hover:bg-gray-100 transition-colors duration-200`}>
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Quick Summary - Always Visible */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Customer</p>
                        <p className="font-semibold text-black">{order.customer_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Amount</p>
                        <p className="font-bold text-lg text-[#f59e0b]">₦{Number(order.sold_amount).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="px-6 pb-6 border-t border-gray-100">
                      {/* Detailed Order Information */}
                      <div className="grid grid-cols-2 gap-4 mb-4 pt-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Phone</p>
                          <p className="font-semibold text-black">{order.customer_phone || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Quantity</p>
                          <p className="font-semibold text-black">{order.number_of_devices} {order.number_of_devices === 1 ? 'unit' : 'units'}</p>
                        </div>
                      </div>

                      {/* Customer Address */}
                      {order.customer_address && (
                        <div className="mb-4">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Address</p>
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{order.customer_address}</p>
                        </div>
                      )}

                      {/* Order Date & Time */}
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Order Date</p>
                          <p className="text-sm font-medium text-black">
                            {new Date(order.sale_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Time</p>
                          <p className="text-sm font-medium text-black">
                            {new Date(order.sale_date).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-3">
                        <button className="flex-1 bg-[#f59e0b] text-white py-3 px-4 rounded-xl font-semibold text-sm hover:bg-[#d97706] transition-colors duration-200 ease-out">
                          View Details
                        </button>
                        {order.status === 'pending' && (
                          <button className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors duration-200 ease-out">
                            Track Order
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Analytics and Summary Footer */}
            <div className="bg-white rounded-2xl shadow-lg border border-black/10 p-6">
              {/* Analytics Cards */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Orders</p>
                  <p className="text-2xl font-bold text-black">{filteredAndSortedOrders.length}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Value</p>
                  <p className="text-2xl font-bold text-[#f59e0b]">₦{filteredAndSortedOrders.reduce((sum, order) => sum + Number(order.sold_amount), 0).toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Pending Orders</p>
                  <p className="text-2xl font-bold text-yellow-600">{filteredAndSortedOrders.filter(o => o.status === 'pending').length}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Completed Orders</p>
                  <p className="text-2xl font-bold text-green-600">{filteredAndSortedOrders.filter(o => o.status === 'completed' || o.status === 'confirmed').length}</p>
                </div>
              </div>

              {/* Summary and Actions */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {filteredAndSortedOrders.length} of {orders.length} {orders.length === 1 ? 'order' : 'orders'}
                </div>
                <div className="flex space-x-3">
                  <button 
                    onClick={() => exportOrders('csv')}
                    className="px-4 py-2 bg-[#f59e0b] text-white rounded-lg text-sm font-semibold hover:bg-[#d97706] transition-colors duration-200"
                  >
                    Export CSV
                  </button>
                  <button 
                    onClick={() => exportOrders('pdf')}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors duration-200"
                  >
                    Export PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
