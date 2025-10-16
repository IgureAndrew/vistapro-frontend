import React, { useState, useEffect } from "react";
import ApplicantBiodataForm     from "./ApplicantBiodataForm";
import ApplicantGuarantorForm   from "./ApplicantGuarantorForm";
import ApplicantCommitmentForm  from "./ApplicantCommitmentForm";
import FormStepper              from "./FormStepper";
import api                      from "../api";
import socket                   from "../utils/socket";

const FORM_KEYS = ["biodata", "guarantor", "commitment"];
const FLAG_MAP  = {
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

  // 1) Load user & flags
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
        console.error("Failed loading user:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 2) Check for forced reset (socket override)
  useEffect(() => {
    const forced = localStorage.getItem("resetFormType");
    if (forced) {
      setResetForm(forced);
      localStorage.removeItem("resetFormType");
    }
  }, []);

  // 3) Socket listeners
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

  // 4) Mark a step complete
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
      console.error("Error marking success:", e);
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

  const completed    = FORM_KEYS.map(key => Boolean(user[FLAG_MAP[key]]));
  const doneCount    = completed.filter(Boolean).length;
  const activeIndex  = resetForm
    ? FORM_KEYS.indexOf(resetForm)
    : step - 1;

  // All done?
  if (doneCount === FORM_KEYS.length) {
    return (
      <div className="w-full flex items-center justify-center p-4">
        <div className="w-full bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center">
          <h2 className="text-2xl font-bold mb-2 dark:text-white">All Steps Completed</h2>
          <p className="dark:text-gray-300">Your verification is now pending admin approval. Thank you!</p>
        </div>
      </div>
    );
  }

  // Build steps with tick icons
  const steps = [
    { key: "biodata",    label: "Biodata",    icon: completed[0] ? "✅" : "1" },
    { key: "guarantor",  label: "Guarantor",  icon: completed[1] ? "✅" : "2" },
    { key: "commitment", label: "Commitment", icon: completed[2] ? "✅" : "3" },
  ];

  const renderForm = () => {
    switch (FORM_KEYS[activeIndex]) {
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
    <div className="w-full space-y-6">
      {/* Mobile-First Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900 text-center">
            Marketer Verification
          </h1>
          <p className="text-sm text-gray-600 text-center mt-1">
            Complete your verification to unlock your dashboard
          </p>
        </div>
      </div>

      {/* Mobile Progress Indicator */}
      <div className="px-4 py-4">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-semibold text-blue-600">
              {doneCount}/{FORM_KEYS.length} Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(doneCount / FORM_KEYS.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Mobile Stepper */}
        <FormStepper
          steps={steps}
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

      {/* Mobile Form Container */}
      <div className="px-4 pb-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {renderForm()}
        </div>
      </div>
    </div>
  );
}
