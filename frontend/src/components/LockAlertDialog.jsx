import React from 'react';
import { AlertCircle, Lock } from 'lucide-react';

const LockAlertDialog = ({ isOpen, onClose, lockReason }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="bg-red-50 border-b border-red-200 px-6 py-4 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-900">Account Locked</h3>
              <p className="text-sm text-red-700">Your account has been locked by an administrator</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <div className="flex items-start space-x-3 mb-4">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Reason for Lock:</h4>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {lockReason || 'No reason provided by administrator'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>What this means:</strong> You cannot access your dashboard until an administrator unlocks your account.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LockAlertDialog;

