
// src/components/AdminStockPickups.jsx
import React, { useState, useEffect } from "react";
import api from "../api"; // axios instance with baseURL = '/api'
import MarketerStockPickup from "./MarketerStockPickup";
import { ArrowLeft } from "lucide-react";

export default function AdminStockPickups({ onNavigate }) {
  // Tab state - switch between "My Actions" and "Team Monitoring"
  const [activeTab, setActiveTab] = useState("my-actions");

  // Team monitoring state (existing functionality)
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
        const res   = await api.get("/stock/admin/stock-pickup", {
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

  function formatCountdown(deadline) {
    const diff = new Date(deadline).getTime() - now;
    
    if (diff >= 0) {
      // Still pending - show remaining time (countdown)
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
      // Expired - show how long ago it expired (count-up)
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
  }

  if (loading) return <p className="p-4">Loading stock pickups…</p>;
  if (error)   return <p className="p-4 text-red-600">{error}</p>;

  return (
    <div className="px-4 py-6 md:px-6 lg:px-12 bg-white rounded shadow">
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
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Stock Pickups</h2>
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
          <h3 className="text-lg font-semibold mb-4">Marketers' Stock Pickups</h3>
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

                // Show countdown/count-up based on status and time
                let countdown;
                console.log(`Debug: Pickup ID ${s.id}, Status: "${s.status}", Type: ${typeof s.status}, === 'sold': ${s.status === 'sold'}`);
                
                if (s.status === 'sold') {
                  // If sold, show "Sold" instead of countdown
                  console.log(`Debug: Showing "Sold" for pickup ID ${s.id}`);
                  countdown = <span className="text-green-600 font-semibold">Sold</span>;
                } else {
                  // For other statuses, show countdown/count-up based on time
                  console.log(`Debug: Showing countdown for pickup ID ${s.id} with status "${s.status}"`);
                  const isExpired = new Date(s.deadline).getTime() < now;
                  countdown = isExpired ? (
                    <span className="text-red-600">
                      {formatCountdown(s.deadline)}
                    </span>
                  ) : (
                    <span className="text-green-600">
                      {formatCountdown(s.deadline)}
                    </span>
                  );
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
        </>
      )}
    </div>
  );
}
