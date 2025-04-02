import React, { useState, useEffect } from "react";
import Modal from "../components/Modal";

const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
  "FCT"
];

function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const baseUrl = "https://vistapro-backend.onrender.com";
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    role: "",
    // Non-Dealer fields
    first_name: "",
    last_name: "",
    gender: "",
    email: "",
    password: "",
    bank_name: "",
    account_number: "",
    account_name: "",
    location: "",
    // Dealer fields
    business_name: "",
    business_address: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/master-admin/users`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users);
      } else {
        alert(data.message || "Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      alert("Error fetching users");
    }
  };

  const filteredUsers = users.filter((user) => {
    const term = searchTerm.toLowerCase();
    const nameString =
      user.role === "Dealer"
        ? user.business_name || ""
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
      business_name: "",
      business_address: "",
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
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/master-admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
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
    setShowEditUserModal(true);
  };

  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    // Implement the update logic for the user here
    // For example, send a PATCH/PUT request with the updated user details.
    // After successful update:
    closeEditUserModal();
  };

  const handleEditUserChange = (e) => {
    const { name, value } = e.target;
    setSelectedUser((prev) => ({ ...prev, [name]: value }));
  };

  // Lock user account
  const handleLockUser = async (userId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/master-admin/users/${userId}/lock`, {
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

  // Unlock user account
  const handleUnlockUser = async (userId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/master-admin/users/${userId}/unlock`, {
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

  // Delete user account
  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/master-admin/users/${userId}`, {
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

  return (
    <div className="p-6 space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-semibold">Users Management</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <input
            type="text"
            placeholder="Search by name, email, or ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded px-4 py-2"
          />
          <button
            onClick={openAddUserModal}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded"
          >
            + Add New User
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-3 font-bold">ID</th>
              <th className="px-4 py-3 font-bold">Name</th>
              <th className="px-4 py-3 font-bold">Email</th>
              <th className="px-4 py-3 font-bold">Role</th>
              <th className="px-4 py-3 font-bold">Location</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3 font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center p-4">
                  No users found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const displayName =
                  user.role === "Dealer"
                    ? user.business_name || ""
                    : `${user.first_name || ""} ${user.last_name || ""}`;
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{user.id}</td>
                    <td className="px-4 py-3">{displayName.trim()}</td>
                    <td className="px-4 py-3">{user.email || "-"}</td>
                    <td className="px-4 py-3">{user.role}</td>
                    <td className="px-4 py-3">{user.location || "-"}</td>
                    <td className="px-4 py-3">
                      {user.locked ? (
                        <span className="text-red-500 font-medium">Locked</span>
                      ) : (
                        <span className="text-green-600 font-medium">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => openEditUserModal(user)}
                        className="bg-indigo-100 hover:bg-indigo-200 text-indigo-600 py-1 px-3 rounded text-sm font-medium"
                      >
                        Edit
                      </button>
                      {user.locked ? (
                        <button
                          onClick={() => handleUnlockUser(user.id)}
                          className="bg-green-100 hover:bg-green-200 text-green-600 py-1 px-3 rounded text-sm font-medium"
                        >
                          Unlock
                        </button>
                      ) : (
                        <button
                          onClick={() => handleLockUser(user.id)}
                          className="bg-yellow-100 hover:bg-yellow-200 text-yellow-600 py-1 px-3 rounded text-sm font-medium"
                        >
                          Lock
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="bg-red-100 hover:bg-red-200 text-red-600 py-1 px-3 rounded text-sm font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      <Modal isOpen={showAddUserModal} onClose={closeAddUserModal}>
        <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-md mx-auto max-h-[80vh] overflow-y-auto">
          <h3 className="text-xl font-semibold mb-4">Add New User</h3>
          <form onSubmit={handleAddUser} className="space-y-3">
            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded px-2 py-1 text-sm"
                required
              >
                <option value="">Select Role</option>
                <option value="SuperAdmin">Super Admin</option>
                <option value="Admin">Admin</option>
                <option value="Marketer">Marketer</option>
                <option value="Dealer">Dealer</option>
              </select>
            </div>

            {formData.role === "Dealer" ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Name
                  </label>
                  <input
                    type="text"
                    name="business_name"
                    placeholder="Business Name"
                    value={formData.business_name}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Address
                  </label>
                  <input
                    type="text"
                    name="business_address"
                    placeholder="Business Address"
                    value={formData.business_address}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Password (min 12 alphanumeric)"
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    name="bank_name"
                    placeholder="Bank Name"
                    value={formData.bank_name}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    name="account_number"
                    placeholder="Account Number"
                    value={formData.account_number}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Name
                  </label>
                  <input
                    type="text"
                    name="account_name"
                    placeholder="Account Name"
                    value={formData.account_name}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location (State)
                  </label>
                  <select
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded px-2 py-1 text-sm"
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
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    placeholder="First Name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    placeholder="Last Name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <input
                    type="text"
                    name="gender"
                    placeholder="Gender (male/female)"
                    value={formData.gender}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Password (min 12 alphanumeric)"
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    name="bank_name"
                    placeholder="Bank Name"
                    value={formData.bank_name}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    name="account_number"
                    placeholder="Account Number"
                    value={formData.account_number}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Name
                  </label>
                  <input
                    type="text"
                    name="account_name"
                    placeholder="Account Name"
                    value={formData.account_name}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location (State)
                  </label>
                  <select
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded px-2 py-1 text-sm"
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
              </>
            )}

            {/* Form Buttons */}
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={closeAddUserModal}
                className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={showEditUserModal} onClose={closeEditUserModal}>
        <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-md mx-auto">
          <h3 className="text-xl font-semibold mb-4">Edit User</h3>
          {selectedUser && (
            <form onSubmit={handleEditUserSubmit} className="flex flex-col gap-4">
              {selectedUser.role === "Dealer" ? (
                <>
                  <label className="block mb-1 font-medium">Business Name</label>
                  <input
                    type="text"
                    name="business_name"
                    value={selectedUser.business_name || ""}
                    onChange={handleEditUserChange}
                    className="border border-gray-300 rounded px-4 py-2 w-full"
                  />
                  <label className="block mb-1 font-medium">Business Address</label>
                  <input
                    type="text"
                    name="business_address"
                    value={selectedUser.business_address || ""}
                    onChange={handleEditUserChange}
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
                    onChange={handleEditUserChange}
                    className="border border-gray-300 rounded px-4 py-2 w-full"
                  />
                  <label className="block mb-1 font-medium">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={selectedUser.last_name || ""}
                    onChange={handleEditUserChange}
                    className="border border-gray-300 rounded px-4 py-2 w-full"
                  />
                  <label className="block mb-1 font-medium">Gender</label>
                  <input
                    type="text"
                    name="gender"
                    value={selectedUser.gender || ""}
                    onChange={handleEditUserChange}
                    className="border border-gray-300 rounded px-4 py-2 w-full"
                  />
                  <label className="block mb-1 font-medium">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={selectedUser.email || ""}
                    onChange={handleEditUserChange}
                    className="border border-gray-300 rounded px-4 py-2 w-full"
                  />
                  <label className="block mb-1 font-medium">Bank Name</label>
                  <input
                    type="text"
                    name="bank_name"
                    value={selectedUser.bank_name || ""}
                    onChange={handleEditUserChange}
                    className="border border-gray-300 rounded px-4 py-2 w-full"
                  />
                  <label className="block mb-1 font-medium">Account Number</label>
                  <input
                    type="text"
                    name="account_number"
                    value={selectedUser.account_number || ""}
                    onChange={handleEditUserChange}
                    className="border border-gray-300 rounded px-4 py-2 w-full"
                  />
                  <label className="block mb-1 font-medium">Account Name</label>
                  <input
                    type="text"
                    name="account_name"
                    value={selectedUser.account_name || ""}
                    onChange={handleEditUserChange}
                    className="border border-gray-300 rounded px-4 py-2 w-full"
                  />
                </>
              )}

              <label className="block mb-1 font-medium">Role</label>
              <select
                name="role"
                value={selectedUser.role || ""}
                onChange={handleEditUserChange}
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
                onChange={handleEditUserChange}
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
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded"
                >
                  Update
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default UsersManagement;
