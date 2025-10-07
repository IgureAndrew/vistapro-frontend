// src/components/VerificationNotifications.jsx
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import {
  Bell,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Mail,
  Phone,
  MapPin,
  UserCheck,
  Calendar
} from 'lucide-react';

const VerificationNotifications = ({ 
  userRole, 
  userId, 
  onNotificationClick,
  className = "" 
}) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [socket, setSocket] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_URL, {
      transports: ['websocket']
    });
    
    setSocket(newSocket);

    // Listen for verification notifications
    newSocket.on('verificationStatusChanged', (data) => {
      handleVerificationUpdate(data);
    });

    newSocket.on('verificationApproved', (data) => {
      handleVerificationApproved(data);
    });

    newSocket.on('newNotification', (data) => {
      // Handle general notifications that might be verification-related
      if (data.message && (
        data.message.toLowerCase().includes('verification') ||
        data.message.toLowerCase().includes('form') ||
        data.message.toLowerCase().includes('admin') ||
        data.message.toLowerCase().includes('approved')
      )) {
        handleVerificationUpdate({
          status: 'general_update',
          message: data.message
        });
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Handle different types of verification updates
  const handleVerificationUpdate = (data) => {
    const notification = {
      id: Date.now() + Math.random(),
      type: 'verification_update',
      title: 'Verification Status Updated',
      message: getVerificationMessage(data),
      timestamp: new Date(),
      read: false,
      priority: 'medium',
      icon: getVerificationIcon(data.status),
      color: getVerificationColor(data.status)
    };
    
    addNotification(notification);
  };

  const handleVerificationReminder = (data) => {
    const notification = {
      id: Date.now() + Math.random(),
      type: 'verification_reminder',
      title: 'Verification Reminder',
      message: getReminderMessage(data),
      timestamp: new Date(),
      read: false,
      priority: 'high',
      icon: Clock,
      color: 'text-orange-600'
    };
    
    addNotification(notification);
  };

  const handleVerificationApproved = (data) => {
    const notification = {
      id: Date.now() + Math.random(),
      type: 'verification_approved',
      title: 'Verification Approved! 🎉',
      message: 'Your verification has been approved. You can now access all features.',
      timestamp: new Date(),
      read: false,
      priority: 'high',
      icon: CheckCircle,
      color: 'text-green-600'
    };
    
    addNotification(notification);
  };

  // Helper functions
  const getVerificationMessage = (data) => {
    // If we have a direct message, use it
    if (data.message) {
      return data.message;
    }
    
    // Otherwise, use status-based messages
    switch (data.status) {
      case 'awaiting_admin_review':
        return 'Your verification forms have been submitted and are awaiting Admin review.';
      case 'awaiting_superadmin_validation':
        return 'Your verification has been reviewed by Admin and is now under SuperAdmin validation.';
      case 'awaiting_masteradmin_approval':
        return 'Your verification has been validated by SuperAdmin and is awaiting MasterAdmin approval.';
      case 'approved':
        return 'Congratulations! Your verification has been approved.';
      case 'rejected':
        return 'Your verification requires additional information. Please contact your Admin.';
      case 'general_update':
        return data.message || 'Verification status updated.';
      default:
        return 'Verification status updated.';
    }
  };

  const getReminderMessage = (data) => {
    switch (data.type) {
      case 'form_incomplete':
        return 'Please complete your verification forms to continue.';
      case 'admin_visit_pending':
        return 'Admin will visit for physical verification soon.';
      case 'phone_call_pending':
        return 'SuperAdmin will call you for verification soon.';
      default:
        return 'Verification reminder.';
    }
  };

  const getVerificationIcon = (status) => {
    switch (status) {
      case 'physical_verification_pending':
      case 'physical_verification_completed':
        return MapPin;
      case 'phone_verification_pending':
      case 'phone_verification_completed':
        return Phone;
      case 'masteradmin_approval_pending':
        return UserCheck;
      default:
        return CheckCircle;
    }
  };

  const getVerificationColor = (status) => {
    switch (status) {
      case 'physical_verification_pending':
      case 'phone_verification_pending':
      case 'masteradmin_approval_pending':
        return 'text-orange-600';
      case 'physical_verification_completed':
      case 'phone_verification_completed':
        return 'text-blue-600';
      case 'approved':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50
    setUnreadCount(prev => prev + 1);
    
    // Auto-remove after 30 seconds for low priority
    if (notification.priority === 'low') {
      setTimeout(() => {
        removeNotification(notification.id);
      }, 30000);
    }
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notifications
              </h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const IconComponent = notification.icon;
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${notification.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                        <IconComponent className={`w-4 h-4 ${notification.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            {notification.title}
                          </h4>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTimeAgo(notification.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        {notification.priority === 'high' && (
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              High Priority
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VerificationNotifications;
