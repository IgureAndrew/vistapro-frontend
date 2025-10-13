import React, { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { getAvatarUrl, getUserInitials } from "../utils/avatarUtils";

function AvatarDropdown({ user, handleLogout, toggleDarkMode, isDarkMode, setActiveModule }) {
  const [open, setOpen] = useState(false);

  // Get avatar URL from profile_image, fallback to initials
  const getAvatarSrc = () => {
    if (user?.profile_image) {
      return getAvatarUrl(user.profile_image);
    }
    return null;
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex justify-center w-full rounded-full border border-gray-300 dark:border-gray-600 shadow-sm p-2 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none"
      >
        <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center overflow-hidden">
          {getAvatarSrc() ? (
            <img 
              src={getAvatarSrc()} 
              alt="Profile" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <span 
            className="font-bold text-gray-700 dark:text-gray-200"
            style={{ display: getAvatarSrc() ? 'none' : 'flex' }}
          >
            {getUserInitials(user)}
          </span>
        </div>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-10">
          <ul>
            <li
              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-800 dark:text-gray-200"
              onClick={() => {
                setActiveModule("profile");
                setOpen(false);
              }}
            >
              Profile
            </li>
            <li
              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2 text-gray-800 dark:text-gray-200"
              onClick={() => {
                toggleDarkMode();
                setOpen(false);
              }}
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </li>
            <li
              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-800 dark:text-gray-200"
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
