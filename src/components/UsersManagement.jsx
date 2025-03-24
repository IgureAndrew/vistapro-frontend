import React, { useState, useEffect } from "react";

function UsersManagement() {
  const [users, setUsers] = useState([]);
  const baseUrl = "http://localhost:5000";
  const token = localStorage.getItem("token");

  // State for the add user form
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "", // Allowed values: "SuperAdmin", "Admin", "Dealer", "Marketer"
    account_number: "",
  });

  // Function to fetch users from the backend
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/master-admin/users`, {
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

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handler for form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handler for adding a new user
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${baseUrl}/api/master-admin/users`, {
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
        // Clear the form data
        setFormData({
          name: "",
          email: "",
          password: "",
          phone: "",
          role: "",
          account_number: "",
        });
        // Refresh the user list
        fetchUsers();
      } else {
        alert(data.message || "Failed to add user");
      }
    } catch (error) {
      console.error("Error adding user:", error);
      alert("Error adding user");
    }
  };

  // Handlers for locking, unlocking, and deleting users
  const lockUser = async (id) => {
    try {
      const res = await fetch(`${baseUrl}/api/master-admin/users/${id}/lock`, {
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
      const res = await fetch(`${baseUrl}/api/master-admin/users/${id}/unlock`, {
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
      const res = await fetch(`${baseUrl}/api/master-admin/users/${id}`, {
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

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Users Management</h2>

      {/* Add User Form */}
      <form onSubmit={handleAddUser} className="flex flex-col gap-4 p-4 bg-white rounded shadow mb-6">
        <h3 className="text-xl font-semibold">Add New User</h3>
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          className="border border-gray-300 rounded px-4 py-2"
          required
        />
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
        <input
          type="text"
          name="phone"
          placeholder="Phone"
          value={formData.phone}
          onChange={handleChange}
          className="border border-gray-300 rounded px-4 py-2"
        />
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
          <option value="Dealer">Dealer</option>
          <option value="Marketer">Marketer</option>
        </select>
        <input
          type="text"
          name="account_number"
          placeholder="Account Number"
          value={formData.account_number}
          onChange={handleChange}
          className="border border-gray-300 rounded px-4 py-2"
        />
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded"
        >
          Add User
        </button>
      </form>

      {/* Users Table */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-200">
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Email</th>
              <th className="px-4 py-2 border">Role</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center p-4">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td className="border px-4 py-2">{user.name}</td>
                  <td className="border px-4 py-2">{user.email}</td>
                  <td className="border px-4 py-2">{user.role}</td>
                  <td className="border px-4 py-2">
                    {user.locked ? "Locked" : "Active"}
                  </td>
                  <td className="border px-4 py-2 space-x-2">
                    {user.locked ? (
                      <button
                        onClick={() => unlockUser(user.id)}
                        className="text-green-600 hover:underline"
                      >
                        Unlock
                      </button>
                    ) : (
                      <button
                        onClick={() => lockUser(user.id)}
                        className="text-red-600 hover:underline"
                      >
                        Lock
                      </button>
                    )}
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="text-gray-600 hover:underline"
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
    </div>
  );
}

export default UsersManagement;
