// src/components/NotificationBell.jsx
import React, { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { io } from "socket.io-client";

// Option 1: Use the environment variable
// const socket = io(import.meta.env.VITE_API_URL, { transports: ["websocket"] });

// Option 2: Use a direct URL string:
const socket = io("https://vistapro-backend.onrender.com", { transports: ["websocket"] });

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Listen for notifications emitted by the server
    socket.on("notification", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    // Clean up the listener on unmount
    return () => {
      socket.off("notification");
    };
  }, []);

  return (
    <button className="relative p-2 rounded hover:bg-gray-100">
      <Bell size={18} className="text-black" />
      {notifications.length > 0 && (
        <span className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 rounded-full">
          {notifications.length}
        </span>
      )}
    </button>
  );
}

export default NotificationBell;
