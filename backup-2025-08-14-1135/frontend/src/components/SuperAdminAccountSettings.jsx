// src/components/SuperAdminAccountSettings.jsx
import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import api from "../api";               // your axios instance, baseURL="/api"
import { useNavigate } from "react-router-dom";

export default function SuperAdminAccountSettings() {
  const [loading, setLoading] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // individual fields
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail]             = useState("");
  const [phone, setPhone]             = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // visibility toggles
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // fetch SuperAdmin’s current account
  const fetchAccount = async () => {
    try {
      const res = await api.get("/super-admin/account", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { displayName, email, phone, profile_image } = res.data.account || {};
      setDisplayName(displayName || "");
      setEmail(email || "");
      setPhone(phone || "");
      if (profile_image) setAvatarPreview(profile_image);
    } catch (err) {
      console.error("Failed to load account:", err);
      alert("Could not load account settings.");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccount();
  }, []);

  // upload new avatar as soon as selected
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    const form = new FormData();
    form.append("profileImage", file);
    try {
      await api.patch("/super-admin/account", form, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      alert("Avatar updated.");
      fetchAccount();
    } catch (err) {
      console.error(err);
      alert("Failed to update avatar.");
    }
  };

  // generic updater for single fields (and optional extra form entries)
  const updateField = async (key, value, extras = {}) => {
    const form = new FormData();
    form.append(key, value);
    Object.entries(extras).forEach(([k, v]) => form.append(k, v));
    try {
      await api.patch("/super-admin/account", form, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      alert(`${key} updated.`);
      fetchAccount();
    } catch (err) {
      console.error(err);
      alert(`Failed to update ${key}.`);
    }
  };

  const handleDisplayNameSave = () => {
    if (!displayName.trim()) return alert("Name cannot be empty.");
    updateField("displayName", displayName);
  };
  const handleEmailSave = () => {
    if (!email.trim()) return alert("Email cannot be empty.");
    updateField("email", email);
  };
  const handlePhoneSave = () => {
    if (!phone.trim()) return alert("Phone cannot be empty.");
    updateField("phone", phone);
  };
  const handlePasswordSave = () => {
    if (!oldPassword || !newPassword) {
      return alert("Both old and new password are required.");
    }
    updateField("newPassword", newPassword, { oldPassword });
    setOldPassword("");
    setNewPassword("");
  };

  if (loading) return <p className="p-4">Loading account…</p>;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded shadow p-8 space-y-6">
        <h2 className="text-2xl font-bold">Super Admin Account</h2>

        {/* Avatar */}
        <section>
          <h3 className="font-semibold mb-2">Avatar</h3>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  No Avatar
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="cursor-pointer"
            />
          </div>
        </section>

        {/* Display Name */}
        <section>
          <h3 className="font-semibold mb-2">Display Name</h3>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
          />
          <button
            onClick={handleDisplayNameSave}
            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Save Name
          </button>
        </section>

        {/* Email */}
        <section>
          <h3 className="font-semibold mb-2">Email</h3>
          <input
            type="email"
            className="w-full border rounded px-3 py-2"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <button
            onClick={handleEmailSave}
            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Save Email
          </button>
        </section>

        {/* Phone */}
        <section>
          <h3 className="font-semibold mb-2">Phone</h3>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
          <button
            onClick={handlePhoneSave}
            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Save Phone
          </button>
        </section>

        {/* Change Password */}
        <section>
          <h3 className="font-semibold mb-2">Change Password</h3>
          <div className="relative mb-4">
            <input
              type={showOldPassword ? "text" : "password"}
              className="w-full border rounded px-3 py-2"
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              placeholder="Old Password"
            />
            <button
              type="button"
              onClick={() => setShowOldPassword(v => !v)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showOldPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
          <div className="relative mb-4">
            <input
              type={showNewPassword ? "text" : "password"}
              className="w-full border rounded px-3 py-2"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="New Password"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(v => !v)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showNewPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
          <button
            onClick={handlePasswordSave}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Change Password
          </button>
        </section>
      </div>
    </div>
  );
}
