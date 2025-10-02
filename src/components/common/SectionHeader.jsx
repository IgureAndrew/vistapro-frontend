// Common reusable section header component
import React from 'react';

/**
 * SectionHeader - Reusable section header for dashboard sections
 * 
 * @param {Object} props
 * @param {string} props.title - Section title
 * @param {string} props.subtitle - Optional subtitle/description
 * @param {React.ReactNode} props.action - Optional action button/element
 * @param {React.Component} props.icon - Optional icon component
 * @param {string} props.className - Additional classes
 */
export const SectionHeader = ({
  title,
  subtitle,
  action,
  icon: Icon,
  className = ""
}) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-4 space-y-2 sm:space-y-0 ${className}`}>
      <div className="flex items-center space-x-2">
        {Icon && <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
};

export default SectionHeader;
