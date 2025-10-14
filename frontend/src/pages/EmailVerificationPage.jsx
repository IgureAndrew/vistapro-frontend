import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import emailVerificationApi from '../api/emailVerificationApi';

const EmailVerificationPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setError('Invalid verification link. No token provided.');
        setLoading(false);
        return;
      }

      try {
        const result = await emailVerificationApi.verifyEmail(token);
        setSuccess(true);
        setUserEmail(result.email);
        setError(null);
        
        // Auto-redirect to login after 3 seconds with countdown
        const countdownInterval = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              console.log('Redirecting to login page...');
              navigate('/login');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } catch (error) {
        setError(error.message || 'Failed to verify email');
        setSuccess(false);
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {loading && <Loader className="h-12 w-12 text-blue-500 animate-spin" />}
            {success && <CheckCircle className="h-12 w-12 text-green-500" />}
            {error && <XCircle className="h-12 w-12 text-red-500" />}
          </div>
          
          <CardTitle className="text-2xl">
            {loading && 'Verifying Email...'}
            {success && 'Email Verified!'}
            {error && 'Verification Failed'}
          </CardTitle>
          
          <CardDescription>
            {loading && 'Please wait while we verify your email address.'}
            {success && 'Your email address has been successfully verified.'}
            {error && 'We encountered an issue verifying your email address.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {loading && (
            <div className="text-center">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <Mail className="h-4 w-4 inline mr-2" />
                  Verifying your email address...
                </p>
              </div>
            </div>
          )}

          {success && (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-green-800">Verification Successful!</span>
                </div>
                <p className="text-sm text-green-700">
                  Your email address <strong>{userEmail}</strong> has been verified. 
                  You can now use OTP login with this email address.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">What's Next?</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• You can now use OTP login with your verified email</li>
                  <li>• Password login will be disabled after the grace period</li>
                  <li>• Keep your email address updated for security</li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-green-800">
                  <strong>Redirecting to login page in {countdown} seconds...</strong>
                </p>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleGoToLogin}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Go to Login Now
                </Button>
                <Button
                  onClick={handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  Go Home
                </Button>
              </div>
            </>
          )}

          {error && (
            <>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="font-medium text-red-800">Verification Failed</span>
                </div>
                <p className="text-sm text-red-700">{error}</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Common Issues:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• The verification link may have expired (24 hours)</li>
                  <li>• The link may have already been used</li>
                  <li>• The email address may already be verified</li>
                </ul>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleGoToLogin}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
                <Button
                  onClick={handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  Go Home
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerificationPage;
