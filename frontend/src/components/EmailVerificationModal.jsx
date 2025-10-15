import React, { useState } from 'react';
import { X, Mail, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import emailVerificationApi from '../api/emailVerificationApi';

const EmailVerificationModal = ({ 
  isOpen, 
  onClose, 
  userEmail, 
  userName,
  onVerificationSuccess 
}) => {
  const [email, setEmail] = useState(userEmail || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  if (!isOpen) return null;

  const handleSendVerification = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await emailVerificationApi.sendVerificationEmail(email);
      setVerificationSent(true);
      setSuccess(true);
      setError(null);
    } catch (error) {
      setError(error.message || 'Failed to send verification email');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError(null);
    setSuccess(false);
    setVerificationSent(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Mail className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900">Email Verification</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!verificationSent ? (
            <>
              <div className="text-center mb-6">
                <p className="text-gray-600 mb-4">
                  To use OTP login, you need to verify your email address. We'll send you a verification link.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Current email:</strong> {userEmail || 'Not set'}
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* Email Input Form */}
              <form onSubmit={handleSendVerification} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                    disabled={loading || !email.trim()}
                  >
                    {loading ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Verification Email'
                    )}
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <span className="text-lg font-medium text-green-600">
                  Verification Email Sent!
                </span>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-800 mb-2">
                  <strong>Check your email:</strong> {email}
                </p>
                <p className="text-sm text-green-700">
                  We've sent you a verification link. Click the link in the email to verify your address.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> The verification link will expire in 24 hours. 
                  If you don't see the email, check your spam folder.
                </p>
              </div>

              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setVerificationSent(false)}
                  className="flex-1"
                >
                  Send Another Email
                </Button>
                <Button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationModal;
