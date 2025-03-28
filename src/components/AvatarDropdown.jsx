// src/components/AvatarDropdown.jsx
import React, { useState } from "react";
import {
  Home,
  Menu as MenuIcon,
  LogOut,
  User,
  Sun,
  Moon,
  MessageSquarePlus,
} from "lucide-react";

function AvatarDropdown({ user, handleLogout, toggleDarkMode, isDarkMode, setActiveModule }) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="relative">
      {/* Avatar Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="focus:outline-none"
      >
        {user && user.profile_image ? (
          <img
            src={user.profile_image}
            alt="Profile"
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
            {user ? user.name.charAt(0).toUpperCase() : "M"}
          </div>
        )}
      </button>

      {/* Dropdown Panel */}
      {showDropdown && (
        <div
          className={`absolute right-0 mt-2 w-64 rounded shadow-lg z-10 transition-colors duration-300 ${
            isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
          }`}
        >
          {/* Top section: heading + user info */}
          <div className="p-4 border-b" style={{ borderColor: isDarkMode ? "#4B5563" : "#E5E7EB" }}>
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              My Account
            </p>
            <p className={`font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              {user?.name || "Master Admin"}
            </p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>

          {/* Menu items */}
          <ul className="p-2 text-sm">
            <li
              className="flex items-center gap-2 py-2 px-3 rounded hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                setActiveModule("overview");
                setShowDropdown(false);
              }}
            >
              <Home size={16} className={isDarkMode ? "text-white" : "text-gray-800"} />
              <span className={isDarkMode ? "text-white" : "text-gray-800"}>Dashboard</span>
            </li>
            <li
              className="flex items-center gap-2 py-2 px-3 rounded hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                setActiveModule("profile");
                setShowDropdown(false);
              }}
            >
              <User size={16} className={isDarkMode ? "text-white" : "text-gray-800"} />
              <span className={isDarkMode ? "text-white" : "text-gray-800"}>Account Settings</span>
            </li>
            <li
              className="flex items-center gap-2 py-2 px-3 rounded hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                console.log("Command Menu clicked");
                setShowDropdown(false);
              }}
            >
              <MenuIcon size={16} className={isDarkMode ? "text-white" : "text-gray-800"} />
              <span className={isDarkMode ? "text-white" : "text-gray-800"}>Command Menu</span>
            </li>
            <li
              className="flex items-center gap-2 py-2 px-3 rounded hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                console.log("Feedback clicked");
                setShowDropdown(false);
              }}
            >
              <MessageSquarePlus size={16} className={isDarkMode ? "text-white" : "text-gray-800"} />
              <span className={isDarkMode ? "text-white" : "text-gray-800"}>Feedback</span>
            </li>
            <hr className="my-2" />
            <li
              className="flex items-center gap-2 py-2 px-3 rounded hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                toggleDarkMode();
                setShowDropdown(false);
              }}
            >
              {isDarkMode ? (
                <Moon size={16} className="text-white" />
              ) : (
                <Sun size={16} className="text-gray-800" />
              )}
              <span className={isDarkMode ? "text-white" : "text-gray-800"}>Toggle Theme</span>
            </li>
            <li
              className="flex items-center gap-2 py-2 px-3 rounded hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                handleLogout();
                setShowDropdown(false);
              }}
            >
              <LogOut size={16} className={isDarkMode ? "text-white" : "text-gray-800"} />
              <span className={isDarkMode ? "text-white" : "text-gray-800"}>Logout</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default AvatarDropdown;
