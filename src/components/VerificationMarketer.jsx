// src/components/VerificationMarketer.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ApplicantBiodataForm from "./ApplicantBiodataForm";
import ApplicantGuarantorForm from "./ApplicantGuarantorForm";
import ApplicantCommitmentForm from "./ApplicantCommitmentForm";

const VerificationMarketer = () => {
  return (
    <Routes>
      <Route path="bio-data" element={<ApplicantBiodataForm />} />
      <Route path="guarantor" element={<ApplicantGuarantorForm />} />
      <Route path="commitment" element={<ApplicantCommitmentForm />} />
      {/* Redirect to biodata if no specific path is chosen */}
      <Route path="*" element={<Navigate to="bio-data" replace />} />
    </Routes>
  );
};

export default VerificationMarketer;
