import React, { useState, useEffect } from "react";
import Modal from "../components/Modal";
import { UserIcon } from "@heroicons/react/24/outline";

// List of Nigerian states for location selection.
const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe",
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
  "Taraba", "Yobe", "Zamfara", "FCT"
];

function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 20;

  // Modals for add/edit
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);

  // The user we are editing
  const [selectedUser, setSelectedUser] = useState(null);

  // Form data for ADD user
  const [addFormData, setAddFormData] = useState({
    role: "",
    first_name: "",
    last_name: "",
    gender: "",
    email: "",
    password: "",
    bank_name: "",
    account_number: "",
    account_name: "",
    location: "",
    registered_business_name: "",
    registered_business_address: "",
    business_account_name: "",
    business_account_number: "",
    registrationCertificate: null,
  });

  // Form data for EDIT user
  const [editFormData, setEditFormData] = useState({
    role: "",
    first_name: "",
    last_name: "",
    gender: "",
    email: "",
    password: "",
    bank_name: "",
    account_number: "",
    account_name: "",
    location: "",
    registered_business_name: "",
    registered_business_address: "",
    business_account_name: "",
    business_account_number: "",
    registrationCertificate: null,
  });

  const [showPassword, setShowPassword] = useState(false);
  const toggleShowPassword = () => setShowPassword((prev) => !prev);

  const baseUrl = "https://vistapro-backend.onrender.com/api/master-admin/users";
  const token = localStorage.getItem("token");

  // Fetch users
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const currentToken = localStorage.getItem("token");
      const res = await fetch(baseUrl, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users);
      } else {
        setError(data.message || "Failed to fetch users");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Error fetching users");
    }
  };

  // -------------------- ADD USER LOGIC --------------------
  const openAddUserModal = () => {
    // Reset addFormData to defaults
    setAddFormData({
      role: "",
      first_name: "",
      last_name: "",
      gender: "",
      email: "",
      password: "",
      bank_name: "",
      account_number: "",
      account_name: "",
      location: "",
      registered_business_name: "",
      registered_business_address: "",
      business_account_name: "",
      business_account_number: "",
      registrationCertificate: null,
    });
    setShowAddUserModal(true);
  };

  const closeAddUserModal = () => {
    setShowAddUserModal(false);
  };

  const handleAddChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      setAddFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setAddFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      alert("No token provided. Please log in again.");
      return;
    }
    try {
      let payload;
      let headers = { Authorization: `Bearer ${token}` };

      // If creating a Dealer with a PDF certificate, use FormData
      if (
        addFormData.role === "Dealer" &&
        addFormData.registrationCertificate
      ) {
        payload = new FormData();
        for (const key in addFormData) {
          payload.append(key, addFormData[key]);
        }
      } else {
        payload = JSON.stringify(addFormData);
        headers["Content-Type"] = "application/json";
      }

      const res = await fetch(baseUrl, {
        method: "POST",
        headers,
        body: payload,
      });
      const data = await res.json();
      if (res.ok) {
        alert("User added successfully!");
        fetchUsers();
        closeAddUserModal();
      } else {
        alert(data.message || "Failed to add user");
      }
    } catch (error) {
      console.error("Error adding user:", error);
      alert("Error adding user");
    }
  };

  // -------------------- EDIT USER LOGIC --------------------
  const openEditUserModal = (user) => {
    setSelectedUser(user);
    // Pre-populate editFormData
    setEditFormData({
      role: user.role || "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      gender: user.gender || "",
      email: user.email || "",
      password: "", // not shown (only if they want to reset)
      bank_name: user.bank_name || "",
      account_number: user.account_number || "",
      account_name: user.account_name || "",
      location: user.location || "",
      registered_business_name: user.business_name || "",
      registered_business_address: user.business_address || "",
      business_account_name: user.business_account_name || "",
      business_account_number: user.business_account_number || "",
      registrationCertificate: null,
    });
    setShowEditUserModal(true);
  };

  const closeEditUserModal = () => {
    setShowEditUserModal(false);
    setSelectedUser(null);
  };

  const handleEditChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      setEditFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setEditFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser || !selectedUser.unique_id) {
      alert("No user selected for update.");
      return;
    }
    if (!token) {
      alert("No token provided. Please log in again.");
      return;
    }

    try {
      // We'll do a simple JSON body approach (assuming PDF updates are not required for editing).
      // If you need to handle PDF re-upload for editing, you'd do it similarly to handleAddUserSubmit.
      const res = await fetch(`${baseUrl}/${selectedUser.unique_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editFormData),
      });
      const data = await res.json();
      if (res.ok) {
        alert("User updated successfully!");
        fetchUsers();
        closeEditUserModal();
      } else {
        alert(data.message || "Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Error updating user");
    }
  };

  // -------------------- LOCK / UNLOCK / DELETE --------------------
  const handleLockUser = async (userId) => {
    try {
      const res = await fetch(`${baseUrl}/${userId}/lock`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        alert("User locked successfully!");
        fetchUsers();
      } else {
        alert(data.message || "Failed to lock user");
      }
    } catch (error) {
      console.error("Error locking user:", error);
      alert("Error locking user");
    }
  };

  const handleUnlockUser = async (userId) => {
    try {
      const res = await fetch(`${baseUrl}/${userId}/unlock`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        alert("User unlocked successfully!");
        fetchUsers();
      } else {
        alert(data.message || "Failed to unlock user");
      }
    } catch (error) {
      console.error("Error unlocking user:", error);
      alert("Error unlocking user");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`${baseUrl}/${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        alert("User deleted successfully!");
        fetchUsers();
      } else {
        alert(data.message || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Error deleting user");
    }
  };

  // -------------------- SEARCH & PAGINATION --------------------
  const filteredUsers = users.filter((user) => {
    const term = searchTerm.toLowerCase();
    const nameString =
      user.role === "Dealer"
        ? user.business_name || `${user.first_name} ${user.last_name}`
        : `${user.first_name || ""} ${user.last_name || ""}`;
    return (
      nameString.toLowerCase().includes(term) ||
      (user.email || "").toLowerCase().includes(term) ||
      (user.id && user.id.toString().includes(term)) ||
      (user.role || "").toLowerCase().includes(term)
    );
  });

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // -------------------- RENDER --------------------
  return (
    <div className="p-6 space-y-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Users</h1>
        <button
          onClick={openAddUserModal}
          className="bg-black text-[#FFD700] font-bold px-4 py-2 rounded"
        >
          Add Users
        </button>
      </div>

      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, email, ID, or role"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-sm border-2 border-gray-300 rounded px-4 py-2 font-bold"
        />
      </div>

      {error && <p className="text-red-500 font-bold">{error}</p>}

      {/* Users Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Unique ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currentUsers.length > 0 ? (
              currentUsers.map((user) => {
                const displayName =
                  user.role === "Dealer"
                    ? user.business_name || `${user.first_name} ${user.last_name}`
                    : `${user.first_name} ${user.last_name}`;
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {user.unique_id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                          <UserIcon className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{displayName}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{user.role}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{user.location}</td>
                    <td className="px-6 py-4">
                      {user.locked ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800">
                          Locked
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm space-x-2">
                      <button
                        onClick={() => openEditUserModal(user)}
                        className="bg-black text-[#FFD700] font-bold px-3 py-1 rounded"
                      >
                        Edit
                      </button>
                      {user.locked ? (
                        <button
                          onClick={() => handleUnlockUser(user.id)}
                          className="bg-black text-[#FFD700] font-bold px-3 py-1 rounded"
                        >
                          Unlock
                        </button>
                      ) : (
                        <button
                          onClick={() => handleLockUser(user.id)}
                          className="bg-black text-[#FFD700] font-bold px-3 py-1 rounded"
                        >
                          Lock
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="bg-black text-[#FFD700] font-bold px-3 py-1 rounded"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center font-bold text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center mt-6 space-x-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
          <button
            key={pageNumber}
            onClick={() => handlePageChange(pageNumber)}
            className={`px-4 py-2 rounded border font-bold ${
              currentPage === pageNumber
                ? "bg-black text-[#FFD700] border-black"
                : "bg-white text-black border-gray-300"
            }`}
          >
            {pageNumber}
          </button>
        ))}
      </div>

      {/* ADD USER MODAL */}
      {showAddUserModal && (
        <Modal isOpen={showAddUserModal} onClose={closeAddUserModal}>
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md mx-auto max-h-[60vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4">Add New User</h3>
            <form onSubmit={handleAddUserSubmit} className="space-y-4">
              {/* Role Field */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Role</label>
                <select
                  name="role"
                  value={addFormData.role}
                  onChange={handleAddChange}
                  className="w-full border-2 border-gray-300 rounded px-3 py-2 font-bold"
                  required
                >
                  <option value="">Select Role</option>
                  <option value="SuperAdmin">Super Admin</option>
                  <option value="Admin">Admin</option>
                  <option value="Marketer">Marketer</option>
                  <option value="Dealer">Dealer</option>
                </select>
              </div>
              {/* Common Fields */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  placeholder="First Name"
                  value={addFormData.first_name}
                  onChange={handleAddChange}
                  className="w-full border-2 border-gray-300 rounded px-3 py-2 font-bold"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  placeholder="Last Name"
                  value={addFormData.last_name}
                  onChange={handleAddChange}
                  className="w-full border-2 border-gray-300 rounded px-3 py-2 font-bold"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Gender</label>
                <select
                  name="gender"
                  value={addFormData.gender}
                  onChange={handleAddChange}
                  className="w-full border-2 border-gray-300 rounded px-3 py-2 font-bold"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={addFormData.email}
                  onChange={handleAddChange}
                  className="w-full border-2 border-gray-300 rounded px-3 py-2 font-bold"
                  required
                />
              </div>
              <div className="relative">
                <label className="block font-bold text-gray-700 mb-1">Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password (min 12 with letters, numbers, & special characters)"
                  value={addFormData.password}
                  onChange={handleAddChange}
                  className="w-full border-2 border-gray-300 rounded px-3 py-2 font-bold"
                  required
                />
                <button
                  type="button"
                  onClick={toggleShowPassword}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  name="bank_name"
                  placeholder="Bank Name"
                  value={addFormData.bank_name}
                  onChange={handleAddChange}
                  className="w-full border-2 border-gray-300 rounded px-3 py-2 font-bold"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Account Number</label>
                <input
                  type="text"
                  name="account_number"
                  placeholder="Account Number (10 digits)"
                  value={addFormData.account_number}
                  onChange={handleAddChange}
                  className="w-full border-2 border-gray-300 rounded px-3 py-2 font-bold"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Account Name</label>
                <input
                  type="text"
                  name="account_name"
                  placeholder="Account Name"
                  value={addFormData.account_name}
                  onChange={handleAddChange}
                  className="w-full border-2 border-gray-300 rounded px-3 py-2 font-bold"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Location (State)</label>
                <select
                  name="location"
                  value={addFormData.location}
                  onChange={handleAddChange}
                  className="w-full border-2 border-gray-300 rounded px-3 py-2 font-bold"
                  required
                >
                  <option value="">Select State</option>
                  {NIGERIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
              {/* Dealer-specific Fields */}
              {addFormData.role === "Dealer" && (
                <>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Registered Business Name
                    </label>
                    <input
                      type="text"
                      name="registered_business_name"
                      placeholder="Registered Business Name"
                      value={addFormData.registered_business_name}
                      onChange={handleAddChange}
                      className="w-full border-2 border-gray-300 rounded px-3 py-2 font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Registered Business Address
                    </label>
                    <input
                      type="text"
                      name="registered_business_address"
                      placeholder="Registered Business Address"
                      value={addFormData.registered_business_address}
                      onChange={handleAddChange}
                      className="w-full border-2 border-gray-300 rounded px-3 py-2 font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Business Account Name
                    </label>
                    <input
                      type="text"
                      name="business_account_name"
                      placeholder="Business Account Name"
                      value={addFormData.business_account_name}
                      onChange={handleAddChange}
                      className="w-full border-2 border-gray-300 rounded px-3 py-2 font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Business Account Number
                    </label>
                    <input
                      type="text"
                      name="business_account_number"
                      placeholder="Business Account Number"
                      value={addFormData.business_account_number}
                      onChange={handleAddChange}
                      className="w-full border-2 border-gray-300 rounded px-3 py-2 font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Upload Registration Certificate (PDF)
                    </label>
                    <input
                      type="file"
                      name="registrationCertificate"
                      accept="application/pdf"
                      onChange={handleAddChange}
                      className="w-full border-2 border-gray-300 rounded px-3 py-2 font-bold"
                      required
                    />
                  </div>
                </>
              )}
              <div className="flex justify-end gap-4 pt-2">
                <button
                  type="button"
                  onClick={closeAddUserModal}
                  className="bg-black text-[#FFD700] font-bold px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-black text-[#FFD700] font-bold px-4 py-2 rounded"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* EDIT USER MODAL */}
      {showEditUserModal && selectedUser && (
        <Modal isOpen={showEditUserModal} onClose={closeEditUserModal}>
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md mx-auto max-h-[60vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Edit User</h3>
            <form onSubmit={handleEditUserSubmit} className="space-y-4">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Role</label>
                <select
                  name="role"
                  value={editFormData.role}
                  onChange={handleEditChange}
                  className="w-full border-2 border-gray-300 rounded px-3 py-2 font-bold"
                >
                  <option value="SuperAdmin">Super Admin</option>
                  <option value="Admin">Admin</option>
                  <option value="Marketer">Marketer</option>
                  <option value="Dealer">Dealer</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={editFormData.first_name}
                  onChange={handleEditChange}
                  className="w-full border-2 border-gray-300 rounded px-3 py-2 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={editFormData.last_name}
                  onChange={handleEditChange}
                  className="w-full border-2 border-gray-300 rounded px-3 py-2 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Gender</label>
                <select
                  name="gender"
                  value={editFormData.gender}
                  onChange={handleEditChange}
                  className="w-full border-2 border-gray-300 rounded px-3 py-2 font-bold"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={editFormData.email}
                  onChange={handleEditChange}
                  className="w-full border-2 border-gray-300 rounded px-3 py-2 font-bold"
                />
              </div>
              <div className="relative">
                <label className="block font-bold text-gray-700 mb-1">Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={editFormData.password}
                  onChange={handleEditChange}
                  placeholder="(Optional) Enter new password"
                  className="w-full border-2 border-gray-300 rounded px-3 py-2 font-bold"
                />
                <button
                  type="button"
                  onClick={toggleShowPassword}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  name="bank_name"
                  value={editFormData.bank_name}
                  onChange={handleEditChange}
                  className="w-full border-2 border-gray-300 rounded px-3 py-2 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Account Number</label>
                <input
                  type="text"
                  name="account_number"
                  value={editFormData.account_number}
                  onChange={handleEditChange}
                  className="w-full border-2 border-gray-300 rounded px-3 py-2 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Account Name</label>
                <input
                  type="text"
                  name="account_name"
                  value={editFormData.account_name}
                  onChange={handleEditChange}
                  className="w-full border-2 border-gray-300 rounded px-3 py-2 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Location (State)</label>
                <select
                  name="location"
                  value={editFormData.location}
                  onChange={handleEditChange}
                  className="w-full border-2 border-gray-300 rounded px-3 py-2 font-bold"
                >
                  <option value="">Select State</option>
                  {NIGERIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              {/* If editing a Dealer, you can optionally allow re-upload of a PDF, etc. 
                  For brevity, we omit re-upload logic or make it optional. */}

              <div className="flex justify-end gap-4 pt-2">
                <button
                  type="button"
                  onClick={closeEditUserModal}
                  className="bg-black text-[#FFD700] font-bold px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-black text-[#FFD700] font-bold px-4 py-2 rounded"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default UsersManagement;
