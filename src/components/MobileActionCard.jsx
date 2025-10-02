import React from 'react';
import { ChevronRight, ArrowUpRight, ExternalLink } from 'lucide-react';

const MobileActionCard = ({ 
  title, 
  description, 
  icon, 
  onClick, 
  variant = 'primary',
  size = 'medium',
  disabled = false,
  badge = null
}) => {
  // Variant styles
  const variants = {
    primary: {
      bg: 'bg-white',
      border: 'border-gray-200',
      hover: 'hover:bg-gray-50 hover:border-gray-300',
      text: 'text-gray-900',
      description: 'text-gray-600'
    },
    secondary: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      hover: 'hover:bg-blue-100 hover:border-blue-300',
      text: 'text-blue-900',
      description: 'text-blue-700'
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      hover: 'hover:bg-green-100 hover:border-green-300',
      text: 'text-green-900',
      description: 'text-green-700'
    },
    warning: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      hover: 'hover:bg-orange-100 hover:border-orange-300',
      text: 'text-orange-900',
      description: 'text-orange-700'
    },
    danger: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      hover: 'hover:bg-red-100 hover:border-red-300',
      text: 'text-red-900',
      description: 'text-red-700'
    }
  };

  // Size variants
  const sizes = {
    small: {
      card: 'p-4',
      icon: 'w-8 h-8',
      title: 'text-sm font-semibold',
      description: 'text-xs',
      iconSize: 'w-4 h-4'
    },
    medium: {
      card: 'p-6',
      icon: 'w-12 h-12',
      title: 'text-base font-semibold',
      description: 'text-sm',
      iconSize: 'w-5 h-5'
    },
    large: {
      card: 'p-8',
      icon: 'w-16 h-16',
      title: 'text-lg font-semibold',
      description: 'text-base',
      iconSize: 'w-6 h-6'
    }
  };

  const variantStyles = variants[variant] || variants.primary;
  const sizeStyles = sizes[size] || sizes.medium;

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  return (
    <div 
      className={`
        mobile-card 
        ${sizeStyles.card} 
        ${variantStyles.bg} 
        ${variantStyles.border} 
        ${!disabled ? variantStyles.hover : ''} 
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        transition-all duration-200
        group
      `}
      onClick={handleClick}
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className={`
          ${sizeStyles.icon} 
          ${variantStyles.text} 
          flex items-center justify-center 
          rounded-xl 
          flex-shrink-0
          group-hover:scale-105 
          transition-transform duration-200
        `}>
          {icon}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className={`mobile-h6 ${variantStyles.text} mb-1`}>
                {title}
              </h3>
              {description && (
                <p className={`mobile-body-small ${variantStyles.description}`}>
                  {description}
                </p>
              )}
            </div>
            
            {/* Badge */}
            {badge && (
              <div className="ml-2 flex-shrink-0">
                <span className="mobile-badge-text inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                  {badge}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Arrow */}
        <div className={`
          ${sizeStyles.iconSize} 
          ${variantStyles.text} 
          flex-shrink-0
          group-hover:translate-x-1 
          transition-transform duration-200
        `}>
          <ChevronRight className="w-full h-full" />
        </div>
      </div>
    </div>
  );
};

export default MobileActionCard;
