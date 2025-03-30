// src/components/AvatarDropdown.jsx
import React from "react";

function AvatarDropdown({ user, handleLogout, toggleDarkMode, isDarkMode, setActiveModule }) {
  // Get the initial from first_name or last_name; fallback to "U"
  const getInitial = () => {
    if (user) {
      if (user.first_name && user.first_name.length > 0) {
        return user.first_name.charAt(0).toUpperCase();
      } else if (user.last_name && user.last_name.length > 0) {
        return user.last_name.charAt(0).toUpperCase();
      }
    }
    return "U";
  };

  return (
    <div className="relative inline-block text-left">
      <button className="inline-flex justify-center w-full rounded-full border border-gray-300 shadow-sm p-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">
        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
          <span className="font-bold text-gray-700">{getInitial()}</span>
        </div>
      </button>
      {/* Dropdown menu can be added here if needed */}
    </div>
  );
}

export default AvatarDropdown;
