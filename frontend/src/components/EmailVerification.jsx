import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

export default function EmailVerification() {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }

    // Call backend verification endpoint
    axios.post(`${import.meta.env.VITE_API_URL || 'https://vistapro-backend.onrender.com'}/api/auth/verify-email/${token}`)
      .then((response) => {
        setStatus('success');
        setMessage('Email verified successfully! You can now log in to your account.');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      })
      .catch((error) => {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Invalid or expired verification link.');
      });
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="mb-6">
          {status === 'verifying' && (
            <>
              <Loader className="h-16 w-16 text-blue-500 animate-spin mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Email</h1>
              <p className="text-gray-600">Please wait while we verify your email address...</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-green-900 mb-2">Email Verified!</h1>
              <p className="text-green-700 mb-4">{message}</p>
              <p className="text-sm text-gray-500">Redirecting to login page in 3 seconds...</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-red-900 mb-2">Verification Failed</h1>
              <p className="text-red-700 mb-6">{message}</p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Login
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Go Home
                </button>
              </div>
            </>
          )}
        </div>
        
        {status === 'success' && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>What's next?</strong> You can now use OTP login with your verified email address.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}