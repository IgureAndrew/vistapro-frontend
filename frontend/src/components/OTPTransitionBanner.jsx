import React, { useState } from 'react';
import { AlertTriangle, Clock, Mail, X } from 'lucide-react';
import { Button } from './ui/button';

const OTPTransitionBanner = ({ onDismiss }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    if (onDismiss) onDismiss();
  };

  if (isDismissed || !isVisible) return null;

  return (
    <div className="w-full bg-blue-50 border-b border-blue-200 text-blue-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-3 flex-1">
            <div className="flex-shrink-0">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                🔄 VistaPro is upgrading to OTP login for enhanced security. 
                <span className="font-semibold"> Password login will be disabled in 2 weeks.</span> 
                Please ensure your email address is up to date to continue using the platform.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={handleDismiss}
              className="p-1 rounded-full hover:bg-blue-100 transition-colors text-blue-600"
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

export default OTPTransitionBanner;
