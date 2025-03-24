import React, { useEffect, useState } from "react";

function ManageOrders() {
  const baseUrl = "http://localhost:5000";
  const token = localStorage.getItem("token");
  const [orders, setOrders] = useState([]);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);

  // Fetch orders needing confirmation
  const fetchOrders = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/manage-orders`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders);
      } else {
        alert(data.message || "Failed to fetch orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  // Fetch order history
  const fetchOrderHistory = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/manage-orders/history`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setOrderHistory(data.orders);
      } else {
        alert(data.message || "Failed to fetch order history");
      }
    } catch (error) {
      console.error("Error fetching order history:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchOrderHistory();
  }, [token]);

  // Confirm order with a confirmation message
  const handleConfirmOrder = async (orderId) => {
    if (!confirmationMessage) {
      alert("Please enter a confirmation message.");
      return;
    }
    try {
      const res = await fetch(`${baseUrl}/api/manage-orders/${orderId}/confirm`, {
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
        fetchOrders();
      } else {
        alert(data.message || "Failed to confirm order");
      }
    } catch (error) {
      console.error("Error confirming order:", error);
    }
  };

  // Confirm released order (without extra message)
  const handleConfirmReleasedOrder = async (orderId) => {
    try {
      const res = await fetch(`${baseUrl}/api/manage-orders/${orderId}/confirm-release`, {
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
              <th className="px-4 py-2 border">Device Name</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="border px-4 py-2">{order.id}</td>
                <td className="border px-4 py-2">{order.device_name}</td>
                <td className="border px-4 py-2">{order.status}</td>
                <td className="border px-4 py-2 space-x-2">
                  <button
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      // Prompt or use an input for confirmation message
                    }}
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
              <th className="px-4 py-2 border">Device Name</th>
              <th className="px-4 py-2 border">Confirmed At</th>
            </tr>
          </thead>
          <tbody>
            {orderHistory.map((order) => (
              <tr key={order.id}>
                <td className="border px-4 py-2">{order.id}</td>
                <td className="border px-4 py-2">{order.device_name}</td>
                <td className="border px-4 py-2">
                  {order.confirmed_at ? new Date(order.confirmed_at).toLocaleString() : "N/A"}
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
