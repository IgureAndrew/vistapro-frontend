// src/components/AssignUsers.jsx
import React, { useState, useEffect } from "react";

function AssignUsers() {
  const token = localStorage.getItem("token");
  const apiUrl = import.meta.env.VITE_API_URL;

  // Dropdown for selecting which role to assign ("Admin" or "SuperAdmin")
  const [selectedRole, setSelectedRole] = useState("Admin");
  // Target users for assignment (Admins or SuperAdmins, depending on selectedRole)
  const [roleUsers, setRoleUsers] = useState([]);
  const [selectedRoleUser, setSelectedRoleUser] = useState(""); // Unique ID of the target user

  // Data for all marketers, admins, and super admins
  const [marketers, setMarketers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [superAdmins, setSuperAdmins] = useState([]);

  // For assignment: the list of unique IDs of users available for assignment
  const [selectedAssignIds, setSelectedAssignIds] = useState([]);

  // For displaying current assignments; each record is { target, assignedId, role }
  const [assignments, setAssignments] = useState([]);

  // Fetch all marketers (users with role "Marketer")
  useEffect(() => {
    const fetchMarketers = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/master-admin/users?role=Marketer`, {
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
  }, [apiUrl, token]);

  // Fetch all admins (role "Admin")
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/master-admin/users?role=Admin`, {
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
  }, [apiUrl, token]);

  // Fetch all super admins (role "SuperAdmin")
  useEffect(() => {
    const fetchSuperAdmins = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/master-admin/users?role=SuperAdmin`, {
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
  }, [apiUrl, token]);

  // When the selected role changes, update the target user dropdown list
  useEffect(() => {
    if (selectedRole === "Admin") {
      // For assigning marketers, target users are Admins who haven't been assigned a super admin.
      setRoleUsers(admins.filter((admin) => !admin.super_admin_id));
    } else if (selectedRole === "SuperAdmin") {
      // For assigning admins, target users are SuperAdmins.
      setRoleUsers(superAdmins);
    }
    // Clear previous selections
    setSelectedRoleUser("");
    setSelectedAssignIds([]);
  }, [selectedRole, admins, superAdmins]);

  // Compute available users for assignment:
  // If role is Admin, show marketers not yet assigned (admin_id is null).
  // If role is SuperAdmin, show admins not yet assigned (super_admin_id is null).
  const availableForAssignment =
    selectedRole === "Admin"
      ? marketers.filter((m) => !m.admin_id)
      : selectedRole === "SuperAdmin"
      ? admins.filter((a) => !a.super_admin_id)
      : [];

  // Handle dropdown change for role
  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value);
  };

  // Handle dropdown change for target user
  const handleRoleUserChange = (e) => {
    setSelectedRoleUser(e.target.value);
  };

  // Handle checkbox change in the table
  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setSelectedAssignIds((prev) => [...prev, value]);
    } else {
      setSelectedAssignIds((prev) => prev.filter((id) => id !== value));
    }
  };

  // Handle assign button click
  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedRoleUser || selectedAssignIds.length === 0) {
      alert("Please select a target user and at least one user to assign.");
      return;
    }
    try {
      let endpoint = "";
      let payload = {};
      if (selectedRole === "Admin") {
        // Assign marketers to the selected admin.
        endpoint = "/api/master-admin/assign-marketers-to-admin";
        payload = {
          adminId: selectedRoleUser,
          marketerIds: selectedAssignIds,
        };
      } else if (selectedRole === "SuperAdmin") {
        // Assign admins to the selected super admin.
        endpoint = "/api/master-admin/assign-admins-to-superadmin";
        payload = {
          superAdminId: selectedRoleUser,
          adminIds: selectedAssignIds,
        };
      }
      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Users assigned successfully!");
        // Update local assignments state by adding each assignment record.
        selectedAssignIds.forEach((id) => {
          setAssignments((prev) => [
            ...prev,
            { target: selectedRoleUser, assignedId: id, role: selectedRole },
          ]);
        });
        // Reset selections.
        setSelectedAssignIds([]);
        setSelectedRoleUser("");
      } else {
        alert(data.message || "Assignment failed.");
      }
    } catch (error) {
      console.error("Error assigning users:", error);
      alert("Error assigning users.");
    }
  };

  // Handle unassignment for a given assignment record.
  const handleUnassign = async (assignment) => {
    try {
      let endpoint = "";
      let payload = {};
      if (assignment.role === "Admin") {
        // Unassign a marketer from an admin.
        endpoint = "/api/master-admin/unassign-marketers-from-admin";
        payload = {
          adminId: assignment.target,
          marketerId: assignment.assignedId,
        };
      } else if (assignment.role === "SuperAdmin") {
        // Unassign an admin from a super admin.
        endpoint = "/api/master-admin/unassign-admins-from-superadmin";
        payload = {
          superAdminId: assignment.target,
          adminId: assignment.assignedId,
        };
      }
      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: "POST", // Adjust method if needed
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        alert("User unassigned successfully!");
        // Remove assignment from local state.
        setAssignments((prev) =>
          prev.filter(
            (a) =>
              !(
                a.target === assignment.target &&
                a.assignedId === assignment.assignedId &&
                a.role === assignment.role
              )
          )
        );
      } else {
        alert(data.message || "Failed to unassign user.");
      }
    } catch (error) {
      console.error("Error unassigning user:", error);
      alert("Error unassigning user.");
    }
  };

  return (
    <div className="p-6 bg-white rounded shadow space-y-8">
      <h2 className="text-2xl font-semibold mb-4">User Assignments</h2>

      {/* Assignment Controls */}
      <div className="p-4 border rounded shadow space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block mb-1 font-semibold">Select Role for Assignment:</label>
            <select
              value={selectedRole}
              onChange={handleRoleChange}
              className="border border-gray-300 rounded px-4 py-2 w-full"
            >
              <option value="Admin">Admin</option>
              <option value="SuperAdmin">SuperAdmin</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block mb-1 font-semibold">
              Select {selectedRole} (Name and Unique ID):
            </label>
            <select
              value={selectedRoleUser}
              onChange={handleRoleUserChange}
              className="border border-gray-300 rounded px-4 py-2 w-full"
            >
              <option value="">-- Select {selectedRole} --</option>
              {roleUsers.map((ru) => (
                <option key={ru.unique_id} value={ru.unique_id}>
                  {ru.name || `${ru.first_name} ${ru.last_name}`} ({ru.unique_id})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table of Users Available for Assignment */}
        <div className="overflow-auto mt-4">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 border text-center">Select</th>
                <th className="px-4 py-2 border">Name</th>
                <th className="px-4 py-2 border">Email</th>
                <th className="px-4 py-2 border">Unique ID</th>
                <th className="px-4 py-2 border">Role</th>
                <th className="px-4 py-2 border">Assignment Status</th>
              </tr>
            </thead>
            <tbody>
              {availableForAssignment.length > 0 ? (
                availableForAssignment.map((usr) => (
                  <tr key={usr.unique_id}>
                    <td className="px-4 py-2 border text-center">
                      <input
                        type="checkbox"
                        value={usr.unique_id}
                        checked={selectedAssignIds.includes(usr.unique_id)}
                        onChange={handleCheckboxChange}
                      />
                    </td>
                    <td className="px-4 py-2 border">
                      {usr.name || `${usr.first_name} ${usr.last_name}`}
                    </td>
                    <td className="px-4 py-2 border">{usr.email}</td>
                    <td className="px-4 py-2 border">{usr.unique_id}</td>
                    <td className="px-4 py-2 border">{usr.role}</td>
                    <td className="px-4 py-2 border">
                      {usr.admin_id || usr.super_admin_id ? "Assigned" : "Not Assigned"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-4 py-2 text-center">
                    No users available for assignment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <button
          onClick={handleAssign}
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded"
        >
          Assign Selected Users
        </button>
      </div>

      {/* Assigned Users Table with Unassign Option */}
      <div className="p-4 border rounded shadow">
        <h3 className="text-xl font-semibold mb-2">Current Assignments</h3>
        {assignments.length > 0 ? (
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 border">Assigned To (Unique ID)</th>
                <th className="px-4 py-2 border">Role</th>
                <th className="px-4 py-2 border">Users Assigned (Unique IDs)</th>
                <th className="px-4 py-2 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assign, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2 border">{assign.target}</td>
                  <td className="px-4 py-2 border">{assign.role}</td>
                  <td className="px-4 py-2 border">{assign.assignedId}</td>
                  <td className="px-4 py-2 border">
                    <button
                      onClick={() => handleUnassign(assign)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                    >
                      Unassign
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No assignments made yet.</p>
        )}
      </div>
    </div>
  );
}

export default AssignUsers;
