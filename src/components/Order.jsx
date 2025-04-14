// src/components/Order.jsx
import React, { useState, useEffect } from "react";

function Order() {
  // State for holding new order data.
  const [orderData, setOrderData] = useState({
    device_name: "",
    device_model: "",
    device_type: "Android", // default value
    imei: "",              // new field for IMEI
    number_of_devices: "",
    sold_amount: "",
    customer_name: "",
    customer_phone: "",
    customer_address: "",
    bnpl_platform: "",
    // Removed sale_date - this will be set automatically in the backend.
  });

  // State to hold orders fetched from the backend.
  const [orders, setOrders] = useState([]);
  const token = localStorage.getItem("token");

  // Function to fetch orders for the marketer.
  const fetchOrders = async () => {
    try {
      const res = await fetch("https://vistapro-backend.onrender.com/api/marketer/orders", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        // Assuming the returned data has an "orders" field.
        setOrders(data.orders);
      } else {
        alert(data.message || "Failed to fetch orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      alert("Error fetching orders");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Handle input changes for the order form.
  const handleChange = (e) => {
    const { name, value } = e.target;
    setOrderData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission for placing a new order.
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("https://vistapro-backend.onrender.com/api/marketer/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // Send the new orderData (sale_date is not sent, backend auto-sets it)
        body: JSON.stringify(orderData),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Order placed successfully!");
        // Reset the form with default values (without sale_date).
        setOrderData({
          device_name: "",
          device_model: "",
          device_type: "Android",
          imei: "",
          number_of_devices: "",
          sold_amount: "",
          customer_name: "",
          customer_phone: "",
          customer_address: "",
          bnpl_platform: "",
        });
        // Refresh the list of orders.
        fetchOrders();
      } else {
        alert(data.message || "Failed to place order");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      alert("Error placing order");
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Place Order</h2>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow">
        {/* Device Details */}
        <div>
          <label className="block font-bold mb-1">Device Name</label>
          <input
            type="text"
            name="device_name"
            value={orderData.device_name}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block font-bold mb-1">Device Model</label>
          <input
            type="text"
            name="device_model"
            value={orderData.device_model}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block font-bold mb-1">Device Type</label>
          <select
            name="device_type"
            value={orderData.device_type}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          >
            <option value="Android">Android</option>
            <option value="iPhone">iPhone</option>
          </select>
        </div>
        {/* New Field: IMEI */}
        <div>
          <label className="block font-bold mb-1">IMEI</label>
          <input
            type="text"
            name="imei"
            value={orderData.imei}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        {/* Pricing & Quantity */}
        <div>
          <label className="block font-bold mb-1">Number of Devices</label>
          <input
            type="number"
            name="number_of_devices"
            value={orderData.number_of_devices}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block font-bold mb-1">Sold Amount</label>
          <input
            type="number"
            name="sold_amount"
            value={orderData.sold_amount}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        {/* Customer Details */}
        <div>
          <label className="block font-bold mb-1">Customer Name</label>
          <input
            type="text"
            name="customer_name"
            value={orderData.customer_name}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block font-bold mb-1">Customer Phone</label>
          <input
            type="text"
            name="customer_phone"
            value={orderData.customer_phone}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block font-bold mb-1">Customer Address</label>
          <input
            type="text"
            name="customer_address"
            value={orderData.customer_address}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        {/* BNPL Platform */}
        <div>
          <label className="block font-bold mb-1">BNPL Platform</label>
          <select
            name="bnpl_platform"
            value={orderData.bnpl_platform}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select Platform</option>
            <option value="WATU">WATU</option>
            <option value="EASYBUY">EASYBUY</option>
            <option value="CREDIT DIRECT">CREDIT DIRECT</option>
          </select>
        </div>

        <button type="submit" className="bg-black text-[#FFD700] font-bold px-4 py-2 rounded">
          Place Order
        </button>
      </form>

      {/* Orders Table */}
      <div className="mt-8 bg-white p-4 rounded shadow overflow-x-auto">
        <h3 className="text-xl font-bold mb-4">Your Orders</h3>
        {orders.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-bold uppercase">Order ID</th>
                <th className="px-4 py-2 text-left text-xs font-bold uppercase">Device</th>
                <th className="px-4 py-2 text-left text-xs font-bold uppercase">Model</th>
                <th className="px-4 py-2 text-left text-xs font-bold uppercase">IMEI</th>
                <th className="px-4 py-2 text-left text-xs font-bold uppercase">Quantity</th>
                <th className="px-4 py-2 text-left text-xs font-bold uppercase">Sold Amount</th>
                <th className="px-4 py-2 text-left text-xs font-bold uppercase">Sale Date</th>
                <th className="px-4 py-2 text-left text-xs font-bold uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm">{order.id}</td>
                  <td className="px-4 py-2 text-sm">{order.device_name}</td>
                  <td className="px-4 py-2 text-sm">{order.device_model}</td>
                  <td className="px-4 py-2 text-sm">{order.imei}</td>
                  <td className="px-4 py-2 text-sm">{order.number_of_devices}</td>
                  <td className="px-4 py-2 text-sm">{order.sold_amount}</td>
                  <td className="px-4 py-2 text-sm">{order.sale_date}</td>
                  <td className="px-4 py-2 text-sm">
                    {order.status ? order.status : "Pending"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center font-bold text-gray-500">No orders found.</p>
        )}
      </div>
    </div>
  );
}

export default Order;
