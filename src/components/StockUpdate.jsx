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

  // Format countdown or elapsed
  const formatCountdown = deadline => {
    const diff = new Date(deadline).getTime() - now;
    if (diff >= 0) {
      const hrs  = Math.floor(diff / 3_600_000);
      const mins = Math.floor((diff % 3_600_000) / 60_000);
      const secs = Math.floor((diff %    60_000) / 1000);
      return `${hrs}h ${mins}m ${secs}s`;
    } else {
      const over = -diff;
      const hrs  = Math.floor(over / 3_600_000);
      const mins = Math.floor((over % 3_600_000) / 60_000);
      const secs = Math.floor((over %    60_000) / 1000);
      return `${hrs}h ${mins}m ${secs}s ago`;
    }
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
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadUpdates();
    } catch (err) {
      setNotif({ message: err.response?.data?.message || "Failed", type: "error" });
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">All Stock Pickups</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {notif.message && (
        <div
          className={`mb-4 p-3 rounded ${
            notif.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {notif.message}
        </div>
      )}

      {/* ── Additional Pickup Requests ────────────────────── */}
      {isMasterAdmin && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">Additional Pickup Requests</h2>
          <div className="overflow-x-auto bg-white shadow rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  {["Req ID","Marketer","Device","Qty","Requested At","Status","Actions"].map(h => (
                    <th key={h} className="px-4 py-2 text-left font-medium text-gray-700">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-gray-500">
                      No additional‐pickup requests.
                    </td>
                  </tr>
                ) : requests.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{r.id}</td>
                    <td className="px-4 py-2">{r.marketer_name} ({r.marketer_uid})</td>
                    <td className="px-4 py-2">{r.device_name} {r.device_model}</td>
                    <td className="px-4 py-2">{r.requested_qty}</td>
                    <td className="px-4 py-2">{new Date(r.requested_at).toLocaleString()}</td>
                    <td className="px-4 py-2 capitalize">{r.status}</td>
                    <td className="px-4 py-2 space-x-2">
                      {r.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleRequestAction(r.id, "approve")}
                            className="px-2 py-1 bg-green-500 text-white rounded"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRequestAction(r.id, "reject")}
                            className="px-2 py-1 bg-red-500 text-white rounded"
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

      {/* ── Existing Stock Pickups ────────────────────────── */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Filter by marketer, ID, device, dealer, status…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="w-full max-w-md px-3 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              {[
                "Marketer","ID","Device","Dealer","Location",
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
            {updates.filter(u => {
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
            }).map(u => {
              const isExpired = new Date(u.deadline).getTime() < now;
              return (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{u.marketer_name}</td>
                  <td className="px-4 py-2">{u.marketer_unique_id}</td>
                  <td className="px-4 py-2">{u.device_name} {u.device_model}</td>
                  <td className="px-4 py-2">{u.dealer_name}</td>
                  <td className="px-4 py-2">{u.dealer_location}</td>
                  <td className="px-4 py-2">{u.quantity}</td>
                  <td className="px-4 py-2">{new Date(u.pickup_date).toLocaleString()}</td>
                  <td className="px-4 py-2">{new Date(u.deadline).toLocaleString()}</td>
                  <td className={`px-4 py-2 ${isExpired ? "text-red-600" : ""}`}>
                  {u.status.toLowerCase() === "pending"
                    ? formatCountdown(u.deadline)
                    : "—"}
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
    </div>
  );
}
