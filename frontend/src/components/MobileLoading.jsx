// src/components/MobileLoading.jsx
import React from 'react';

const MobileLoading = ({ 
  size = 'medium', 
  text = 'Loading...', 
  showText = true,
  className = '' 
}) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
  };

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };

  return (
    <div className={`flex flex-col items-center justify-center p-6 ${className}`}>
      {/* Spinner */}
      <div className={`${sizeClasses[size]} border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3`} />
      
      {/* Loading text */}
      {showText && (
        <p className={`text-gray-600 dark:text-gray-400 ${textSizeClasses[size]} mobile-body font-medium`}>
          {text}
        </p>
      )}
    </div>
  );
};

// Skeleton loading components
export const MobileSkeleton = ({ 
  width = 'w-full', 
  height = 'h-4', 
  className = '' 
}) => (
  <div className={`bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${width} ${height} ${className}`} />
);

export const MobileCardSkeleton = () => (
  <div className="mobile-card mobile-shadow">
    <div className="flex items-center space-x-3 mb-4">
      <MobileSkeleton width="w-12" height="h-12" className="rounded-xl" />
      <div className="flex-1">
        <MobileSkeleton width="w-3/4" height="h-4" className="mb-2" />
        <MobileSkeleton width="w-1/2" height="h-3" />
      </div>
    </div>
    <div className="space-y-2">
      <MobileSkeleton width="w-full" height="h-6" />
      <MobileSkeleton width="w-2/3" height="h-4" />
    </div>
  </div>
);

export const MobileMetricSkeleton = () => (
  <div className="mobile-metric-card mobile-shadow-md">
    <div className="flex items-start justify-between mb-6">
      <div className="flex-1">
        <MobileSkeleton width="w-1/2" height="h-4" className="mb-2" />
        <MobileSkeleton width="w-3/4" height="h-3" />
      </div>
      <MobileSkeleton width="w-12" height="h-12" className="rounded-xl" />
    </div>
    <div className="mb-6">
      <MobileSkeleton width="w-1/3" height="h-8" />
    </div>
    <div className="flex items-center space-x-2">
      <MobileSkeleton width="w-4" height="h-4" className="rounded" />
      <MobileSkeleton width="w-16" height="h-4" />
    </div>
  </div>
);

export default MobileLoading;
