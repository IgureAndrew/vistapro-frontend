// src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import ModernUnifiedDashboard from "./components/ModernUnifiedDashboard";
import PrivateRoute from "./components/PrivateRoute";
import SubmissionUnderReview from "./components/SubmissionUnderReview";
import EmailVerification from "./components/EmailVerification";
import PasswordReset from "./components/PasswordReset";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/verify-email" element={<EmailVerification />} />
        <Route path="/reset-password" element={<PasswordReset />} />
        <Route 
          path="/dashboard/masteradmin" 
          element={
            <PrivateRoute allowedRoles={["MasterAdmin"]}>
              <ModernUnifiedDashboard userRole="masteradmin" />
            </PrivateRoute>
          }
        />
        <Route 
          path="/dashboard/superadmin" 
          element={
            <PrivateRoute allowedRoles={["SuperAdmin"]}>
              <ModernUnifiedDashboard userRole="superadmin" />
            </PrivateRoute>
          }
        />
        <Route 
          path="/dashboard/admin" 
          element={
            <PrivateRoute allowedRoles={["Admin"]}>
              <ModernUnifiedDashboard userRole="admin" />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/dealer"
          element={
            <PrivateRoute allowedRoles={["Dealer"]}>
              <ModernUnifiedDashboard userRole="dealer" />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/marketer"
          element={
            <PrivateRoute allowedRoles={["Marketer"]}>
              <ModernUnifiedDashboard userRole="marketer" />
            </PrivateRoute>
          }
        />
        {/* Updated Submission Under Review Route for Marketers */}
        <Route
          path="/submission-under-review"
          element={
            <PrivateRoute allowedRoles={["Marketer"]}>
              <SubmissionUnderReview />
            </PrivateRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
