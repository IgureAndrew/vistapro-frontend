// src/components/VerificationMarketer.jsx
import React, { useState, useEffect } from "react";
import ApplicantBiodataForm from "./ApplicantBiodataForm";
import ApplicantGuarantorForm from "./ApplicantGuarantorForm";
import ApplicantCommitmentForm from "./ApplicantCommitmentForm";
import FormStepper from "./FormStepper";
import api from "../api";
import socket from "../utils/socket"; // wherever you init your io()

const FORM_KEYS = ["biodata", "guarantor", "commitment"];
const FLAG_MAP = {
  biodata:    "bio_submitted",
  guarantor:  "guarantor_submitted",
  commitment: "commitment_submitted",
};

export default function VerificationMarketer({ onComplete }) {
  const [user, setUser]       = useState(null);
  const [step, setStep]       = useState(1);
  const [resetForm, setReset] = useState(null);
  const [loading, setLoading] = useState(true);

  // helper to know which keys remain
  const getIncomplete = u =>
    FORM_KEYS.filter(k => !u?.[FLAG_MAP[k]]);

  // 1) fetch user
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/auth/me");
        setUser(data.user);
        // if only one left, jump straight to it
        const inc = getIncomplete(data.user);
        if (inc.length === 1) setReset(inc[0]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 2) pick up any formReset override
  useEffect(() => {
    const forced = localStorage.getItem("resetFormType");
    if (forced) {
      setReset(forced);
      localStorage.removeItem("resetFormType");
    }
  }, []);

  // 3) socket listener for the master‑admin “unlock” and formReset
  useEffect(() => {
    if (!user) return;

    socket.emit("register", user.unique_id);

    socket.on("formReset", data => {
      if (data.marketerUniqueId === user.unique_id) {
        // flip the flag locally
        const flagKey = FLAG_MAP[data.formType];
        const updated = { ...user, [flagKey]: false };
        setUser(updated);
        // force that form on next render
        localStorage.setItem("resetFormType", data.formType);
        setReset(data.formType);
        alert(data.message);
      }
    });

    socket.on("verificationApproved", data => {
      if (data.marketerUniqueId === user.unique_id) {
        alert(data.message);
        onComplete?.();
      }
    });

    return () => {
      socket.off("formReset");
      socket.off("verificationApproved");
    };
  }, [user, onComplete]);

  // 4) handle submit success
  const handleSuccess = async key => {
    await api.patch(`/verification/${key}-success`);
    const updated = { ...user, [FLAG_MAP[key]]: true };
    setUser(updated);
    // clear override if we were forced here
    if (resetForm === key) setReset(null);

    // if more than one left, advance; otherwise do nothing
    const inc = getIncomplete(updated);
    if (inc.length > 1) {
      setStep(s => Math.min(s + 1, FORM_KEYS.length));
    }
    // when zero left, we simply wait for master‑admin via socket
  };

  if (loading) return <p>Loading…</p>;

  // build completed & doneCount
  const completed = FORM_KEYS.map(k => Boolean(user[FLAG_MAP[k]]));
  const doneCount = completed.filter(Boolean).length;
  const activeIndex = resetForm
    ? FORM_KEYS.indexOf(resetForm)
    : step - 1;

  // choose which form to render
  const renderForm = () => {
    const show = resetForm || FORM_KEYS[step - 1];
    if (show === "biodata")    return <ApplicantBiodataForm    onSuccess={() => handleSuccess("biodata")} />;
    if (show === "guarantor")  return <ApplicantGuarantorForm  onSuccess={() => handleSuccess("guarantor")} />;
    if (show === "commitment") return <ApplicantCommitmentForm onSuccess={() => handleSuccess("commitment")} />;
    return null;
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
        onStepClick={(idx, key) => {
          // only allow clicks up to doneCount
          if (idx <= doneCount) {
            setStep(idx + 1);
            setReset(null);
          }
        }}
      />

      <div className="mt-6">{renderForm()}</div>
    </div>
  );
}
