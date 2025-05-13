
// src/components/AdminStockPickups.jsx
import React, { useState, useEffect } from "react";
import api from "../api"; // axios instance with baseURL = '/api'

export default function AdminStockPickups() {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [now, setNow]         = useState(Date.now());

  // Live clock for countdown
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    async function fetchPickups() {
      try {
        const token = localStorage.getItem("token");
        const res   = await api.get("/stock/stock-pickup", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPickups(res.data.data || []);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to load pickups.");
      } finally {
        setLoading(false);
      }
    }
    fetchPickups();
  }, []);

  function formatRemaining(deadline) {
    const ms   = new Date(deadline).getTime() - now;
    const hrs  = Math.floor(ms / 3_600_000);
    const mins = Math.floor((ms % 3_600_000) / 60_000);
    const secs = Math.floor((ms % 60_000) / 1000);
    return `${hrs}h ${mins}m ${secs}s`;
  }

  if (loading) return <p className="p-4">Loading stock pickups…</p>;
  if (error)   return <p className="p-4 text-red-600">{error}</p>;

  return (
    <div className="p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Marketers’ Stock Pickups</h2>
      {pickups.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["#","Marketer","Device","Model","Qty","Picked Up","Deadline","Countdown","Status"]
                  .map(h => (
                    <th
                      key={h}
                      className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600"
                    >
                      {h}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pickups.map(s => {
                let statusLabel;
                switch (s.status) {
                  case "pending":  statusLabel = "Pending";  break;
                  case "sold":     statusLabel = "Sold";     break;
                  case "expired":  statusLabel = "Expired";  break;
                  default:
                    statusLabel = s.status.charAt(0).toUpperCase() +
                                  s.status.slice(1).replace(/_/g, " ");
                }

                let countdown;
                if (s.status === "pending") {
                  countdown = formatRemaining(s.deadline);
                } else if (s.status === "expired") {
                  countdown = (
                    <span className="text-red-600">
                      {formatRemaining(s.deadline)} ago
                    </span>
                  );
                } else {
                  countdown = "–";
                }

                return (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm">{s.id}</td>
                    <td className="px-4 py-2 text-sm">{s.marketer_name}</td>
                    <td className="px-4 py-2 text-sm">{s.device_name}</td>
                    <td className="px-4 py-2 text-sm">{s.device_model}</td>
                    <td className="px-4 py-2 text-sm">{s.quantity}</td>
                    <td className="px-4 py-2 text-sm">
                      {new Date(s.pickup_date).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {new Date(s.deadline).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-sm">{countdown}</td>
                    <td className="px-4 py-2 text-sm">{statusLabel}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500">No stock pickups found.</p>
      )}
    </div>
  );
}
