import React from 'react';

const SuccessAnimation = ({ message, onComplete }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center animate-pulse">
        {/* Success Icon */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
          <svg 
            className="h-8 w-8 text-green-600 animate-bounce" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 13l4 4L19 7" 
            />
          </svg>
        </div>
        
        {/* Success Message */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {message || "Form Submitted Successfully!"}
        </h3>
        
        {/* Progress Indicator */}
        <div className="flex justify-center space-x-2 mb-4">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
        
        {/* Auto-progress message */}
        <p className="text-sm text-gray-600">
          Proceeding to next form...
        </p>
      </div>
    </div>
  );
};

export default SuccessAnimation;
