// src/components/SuperAdminStockPickups.jsx
import React, { useState, useEffect } from "react";

export default function SuperAdminStockPickups() {
  const API_URL = import.meta.env.VITE_API_URL + "/api/stock/superadmin/stock-updates";
  const token   = localStorage.getItem("token") || "";

  const [pickups, setPickups] = useState([]);
  const [now,     setNow]     = useState(Date.now());
  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(true);

  // live clock tick for countdowns
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // fetch pickups
  const fetchPickups = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to load pickups");
      setPickups(json.data || []);
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

  // format ms → "dd hh mm ss"
  function formatRemaining(ms) {
    if (ms <= 0) return "0h 0m 0s";
    const secTotal = Math.floor(ms / 1000);
    const days = Math.floor(secTotal / 86_400);
    const hrs  = Math.floor((secTotal % 86_400) / 3600);
    const mins = Math.floor((secTotal % 3600) / 60);
    const secs = secTotal % 60;
    return (
      (days > 0 ? days + "d " : "") +
      hrs + "h " +
      mins + "m " +
      secs + "s"
    );
  }

  if (loading) {
    return <div className="p-6">Loading stock pickups…</div>;
  }
  if (error) {
    return <div className="p-6 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">All Marketer Stock Pickups</h2>
      <button
        onClick={fetchPickups}
        className="mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Refresh
      </button>
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
                "Status"
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
            {pickups.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-4 text-center text-gray-500">
                  No pickups found.
                </td>
              </tr>
            ) : (
              pickups.map((p) => {
                const deadlineMs = new Date(p.deadline).getTime();
                const rem = deadlineMs - now;
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
                      {p.status === "pending"
                        ? formatRemaining(rem)
                        : p.status === "expired"
                        ? "Expired"
                        : "Sold"}
                    </td>
                    <td className="px-4 py-2 capitalize">{p.status}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
