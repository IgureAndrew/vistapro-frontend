// src/components/VerificationMarketer.jsx
import React, { useState, useEffect } from "react";
import ApplicantBiodataForm from "./ApplicantBiodataForm";
import ApplicantGuarantorForm from "./ApplicantGuarantorForm";
import ApplicantCommitmentForm from "./ApplicantCommitmentForm";

const VerificationMarketer = ({ onComplete }) => {
  // Retrieve the logged-in user from localStorage.
  const storedUser = localStorage.getItem("user");
  const [user, setUser] = useState(storedUser ? JSON.parse(storedUser) : null);
  // This state determines which form is forced to be re-submitted.
  const [currentForm, setCurrentForm] = useState(null);
  // Fallback step-based state in case more than one form is incomplete and no reset flag exists.
  const [step, setStep] = useState(1);

  // Helper function to determine which forms are incomplete from the user object flags.
  const getIncompleteForms = (userObj) => {
    const incomplete = [];
    // Here we assume that if a flag is true then that form was submitted.
    if (!userObj.bio_submitted) incomplete.push("biodata");
    if (!userObj.guarantor_submitted) incomplete.push("guarantor");
    if (!userObj.commitment_submitted) incomplete.push("commitment");
    return incomplete;
  };

  // On mount and whenever the user object changes, check if a reset flag is set.
  useEffect(() => {
    if (!user) return;

    // Check for a reset flag set by the master admin (persistently stored).
    const resetFormType = localStorage.getItem("resetFormType");
    if (resetFormType) {
      console.log("Reset form type found:", resetFormType);
      // Force the display of the reset form regardless of the user's verification flags.
      setCurrentForm(resetFormType);
      // Note: Do NOT remove the reset flag yet so that the reset state persists across sessions.
      return;
    }

    // If no reset flag is set, calculate incomplete forms based on the user's flags.
    const incompleteForms = getIncompleteForms(user);
    console.log("Incomplete forms from user flags:", incompleteForms);
    if (incompleteForms.length === 1) {
      setCurrentForm(incompleteForms[0]);
    } else if (incompleteForms.length > 1) {
      // Use step-based flow if more than one form is incomplete.
      const savedStep = localStorage.getItem("verificationStep");
      setStep(savedStep ? Number(savedStep) : 1);
      setCurrentForm(null); // currentForm remains null so the step-based flow takes over.
    } else {
      // All forms are complete.
      setCurrentForm(null);
      localStorage.removeItem("verificationStep");
      if (onComplete) onComplete();
    }
  }, [user, onComplete]);

  // Persist the current step in localStorage for the step-based fallback.
  useEffect(() => {
    localStorage.setItem("verificationStep", step);
  }, [step]);

  // Handler when a form submission is successful.
  const handleFormSuccess = (formType) => {
    // Update the user object (set the appropriate flag to true).
    const flagKey =
      formType === "biodata"
        ? "bio_submitted"
        : formType === "guarantor"
        ? "guarantor_submitted"
        : "commitment_submitted";

    const updatedUser = { ...user, [flagKey]: true };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));

    // If the reset flag is present and matches the current form, remove it now.
    const resetFormType = localStorage.getItem("resetFormType");
    if (resetFormType && resetFormType === formType) {
      localStorage.removeItem("resetFormType");
    }

    // Recalculate which forms remain incomplete.
    const incompleteForms = getIncompleteForms(updatedUser);
    if (incompleteForms.length === 1) {
      setCurrentForm(incompleteForms[0]);
    } else if (incompleteForms.length > 1) {
      // Advance the step for a step-based fallback.
      setStep((prev) => prev + 1);
      setCurrentForm(null);
    } else {
      // All forms are now complete.
      localStorage.removeItem("verificationStep");
      if (onComplete) onComplete();
    }
  };

  // Render the appropriate verification form.
  const renderForm = () => {
    // If a reset flag is set (or only one form is incomplete via user flags), show that form.
    if (currentForm === "biodata") {
      return (
        <ApplicantBiodataForm onSuccess={() => handleFormSuccess("biodata")} />
      );
    }
    if (currentForm === "guarantor") {
      return (
        <ApplicantGuarantorForm onSuccess={() => handleFormSuccess("guarantor")} />
      );
    }
    if (currentForm === "commitment") {
      return (
        <ApplicantCommitmentForm onSuccess={() => handleFormSuccess("commitment")} />
      );
    }

    // Fallback: If multiple forms are incomplete (and no explicit reset), use step-based navigation.
    if (!currentForm) {
      if (step === 1) {
        return (
          <ApplicantBiodataForm
            onSuccess={() => {
              alert("Biodata submitted successfully!");
              setStep(2);
            }}
          />
        );
      } else if (step === 2) {
        return (
          <ApplicantGuarantorForm
            onSuccess={() => {
              alert("Guarantor form submitted successfully!");
              setStep(3);
            }}
          />
        );
      } else if (step === 3) {
        return (
          <ApplicantCommitmentForm
            onSuccess={() => {
              alert(
                "Commitment form submitted successfully! Verification process completed. Await further review."
              );
              localStorage.removeItem("verificationStep");
              if (onComplete) onComplete();
            }}
          />
        );
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Marketer Verification</h2>
      {renderForm()}
    </div>
  );
};

export default VerificationMarketer;
