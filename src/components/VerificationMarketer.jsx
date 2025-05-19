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
  const [user,      setUser]      = useState(null);
  const [step,      setStep]      = useState(1);
  const [resetForm, setResetForm] = useState(null);
  const [loading,   setLoading]   = useState(true);

  const getIncomplete = u =>
    FORM_KEYS.filter(key => !u?.[FLAG_MAP[key]]);

  // 1) load user
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/auth/me");
        setUser(data.user);
        const inc = getIncomplete(data.user);
        if (inc.length) {
          setStep(FORM_KEYS.indexOf(inc[0]) + 1);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 2) forced reset from localStorage
  useEffect(() => {
    const forced = localStorage.getItem("resetFormType");
    if (forced) {
      setResetForm(forced);
      localStorage.removeItem("resetFormType");
    }
  }, []);

  // 3) sockets
  useEffect(() => {
    if (!user) return;
    socket.emit("register", user.unique_id);

    socket.on("formReset", ({ marketerUniqueId, formType, message }) => {
      if (marketerUniqueId === user.unique_id) {
        setUser(u => ({ ...u, [FLAG_MAP[formType]]: false }));
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

  // 4) mark a step done
  const handleSuccess = async key => {
    try {
      await api.patch(`/verification/${key}-success`);
      setUser(u => ({ ...u, [FLAG_MAP[key]]: true }));
      if (resetForm === key) setResetForm(null);
      const inc = getIncomplete({ ...user, [FLAG_MAP[key]]: true });
      if (inc.length) {
        setStep(FORM_KEYS.indexOf(inc[0]) + 1);
      }
    } catch (e) {
      console.error(e);
      alert("Submitted but failed to update state.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <p className="text-lg">Loading your verification status…</p>
      </div>
    );
  }

  const completed = FORM_KEYS.map(key => Boolean(user[FLAG_MAP[key]]));
  const doneCount = completed.filter(Boolean).length;
  const activeIndex = resetForm
    ? FORM_KEYS.indexOf(resetForm)
    : step - 1;

  // all done?
  if (doneCount === FORM_KEYS.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-lg shadow text-center">
          <h2 className="text-2xl font-bold mb-2">All Steps Completed</h2>
          <p>Your verification is now pending admin approval. Thank you!</p>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gray-50 py-6 flex justify-center px-4">
      <div className="w-full max-w-4xl">
        <h2 className="text-2xl font-bold text-center sm:text-left mb-4">
          Marketer Verification
        </h2>

        {/* stepper */}
        <div className="overflow-x-auto">
          <FormStepper
            steps={[
              { key: "biodata",    label: "Biodata" },
              { key: "guarantor",  label: "Guarantor" },
              { key: "commitment", label: "Commitment" },
            ]}
            activeIndex={activeIndex}
            completed={completed}
            onStepClick={idx => {
              if (idx <= doneCount - 1) {
                setResetForm(FORM_KEYS[idx]);
                setStep(idx + 1);
              }
            }}
          />
        </div>

        {/* form card */}
        <div className="mt-6 bg-white p-4 sm:p-6 rounded-lg shadow">
          {renderForm()}
        </div>
      </div>
    </div>
  );
}
