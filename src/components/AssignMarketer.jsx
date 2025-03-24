import React, { useState, useEffect } from "react";

function AssignMarketer() {
  const baseUrl = "http://localhost:5000"; // adjust as needed
  const token = localStorage.getItem("token");

  const [marketers, setMarketers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [selectedMarketer, setSelectedMarketer] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState("");

  // Fetch registered marketers (role=Marketer)
  useEffect(() => {
    const fetchMarketers = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/master-admin/users?role=Marketer`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (res.ok) {
          setMarketers(data.users || []);
        } else {
          alert(data.message || "Failed to fetch marketers");
        }
      } catch (error) {
        console.error("Error fetching marketers:", error);
      }
    };

    fetchMarketers();
  }, [baseUrl, token]);

  // Fetch registered admins (role=Admin)
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/master-admin/users?role=Admin`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (res.ok) {
          setAdmins(data.users || []);
        } else {
          alert(data.message || "Failed to fetch admins");
        }
      } catch (error) {
        console.error("Error fetching admins:", error);
      }
    };

    fetchAdmins();
  }, [baseUrl, token]);

  // Handler for form submission to assign a marketer to an admin
  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedMarketer || !selectedAdmin) {
      alert("Please select both a marketer and an admin.");
      return;
    }
    try {
      // Example: PATCH /api/master-admin/marketers/:marketerId/assign with body { adminId: selectedAdmin }
      const res = await fetch(
        `${baseUrl}/api/master-admin/marketers/${selectedMarketer}/assign`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ adminId: selectedAdmin }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        alert("Marketer assigned successfully!");
        // Optionally, refresh marketer list if needed.
      } else {
        alert(data.message || "Failed to assign marketer.");
      }
    } catch (error) {
      console.error("Error assigning marketer:", error);
      alert("Error assigning marketer.");
    }
  };

  return (
    <div className="p-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Assign Marketer to Admin</h2>
      <form onSubmit={handleAssign} className="flex flex-col gap-4">
        <div>
          <label className="block mb-1 font-semibold">Select Marketer:</label>
          <select
            value={selectedMarketer}
            onChange={(e) => setSelectedMarketer(e.target.value)}
            className="border border-gray-300 rounded px-4 py-2 w-full"
            required
          >
            <option value="">-- Select Marketer --</option>
            {marketers.map((marketer) => (
              <option key={marketer.id} value={marketer.id}>
                {marketer.name} ({marketer.email})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-semibold">Select Admin:</label>
          <select
            value={selectedAdmin}
            onChange={(e) => setSelectedAdmin(e.target.value)}
            className="border border-gray-300 rounded px-4 py-2 w-full"
            required
          >
            <option value="">-- Select Admin --</option>
            {admins.map((admin) => (
              <option key={admin.id} value={admin.id}>
                {admin.name} ({admin.email})
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded"
        >
          Assign
        </button>
      </form>
    </div>
  );
}

export default AssignMarketer;
