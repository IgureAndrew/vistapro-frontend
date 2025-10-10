import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const MobileMetricCard = ({ 
  title, 
  value, 
  trend, 
  subtitle, 
  icon, 
  color = 'blue',
  size = 'medium' 
}) => {
  // Color variants
  const colorVariants = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      icon: 'text-blue-500',
      trend: 'text-blue-600'
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      icon: 'text-green-500',
      trend: 'text-green-600'
    },
    orange: {
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      icon: 'text-orange-500',
      trend: 'text-orange-600'
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      icon: 'text-purple-500',
      trend: 'text-purple-600'
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      icon: 'text-red-500',
      trend: 'text-red-600'
    },
    gray: {
      bg: 'bg-gray-50',
      text: 'text-gray-600',
      icon: 'text-gray-500',
      trend: 'text-gray-600'
    }
  };

  // Size variants
  const sizeVariants = {
    small: {
      card: 'p-4',
      title: 'text-sm font-medium',
      value: 'text-lg font-bold',
      subtitle: 'text-xs',
      icon: 'w-8 h-8'
    },
    medium: {
      card: 'p-6',
      title: 'text-sm font-medium',
      value: 'text-2xl font-bold',
      subtitle: 'text-sm',
      icon: 'w-10 h-10'
    },
    large: {
      card: 'p-8',
      title: 'text-base font-medium',
      value: 'text-3xl font-bold',
      subtitle: 'text-base',
      icon: 'w-12 h-12'
    }
  };

  const colors = colorVariants[color] || colorVariants.blue;
  const sizes = sizeVariants[size] || sizeVariants.medium;

  // Format trend value
  const formatTrend = (trendValue) => {
    if (!trendValue) return null;
    
    const isPositive = trendValue > 0;
    const isNegative = trendValue < 0;
    const isNeutral = trendValue === 0;
    
    const absValue = Math.abs(trendValue);
    const formattedValue = absValue >= 1000 
      ? `${(absValue / 1000).toFixed(1)}K` 
      : absValue.toString();
    
    return {
      value: formattedValue,
      isPositive,
      isNegative,
      isNeutral
    };
  };

  const trendData = formatTrend(trend);

  return (
    <div className={`mobile-metric-card mobile-shadow-md ${colors.bg} hover:shadow-lg transition-all duration-200`}>
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h3 className={`mobile-h6 ${colors.text} mb-2`}>
            {title}
          </h3>
          {subtitle && (
            <p className={`mobile-caption text-gray-500 dark:text-gray-400`}>
              {subtitle}
            </p>
          )}
        </div>
        
        {icon && (
          <div className={`w-12 h-12 ${colors.icon} flex-shrink-0 rounded-xl flex items-center justify-center`}>
            {icon}
          </div>
        )}
      </div>
      
      <div className="mb-6">
        <div className={`mobile-h3 text-gray-900 dark:text-white`}>
          {value}
        </div>
      </div>
      
      {trendData && (
        <div className="flex items-center gap-2">
          {trendData.isPositive && <TrendingUp className="w-5 h-5 text-green-500" />}
          {trendData.isNegative && <TrendingDown className="w-5 h-5 text-red-500" />}
          {trendData.isNeutral && <Minus className="w-5 h-5 text-gray-500" />}
          
          <span className={`mobile-caption font-semibold ${
            trendData.isPositive ? 'text-green-600' :
            trendData.isNegative ? 'text-red-600' :
            'text-gray-500'
          }`}>
            {trendData.isPositive ? '+' : ''}{trendData.value}%
          </span>
        </div>
      )}
    </div>
  );
};

export default MobileMetricCard;
