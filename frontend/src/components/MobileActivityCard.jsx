import React from 'react';
import { Clock, User, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { getAvatarUrl, getUserInitials } from '../utils/avatarUtils';

const MobileActivityCard = ({ activity, index }) => {
  // Helper function to get activity icon based on type
  const getActivityIcon = (activityType) => {
    switch (activityType) {
      case 'Create User':
      case 'Register Master Admin':
      case 'Register Super Admin':
        return <User className="w-4 h-4" />;
      case 'Update User':
      case 'Update Profile':
        return <CheckCircle className="w-4 h-4" />;
      case 'Lock User':
      case 'Unlock User':
        return <AlertCircle className="w-4 h-4" />;
      case 'Assign Marketers to Admin':
      case 'Assign Admins to Super Admin':
      case 'Unassign Marketers from Admin':
      case 'Unassign Admins from Super Admin':
        return <Info className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  // Helper function to get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
      case 'completed':
        return 'status-badge-success';
      case 'warning':
      case 'pending':
        return 'status-badge-warning';
      case 'error':
      case 'failed':
        return 'status-badge-error';
      default:
        return 'status-badge-success';
    }
  };

  // Helper function to format time
  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}h ago`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays}d ago`;
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Unknown time';
    }
  };

  // Helper function to get user initials from name string
  const getUserInitialsFromName = (name) => {
    if (!name) return 'S';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Helper function to format activity description
  const formatActivityDescription = (activity) => {
    const { activity_type, entity_type, entity_unique_id } = activity;
    
    switch (activity_type) {
      case 'Create User':
        return `Created ${entity_type} ${entity_unique_id}`;
      case 'Update User':
        return `Updated ${entity_type} ${entity_unique_id}`;
      case 'Delete User':
        return `Deleted ${entity_type} ${entity_unique_id}`;
      case 'Lock User':
        return `Locked ${entity_type} ${entity_unique_id}`;
      case 'Unlock User':
        return `Unlocked ${entity_type} ${entity_unique_id}`;
      case 'Assign Marketers to Admin':
        return `Assigned marketers to Admin ${entity_unique_id}`;
      case 'Assign Admins to Super Admin':
        return `Assigned admins to Super Admin ${entity_unique_id}`;
      case 'Unassign Marketers from Admin':
        return `Unassigned marketers from Admin ${entity_unique_id}`;
      case 'Unassign Admins from Super Admin':
        return `Unassigned admins from Super Admin ${entity_unique_id}`;
      case 'Update Profile':
        return `Updated profile`;
      case 'Register Master Admin':
        return `Registered new Master Admin ${entity_unique_id}`;
      case 'Register Super Admin':
        return `Registered new Super Admin ${entity_unique_id}`;
      default:
        return `${activity_type} ${entity_type} ${entity_unique_id}`;
    }
  };

  return (
    <div className="mobile-card">
      <div className="flex items-start space-x-3">
        {/* User Avatar */}
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
          {activity.actor_profile_image ? (
            <img 
              src={getAvatarUrl(activity.actor_profile_image)} 
              alt="Profile" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <span 
            className="mobile-caption font-semibold text-blue-600 dark:text-blue-400"
            style={{ display: activity.actor_profile_image ? 'none' : 'flex' }}
          >
            {getUserInitialsFromName(activity.actor_name)}
          </span>
        </div>
        
        {/* Activity Content */}
        <div className="flex-1 min-w-0">
          <div className="mobile-body font-semibold text-gray-900 dark:text-white mb-1">
            {formatActivityDescription(activity)}
          </div>
          
          {activity.entity_display_name && (
            <div className="mobile-body-small text-gray-600 dark:text-gray-400 mb-2">
              {activity.entity_display_name}
            </div>
          )}
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <User className="w-3 h-3 text-gray-400" />
              <span className="mobile-caption text-gray-500 dark:text-gray-400">
                {activity.actor_name || 'System'}
              </span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3 text-gray-400" />
              <span className="mobile-caption text-gray-500 dark:text-gray-400">
                {formatTime(activity.created_at || activity.timestamp)}
              </span>
            </div>
            
            {activity.status && (
              <span className={`mobile-badge-text px-2 py-1 rounded-full ${
                activity.status === 'success' || activity.status === 'completed' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : activity.status === 'warning' || activity.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
              }`}>
                {activity.status}
              </span>
            )}
          </div>
        </div>
        
        {/* Activity Icon */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            {getActivityIcon(activity.activity_type || activity.type)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileActivityCard;
