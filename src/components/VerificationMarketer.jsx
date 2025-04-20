// src/components/VerificationMarketer.jsx
import React, { useState, useEffect } from "react";
import ApplicantBiodataForm from "./ApplicantBiodataForm";
import ApplicantGuarantorForm from "./ApplicantGuarantorForm";
import ApplicantCommitmentForm from "./ApplicantCommitmentForm";

const VerificationMarketer = ({ onComplete }) => {
  // 1) Load user & step from localStorage
  const storedUser = localStorage.getItem("user");
  const [user, setUser] = useState(storedUser ? JSON.parse(storedUser) : null);

  // resetForm holds a single form type if Admin forced a reset
  const [resetForm, setResetForm] = useState(null);

  // step is 1,2,3 in normal flow
  const [step, setStep] = useState(() => {
    const s = localStorage.getItem("verificationStep");
    return s ? Number(s) : 1;
  });

  // Utility to see which remain un‑submitted
  const getIncompleteForms = u => {
    const arr = [];
    if (!u.bio_submitted)       arr.push("biodata");
    if (!u.guarantor_submitted) arr.push("guarantor");
    if (!u.commitment_submitted)arr.push("commitment");
    return arr;
  };

  // 2) On mount / user change: handle Admin‐override or resume logic
  useEffect(() => {
    if (!user) return;

    // A) Admin may have injected a reset flag via localStorage
    const adminOverride = localStorage.getItem("resetFormType");
    if (adminOverride) {
      setResetForm(adminOverride);
      localStorage.removeItem("verificationStep");
      localStorage.removeItem("resetFormType");
      return;
    }

    // No override → clear resetForm
    setResetForm(null);

    // B) Check what’s left
    const incomplete = getIncompleteForms(user);

    if (incomplete.length === 0) {
      // All done → clear step & notify parent
      localStorage.removeItem("verificationStep");
      onComplete?.();
    }
    else if (incomplete.length === 1) {
      // Exactly one left → force that form
      setResetForm(incomplete[0]);
    }
    // else: more than one left → continue at saved step

  }, [user, onComplete]);

  // 3) Persist step whenever it changes (unless Admin override is active)
  useEffect(() => {
    if (!resetForm) {
      localStorage.setItem("verificationStep", step);
    }
  }, [step, resetForm]);

  // 4) When a form completes, flip its flag, update user & advance
  const handleFormSuccess = formType => {
    const flagMap = {
      biodata:    "bio_submitted",
      guarantor:  "guarantor_submitted",
      commitment: "commitment_submitted",
    };
    const key = flagMap[formType];
    const updated = { ...user, [key]: true };
    setUser(updated);
    localStorage.setItem("user", JSON.stringify(updated));

    // clear any override
    if (resetForm === formType) {
      setResetForm(null);
    }

    // recalc
    const incomplete = getIncompleteForms(updated);
    if (incomplete.length === 0) {
      localStorage.removeItem("verificationStep");
      onComplete?.();
    }
    else if (incomplete.length === 1) {
      setResetForm(incomplete[0]);
    }
    else {
      setStep(prev => prev + 1);
    }
  };

  // 5) Choose which form to render
  const renderForm = () => {
    // Admin override always wins
    if (resetForm === "biodata") {
      return <ApplicantBiodataForm  onSuccess={() => handleFormSuccess("biodata")} />;
    }
    if (resetForm === "guarantor") {
      return <ApplicantGuarantorForm onSuccess={() => handleFormSuccess("guarantor")} />;
    }
    if (resetForm === "commitment") {
      return <ApplicantCommitmentForm onSuccess={() => handleFormSuccess("commitment")} />;
    }

    // Otherwise follow the normal step sequence
    if (step === 1) {
      return <ApplicantBiodataForm
        onSuccess={() => handleFormSuccess("biodata")}
      />;
    }
    if (step === 2) {
      return <ApplicantGuarantorForm
        onSuccess={() => handleFormSuccess("guarantor")}
      />;
    }
    if (step === 3) {
      return <ApplicantCommitmentForm
        onSuccess={() => handleFormSuccess("commitment")}
      />;
    }

    return null;
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Marketer Verification</h2>
      {renderForm()}
    </div>
  );
};

export default VerificationMarketer;
