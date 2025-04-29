// src/components/VerificationMarketer.jsx
import React, { useState, useEffect } from "react";
import ApplicantBiodataForm from "./ApplicantBiodataForm";
import ApplicantGuarantorForm from "./ApplicantGuarantorForm";
import ApplicantCommitmentForm from "./ApplicantCommitmentForm";
import FormStepper from "./FormStepper";
import api from "../api";
import socket from "../utils/socket";

const FORM_KEYS = ["biodata", "guarantor", "commitment"];
const FLAG_MAP = {
  biodata:    "bio_submitted",
  guarantor:  "guarantor_submitted",
  commitment: "commitment_submitted",
};

export default function VerificationMarketer({ onComplete }) {
  const [user,       setUser]       = useState(null);
  const [step,       setStep]       = useState(1);    // 1-based
  const [resetForm,  setResetForm]  = useState(null);
  const [loading,    setLoading]    = useState(true);

  // Helper: which forms are still incomplete?
  const getIncomplete = u =>
    FORM_KEYS.filter(key => !u?.[FLAG_MAP[key]]);

  // 1) Fetch current user + submission flags
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/auth/me");
        setUser(data.user);

        // Always jump to the first incomplete form
      const incomplete = getIncomplete(data.user);
      if (incomplete.length > 0) {
        const firstKey = incomplete[0];
        setStep(FORM_KEYS.indexOf(firstKey) + 1);
      }
      } catch (err) {
        console.error("Error fetching user:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 2) Pick up any forced reset from localStorage (socket override)
  useEffect(() => {
    const forced = localStorage.getItem("resetFormType");
    if (forced) {
      setResetForm(forced);
      localStorage.removeItem("resetFormType");
    }
  }, []);

  // 3) Socket listeners for admin resets and final approval
  useEffect(() => {
    if (!user) return;

    socket.emit("register", user.unique_id);

    socket.on("formReset", ({ marketerUniqueId, formType, message }) => {
      if (marketerUniqueId === user.unique_id) {
        // locally clear that submission flag
        setUser(u => ({ ...u, [FLAG_MAP[formType]]: false }));
        // force user back to that form next render
        localStorage.setItem("resetFormType", formType);
        setResetForm(formType);
        alert(message);
      }
    });

    socket.on("verificationApproved", ({ marketerUniqueId, message }) => {
      if (marketerUniqueId === user.unique_id) {
        alert(message);
        onComplete?.();
      }
    });

    return () => {
      socket.off("formReset");
      socket.off("verificationApproved");
    };
  }, [user, onComplete]);

  // 4) Handle successful submit of any form
  const handleSuccess = async key => {
    try {
      // flip server flag
      await api.patch(`/verification/${key}-success`);

      // flip local flag
      setUser(u => ({ ...u, [FLAG_MAP[key]]: true }));
      // clear any forced override if it was this form
      if (resetForm === key) setResetForm(null);

      // advance to the next incomplete, if any remain
      const incomplete = getIncomplete({ ...user, [FLAG_MAP[key]]: true });
      if (incomplete.length) {
        // find its 1-based step
        setStep(FORM_KEYS.indexOf(incomplete[0]) + 1);
      }
      // otherwise, all done — we’ll show “waiting” below
    } catch (err) {
      console.error(`Error marking ${key} success:`, err);
      alert("Submission OK but updating state failed.");
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-lg">Loading your verification status…</p>
      </div>
    );
  }

  // Build completed-array and figure out which tab is active
  const completed = FORM_KEYS.map(key => Boolean(user[FLAG_MAP[key]]));
  const doneCount = completed.filter(Boolean).length;

  // Determine activeIndex (0-based):
  //  • forcedReset override
  //  • else use step-1
  let activeIndex = resetForm
    ? FORM_KEYS.indexOf(resetForm)
    : step - 1;

  // If everything’s done, show a waiting message
  if (doneCount === FORM_KEYS.length) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">All Steps Completed</h2>
        <p>Your verification is now pending admin approval. Thank you!</p>
      </div>
    );
  }

  // Render the appropriate form component
  const renderForm = () => {
    const key = FORM_KEYS[activeIndex];
    switch (key) {
      case "biodata":
        return <ApplicantBiodataForm    onSuccess={() => handleSuccess("biodata")} />;
      case "guarantor":
        return <ApplicantGuarantorForm  onSuccess={() => handleSuccess("guarantor")} />;
      case "commitment":
        return <ApplicantCommitmentForm onSuccess={() => handleSuccess("commitment")} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Marketer Verification</h2>

      <FormStepper
        steps={[
          { key: "biodata",    label: "Biodata" },
          { key: "guarantor",  label: "Guarantor" },
          { key: "commitment", label: "Commitment" },
        ]}
        activeIndex={activeIndex}
        completed={completed}
        onStepClick={(idx) => {
          // only allow clicking to steps you've already completed
          if (idx <= doneCount - 1) {
            setResetForm(FORM_KEYS[idx]);
            setStep(idx + 1);
          }
        }}
      />

      <div className="mt-6">{renderForm()}</div>
    </div>
  );
}
