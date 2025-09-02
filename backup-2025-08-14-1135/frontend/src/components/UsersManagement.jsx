// src/components/UsersManagement.jsx
import React, { useState, useEffect } from "react";
import Modal from "../components/Modal";
import { UserIcon } from "@heroicons/react/24/outline";

// List of Nigerian states for location selection.
const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue",
  "Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","Gombe",
  "Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos",
  "Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto",
  "Taraba","Yobe","Zamfara","FCT"
];

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 20;

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [addFormData, setAddFormData] = useState({
    role: "", first_name: "", last_name: "", gender: "",
    email: "", password: "",
    bank_name: "", account_number: "", account_name: "",
    location: "",
    registered_business_name: "",
    registered_business_address: "",
    business_account_name: "",
    business_account_number: "",
    registrationCertificate: null,
  });

  const [editFormData, setEditFormData] = useState({
    role: "", first_name: "", last_name: "", gender: "",
    email: "", password: "",
    bank_name: "", account_number: "", account_name: "",
    location: "",
    registered_business_name: "",
    registered_business_address: "",
    business_account_name: "",
    business_account_number: "",
    registrationCertificate: null,
  });

  const [showPassword, setShowPassword] = useState(false);
  const toggleShowPassword = () => setShowPassword(p => !p);

  const baseUrl = "https://vistapro-backend.onrender.com/api/master-admin/users";
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch(baseUrl, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) setUsers(data.users);
      else setError(data.message || "Failed to fetch users");
    } catch (err) {
      console.error(err);
      setError("Error fetching users");
    }
  }

  function openAddUserModal() {
    setAddFormData({
      role: "", first_name: "", last_name: "", gender: "",
      email: "", password: "",
      bank_name: "", account_number: "", account_name: "",
      location: "",
      registered_business_name: "",
      registered_business_address: "",
      business_account_name: "",
      business_account_number: "",
      registrationCertificate: null,
    });
    setShowAddUserModal(true);
  }
  const closeAddUserModal = () => setShowAddUserModal(false);

  function handleAddChange(e) {
    const { name, value, type, files } = e.target;
    setAddFormData(f => ({
      ...f,
      [name]: type === "file" ? files[0] : value
    }));
  }

  async function handleAddUserSubmit(e) {
    e.preventDefault();
    if (!token) return alert("No token provided. Please log in again.");
    try {
      let payload, headers = { Authorization: `Bearer ${token}` };
      if (addFormData.role === "Dealer" && addFormData.registrationCertificate) {
        payload = new FormData();
        Object.entries(addFormData).forEach(([k, v]) => payload.append(k, v));
      } else {
        payload = JSON.stringify(addFormData);
        headers["Content-Type"] = "application/json";
      }
      const res = await fetch(baseUrl, {
        method: "POST",
        headers,
        body: payload
      });
      const data = await res.json();
      if (res.ok) {
        alert("User added!");
        fetchUsers();
        closeAddUserModal();
      } else {
        alert(data.message || "Failed to add user");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding user");
    }
  }

  function openEditUserModal(user) {
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
  }
  const closeEditUserModal = () => {
    setShowEditUserModal(false);
    setSelectedUser(null);
  };

  function handleEditChange(e) {
    const { name, value, type, files } = e.target;
    setEditFormData(f => ({
      ...f,
      [name]: type === "file" ? files[0] : value
    }));
  }

  async function handleEditUserSubmit(e) {
    e.preventDefault();
    if (!selectedUser?.id || !token)
      return alert("Select a user and ensure you’re logged in");
    try {
      const res = await fetch(`${baseUrl}/${selectedUser.id}`, {
        method: "PUT",   // match your router.put()
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editFormData)
      });
      const data = await res.json();
      if (res.ok) {
        alert("User updated!");
        fetchUsers();
        closeEditUserModal();
      } else {
        alert(data.message || "Failed to update");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating user");
    }
  }

  async function patchUserLock(id, lock) {
    try {
      const res = await fetch(`${baseUrl}/${id}/${lock ? "lock" : "unlock"}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        alert(lock ? "Locked" : "Unlocked");
        fetchUsers();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || "Failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error locking/unlocking user");
    }
  }

   async function handleDeleteUser(id) {
    if (!confirm("Delete this user?")) return;
    const res = await fetch(`${baseUrl}/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type":"application/json",
        Authorization:`Bearer ${token}`
      }
    });
    if (res.ok) {
      alert("Deleted");
      fetchUsers();
    } else {
      const data = await res.json().catch(()=>({}));
      alert(data.message || "Failed to delete");
    }
  }

  // search & paginate
  const filtered = users.filter(u => {
    const term = searchTerm.toLowerCase();
    const name = u.role === "Dealer"
      ? u.business_name || `${u.first_name} ${u.last_name}`
      : `${u.first_name} ${u.last_name}`;
    return (
      name.toLowerCase().includes(term) ||
      (u.email || "").toLowerCase().includes(term) ||
      u.id.toString().includes(term) ||
      (u.role || "").toLowerCase().includes(term)
    );
  });
  const totalPages = Math.ceil(filtered.length / usersPerPage);
  const pageUsers = filtered.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Users</h1>
        <button
          onClick={openAddUserModal}
          className="bg-black text-[#FFD700] font-bold px-4 py-2 rounded"
        >
          Add User
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by name, email, ID or role"
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="w-full max-w-sm px-4 py-2 border rounded font-bold"
      />
      {error && <p className="text-red-600">{error}</p>}

      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {["ID","Name","Role","Location","Status","Actions"].map(h => (
                <th
                  key={h}
                  className="px-6 py-3 text-xs font-bold text-gray-500 uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {pageUsers.length > 0 ? pageUsers.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium">{u.id}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                      <UserIcon className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <div className="font-bold">
                        {u.role === "Dealer"
                          ? u.business_name || `${u.first_name} ${u.last_name}`
                          : `${u.first_name} ${u.last_name}`}
                      </div>
                      <div className="text-sm text-gray-500">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">{u.role}</td>
                <td className="px-6 py-4 text-sm">{u.location}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    u.locked ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                  }`}>
                    {u.locked ? "Locked" : "Active"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button
                    onClick={() => openEditUserModal(u)}
                    className="bg-black text-[#FFD700] px-3 py-1 rounded font-bold"
                  >
                    Edit
                  </button>
                  {u.locked ? (
                    <button
                      onClick={() => patchUserLock(u.id, false)}
                      className="bg-black text-[#FFD700] px-3 py-1 rounded font-bold"
                    >
                      Unlock
                    </button>
                  ) : (
                    <button
                      onClick={() => patchUserLock(u.id, true)}
                      className="bg-black text-[#FFD700] px-3 py-1 rounded font-bold"
                    >
                      Lock
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteUser(u.id)}
                    className="bg-black text-[#FFD700] px-3 py-1 rounded font-bold"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center space-x-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`px-3 py-1 rounded border font-bold ${
              currentPage === page
                ? "bg-black text-[#FFD700] border-black"
                : "bg-white text-black border-gray-300"
            }`}
          >
            {page}
          </button>
        ))}
      </div>

      {/* ADD USER MODAL */}
      {showAddUserModal && (
        <Modal isOpen onClose={closeAddUserModal}>
          <div className="p-6 bg-white rounded shadow-lg max-w-md mx-auto max-h-[70vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Add New User</h2>
            <form onSubmit={handleAddUserSubmit} className="space-y-4">
              {/* Role */}
              <div>
                <label className="font-bold">Role</label>
                <select
                  name="role"
                  value={addFormData.role}
                  onChange={handleAddChange}
                  className="w-full border px-3 py-2 rounded"
                  required
                >
                  <option value="">Select Role</option>
                  <option value="SuperAdmin">Super Admin</option>
                  <option value="Admin">Admin</option>
                  <option value="Marketer">Marketer</option>
                  <option value="Dealer">Dealer</option>
                </select>
              </div>

              {/* First & Last Name */}
              <div>
                <label className="font-bold">First Name</label>
                <input
                  name="first_name"
                  value={addFormData.first_name}
                  onChange={handleAddChange}
                  className="w-full border px-3 py-2 rounded"
                  required
                />
              </div>
              <div>
                <label className="font-bold">Last Name</label>
                <input
                  name="last_name"
                  value={addFormData.last_name}
                  onChange={handleAddChange}
                  className="w-full border px-3 py-2 rounded"
                  required
                />
              </div>

              {/* Gender */}
              <div>
                <label className="font-bold">Gender</label>
                <select
                  name="gender"
                  value={addFormData.gender}
                  onChange={handleAddChange}
                  className="w-full border px-3 py-2 rounded"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              {/* Email & Password */}
              <div>
                <label className="font-bold">Email</label>
                <input
                  name="email"
                  type="email"
                  value={addFormData.email}
                  onChange={handleAddChange}
                  className="w-full border px-3 py-2 rounded"
                  required
                />
              </div>
              <div className="relative">
                <label className="font-bold">Password</label>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={addFormData.password}
                  onChange={handleAddChange}
                  className="w-full border px-3 py-2 rounded"
                  placeholder="min 12 chars, include number & special"
                  required
                />
                <button
                  type="button"
                  onClick={toggleShowPassword}
                  className="absolute inset-y-0 right-0 pr-3 text-sm text-gray-600"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {/* Bank fields for non-Dealers */}
              {addFormData.role !== "Dealer" && (
                <>
                  <div>
                    <label className="font-bold">Bank Name</label>
                    <input
                      name="bank_name"
                      value={addFormData.bank_name}
                      onChange={handleAddChange}
                      className="w-full border px-3 py-2 rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold">Account Number</label>
                    <input
                      name="account_number"
                      value={addFormData.account_number}
                      onChange={handleAddChange}
                      className="w-full border px-3 py-2 rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold">Account Name</label>
                    <input
                      name="account_name"
                      value={addFormData.account_name}
                      onChange={handleAddChange}
                      className="w-full border px-3 py-2 rounded"
                      required
                    />
                  </div>
                </>
              )}

              {/* Location */}
              <div>
                <label className="font-bold">Location</label>
                <select
                  name="location"
                  value={addFormData.location}
                  onChange={handleAddChange}
                  className="w-full border px-3 py-2 rounded"
                  required
                >
                  <option value="">Select State</option>
                  {NIGERIAN_STATES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Dealer-specific */}
              {addFormData.role === "Dealer" && (
                <>
                  <div>
                    <label className="font-bold">Registered Business Name</label>
                    <input
                      name="registered_business_name"
                      value={addFormData.registered_business_name}
                      onChange={handleAddChange}
                      className="w-full border px-3 py-2 rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold">Registered Business Address</label>
                    <input
                      name="registered_business_address"
                      value={addFormData.registered_business_address}
                      onChange={handleAddChange}
                      className="w-full border px-3 py-2 rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold">Business Account Name</label>
                    <input
                      name="business_account_name"
                      value={addFormData.business_account_name}
                      onChange={handleAddChange}
                      className="w-full border px-3 py-2 rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold">Business Account Number</label>
                    <input
                      name="business_account_number"
                      value={addFormData.business_account_number}
                      onChange={handleAddChange}
                      className="w-full border px-3 py-2 rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold">Registration Certificate (PDF)</label>
                    <input
                      name="registrationCertificate"
                      type="file"
                      accept="application/pdf"
                      onChange={handleAddChange}
                      className="w-full border px-3 py-2 rounded"
                      required
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-4 pt-2">
                <button
                  type="button"
                  onClick={closeAddUserModal}
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded"
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
        <Modal isOpen onClose={closeEditUserModal}>
          <div className="p-6 bg-white rounded shadow-lg max-w-md mx-auto max-h-[70vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit User</h2>
            <form onSubmit={handleEditUserSubmit} className="space-y-4">
              {/* Role */}
              <div>
                <label className="font-bold">Role</label>
                <select
                  name="role"
                  value={editFormData.role}
                  onChange={handleEditChange}
                  className="w-full border px-3 py-2 rounded"
                >
                  <option value="SuperAdmin">Super Admin</option>
                  <option value="Admin">Admin</option>
                  <option value="Marketer">Marketer</option>
                  <option value="Dealer">Dealer</option>
                </select>
              </div>

              {/* First & Last Name */}
              <div>
                <label className="font-bold">First Name</label>
                <input
                  name="first_name"
                  value={editFormData.first_name}
                  onChange={handleEditChange}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div>
                <label className="font-bold">Last Name</label>
                <input
                  name="last_name"
                  value={editFormData.last_name}
                  onChange={handleEditChange}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="font-bold">Gender</label>
                <select
                  name="gender"
                  value={editFormData.gender}
                  onChange={handleEditChange}
                  className="w-full border px-3 py-2 rounded"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              {/* Email */}
              <div>
                <label className="font-bold">Email</label>
                <input
                  name="email"
                  type="email"
                  value={editFormData.email}
                  onChange={handleEditChange}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <label className="font-bold">Password</label>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={editFormData.password}
                  onChange={handleEditChange}
                  placeholder="Leave blank to keep current"
                  className="w-full border px-3 py-2 rounded"
                />
                <button
                  type="button"
                  onClick={toggleShowPassword}
                  className="absolute inset-y-0 right-0 pr-3 text-sm text-gray-600"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {/* Bank fields for non-Dealers */}
              {editFormData.role !== "Dealer" && (
                <>
                  <div>
                    <label className="font-bold">Bank Name</label>
                    <input
                      name="bank_name"
                      value={editFormData.bank_name}
                      onChange={handleEditChange}
                      className="w-full border px-3 py-2 rounded"
                    />
                  </div>
                  <div>
                    <label className="font-bold">Account Number</label>
                    <input
                      name="account_number"
                      value={editFormData.account_number}
                      onChange={handleEditChange}
                      className="w-full border px-3 py-2 rounded"
                    />
                  </div>
                  <div>
                    <label className="font-bold">Account Name</label>
                    <input
                      name="account_name"
                      value={editFormData.account_name}
                      onChange={handleEditChange}
                      className="w-full border px-3 py-2 rounded"
                    />
                  </div>
                </>
              )}

              {/* Location */}
              <div>
                <label className="font-bold">Location</label>
                <select
                  name="location"
                  value={editFormData.location}
                  onChange={handleEditChange}
                  className="w-full border px-3 py-2 rounded"
                >
                  <option value="">Select State</option>
                  {NIGERIAN_STATES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-4 pt-2">
                <button
                  type="button"
                  onClick={closeEditUserModal}
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded"
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
