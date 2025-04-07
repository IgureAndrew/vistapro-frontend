// src/components/MarketersOverview.jsx
import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import api from "../api"; // Your custom axios instance for API calls

const MarketersOverview = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSales: 0,
    pendingOrders: 0,
  });

  useEffect(() => {
    // Connect to the Socket.IO server using your API base URL.
    const socket = io(import.meta.env.VITE_API_URL, {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    // Listen for a "new-order" event from the backend
    socket.on("new-order", (newOrder) => {
      setOrders((prevOrders) => [newOrder, ...prevOrders]);
      // Optionally update stats if the new order affects totals
      setStats((prevStats) => ({
        ...prevStats,
        totalOrders: prevStats.totalOrders + 1,
        totalSales: prevStats.totalSales + newOrder.sold_amount,
      }));
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  // Optionally, load initial data via API when the component mounts
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem("token");
        // Fetch current orders
        const ordersRes = await api.get("/api/marketer/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(ordersRes.data.orders);
        // Fetch statistics summary (if available)
        const statsRes = await api.get("/api/marketer/dashboard-summary", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(statsRes.data);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };
    fetchInitialData();
  }, []);

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-white shadow rounded">
          <h2 className="text-xl font-semibold">Total Orders</h2>
          <p className="text-2xl">{stats.totalOrders}</p>
        </div>
        <div className="p-4 bg-white shadow rounded">
          <h2 className="text-xl font-semibold">Total Sales</h2>
          <p className="text-2xl">₦{stats.totalSales.toFixed(2)}</p>
        </div>
        <div className="p-4 bg-white shadow rounded">
          <h2 className="text-xl font-semibold">Pending Orders</h2>
          <p className="text-2xl">{stats.pendingOrders}</p>
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold mb-2">Recent Orders</h2>
        {orders.length > 0 ? (
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 border">Order ID</th>
                <th className="px-4 py-2 border">Device</th>
                <th className="px-4 py-2 border">Quantity</th>
                <th className="px-4 py-2 border">Sold Amount</th>
                <th className="px-4 py-2 border">Sale Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-2 border">{order.id}</td>
                  <td className="px-4 py-2 border">{order.device_name}</td>
                  <td className="px-4 py-2 border">{order.number_of_devices}</td>
                  <td className="px-4 py-2 border">₦{order.sold_amount}</td>
                  <td className="px-4 py-2 border">
                    {new Date(order.sale_date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No orders found.</p>
        )}
      </div>
    </div>
  );
};

export default MarketersOverview;
