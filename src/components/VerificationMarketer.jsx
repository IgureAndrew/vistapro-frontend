// src/components/VerificationMarketer.jsx
import React, { useState, useEffect } from "react";
import ApplicantBiodataForm from "./ApplicantBiodataForm";
import ApplicantGuarantorForm from "./ApplicantGuarantorForm";
import ApplicantCommitmentForm from "./ApplicantCommitmentForm";

function VerificationMarketer({ onComplete }) {
  // Check if there's a saved step in localStorage; otherwise, default to step 1.
  const savedStep = localStorage.getItem("verificationStep");
  const [step, setStep] = useState(savedStep ? Number(savedStep) : 1);

  // When the step changes, persist it in localStorage.
  useEffect(() => {
    localStorage.setItem("verificationStep", step);
  }, [step]);

  // Functions to advance or go back a step.
  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => (prev > 1 ? prev - 1 : 1));

  // When the final step is completed, clear the saved step.
  const finishVerification = () => {
    localStorage.removeItem("verificationStep");
    if (onComplete) onComplete();
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Marketer Verification Process</h2>
      {step === 1 && (
        <div>
          <ApplicantBiodataForm
            onSuccess={() => {
              alert("Biodata submitted successfully!");
              nextStep();
            }}
          />
        </div>
      )}
      {step === 2 && (
        <div>
          <ApplicantGuarantorForm
            onSuccess={() => {
              alert("Guarantor form submitted successfully!");
              nextStep();
            }}
          />
          <div className="mt-4">
            <button onClick={prevStep} className="px-4 py-2 bg-gray-300 rounded">
              Previous
            </button>
          </div>
        </div>
      )}
      {step === 3 && (
        <div>
          <ApplicantCommitmentForm
            onSuccess={() => {
              alert(
                "Commitment form submitted successfully! Verification process completed. Await further review."
              );
              finishVerification();
            }}
          />
          <div className="mt-4">
            <button onClick={prevStep} className="px-4 py-2 bg-gray-300 rounded">
              Previous
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VerificationMarketer;
