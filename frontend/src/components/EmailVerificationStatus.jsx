import React, { useState } from 'react';
import { CheckCircle, XCircle, Mail, AlertTriangle, Loader } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import EmailVerificationModal from './EmailVerificationModal';
import emailVerificationApi from '../api/emailVerificationApi';

const EmailVerificationStatus = ({ 
  user, 
  onVerificationUpdate 
}) => {
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const isEmailVerified = user?.email_verified;
  const userEmail = user?.email;

  const handleSendVerification = async () => {
    if (!userEmail) {
      setError('No email address found');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await emailVerificationApi.sendVerificationEmail(userEmail);
      setSuccess('Verification email sent successfully!');
      setError(null);
    } catch (error) {
      setError(error.message || 'Failed to send verification email');
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSuccess = () => {
    setShowVerificationModal(false);
    if (onVerificationUpdate) {
      onVerificationUpdate();
    }
  };

  return (
    <div className="space-y-4">
      {/* Verification Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Mail className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-medium">Email Verification</h3>
        </div>
        <Badge 
          variant={isEmailVerified ? "default" : "destructive"}
          className={isEmailVerified ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
        >
          {isEmailVerified ? 'Verified' : 'Not Verified'}
        </Badge>
      </div>

      {/* Status Display */}
      <div className={`rounded-lg p-4 border ${
        isEmailVerified 
          ? 'bg-green-50 border-green-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center space-x-3">
          {isEmailVerified ? (
            <CheckCircle className="h-6 w-6 text-green-500" />
          ) : (
            <XCircle className="h-6 w-6 text-red-500" />
          )}
          
          <div className="flex-1">
            <p className={`font-medium ${
              isEmailVerified ? 'text-green-800' : 'text-red-800'
            }`}>
              {isEmailVerified 
                ? 'Your email address is verified' 
                : 'Your email address is not verified'
              }
            </p>
            
            <p className={`text-sm mt-1 ${
              isEmailVerified ? 'text-green-700' : 'text-red-700'
            }`}>
              {userEmail}
            </p>
          </div>
        </div>
      </div>

      {/* Verification Requirements */}
      {!isEmailVerified && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 mb-2">
                Email Verification Required
              </h4>
              <p className="text-sm text-yellow-700 mb-3">
                To use OTP login and maintain access to your account, you need to verify your email address. 
                This ensures the security of your account and enables secure login methods.
              </p>
              
              <div className="space-y-2">
                <Button
                  onClick={() => setShowVerificationModal(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                  size="sm"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Verify Email Address
                </Button>
                
                <Button
                  onClick={handleSendVerification}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                  className="ml-2"
                >
                  {loading ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Resend Verification Email'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Benefits of Verification */}
      {isEmailVerified && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-800 mb-2">Benefits of Verified Email:</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Secure OTP login access</li>
            <li>• Account security notifications</li>
            <li>• Password reset capabilities</li>
            <li>• Full platform access during grace period</li>
          </ul>
        </div>
      )}

      {/* Email Verification Modal */}
      <EmailVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        userEmail={userEmail}
        userName={`${user?.first_name} ${user?.last_name}`}
        onVerificationSuccess={handleVerificationSuccess}
      />
    </div>
  );
};

export default EmailVerificationStatus;
