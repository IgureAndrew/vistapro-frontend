import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Mail, X } from 'lucide-react';
import { Button } from './ui/button';
import CountdownTimer from './CountdownTimer';

const GracePeriodBanner = ({ 
  gracePeriodData, 
  onUpdateEmail, 
  onDismiss,
  isLoggedIn = false 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show banner if user is not logged in or grace period data is not available
  if (!isLoggedIn || !gracePeriodData || !gracePeriodData.isInGracePeriod) {
    return null;
  }

  const { daysRemaining, emailUpdateRequired, gracePeriodEnd } = gracePeriodData;

  // Determine banner type based on days remaining
  const getBannerType = () => {
    if (daysRemaining <= 1) return 'critical';
    if (daysRemaining <= 2) return 'critical';
    if (daysRemaining <= 5) return 'warning';
    if (daysRemaining <= 10) return 'warning';
    return 'info';
  };

  const bannerType = getBannerType();

  const getBannerStyles = () => {
    switch (bannerType) {
      case 'critical':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-800',
          icon: 'text-red-500',
          button: 'bg-red-600 hover:bg-red-700 text-white'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          text: 'text-yellow-800',
          icon: 'text-yellow-500',
          button: 'bg-yellow-600 hover:bg-yellow-700 text-white'
        };
      default:
        return {
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-800',
          icon: 'text-blue-500',
          button: 'bg-blue-600 hover:bg-blue-700 text-white'
        };
    }
  };

  const styles = getBannerStyles();

  const getBannerMessage = () => {
    if (daysRemaining <= 1) {
      return `🚨 CRITICAL: Password login will be disabled TODAY! Update your email immediately to continue using OTP login.`;
    } else if (daysRemaining <= 2) {
      return `🚨 URGENT: Password login will be disabled in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}! Update your email now to continue using OTP login.`;
    } else if (daysRemaining <= 5) {
      return `⚠️ Password login will be disabled in ${daysRemaining} days. Please update your email address to use OTP login.`;
    } else if (daysRemaining <= 10) {
      return `⚠️ Password login will be disabled in ${daysRemaining} days. Consider updating your email address to use OTP login.`;
    } else {
      return `ℹ️ VistaPro is upgrading to OTP login. You have ${daysRemaining} days to update your email address.`;
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    if (onDismiss) onDismiss();
  };

  const handleUpdateEmail = () => {
    if (onUpdateEmail) onUpdateEmail();
  };

  if (isDismissed || !isVisible) return null;

  return (
    <div className={`w-full ${styles.bg} border-b ${styles.text} shadow-sm`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-3 flex-1">
            <div className="flex-shrink-0">
              {bannerType === 'critical' ? (
                <AlertTriangle className={`h-5 w-5 ${styles.icon}`} />
              ) : (
                <Clock className={`h-5 w-5 ${styles.icon}`} />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {getBannerMessage()}
              </p>
              
              {gracePeriodEnd && (
                <div className="mt-1 flex items-center space-x-2 text-xs">
                  <span>Time remaining:</span>
                  <CountdownTimer deadline={gracePeriodEnd} />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            {emailUpdateRequired && (
              <Button
                onClick={handleUpdateEmail}
                size="sm"
                className={`${styles.button} text-xs px-3 py-1`}
              >
                <Mail className="h-3 w-3 mr-1" />
                Update Email
              </Button>
            )}
            
            <button
              onClick={handleDismiss}
              className={`p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors ${styles.text}`}
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GracePeriodBanner;
