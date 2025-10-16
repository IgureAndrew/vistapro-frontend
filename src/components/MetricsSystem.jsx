import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const MetricsSystem = ({ 
  metrics = [], 
  stats = {}, 
  user = {}, 
  userRole = 'masteradmin',
  isLoading = false 
}) => {
  // Helper function to format currency
  const formatCurrency = (amount) => {
    try {
      const value = Number(amount || 0);
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 2
      }).format(value);
    } catch {
      return `₦${(amount || 0).toString()}`;
    }
  };

  // Helper function to compute change
  const computeChange = (current, previous) => {
    if (!previous || previous === 0) {
      return { text: 'N/A', trend: 'flat' };
    }
    
    const change = ((current - previous) / previous) * 100;
    const absChange = Math.abs(change);
    
    if (change > 0) {
      return { text: `+${absChange.toFixed(1)}%`, trend: 'up' };
    } else if (change < 0) {
      return { text: `-${absChange.toFixed(1)}%`, trend: 'down' };
    } else {
      return { text: '0%', trend: 'flat' };
    }
  };

  // Get metric value based on key
  const getMetricValue = (key) => {
    switch (key) {
      case 'totalUsers':
        return stats.totalUsers?.toLocaleString() || '0';
      case 'totalOrders':
        return (stats.totalPendingOrders + stats.totalConfirmedOrders)?.toLocaleString() || '0';
      case 'totalConfirmedOrders':
        return stats.totalConfirmedOrders?.toLocaleString() || '0';
      case 'totalPendingOrders':
        return stats.totalPendingOrders?.toLocaleString() || '0';
      case 'totalSales':
        return formatCurrency(stats.totalSales);
      case 'totalPickupStocks':
        return stats.totalPickupStocks?.toLocaleString() || '0';
      case 'pendingVerification':
        return stats.pendingVerification?.toLocaleString() || '0';
      case 'assignedUsers':
        return stats.assignedUsers?.toLocaleString() || '0';
      case 'assignedMarketers':
        return stats.assignedMarketers?.toLocaleString() || '0';
      case 'verificationStatus':
        return user?.overall_verification_status === 'approved' ? 'Approved' : 'Pending';
      case 'walletBalance':
        return formatCurrency(stats.walletBalance);
      default:
        return '0';
    }
  };

  // Get metric change based on key
  const getMetricChange = (key) => {
    switch (key) {
      case 'totalUsers':
        return computeChange(stats.totalUsers, stats.previousTotalUsers);
      case 'totalOrders':
        return computeChange(
          stats.totalPendingOrders + stats.totalConfirmedOrders,
          stats.previousPendingOrders + stats.previousConfirmedOrders
        );
      case 'totalConfirmedOrders':
        return computeChange(stats.totalConfirmedOrders, stats.previousConfirmedOrders);
      case 'totalPendingOrders':
        return computeChange(stats.totalPendingOrders, stats.previousPendingOrders);
      case 'totalSales':
        return computeChange(stats.totalSales, stats.previousSales);
      case 'totalPickupStocks':
        return computeChange(stats.totalPickupStocks, stats.previousPickupStocks);
      case 'pendingVerification':
        return computeChange(stats.pendingVerification, stats.previousPendingVerification);
      case 'assignedUsers':
        return computeChange(stats.assignedUsers, stats.previousAssignedUsers);
      case 'assignedMarketers':
        return computeChange(stats.assignedMarketers, stats.previousAssignedMarketers);
      case 'verificationStatus':
        return { text: user?.overall_verification_status === 'approved' ? '✓' : '⏳', trend: user?.overall_verification_status === 'approved' ? 'up' : 'pending' };
      case 'walletBalance':
        return computeChange(stats.walletBalance, stats.previousWalletBalance);
      default:
        return { text: 'N/A', trend: 'flat' };
    }
  };

  // Get trend icon
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get trend color class
  const getTrendColorClass = (trend) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 w-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics || metrics.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">No metrics available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        const value = getMetricValue(metric.key);
        const change = getMetricChange(metric.key);
        const trendIcon = getTrendIcon(change.trend);
        const trendColorClass = getTrendColorClass(change.trend);

        return (
          <Card key={metric.key} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.label}
              </CardTitle>
              <Icon className={`h-4 w-4 text-${metric.color}-500`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
              <div className="flex items-center space-x-1 mt-1">
                {trendIcon}
                <span className={`text-xs ${trendColorClass}`}>
                  {change.text}
                </span>
                {change.trend !== 'flat' && (
                  <span className="text-xs text-muted-foreground">from last period</span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MetricsSystem;
