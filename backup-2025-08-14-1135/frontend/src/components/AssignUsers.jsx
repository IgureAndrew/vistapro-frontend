// src/components/AssignUsers.jsx
import React, { useState, useEffect, useMemo } from "react";

// Helper function to generate a user's display name.
// It searches a list of users by unique_id and returns their full name (or unique ID) if available.
const getUserDisplayName = (uniqueId, users) => {
  const user = users.find((u) => u.unique_id === uniqueId);
  return user ? (user.name || `${user.first_name} ${user.last_name}`) : uniqueId;
};

function AssignUsers() {
  const token = localStorage.getItem("token");
  const apiUrl = import.meta.env.VITE_API_URL;

  // --------------------------------------------------
  // State for Assignment Controls
  // --------------------------------------------------
  // selectedRole: determines the assignment action.
  // "Admin" = assign marketers to an Admin.
  // "SuperAdmin" = assign admins to a SuperAdmin.
  const [selectedRole, setSelectedRole] = useState("Admin");
  // roleUsers: list of available target users for assignment.
  const [roleUsers, setRoleUsers] = useState([]);
  // selectedRoleUser: the unique ID of the chosen target for assignment.
  const [selectedRoleUser, setSelectedRoleUser] = useState("");

  // --------------------------------------------------
  // Data Lists for Users by Role
  // --------------------------------------------------
  const [marketers, setMarketers] = useState([]);    // List of marketers
  const [admins, setAdmins] = useState([]);          // List of Admins
  const [superAdmins, setSuperAdmins] = useState([]); // List of SuperAdmins

  // --------------------------------------------------
  // State for Assignment Selection & Records
  // --------------------------------------------------
  // selectedAssignIds: array of unique IDs for users selected for assignment.
  const [selectedAssignIds, setSelectedAssignIds] = useState([]);
  // assignments: array holding current assignment records.
  // Each record is an object: { target, assignedId, role }.
  const [assignments, setAssignments] = useState([]);
  // selectedUnassign: list of assignments chosen to be unassigned.
  const [selectedUnassign, setSelectedUnassign] = useState([]);

  // --------------------------------------------------
  // State for Viewing Filtered Assignments
  // --------------------------------------------------
  // viewRole: which target’s assignments to view ("Admin" for marketers; "SuperAdmin" for admins).
  const [viewRole, setViewRole] = useState("");
  // viewTarget: the target user's unique ID for filtering assignments.
  const [viewTarget, setViewTarget] = useState("");
  // filteredAssignments: assignments filtered by viewTarget.
  const [filteredAssignments, setFilteredAssignments] = useState([]);

  // --------------------------------------------------
  // Derived state: viewTargets
  // --------------------------------------------------
  // Returns the list of target users based on the selected view role.
  const viewTargets = useMemo(() => {
    if (viewRole === "SuperAdmin") {
      return superAdmins;
    } else if (viewRole === "Admin") {
      return admins;
    }
    return [];
  }, [viewRole, admins, superAdmins]);

  // --------------------------------------------------
  // Data Fetching for Each Role from Backend
  // --------------------------------------------------

  // Fetch all marketers.
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

  // Fetch all admins.
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

  // Fetch all super admins.
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

  // --------------------------------------------------
  // Update Target User Dropdown Based on Selected Role
  // --------------------------------------------------
  useEffect(() => {
    if (selectedRole === "Admin") {
      // For assigning marketers, list all Admins.
      setRoleUsers(admins);
    } else if (selectedRole === "SuperAdmin") {
      // For assigning admins, list all SuperAdmins.
      setRoleUsers(superAdmins);
    }
    // Clear the target selection and user assignment selections when role changes.
    setSelectedRoleUser("");
    setSelectedAssignIds([]);
  }, [selectedRole, admins, superAdmins]);

  // --------------------------------------------------
  // Compute Available Users for Assignment
  // --------------------------------------------------
  // For Admin assignment, available users are marketers that do not yet have an assigned admin.
  // For SuperAdmin assignment, available users are admins that do not yet have an assigned super admin.
  // Additionally, if a target is selected, filter users by matching location.
  const availableForAssignment = useMemo(() => {
    let list = [];
    if (selectedRole === "Admin") {
      list = marketers.filter((m) => !m.admin_id);
    } else if (selectedRole === "SuperAdmin") {
      list = admins.filter((a) => !a.super_admin_id);
    }
    if (selectedRoleUser) {
      const target = roleUsers.find((u) => u.unique_id === selectedRoleUser);
      if (target && target.location) {
        list = list.filter((u) => u.location === target.location);
      }
    }
    return list;
  }, [selectedRole, selectedRoleUser, marketers, admins, roleUsers]);

  // --------------------------------------------------
  // Fetch All Current Assignments for the Selected Target
  // --------------------------------------------------
  // When a view role and view target are selected (in the View Assignments section),
  // fetch assignments from the backend using the dedicated endpoints.
  useEffect(() => {
    if (!viewRole || !viewTarget) return; // Do nothing if no role or target selected.
    const fetchAssignmentsForTarget = async () => {
      try {
        let url = "";
        if (viewRole === "Admin") {
          // For Admin view, get marketers assigned to this Admin.
          url = `${apiUrl}/api/master-admin/marketers/${viewTarget}`;
        } else if (viewRole === "SuperAdmin") {
          // For SuperAdmin view, get admins assigned to this SuperAdmin.
          url = `${apiUrl}/api/master-admin/admins/${viewTarget}`;
        }
        const res = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const responseData = await res.json();
        if (!res.ok) {
          alert(responseData.message || "Error fetching assignments for the selected target");
          return;
        }
        // Process the result based on role.
        if (viewRole === "Admin" && responseData.assignedMarketers) {
          // For Admin view, convert each marketer into an assignment record.
          const newAssignments = responseData.assignedMarketers.map((m) => ({
            target: viewTarget,        // Admin's unique_id
            assignedId: m.unique_id,   // Marketer's unique_id
            role: "Admin",
          }));
          setAssignments(newAssignments);
        } else if (viewRole === "SuperAdmin" && responseData.assignedAdmins) {
          // For SuperAdmin view, convert each admin into an assignment record.
          const newAssignments = responseData.assignedAdmins.map((adm) => ({
            target: viewTarget,         // SuperAdmin's unique_id
            assignedId: adm.unique_id,  // Admin's unique_id
            role: "SuperAdmin",
          }));
          setAssignments(newAssignments);
        }
      } catch (err) {
        console.error("Error fetching assignments by target:", err);
        alert("Error fetching assignments");
      }
    };
    fetchAssignmentsForTarget();
  }, [viewRole, viewTarget, apiUrl, token]);

  // --------------------------------------------------
  // Update Filtered Assignments Based on View Target
  // --------------------------------------------------
  useEffect(() => {
    if (viewTarget) {
      // Filter the assignments array to only include records for the selected target.
      setFilteredAssignments(assignments.filter((a) => a.target === viewTarget));
    } else {
      setFilteredAssignments(assignments);
    }
  }, [viewTarget, assignments]);

  // --------------------------------------------------
  // Handlers for UI Controls
  // --------------------------------------------------

  // Updates the role dropdown for assignment.
  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value);
  };

  // Updates the target user for assignment.
  const handleRoleUserChange = (e) => {
    setSelectedRoleUser(e.target.value);
  };

  // Handler for checkbox toggle in the available users table.
  const handleAssignCheckboxChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setSelectedAssignIds((prev) => [...prev, value]);
    } else {
      setSelectedAssignIds((prev) => prev.filter((id) => id !== value));
    }
  };

  // Handler to send the assignment payload to the backend.
  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedRoleUser || selectedAssignIds.length === 0) {
      alert("Please select a target and at least one user to assign.");
      return;
    }
    try {
      let endpoint = "";
      let payload = {};
      if (selectedRole === "Admin") {
        // When assigning marketers to an Admin.
        endpoint = "/api/master-admin/assign-marketers-to-admin";
        payload = {
          adminUniqueId: selectedRoleUser,
          marketerUniqueIds: selectedAssignIds,
        };
      } else if (selectedRole === "SuperAdmin") {
        // When assigning admins to a SuperAdmin.
        endpoint = "/api/master-admin/assign-admins-to-superadmin";
        payload = {
          superAdminUniqueId: selectedRoleUser,
          adminUniqueIds: selectedAssignIds,
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
        // Update assignments state locally by adding new assignment records.
        selectedAssignIds.forEach((id) => {
          setAssignments((prev) => [
            ...prev,
            { target: selectedRoleUser, assignedId: id, role: selectedRole },
          ]);
        });
        // Update local data lists to remove assigned users.
        if (selectedRole === "Admin") {
          setMarketers((prev) =>
            prev.map((m) =>
              selectedAssignIds.includes(m.unique_id)
                ? { ...m, admin_id: selectedRoleUser }
                : m
            )
          );
        } else if (selectedRole === "SuperAdmin") {
          setAdmins((prev) =>
            prev.map((a) =>
              selectedAssignIds.includes(a.unique_id)
                ? { ...a, super_admin_id: selectedRoleUser }
                : a
            )
          );
        }
        // Clear assignment selections.
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

  // Handler for unassignment checkbox toggle.
  const handleUnassignCheckboxChange = (e, assignment) => {
    const { checked } = e.target;
    if (checked) {
      setSelectedUnassign((prev) => [...prev, assignment]);
    } else {
      setSelectedUnassign((prev) =>
        prev.filter(
          (a) =>
            !(
              a.target === assignment.target &&
              a.assignedId === assignment.assignedId &&
              a.role === assignment.role
            )
        )
      );
    }
  };

  // Handler to unassign selected assignments.
  const handleUnassignSelected = async () => {
    if (selectedUnassign.length === 0) {
      alert("Please select at least one assignment to unassign.");
      return;
    }
    try {
      // Group assignments by role and target.
      const groups = selectedUnassign.reduce((acc, assignment) => {
        const key = `${assignment.role}-${assignment.target}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(assignment.assignedId);
        return acc;
      }, {});
      // Process each group.
      for (const key in groups) {
        const [role, target] = key.split("-");
        let endpoint = "";
        let payload = {};
        if (role === "Admin") {
          endpoint = "/api/master-admin/unassign-marketers-from-admin";
          payload = {
            adminUniqueId: target,
            marketerUniqueIds: groups[key],
          };
        } else if (role === "SuperAdmin") {
          endpoint = "/api/master-admin/unassign-admins-from-superadmin";
          payload = {
            superAdminUniqueId: target,
            adminUniqueIds: groups[key],
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
        if (!res.ok) {
          alert(data.message || `Unassignment failed for group: ${key}`);
          return;
        }
        // Update local data: mark the unassigned users as available.
        if (role === "Admin") {
          setMarketers((prev) =>
            prev.map((m) =>
              groups[key].includes(m.unique_id)
                ? { ...m, admin_id: null }
                : m
            )
          );
        } else if (role === "SuperAdmin") {
          setAdmins((prev) =>
            prev.map((a) =>
              groups[key].includes(a.unique_id)
                ? { ...a, super_admin_id: null }
                : a
            )
          );
        }
      }
      alert("Selected assignments unassigned successfully!");
      // Remove the unassigned assignments from the local state.
      setAssignments((prev) =>
        prev.filter((assignment) =>
          !selectedUnassign.some(
            (a) =>
              a.target === assignment.target &&
              a.assignedId === assignment.assignedId &&
              a.role === assignment.role
          )
        )
      );
      setSelectedUnassign([]);
    } catch (error) {
      console.error("Error unassigning users:", error);
      alert("Error unassigning users.");
    }
  };

  // Handler for view role selection in the "View Assignments by Target" section.
  const handleViewRoleChange = (e) => {
    setViewRole(e.target.value);
    setViewTarget(""); // Reset view target when role changes.
  };

  // Handler for view target selection.
  const handleViewTargetChange = (e) => {
    setViewTarget(e.target.value);
  };

  // --------------------------------------------------
  // Render the Component
  // --------------------------------------------------
  return (
    <div className="p-6 bg-white rounded shadow space-y-8">
      <h2 className="text-2xl font-semibold mb-4">User Assignments</h2>

      {/* Assignment Controls Section */}
      <div className="p-4 border rounded shadow space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Role Selection Dropdown */}
          <div className="flex-1">
            <label className="block mb-1 font-semibold">Select Role for Assignment:</label>
            <select
              value={selectedRole}
              onChange={handleRoleChange}
              className="border border-gray-300 rounded px-4 py-2 w-full"
            >
              <option value="Admin">Admin (assign marketers)</option>
              <option value="SuperAdmin">SuperAdmin (assign admins)</option>
            </select>
          </div>
          {/* Target User Dropdown */}
          <div className="flex-1">
            <label className="block mb-1 font-semibold">Select {selectedRole} (Name, Location, Unique ID):</label>
            <select
              value={selectedRoleUser}
              onChange={handleRoleUserChange}
              className="border border-gray-300 rounded px-4 py-2 w-full"
            >
              <option value="">-- Select {selectedRole} --</option>
              {roleUsers.map((ru) => (
                <option key={ru.unique_id} value={ru.unique_id}>
                  {ru.name || `${ru.first_name} ${ru.last_name}`} ({ru.location}) ({ru.unique_id})
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Available Users Table for Assignment */}
        <div className="overflow-auto mt-4">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 border text-center">Select</th>
                <th className="px-4 py-2 border">Name</th>
                <th className="px-4 py-2 border">Email</th>
                <th className="px-4 py-2 border">Unique ID</th>
                <th className="px-4 py-2 border">Role</th>
                <th className="px-4 py-2 border">Location</th>
                <th className="px-4 py-2 border">Assignment Status</th>
              </tr>
            </thead>
            <tbody>
              {availableForAssignment.length > 0 ? (
                availableForAssignment.map((usr) => (
                  <tr key={usr.unique_id} className="hover:bg-gray-100">
                    <td className="px-4 py-2 border text-center">
                      <input
                        type="checkbox"
                        value={usr.unique_id}
                        checked={selectedAssignIds.includes(usr.unique_id)}
                        onChange={handleAssignCheckboxChange}
                      />
                    </td>
                    <td className="px-4 py-2 border">{usr.name || `${usr.first_name} ${usr.last_name}`}</td>
                    <td className="px-4 py-2 border">{usr.email}</td>
                    <td className="px-4 py-2 border">{usr.unique_id}</td>
                    <td className="px-4 py-2 border">{usr.role}</td>
                    <td className="px-4 py-2 border">{usr.location}</td>
                    <td className="px-4 py-2 border">{usr.admin_id || usr.super_admin_id ? "Assigned" : "Not Assigned"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-4 py-2 text-center">No users available for assignment.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <button onClick={handleAssign} className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded">
          Assign Selected Users
        </button>
      </div>

      {/* View Assignments by Target Section */}
      <div className="p-4 border rounded shadow space-y-4">
        <h3 className="text-xl font-semibold">View Assignments by Target</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Dropdown to select view role */}
          <div className="flex-1">
            <label className="block mb-1 font-semibold">Select Role to View:</label>
            <select
              value={viewRole}
              onChange={handleViewRoleChange}
              className="border border-gray-300 rounded px-4 py-2 w-full"
            >
              <option value="">-- Select Role --</option>
              <option value="Admin">Admin (view marketers assigned)</option>
              <option value="SuperAdmin">SuperAdmin (view admins assigned)</option>
            </select>
          </div>
          {/* Dropdown to select specific target */}
          {viewRole && (
            <div className="flex-1">
              <label className="block mb-1 font-semibold">Select {viewRole} (Name, Location, Unique ID):</label>
              <select
                value={viewTarget}
                onChange={handleViewTargetChange}
                className="border border-gray-300 rounded px-4 py-2 w-full"
              >
                <option value="">-- Select {viewRole} --</option>
                {viewTargets.map((user) => (
                  <option key={user.unique_id} value={user.unique_id}>
                    {user.name || `${user.first_name} ${user.last_name}`} ({user.location}) ({user.unique_id})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        {/* Display Filtered Assignments based on selected target */}
        {viewTarget && (
          <div className="overflow-auto mt-4">
            <table className="min-w-full border border-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 border">Assigned To</th>
                  <th className="px-4 py-2 border">User Assigned</th>
                  <th className="px-4 py-2 border">Role</th>
                  <th className="px-4 py-2 border">Location</th>
                  <th className="px-4 py-2 border">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.length > 0 ? (
                  filteredAssignments.map((assign, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 border">
                        {getUserDisplayName(assign.target, viewTargets)} ({assign.target})
                      </td>
                      <td className="px-4 py-2 border">
                        {assign.role === "Admin"
                          ? getUserDisplayName(assign.assignedId, marketers)
                          : getUserDisplayName(assign.assignedId, admins)} ({assign.assignedId})
                      </td>
                      <td className="px-4 py-2 border">{assign.role}</td>
                      <td className="px-4 py-2 border">
                        {viewTargets.find((u) => u.unique_id === assign.target)?.location || "N/A"}
                      </td>
                      <td className="px-4 py-2 border">Active</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-4 py-2 text-center">
                      No assignments found for the selected {viewRole}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Current Assignments Section with Unassign Option */}
      <div className="p-4 border rounded shadow">
        <h3 className="text-xl font-semibold mb-2">Current Assignments (All)</h3>
        {assignments.length > 0 ? (
          <>
            <table className="min-w-full border border-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 border text-center">Select</th>
                  <th className="px-4 py-2 border">Assigned To</th>
                  <th className="px-4 py-2 border">User Assigned</th>
                  <th className="px-4 py-2 border">Role</th>
                  <th className="px-4 py-2 border">Location</th>
                  <th className="px-4 py-2 border">Status</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assign, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 border text-center">
                      <input
                        type="checkbox"
                        onChange={(e) => handleUnassignCheckboxChange(e, assign)}
                        checked={selectedUnassign.some(
                          (a) =>
                            a.target === assign.target &&
                            a.assignedId === assign.assignedId &&
                            a.role === assign.role
                        )}
                      />
                    </td>
                    <td className="px-4 py-2 border">
                      {assign.role === "SuperAdmin"
                        ? getUserDisplayName(assign.target, superAdmins)
                        : getUserDisplayName(assign.target, admins)} ({assign.target})
                    </td>
                    <td className="px-4 py-2 border">
                      {assign.role === "Admin"
                        ? getUserDisplayName(assign.assignedId, marketers)
                        : getUserDisplayName(assign.assignedId, admins)} ({assign.assignedId})
                    </td>
                    <td className="px-4 py-2 border">{assign.role}</td>
                    <td className="px-4 py-2 border">
                      {roleUsers.find((u) => u.unique_id === assign.target)?.location || "N/A"}
                    </td>
                    <td className="px-4 py-2 border">Active</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={handleUnassignSelected}
              className="mt-4 bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded"
            >
              Unassign Selected
            </button>
          </>
        ) : (
          <p>No assignments made yet.</p>
        )}
      </div>
    </div>
  );
}

export default AssignUsers;
