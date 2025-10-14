import React, { useState } from 'react';
import { Mail, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import EmailVerificationModal from './EmailVerificationModal';

const EmailVerificationPrompt = ({ user, onDismiss, isDismissible = true }) => {
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Don't show if already verified or dismissed
  if (user?.email_verified || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  const handleVerificationSuccess = () => {
    setShowModal(false);
    // Refresh the page or update user state
    window.location.reload();
  };

  return (
    <>
      <Card className="border-l-4 border-l-yellow-500 bg-yellow-50 shadow-sm">
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 mb-1">
                  Email Verification Required
                </h3>
                <p className="text-sm text-yellow-800 mb-3">
                  To continue using VistaPro and enable secure OTP login, please verify your email address. 
                  This is required before the grace period ends.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => setShowModal(true)}
                    size="sm"
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Verify Email Now
                  </Button>
                  <Button
                    onClick={() => window.location.href = '/account-settings?tab=security'}
                    size="sm"
                    variant="outline"
                    className="border-yellow-600 text-yellow-700 hover:bg-yellow-100"
                  >
                    Go to Settings
                  </Button>
                </div>
              </div>
            </div>
            
            {isDismissible && (
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-yellow-100 rounded-full ml-2 flex-shrink-0"
              >
                <X className="h-4 w-4 text-yellow-700" />
              </button>
            )}
          </div>
        </div>
      </Card>

      <EmailVerificationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        userEmail={user?.email}
        userName={`${user?.first_name} ${user?.last_name}`}
        onVerificationSuccess={handleVerificationSuccess}
      />
    </>
  );
};

export default EmailVerificationPrompt;
