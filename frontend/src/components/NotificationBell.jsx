// src/components/NotificationBell.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import api from "../api";
import { io } from 'socket.io-client';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,  setUnreadCount]    = useState(0);
  const [open,         setOpen]           = useState(false);
  const dropdownRef = useRef(null);

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

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell size={20}/>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1 min-w-[18px] h-[18px] flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white shadow-xl rounded-lg border border-gray-200 z-50">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-800">Notifications</h4>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {notifications.map(n => (
                  <li
                    key={n.id}
                    className={`px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                      n.is_read ? 'bg-white' : 'bg-blue-50 border-l-4 border-l-blue-500'
                    }`}
                    onClick={() => !n.is_read && markRead(n.id)}
                  >
                    <div className={`${n.is_read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                      {n.message}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <small className="text-xs text-gray-500">
                        {new Date(n.created_at).toLocaleString()}
                      </small>
                      {!n.is_read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center">
                <div className="text-gray-400 mb-2">
                  <Bell size={32} className="mx-auto" />
                </div>
                <p className="text-gray-500 text-sm">No notifications yet</p>
                <p className="text-gray-400 text-xs mt-1">You're all caught up!</p>
              </div>
            )}
          </div>
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <button 
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                onClick={() => {
                  // Mark all as read functionality could be added here
                  setOpen(false);
                }}
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
