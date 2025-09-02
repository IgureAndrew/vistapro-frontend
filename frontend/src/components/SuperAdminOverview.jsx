// src/components/SuperAdminOverview.jsx
import React, { useState, useEffect, useMemo } from "react";
import { io } from "socket.io-client";
import {
  User,
  Clock,
  CheckCircle,
  BarChart2,
  Box,
  ClipboardList,
  Package,
  MoreVertical,
} from "lucide-react";
import api from "../api";

export default function SuperAdminOverview() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    previousTotalUsers: 0,
    totalPendingOrders: 0,
    previousPendingOrders: 0,
    totalConfirmedOrders: 0,
    previousConfirmedOrders: 0,
    totalSales: 0,
    previousSales: 0,
    totalAvailableProducts: 0,
    previousAvailableProducts: 0,
    pendingVerification: 0,
    previousPendingVerification: 0,
    totalPickupStocks: 0,
    previousPickupStocks: 0,
  });
  const [dateFilter, setDateFilter] = useState("All Time");
  const [recentActivity, setRecentActivity] = useState([]);

  // compute % change
  const computeChange = (current, previous) => {
    if (previous === 0) return { text: "N/A", color: "text-gray-500" };
    const pct = ((current - previous) / previous) * 100;
    const sign = pct > 0 ? "+" : "";
    return {
      text: `${sign}${pct.toFixed(1)}%`,
      color: pct > 0 ? "text-green-600" : pct < 0 ? "text-red-600" : "text-gray-600",
    };
  };

  // 1) Real-time socket updates
  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL, { transports: ["websocket"] });
    socket.on("superadmin-stats", (data) => {
      setStats(data);
    });
    return () => void socket.disconnect();
  }, []);

  // 2) Initial fetch of stats
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await api.get("/super-admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
          params: { period: dateFilter },
        });
        setStats(data);
      } catch (err) {
        console.error("Failed to load super-admin stats:", err);
      }
    })();
  }, [dateFilter]);

  // 3) Fetch recent activity
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await api.get("/super-admin/recent-activity", {
          headers: { Authorization: `Bearer ${token}` },
          params: { period: dateFilter },
        });
        setRecentActivity(data.activities || []);
      } catch (err) {
        console.error("Failed to load recent activity:", err);
      }
    })();
  }, [dateFilter]);

  // build cards
  const cards = useMemo(
    () => [
      {
        icon: <User size={20} />,
        label: "Total Users",
        value: stats.totalUsers,
        ...computeChange(stats.totalUsers, stats.previousTotalUsers),
      },
      {
        icon: <Clock size={20} />,
        label: "Pending Orders",
        value: stats.totalPendingOrders,
        ...computeChange(stats.totalPendingOrders, stats.previousPendingOrders),
      },
      {
        icon: <CheckCircle size={20} />,
        label: "Confirmed Orders",
        value: stats.totalConfirmedOrders,
        ...computeChange(stats.totalConfirmedOrders, stats.previousConfirmedOrders),
      },
      {
        icon: <BarChart2 size={20} />,
        label: "Total Sales",
        value: `₦${stats.totalSales.toLocaleString()}`,
        ...computeChange(stats.totalSales, stats.previousSales),
      },
      {
        icon: <Box size={20} />,
        label: "Available Products",
        value: stats.totalAvailableProducts,
        ...computeChange(
          stats.totalAvailableProducts,
          stats.previousAvailableProducts
        ),
      },
      {
        icon: <ClipboardList size={20} />,
        label: "Pending Verification",
        value: stats.pendingVerification,
        ...computeChange(
          stats.pendingVerification,
          stats.previousPendingVerification
        ),
      },
      {
        icon: <Package size={20} />,
        label: "Pickup Stocks",
        value: stats.totalPickupStocks,
        ...computeChange(
          stats.totalPickupStocks,
          stats.previousPickupStocks
        ),
      },
    ],
    [stats]
  );

  return (
    <div className="p-6 space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cards.map(({ icon, label, value, text: change, color: changeColor }, i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-lg shadow flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              {icon}
              <MoreVertical
                size={16}
                className="text-gray-400 cursor-pointer"
              />
            </div>
            <div className="mt-4">
              <h3 className="text-sm text-gray-500">{label}</h3>
              <p className="mt-2 text-2xl font-bold">{value}</p>
            </div>
            <p className={`mt-3 text-xs font-medium ${changeColor}`}>
              {change}
            </p>
            <p className="text-xs text-gray-400">from last period</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent Activity 📋</h2>
        <div className="flex items-center gap-3">
          <select
            className="border rounded px-3 py-1 text-sm"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            {["All Time", "Last 7 Days", "Last 30 Days"].map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </select>
          <button className="bg-[#f59e0b] text-black px-4 py-1 rounded text-sm hover:brightness-95">
            Go to Approvals
          </button>
          <button className="bg-purple-600 text-white px-4 py-1 rounded text-sm hover:bg-purple-700">
            Download Report
          </button>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {["Activity", "Entity", "Entity ID", "Performed By", "When"].map(
                (hdr) => (
                  <th
                    key={hdr}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    {hdr}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {recentActivity.length > 0 ? (
              recentActivity.map((act) => (
                <tr key={act.id}>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {act.activityType}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {act.entityType}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {act.entityId}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {act.actorName}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {new Date(act.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="px-4 py-6 text-center text-gray-500"
                >
                  No recent activity.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
