import React, { useState, useEffect } from 'react';
import { Phone, Clock, CheckCircle, AlertCircle, User } from 'lucide-react';
import api from '../api';

const SuperAdminPhoneVerification = ({ marketer, onComplete }) => {
  const [formData, setFormData] = useState({
    phoneNumber: marketer?.phone || '',
    callDurationSeconds: '',
    verificationNotes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [callInProgress, setCallInProgress] = useState(false);
  const [callStartTime, setCallStartTime] = useState(null);
  const [callDuration, setCallDuration] = useState(0);

  // Timer for call duration
  useEffect(() => {
    let interval = null;
    if (callInProgress && callStartTime) {
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTime) / 1000));
      }, 1000);
    } else if (!callInProgress) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [callInProgress, callStartTime]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const startCall = () => {
    setCallInProgress(true);
    setCallStartTime(Date.now());
    setCallDuration(0);
  };

  const endCall = () => {
    setCallInProgress(false);
    setFormData(prev => ({
      ...prev,
      callDurationSeconds: callDuration.toString()
    }));
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/enhanced-verification/superadmin/phone-verification', {
        marketerUniqueId: marketer.unique_id,
        phoneNumber: formData.phoneNumber,
        callDurationSeconds: parseInt(formData.callDurationSeconds) || callDuration,
        verificationNotes: formData.verificationNotes
      });

      if (response.data.success) {
        setSuccess(true);
        onComplete?.(response.data.data);
      } else {
        setError(response.data.message || 'Phone verification failed');
      }
    } catch (err) {
      console.error('Error submitting phone verification:', err);
      setError(err.response?.data?.message || 'An error occurred during verification');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-purple-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Phone Verification Complete!</h2>
          <p className="text-gray-600 mb-6">
            Phone verification has been completed successfully. The marketer's application is now pending MasterAdmin approval.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900 text-center">Phone Verification</h1>
          <p className="text-sm text-gray-600 text-center mt-1">
            Verify {marketer?.first_name} {marketer?.last_name}'s information via phone call
          </p>
        </div>
      </div>

      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Marketer Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <User className="w-5 h-5 text-purple-600 mr-2" />
              Marketer Information
            </h2>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Name</p>
                  <p className="text-lg text-gray-900">{marketer?.first_name} {marketer?.last_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Email</p>
                  <p className="text-lg text-gray-900">{marketer?.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Phone Call Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Phone className="w-5 h-5 text-purple-600 mr-2" />
              Phone Call Details
            </h2>
            
            <div className="space-y-4">
              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter phone number to call"
                />
              </div>

              {/* Call Controls */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="text-center space-y-4">
                  {!callInProgress ? (
                    <button
                      type="button"
                      onClick={startCall}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mx-auto"
                    >
                      <Phone className="w-5 h-5" />
                      Start Call
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="font-medium">Call in Progress</span>
                      </div>
                      
                      <div className="text-2xl font-mono text-gray-900">
                        {formatDuration(callDuration)}
                      </div>
                      
                      <button
                        type="button"
                        onClick={endCall}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors mx-auto"
                      >
                        <Phone className="w-5 h-5" />
                        End Call
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Call Duration Display */}
              {(callDuration > 0 || formData.callDurationSeconds) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-800">Call Duration:</span>
                    <span className="text-lg font-mono text-blue-900">
                      {formatDuration(parseInt(formData.callDurationSeconds) || callDuration)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Verification Notes */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Verification Notes</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Call Summary & Verification Notes *
                </label>
                <textarea
                  name="verificationNotes"
                  value={formData.verificationNotes}
                  onChange={handleInputChange}
                  required
                  rows="6"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Document the call details, verification questions asked, responses received, and overall assessment..."
                />
              </div>

              {/* Verification Checklist */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-800 mb-3">Verification Checklist</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>✓ Confirm marketer's identity</p>
                  <p>✓ Verify residence address</p>
                  <p>✓ Confirm employment status</p>
                  <p>✓ Verify guarantor information</p>
                  <p>✓ Confirm understanding of commitment terms</p>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <button
              type="submit"
              disabled={loading || callInProgress}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Submitting Verification...
                </div>
              ) : (
                'Complete Phone Verification'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SuperAdminPhoneVerification;
