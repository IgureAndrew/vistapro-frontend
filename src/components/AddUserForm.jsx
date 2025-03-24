import React, { useState } from "react";

function AddUserForm({ onUserAdded }) {
  const baseUrl = "http://localhost:5000"; // adjust as needed
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "",
    account_number: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
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
        onUserAdded(); // Refresh the user list
        setFormData({
          name: "",
          email: "",
          password: "",
          phone: "",
          role: "",
          account_number: "",
        });
      } else {
        alert(data.message || "Failed to add user");
      }
    } catch (error) {
      console.error("Error adding user:", error);
      alert("Error adding user");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 bg-white rounded shadow">
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
        <option value="Admin">Admin</option>
        <option value="Dealer">Dealer</option>
        <option value="Marketer">Marketer</option>
        <option value="SuperAdmin">SuperAdmin</option>
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
  );
}

export default AddUserForm;
