import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Simple chart components (we'll enhance these with proper chart libraries later)
const AreaChart = ({ data, title }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-medium">{title}</h3>
      <span className="text-sm text-gray-500">Last 6 months</span>
    </div>
    <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="w-32 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg mb-2"></div>
        <p className="text-sm text-gray-500">Sales Activity Chart</p>
      </div>
    </div>
  </div>
);

const BarChart = ({ data, title }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-medium">{title}</h3>
      <span className="text-sm text-gray-500">Monthly comparison</span>
    </div>
    <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-end space-x-2 h-20">
          {[40, 60, 45, 80, 55, 70].map((height, index) => (
            <div
              key={index}
              className="w-6 bg-gradient-to-t from-orange-400 to-orange-500 rounded-t"
              style={{ height: `${height}%` }}
            ></div>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-2">Performance Metrics</p>
      </div>
    </div>
  </div>
);

const LineChart = ({ data, title }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-medium">{title}</h3>
      <span className="text-sm text-gray-500">Trend analysis</span>
    </div>
    <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="w-32 h-16 border-2 border-green-400 rounded-lg mb-2 flex items-center justify-center">
          <div className="w-24 h-1 bg-green-400 rounded"></div>
        </div>
        <p className="text-sm text-gray-500">Growth Trend</p>
      </div>
    </div>
  </div>
);

export const getRoleCharts = (role) => {
  const chartConfigs = {
    masteradmin: [
      {
        title: "Sales Activity - Monthly",
        description: "Showing total sales for the last 6 months",
        component: <AreaChart title="Total Sales" />
      },
      {
        title: "User Growth",
        description: "New user registrations over time",
        component: <BarChart title="User Registrations" />
      }
    ],
    superadmin: [
      {
        title: "Team Performance",
        description: "Performance metrics for assigned teams",
        component: <AreaChart title="Team Performance" />
      },
      {
        title: "Commission Tracking",
        description: "Commission earnings over time",
        component: <LineChart title="Commission Trends" />
      }
    ],
    admin: [
      {
        title: "Marketer Performance",
        description: "Performance metrics for assigned marketers",
        component: <AreaChart title="Marketer Performance" />
      },
      {
        title: "Order Processing",
        description: "Order processing efficiency",
        component: <BarChart title="Processing Stats" />
      }
    ],
    dealer: [
      {
        title: "Sales Trends",
        description: "Sales performance over time",
        component: <AreaChart title="Sales Trends" />
      },
      {
        title: "Order Completion",
        description: "Order completion rates",
        component: <BarChart title="Completion Rates" />
      }
    ],
    marketer: [
      {
        title: "Sales Performance",
        description: "Personal sales performance",
        component: <AreaChart title="Sales Performance" />
      },
      {
        title: "Pickup Activity",
        description: "Stock pickup trends",
        component: <LineChart title="Pickup Trends" />
      }
    ]
  };

  return chartConfigs[role] || chartConfigs.masteradmin;
};

export { AreaChart, BarChart, LineChart };
