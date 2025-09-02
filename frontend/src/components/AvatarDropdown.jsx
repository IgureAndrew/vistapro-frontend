import React, { useState } from "react";
import { Moon, Sun } from "lucide-react";

function AvatarDropdown({ user, handleLogout, toggleDarkMode, isDarkMode, setActiveModule }) {
  const [open, setOpen] = useState(false);

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
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex justify-center w-full rounded-full border border-gray-300 shadow-sm p-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
      >
        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
          <span className="font-bold text-gray-700">{getInitial()}</span>
        </div>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg z-10">
          <ul>
            <li
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                setActiveModule("profile");
                setOpen(false);
              }}
            >
              Profile
            </li>
            <li
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
              onClick={() => {
                toggleDarkMode();
                setOpen(false);
              }}
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </li>
            <li
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                handleLogout();
                setOpen(false);
              }}
            >
              Logout
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default AvatarDropdown;
