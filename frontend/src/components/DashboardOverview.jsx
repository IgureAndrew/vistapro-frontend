// src/components/DashboardOverview.jsx
/**
 * Generic Dashboard Overview Template
 * 
 * This component serves as a wrapper that automatically renders
 * the correct role-specific overview component based on user role.
 * 
 * It maintains backward compatibility with all existing overview
 * components while providing a unified interface.
 */

import React from 'react';
import MasterAdminOverview from './MasterAdminOverview';
import SuperAdminOverview from './SuperAdminOverview';
import AdminOverview from './AdminOverview';
import MarketerOverview from './MarketerOverview';
import DealerOverview from './DealerOverview';

const DashboardOverview = ({ userRole, onNavigate, isDarkMode }) => {
  // Map roles to their specific overview components
  const overviewComponents = {
    masteradmin: MasterAdminOverview,
    superadmin: SuperAdminOverview,
    admin: AdminOverview,
    marketer: MarketerOverview,
    dealer: DealerOverview,
  };

  // Get the appropriate component for the current role
  const OverviewComponent = overviewComponents[userRole];

  // Fallback if role not found
  if (!OverviewComponent) {
    return (
      <div className="w-full p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Overview Not Available
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          No overview found for role: {userRole}
        </p>
      </div>
    );
  }

  // Render the role-specific overview component
  return <OverviewComponent onNavigate={onNavigate} isDarkMode={isDarkMode} />;
};

export default DashboardOverview;
