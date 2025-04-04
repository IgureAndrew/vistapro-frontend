import React, { useState, useEffect } from "react";
import Modal from "../components/Modal";
import { UserIcon } from "@heroicons/react/24/outline";

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe",
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
  "Taraba", "Yobe", "Zamfara", "FCT"
];

function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const baseUrl = "https://vistapro-backend.onrender.com/api/master-admin/users";
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
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

  const filteredUsers = users.filter((user) => {
    const term = searchTerm.toLowerCase();
    const nameString =
      user.role === "Dealer"
        ? user.business_name || `${user.first_name} ${user.last_name}`
        : `${user.first_name || ""} ${user.last_name || ""}`;
    return (
      nameString.toLowerCase().includes(term) ||
      (user.email || "").toLowerCase().includes(term) ||
      user.id?.toString().includes(term)
    );
  });

  const openAddUserModal = () => {
    setFormData({
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

  const closeEditUserModal = () => {
    setSelectedUser(null);
    setShowEditUserModal(false);
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    const currentToken = localStorage.getItem("token");
    if (!currentToken) {
      alert("No token provided. Please log in again.");
      return;
    }
    try {
      let payload;
      let headers = { Authorization: `Bearer ${currentToken}` };
      if (formData.role === "Dealer" && formData.registrationCertificate) {
        payload = new FormData();
        for (const key in formData) {
          payload.append(key, formData[key]);
        }
      } else {
        payload = JSON.stringify(formData);
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

  const openEditUserModal = (user) => {
    setSelectedUser(user);
    setEditFormData({
      role: user.role || "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      gender: user.gender || "",
      email: user.email || "",
      password: "",
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

  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    // Implement update logic here (similar to handleAddUser)
    console.log("Edit form submitted:", editFormData);
    closeEditUserModal();
  };

  const handleLockUser = async (userId) => {
    const currentToken = localStorage.getItem("token");
    try {
      const res = await fetch(`${baseUrl}/${userId}/lock`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
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
    const currentToken = localStorage.getItem("token");
    try {
      const res = await fetch(`${baseUrl}/${userId}/unlock`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
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
    const currentToken = localStorage.getItem("token");
    try {
      const res = await fetch(`${baseUrl}/${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
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

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="p-6 space-y-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Users</h1>
        <button
          onClick={openAddUserModal}
          className="bg-black text-[#FFD700] font-bold px-4 py-2 rounded"
        >
          Add User
        </button>
      </div>

      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, email, or ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-sm border-2 border-gray-300 rounded px-4 py-2 font-bold"
        />
      </div>

      {error && <p className="text-red-500 font-bold">{error}</p>}

      {/* Table of Users */}
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
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => {
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

      {/* Add / Edit User Modal */}
      {showAddUserModal && (
        <Modal isOpen={showAddUserModal} onClose={closeAddUserModal}>
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md mx-auto max-h-[60vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4">
              {selectedUser ? "Edit User" : "Add New User"}
            </h3>
            <form onSubmit={selectedUser ? handleEditUserSubmit : handleAddUser} className="space-y-4">
              {/* Role */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
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
                  value={formData.first_name}
                  onChange={handleChange}
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
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-300 rounded px-3 py-2 font-bold"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
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
                  value={formData.email}
                  onChange={handleChange}
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
                  value={formData.password}
                  onChange={handleChange}
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
                  value={formData.bank_name}
                  onChange={handleChange}
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
                  value={formData.account_number}
                  onChange={handleChange}
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
                  value={formData.account_name}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-300 rounded px-3 py-2 font-bold"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Location (State)</label>
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
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
              {formData.role === "Dealer" && (
                <>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Registered Business Name</label>
                    <input
                      type="text"
                      name="registered_business_name"
                      placeholder="Registered Business Name"
                      value={formData.registered_business_name}
                      onChange={handleChange}
                      className="w-full border-2 border-gray-300 rounded px-3 py-2 font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Registered Business Address</label>
                    <input
                      type="text"
                      name="registered_business_address"
                      placeholder="Registered Business Address"
                      value={formData.registered_business_address}
                      onChange={handleChange}
                      className="w-full border-2 border-gray-300 rounded px-3 py-2 font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Business Account Name</label>
                    <input
                      type="text"
                      name="business_account_name"
                      placeholder="Business Account Name"
                      value={formData.business_account_name}
                      onChange={handleChange}
                      className="w-full border-2 border-gray-300 rounded px-3 py-2 font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Business Account Number</label>
                    <input
                      type="text"
                      name="business_account_number"
                      placeholder="Business Account Number"
                      value={formData.business_account_number}
                      onChange={handleChange}
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
                      onChange={handleChange}
                      className="w-full border-2 border-gray-300 rounded px-3 py-2 font-bold"
                      required
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddUserModal(false);
                    closeEditUserModal();
                  }}
                  className="bg-black text-[#FFD700] font-bold px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-black text-[#FFD700] font-bold px-4 py-2 rounded"
                >
                  {selectedUser ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {showEditUserModal && (
        <Modal isOpen={showEditUserModal} onClose={closeEditUserModal}>
          <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-md mx-auto max-h-[60vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Edit User</h3>
            {selectedUser && (
              <form onSubmit={handleEditUserSubmit} className="space-y-4">
                {selectedUser.role === "Dealer" ? (
                  <>
                    <label className="block mb-1 font-medium">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={selectedUser.email || ""}
                      onChange={(e) =>
                        setSelectedUser((prev) => ({ ...prev, email: e.target.value }))
                      }
                      className="border border-gray-300 rounded px-4 py-2 w-full"
                    />
                  </>
                ) : (
                  <>
                    <label className="block mb-1 font-medium">First Name</label>
                    <input
                      type="text"
                      name="first_name"
                      value={selectedUser.first_name || ""}
                      onChange={(e) =>
                        setSelectedUser((prev) => ({ ...prev, first_name: e.target.value }))
                      }
                      className="border border-gray-300 rounded px-4 py-2 w-full"
                    />
                    <label className="block mb-1 font-medium">Last Name</label>
                    <input
                      type="text"
                      name="last_name"
                      value={selectedUser.last_name || ""}
                      onChange={(e) =>
                        setSelectedUser((prev) => ({ ...prev, last_name: e.target.value }))
                      }
                      className="border border-gray-300 rounded px-4 py-2 w-full"
                    />
                    <label className="block mb-1 font-medium">Gender</label>
                    <input
                      type="text"
                      name="gender"
                      value={selectedUser.gender || ""}
                      onChange={(e) =>
                        setSelectedUser((prev) => ({ ...prev, gender: e.target.value }))
                      }
                      className="border border-gray-300 rounded px-4 py-2 w-full"
                    />
                    <label className="block mb-1 font-medium">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={selectedUser.email || ""}
                      onChange={(e) =>
                        setSelectedUser((prev) => ({ ...prev, email: e.target.value }))
                      }
                      className="border border-gray-300 rounded px-4 py-2 w-full"
                    />
                    <label className="block mb-1 font-medium">Bank Name</label>
                    <input
                      type="text"
                      name="bank_name"
                      value={selectedUser.bank_name || ""}
                      onChange={(e) =>
                        setSelectedUser((prev) => ({ ...prev, bank_name: e.target.value }))
                      }
                      className="border border-gray-300 rounded px-4 py-2 w-full"
                    />
                    <label className="block mb-1 font-medium">Account Number</label>
                    <input
                      type="text"
                      name="account_number"
                      value={selectedUser.account_number || ""}
                      onChange={(e) =>
                        setSelectedUser((prev) => ({ ...prev, account_number: e.target.value }))
                      }
                      className="border border-gray-300 rounded px-4 py-2 w-full"
                    />
                    <label className="block mb-1 font-medium">Account Name</label>
                    <input
                      type="text"
                      name="account_name"
                      value={selectedUser.account_name || ""}
                      onChange={(e) =>
                        setSelectedUser((prev) => ({ ...prev, account_name: e.target.value }))
                      }
                      className="border border-gray-300 rounded px-4 py-2 w-full"
                    />
                  </>
                )}
                <label className="block mb-1 font-medium">Role</label>
                <select
                  name="role"
                  value={selectedUser.role || ""}
                  onChange={(e) =>
                    setSelectedUser((prev) => ({ ...prev, role: e.target.value }))
                  }
                  className="border border-gray-300 rounded px-4 py-2 w-full"
                >
                  <option value="SuperAdmin">Super Admin</option>
                  <option value="Admin">Admin</option>
                  <option value="Marketer">Marketer</option>
                  <option value="Dealer">Dealer</option>
                </select>
                <label className="block mb-1 font-medium">Location</label>
                <select
                  name="location"
                  value={selectedUser.location || ""}
                  onChange={(e) =>
                    setSelectedUser((prev) => ({ ...prev, location: e.target.value }))
                  }
                  className="border border-gray-300 rounded px-4 py-2 w-full"
                  required
                >
                  <option value="">Select State</option>
                  {NIGERIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                <div className="flex justify-end space-x-2 mt-4">
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
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

export default UsersManagement;
