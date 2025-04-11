// src/components/ManageOrders.jsx
import React, { useState, useEffect } from "react";

function ManageOrders() {
  // Define base URLs from environment.
  const baseUrl = `${import.meta.env.VITE_API_URL}/api/manage-order`;
  const pendingOrdersUrl = `${baseUrl}/orders`;
  const ordersHistoryUrl = `${baseUrl}/history`;

  const token = localStorage.getItem("token");

  // State for pending orders and order history.
  const [orders, setOrders] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  // For error messages.
  const [error, setError] = useState("");
  // Array to hold the selected order IDs for confirmation.
  const [selectedOrders, setSelectedOrders] = useState([]);

  // Fetch pending orders.
  const fetchOrders = async () => {
    try {
      const res = await fetch(pendingOrdersUrl, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders);
      } else {
        setError(data.message || "Failed to fetch orders");
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Error fetching orders");
    }
  };

  // Fetch order history based on logged-in user's role.
  const fetchOrderHistory = async () => {
    try {
      const res = await fetch(ordersHistoryUrl, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setOrderHistory(data.orders);
      } else {
        setError(data.message || "Failed to fetch order history");
      }
    } catch (err) {
      console.error("Error fetching order history:", err);
      setError("Error fetching order history");
    }
  };

  // useEffect to fetch orders when the token updates.
  useEffect(() => {
    if (token) {
      fetchOrders();
      fetchOrderHistory();
    }
  }, [token]);

  // Handle checkbox change for each order.
  const handleCheckboxChange = (e, orderId) => {
    if (e.target.checked) {
      setSelectedOrders((prev) => [...prev, orderId]);
    } else {
      setSelectedOrders((prev) => prev.filter((id) => id !== orderId));
    }
  };

  // Handle confirming selected orders.
  // Loop over selected orders and send a PATCH request for each.
  const handleConfirmSelectedOrders = async () => {
    if (selectedOrders.length === 0) {
      alert("Please select at least one order to confirm.");
      return;
    }

    let failed = false;
    for (const orderId of selectedOrders) {
      try {
        const res = await fetch(`${baseUrl}/confirm`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ orderId }),
        });
        const data = await res.json();
        if (!res.ok) {
          failed = true;
          alert(`Failed to confirm order ${orderId}: ${data.message || ""}`);
        }
      } catch (error) {
        console.error(`Error confirming order ${orderId}:`, error);
        failed = true;
      }
    }
    if (!failed) {
      alert("Selected orders confirmed successfully!");
    }
    // Clear selection and refresh lists.
    setSelectedOrders([]);
    fetchOrders();
    fetchOrderHistory();
  };

  return (
    <div className="p-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">
        Manage Orders (Orders Sent by Marketers)
      </h2>

      <h3 className="text-lg font-semibold mb-2">Pending Orders</h3>
      {orders.length === 0 ? (
        <p>No pending orders to confirm.</p>
      ) : (
        <>
          <table className="min-w-full border mb-6">
            <thead>
              <tr className="bg-gray-200">
                <th className="px-4 py-2 border">Select</th>
                <th className="px-4 py-2 border">Order ID</th>
                <th className="px-4 py-2 border">Marketer Name</th>
                <th className="px-4 py-2 border">Unique ID</th>
                <th className="px-4 py-2 border">Location</th>
                <th className="px-4 py-2 border">BNPL</th>
                <th className="px-4 py-2 border">Device Type</th>
                <th className="px-4 py-2 border">Earnings</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-100">
                  <td className="border px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      onChange={(e) => handleCheckboxChange(e, order.id)}
                      checked={selectedOrders.includes(order.id)}
                    />
                  </td>
                  <td className="border px-4 py-2">{order.id}</td>
                  <td className="border px-4 py-2">
                    {order.marketer_name ? order.marketer_name : "N/A"}
                  </td>
                  <td className="border px-4 py-2">{order.marketer_unique_id}</td>
                  <td className="border px-4 py-2">
                    {order.marketer_location ? order.marketer_location : "N/A"}
                  </td>
                  <td className="border px-4 py-2">
                    {order.bnpl_platform || "N/A"}
                  </td>
                  <td className="border px-4 py-2">{order.device_type}</td>
                  <td className="border px-4 py-2">
                    {order.status && order.status.toLowerCase() === "confirmed"
                      ? (order.earnings ? `₦${order.earnings}` : "₦0")
                      : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={handleConfirmSelectedOrders}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            disabled={selectedOrders.length === 0}
          >
            Confirm Selected Orders
          </button>
        </>
      )}

      <h3 className="text-lg font-semibold mb-2">Order History</h3>
      {orderHistory.length === 0 ? (
        <p>No order history found.</p>
      ) : (
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-200">
              <th className="px-4 py-2 border">Order ID</th>
              <th className="px-4 py-2 border">Device</th>
              <th className="px-4 py-2 border">Confirmed At</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Earnings</th>
            </tr>
          </thead>
          <tbody>
            {orderHistory.map((order) => (
              <tr key={order.id}>
                <td className="border px-4 py-2">{order.id}</td>
                <td className="border px-4 py-2">
                  {order.device_name} {order.device_model} ({order.device_type})
                </td>
                <td className="border px-4 py-2">
                  {order.confirmed_at
                    ? new Date(order.confirmed_at).toLocaleString()
                    : "N/A"}
                </td>
                <td className="border px-4 py-2">{order.status || "Pending"}</td>
                <td className="border px-4 py-2">
                  {order.earnings ? `₦${order.earnings}` : "₦0"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ManageOrders;
