// src/components/AdminOverview.jsx
import React, { useState, useEffect, useRef } from "react";
import api from "../api"; // Your custom axios instance
// import io from "socket.io-client"; // Uncomment if using Socket.IO for real-time updates

/**
 * AdminOverview Component
 *
 * This component fetches and displays real-time dashboard summary data.
 * It shows an overview of key metrics like total users, orders,
 * pending approvals, active sessions, and total sales.
 *
 * Two approaches are demonstrated:
 * 1. Polling: an API request is made every 10 seconds to refresh summary data.
 * 2. Socket.IO (commented out): real-time updates via a WebSocket event.
 */
const AdminOverview = () => {
  // State to hold the dashboard summary data
  const [dashboardSummary, setDashboardSummary] = useState({
    totalUsers: 0,
    totalOrders: 0,
    pendingApprovals: 0,
    activeSessions: 0,
    totalSales: 0,
  });

  // --------------- Approach 1: Polling via API ----------------
  const fetchDashboardSummary = async () => {
    try {
      const token = localStorage.getItem("token");
      // Ensure your backend route returns an object with keys:
      // totalUsers, totalOrders, pendingApprovals, activeSessions, totalSales
      const response = await api.get("/api/admin/dashboard-summary", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data) {
        setDashboardSummary(response.data);
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

  // --------------- Approach 2: Socket.IO for Real-Time Updates ---------------
  // Uncomment this section if you prefer using Socket.IO for real-time updates.
  /*
  const socketRef = useRef();
  useEffect(() => {
    // Initialize the socket connection with your backend URL.
    // Make sure to include "https" if your backend is secure.
    socketRef.current = io("https://vistapro-backend.onrender.com", {
      transports: ["websocket", "polling"],
    });

    // Listen for a "dashboardSummaryUpdated" event from the backend.
    socketRef.current.on("dashboardSummaryUpdated", (data) => {
      if (data) {
        setDashboardSummary(data);
      }
    });

    // Clean up the socket when the component unmounts.
    return () => {
      socketRef.current.disconnect();
    };
  }, []);
  */

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white shadow p-4 rounded">
          <h2 className="text-xl font-semibold">Total Users</h2>
          <p className="text-3xl">{dashboardSummary.totalUsers}</p>
        </div>
        <div className="bg-white shadow p-4 rounded">
          <h2 className="text-xl font-semibold">Total Orders</h2>
          <p className="text-3xl">{dashboardSummary.totalOrders}</p>
        </div>
        <div className="bg-white shadow p-4 rounded">
          <h2 className="text-xl font-semibold">Pending Approvals</h2>
          <p className="text-3xl">{dashboardSummary.pendingApprovals}</p>
        </div>
        <div className="bg-white shadow p-4 rounded">
          <h2 className="text-xl font-semibold">Active Sessions</h2>
          <p className="text-3xl">{dashboardSummary.activeSessions}</p>
        </div>
        <div className="bg-white shadow p-4 rounded">
          <h2 className="text-xl font-semibold">Total Sales</h2>
          <p className="text-3xl">₦{dashboardSummary.totalSales}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
