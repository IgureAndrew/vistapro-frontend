// src/components/DashboardOverview.jsx
import React from "react";

function DashboardOverview({
  metrics = {
    totalUsers: 0,
    activeSessions: 0,
    recentRegistrations: 0,
    pendingApprovals: 0,
  },
}) {
  return (
    <div className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold text-gray-700">Total Users</h2>
          <p className="text-2xl font-bold text-blue-600">
            {metrics.totalUsers}
          </p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold text-gray-700">Active Sessions</h2>
          <p className="text-2xl font-bold text-blue-600">
            {metrics.activeSessions}
          </p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold text-gray-700">Recent Registrations</h2>
          <p className="text-2xl font-bold text-blue-600">
            {metrics.recentRegistrations}
          </p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold text-gray-700">Pending Approvals</h2>
          <p className="text-2xl font-bold text-blue-600">
            {metrics.pendingApprovals}
          </p>
        </div>
      </div>
    </div>
  );
}

export default DashboardOverview;
