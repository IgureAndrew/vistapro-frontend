// src/components/AssignedMarketers.jsx
import React, { useState, useEffect } from "react";
import api from "../api"; // Your custom axios instance

const AssignedMarketers = () => {
  const [marketers, setMarketers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Retrieve the logged-in admin from localStorage.
  const storedUser = localStorage.getItem("user");
  const admin = storedUser ? JSON.parse(storedUser) : null;

  useEffect(() => {
    if (!admin) return;

    const fetchAssignedMarketers = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await api.get(
          `/master-admin/marketers/${admin.unique_id}`, // Adjust this endpoint if needed
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        // Expected response format: { assignedMarketers: [...] }
        setMarketers(response.data.assignedMarketers);
      } catch (err) {
        setError(err.message || "Failed to fetch assigned marketers.");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedMarketers();
  }, [admin]);

  if (loading) {
    return <p>Loading assigned marketers...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Assigned Marketers</h2>
      {marketers.length > 0 ? (
        <table className="min-w-full bg-white border rounded">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Unique ID</th>
              <th className="py-2 px-4 border-b">Name</th>
              <th className="py-2 px-4 border-b">Email</th>
              <th className="py-2 px-4 border-b">Location</th>
            </tr>
          </thead>
          <tbody>
            {marketers.map((mkt) => (
              <tr key={mkt.unique_id}>
                <td className="py-2 px-4 border-b">{mkt.unique_id}</td>
                <td className="py-2 px-4 border-b">
                  {mkt.first_name} {mkt.last_name}
                </td>
                <td className="py-2 px-4 border-b">{mkt.email}</td>
                <td className="py-2 px-4 border-b">{mkt.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No marketers assigned to you yet.</p>
      )}
    </div>
  );
};

export default AssignedMarketers;
