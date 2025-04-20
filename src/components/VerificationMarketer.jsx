import React, { useState, useEffect } from "react";
import ApplicantBiodataForm from "./ApplicantBiodataForm";
import ApplicantGuarantorForm from "./ApplicantGuarantorForm";
import ApplicantCommitmentForm from "./ApplicantCommitmentForm";

const VerificationMarketer = ({ onComplete }) => {
  // 1) Load user & step from localStorage
  const storedUser = localStorage.getItem("user");
  const [user, setUser] = useState(storedUser ? JSON.parse(storedUser) : null);

  const [resetForm, setResetForm] = useState(null);
  const [step, setStep] = useState(() => {
    const s = localStorage.getItem("verificationStep");
    return s ? Number(s) : 1;
  });

  // Helper to list which forms are still incomplete
  const getIncompleteForms = u => {
    const arr = [];
    if (!u.bio_submitted)       arr.push("biodata");
    if (!u.guarantor_submitted) arr.push("guarantor");
    if (!u.commitment_submitted)arr.push("commitment");
    return arr;
  };

  // 2) On mount / user change: handle admin resets or resume logic
  useEffect(() => {
    if (!user) return;

    // Admin may have forced a reset of one form
    const adminReset = localStorage.getItem("resetFormType");
    if (adminReset) {
      setResetForm(adminReset);
      localStorage.removeItem("verificationStep");
      localStorage.removeItem("resetFormType");
      return;
    }

    // No override → clear resetForm
    setResetForm(null);

    // Check which remain
    const incomplete = getIncompleteForms(user);
    if (incomplete.length === 0) {
      // All done
      localStorage.removeItem("verificationStep");
      onComplete?.();
    } else if (incomplete.length === 1) {
      // Exactly one left: force that form
      setResetForm(incomplete[0]);
    }
    // else: more than one left → leave `step` intact so we resume normal sequence
  }, [user, onComplete]);

  // 3) Persist step whenever it changes (unless admin override is active)
  useEffect(() => {
    if (!resetForm) {
      localStorage.setItem("verificationStep", step);
    }
  }, [step, resetForm]);

  // 4) When each form finishes, update flags & advance
  const handleFormSuccess = formType => {
    // flip the corresponding flag
    const flagMap = {
      biodata:    "bio_submitted",
      guarantor:  "guarantor_submitted",
      commitment: "commitment_submitted",
    };
    const key = flagMap[formType];
    const updated = { ...user, [key]: true };
    setUser(updated);
    localStorage.setItem("user", JSON.stringify(updated));

    // clear any admin override
    if (resetForm === formType) {
      setResetForm(null);
    }

    // recalc
    const incomplete = getIncompleteForms(updated);
    if (incomplete.length === 0) {
      localStorage.removeItem("verificationStep");
      onComplete?.();
    } else if (incomplete.length === 1) {
      // only one left → force it
      setResetForm(incomplete[0]);
    } else {
      // multiple left → next step
      setStep(prev => prev + 1);
    }
  };

  // 5) Render logic
  const renderForm = () => {
    // A) admin override
    if (resetForm === "biodata") {
      return <ApplicantBiodataForm  onSuccess={() => handleFormSuccess("biodata")} />;
    }
    if (resetForm === "guarantor") {
      return <ApplicantGuarantorForm onSuccess={() => handleFormSuccess("guarantor")} />;
    }
    if (resetForm === "commitment") {
      return <ApplicantCommitmentForm onSuccess={() => handleFormSuccess("commitment")} />;
    }

    // B) normal step flow
    if (step === 1) {
      return <ApplicantBiodataForm
        onSuccess={() => { alert("Biodata submitted!"); setStep(2); }}
      />;
    }
    if (step === 2) {
      return <ApplicantGuarantorForm
        onSuccess={() => { alert("Guarantor form done!"); setStep(3); }}
      />;
    }
    if (step === 3) {
      return <ApplicantCommitmentForm
        onSuccess={() => {
          alert("Commitment complete! Awaiting review.");
          localStorage.removeItem("verificationStep");
          onComplete?.();
        }}
      />;
    }

    // fallback (shouldn’t happen)
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
