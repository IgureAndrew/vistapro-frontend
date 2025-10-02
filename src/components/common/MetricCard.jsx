// Common reusable metric card component
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * MetricCard - Reusable metric display card
 * 
 * @param {Object} props
 * @param {string} props.label - Metric label/title
 * @param {string|number} props.value - Main metric value
 * @param {string} props.description - Optional description text
 * @param {string|number} props.change - Optional percentage change
 * @param {React.Component} props.icon - Icon component from lucide-react
 * @param {string} props.iconColor - Tailwind color class for icon (e.g., "text-blue-600")
 * @param {string} props.iconBgColor - Tailwind background color for icon container (e.g., "bg-blue-100")
 * @param {string} props.className - Additional classes for the card
 */
export const MetricCard = ({
  label,
  value,
  description,
  change,
  icon: Icon,
  iconColor = "text-blue-600",
  iconBgColor = "bg-blue-100",
  className = ""
}) => {
  const hasPositiveChange = change && parseFloat(change) > 0;
  const hasNegativeChange = change && parseFloat(change) < 0;

  return (
    <Card className={`border border-gray-200 dark:border-gray-700 ${className}`}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          {Icon && (
            <div className={`p-2 sm:p-3 rounded-full ${iconBgColor} dark:${iconBgColor.replace('100', '900/30')}`}>
              <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColor} dark:${iconColor.replace('600', '400')}`} />
            </div>
          )}
        </div>
        
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
          {label}
        </p>
        
        <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">
          {value}
        </p>
        
        {(description || change) && (
          <div className="flex items-center mt-1 space-x-2">
            {change && (
              <span className={`text-xs flex items-center ${
                hasPositiveChange ? 'text-green-600 dark:text-green-400' :
                hasNegativeChange ? 'text-red-600 dark:text-red-400' :
                'text-gray-500 dark:text-gray-500'
              }`}>
                {hasPositiveChange && <TrendingUp className="w-3 h-3 mr-1" />}
                {hasNegativeChange && <TrendingDown className="w-3 h-3 mr-1" />}
                {change}
              </span>
            )}
            
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {description}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;
