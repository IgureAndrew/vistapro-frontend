// src/components/ProfileUpdate.jsx
import React, { useState, useEffect } from "react";

function ProfileUpdate() {
  // State for storing profile form data.
  const [profileData, setProfileData] = useState({
    email: "",
    phone: "",
    gender: "",
    newPassword: "",
  });
  // State for storing the selected profile image file.
  const [profileImageFile, setProfileImageFile] = useState(null);
  // State for generating a preview URL for the selected avatar image.
  const [avatarPreview, setAvatarPreview] = useState("");
  // State for storing the current user profile loaded from storage.
  const [currentProfile, setCurrentProfile] = useState(null);

  // Retrieve the token and API URL from localStorage and environment.
  const token = localStorage.getItem("token");
  const apiUrl = import.meta.env.VITE_API_URL;

  // On component mount, load current user data from localStorage.
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setCurrentProfile(user);
      setProfileData({
        email: user.email || "",
        phone: user.phone || "",
        gender: user.gender || "",
        newPassword: "",
      });
      // Build the avatar URL using your API URL and the stored profile image path.
      if (user.profile_image) {
        setAvatarPreview(`${apiUrl}/uploads/${user.profile_image}`);
      }
    }
  }, [apiUrl]);

  // Handle changes to text inputs.
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prevData) => ({ ...prevData, [name]: value }));
  };

  // Handle file selection for the profile image.
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setProfileImageFile(file);
    if (file) {
      // Create a local preview URL for the selected file.
      const previewURL = URL.createObjectURL(file);
      setAvatarPreview(previewURL);
    } else {
      setAvatarPreview("");
    }
  };

  // Handle form submission.
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    if (profileData.email) formData.append("email", profileData.email);
    if (profileData.phone) formData.append("phone", profileData.phone);
    if (profileData.gender) formData.append("gender", profileData.gender);
    if (profileData.newPassword)
      formData.append("newPassword", profileData.newPassword);
    if (profileImageFile) formData.append("profileImage", profileImageFile);
  
    try {
      // Send PUT request to update profile.
      const res = await fetch(`${apiUrl}/api/master-admin/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        // After successful update, fetch the fresh profile data.
        const freshRes = await fetch(`${apiUrl}/api/master-admin/profile`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const freshData = await freshRes.json();
        if (freshRes.ok) {
          // Update localStorage and component state with fresh data.
          localStorage.setItem("user", JSON.stringify(freshData.user));
          setCurrentProfile(freshData.user);
          setProfileData({
            email: freshData.user.email,
            phone: freshData.user.phone,
            gender: freshData.user.gender,
            newPassword: "",
          });
          if (freshData.user.profile_image) {
            setAvatarPreview(`${apiUrl}/uploads/${freshData.user.profile_image}`);
          }
        }
        alert("Profile updated successfully! Your new password will be used for login.");
      } else {
        alert(data.message || "Profile update failed.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile");
    }
  };
  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Account Settings</h2>

      {/* Display current profile details */}
      {currentProfile && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Current Profile</h3>
          <div className="flex items-center gap-4">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Current Avatar"
                className="w-14 h-14 rounded-full object-cover"
              />
            ) : (
              <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                No Avatar
              </div>
            )}
            <div>
              <p className="text-gray-700">Email: {currentProfile.email}</p>
              <p className="text-gray-700">Phone: {currentProfile.phone || "Not set"}</p>
              <p className="text-gray-700">Gender: {currentProfile.gender || "Not set"}</p>
              <p className="text-gray-500 text-sm">
                If a new password is provided, it will replace your current one.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Profile update form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Avatar Section */}
        <section>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Avatar</h3>
          <p className="text-sm text-gray-500 mb-3">
            Click to upload a custom avatar.
          </p>
          <div className="flex items-center gap-4">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar Preview"
                className="w-14 h-14 rounded-full object-cover"
              />
            ) : (
              <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                No Avatar
              </div>
            )}
            {/* File input: note the name attribute matches the Multer field */}
            <label className="cursor-pointer text-blue-600 underline">
              Change
              <input
                type="file"
                name="profileImage"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>
        </section>

        {/* Email Section */}
        <section>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Email</h3>
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
            value={profileData.email}
            onChange={handleInputChange}
          />
        </section>

        {/* Phone Section */}
        <section>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Phone</h3>
          <input
            type="text"
            name="phone"
            placeholder="Phone"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
            value={profileData.phone}
            onChange={handleInputChange}
          />
        </section>

        {/* Gender Section */}
        <section>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Gender</h3>
          <input
            type="text"
            name="gender"
            placeholder="Gender"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
            value={profileData.gender}
            onChange={handleInputChange}
          />
        </section>

        {/* New Password Section */}
        <section>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">New Password</h3>
          <input
            type="password"
            name="newPassword"
            placeholder="New Password"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
            value={profileData.newPassword}
            onChange={handleInputChange}
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter a new password to change your current one.
          </p>
        </section>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            className="mt-4 w-full bg-black text-yellow-400 font-bold py-2 rounded-lg hover:bg-gray-900 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProfileUpdate;
