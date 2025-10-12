// Common reusable welcome section component
import React from 'react';
import { Badge } from '@/components/ui/badge';

/**
 * WelcomeSection - Reusable welcome/header section for dashboards
 * 
 * @param {Object} props
 * @param {string} props.title - Main title text
 * @param {string} props.subtitle - Subtitle/description text
 * @param {string} props.gradientFrom - Tailwind gradient start color (e.g., "from-blue-50")
 * @param {string} props.gradientTo - Tailwind gradient end color (e.g., "to-indigo-50")
 * @param {React.Component} props.badge - Optional badge component to display
 * @param {React.ReactNode} props.children - Optional additional content
 * @param {string} props.className - Additional classes
 */
export const WelcomeSection = ({
  title,
  subtitle,
  gradientFrom = "from-blue-50",
  gradientTo = "to-indigo-50",
  badge,
  children,
  className = ""
}) => {
  return (
    <div className={`bg-gradient-to-r ${gradientFrom} ${gradientTo} dark:${gradientFrom.replace('50', '900/20')} dark:${gradientTo.replace('50', '900/20')} rounded-lg p-4 sm:p-6 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        
        {badge && (
          <div className="hidden md:block">
            {badge}
          </div>
        )}
      </div>
      
      {children}
    </div>
  );
};

export default WelcomeSection;
