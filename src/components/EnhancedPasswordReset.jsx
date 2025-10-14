import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Lock, RefreshCw, ArrowLeft, AlertTriangle, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import passwordResetApi from '../api/passwordResetApi';

const EnhancedPasswordReset = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState(token ? 'reset' : 'request');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState(null);

  // Check password reset status when email is entered
  useEffect(() => {
    if (email && email.includes('@')) {
      const checkStatus = async () => {
        try {
          const statusData = await passwordResetApi.checkPasswordResetStatus(email);
          setResetStatus(statusData);
        } catch (error) {
          console.error('Error checking reset status:', error);
        }
      };
      
      const timeoutId = setTimeout(checkStatus, 500); // Debounce
      return () => clearTimeout(timeoutId);
    }
  }, [email]);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const data = await passwordResetApi.sendPasswordResetEmail(email);
      setStatus('sent');
      setMessage(data.message);
      setError('');
    } catch (error) {
      setError(error.message || 'Failed to send reset email. Please try again.');
      setMessage('');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 10) {
      setError('Password must be at least 10 characters long.');
      return;
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d).{10,}$/.test(newPassword)) {
      setError('Password must contain at least one letter and one number.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const data = await passwordResetApi.resetPassword(token, newPassword);
      setStatus('success');
      setMessage(data.message);
      setError('');
    } catch (error) {
      setError(error.message || 'Failed to reset password. Please try again.');
      setMessage('');
    } finally {
      setLoading(false);
    }
  };

  const renderRequestForm = () => (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Lock className="h-12 w-12 text-blue-500" />
        </div>
        <CardTitle className="text-2xl">Reset Password</CardTitle>
        <CardDescription>
          Enter your email address and we'll send you a password reset link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Grace Period Information Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-start space-x-2">
            <Clock className="h-4 w-4 text-blue-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">About Password Reset</p>
              <p className="text-xs text-blue-800 mt-1">
                Password reset is available during the grace period or if you haven't enabled OTP login yet. 
                After the grace period ends, you'll need to use OTP login for enhanced security.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleRequestReset} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
            />
          </div>

          {/* Password Reset Status */}
          {resetStatus && (
            <div className={`rounded-lg p-3 ${
              resetStatus.passwordResetAllowed 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center space-x-2">
                {resetStatus.passwordResetAllowed ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    resetStatus.passwordResetAllowed ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {resetStatus.passwordResetAllowed ? 'Password Reset Available' : 'Password Reset Not Available'}
                  </p>
                  <p className={`text-xs mt-1 ${
                    resetStatus.passwordResetAllowed ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {resetStatus.message}
                  </p>
                </div>
              </div>
              
              {resetStatus.isInGracePeriod && resetStatus.daysRemaining && (
                <div className="mt-2 flex items-center space-x-2 bg-yellow-50 border border-yellow-200 rounded p-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-800">
                      Grace Period Active
                    </p>
                    <p className="text-xs text-yellow-700">
                      {resetStatus.daysRemaining} {resetStatus.daysRemaining === 1 ? 'day' : 'days'} remaining to reset your password
                    </p>
                  </div>
                </div>
              )}

              {!resetStatus.passwordResetAllowed && (
                <div className="mt-2 bg-blue-50 border border-blue-200 rounded p-2">
                  <p className="text-xs text-blue-800">
                    💡 <strong>Tip:</strong> Use OTP login with your verified email address to access your account.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {message && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <p className="text-green-700 text-sm">{message}</p>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || (resetStatus && !resetStatus.passwordResetAllowed)}
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Reset Email'
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/login')}
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const renderResetForm = () => (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Lock className="h-12 w-12 text-blue-500" />
        </div>
        <CardTitle className="text-2xl">Create New Password</CardTitle>
        <CardDescription>
          Enter your new password below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
            />
            <p className="text-xs text-gray-500">
              Must be at least 10 characters with letters and numbers
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Resetting...
              </>
            ) : (
              'Reset Password'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const renderSentMessage = () => (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>
        <CardTitle className="text-2xl text-green-600">Email Sent!</CardTitle>
        <CardDescription>
          Check your email for password reset instructions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700 text-sm">{message}</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-blue-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800 mb-1">Important:</h4>
              <p className="text-sm text-blue-700">
                The reset link will expire in 1 hour. If you don't see the email, check your spam folder.
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={() => setStatus('request')}
          variant="outline"
          className="w-full"
        >
          Send Another Email
        </Button>

        <Button
          onClick={() => navigate('/login')}
          className="w-full"
        >
          Back to Login
        </Button>
      </CardContent>
    </Card>
  );

  const renderSuccessMessage = () => (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>
        <CardTitle className="text-2xl text-green-600">Password Reset!</CardTitle>
        <CardDescription>
          Your password has been successfully reset.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700 text-sm">{message}</p>
        </div>

        <Button
          onClick={() => navigate('/login')}
          className="w-full"
        >
          Go to Login
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {status === 'request' && renderRequestForm()}
        {status === 'reset' && renderResetForm()}
        {status === 'sent' && renderSentMessage()}
        {status === 'success' && renderSuccessMessage()}
      </div>
    </div>
  );
};

export default EnhancedPasswordReset;
