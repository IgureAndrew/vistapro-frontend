import React, { useEffect, useState } from "react";

function ManageOrders() {
  // Use the environment variable for the base URL (ensure it's set correctly)
  const baseUrl = `${import.meta.env.VITE_API_URL}/api/manage-order/orders`;
  const historyUrl = `${import.meta.env.VITE_API_URL}/api/manage-order/orders/history`;
  const token = localStorage.getItem("token");

  const [orders, setOrders] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [error, setError] = useState("");

  // Fetch pending orders
  const fetchOrders = async () => {
    try {
      const res = await fetch(baseUrl, {
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

  // Fetch order history
  const fetchOrderHistory = async () => {
    try {
      const res = await fetch(historyUrl, {
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

  useEffect(() => {
    fetchOrders();
    fetchOrderHistory();
  }, [token]);

  // Confirm order (pending orders) with a confirmation message
  const handleConfirmOrder = async (orderId) => {
    if (!confirmationMessage) {
      alert("Please enter a confirmation message.");
      return;
    }
    try {
      const res = await fetch(`${baseUrl}/${orderId}/confirm`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ confirmationMessage }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Order confirmed successfully!");
        setConfirmationMessage("");
        setSelectedOrderId(null);
        fetchOrders();
      } else {
        alert(data.message || "Failed to confirm order");
      }
    } catch (error) {
      console.error("Error confirming order:", error);
      alert("Error confirming order");
    }
  };

  // Confirm released order (for orders already released by dealers)
  const handleConfirmReleasedOrder = async (orderId) => {
    try {
      const res = await fetch(`${baseUrl}/${orderId}/confirm-release`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        alert("Released order confirmed successfully!");
        fetchOrders();
      } else {
        alert(data.message || "Failed to confirm released order");
      }
    } catch (error) {
      console.error("Error confirming released order:", error);
      alert("Error confirming released order");
    }
  };

  return (
    <div className="p-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Manage Orders</h2>

      <h3 className="text-lg font-semibold mb-2">Pending Orders</h3>
      {orders.length === 0 ? (
        <p>No orders to confirm.</p>
      ) : (
        <table className="min-w-full border mb-6">
          <thead>
            <tr className="bg-gray-200">
              <th className="px-4 py-2 border">Order ID</th>
              <th className="px-4 py-2 border">Device</th>
              <th className="px-4 py-2 border">Customer</th>
              <th className="px-4 py-2 border">BNPL</th>
              <th className="px-4 py-2 border">Sale Date</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-100">
                <td className="border px-4 py-2">{order.id}</td>
                <td className="border px-4 py-2">
                  {order.device_name} {order.device_model} ({order.device_type})
                </td>
                <td className="border px-4 py-2">
                  {order.customer_name}
                  <br />
                  {order.customer_phone}
                </td>
                <td className="border px-4 py-2">
                  {order.bnpl_platform ? order.bnpl_platform : "N/A"}
                </td>
                <td className="border px-4 py-2">
                  {new Date(order.sale_date).toLocaleString()}
                </td>
                <td className="border px-4 py-2">{order.status}</td>
                <td className="border px-4 py-2 space-x-2">
                  <button
                    onClick={() => setSelectedOrderId(order.id)}
                    className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
                  >
                    Confirm Order
                  </button>
                  <button
                    onClick={() => handleConfirmReleasedOrder(order.id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                  >
                    Confirm Release
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selectedOrderId && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Confirm Order {selectedOrderId}</h3>
          <textarea
            placeholder="Enter confirmation message..."
            value={confirmationMessage}
            onChange={(e) => setConfirmationMessage(e.target.value)}
            className="border border-gray-300 rounded px-4 py-2 w-full mb-2"
          />
          <button
            onClick={() => handleConfirmOrder(selectedOrderId)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            Submit Confirmation
          </button>
        </div>
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
            </tr>
          </thead>
          <tbody>
            {orderHistory.map((order) => (
              <tr key={order.id}>
                <td className="border px-4 py-2">{order.id}</td>
                <td className="border px-4 py-2">{order.device_name}</td>
                <td className="border px-4 py-2">
                  {order.confirmed_at
                    ? new Date(order.confirmed_at).toLocaleString()
                    : "N/A"}
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
