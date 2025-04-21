// src/components/VerificationMarketer.jsx
import React, { useState, useEffect } from "react";
import ApplicantBiodataForm from "./ApplicantBiodataForm";
import ApplicantGuarantorForm from "./ApplicantGuarantorForm";
import ApplicantCommitmentForm from "./ApplicantCommitmentForm";
import FormStepper from "./FormStepper";
import api from "../api/authApi"; 


const FORM_KEYS = ["biodata", "guarantor", "commitment"];
const FLAG_MAP = {
  biodata: "bio_submitted",
  guarantor: "guarantor_submitted",
  commitment: "commitment_submitted",
};

export default function VerificationMarketer({ onComplete }) {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(() => {
    const s = localStorage.getItem("verificationStep");
    return s ? Number(s) : 1;
  });
  const [resetForm, setResetForm] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper: which forms remain?
  const getIncomplete = (u) =>
    FORM_KEYS.filter((k) => !u[FLAG_MAP[k]]);

  // 1) On mount, fetch fresh user & flags
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/me");
        setUser(data.user);
        // decide if only one incomplete → force‐show that
        const incomplete = getIncomplete(data.user);
        if (incomplete.length === 0) {
          onComplete?.();
        } else if (incomplete.length === 1) {
          setResetForm(incomplete[0]);
        }
      } catch (err) {
        console.error("Couldn't fetch user:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [onComplete]);

  // 2) Check for any admin‐injected override
  useEffect(() => {
    const admin = localStorage.getItem("resetFormType");
    if (admin) {
      setResetForm(admin);
      localStorage.removeItem("resetFormType");
      localStorage.removeItem("verificationStep");
    }
  }, []);

  // 3) Persist step (unless override)
  useEffect(() => {
    if (!resetForm) {
      localStorage.setItem("verificationStep", step);
    }
  }, [step, resetForm]);

  // 4) When any form completes
  const handleFormSuccess = async (key) => {
    // 4a) Tell backend we succeeded
    await api.patch(`/api/verification/${key}-success`);

    // 4b) Flip local flag
    const updated = { ...user, [FLAG_MAP[key]]: true };
    setUser(updated);
    localStorage.setItem("user", JSON.stringify(updated));

    // 4c) Clear any override
    if (resetForm === key) setResetForm(null);

    // 4d) Decide next
    const incomplete = getIncomplete(updated);
    if (incomplete.length === 0) {
      localStorage.removeItem("verificationStep");
      onComplete?.();
    } else if (incomplete.length === 1) {
      setResetForm(incomplete[0]);
    } else {
      setStep((s) => Math.min(s + 1, FORM_KEYS.length));
    }
  };

  // Pick the right form to show
  const renderForm = () => {
    // Override always wins
    if (resetForm) {
      switch (resetForm) {
        case "biodata":
          return <ApplicantBiodataForm onSuccess={() => handleFormSuccess("biodata")} />;
        case "guarantor":
          return <ApplicantGuarantorForm onSuccess={() => handleFormSuccess("guarantor")} />;
        case "commitment":
          return <ApplicantCommitmentForm onSuccess={() => handleFormSuccess("commitment")} />;
        default:
          return null;
      }
    }

    // Otherwise follow step sequence
    switch (step) {
      case 1:
        return <ApplicantBiodataForm onSuccess={() => handleFormSuccess("biodata")} />;
      case 2:
        return <ApplicantGuarantorForm onSuccess={() => handleFormSuccess("guarantor")} />;
      case 3:
        return <ApplicantCommitmentForm onSuccess={() => handleFormSuccess("commitment")} />;
      default:
        return null;
    }
  };

  if (loading) return <p>Loading…</p>;

  // Build data for the stepper
  const completed = FORM_KEYS.map((k) => Boolean(user?.[FLAG_MAP[k]]));
  const activeIndex = resetForm
    ? FORM_KEYS.indexOf(resetForm)
    : step - 1;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Marketer Verification</h2>

      <FormStepper
        steps={[
          { key: "biodata", label: "Biodata" },
          { key: "guarantor", label: "Guarantor" },
          { key: "commitment", label: "Commitment" },
        ]}
        activeIndex={activeIndex}
        completed={completed}
        onStepClick={(idx, key) => {
          // only allow clicking on a step that's already done, or the very next one
          const doneCount = completed.filter(Boolean).length;
          if (completed[idx] || idx === doneCount) {
            setStep(idx + 1);
            setResetForm(null);
          }
        }}
      />

      <div className="mt-6">{renderForm()}</div>
    </div>
  );
}
