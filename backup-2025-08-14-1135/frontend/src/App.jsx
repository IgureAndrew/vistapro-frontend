// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import MasterAdminDashboard from "./components/MasterAdminDashboard";
import SuperAdminDashboard from "./components/SuperAdminDashboard";
import AdminDashboard from "./components/AdminDashboard";
import DealerDashboard from "./components/DealerDashboard";
import MarketerDashboard from "./components/MarketerDashboard";
import PrivateRoute from "./components/PrivateRoute";
import SubmissionUnderReview from "./components/SubmissionUnderReview";
import EmailVerification from "./components/EmailVerification";
import PasswordReset from "./components/PasswordReset";



function App() {
  return (
       

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/verify-email" element={<EmailVerification />} />
        <Route path="/reset-password" element={<PasswordReset />} />
        <Route 
          path="/dashboard/masteradmin" 
          element={
            <PrivateRoute allowedRoles={["MasterAdmin"]}>
              <MasterAdminDashboard />
            </PrivateRoute>
          }
        />
        <Route 
          path="/dashboard/superadmin" 
          element={
            <PrivateRoute allowedRoles={["SuperAdmin"]}>
              <SuperAdminDashboard />
            </PrivateRoute>
          }
        />
        <Route 
          path="/dashboard/admin" 
          element={
            <PrivateRoute allowedRoles={["Admin"]}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/dealer"
          element={
            <PrivateRoute allowedRoles={["Dealer"]}>
              <DealerDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/marketer"
          element={
            <PrivateRoute allowedRoles={["Marketer"]}>
              <MarketerDashboard />
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
    
  );
}

export default App;
