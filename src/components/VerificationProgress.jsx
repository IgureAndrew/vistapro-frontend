import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, MapPin, Phone, FileText, UserCheck } from 'lucide-react';
import api from '../api';

const VerificationProgress = ({ marketerUniqueId, onStatusChange }) => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProgress();
  }, [marketerUniqueId]);

  const fetchProgress = async () => {
    try {
      const response = await api.get(`/enhanced-verification/progress/${marketerUniqueId}`);
      if (response.data.success) {
        setProgress(response.data.data);
        onStatusChange?.(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch progress');
      }
    } catch (err) {
      console.error('Error fetching verification progress:', err);
      setError('Failed to load verification progress');
    } finally {
      setLoading(false);
    }
  };

  const getStepIcon = (step, status) => {
    const iconClass = "w-6 h-6";
    
    if (status === 'completed') {
      return <CheckCircle className={`${iconClass} text-green-500`} />;
    } else if (status === 'in_progress') {
      return <Clock className={`${iconClass} text-blue-500`} />;
    } else if (status === 'failed') {
      return <AlertCircle className={`${iconClass} text-red-500`} />;
    } else {
      return <Clock className={`${iconClass} text-gray-400`} />;
    }
  };

  const getStepName = (step) => {
    const stepNames = {
      'forms_submitted': 'Forms Submitted',
      'admin_physical_verification': 'Physical Verification',
      'superadmin_phone_verification': 'Phone Verification',
      'masteradmin_approval': 'MasterAdmin Approval',
      'approved': 'Approved'
    };
    return stepNames[step] || step;
  };

  const getStepDescription = (step) => {
    const descriptions = {
      'forms_submitted': 'All required forms have been submitted',
      'admin_physical_verification': 'Admin has verified marketer\'s location and residence',
      'superadmin_phone_verification': 'SuperAdmin has completed phone verification',
      'masteradmin_approval': 'Pending final approval from MasterAdmin',
      'approved': 'Verification complete - dashboard unlocked'
    };
    return descriptions[step] || '';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-center text-red-600">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!progress) return null;

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Verification Progress</h2>
          <div className="text-sm text-gray-600">
            {progress.progress.percentage}% Complete
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress.progress.percentage}%` }}
          ></div>
        </div>

        {/* Marketer Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-800 mb-2">Marketer Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Name:</span>
              <span className="ml-2 font-medium">{progress.marketer.name}</span>
            </div>
            <div>
              <span className="text-gray-600">Email:</span>
              <span className="ml-2 font-medium">{progress.marketer.email}</span>
            </div>
            <div>
              <span className="text-gray-600">Phone:</span>
              <span className="ml-2 font-medium">{progress.marketer.phone}</span>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <span className={`ml-2 font-medium px-2 py-1 rounded-full text-xs ${
                progress.marketer.verification_status === 'approved' 
                  ? 'bg-green-100 text-green-800'
                  : progress.marketer.verification_status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {progress.marketer.verification_status.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Forms Status */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-800 mb-3">Forms Status</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.entries(progress.marketer.forms).map(([form, submitted]) => (
              <div key={form} className="flex items-center space-x-2">
                {submitted ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Clock className="w-5 h-5 text-gray-400" />
                )}
                <span className={`text-sm ${submitted ? 'text-green-700' : 'text-gray-500'}`}>
                  {form.charAt(0).toUpperCase() + form.slice(1).replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Verification Steps */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Verification Steps</h2>
        
        <div className="space-y-4">
          {progress.progress.steps.map((step, index) => (
            <div key={step.current_step} className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {getStepIcon(step.current_step, step.step_status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">
                    {getStepName(step.current_step)}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    step.step_status === 'completed' 
                      ? 'bg-green-100 text-green-800'
                      : step.step_status === 'in_progress'
                      ? 'bg-blue-100 text-blue-800'
                      : step.step_status === 'failed'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {step.step_status.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {getStepDescription(step.current_step)}
                </p>
                {step.completed_at && (
                  <p className="text-xs text-gray-500 mt-1">
                    Completed: {new Date(step.completed_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Physical Verification Details */}
      {progress.physical_verification && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <MapPin className="w-5 h-5 text-blue-600 mr-2" />
            Physical Verification Details
          </h2>
          
          <div className="space-y-4">
            <div>
              <span className="text-sm font-medium text-gray-600">Verification Date:</span>
              <span className="ml-2 text-sm text-gray-900">
                {new Date(progress.physical_verification.date).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Location:</span>
              <span className="ml-2 text-sm text-gray-900">
                {progress.physical_verification.location.address}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Landmark:</span>
              <span className="ml-2 text-sm text-gray-900">
                {progress.physical_verification.location.landmark}
              </span>
            </div>
            {progress.physical_verification.notes && (
              <div>
                <span className="text-sm font-medium text-gray-600">Notes:</span>
                <p className="mt-1 text-sm text-gray-900">{progress.physical_verification.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Phone Verification Details */}
      {progress.phone_verification && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Phone className="w-5 h-5 text-purple-600 mr-2" />
            Phone Verification Details
          </h2>
          
          <div className="space-y-4">
            <div>
              <span className="text-sm font-medium text-gray-600">Verification Date:</span>
              <span className="ml-2 text-sm text-gray-900">
                {new Date(progress.phone_verification.date).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Phone Number:</span>
              <span className="ml-2 text-sm text-gray-900">
                {progress.phone_verification.phone_number}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Call Duration:</span>
              <span className="ml-2 text-sm text-gray-900">
                {Math.floor(progress.phone_verification.call_duration / 60)}:
                {(progress.phone_verification.call_duration % 60).toString().padStart(2, '0')}
              </span>
            </div>
            {progress.phone_verification.notes && (
              <div>
                <span className="text-sm font-medium text-gray-600">Notes:</span>
                <p className="mt-1 text-sm text-gray-900">{progress.phone_verification.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationProgress;
