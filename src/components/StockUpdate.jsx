// src/components/StockUpdates.jsx
import React, { useEffect, useState } from "react";
import api from "../api"; // axios instance w/ baseURL="${VITE_API_URL}/api"

export default function StockUpdates() {
  const token       = localStorage.getItem("token");
  const stored      = localStorage.getItem("user");
  const currentUser = stored ? JSON.parse(stored) : {};
  const isMasterAdmin = currentUser.role === "MasterAdmin";

  const [updates, setUpdates] = useState([]);
  const [filter,  setFilter]  = useState("");
  const [now,     setNow]     = useState(Date.now());
  const [error,   setError]   = useState("");

  // 1) tick clock every second for live countdown / count-up
  useEffect(() => {
    const tid = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tid);
  }, []);

  // 2) fetch all pickups (with device, dealer & transfer target fields)
  const loadUpdates = () => {
    api
      .get("/stock", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setUpdates(r.data.data || []))
      .catch(err => setError(err.response?.data?.message || err.message));
  };
  useEffect(loadUpdates, [token]);

  // 3) format countdown or count-up if past deadline
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

  // 4) simple text-filter across marketer, ID, device, dealer, transfer target, status
  const filtered = updates.filter(u => {
    const t = filter.toLowerCase();
    return (
      u.marketer_name.toLowerCase().includes(t) ||
      u.marketer_unique_id.toLowerCase().includes(t) ||
      (`${u.device_name} ${u.device_model}`).toLowerCase().includes(t) ||
      u.dealer_name.toLowerCase().includes(t) ||
      u.dealer_location.toLowerCase().includes(t) ||
      (u.transfer_to_name?.toLowerCase().includes(t)) ||
      (u.transfer_to_uid?.toLowerCase().includes(t)) ||
      u.status.toLowerCase().includes(t) ||
      u.transfer_status.toLowerCase().includes(t)
    );
  });

  // 5) Approve or reject a transfer
  const handleTransferAction = async (id, action) => {
    try {
      await api.patch(
        `/stock/${id}/transfer`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadUpdates();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update transfer");
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">All Stock Pickups</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}

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
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {[
                "Marketer","ID","Device","Dealer","Location",
                "Qty","Picked Up","Deadline","Countdown",
                "Transfer To","Transfer Status","Actions"
              ].map(h => (
                <th
                  key={h}
                  className="px-4 py-2 text-left text-sm font-medium text-gray-700"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-4 py-6 text-center text-gray-500">
                  No pickups to display.
                </td>
              </tr>
            ) : filtered.map(u => {
                const isExpired = new Date(u.deadline).getTime() < now;
                return (
                  <tr key={u.id}>
                    <td className="px-4 py-2 text-sm text-gray-800">{u.marketer_name}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{u.marketer_unique_id}</td>
                    <td className="px-4 py-2 text-sm">{u.device_name} {u.device_model}</td>
                    <td className="px-4 py-2 text-sm">{u.dealer_name}</td>
                    <td className="px-4 py-2 text-sm">{u.dealer_location}</td>
                    <td className="px-4 py-2 text-sm">{u.quantity}</td>
                    <td className="px-4 py-2 text-sm">
                      {new Date(u.pickup_date).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {new Date(u.deadline).toLocaleString()}
                    </td>
                    <td className={`px-4 py-2 text-sm ${isExpired ? "text-red-600" : "text-gray-800"}`}>
                      {formatCountdown(u.deadline)}
                    </td>

                    {/* Transfer target */}
                    <td className="px-4 py-2 text-sm">
                      {u.transfer_to_name
                        ? `${u.transfer_to_name} (${u.transfer_to_uid})`
                        : "—"
                      }
                    </td>

                    {/* Transfer status */}
                    <td className="px-4 py-2 text-sm capitalize">
                      {u.transfer_status}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-2 text-sm">
                      {u.transfer_status === "pending" && isMasterAdmin ? (
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
                      ) : (
                        <span className="capitalize">
                          {u.transfer_status !== "none"
                            ? u.transfer_status
                            : "—"
                          }
                        </span>
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
