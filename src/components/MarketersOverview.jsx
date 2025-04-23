// src/components/MarketersOverview.jsx
import React, { useEffect, useState, useMemo } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Clock,
  BarChart2,
  Wallet,
  MoreVertical
} from "lucide-react";
import api from "../api";

export default function MarketersOverview() {
  const navigate = useNavigate();
  const stored = localStorage.getItem("user");
  const currentUser = stored ? JSON.parse(stored) : {};
  const marketerName = currentUser.first_name
    ? `${currentUser.first_name} ${currentUser.last_name}`
    : currentUser.name || "You";
  const marketerId = currentUser.unique_id || "";

  // All orders fetched/pushed
  const [orders, setOrders] = useState([]);

  // Dashboard stats
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSales: 0,
    pendingOrders: 0,
    wallet: 0,              // ← commission earned
  });

  // Date filter controls
  const [dateFilter, setDateFilter] = useState("All Time");

  // 1) Real‑time socket listener for new orders
  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL, { transports: ["websocket"] });
    socket.on("new-order", newOrder => {
      if (newOrder.marketer_unique_id === marketerId) {
        const amt = Number(newOrder.sold_amount) || 0;
        setOrders(prev => [newOrder, ...prev]);
        setStats(prev => ({
          totalOrders: prev.totalOrders + 1,
          totalSales: prev.totalSales + amt,
          pendingOrders: prev.pendingOrders + (newOrder.status === "pending" ? 1 : 0),
          wallet: prev.wallet,
        }));
      }
    });
    return () => socket.disconnect();
  }, [marketerId]);

  // 2) Initial fetch of orders + wallet balance
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");

        // a) fetch orders
        const { data: orderData } = await api.get("/marketer/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const fetched = orderData.orders || [];
        setOrders(fetched);

        // derive order stats
        const derived = fetched.reduce(
          (acc, o) => {
            acc.totalOrders += 1;
            acc.totalSales += Number(o.sold_amount) || 0;
            if (o.status === "pending") acc.pendingOrders += 1;
            return acc;
          },
          { totalOrders: 0, totalSales: 0, pendingOrders: 0 }
        );

        setStats({
          ...derived,
          wallet: 0, // placeholder until we fetch it
        });

        // b) fetch wallet/commission balance
        const { data: walletData } = await api.get("/wallets", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(prev => ({
          ...prev,
          wallet: walletData.balance ?? 0,
        }));
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      }
    })();
  }, []);

  // 3) Filter orders by date
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
      return true; // All Time
    });
  }, [orders, dateFilter]);

  return (
    <div className="p-6 space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            icon: <ShoppingCart size={20} className="text-gray-500" />,
            label: "Total Orders",
            value: stats.totalOrders,
            change: "+5.5%",
            changeColor: "text-green-600",
          },
          {
            icon: <Clock size={20} className="text-gray-500" />,
            label: "Pending Orders",
            value: stats.pendingOrders,
            change: "+8.5%",
            changeColor: "text-red-600",
          },
          {
            icon: <BarChart2 size={20} className="text-gray-500" />,
            label: "Total Sales",
            value: `₦${stats.totalSales.toFixed(2)}`,
            change: "+8.1%",
            changeColor: "text-blue-600",
          },
          {
            icon: <Wallet size={20} className="text-gray-500" />,
            label: "Wallet",
            value: `₦${stats.wallet.toFixed(2)}`,
            change: "+12.3%",
            changeColor: "text-purple-600",
          },
        ].map(({ icon, label, value, change, changeColor }, i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-lg shadow flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              {icon}
              <MoreVertical size={16} className="text-gray-400 cursor-pointer" />
            </div>
            <div className="mt-4">
              <h3 className="text-sm text-gray-500">{label}</h3>
              <p className="mt-2 text-2xl font-bold">{value}</p>
            </div>
            <p className={`mt-3 text-xs font-medium ${changeColor}`}>{change}</p>
            <p className="text-xs text-gray-400">increased from last month</p>
          </div>
        ))}
      </div>

      {/* Recent Activity Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-lg font-semibold">Recent Activity 📝</h2>
        <div className="flex items-center gap-3">
          <select
            className="border rounded px-3 py-1 text-sm"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
          >
            {["All Time", "Last 7 Days", "Last 30 Days"].map(opt => (
              <option key={opt}>{opt}</option>
            ))}
          </select>
          <button
            onClick={() => navigate("/dashboard/order")}
            className="bg-indigo-600 text-white px-4 py-1 rounded text-sm hover:bg-indigo-700"
          >
            New Order
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
              {[
                "Marketer Name",
                "Unique ID",
                "Device Name",
                "Device Model",
                "Device Type",
                "Price",
                "BNPL Platform",
                "Status",
              ].map(hdr => (
                <th
                  key={hdr}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                >
                  {hdr}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredOrders.length > 0 ? (
              filteredOrders.map(o => (
                <tr key={o.id}>
                  <td className="px-4 py-2 text-sm text-gray-700">{marketerName}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{marketerId}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{o.device_name}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{o.device_model}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{o.device_type}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    ₦{Number(o.sold_amount).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {o.bnpl_platform || "No"}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <span
                      className={`px-2 inline-flex text-xs font-semibold rounded-full ${
                        o.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : o.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
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
