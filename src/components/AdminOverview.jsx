// src/components/AdminOverview.jsx
import React, { useState, useEffect } from "react";
import {
  BarChart2,
  Users,
  CheckCircle,
  CheckSquare,
  Clock,
  ClipboardList,
  MoreVertical
} from "lucide-react";
import api from "../api";

export default function AdminOverview() {
  const [summary, setSummary] = useState({
    totalSales:         0,
    assignedMarketers:  0,
    verifiedMarketers:  0,
    confirmedOrders:    0,
    pendingOrders:      0,
    stockTakenOrders:   0,
  });

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await api.get("/api/admin/dashboard-summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSummary({
        totalSales:        data.totalSales        || 0,
        assignedMarketers: data.assignedMarketers || 0,
        verifiedMarketers: data.verifiedMarketers || 0,
        confirmedOrders:   data.confirmedOrders   || 0,
        pendingOrders:     data.pendingOrders     || 0,
        stockTakenOrders:  data.stockTakenOrders  || 0,
      });
    } catch (err) {
      console.error("Error loading admin summary:", err);
    }
  };

  useEffect(() => {
    fetchSummary();
    const iv = setInterval(fetchSummary, 10_000);
    return () => clearInterval(iv);
  }, []);

  const cards = [
    {
      Icon: BarChart2,
      label: "Total Sales",
      value: `₦${summary.totalSales.toLocaleString()}.00`,
      change: "+8.1%",
      color: "text-blue-600",
    },
    {
      Icon: Users,
      label: "Assigned Marketers",
      value: summary.assignedMarketers,
      change: "+3.2%",
      color: "text-green-600",
    },
    {
      Icon: CheckCircle,
      label: "Verified Marketers",
      value: summary.verifiedMarketers,
      change: "+5.0%",
      color: "text-teal-600",
    },
    {
      Icon: CheckSquare,
      label: "Confirmed Orders",
      value: summary.confirmedOrders,
      change: "+4.7%",
      color: "text-purple-600",
    },
    {
      Icon: Clock,
      label: "Pending Orders",
      value: summary.pendingOrders,
      change: "+8.5%",
      color: "text-red-600",
    },
    {
      Icon: ClipboardList,
      label: "Stock Taken Orders",
      value: summary.stockTakenOrders,
      change: "+6.3%",
      color: "text-indigo-600",
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map(({ Icon, label, value, change, color }) => (
          <div
            key={label}
            className="bg-white rounded-lg shadow flex flex-col justify-between p-5"
          >
            <div className="flex justify-between items-start">
              <Icon className="text-gray-400" size={24} />
              <MoreVertical className="text-gray-400 cursor-pointer" size={20} />
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-bold mt-1">{value}</p>
            </div>
            <div className="mt-4">
              <span className={`text-sm font-medium ${color}`}>{change}</span>{" "}
              <span className="text-xs text-gray-400">from last month</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
