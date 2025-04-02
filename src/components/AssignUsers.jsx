// src/components/AssignUsers.jsx
import React, { useState, useEffect } from "react";

function AssignUsers() {
  const baseUrl = "https://vistapro-backend.onrender.com"; // Adjust as needed.
  const token = localStorage.getItem("token");

  // Data for assignment: marketers, admins, and super admins.
  const [marketers, setMarketers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [superAdmins, setSuperAdmins] = useState([]);

  // For assigning marketers to admin.
  // Use an array to allow single or multiple selections.
  const [selectedMarketers, setSelectedMarketers] = useState([]);
  const [selectedAdminForMarketers, setSelectedAdminForMarketers] = useState("");

  // For assigning admins to a super admin.
  const [selectedAdmins, setSelectedAdmins] = useState([]); // Array of admin IDs.
  const [selectedSuperAdmin, setSelectedSuperAdmin] = useState("");

  // Fetch marketers (role=Marketer)
  useEffect(() => {
    const fetchMarketers = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/master-admin/users?role=Marketer`, {
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

  // Fetch admins (role=Admin)
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/master-admin/users?role=Admin`, {
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

  // Fetch super admins (role=SuperAdmin)
  useEffect(() => {
    const fetchSuperAdmins = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/master-admin/users?role=SuperAdmin`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (res.ok) {
          setSuperAdmins(data.users || []);
        } else {
          alert(data.message || "Failed to fetch super admins");
        }
      } catch (error) {
        console.error("Error fetching super admins:", error);
      }
    };
    fetchSuperAdmins();
  }, [baseUrl, token]);

  // Handler to assign multiple marketers to an admin.
  const handleAssignMarketers = async (e) => {
    e.preventDefault();
    if (!selectedMarketers.length || !selectedAdminForMarketers) {
      alert("Please select at least one marketer and an admin.");
      return;
    }
    try {
      // POST /api/master-admin/assign-marketers-to-admin with body { adminId, marketerIds }
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/master-admin/assign-marketers-to-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          adminId: selectedAdminForMarketers,
          marketerIds: selectedMarketers,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Marketers assigned successfully!");
        setSelectedMarketers([]);
        setSelectedAdminForMarketers("");
      } else {
        alert(data.message || "Failed to assign marketers.");
      }
    } catch (error) {
      console.error("Error assigning marketers:", error);
      alert("Error assigning marketers.");
    }
  };

  // Handler to assign multiple admins to a super admin.
  const handleAssignAdminsToSuperAdmin = async (e) => {
    e.preventDefault();
    if (!selectedSuperAdmin || selectedAdmins.length === 0) {
      alert("Please select a Super Admin and at least one Admin.");
      return;
    }
    try {
      // POST /api/master-admin/assign-admins-to-superadmin with body { superAdminId, adminIds }
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/master-admin/assign-admins-to-superadmin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          superAdminId: selectedSuperAdmin,
          adminIds: selectedAdmins,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Admins assigned to Super Admin successfully!");
        setSelectedSuperAdmin("");
        setSelectedAdmins([]);
      } else {
        alert(data.message || "Failed to assign admins.");
      }
    } catch (error) {
      console.error("Error assigning admins:", error);
      alert("Error assigning admins.");
    }
  };

  // Handler to toggle selection in multiple-select for marketers.
  const handleMarketerSelection = (e) => {
    const { options } = e.target;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setSelectedMarketers(selected);
  };

  // Handler to toggle selection in multiple-select for admins (for super admin assignment).
  const handleAdminSelection = (e) => {
    const { options } = e.target;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setSelectedAdmins(selected);
  };

  return (
    <div className="p-6 bg-white rounded shadow space-y-8">
      <h2 className="text-2xl font-semibold mb-4">User Assignments</h2>

      {/* Section 1: Assign Marketers to Admin */}
      <div className="p-4 border rounded shadow">
        <h3 className="text-xl font-semibold mb-2">Assign Marketers to Admin</h3>
        <form onSubmit={handleAssignMarketers} className="flex flex-col gap-4">
          <div>
            <label className="block mb-1 font-semibold">Select Marketers (multiple):</label>
            <select
              multiple
              value={selectedMarketers}
              onChange={handleMarketerSelection}
              className="border border-gray-300 rounded px-4 py-2 w-full"
              required
            >
              {marketers.map((marketer) => (
                <option key={marketer.id} value={marketer.id}>
                  {marketer.name} ({marketer.email})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Hold Ctrl (Windows) or Command (Mac) to select multiple marketers.
            </p>
          </div>
          <div>
            <label className="block mb-1 font-semibold">Select Admin:</label>
            <select
              value={selectedAdminForMarketers}
              onChange={(e) => setSelectedAdminForMarketers(e.target.value)}
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
            Assign Marketers
          </button>
        </form>
      </div>

      {/* Section 2: Assign Admins to Super Admin */}
      <div className="p-4 border rounded shadow">
        <h3 className="text-xl font-semibold mb-2">Assign Admins to Super Admin</h3>
        <form onSubmit={handleAssignAdminsToSuperAdmin} className="flex flex-col gap-4">
          <div>
            <label className="block mb-1 font-semibold">Select Super Admin:</label>
            <select
              value={selectedSuperAdmin}
              onChange={(e) => setSelectedSuperAdmin(e.target.value)}
              className="border border-gray-300 rounded px-4 py-2 w-full"
              required
            >
              <option value="">-- Select Super Admin --</option>
              {superAdmins.map((sa) => (
                <option key={sa.id} value={sa.id}>
                  {sa.name} ({sa.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 font-semibold">Select Admins (multiple):</label>
            <select
              multiple
              value={selectedAdmins}
              onChange={handleAdminSelection}
              className="border border-gray-300 rounded px-4 py-2 w-full"
              required
            >
              {admins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.name} ({admin.email})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Hold Ctrl (Windows) or Command (Mac) to select multiple admins.
            </p>
          </div>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded"
          >
            Assign Admins
          </button>
        </form>
      </div>

      {/* Section 3: Display current assignments */}
      <div className="p-4 border rounded shadow">
        <h3 className="text-xl font-semibold mb-2">Current Assignments</h3>
        {/* Super Admin Assignments */}
        <div className="mb-4">
          <h4 className="font-semibold">Super Admins and their Admins:</h4>
          {superAdmins.length > 0 ? (
            superAdmins.map((sa) => (
              <div key={sa.id} className="ml-4 my-2">
                <p className="font-bold">{sa.name} ({sa.email})</p>
                <ul className="list-disc ml-6">
                  {admins
                    .filter((admin) => admin.super_admin_id === sa.id)
                    .map((admin) => (
                      <li key={admin.id}>
                        {admin.name} ({admin.email})
                      </li>
                    ))}
                </ul>
              </div>
            ))
          ) : (
            <p>No Super Admins available.</p>
          )}
        </div>
        {/* Admin Assignments */}
        <div>
          <h4 className="font-semibold">Admins and their Marketers:</h4>
          {admins.length > 0 ? (
            admins.map((admin) => (
              <div key={admin.id} className="ml-4 my-2">
                <p className="font-bold">{admin.name} ({admin.email})</p>
                <ul className="list-disc ml-6">
                  {marketers
                    .filter((marketer) => marketer.admin_id === admin.id)
                    .map((marketer) => (
                      <li key={marketer.id}>
                        {marketer.name} ({marketer.email})
                      </li>
                    ))}
                </ul>
              </div>
            ))
          ) : (
            <p>No Admins available.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AssignUsers;
