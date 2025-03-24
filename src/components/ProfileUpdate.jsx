import React, { useState } from "react";

function ProfileUpdate() {
  // State to store text inputs
  const [profileData, setProfileData] = useState({
    email: "",
    phone: "",
    gender: "",
    newPassword: "",
  });

  // State to store file upload
  const [profileImage, setProfileImage] = useState(null);

  // Handler for text input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prevData) => ({ ...prevData, [name]: value }));
  };

  // Handler for file input changes
  const handleFileChange = (e) => {
    setProfileImage(e.target.files[0]);
  };

  // Handler for form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Create a FormData object to handle both text and file data
    const formData = new FormData();
    formData.append("email", profileData.email);
    formData.append("phone", profileData.phone);
    formData.append("gender", profileData.gender);
    formData.append("newPassword", profileData.newPassword);
    if (profileImage) {
      formData.append("profileImage", profileImage);
    }

    try {
      const res = await fetch("http://localhost:5000/api/master-admin/profile", {
        method: "PUT",
        // Do not manually set Content-Type; let the browser handle it for FormData.
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        alert("Profile updated successfully!");
        // Optionally update localStorage or state with updated user data here.
      } else {
        alert(data.message || "Profile update failed.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Update Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
            value={profileData.email}
            onChange={handleInputChange}
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Phone
          </label>
          <input
            type="text"
            name="phone"
            placeholder="Phone"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
            value={profileData.phone}
            onChange={handleInputChange}
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Gender
          </label>
          <input
            type="text"
            name="gender"
            placeholder="Gender"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
            value={profileData.gender}
            onChange={handleInputChange}
          />
        </div>

        {/* New Password */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            New Password
          </label>
          <input
            type="password"
            name="newPassword"
            placeholder="New Password"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
            value={profileData.newPassword}
            onChange={handleInputChange}
          />
        </div>

        {/* Profile Image */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Profile Image
          </label>
          <input
            type="file"
            name="profileImage"
            onChange={handleFileChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="mt-4 w-full bg-black text-yellow-400 font-bold py-2 rounded-lg hover:bg-gray-900 transition-colors"
        >
          Update Profile
        </button>
      </form>
    </div>
  );
}

export default ProfileUpdate;
