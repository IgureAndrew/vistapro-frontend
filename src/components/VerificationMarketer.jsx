import React, { useState, useEffect } from "react";
import ApplicantBiodataForm from "./ApplicantBiodataForm";
import ApplicantGuarantorForm from "./ApplicantGuarantorForm";
import ApplicantCommitmentForm from "./ApplicantCommitmentForm";

const VerificationMarketer = ({ onComplete }) => {
  // Retrieve logged-in user from localStorage.
  const storedUser = localStorage.getItem("user");
  const [user, setUser] = useState(storedUser ? JSON.parse(storedUser) : null);
  // This state holds which form (if any) is forced to reset by admin.
  const [resetForm, setResetForm] = useState(null);
  // This state holds the current step in the verification process (for resuming).
  const [step, setStep] = useState(() => {
    const savedStep = localStorage.getItem("verificationStep");
    return savedStep ? Number(savedStep) : 1;
  });
  // You can also persist partial form data if needed:
  // const [savedFormData, setSavedFormData] = useState(() => JSON.parse(localStorage.getItem("verificationData")) || {});

  // Helper: determine incomplete forms from user flags.
  const getIncompleteForms = (userObj) => {
    const incomplete = [];
    if (!userObj.bio_submitted) incomplete.push("biodata");
    if (!userObj.guarantor_submitted) incomplete.push("guarantor");
    if (!userObj.commitment_submitted) incomplete.push("commitment");
    return incomplete;
  };

  // On mount (and whenever the user changes), check for admin override via a reset flag.
  useEffect(() => {
    if (!user) return;
    // Check if admin has sent a reset flag (set via Socket.IO event)
    const adminReset = localStorage.getItem("resetFormType");
    if (adminReset) {
      // Set the reset flag in state.
      setResetForm(adminReset);
      // Clear the saved step/data so that the reset form is immediately shown.
      localStorage.removeItem("verificationStep");
      // You might also want to clear any partial data.
      // localStorage.removeItem("verificationData");
      return;
    }
    // Otherwise, determine incomplete forms.
    const incompleteForms = getIncompleteForms(user);
    console.log("Incomplete forms from user flags:", incompleteForms);
    if (incompleteForms.length === 1) {
      // If exactly one incomplete form, resume with that form.
      setResetForm(null);
      setStep(0); // Not using step-based flow.
    } else if (incompleteForms.length > 1) {
      // Use step-based flow: the user resumes from the saved step.
      setResetForm(null);
      // The step value was already restored from localStorage in useState initializer.
    } else {
      // All forms complete.
      setResetForm(null);
      localStorage.removeItem("verificationStep");
      if (onComplete) onComplete();
    }
  }, [user, onComplete]);

  // Persist the current step (if not reset).
  useEffect(() => {
    // Only store the step if no reset flag is active.
    if (!resetForm) {
      localStorage.setItem("verificationStep", step);
      // Optionally, store partial data as JSON.
      // localStorage.setItem("verificationData", JSON.stringify(savedFormData));
    }
  }, [step, resetForm]);

  // When a form submission is successful, update user flags and progress.
  const handleFormSuccess = (formType) => {
    const flagKey =
      formType === "biodata"
        ? "bio_submitted"
        : formType === "guarantor"
        ? "guarantor_submitted"
        : "commitment_submitted";

    // Update the local user object.
    const updatedUser = { ...user, [flagKey]: true };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));

    // Clear any admin reset flag for that form.
    if (resetForm === formType) {
      setResetForm(null);
    }

    // Recalculate incomplete forms.
    const incompleteForms = getIncompleteForms(updatedUser);
    if (incompleteForms.length === 0) {
      localStorage.removeItem("verificationStep");
      if (onComplete) onComplete();
    } else if (incompleteForms.length === 1) {
      // If exactly one remains incomplete, force it.
      setResetForm(incompleteForms[0]);
    } else {
      // More than one incomplete: advance to next step.
      setStep((prev) => prev + 1);
    }
  };

  // Render the appropriate form.
  const renderForm = () => {
    // If an admin reset is active, show that form override.
    if (resetForm) {
      if (resetForm === "biodata") {
        return (
          <ApplicantBiodataForm onSuccess={() => handleFormSuccess("biodata")} />
        );
      }
      if (resetForm === "guarantor") {
        return (
          <ApplicantGuarantorForm onSuccess={() => handleFormSuccess("guarantor")} />
        );
      }
      if (resetForm === "commitment") {
        return (
          <ApplicantCommitmentForm onSuccess={() => handleFormSuccess("commitment")} />
        );
      }
    }
    // Otherwise, if using a step-based approach.
    if (!resetForm) {
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
                "Commitment form submitted successfully! Verification complete. Await further review."
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
