import React, { useEffect, useState } from "react";

function Performance() {
  const baseUrl = "https://vistapro-backend.onrender.com";
  const token = localStorage.getItem("token");
  const [performance, setPerformance] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPerformance = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/performance`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch performance overview");
        const data = await res.json();
        setPerformance(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformance();
  }, [baseUrl, token]);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-8">Performance Overview</h1>
      {loading ? (
        <p className="text-center">Loading performance data...</p>
      ) : error ? (
        <div className="max-w-xl mx-auto text-center text-red-600">
          {error}
        </div>
      ) : performance ? (
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
            <h2 className="text-xl font-bold mb-2">Total Orders</h2>
            <p className="text-3xl font-extrabold text-indigo-600">
              {performance.total_orders}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
            <h2 className="text-xl font-bold mb-2">Total Sales</h2>
            <p className="text-3xl font-extrabold text-green-600">
              ₦{performance.total_sales}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
            <h2 className="text-xl font-bold mb-2">Avg. Order Value</h2>
            <p className="text-3xl font-extrabold text-purple-600">
              ₦{parseFloat(performance.average_order_value).toFixed(2)}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-center">No performance data available.</p>
      )}
    </div>
  );
}

export default Performance;
