// src/components/NotificationBell.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, Clock, AlertCircle, Package, ShoppingCart, Wallet, User, Settings } from 'lucide-react';
import api from "../api";
import { io } from 'socket.io-client';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,  setUnreadCount]    = useState(0);
  const [open,         setOpen]           = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dropdownRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // 1) Fetch initial list + count
    api.get("/notifications")
      .then(({ data }) => {
        console.log('NotificationBell: Received data:', data);
        setNotifications(data.notifications);
        setUnreadCount(data.unread);
        console.log('NotificationBell: Set unread count to:', data.unread);
      })
      .catch(error => {
        console.error('NotificationBell: Error fetching notifications:', error);
      });

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

  // mark all notifications as read
  const markAllRead = () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;

    Promise.all(unreadIds.map(id => api.patch(`/notifications/${id}/read`)))
      .then(() => {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      })
      .catch(console.error);
  };

  // Get notification icon based on message content
  const getNotificationIcon = (message) => {
    const msg = message.toLowerCase();
    if (msg.includes('stock') || msg.includes('pickup')) return Package;
    if (msg.includes('order') || msg.includes('sold')) return ShoppingCart;
    if (msg.includes('wallet') || msg.includes('withdrawal')) return Wallet;
    if (msg.includes('verification') || msg.includes('approved')) return User;
    if (msg.includes('rejected') || msg.includes('error')) return AlertCircle;
    return Bell;
  };

  // Get notification color based on message content
  const getNotificationColor = (message, isRead) => {
    const msg = message.toLowerCase();
    if (isRead) return 'text-gray-500';
    if (msg.includes('approved') || msg.includes('confirmed')) return 'text-green-600';
    if (msg.includes('rejected') || msg.includes('error')) return 'text-red-600';
    if (msg.includes('pending') || msg.includes('waiting')) return 'text-yellow-600';
    return 'text-blue-600';
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  // Touch handlers for swipe actions
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e, notificationId) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const swipeDistance = touchStartX.current - touchEndX.current;
    
    // Swipe left to mark as read (minimum 50px swipe)
    if (swipeDistance > 50 && !notifications.find(n => n.id === notificationId)?.is_read) {
      markRead(notificationId);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        <Bell size={20}/>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1 min-w-[18px] h-[18px] flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Mobile Overlay */}
          {isMobile && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setOpen(false)}
            />
          )}
          
          {/* Notification Panel */}
          <div className={`
            ${isMobile 
              ? 'fixed inset-x-4 top-20 bottom-20 max-h-[calc(100vh-10rem)]' 
              : 'absolute right-0 mt-2 w-96 max-h-80'
            } 
            bg-white dark:bg-gray-800 shadow-xl rounded-lg border border-gray-200 dark:border-gray-700 z-50
            flex flex-col
          `}>
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-t-lg flex-shrink-0">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-lg">
                  Notifications
                </h4>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                  {isMobile && (
                    <button
                      onClick={() => setOpen(false)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {notifications.map(n => {
                    const IconComponent = getNotificationIcon(n.message);
                    const colorClass = getNotificationColor(n.message, n.is_read);
                    
                    return (
                      <div
                        key={n.id}
                        className={`
                          px-4 py-3 cursor-pointer transition-all duration-200 
                          hover:bg-gray-50 dark:hover:bg-gray-700
                          ${n.is_read 
                            ? 'bg-white dark:bg-gray-800' 
                            : 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500'
                          }
                          ${isMobile ? 'py-4' : 'py-3'}
                        `}
                        onClick={() => !n.is_read && markRead(n.id)}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={(e) => handleTouchEnd(e, n.id)}
                      >
                        <div className="flex items-start space-x-3">
                          {/* Icon */}
                          <div className={`
                            p-2 rounded-full flex-shrink-0
                            ${n.is_read 
                              ? 'bg-gray-100 dark:bg-gray-700' 
                              : 'bg-blue-100 dark:bg-blue-900/30'
                            }
                          `}>
                            <IconComponent 
                              size={isMobile ? 18 : 16} 
                              className={colorClass}
                            />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <p className={`
                                text-sm leading-relaxed break-words
                                ${n.is_read 
                                  ? 'text-gray-600 dark:text-gray-400' 
                                  : 'text-gray-900 dark:text-gray-100 font-medium'
                                }
                                ${isMobile ? 'text-base' : 'text-sm'}
                              `}>
                                {n.message}
                              </p>
                              {!n.is_read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2 mt-1"></div>
                              )}
                            </div>
                            
                            {/* Time */}
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatTimeAgo(n.created_at)}
                              </span>
                              {isMobile && !n.is_read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markRead(n.id);
                                  }}
                                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                                >
                                  Mark read
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="text-gray-400 dark:text-gray-500 mb-4">
                    <Bell size={isMobile ? 48 : 32} className="mx-auto" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No notifications yet
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                    You're all caught up!
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && unreadCount > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-b-lg flex-shrink-0">
                <button 
                  className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium py-2"
                  onClick={markAllRead}
                >
                  <CheckCheck size={16} className="inline mr-2" />
                  Mark all as read
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
