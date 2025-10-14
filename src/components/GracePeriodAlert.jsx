import React, { useState } from 'react';
import { X, AlertTriangle, Mail, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

const GracePeriodAlert = ({ 
  isOpen, 
  onClose, 
  daysRemaining, 
  currentEmail, 
  onUpdateEmail, 
  isLoading = false,
  error = null 
}) => {
  const [newEmail, setNewEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newEmail && newEmail !== currentEmail) {
      onUpdateEmail(newEmail);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
            <h2 className="text-xl font-semibold text-gray-900">Email Update Required</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Clock className="h-5 w-5 text-yellow-500" />
              <span className="text-lg font-medium text-yellow-600">
                {daysRemaining} days remaining
              </span>
            </div>
            <p className="text-gray-600 mb-4">
              VistaPro is upgrading to a more secure login system. Please update your email address to continue using OTP (One-Time Password) authentication.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Current email:</strong> {currentEmail}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Email Update Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="newEmail" className="text-sm font-medium text-gray-700">
                New Email Address
              </Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="newEmail"
                  type="email"
                  placeholder="Enter your new email address"
                  className="pl-10"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isLoading}
              >
                Update Later
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                disabled={!newEmail || newEmail === currentEmail || isLoading}
              >
                {isLoading ? 'Updating...' : 'Update Email'}
              </Button>
            </div>
          </form>

          {/* Benefits */}
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="text-sm font-medium text-green-800 mb-2">Benefits of OTP Login:</h4>
            <ul className="text-xs text-green-700 space-y-1">
              <li>• Enhanced security with time-limited codes</li>
              <li>• No need to remember complex passwords</li>
              <li>• Protection against password theft</li>
              <li>• Instant login notifications</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GracePeriodAlert;