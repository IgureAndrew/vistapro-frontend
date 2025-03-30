// src/components/DashboardOverview.jsx
import React from "react";
import { User, ShoppingCart, CheckCircle, Clock, Activity } from "lucide-react";

function DashboardOverview({
  metrics = {
    totalUsers: 0,
    activeSessions: 0,
    recentRegistrations: 0,
    pendingApprovals: 0,
    totalOrders: 0,
    totalSales: 0,
  },
}) {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <User className="w-10 h-10 mr-4 text-gray-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-700">Total Users</h2>
              <p className="text-3xl font-bold text-gray-800">{metrics.totalUsers}</p>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <ShoppingCart className="w-10 h-10 mr-4 text-gray-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-700">Total Orders</h2>
              <p className="text-3xl font-bold text-gray-800">{metrics.totalOrders}</p>
            </div>
          </div>
        </div>

        {/* Recent Registrations */}
        <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <CheckCircle className="w-10 h-10 mr-4 text-gray-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-700">Recent Registrations</h2>
              <p className="text-3xl font-bold text-gray-800">{metrics.recentRegistrations}</p>
            </div>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Clock className="w-10 h-10 mr-4 text-gray-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-700">Pending Approvals</h2>
              <p className="text-3xl font-bold text-gray-800">{metrics.pendingApprovals}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Section */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Sessions */}
        <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Activity className="w-10 h-10 mr-4 text-gray-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-700">Active Sessions</h2>
              <p className="text-3xl font-bold text-gray-800">{metrics.activeSessions}</p>
            </div>
          </div>
        </div>
        {/* Total Sales */}
        <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <ShoppingCart className="w-10 h-10 mr-4 text-gray-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-700">Total Sales</h2>
              <p className="text-3xl font-bold text-gray-800">{metrics.totalSales}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardOverview;
