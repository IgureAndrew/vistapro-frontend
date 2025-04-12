// src/components/VerificationMarketer.jsx
import React, { useState } from "react";
import ApplicantBiodataForm from "./ApplicantBiodataForm";
import ApplicantGuarantorForm from "./ApplicantGuarantorForm";
import ApplicantCommitmentForm from "./ApplicantCommitmentForm";

function VerificationMarketer({ onComplete }) {
  // Step 1: Biodata, Step 2: Guarantor, Step 3: Commitment
  const [step, setStep] = useState(1);

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

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
              alert("Commitment form submitted successfully! Verification process completed. Await further review.");
              if (onComplete) onComplete();
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
