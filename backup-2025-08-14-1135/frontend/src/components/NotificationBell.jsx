// src/components/NotificationBell.jsx
import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import api from "../api";
import { io } from 'socket.io-client';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,  setUnreadCount]    = useState(0);
  const [open,         setOpen]           = useState(false);

  useEffect(() => {
    // 1) Fetch initial list + count
    api.get("/notifications")
      .then(({ data }) => {
        setNotifications(data.notifications);
        setUnreadCount(data.unread);
      })
      .catch(console.error);

    // 2) Real‑time via socket.io
    const token = localStorage.getItem('token');
    const socket = io(import.meta.env.VITE_API_URL, {
      transports: ['websocket','polling'],
      auth: { token }
    });

    // register to your unique room
    socket.on('connect', () => {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      if (u.unique_id) socket.emit('register', u.unique_id);
    });

    // update badge when server emits new count
    socket.on('notification', ({ count }) => {
      setUnreadCount(count);
    });

    // push brand‑new notifications into the list
    socket.on('newNotification', (note) => {
      setNotifications(prev => [note, ...prev]);
      setUnreadCount(c => c + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // mark a single notification as read
  const markRead = (id) => {
    api.patch(`/notifications/${id}/read`)
      .then(() => {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, is_read: true } : n)
        );
        setUnreadCount(c => Math.max(0, c - 1));
      })
      .catch(console.error);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2"
      >
        <Bell size={20}/>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded">
          <h4 className="px-4 py-2 border-b font-semibold">Notifications</h4>
          <ul className="max-h-60 overflow-y-auto">
            {notifications.map(n => (
              <li
                key={n.id}
                className={`px-4 py-2 cursor-pointer ${n.is_read ? 'text-gray-500' : 'font-semibold'}`}
                onClick={() => !n.is_read && markRead(n.id)}
              >
                <div>{n.message}</div>
                <small className="text-xs text-gray-400">
                  {new Date(n.created_at).toLocaleString()}
                </small>
              </li>
            ))}
            {notifications.length === 0 && (
              <li className="p-4 text-gray-500">No notifications</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
