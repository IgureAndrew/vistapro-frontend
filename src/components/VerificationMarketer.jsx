// src/components/VerificationMarketer.jsx
import React, { useState, useEffect } from "react";
import ApplicantBiodataForm from "./ApplicantBiodataForm";
import ApplicantGuarantorForm from "./ApplicantGuarantorForm";
import ApplicantCommitmentForm from "./ApplicantCommitmentForm";
import FormStepper from "./FormStepper";
import api from "../api";

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

  // helper to list incomplete keys
  const getIncomplete = u =>
    FORM_KEYS.filter((k) => !u[FLAG_MAP[k]]);

  // fetch fresh user on mount
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/auth/me");
        setUser(data.user);
        // resume step from storage or from flags
        const incomplete = getIncomplete(data.user);
        if (incomplete.length === 0) {
          onComplete?.();
        } else if (incomplete.length === 1) {
          setResetForm(incomplete[0]);
        }
      } catch (err) {
        console.error("couldn't fetch user:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [onComplete]);

  // react to admin resets injected via localStorage
  useEffect(() => {
    const admin = localStorage.getItem("resetFormType");
    if (admin) {
      setResetForm(admin);
      localStorage.removeItem("resetFormType");
      localStorage.removeItem("verificationStep");
    }
  }, []);

  // persist step when it changes (unless override)
  useEffect(() => {
    if (!resetForm) {
      localStorage.setItem("verificationStep", step);
    }
  }, [step, resetForm]);

  // handle success from any form
  const handleFormSuccess = async (key) => {
    // flip the flag on server
    await api.patch(`/verification/${key}-success`);
    // update local user
    const updated = { ...user, [FLAG_MAP[key]]: true };
    setUser(updated);
    localStorage.setItem("user", JSON.stringify(updated));

    // clear potential override
    if (resetForm === key) setResetForm(null);

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

  const renderForm = () => {
    // override form
    if (resetForm) {
      if (resetForm === "biodata") {
        return <ApplicantBiodataForm onSuccess={() => handleFormSuccess("biodata")} />;
      }
      if (resetForm === "guarantor") {
        return <ApplicantGuarantorForm onSuccess={() => handleFormSuccess("guarantor")} />;
      }
      if (resetForm === "commitment") {
        return <ApplicantCommitmentForm onSuccess={() => handleFormSuccess("commitment")} />;
      }
    }

    // normal sequence
    if (step === 1) {
      return <ApplicantBiodataForm onSuccess={() => handleFormSuccess("biodata")} />;
    }
    if (step === 2) {
      return <ApplicantGuarantorForm onSuccess={() => handleFormSuccess("guarantor")} />;
    }
    if (step === 3) {
      return <ApplicantCommitmentForm onSuccess={() => handleFormSuccess("commitment")} />;
    }
    return null;
  };

  if (loading) return <p>Loading…</p>;

  // compute completed steps for the FormStepper
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
          // allow clicking only on completed steps or the immediate next
          if (completed[idx] || idx === completed.filter(Boolean).length) {
            setStep(idx + 1);
            setResetForm(null);
          }
        }}
      />

      <div className="mt-6">{renderForm()}</div>
    </div>
  );
}
