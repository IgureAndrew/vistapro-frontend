// src/components/StockManagement.jsx
import React, { useState, useEffect } from "react";

function StockManagement() {
  const baseUrl = "https://vistapro-backend.onrender.com/api/stock";
  const token = localStorage.getItem("token");
  const [stocks, setStocks] = useState([]);
  const [error, setError] = useState("");

  // Fetch stock items from the backend.
  const fetchStocks = async () => {
    try {
      const res = await fetch(baseUrl, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        // Expect data.stock or data.stocks from the backend
        setStocks(data.stock || data.stocks || []);
      } else {
        setError(data.message || "Failed to fetch stock items");
      }
    } catch (err) {
      console.error(err);
      setError("Error fetching stock items");
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  // Trigger the backend endpoint to update stale stock.
  const handleUpdateStaleStock = async () => {
    try {
      const res = await fetch(`${baseUrl}/stale/update`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchStocks(); // Refresh the list after updating.
      } else {
        alert(data.message || "Failed to update stale stock");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating stale stock");
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Stock Management</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {/* Button to update stale stock – this triggers the countdown-based update */}
      
      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="px-4 py-2 border">ID</th>
            <th className="px-4 py-2 border">Marketer</th>
            <th className="px-4 py-2 border">Device</th>
            <th className="px-4 py-2 border">Model</th>
            <th className="px-4 py-2 border">Quantity</th>
            <th className="px-4 py-2 border">Status</th>
            <th className="px-4 py-2 border">Time Remaining</th>
          </tr>
        </thead>
        <tbody>
          {stocks.length > 0 ? (
            stocks.map((stock) => (
              <tr key={stock.id}>
                <td className="border px-4 py-2">{stock.id}</td>
                <td className="border px-4 py-2">{stock.marketer_name}</td>
                <td className="border px-4 py-2">{stock.device_name}</td>
                <td className="border px-4 py-2">{stock.device_model}</td>
                <td className="border px-4 py-2">{stock.quantity}</td>
                <td className="border px-4 py-2">{stock.status}</td>
                <td className="border px-4 py-2">
                  {stock.time_remaining
                    ? `${stock.time_remaining.days}d ${stock.time_remaining.hours}h ${stock.time_remaining.minutes}m ${stock.time_remaining.seconds}s`
                    : "N/A"}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="text-center p-4">
                No stock items found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default StockManagement;
