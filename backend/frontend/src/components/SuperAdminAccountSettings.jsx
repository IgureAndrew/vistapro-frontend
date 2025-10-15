import React from "react";
import ModernAccountSettings from "./ModernAccountSettings";

function SuperAdminAccountSettings() {
  return (
    <ModernAccountSettings 
      userRole="SuperAdmin" 
      roleDisplayName="Super Admin" 
    />
  );
}

export default SuperAdminAccountSettings;