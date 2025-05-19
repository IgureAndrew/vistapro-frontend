// src/components/MarketersOverview.jsx
import React, { useEffect, useState, useMemo } from "react";
import { io } from "socket.io-client";
import {
  ShoppingCart,
  Clock,
  BarChart2,
  Wallet,
  MoreVertical
} from "lucide-react";
import api from "../api";

export default function MarketersOverview() {
  const stored = localStorage.getItem("user");
  const currentUser = stored ? JSON.parse(stored) : {};
  const marketerName = currentUser.first_name
    ? `${currentUser.first_name} ${currentUser.last_name}`
    : currentUser.name || "You";
  const marketerId = currentUser.unique_id || "";

  const [orders, setOrders] = useState([]);
  const [stats,  setStats]  = useState({
    totalOrders: 0,
    totalSales:  0,
    pendingOrders: 0,
    wallet:      0,
  });
  const [dateFilter, setDateFilter] = useState("All Time");

  // live socket updates
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

  // initial fetch
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        // orders
        const { data: orderData } = await api.get("/marketer/orders/history", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const fetched = orderData.orders || [];
        setOrders(fetched);

        // derive stats from orders
        const derived = fetched.reduce((acc, o) => {
          acc.totalOrders++;
          acc.totalSales += Number(o.sold_amount) || 0;
          if (o.status === "pending") acc.pendingOrders++;
          return acc;
        }, { totalOrders: 0, totalSales: 0, pendingOrders: 0 });
        setStats({ ...derived, wallet: 0 });

        // wallet
        const { data } = await api.get("/wallets", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(prev => ({
          ...prev,
          wallet: data.wallet.available_balance || 0
        }));
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      }
    })();
  }, []);

  // date filtering
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter(o => {
      const d = new Date(o.sale_date);
      if (dateFilter === "Last 7 Days")
        return d >= new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      if (dateFilter === "Last 30 Days")
        return d >= new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
      return true;
    });
  }, [orders, dateFilter]);

  return (
    <div className="px-4 py-6 md:px-6 lg:px-12 space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[
          { icon: <ShoppingCart />, label: "Total Orders",   value: stats.totalOrders },
          { icon: <Clock />,        label: "Pending Orders", value: stats.pendingOrders },
          {
            icon: <BarChart2 />,
            label: "Total Sales",
            value: `₦${(Number(stats.totalSales) || 0).toFixed(2)}`
          },
          {
            icon: <Wallet />,
            label: "Wallet",
            value: `₦${(Number(stats.wallet) || 0).toFixed(2)}`
          },
        ].map(({ icon, label, value }, i) => (
          <div
            key={i}
            className="bg-white p-4 sm:p-5 rounded-lg shadow flex flex-col justify-between"
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

      {/* Recent Activity Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-semibold text-indigo-600 border-b-2 border-indigo-600 pb-1">
          Recent Activity 📝
        </h2>
        <select
          className="w-full sm:w-auto border rounded px-3 py-1 text-sm"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
        >
          {["All Time", "Last 7 Days", "Last 30 Days"].map(opt => (
            <option key={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {/* Recent Activity Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Marketer
              </th>
              <th className="hidden sm:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                ID
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Device
              </th>
              <th className="hidden md:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Model
              </th>
              <th className="hidden lg:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Type
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                Price
              </th>
              <th className="hidden md:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                BNPL
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredOrders.length > 0 ? (
              filteredOrders.map(o => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">
                    {marketerName}
                  </td>
                  <td className="hidden sm:table-cell px-3 py-2 text-sm text-gray-700">
                    {marketerId}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">
                    {o.device_name}
                  </td>
                  <td className="hidden md:table-cell px-3 py-2 text-sm text-gray-700">
                    {o.device_model}
                  </td>
                  <td className="hidden lg:table-cell px-3 py-2 text-sm text-gray-700">
                    {o.device_type}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-700 text-right whitespace-nowrap">
                    ₦{Number(o.sold_amount).toLocaleString()}
                  </td>
                  <td className="hidden md:table-cell px-3 py-2 text-sm text-gray-700 whitespace-nowrap">
                    {o.bnpl_platform || "No"}
                  </td>
                  <td className="px-3 py-2 text-sm">
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
