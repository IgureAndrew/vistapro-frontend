// src/components/AdminOverview.jsx
import React, { useState, useEffect } from "react";
import api from "../api"; // Your custom axios instance

/**
 * AdminOverview Component
 *
 * This component fetches and displays real-time dashboard summary data for the admin.
 * The displayed metrics include:
 * - Total Sales
 * - Assigned Marketers (to the admin)
 * - Verified Marketers (of the assigned marketers)
 * - Confirmed Orders
 * - Pending Orders
 * - Stock Taken Orders
 *
 * The component uses polling (every 10 seconds) to keep the data up-to-date.
 */
const AdminOverview = () => {
  // State to hold the dashboard summary data.
  const [dashboardSummary, setDashboardSummary] = useState({
    totalSales: 0,
    assignedMarketers: 0,
    verifiedMarketers: 0,
    confirmedOrders: 0,
    pendingOrders: 0,
    stockTakenOrders: 0,
  });

  // Function to fetch the dashboard summary from the backend.
  const fetchDashboardSummary = async () => {
    try {
      const token = localStorage.getItem("token");
      // Expect your backend endpoint to return an object with these keys:
      // totalSales, assignedMarketers, verifiedMarketers, confirmedOrders, pendingOrders, stockTakenOrders
      const response = await api.get("/api/admin/dashboard-summary", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data) {
        // We only care about the necessary metrics here.
        const {
          totalSales,
          assignedMarketers,
          verifiedMarketers,
          confirmedOrders,
          pendingOrders,
          stockTakenOrders,
        } = response.data;
        setDashboardSummary({
          totalSales,
          assignedMarketers,
          verifiedMarketers,
          confirmedOrders,
          pendingOrders,
          stockTakenOrders,
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard summary:", error);
    }
  };

  useEffect(() => {
    // Initial fetch when the component mounts.
    fetchDashboardSummary();
    // Set an interval to refresh the summary every 10 seconds.
    const intervalId = setInterval(fetchDashboardSummary, 10000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white shadow p-4 rounded">
          <h2 className="text-xl font-semibold">Total Sales</h2>
          <p className="text-3xl">₦{dashboardSummary.totalSales}</p>
        </div>
        <div className="bg-white shadow p-4 rounded">
          <h2 className="text-xl font-semibold">Assigned Marketers</h2>
          <p className="text-3xl">{dashboardSummary.assignedMarketers}</p>
        </div>
        <div className="bg-white shadow p-4 rounded">
          <h2 className="text-xl font-semibold">Verified Marketers</h2>
          <p className="text-3xl">{dashboardSummary.verifiedMarketers}</p>
        </div>
        <div className="bg-white shadow p-4 rounded">
          <h2 className="text-xl font-semibold">Confirmed Orders</h2>
          <p className="text-3xl">{dashboardSummary.confirmedOrders}</p>
        </div>
        <div className="bg-white shadow p-4 rounded">
          <h2 className="text-xl font-semibold">Pending Orders</h2>
          <p className="text-3xl">{dashboardSummary.pendingOrders}</p>
        </div>
        <div className="bg-white shadow p-4 rounded">
          <h2 className="text-xl font-semibold">Stock Taken Orders</h2>
          <p className="text-3xl">{dashboardSummary.stockTakenOrders}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
