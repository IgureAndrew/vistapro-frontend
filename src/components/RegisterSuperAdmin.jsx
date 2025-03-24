// src/components/RegisterSuperAdmin.jsx
import React, { useState } from "react";

function RegisterSuperAdmin() {
  const baseUrl = "http://localhost:5000"; // adjust if needed
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${baseUrl}/api/master-admin/register-super-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Super Admin registered successfully!");
        setFormData({ name: "", email: "", password: "", phone: "" });
      } else {
        alert(data.message || "Failed to register Super Admin");
      }
    } catch (error) {
      console.error("Error registering Super Admin:", error);
      alert("Error registering Super Admin");
    }
  };

  return (
    <div className="p-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Register Super Admin</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          name="name"
          placeholder="Name"
          className="border border-gray-300 rounded px-4 py-2"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          className="border border-gray-300 rounded px-4 py-2"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          className="border border-gray-300 rounded px-4 py-2"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="phone"
          placeholder="Phone"
          className="border border-gray-300 rounded px-4 py-2"
          value={formData.phone}
          onChange={handleChange}
          required
        />
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded"
        >
          Register Super Admin
        </button>
      </form>
    </div>
  );
}

export default RegisterSuperAdmin;
