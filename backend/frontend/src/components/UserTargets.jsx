// src/components/UserTargets.jsx
// Component for displaying user's targets with percentage information

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Target, TrendingUp, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { targetApiService } from '../api/targetApi';
import { useAuth } from '../contexts/AuthContext';

const UserTargets = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const userRole = user?.role;
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState({});

  useEffect(() => {
    if (userId) {
      loadUserTargets();
      loadUserPerformance();
    }
  }, [userId]);

  const loadUserTargets = async () => {
    try {
      setLoading(true);
      const response = await targetManagementApiService.getUserTargets(userId);
      setTargets(response.data || []);
    } catch (error) {
      console.error('Error loading user targets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserPerformance = async () => {
    try {
      // This would typically come from a performance API
      // For now, we'll simulate some performance data
      const mockPerformance = {
        orders: 15, // Actual orders completed
        sales: 45000, // Actual sales amount
        recruitment: 2 // Actual recruitment count
      };
      setPerformance(mockPerformance);
    } catch (error) {
      console.error('Error loading user performance:', error);
    }
  };

  const calculateProgress = (target, performance) => {
    if (!target || !performance) return 0;
    
    const targetValue = target.calculated_target_value || target.target_value;
    let actualValue = 0;
    
    switch (target.target_type_name) {
      case 'orders':
        actualValue = performance.orders || 0;
        break;
      case 'sales':
        actualValue = performance.sales || 0;
        break;
      case 'recruitment':
        actualValue = performance.recruitment || 0;
        break;
      default:
        actualValue = 0;
    }
    
    return Math.min((actualValue / targetValue) * 100, 100);
  };

  const getProgressColor = (progress) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getProgressStatus = (progress) => {
    if (progress >= 100) return { text: 'Completed', icon: CheckCircle, color: 'text-green-600' };
    if (progress >= 75) return { text: 'On Track', icon: TrendingUp, color: 'text-blue-600' };
    if (progress >= 50) return { text: 'Progressing', icon: AlertCircle, color: 'text-yellow-600' };
    return { text: 'Behind Target', icon: AlertCircle, color: 'text-red-600' };
  };

  const formatTargetValue = (target) => {
    const value = target.calculated_target_value || target.target_value;
    const unit = target.metric_unit || '';
    
    if (target.target_type_name === 'sales') {
      return `₦${value.toLocaleString()}`;
    }
    
    return `${value.toLocaleString()} ${unit}`;
  };

  const getActualValue = (target) => {
    switch (target.target_type_name) {
      case 'orders':
        return performance.orders || 0;
      case 'sales':
        return performance.sales || 0;
      case 'recruitment':
        return performance.recruitment || 0;
      default:
        return 0;
    }
  };

  const formatActualValue = (target) => {
    const value = getActualValue(target);
    
    if (target.target_type_name === 'sales') {
      return `₦${value.toLocaleString()}`;
    }
    
    return `${value.toLocaleString()} ${target.metric_unit || ''}`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>My Targets</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (targets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>My Targets</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Targets Set</h3>
            <p className="text-gray-500">
              You don't have any performance targets assigned yet. Contact your admin to set up targets.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Target className="h-5 w-5" />
          <span>My Performance Targets</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Track your progress against assigned targets
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {targets.map((target) => {
          const progress = calculateProgress(target, performance);
          const status = getProgressStatus(progress);
          const StatusIcon = status.icon;
          
          return (
            <div key={target.id} className="border rounded-lg p-4 space-y-4">
              {/* Target Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline" className="text-sm">
                    {target.target_percentage ? `${target.target_percentage}%` : 'Custom'}
                  </Badge>
                  <h3 className="font-semibold text-lg capitalize">
                    {target.target_type_name} Target
                  </h3>
                  {target.bnpl_platform && (
                    <Badge variant="secondary" className="text-xs">
                      {target.bnpl_platform}
                    </Badge>
                  )}
                </div>
                
                <div className={`flex items-center space-x-2 ${status.color}`}>
                  <StatusIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">{status.text}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {formatActualValue(target)} / {formatTargetValue(target)}
                  </span>
                  <span className="font-medium">{progress.toFixed(1)}%</span>
                </div>
                <Progress 
                  value={progress} 
                  className="h-2"
                />
              </div>

              {/* Target Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Period:</span>
                  <span className="ml-2 font-medium capitalize">{target.period_type}</span>
                </div>
                <div>
                  <span className="text-gray-500">Due Date:</span>
                  <span className="ml-2 font-medium">
                    {new Date(target.period_end).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Percentage Information */}
              {target.target_percentage && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2 text-blue-800">
                    <Target className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Target: {target.target_percentage}% of {target.target_type_name} capacity
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    This target represents {target.target_percentage}% of the total {target.target_type_name} capacity for your region/platform.
                  </p>
                </div>
              )}

              {/* Progress Insights */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {progress >= 100 
                      ? "🎉 Target achieved! Great job!"
                      : progress >= 75
                      ? "📈 You're on track to meet your target"
                      : progress >= 50
                      ? "⚠️ You're halfway there, keep going!"
                      : "🚀 Time to accelerate your efforts"
                    }
                  </span>
                  <span className="text-gray-500">
                    {progress >= 100 
                      ? "Completed"
                      : `${((target.calculated_target_value || target.target_value) - getActualValue(target)).toLocaleString()} ${target.metric_unit || 'units'} remaining`
                    }
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default UserTargets;
