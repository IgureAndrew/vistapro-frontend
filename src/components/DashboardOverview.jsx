// src/components/DashboardOverview.jsx
import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const DashboardOverview = () => {
  // State to hold real-time data
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    pendingApprovals: 0,
    totalSales: 0,
  });
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    // Connect to your backend's Socket.IO server using the VITE_API_URL
    const socket = io(import.meta.env.VITE_API_URL, {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      setSocketConnected(true);
    });

    // Listen for the "real-time-data" event
    socket.on("real-time-data", (data) => {
      console.log("Received real-time data:", data);
      setStats(data);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      setSocketConnected(false);
    });

    // Cleanup on unmount
    return () => socket.disconnect();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Real-Time Dashboard Overview</h1>
      {!socketConnected && (
        <p className="text-sm text-gray-500">Connecting to real-time data...</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-white shadow rounded">
          <h2 className="text-xl font-semibold">Total Users</h2>
          <p className="text-2xl">{stats.totalUsers}</p>
        </div>
        <div className="p-4 bg-white shadow rounded">
          <h2 className="text-xl font-semibold">Total Orders</h2>
          <p className="text-2xl">{stats.totalOrders}</p>
        </div>
        <div className="p-4 bg-white shadow rounded">
          <h2 className="text-xl font-semibold">Pending Approvals</h2>
          <p className="text-2xl">{stats.pendingApprovals}</p>
        </div>
        <div className="p-4 bg-white shadow rounded">
          <h2 className="text-xl font-semibold">Total Sales</h2>
          <p className="text-2xl">₦{stats.totalSales.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
