import React, { useState, useEffect } from "react";
import Modal from "../components/Modal"; // Adjust the path as needed

function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  // Use Vite's environment variable for the API URL
  const baseUrl = "https://vistapro-backend.onrender.com";
  const token = localStorage.getItem("token");

  // State for the add user form
  const [formData, setFormData] = useState({
    // For non-dealers:
    first_name: "",
    last_name: "",
    gender: "",
    email: "",
    password: "",
    phone: "",
    // For both:
    bank_id: "",           // if bank is selected from the list
    custom_bank_name: "",  // if "Other" is chosen
    account_number: "",
    account_name: "",
    role: "",              // "SuperAdmin", "Admin", "Marketer", or "Dealer"
    // For dealers:
    business_name: "",
    business_address: "",
    // Optionally a file for dealer's CAC document:
    cac_document: null,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  // Function to fetch users from the backend
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

  // Filtered list based on search term (including user ID)
  const filteredUsers = users.filter((user) =>
    // For non-dealers, assume first_name and last_name exist.
    ((user.first_name && user.last_name &&
      (user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()))) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    user.id.toString().includes(searchTerm))
  );

  // Modal open/close functions
  const openAddUserModal = () => {
    setFormData({
      first_name: "",
      last_name: "",
      gender: "",
      email: "",
      password: "",
      phone: "",
      bank_id: "",
      custom_bank_name: "",
      account_number: "",
      account_name: "",
      role: "",
      business_name: "",
      business_address: "",
      cac_document: null,
    });
    setShowAddUserModal(true);
  };

  const closeAddUserModal = () => {
    setShowAddUserModal(false);
  };

  // Handle form field changes (both text inputs and file inputs)
  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      setFormData((prev) => ({
        ...prev,
        [name]: files[0],
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handler for adding a new user (registration)
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const form = new FormData();
      
      // For dealers, use business fields; for others, use personal fields.
      if (formData.role === "Dealer") {
        form.append("role", formData.role);
        form.append("phone", formData.phone);
        form.append("bank_id", formData.bank_id);
        form.append("custom_bank_name", formData.custom_bank_name);
        form.append("account_number", formData.account_number);
        form.append("account_name", formData.account_name);
        form.append("business_name", formData.business_name);
        form.append("business_address", formData.business_address);
        if (formData.cac_document) {
          form.append("cac_document", formData.cac_document);
        }
        // You may also include a password field if dealers log in.
        if (formData.password) {
          form.append("password", formData.password);
        }
      } else {
        // For SuperAdmin, Admin, Marketer:
        form.append("role", formData.role);
        form.append("first_name", formData.first_name);
        form.append("last_name", formData.last_name);
        form.append("gender", formData.gender);
        form.append("email", formData.email);
        form.append("password", formData.password);
        form.append("phone", formData.phone);
        form.append("bank_id", formData.bank_id);
        form.append("custom_bank_name", formData.custom_bank_name);
        form.append("account_number", formData.account_number);
        form.append("account_name", formData.account_name);
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/master-admin/users`, {
        method: "POST",
        headers: {
          // Do not set Content-Type when sending FormData; the browser will set the boundary.
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      const data = await res.json();
      if (res.ok) {
        alert("User registered successfully!");
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

  // Handlers for blocking/unblocking/deleting users remain unchanged.
  const lockUser = async (id) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/master-admin/users/${id}/lock`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        alert("User locked successfully");
        fetchUsers();
      } else {
        alert(data.message || "Failed to lock user");
      }
    } catch (error) {
      console.error("Error locking user:", error);
      alert("Error locking user");
    }
  };

  const unlockUser = async (id) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/master-admin/users/${id}/unlock`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        alert("User unlocked successfully");
        fetchUsers();
      } else {
        alert(data.message || "Failed to unlock user");
      }
    } catch (error) {
      console.error("Error unlocking user:", error);
      alert("Error unlocking user");
    }
  };

  const deleteUser = async (id) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/master-admin/users/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        alert("User deleted successfully");
        fetchUsers();
      } else {
        alert(data.message || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Error deleting user");
    }
  };

  // Edit user modal functions remain largely unchanged.
  const openEditUserModal = (user) => {
    setSelectedUser(user);
    setShowEditUserModal(true);
  };

  const closeEditUserModal = () => {
    setSelectedUser(null);
    setShowEditUserModal(false);
  };

  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/master-admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: selectedUser.role }), // Example: update role only.
      });
      const data = await res.json();
      if (res.ok) {
        alert("User updated successfully");
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

  const handleEditUserChange = (e) => {
    const { name, value } = e.target;
    setSelectedUser((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Top Bar: Title, Search, and Add User Button */}
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
              <th className="px-4 py-3 font-bold">Profile</th>
              <th className="px-4 py-3 font-bold">Name</th>
              <th className="px-4 py-3 font-bold">Email</th>
              <th className="px-4 py-3 font-bold">Role</th>
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
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{user.id}</td>
                  <td className="px-4 py-3">
                    {user.profilePic ? (
                      <img
                        src={user.profilePic}
                        alt={`${user.first_name || user.business_name}'s profile`}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-white">
                          {(user.first_name && user.first_name.charAt(0)) || (user.business_name && user.business_name.charAt(0)) || "U"}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {user.role === "Dealer"
                      ? user.business_name
                      : `${user.first_name} ${user.last_name}`}
                  </td>
                  <td className="px-4 py-3">{user.email || "-"}</td>
                  <td className="px-4 py-3">{user.role}</td>
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
                        onClick={() => unlockUser(user.id)}
                        className="bg-green-100 hover:bg-green-200 text-green-600 py-1 px-3 rounded text-sm font-medium"
                      >
                        Unlock
                      </button>
                    ) : (
                      <button
                        onClick={() => lockUser(user.id)}
                        className="bg-red-100 hover:bg-red-200 text-red-600 py-1 px-3 rounded text-sm font-medium"
                      >
                        Lock
                      </button>
                    )}
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-3 rounded text-sm font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      <Modal isOpen={showAddUserModal} onClose={closeAddUserModal}>
        <h3 className="text-xl font-semibold mb-4">Add New User</h3>
        <form onSubmit={handleAddUser} className="flex flex-col gap-4">
          {/* Role selection first */}
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="border border-gray-300 rounded px-4 py-2"
            required
          >
            <option value="">Select Role</option>
            <option value="SuperAdmin">Super Admin</option>
            <option value="Admin">Admin</option>
            <option value="Marketer">Marketer</option>
            <option value="Dealer">Dealer</option>
          </select>

          {formData.role === "Dealer" ? (
            <>
              <input
                type="text"
                name="business_name"
                placeholder="Registered Business Name"
                value={formData.business_name}
                onChange={handleChange}
                className="border border-gray-300 rounded px-4 py-2"
                required
              />
              <textarea
                name="business_address"
                placeholder="Registered Business Address"
                value={formData.business_address}
                onChange={handleChange}
                className="border border-gray-300 rounded px-4 py-2"
                required
              />
              {/* File input for CAC document could be added here */}
            </>
          ) : (
            <>
              <input
                type="text"
                name="first_name"
                placeholder="First Name"
                value={formData.first_name}
                onChange={handleChange}
                className="border border-gray-300 rounded px-4 py-2"
                required
              />
              <input
                type="text"
                name="last_name"
                placeholder="Last Name"
                value={formData.last_name}
                onChange={handleChange}
                className="border border-gray-300 rounded px-4 py-2"
                required
              />
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="border border-gray-300 rounded px-4 py-2"
                required
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="border border-gray-300 rounded px-4 py-2"
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="border border-gray-300 rounded px-4 py-2"
                required
              />
            </>
          )}

          {/* Common fields for all roles */}
          <input
            type="text"
            name="phone"
            placeholder="Phone"
            value={formData.phone}
            onChange={handleChange}
            className="border border-gray-300 rounded px-4 py-2"
          />

          {/* Bank fields */}
          <select
            name="bank_name"
            value={formData.bank_name}
            onChange={handleChange}
            className="border border-gray-300 rounded px-4 py-2"
            required
          >
            <option value="">Select Bank</option>
            {/* Ideally, you'd fetch these from your /api/banks endpoint */}
            <option value="Access Bank">Access Bank</option>
            <option value="First Bank of Nigeria">First Bank of Nigeria</option>
            <option value="Guaranty Trust Bank">Guaranty Trust Bank</option>
            <option value="Zenith Bank">Zenith Bank</option>
            <option value="United Bank for Africa">United Bank for Africa</option>
            <option value="Stanbic IBTC Bank">Stanbic IBTC Bank</option>
            <option value="Other">Other</option>
          </select>
          {formData.bank_name === "Other" && (
            <input
              type="text"
              name="custom_bank_name"
              placeholder="Enter Bank Name"
              value={formData.custom_bank_name}
              onChange={handleChange}
              className="border border-gray-300 rounded px-4 py-2"
              required
            />
          )}

          <input
            type="text"
            name="account_number"
            placeholder="Account Number"
            value={formData.account_number}
            onChange={handleChange}
            className="border border-gray-300 rounded px-4 py-2"
            required
          />
          <input
            type="text"
            name="account_name"
            placeholder="Account Name"
            value={formData.account_name}
            onChange={handleChange}
            className="border border-gray-300 rounded px-4 py-2"
            required
          />

          {/* Profile picture (optional) */}
          <input
            type="file"
            name="profilePic"
            accept="image/*"
            onChange={handleChange}
            className="border border-gray-300 rounded px-4 py-2"
          />
          <div className="flex justify-end space-x-2 mt-4">
            <button
              type="button"
              onClick={closeAddUserModal}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded"
            >
              Save
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={showEditUserModal} onClose={closeEditUserModal}>
        <h3 className="text-xl font-semibold mb-4">Edit User</h3>
        {selectedUser && (
          <form onSubmit={handleEditUserSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block mb-1 font-medium">Name</label>
              <input
                type="text"
                name="name"
                value={selectedUser.name}
                onChange={handleEditUserChange}
                className="border border-gray-300 rounded px-4 py-2 w-full"
                disabled
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Email</label>
              <input
                type="email"
                name="email"
                value={selectedUser.email}
                onChange={handleEditUserChange}
                className="border border-gray-300 rounded px-4 py-2 w-full"
                disabled
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Role</label>
              <select
                name="role"
                value={selectedUser.role}
                onChange={handleEditUserChange}
                className="border border-gray-300 rounded px-4 py-2 w-full"
              >
                <option value="SuperAdmin">Super Admin</option>
                <option value="Admin">Admin</option>
                <option value="Dealer">Dealer</option>
                <option value="Marketer">Marketer</option>
              </select>
            </div>
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
      </Modal>
    </div>
  );
}

export default UsersManagement;
