// src/components/ApplicantCommitmentForm.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import FormStepper from "./FormStepper";

const promiseQuestions = [
  {
    name: "promise_accept_false_documents",
    label:
      "I promise I will not accept false or forged documents and information for the BUY NOW AND PAY LATER process.",
  },
  {
    name: "promise_not_request_unrelated_info",
    label:
      "I promise I will not request for information unrelated to the BUY NOW PAY LATER process.",
  },
  {
    name: "promise_not_charge_customer_fees",
    label: "I promise I will not charge customer fees for any reason.",
  },
  {
    name: "promise_not_modify_contract_info",
    label: "I promise I will not modify any contract product information.",
  },
  {
    name: "promise_not_sell_unapproved_phones",
    label:
      "I promise I will not sell phones that are not under our company approved phones.",
  },
  {
    name: "promise_not_make_unofficial_commitment",
    label:
      "I promise I will not make any non-official/unreasonable/illegal commitment which may cause losses to the company's interest or reputation.",
  },
  {
    name: "promise_not_operate_customer_account",
    label:
      "I promise I will not operate customer’s personal account without their permissions.",
  },
  {
    name: "promise_accept_fraud_firing",
    label:
      "I promise if the company finds me involved in any fraudulent act, the company should fire me.",
  },
  {
    name: "promise_not_share_company_info",
    label:
      "I promise I will not share the company’s information with any third party; if found involved, I should be terminated.",
  },
  {
    name: "promise_ensure_loan_recovery",
    label:
      "I promise I will do my best to ensure the company recovers all loan amounts from my customers.",
  },
  {
    name: "promise_abide_by_system",
    label:
      "I will strictly abide by the above system; in case of violation, I accept all penalties.",
  },
];

const ApplicantCommitmentForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState(
    promiseQuestions.reduce(
      (acc, q) => ({ ...acc, [q.name]: "" }),
      { direct_sales_rep_name: "", date_signed: "" }
    )
  );
  const [signatureFile, setSignatureFile] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
  };
  const handleFileChange = (e) =>
    e.target.files[0] && setSignatureFile(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!signatureFile) {
      return alert("Direct Sales Rep signature file is required.");
    }

    const payload = new FormData();
    Object.entries(formData).forEach(([k, v]) => payload.append(k, v));
    payload.append("signature", signatureFile);

    try {
      const postRes = await api.post(
        "/verification/commitment-handbook",
        payload,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      if (postRes.status !== 201) {
        return alert(postRes.data.message || "Submission failed.");
      }

      // Flip the success flag
      await api.patch("/verification/commitment-success");

      alert(postRes.data.message || "Commitment form submitted successfully.");

      // If backend says “under review”:
      if (postRes.data.message.toLowerCase().includes("under review")) {
        navigate("/submission-under-review");
      }

      onSuccess?.();

      // Reset
      setFormData(
        promiseQuestions.reduce(
          (acc, q) => ({ ...acc, [q.name]: "" }),
          { direct_sales_rep_name: "", date_signed: "" }
        )
      );
      setSignatureFile(null);
    } catch (err) {
      console.error(err);
      alert("Error submitting commitment form.");
    }
  };

  return (
    <div className="max-w-2xl w-full mx-auto p-4 md:p-6 bg-white rounded shadow">
      <FormStepper currentStep={3} />

      <h2 className="text-2xl font-bold mb-2">Commitment Handbook</h2>
      <p className="text-sm text-gray-600 mb-4">
        The following are considered prohibited actions which are not allowed in
        the sales units.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {promiseQuestions.map(({ name, label }) => (
          <div key={name} className="space-y-2">
            <label className="block font-semibold">{label}</label>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {["yes", "no"].map((val) => (
                <label key={val} className="flex items-center">
                  <input
                    type="radio"
                    name={name}
                    value={val}
                    onChange={handleChange}
                    required
                    className="mr-2"
                  />
                  {val.charAt(0).toUpperCase() + val.slice(1)}
                </label>
              ))}
            </div>
          </div>
        ))}

        {/* Direct Sales Rep Name & Date Signed */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block font-semibold">
              Name of Direct Sales Rep:
            </label>
            <input
              type="text"
              name="direct_sales_rep_name"
              value={formData.direct_sales_rep_name}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="space-y-2">
            <label className="block font-semibold">Date Signed:</label>
            <input
              type="date"
              name="date_signed"
              value={formData.date_signed}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        {/* Signature Upload */}
        <div className="space-y-2">
          <label className="block font-semibold">
            Direct Sales Rep Signature:
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            required
            className="block"
          />
          {signatureFile && (
            <p className="mt-1 text-green-600 text-xs">
              Selected: {signatureFile.name}
            </p>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded"
          >
            Submit Commitment Form
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplicantCommitmentForm;
