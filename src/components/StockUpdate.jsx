import React, { useEffect, useState } from "react";

function StockUpdates() {
  const baseUrl = "https://vistapro-backend.onrender.com";
  const token = localStorage.getItem("token");

  const [stockUpdates, setStockUpdates] = useState([]);
  const [filterTerm, setFilterTerm] = useState("");
  const [error, setError] = useState("");
  const [activeNotificationId, setActiveNotificationId] = useState(null);
  const [notificationMessage, setNotificationMessage] = useState("");

  useEffect(() => {
    const fetchStockUpdates = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/stockupdates`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch stock updates");
        const data = await res.json();
        setStockUpdates(data.data || []);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchStockUpdates();
  }, [baseUrl, token]);

  // Filter stock updates by marketer ID or device category
  const filteredUpdates = stockUpdates.filter(update => {
    const term = filterTerm.toLowerCase();
    return (
      update.marketer_id.toString().includes(term) ||
      (update.device_category && update.device_category.toLowerCase().includes(term))
    );
  });

  const handleSendNotification = async (stockId, marketerId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: marketerId, message: notificationMessage }),
      });
      if (!res.ok) throw new Error("Failed to send notification");
      setNotificationMessage("");
      setActiveNotificationId(null);
      alert("Notification sent successfully.");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold text-center mb-8">Stock Update Dashboard</h1>
      
      {error && (
        <p className="text-red-500 text-center mb-4">{error}</p>
      )}

      <div className="flex justify-center mb-8">
        <input
          type="text"
          placeholder="Search by marketer ID or device type..."
          value={filterTerm}
          onChange={(e) => setFilterTerm(e.target.value)}
          className="w-full max-w-md px-4 py-2 rounded shadow focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredUpdates.map(update => (
          <div
            key={update.id}
            className="p-6 rounded-xl shadow-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
          >
            <h2 className="text-2xl font-extrabold mb-2">Marketer ID: {update.marketer_id}</h2>
            <p className="mb-1">Device: {update.device_category}</p>
            <p className="mb-1">Quantity: {update.quantity}</p>
            <p className="mb-1">Pickup: {new Date(update.pickup_date).toLocaleString()}</p>
            <p className="mb-1">Deadline: {new Date(update.deadline).toLocaleString()}</p>
            <p className="mb-1">
              Status: {update.sold ? "Sold" : (update.countdown ? update.countdown : "Pending")}
            </p>

            {/* Notification Form */}
            {activeNotificationId === update.id ? (
              <div className="mt-4">
                <textarea
                  placeholder="Type your notification..."
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  className="w-full p-2 rounded shadow focus:outline-none focus:ring-2 focus:ring-indigo-300 text-gray-800"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleSendNotification(update.id, update.marketer_id)}
                    className="flex-1 bg-green-500 hover:bg-green-600 font-bold py-2 px-4 rounded shadow"
                  >
                    Send
                  </button>
                  <button
                    onClick={() => setActiveNotificationId(null)}
                    className="flex-1 bg-red-500 hover:bg-red-600 font-bold py-2 px-4 rounded shadow"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setActiveNotificationId(update.id)}
                className="mt-4 w-full bg-white text-blue-600 font-bold py-2 px-4 rounded shadow hover:bg-blue-100"
              >
                Send Notification
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default StockUpdates;
