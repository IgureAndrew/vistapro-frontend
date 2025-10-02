import React from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

// Field validation indicator component
export const FieldValidationIndicator = ({ field, value, isValid, error, validationRules }) => {
  const getValidationState = () => {
    if (error) return 'error';
    if (value && isValid) return 'success';
    if (value && !isValid) return 'warning';
    return 'neutral';
  };

  const state = getValidationState();

  const getIcon = () => {
    switch (state) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getMessage = () => {
    if (error) return error;
    if (state === 'success') return 'Valid';
    if (state === 'warning') return 'Please check this field';
    return null;
  };

  return (
    <div className="flex items-center space-x-2 mt-1">
      {getIcon()}
      {getMessage() && (
        <span className={`text-xs ${
          state === 'success' ? 'text-green-600' :
          state === 'error' ? 'text-red-600' :
          state === 'warning' ? 'text-yellow-600' :
          'text-gray-500'
        }`}>
          {getMessage()}
        </span>
      )}
    </div>
  );
};

// Form completion indicator
export const FormCompletionIndicator = ({ completed, total, currentStep }) => {
  const percentage = (completed / total) * 100;
  
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">Form Progress</h3>
        <span className="text-sm text-gray-500">{completed}/{total} completed</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-amber-500 to-amber-600 h-2 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      
      <div className="mt-2 text-xs text-gray-600">
        {completed === total ? 'All forms completed!' : `Step ${currentStep} of ${total}`}
      </div>
    </div>
  );
};

// Loading state component
export const FormLoadingState = ({ message = "Processing..." }) => {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    </div>
  );
};

// Success state component
export const FormSuccessState = ({ message, onContinue }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
        <CheckCircle className="h-8 w-8 text-green-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Success!</h3>
      <p className="text-sm text-gray-600 mb-4">{message}</p>
      {onContinue && (
        <button
          onClick={onContinue}
          className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
        >
          Continue
        </button>
      )}
    </div>
  );
};
