import React, { useState, useEffect } from 'react';
import { Clock, X, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import otpApiService from '../api/otpApi';

const GracePeriodWarningBanner = ({ user, onDismiss, isDismissible = false }) => {
  const [gracePeriodData, setGracePeriodData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkGracePeriod();
  }, []);

  const checkGracePeriod = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await otpApiService.getGracePeriodStatus(token);
      setGracePeriodData(response.data);
    } catch (error) {
      console.error('Error checking grace period:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  // Don't show if dismissed or not in grace period
  if (dismissed || loading || !gracePeriodData?.isInGracePeriod) {
    return null;
  }

  const daysRemaining = gracePeriodData.daysRemaining || 0;
  const totalDays = 14; // 2 weeks grace period
  const progress = ((totalDays - daysRemaining) / totalDays) * 100;

  // Determine urgency level
  const getUrgencyConfig = () => {
    if (daysRemaining <= 3) {
      return {
        bgColor: 'bg-red-50',
        borderColor: 'border-l-red-500',
        textColor: 'text-red-900',
        subtextColor: 'text-red-800',
        buttonColor: 'bg-red-600 hover:bg-red-700',
        icon: AlertCircle,
        iconColor: 'text-red-600',
        title: 'URGENT: Grace Period Ending Soon!',
        message: `Only ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left! Password login will be disabled after the grace period. Please update your email and enable OTP immediately.`
      };
    } else if (daysRemaining <= 7) {
      return {
        bgColor: 'bg-orange-50',
        borderColor: 'border-l-orange-500',
        textColor: 'text-orange-900',
        subtextColor: 'text-orange-800',
        buttonColor: 'bg-orange-600 hover:bg-orange-700',
        icon: AlertCircle,
        iconColor: 'text-orange-600',
        title: 'Action Required: Grace Period Ending',
        message: `${daysRemaining} days remaining in your grace period. Update your email and verify it to continue using password login.`
      };
    } else {
      return {
        bgColor: 'bg-blue-50',
        borderColor: 'border-l-blue-500',
        textColor: 'text-blue-900',
        subtextColor: 'text-blue-800',
        buttonColor: 'bg-blue-600 hover:bg-blue-700',
        icon: Clock,
        iconColor: 'text-blue-600',
        title: 'Grace Period Active',
        message: `You have ${daysRemaining} days to update your email and enable OTP login. Password login will be disabled after this period.`
      };
    }
  };

  const config = getUrgencyConfig();
  const IconComponent = config.icon;

  return (
    <Card className={`border-l-4 ${config.borderColor} ${config.bgColor} shadow-sm`}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <IconComponent className={`h-5 w-5 ${config.iconColor} mt-0.5 flex-shrink-0`} />
            <div className="flex-1">
              <h3 className={`font-semibold ${config.textColor} mb-1`}>
                {config.title}
              </h3>
              <p className={`text-sm ${config.subtextColor} mb-3`}>
                {config.message}
              </p>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={config.subtextColor}>Grace Period Progress</span>
                  <span className={`font-medium ${config.textColor}`}>
                    {daysRemaining} of {totalDays} days remaining
                  </span>
                </div>
                <Progress 
                  value={progress} 
                  className={`h-2 ${daysRemaining <= 3 ? 'bg-red-200' : daysRemaining <= 7 ? 'bg-orange-200' : 'bg-blue-200'}`}
                />
              </div>

              {/* Action Items */}
              <div className={`${config.bgColor} border ${config.borderColor.replace('border-l-', 'border-')} rounded-lg p-3 mb-3`}>
                <h4 className={`font-medium ${config.textColor} text-sm mb-2`}>
                  What you need to do:
                </h4>
                <ul className={`text-sm ${config.subtextColor} space-y-1`}>
                  <li className="flex items-start">
                    {gracePeriodData.emailUpdated ? (
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    ) : (
                      <span className="mr-2">1.</span>
                    )}
                    <span>Update your email address to your current email</span>
                  </li>
                  <li className="flex items-start">
                    {gracePeriodData.emailVerified ? (
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    ) : (
                      <span className="mr-2">2.</span>
                    )}
                    <span>Verify your email address (check your inbox)</span>
                  </li>
                  <li className="flex items-start">
                    {gracePeriodData.otpEnabled ? (
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    ) : (
                      <span className="mr-2">3.</span>
                    )}
                    <span>Enable OTP login for secure access</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => window.location.href = '/account-settings?tab=security'}
                  size="sm"
                  className={`${config.buttonColor} text-white`}
                >
                  Update Email & Enable OTP
                </Button>
                {gracePeriodData.helpUrl && (
                  <Button
                    onClick={() => window.open(gracePeriodData.helpUrl, '_blank')}
                    size="sm"
                    variant="outline"
                    className={`border-${config.borderColor.split('-')[2]}-600`}
                  >
                    Get Help
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          {isDismissible && daysRemaining > 3 && (
            <button
              onClick={handleDismiss}
              className={`p-1 hover:${config.bgColor} rounded-full ml-2 flex-shrink-0`}
            >
              <X className={`h-4 w-4 ${config.iconColor}`} />
            </button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default GracePeriodWarningBanner;
