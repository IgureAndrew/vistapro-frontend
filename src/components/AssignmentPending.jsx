import React from 'react';
import { Clock, User, Mail, AlertCircle } from 'lucide-react';

const AssignmentPending = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Icon */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
          <Clock className="h-8 w-8 text-yellow-600" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Account Pending Assignment
        </h1>

        {/* Description */}
        <div className="space-y-4 text-gray-600 mb-8">
          <p className="text-lg">
            Your account has been successfully created, but it's currently pending Admin assignment.
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium text-yellow-800">
                  What happens next?
                </p>
                <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                  <li>• MasterAdmin will assign you to an Admin</li>
                  <li>• You'll receive a notification when assigned</li>
                  <li>• You can then start the verification process</li>
                </ul>
              </div>
            </div>
          </div>

          <p className="text-sm">
            Please wait for assignment. You will be notified via email when your account is ready.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Back to Login
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors font-medium"
          >
            Check Status
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            If you have any questions, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AssignmentPending;
