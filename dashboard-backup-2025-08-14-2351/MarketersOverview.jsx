// src/components/MarketersOverview.jsx
import React, { useEffect, useState, useMemo } from "react";
import { io } from "socket.io-client";
import {
  ShoppingCart,
  Clock,
  BarChart2,
  Wallet,
  MoreVertical,
} from "lucide-react";
import api from "../api";

export default function MarketersOverview() {
  const stored      = localStorage.getItem("user");
  const currentUser = stored ? JSON.parse(stored) : {};
  const marketerName = currentUser.first_name
    ? `${currentUser.first_name} ${currentUser.last_name}`
    : currentUser.name || "You";
  const marketerId = currentUser.unique_id || "";

  const [orders, setOrders] = useState([]);
  const [stats, setStats]   = useState({
    totalOrders:   0,
    totalSales:    0,
    pendingOrders: 0,
    wallet:        0,
  });
  const [dateFilter, setDateFilter] = useState("All Time");

  // ── Live socket updates ────────────────────────────────────────
  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL, { transports: ["websocket"] });
    socket.on("new-order", newOrder => {
      if (newOrder.marketer_unique_id === marketerId) {
        const amt = Number(newOrder.sold_amount) || 0;
        setOrders(prev => [newOrder, ...prev]);
        setStats(prev => ({
          ...prev,
          totalOrders:   prev.totalOrders + 1,
          totalSales:    prev.totalSales + amt,
          pendingOrders: prev.pendingOrders + (newOrder.status === "pending" ? 1 : 0),
        }));
      }
    });
    return () => socket.disconnect();
  }, [marketerId]);

  // ── Initial fetch ─────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        // fetch orders history
        const { data: orderData } = await api.get("/marketer/orders/history", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const fetched = orderData.orders || [];
        setOrders(fetched);

        // derive stats
        const derived = fetched.reduce((acc, o) => {
          acc.totalOrders++;
          acc.totalSales += Number(o.sold_amount) || 0;
          if (o.status === "pending") acc.pendingOrders++;
          return acc;
        }, { totalOrders: 0, totalSales: 0, pendingOrders: 0 });
        setStats({ ...derived, wallet: 0 });

        // fetch wallet
        const { data: walletData } = await api.get("/wallets", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(prev => ({
          ...prev,
          wallet: Number(walletData.wallet.available_balance) || 0,
        }));
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      }
    })();
  }, []);

  // ── Filter orders by date ────────────────────────────────────
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter(o => {
      const d = new Date(o.sale_date);
      if (dateFilter === "Last 7 Days") {
        return d >= new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      }
      if (dateFilter === "Last 30 Days") {
        return d >= new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
      }
      return true;
    });
  }, [orders, dateFilter]);

  return (
    <div className="px-4 py-6 md:px-6 lg:px-12 space-y-6">
      {/* ── Stat Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[
          { icon: <ShoppingCart />, label: "Total Orders",   value: stats.totalOrders },
          { icon: <Clock />,        label: "Pending Orders", value: stats.pendingOrders },
          {
            icon: <BarChart2 />,
            label: "Total Sales",
            value: `₦${stats.totalSales.toFixed(2)}`,
          },
          {
            icon: <Wallet />,
            label: "Wallet",
            value: `₦${stats.wallet.toFixed(2)}`,
          },
        ].map(({ icon, label, value }, idx) => (
          <div
            key={idx}
            className="bg-white p-5 rounded-lg shadow flex flex-col justify-between"
          >
            <div className="flex justify-between items-center">
              <div className="text-gray-500">{icon}</div>
              <MoreVertical className="text-gray-300 cursor-pointer" />
            </div>
            <h3 className="mt-4 text-sm text-gray-500">{label}</h3>
            <p className="mt-2 text-2xl font-bold truncate">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Recent Activity Controls ────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-lg font-semibold text-indigo-600 border-b-2 border-indigo-600 pb-1">
          Recent Activity 📝
        </h2>
        <select
          className="w-full sm:w-auto border rounded px-3 py-1 text-sm"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
        >
          {["All Time", "Last 7 Days", "Last 30 Days"].map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {/* ── Mobile List View ───────────────────────────────────── */}
      <div className="sm:hidden space-y-4">
        {filteredOrders.length > 0 ? filteredOrders.map(o => (
          <div key={o.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">{o.device_name} {o.device_model}</span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                o.status === "completed"
                  ? "bg-green-100 text-green-800"
                  : o.status === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-800"
              }`}>
                {o.status.replace(/_/g, " ")}
              </span>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <div><strong>Marketer:</strong> {marketerName}</div>
              <div><strong>ID:</strong> {marketerId}</div>
              <div><strong>Type:</strong> {o.device_type}</div>
              <div className="flex justify-between">
                <span><strong>Price:</strong></span>
                <span>₦{Number(o.sold_amount).toLocaleString()}</span>
              </div>
              <div><strong>BNPL:</strong> {o.bnpl_platform || "No"}</div>
              <div className="text-xs text-gray-400">
                {new Date(o.sale_date).toLocaleDateString()}{" "}
                {new Date(o.sale_date).toLocaleTimeString()}
              </div>
            </div>
          </div>
        )) : (
          <p className="text-center text-gray-500">No orders found.</p>
        )}
      </div>

      {/* ── Desktop Table View ─────────────────────────────────── */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[
                "Marketer","ID","Device","Model","Type","Price","BNPL","Status"
              ].map(hdr => (
                <th
                  key={hdr}
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                >
                  {hdr}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredOrders.length > 0 ? filteredOrders.map(o => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">{marketerName}</td>
                <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">{marketerId}</td>
                <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">{o.device_name}</td>
                <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">{o.device_model}</td>
                <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">{o.device_type}</td>
                <td className="px-3 py-2 text-sm text-gray-700 text-right">₦{Number(o.sold_amount).toLocaleString()}</td>
                <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">{o.bnpl_platform || "No"}</td>
                <td className="px-3 py-2 text-sm">
                  <span className={`px-2 inline-flex text-xs font-semibold rounded-full ${
                    o.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : o.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {o.status.replace(/_/g, " ")}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-gray-500">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
