import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import api from '../api';              // your axios instance
import { io } from 'socket.io-client';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]   = useState(0);
  const [open, setOpen]                 = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    // 1) Fetch initial notifications + count
    api.get('/notifications', { headers:{ Authorization:`Bearer ${token}` }})
      .then(({ data }) => {
        setNotifications(data.notifications);
        setUnreadCount(data.unread);
      })
      .catch(console.error);

    // 2) Socket.io for real‑time
    const socket = io('https://vistapro-backend.onrender.com', {
      transports: ['websocket','polling'],
      auth: { token }
    });
    socket.on('connect', () => {
      socket.emit('register', /* your unique_id */ localStorage.getItem('user')?.unique_id );
    });
    socket.on('newNotification', (note) => {
      setNotifications((prev) => [note, ...prev]);
      setUnreadCount((c) => c + 1);
    });
    return () => socket.disconnect();
  }, []);

  // mark one as read
  const markRead = (id) => {
    const token = localStorage.getItem('token');
    api.patch(`/notifications/${id}/read`, {}, { headers:{ Authorization:`Bearer ${token}` }})
      .then(() => {
        setNotifications((prev) =>
          prev.map(n => n.id===id ? {...n,is_read:true} : n)
        );
        setUnreadCount((c) => c - 1);
      })
      .catch(console.error);
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded">
          <h4 className="px-4 py-2 border-b">Notifications</h4>
          <ul className="max-h-60 overflow-y-auto">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`px-4 py-2 cursor-pointer ${
                  n.is_read ? 'text-gray-500' : 'font-semibold'
                }`}
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
