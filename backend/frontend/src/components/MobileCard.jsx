// src/components/MobileCard.jsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ChevronRight, ExternalLink, Eye, Edit, Trash2, MoreHorizontal } from 'lucide-react';

const MobileCard = ({
  title,
  subtitle,
  description,
  value,
  change,
  trend,
  status,
  icon: Icon,
  color = 'blue',
  onClick,
  actions = [],
  children,
  className = "",
  compact = false
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    gray: 'bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400'
  };

  const statusColors = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    sold: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    expired: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  };

  const formatValue = (val) => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `₦${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `₦${(val / 1000).toFixed(1)}K`;
      }
      return `₦${val.toLocaleString()}`;
    }
    return val;
  };

  const getTrendIcon = (trend) => {
    if (trend === 'up') return '↗';
    if (trend === 'down') return '↘';
    return '→';
  };

  const getTrendColor = (trend) => {
    if (trend === 'up') return 'text-green-600 dark:text-green-400';
    if (trend === 'down') return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div 
      className={`mobile-card mobile-shadow ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <div className={`flex items-center justify-between ${compact ? 'mb-2' : 'mb-4'}`}>
        <div className="flex items-center space-x-3">
          {Icon && (
            <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
              <Icon className="h-6 w-6" />
            </div>
          )}
          <div>
            <h3 className={`${compact ? 'text-title-medium' : 'text-title-large'} font-semibold text-gray-900 dark:text-white`}>
              {title}
            </h3>
            {subtitle && (
              <p className="text-body-small text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {status && (
            <Badge className={statusColors[status] || statusColors.inactive}>
              {status}
            </Badge>
          )}
          
          {actions.length > 0 && (
            <div className="flex space-x-1">
              {actions.slice(0, 2).map((action, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick();
                  }}
                  className="p-2 h-10 w-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 touch-target"
                >
                  <action.icon className="h-5 w-5" />
                </button>
              ))}
              {actions.length > 2 && (
                <button className="p-2 h-10 w-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 touch-target">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              )}
            </div>
          )}
          
          {onClick && (
            <ChevronRight className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>
      
      <div className={compact ? 'pt-0' : 'pt-0'}>
        {description && (
          <p className="text-body-medium text-gray-600 dark:text-gray-300 mb-4">
            {description}
          </p>
        )}
        
        {value !== undefined && (
          <div className="flex items-center justify-between">
            <div>
              <p className={`${compact ? 'text-headline-small' : 'text-headline-medium'} font-bold text-gray-900 dark:text-white`}>
                {formatValue(value)}
              </p>
              {change && (
                <p className={`text-body-small ${getTrendColor(trend)}`}>
                  {getTrendIcon(trend)} {change}
                </p>
              )}
            </div>
          </div>
        )}
        
        {children}
      </div>
    </div>
  );
};

// Specialized card components for common use cases
export const MetricCard = ({ title, value, change, trend, icon, color = 'blue', onClick }) => (
  <MobileCard
    title={title}
    value={value}
    change={change}
    trend={trend}
    icon={icon}
    color={color}
    onClick={onClick}
    compact
  />
);

export const StatusCard = ({ title, subtitle, status, description, icon, color = 'blue', onClick }) => (
  <MobileCard
    title={title}
    subtitle={subtitle}
    description={description}
    status={status}
    icon={icon}
    color={color}
    onClick={onClick}
  />
);

export const ActionCard = ({ title, subtitle, description, actions, icon, color = 'blue', onClick }) => (
  <MobileCard
    title={title}
    subtitle={subtitle}
    description={description}
    actions={actions}
    icon={icon}
    color={color}
    onClick={onClick}
  />
);

export default MobileCard;
