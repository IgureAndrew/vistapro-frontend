import React from "react";
import ModernAccountSettings from "./ModernAccountSettings";

const ProfileUpdate = ({ onNavigate }) => {
  // Get user role from localStorage user object
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userRole = user?.role || "Admin";
  
  // Map role to display name
  const getRoleDisplayName = (role) => {
    switch (role) {
      case "MasterAdmin":
        return "Master Admin";
      case "SuperAdmin":
        return "Super Admin";
      case "Admin":
        return "Admin";
      case "Dealer":
        return "Dealer";
      case "Marketer":
        return "Marketer";
      default:
        return "User";
    }
  };

  return (
    <ModernAccountSettings 
      userRole={userRole} 
      roleDisplayName={getRoleDisplayName(userRole)}
      onNavigate={onNavigate}
    />
  );
};

export default ProfileUpdate;