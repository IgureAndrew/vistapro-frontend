import React, { useState, useEffect } from "react";

function ProfileUpdate() {
  const [profileData, setProfileData] = useState({
    email: "",
    phone: "",
    gender: "",
    newPassword: "",
  });

  const [profileImageFile, setProfileImageFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  // Retrieve token from localStorage
  const token = localStorage.getItem("token");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setProfileImageFile(file);
    if (file) {
      // Create a local preview URL for the uploaded image
      const previewURL = URL.createObjectURL(file);
      setAvatarPreview(previewURL);
    } else {
      setAvatarPreview("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    // Only add fields if they have values
    if (profileData.email) formData.append("email", profileData.email);
    if (profileData.phone) formData.append("phone", profileData.phone);
    if (profileData.gender) formData.append("gender", profileData.gender);
    if (profileData.newPassword) formData.append("newPassword", profileData.newPassword);
    if (profileImageFile) formData.append("profileImage", profileImageFile);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/master-admin/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          // Do not set Content-Type when sending FormData
        },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        // Optionally, update the locally stored user object with the updated profile image URL
        const updatedUser = { ...JSON.parse(localStorage.getItem("user")), profile_image: data.profile_image };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        // You can use a Tailwind toast library here to show a notification instead of alert()
        alert("Profile updated successfully!");
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
            <label className="cursor-pointer text-blue-600 underline">
              Change
              <input
                type="file"
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
