import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react"; // Import icons for toggling password visibility
import api from "../api"; // Your custom axios instance
import { useNavigate } from "react-router-dom";

function MarketerAccountSettings() {
  const [loading, setLoading] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState(null);
  
  // Separate state for each field.
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // States to control password visibility.
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Fetch current account settings.
  const fetchAccountSettings = async () => {
    try {
      const res = await api.get("/api/marketer/account-settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.settings) {
        const { displayName, email, phone, profile_image } = res.data.settings;
        setDisplayName(displayName);
        setEmail(email);
        setPhone(phone);
        if (profile_image) {
          setAvatarPreview(profile_image);
        } else {
          setAvatarPreview(null);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching account settings:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountSettings();
  }, []);

  // Handler for file input change to update avatar preview and auto-upload.
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
      const formData = new FormData();
      formData.append("avatar", file);
      try {
        const res = await api.patch("/api/marketer/account-settings", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        alert("Avatar updated successfully.");
        fetchAccountSettings();
      } catch (error) {
        console.error("Error updating avatar:", error);
        alert("Failed to update avatar.");
      }
    }
  };

  // Generic field updater for individual fields.
  const updateField = async (fieldName, fieldValue, extraFields = {}) => {
    const formData = new FormData();
    formData.append(fieldName, fieldValue);
    Object.keys(extraFields).forEach((key) => {
      formData.append(key, extraFields[key]);
    });
    try {
      const res = await api.patch("/api/marketer/account-settings", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      alert(`${fieldName} updated successfully.`);
      fetchAccountSettings();
    } catch (error) {
      console.error(`Error updating ${fieldName}:`, error);
      alert(`Failed to update ${fieldName}.`);
    }
  };

  const handleDisplayNameSave = () => {
    if (!displayName) {
      alert("Display name cannot be empty.");
      return;
    }
    updateField("displayName", displayName);
  };

  const handleEmailSave = () => {
    if (!email) {
      alert("Email cannot be empty.");
      return;
    }
    updateField("email", email);
  };

  const handlePhoneSave = () => {
    if (!phone) {
      alert("Phone number cannot be empty.");
      return;
    }
    updateField("phone", phone);
  };

  const handlePasswordSave = () => {
    if (!oldPassword || !newPassword) {
      alert("Please provide both your old and new password.");
      return;
    }
    updateField("newPassword", newPassword, { oldPassword });
    setOldPassword("");
    setNewPassword("");
  };

  if (loading) {
    return <p className="p-4">Loading account settings...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded shadow p-8">
        <h2 className="text-2xl font-bold mb-6">Account Settings</h2>

        <form className="space-y-6" encType="multipart/form-data">
          {/* Avatar Section */}
          <section className="mb-6">
            <h3 className="font-bold text-lg mb-2">Avatar</h3>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-gray-500">
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

          {/* Display Name Section */}
          <section className="mb-6">
            <h3 className="font-bold text-lg mb-2">Display Name</h3>
            <input
              type="text"
              className="border border-gray-300 rounded px-3 py-2 w-full"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
            />
            <button
              type="button"
              onClick={handleDisplayNameSave}
              className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Save Display Name
            </button>
          </section>

          {/* Email Section */}
          <section className="mb-6">
            <h3 className="font-bold text-lg mb-2">Email</h3>
            <input
              type="email"
              className="border border-gray-300 rounded px-3 py-2 w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <button
              type="button"
              onClick={handleEmailSave}
              className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Save Email
            </button>
          </section>

          {/* Phone Section */}
          <section className="mb-6">
            <h3 className="font-bold text-lg mb-2">Phone Number</h3>
            <input
              type="text"
              className="border border-gray-300 rounded px-3 py-2 w-full"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+234 704-916-9152"
            />
            <button
              type="button"
              onClick={handlePhoneSave}
              className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Save Phone Number
            </button>
          </section>

          {/* Password Section */}
          <section className="mb-6">
            <h3 className="font-bold text-lg mb-2">Change Password</h3>
            <div className="relative mb-4">
              <input
                type={showOldPassword ? "text" : "password"}
                className="border border-gray-300 rounded px-3 py-2 w-full"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Old Password"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showOldPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className="relative mb-4">
              <input
                type={showNewPassword ? "text" : "password"}
                className="border border-gray-300 rounded px-3 py-2 w-full"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <button
              type="button"
              onClick={handlePasswordSave}
              className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Change Password
            </button>
          </section>
        </form>
      </div>
    </div>
  );
}

export default MarketerAccountSettings;
