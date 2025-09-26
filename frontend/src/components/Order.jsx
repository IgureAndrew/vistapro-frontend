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
    <div className="px-4 py-6 md:px-6 lg:px-12 space-y-6">
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
      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
        <div className="flex items-center mb-6">
          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Place Order</h2>
            <p className="text-sm text-gray-500">Create a new order for your picked up stock</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      <section className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Your Orders</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Total Orders:</span>
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {orders.length}
            </span>
          </div>
        </div>
        
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order #
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Device
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Model
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
              </tr>
            </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order, index) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-800">#{order.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{order.device_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.device_model}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {order.number_of_devices} {order.number_of_devices === 1 ? 'unit' : 'units'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          ₦{Number(order.sold_amount).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(order.sale_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(order.sale_date).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : order.status === 'confirmed' || order.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'cancelled' || order.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            order.status === 'pending' 
                              ? 'bg-yellow-400' 
                              : order.status === 'confirmed' || order.status === 'completed'
                              ? 'bg-green-400'
                              : order.status === 'cancelled' || order.status === 'rejected'
                              ? 'bg-red-400'
                              : 'bg-blue-400'
                          }`}></span>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
            </div>
            
            {/* Summary Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {orders.length} {orders.length === 1 ? 'order' : 'orders'}
                </div>
                <div className="text-sm font-medium text-gray-900">
                  Total Value: ₦{orders.reduce((sum, order) => sum + Number(order.sold_amount), 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
