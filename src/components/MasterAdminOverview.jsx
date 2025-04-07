// src/components/MasterAdminOverview.jsx
import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const MasterAdminOverview = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    pendingApprovals: 0,
    lockedUsers: 0,
    totalSales: 0,
  });
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    // Connect to the Socket.IO server using the API base URL from your environment variables
    const socket = io(import.meta.env.VITE_API_URL, {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      setSocketConnected(true);
    });

    // Listen for the real-time stats event
    socket.on("real-time-stats", (data) => {
      console.log("Received real-time stats:", data);
      setStats(data);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      setSocketConnected(false);
    });

    // Cleanup the socket connection on component unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Master Admin Dashboard Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {/* Total Users Card */}
        <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700">Total Users</h2>
          <p className="mt-2 text-3xl font-bold text-indigo-600">{stats.totalUsers}</p>
        </div>
        {/* Total Orders Card */}
        <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700">Total Orders</h2>
          <p className="mt-2 text-3xl font-bold text-green-600">{stats.totalOrders}</p>
        </div>
        {/* Pending Approvals Card */}
        <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700">Pending Approvals</h2>
          <p className="mt-2 text-3xl font-bold text-yellow-500">{stats.pendingApprovals}</p>
        </div>
        {/* Locked Users Card */}
        <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700">Locked Users</h2>
          <p className="mt-2 text-3xl font-bold text-red-500">{stats.lockedUsers}</p>
        </div>
        {/* Total Sales Card */}
        <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700">Total Sales</h2>
          <p className="mt-2 text-3xl font-bold text-purple-600">₦{stats.totalSales.toFixed(2)}</p>
        </div>
      </div>
      {!socketConnected && (
        <p className="mt-4 text-sm text-gray-500">Connecting to real-time data...</p>
      )}
    </div>
  );
};

export default MasterAdminOverview;
