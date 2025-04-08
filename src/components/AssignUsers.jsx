// src/components/AssignUsers.jsx
import React, { useState, useEffect, useMemo } from "react";

// Helper function to get a user's display name given their unique_id and a list of users.
const getUserDisplayName = (uniqueId, users) => {
  const user = users.find((u) => u.unique_id === uniqueId);
  return user ? (user.name || `${user.first_name} ${user.last_name}`) : uniqueId;
};

function AssignUsers() {
  const token = localStorage.getItem("token");
  const apiUrl = import.meta.env.VITE_API_URL;

  // ----------------------------
  // State for Assignment Controls
  // ----------------------------
  // selectedRole: "Admin" means assigning marketers; "SuperAdmin" means assigning admins.
  const [selectedRole, setSelectedRole] = useState("Admin");
  // roleUsers: target users for assignment based on the role selected.
  // For marketers assignment, we want to show all admins regardless of assigned super admin.
  const [roleUsers, setRoleUsers] = useState([]);
  // selectedRoleUser: the unique_id of the chosen target user.
  const [selectedRoleUser, setSelectedRoleUser] = useState("");

  // ----------------------------
  // Data Lists for Each Role
  // ----------------------------
  const [marketers, setMarketers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [superAdmins, setSuperAdmins] = useState([]);

  // ----------------------------
  // State for Assignment Selection
  // ----------------------------
  // Array of unique IDs for users selected (for assignment).
  const [selectedAssignIds, setSelectedAssignIds] = useState([]);
  // assignments: list of current assignment records. Each record: { target, assignedId, role }
  const [assignments, setAssignments] = useState([]);
  // For unassignment selection.
  const [selectedUnassign, setSelectedUnassign] = useState([]);

  // ----------------------------
  // State for Viewing Assignments
  // ----------------------------
  // viewRole: "Admin" or "SuperAdmin" (which role’s assignments we want to view).
  const [viewRole, setViewRole] = useState("");
  // viewTarget: the selected target unique_id for filtering assignments.
  const [viewTarget, setViewTarget] = useState("");
  // Filtered assignments based on viewTarget.
  const [filteredAssignments, setFilteredAssignments] = useState([]);

  // ----------------------------
  // Data Fetching for Each Role
  // ----------------------------

  // Fetch all marketers (role "Marketer")
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

  // ----------------------------
  // Update Target User Dropdown List
  // ----------------------------
  useEffect(() => {
    if (selectedRole === "Admin") {
      // For assigning marketers, now show ALL admins regardless of super admin assignment.
      setRoleUsers(admins);
    } else if (selectedRole === "SuperAdmin") {
      // For assigning admins, show only super admins.
      setRoleUsers(superAdmins);
    }
    // Clear previous selections whenever the role changes.
    setSelectedRoleUser("");
    setSelectedAssignIds([]);
  }, [selectedRole, admins, superAdmins]);

  // ----------------------------
  // Compute Available Users for Assignment
  // ----------------------------
  // When assigning:
  // - If selectedRole is "Admin": available marketers are those without an existing admin (m.admin_id is falsy).
  // - If selectedRole is "SuperAdmin": available admins are those without a super admin (a.super_admin_id is falsy).
  // Additionally, if a target user is selected, only users from the same location are displayed.
  const availableForAssignment = useMemo(() => {
    let list = [];
    if (selectedRole === "Admin") {
      list = marketers.filter((m) => !m.admin_id);
    } else if (selectedRole === "SuperAdmin") {
      list = admins.filter((a) => !a.super_admin_id);
    }
    if (selectedRoleUser) {
      // Get the target from roleUsers by matching unique_id.
      const target = roleUsers.find((u) => u.unique_id === selectedRoleUser);
      if (target && target.location) {
        list = list.filter((u) => u.location === target.location);
      }
    }
    return list;
  }, [selectedRole, selectedRoleUser, marketers, admins, roleUsers]);

  // ----------------------------
  // Update Filtered Assignments on Change
  // ----------------------------
  useEffect(() => {
    if (viewTarget) {
      setFilteredAssignments(assignments.filter((a) => a.target === viewTarget));
    } else {
      setFilteredAssignments(assignments);
    }
  }, [viewTarget, assignments]);

  // ----------------------------
  // Handlers for Controls
  // ----------------------------

  // When selected role changes.
  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value);
  };

  // When target user changes.
  const handleRoleUserChange = (e) => {
    setSelectedRoleUser(e.target.value);
  };

  // When checkbox is toggled in available assignments list.
  const handleAssignCheckboxChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setSelectedAssignIds((prev) => [...prev, value]);
    } else {
      setSelectedAssignIds((prev) => prev.filter((id) => id !== value));
    }
  };

  // Assign selected users to the target.
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
        // When assigning marketers to an admin.
        endpoint = "/api/master-admin/assign-marketers-to-admin";
        payload = {
          adminUniqueId: selectedRoleUser,
          marketerUniqueIds: selectedAssignIds,
        };
      } else if (selectedRole === "SuperAdmin") {
        // When assigning admins to a super admin.
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
        // Add new assignments to state.
        selectedAssignIds.forEach((id) => {
          setAssignments((prev) => [
            ...prev,
            { target: selectedRoleUser, assignedId: id, role: selectedRole },
          ]);
        });
        // Update the local record so the assigned user is no longer available.
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
        // Clear selections.
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

  // Handler for unassignment checkbox change.
  const handleUnassignCheckboxChange = (e, assignment) => {
    const { checked } = e.target;
    if (checked) {
      setSelectedUnassign((prev) => [...prev, assignment]);
    } else {
      setSelectedUnassign((prev) =>
        prev.filter(
          (a) =>
            !(a.target === assignment.target && a.assignedId === assignment.assignedId && a.role === assignment.role)
        )
      );
    }
  };

  // Unassign selected assignments.
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
          alert(data.message || "Unassignment failed for group: " + key);
          return;
        }
        // Update local list to mark these users as unassigned.
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
      // Remove these assignments from local state.
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

  // Handler: Change view role for filtering assignments.
  const handleViewRoleChange = (e) => {
    setViewRole(e.target.value);
    setViewTarget(""); // reset target when view role changes
  };

  // Handler: Change the target for viewing assignments.
  const handleViewTargetChange = (e) => {
    setViewTarget(e.target.value);
  };

  // Get the list of targets for the "View Assignments" dropdown based on viewRole.
  const viewTargets =
    viewRole === "SuperAdmin"
      ? superAdmins
      : viewRole === "Admin"
      ? admins
      : [];

  // ----------------------------
  // Render
  // ----------------------------
  return (
    <div className="p-6 bg-white rounded shadow space-y-8">
      <h2 className="text-2xl font-semibold mb-4">User Assignments</h2>

      {/* Assignment Controls */}
      <div className="p-4 border rounded shadow space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Role selection for assignment */}
          <div className="flex-1">
            <label className="block mb-1 font-semibold">
              Select Role for Assignment:
            </label>
            <select
              value={selectedRole}
              onChange={handleRoleChange}
              className="border border-gray-300 rounded px-4 py-2 w-full"
            >
              <option value="Admin">
                Admin (assign marketers)
              </option>
              <option value="SuperAdmin">
                SuperAdmin (assign admins)
              </option>
            </select>
          </div>
          {/* Target user selection */}
          <div className="flex-1">
            <label className="block mb-1 font-semibold">
              Select {selectedRole} (Name, Location and Unique ID):
            </label>
            <select
              value={selectedRoleUser}
              onChange={handleRoleUserChange}
              className="border border-gray-300 rounded px-4 py-2 w-full"
            >
              <option value="">
                -- Select {selectedRole} --
              </option>
              {roleUsers.map((ru) => (
                <option key={ru.unique_id} value={ru.unique_id}>
                  {ru.name || `${ru.first_name} ${ru.last_name}`} (
                  {ru.location}) ({ru.unique_id})
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
                <th className="px-4 py-2 border text-center">
                  Select
                </th>
                <th className="px-4 py-2 border">
                  Name
                </th>
                <th className="px-4 py-2 border">
                  Email
                </th>
                <th className="px-4 py-2 border">
                  Unique ID
                </th>
                <th className="px-4 py-2 border">
                  Role
                </th>
                <th className="px-4 py-2 border">
                  Location
                </th>
                <th className="px-4 py-2 border">
                  Assignment Status
                </th>
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
                        checked={selectedAssignIds.includes(
                          usr.unique_id
                        )}
                        onChange={handleAssignCheckboxChange}
                      />
                    </td>
                    <td className="px-4 py-2 border">
                      {usr.name ||
                        `${usr.first_name} ${usr.last_name}`}
                    </td>
                    <td className="px-4 py-2 border">
                      {usr.email}
                    </td>
                    <td className="px-4 py-2 border">
                      {usr.unique_id}
                    </td>
                    <td className="px-4 py-2 border">
                      {usr.role}
                    </td>
                    <td className="px-4 py-2 border">
                      {usr.location}
                    </td>
                    <td className="px-4 py-2 border">
                      {usr.admin_id || usr.super_admin_id
                        ? "Assigned"
                        : "Not Assigned"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="px-4 py-2 text-center"
                  >
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

      {/* View Assignments by Target */}
      <div className="p-4 border rounded shadow space-y-4">
        <h3 className="text-xl font-semibold">
          View Assignments by Target
        </h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block mb-1 font-semibold">
              Select Role to View:
            </label>
            <select
              value={viewRole}
              onChange={handleViewRoleChange}
              className="border border-gray-300 rounded px-4 py-2 w-full"
            >
              <option value="">
                -- Select Role --
              </option>
              <option value="Admin">
                Admin (view marketers assigned)
              </option>
              <option value="SuperAdmin">
                SuperAdmin (view admins assigned)
              </option>
            </select>
          </div>
          {viewRole && (
            <div className="flex-1">
              <label className="block mb-1 font-semibold">
                Select {viewRole} (Name, Location and Unique ID):
              </label>
              <select
                value={viewTarget}
                onChange={handleViewTargetChange}
                className="border border-gray-300 rounded px-4 py-2 w-full"
              >
                <option value="">
                  -- Select {viewRole} --
                </option>
                {viewTargets.map((user) => (
                  <option
                    key={user.unique_id}
                    value={user.unique_id}
                  >
                    {user.name ||
                      `${user.first_name} ${user.last_name}`}{" "}
                    ({user.location}) ({user.unique_id})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        {/* Display filtered assignments based on selected target */}
        {viewTarget && (
          <div className="overflow-auto mt-4">
            <table className="min-w-full border border-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 border">
                    Assigned To
                  </th>
                  <th className="px-4 py-2 border">
                    User Assigned
                  </th>
                  <th className="px-4 py-2 border">
                    Role
                  </th>
                  <th className="px-4 py-2 border">
                    Location
                  </th>
                  <th className="px-4 py-2 border">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.length > 0 ? (
                  filteredAssignments.map((assign, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 border">
                        {getUserDisplayName(
                          assign.target,
                          viewTargets
                        )}{" "}
                        ({assign.target})
                      </td>
                      <td className="px-4 py-2 border">
                        {assign.role === "Admin"
                          ? getUserDisplayName(
                              assign.assignedId,
                              admins
                            )
                          : getUserDisplayName(
                              assign.assignedId,
                              marketers
                            )}{" "}
                        ({assign.assignedId})
                      </td>
                      <td className="px-4 py-2 border">
                        {assign.role}
                      </td>
                      <td className="px-4 py-2 border">
                        {viewTargets.find(
                          (u) =>
                            u.unique_id === assign.target
                        )?.location || "N/A"}
                      </td>
                      <td className="px-4 py-2 border">
                        Active
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-4 py-2 text-center"
                    >
                      No assignments found for the selected{" "}
                      {viewRole}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assigned Users Table with Unassign Option */}
      <div className="p-4 border rounded shadow">
        <h3 className="text-xl font-semibold mb-2">
          Current Assignments (All)
        </h3>
        {assignments.length > 0 ? (
          <>
            <table className="min-w-full border border-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 border text-center">
                    Select
                  </th>
                  <th className="px-4 py-2 border">
                    Assigned To
                  </th>
                  <th className="px-4 py-2 border">
                    User Assigned
                  </th>
                  <th className="px-4 py-2 border">
                    Role
                  </th>
                  <th className="px-4 py-2 border">
                    Location
                  </th>
                  <th className="px-4 py-2 border">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assign, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 border text-center">
                      <input
                        type="checkbox"
                        onChange={(e) =>
                          handleUnassignCheckboxChange(e, assign)
                        }
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
                        ? getUserDisplayName(
                            assign.target,
                            superAdmins
                          )
                        : getUserDisplayName(assign.target, admins)}{" "}
                      ({assign.target})
                    </td>
                    <td className="px-4 py-2 border">
                      {assign.role === "Admin"
                        ? getUserDisplayName(
                            assign.assignedId,
                            marketers
                          )
                        : getUserDisplayName(
                            assign.assignedId,
                            admins
                          )}{" "}
                      ({assign.assignedId})
                    </td>
                    <td className="px-4 py-2 border">
                      {assign.role}
                    </td>
                    <td className="px-4 py-2 border">
                      {roleUsers.find(
                        (u) => u.unique_id === assign.target
                      )?.location || "N/A"}
                    </td>
                    <td className="px-4 py-2 border">
                      Active
                    </td>
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
