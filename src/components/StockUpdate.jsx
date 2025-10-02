// src/components/StockUpdates.jsx
import React, { useEffect, useState } from "react";
import api from "../api"; // axios instance w/ baseURL="${VITE_API_URL}/api"

export default function StockUpdates() {
  const token         = localStorage.getItem("token");
  const stored        = localStorage.getItem("user");
  const currentUser   = stored ? JSON.parse(stored) : {};
  const isMasterAdmin = currentUser.role === "MasterAdmin";

  const [updates,    setUpdates]    = useState([]);
  const [requests,   setRequests]   = useState([]);  // new
  const [filter,     setFilter]     = useState("");
  const [now,        setNow]        = useState(Date.now());
  const [error,      setError]      = useState("");
  const [notif,      setNotif]      = useState({ message: "", type: "" });
  
  // ── Pagination state ────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Live clock tick
  useEffect(() => {
    const tid = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tid);
  }, []);

  // Load both pickups & additional‐pickup requests
  const loadUpdates  = () =>
    api
      .get("/stock", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setUpdates(r.data.data || []))
      .catch(e => setError(e.response?.data?.message || e.message));

  // ← changed endpoint and response key here
  const loadRequests = () =>
    api
      .get("/stock/pickup/requests", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setRequests(r.data.requests || []))
      .catch(e => setError(e.response?.data?.message || e.message));

  useEffect(() => {
    loadUpdates();
    loadRequests();
  }, [token]);

  // ── Pagination helpers ────────────────────────────────────────
  const getPaginatedData = (data, page) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (data) => Math.ceil(data.length / itemsPerPage);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  // Enhanced countdown function that continues counting for expired items
  const formatCountdown = (deadline) => {
    const diff = new Date(deadline).getTime() - now;
    
    if (diff >= 0) {
      // Still pending - show remaining time
      const hrs = Math.floor(diff / 3_600_000);
      const mins = Math.floor((diff % 3_600_000) / 60_000);
      const secs = Math.floor((diff % 60_000) / 1_000);
      
      if (hrs > 0) {
        return `${hrs}h ${mins}m ${secs}s`;
      } else if (mins > 0) {
        return `${mins}m ${secs}s`;
      } else {
        return `${secs}s`;
      }
    } else {
      // Expired - show how long ago it expired (counting up)
      const absDiff = Math.abs(diff);
      const hrs = Math.floor(absDiff / 3_600_000);
      const mins = Math.floor((absDiff % 3_600_000) / 60_000);
      const secs = Math.floor((absDiff % 60_000) / 1_000);
      
      if (hrs > 0) {
        return `Expired ${hrs}h ${mins}m ago`;
      } else if (mins > 0) {
        return `Expired ${mins}m ${secs}s ago`;
      } else {
        return `Expired ${secs}s ago`;
      }
    }
  };

  // Check if item is expired
  const isExpired = (deadline) => {
    return new Date(deadline).getTime() < now;
  };

  // Auto‐clear notification after 3s
  useEffect(() => {
    if (!notif.message) return;
    const tid = setTimeout(() => setNotif({ message: "", type: "" }), 3000);
    return () => clearTimeout(tid);
  }, [notif]);

  // Approve/reject a pickup‐request
  const handleRequestAction = async (id, action) => {
    try {
      // ← changed PATCH URL to match your backend:
      await api.patch(
        `/stock/pickup/requests/${id}`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotif({ message: `Request ${action}d`, type: "success" });
      loadRequests();
    } catch (err) {
      setNotif({ message: err.response?.data?.message || "Failed", type: "error" });
    }
  };

  // Approve / reject transfer
  const handleTransferAction = async (id, action) => {
    try {
      await api.patch(
        `/stock/${id}/transfer`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotif({ message: `Transfer ${action}d`, type: "success" });
      loadUpdates();
    } catch (err) {
      setNotif({ message: err.response?.data?.message || "Failed", type: "error" });
    }
  };

  // Confirm return
  const handleConfirmReturn = async id => {
    try {
      await api.patch(
        `/stock/${id}/return`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotif({ message: "Return confirmed", type: "success" });
      loadUpdates();
    } catch (err) {
      setNotif({ message: err.response?.data?.message || "Failed", type: "error" });
    }
  };

  // Filter data
  const filteredUpdates = updates.filter(u => {
    const t = filter.toLowerCase();
    return (
      u.marketer_name.toLowerCase().includes(t) ||
      u.marketer_unique_id.toLowerCase().includes(t) ||
      (`${u.device_name} ${u.device_model}`).toLowerCase().includes(t) ||
      u.dealer_name.toLowerCase().includes(t) ||
      u.dealer_location.toLowerCase().includes(t) ||
      u.status.toLowerCase().includes(t) ||
      u.transfer_status.toLowerCase().includes(t)
    );
  });

  // Get paginated data
  const paginatedUpdates = getPaginatedData(filteredUpdates, currentPage);
  const totalPages = getTotalPages(filteredUpdates);

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Stock Update</h1>
        <p className="text-gray-600">Manage your stock settings and configurations.</p>
      </div>

      {/* ── Notification ────────────────────────────────────── */}
      {notif.message && (
        <div
          className={`mb-4 p-3 rounded ${
            notif.type === "success"
              ? "bg-green-100 text-green-700 border border-green-300"
              : "bg-red-100 text-red-700 border border-red-300"
          }`}
        >
          {notif.message}
        </div>
      )}

      {/* ── Additional Pickup Requests ────────────────────── */}
      {isMasterAdmin && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Additional Pickup Requests</h2>
          <p className="text-gray-600 mb-4">Review and approve requests for additional stock pickups from marketers.</p>
          <div className="overflow-x-auto bg-white shadow rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  {["Req ID","Marketer","Requested At","Status","Actions"].map(h => (
                    <th key={h} className="px-4 py-2 text-left font-medium text-gray-700">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500">
                      No additional pickup requests.
                    </td>
                  </tr>
                ) : requests.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-sm">{r.id}</td>
                    <td className="px-4 py-2">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{r.marketer_name}</span>
                        <span className="text-xs text-gray-600 font-mono">({r.marketer_uid})</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">{new Date(r.requested_at).toLocaleString()}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        r.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : r.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-2 space-x-2">
                      {r.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleRequestAction(r.id, "approve")}
                            className="px-3 py-1 bg-green-500 text-white rounded text-xs font-medium hover:bg-green-600 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRequestAction(r.id, "reject")}
                            className="px-3 py-1 bg-red-500 text-white rounded text-xs font-medium hover:bg-red-600 transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Filter Section ─────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by marketer name, ID, device, dealer, location, status..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:border-[#f59e0b] transition-colors"
            />
            {filter && (
              <button
                onClick={() => setFilter("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Filter Results Info */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {filter && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                {filteredUpdates.length} result{filteredUpdates.length !== 1 ? 's' : ''}
              </span>
            )}
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
              Total: {updates.length}
            </span>
          </div>
        </div>
        
        {/* Active Filter Display */}
        {filter && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-gray-600">Active filter:</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f59e0b] text-white">
              "{filter}"
            </span>
            <button
              onClick={() => setFilter("")}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear filter
            </button>
          </div>
        )}
      </div>

      {/* ── Main Stock Pickups Table ───────────────────────── */}
      
      {/* Info Section */}
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <h3 className="font-medium mb-2">How the Enhanced Countdown Works:</h3>
            <ul className="space-y-1 text-xs">
              <li>• <strong>Green badge + countdown:</strong> Shows remaining time until deadline (e.g., "2h 30m 15s")</li>
              <li>• <strong>Red badge + red countdown:</strong> Shows "Expired" and continues counting up (e.g., "Expired 2h 15m ago")</li>
              <li>• <strong>Live updates:</strong> Both countdowns update every second automatically</li>
              <li>• <strong>Complete history:</strong> Expired items show exactly how long ago they expired</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              {[
                "User Details","Device","Dealer","Location",
                "Qty","Picked Up","Deadline","Countdown",
                "Status","Transfer To","Transfer Status","Actions"
              ].map(h => (
                <th key={h} className="px-4 py-2 text-left font-medium text-gray-700">
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedUpdates.length === 0 ? (
              <tr>
                <td colSpan={12} className="p-4 text-center text-gray-500">
                  {filter ? "No results found for your filter." : "No stock pickups found."}
                </td>
              </tr>
            ) : paginatedUpdates.map(u => {
              const isExpired = new Date(u.deadline).getTime() < now;
              return (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{u.marketer_name}</span>
                      <span className="text-xs text-gray-600 font-mono">{u.marketer_unique_id}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2">{u.device_name} {u.device_model}</td>
                  <td className="px-4 py-2">{u.dealer_name}</td>
                  <td className="px-4 py-2">{u.dealer_location}</td>
                  <td className="px-4 py-2">{u.quantity}</td>
                  <td className="px-4 py-2">{new Date(u.pickup_date).toLocaleString()}</td>
                  <td className="px-4 py-2">{new Date(u.deadline).toLocaleString()}</td>
                  <td className="px-4 py-2">
                    {u.status.toLowerCase() === "pending" ? (
                      <div className="flex items-center gap-2">
                        {isExpired ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Pending
                          </span>
                        )}
                        <span className={`font-mono text-sm ${isExpired ? "text-red-600 font-semibold" : "text-gray-700"}`}>
                          {formatCountdown(u.deadline)}
                        </span>
                      </div>
                    ) : (u.status === 'sold' || u.status === 'returned' || u.status === 'transferred') ? (
                      <span className="text-green-600 font-semibold capitalize">
                        {u.status.replace(/_/g, " ")}
                      </span>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 capitalize">{u.status.replace(/_/g, " ")}</td>
                  <td className="px-4 py-2">
                    {u.transfer_to_name
                      ? `${u.transfer_to_name} (${u.transfer_to_uid})`
                      : "—"}
                  </td>
                  <td className="px-4 py-2 capitalize">{u.transfer_status}</td>
                  <td className="px-4 py-2 space-y-2">
                    {u.transfer_status === "pending" && isMasterAdmin && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleTransferAction(u.id, "approve")}
                          className="px-2 py-1 bg-green-500 text-white rounded"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleTransferAction(u.id, "reject")}
                          className="px-2 py-1 bg-red-500 text-white rounded"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {u.status === "Pending Return" && isMasterAdmin && (
                      <button
                        onClick={() => handleConfirmReturn(u.id)}
                        className="px-2 py-1 bg-blue-600 text-white rounded"
                      >
                        Confirm Return
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Pagination Controls ────────────────────────────── */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUpdates.length)} of {filteredUpdates.length} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm font-medium transition-colors bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm font-medium transition-colors bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
