// src/components/ApplicantCommitmentForm.jsx
import React, { useState } from "react";

const ApplicantCommitmentForm = ({ onSuccess }) => {
  // State for the form fields.
  const [formData, setFormData] = useState({
    promise_accept_false_documents: "",
    promise_not_request_unrelated_info: "",
    promise_not_charge_customer_fees: "",
    promise_not_modify_contract_info: "",
    promise_not_sell_unapproved_phones: "",
    promise_not_make_unofficial_commitment: "",
    promise_not_operate_customer_account: "",
    promise_accept_fraud_firing: "",
    promise_not_share_company_info: "",
    promise_ensure_loan_recovery: "",
    promise_abide_by_system: "",
    direct_sales_rep_name: "",
    date_signed: "",
  });
  
  // State for the file upload.
  const [signatureFile, setSignatureFile] = useState(null);

  // Handle changes for text and radio inputs.
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle file input for the Direct Sales Rep signature.
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setSignatureFile(file);
  };

  // Handle form submission.
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    // Create a FormData object; do not set the Content-Type header manually.
    const payload = new FormData();

    // Append all text fields.
    Object.entries(formData).forEach(([key, value]) => {
      payload.append(key, value);
    });
    // Append the file under the name "signature" (must match the backend field name).
    if (signatureFile) {
      payload.append("signature", signatureFile);
    } else {
      alert("Signature file is required.");
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/verification/commitment-handbook`,
        {
          method: "POST",
          headers: {
            // Let the browser set the Content-Type header for FormData.
            Authorization: `Bearer ${token}`,
          },
          body: payload,
        }
      );
      const data = await res.json();
      if (res.ok) {
        alert("Commitment form submitted successfully.");
        if (onSuccess) onSuccess();
        // Reset form state.
        setFormData({
          promise_accept_false_documents: "",
          promise_not_request_unrelated_info: "",
          promise_not_charge_customer_fees: "",
          promise_not_modify_contract_info: "",
          promise_not_sell_unapproved_phones: "",
          promise_not_make_unofficial_commitment: "",
          promise_not_operate_customer_account: "",
          promise_accept_fraud_firing: "",
          promise_not_share_company_info: "",
          promise_ensure_loan_recovery: "",
          promise_abide_by_system: "",
          direct_sales_rep_name: "",
          date_signed: "",
        });
        setSignatureFile(null);
      } else {
        alert(data.message || "Commitment form submission failed.");
      }
    } catch (error) {
      console.error("Error submitting commitment form:", error);
      alert("Error submitting commitment form.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-4 space-y-4 border rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Commitment Handbook</h2>
      <p className="mb-4 text-sm text-gray-600">
        Please review and indicate your promises by selecting Yes or No for each.
      </p>

      {/* Promise Blocks */}
      <div className="space-y-4">
        <div>
          <label className="block font-semibold">I promise I will not accept false or forged documents:</label>
          <div className="mt-1">
            <label className="mr-4">
              <input
                type="radio"
                name="promise_accept_false_documents"
                value="yes"
                onChange={handleChange}
                required
              />{" "}
              Yes
            </label>
            <label>
              <input
                type="radio"
                name="promise_accept_false_documents"
                value="no"
                onChange={handleChange}
                required
              />{" "}
              No
            </label>
          </div>
        </div>
        <div>
          <label className="block font-semibold">I promise I will not request for unrelated information:</label>
          <div className="mt-1">
            <label className="mr-4">
              <input
                type="radio"
                name="promise_not_request_unrelated_info"
                value="yes"
                onChange={handleChange}
                required
              />{" "}
              Yes
            </label>
            <label>
              <input
                type="radio"
                name="promise_not_request_unrelated_info"
                value="no"
                onChange={handleChange}
                required
              />{" "}
              No
            </label>
          </div>
        </div>
        {/* Add additional promise blocks for:
             promise_not_charge_customer_fees,
             promise_not_modify_contract_info,
             promise_not_sell_unapproved_phones,
             promise_not_make_unofficial_commitment,
             promise_not_operate_customer_account,
             promise_accept_fraud_firing,
             promise_not_share_company_info,
             promise_ensure_loan_recovery,
             promise_abide_by_system
        */}
      </div>

      {/* Direct Sales Rep Name */}
      <div className="space-y-2">
        <label className="block font-semibold">Direct Sales Rep Name:</label>
        <input
          type="text"
          name="direct_sales_rep_name"
          value={formData.direct_sales_rep_name}
          onChange={handleChange}
          required
          className="border rounded px-4 py-2 w-full"
        />
      </div>

      {/* Date Signed */}
      <div className="space-y-2">
        <label className="block font-semibold">Date Signed:</label>
        <input
          type="date"
          name="date_signed"
          value={formData.date_signed}
          onChange={handleChange}
          required
          className="border rounded px-4 py-2 w-full"
        />
      </div>

      {/* Signature Upload */}
      <div className="space-y-2">
        <label className="block font-semibold">Upload Direct Sales Rep Signature:</label>
        <input
          type="file"
          name="signature"
          accept="image/jpeg, image/jpg, image/png"
          onChange={handleFileChange}
          required
          className="border rounded px-4 py-2 w-full"
        />
        {signatureFile && (
          <p className="mt-1 text-xs text-green-600">File selected: {signatureFile.name}</p>
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white font-semibold py-2 rounded"
      >
        Submit Commitment Form
      </button>
    </form>
  );
};

export default ApplicantCommitmentForm;
