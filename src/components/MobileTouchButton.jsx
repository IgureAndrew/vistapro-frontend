// src/components/MobileTouchButton.jsx
import React from 'react';
import { cn } from '../lib/utils';

const MobileTouchButton = ({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon: Icon,
  className = '',
  ...props
}) => {
  const baseClasses = 'mobile-button touch-target relative overflow-hidden';
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300',
    success: 'bg-green-600 hover:bg-green-700 text-white shadow-md',
    warning: 'bg-orange-500 hover:bg-orange-600 text-white shadow-md',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-md',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700',
  };
  
  const sizeClasses = {
    small: 'px-4 py-2 mobile-body-small min-h-[40px]',
    medium: 'px-6 py-3 mobile-button-text min-h-[48px]',
    large: 'px-8 py-4 mobile-body-large min-h-[56px]',
  };
  
  const disabledClasses = disabled 
    ? 'opacity-50 cursor-not-allowed pointer-events-none' 
    : '';
  
  const loadingClasses = loading 
    ? 'cursor-wait pointer-events-none' 
    : '';

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        disabledClasses,
        loadingClasses,
        className
      )}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {/* Ripple effect overlay */}
      <div className="absolute inset-0 bg-white opacity-0 transition-opacity duration-200 active:opacity-20" />
      
      {/* Content */}
      <div className="relative flex items-center justify-center gap-2">
        {loading && (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {Icon && !loading && <Icon className="w-5 h-5" />}
        {children}
      </div>
    </button>
  );
};

export default MobileTouchButton;
