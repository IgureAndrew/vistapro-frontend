// src/components/ApplicantCommitmentForm.jsx
import React, { useState } from "react";

const ApplicantCommitmentForm = ({ onSuccess }) => {
  // Initial state for all promise fields and additional fields.
  const [formData, setFormData] = useState({
    promise_accept_false_documents: "",         // For: I promise I will not accept false or forged documents and information for the BUY NOW AND PAY LATER process.
    promise_not_request_unrelated_info: "",      // For: I promise I will not request for information unrelated to the BUY NOW PAY LATER process.
    promise_not_charge_customer_fees: "",        // For: I promise I will not charge customer fees for any reason.
    promise_not_modify_contract_info: "",        // For: I promise I will not modify any contract product information.
    promise_not_sell_unapproved_phones: "",      // For: I will not sell phones that are not under our company approved phones.
    promise_not_make_unofficial_commitment: "",  // For: I promise I will not make any non-official/unreasonable/illegal commitment which may cause losses to the company interest or reputation.
    promise_not_operate_customer_account: "",    // For: I promise I will not operate customer’s personal account without their permissions.
    promise_accept_fraud_firing: "",             // For: I promise if company found me involved in any fraudulent act, the company should fire me.
    promise_not_share_company_info: "",          // For: I promise I will not share company’s information with third party; if found involved, I should be terminated.
    promise_ensure_loan_recovery: "",            // For: I promise I will do my best to ensure the company recover all loan amount from my customers.
    promise_abide_by_system: "",                 // For: I will strictly abide by the above system; in case of violation, I accept all penalties.
    direct_sales_rep_name: "",
    date_signed: "",
  });

  // State for the signature file.
  const [signatureFile, setSignatureFile] = useState(null);

  // Handle input changes.
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle file input for signature.
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setSignatureFile(file);
  };

  // Handle form submission.
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    // Create a FormData object for multipart form data.
    const payload = new FormData();
    // Append all promise fields.
    Object.entries(formData).forEach(([key, value]) => {
      payload.append(key, value);
    });
    // Append the signature file.
    if (signatureFile) {
      payload.append("signature", signatureFile);
    } else {
      alert("Direct Sales Rep signature file is required.");
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/verification/commitment-handbook`,
        {
          method: "POST",
          headers: {
            // Do not set Content-Type manually—let the browser do it.
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
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-4 space-y-6 border rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Commitment Handbook</h2>
      <p className="mb-4 text-sm text-gray-600">
        The following are considered prohibited actions which are not allowed in the sales units.
      </p>

      {/* Promise 1 */}
      <div className="space-y-2">
        <label className="block font-semibold">
          I promise I will not accept false or forged documents and information for the BUY NOW AND PAY LATER process.
        </label>
        <div className="flex gap-4">
          <label>
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

      {/* Promise 2 */}
      <div className="space-y-2">
        <label className="block font-semibold">
          I promise I will not request for information unrelated to the BUY NOW PAY LATER process.
        </label>
        <div className="flex gap-4">
          <label>
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

      {/* Promise 3 */}
      <div className="space-y-2">
        <label className="block font-semibold">
          I promise I will not charge customer fees for any reason.
        </label>
        <div className="flex gap-4">
          <label>
            <input
              type="radio"
              name="promise_not_charge_customer_fees"
              value="yes"
              onChange={handleChange}
              required
            />{" "}
            Yes
          </label>
          <label>
            <input
              type="radio"
              name="promise_not_charge_customer_fees"
              value="no"
              onChange={handleChange}
              required
            />{" "}
            No
          </label>
        </div>
      </div>

      {/* Promise 4 */}
      <div className="space-y-2">
        <label className="block font-semibold">
          I promise I will not modify any contract product information.
        </label>
        <div className="flex gap-4">
          <label>
            <input
              type="radio"
              name="promise_not_modify_contract_info"
              value="yes"
              onChange={handleChange}
              required
            />{" "}
            Yes
          </label>
          <label>
            <input
              type="radio"
              name="promise_not_modify_contract_info"
              value="no"
              onChange={handleChange}
              required
            />{" "}
            No
          </label>
        </div>
      </div>

      {/* Promise 5 */}
      <div className="space-y-2">
        <label className="block font-semibold">
          I will not sell phones that are not under our company approved phones.
        </label>
        <div className="flex gap-4">
          <label>
            <input
              type="radio"
              name="promise_not_sell_unapproved_phones"
              value="yes"
              onChange={handleChange}
              required
            />{" "}
            Yes
          </label>
          <label>
            <input
              type="radio"
              name="promise_not_sell_unapproved_phones"
              value="no"
              onChange={handleChange}
              required
            />{" "}
            No
          </label>
        </div>
      </div>

      {/* Promise 6 */}
      <div className="space-y-2">
        <label className="block font-semibold">
          I promise I will not make any non-official/unreasonable/illegal commitment which may cause losses to the company’s interest or reputation.
        </label>
        <div className="flex gap-4">
          <label>
            <input
              type="radio"
              name="promise_not_make_unofficial_commitment"
              value="yes"
              onChange={handleChange}
              required
            />{" "}
            Yes
          </label>
          <label>
            <input
              type="radio"
              name="promise_not_make_unofficial_commitment"
              value="no"
              onChange={handleChange}
              required
            />{" "}
            No
          </label>
        </div>
      </div>

      {/* Promise 7 */}
      <div className="space-y-2">
        <label className="block font-semibold">
          I promise I will not operate customer’s personal account without their permissions.
        </label>
        <div className="flex gap-4">
          <label>
            <input
              type="radio"
              name="promise_not_operate_customer_account"
              value="yes"
              onChange={handleChange}
              required
            />{" "}
            Yes
          </label>
          <label>
            <input
              type="radio"
              name="promise_not_operate_customer_account"
              value="no"
              onChange={handleChange}
              required
            />{" "}
            No
          </label>
        </div>
      </div>

      {/* Promise 8 */}
      <div className="space-y-2">
        <label className="block font-semibold">
          I promise if the company finds me involved in any fraudulent act, the company should fire me.
        </label>
        <div className="flex gap-4">
          <label>
            <input
              type="radio"
              name="promise_accept_fraud_firing"
              value="yes"
              onChange={handleChange}
              required
            />{" "}
            Yes
          </label>
          <label>
            <input
              type="radio"
              name="promise_accept_fraud_firing"
              value="no"
              onChange={handleChange}
              required
            />{" "}
            No
          </label>
        </div>
      </div>

      {/* Promise 9 */}
      <div className="space-y-2">
        <label className="block font-semibold">
          I promise I will not share the company’s information with any third party; if found involved, I should be terminated.
        </label>
        <div className="flex gap-4">
          <label>
            <input
              type="radio"
              name="promise_not_share_company_info"
              value="yes"
              onChange={handleChange}
              required
            />{" "}
            Yes
          </label>
          <label>
            <input
              type="radio"
              name="promise_not_share_company_info"
              value="no"
              onChange={handleChange}
              required
            />{" "}
            No
          </label>
        </div>
      </div>

      {/* Promise 10 */}
      <div className="space-y-2">
        <label className="block font-semibold">
          I promise I will do my best to ensure the company recovers all loan amounts from my customers.
        </label>
        <div className="flex gap-4">
          <label>
            <input
              type="radio"
              name="promise_ensure_loan_recovery"
              value="yes"
              onChange={handleChange}
              required
            />{" "}
            Yes
          </label>
          <label>
            <input
              type="radio"
              name="promise_ensure_loan_recovery"
              value="no"
              onChange={handleChange}
              required
            />{" "}
            No
          </label>
        </div>
      </div>

      {/* Promise 11 */}
      <div className="space-y-2">
        <label className="block font-semibold">
          I will strictly abide by the above system; in case of violation, I accept all penalties.
        </label>
        <div className="flex gap-4">
          <label>
            <input
              type="radio"
              name="promise_abide_by_system"
              value="yes"
              onChange={handleChange}
              required
            />{" "}
            Yes
          </label>
          <label>
            <input
              type="radio"
              name="promise_abide_by_system"
              value="no"
              onChange={handleChange}
              required
            />{" "}
            No
          </label>
        </div>
      </div>

      {/* Direct Sales Rep Name */}
      <div className="space-y-2">
        <label className="block font-semibold">Name of Direct Sales Rep:</label>
        <input
          type="text"
          name="direct_sales_rep_name"
          value={formData.direct_sales_rep_name}
          onChange={handleChange}
          required
          className="border rounded px-4 py-2 w-full"
          placeholder="Enter the name of the Direct Sales Rep"
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
        <label className="block font-semibold">Direct Sales Rep Signature:</label>
        <input
          type="file"
          name="signature"
          accept="image/jpeg, image/jpg, image/png"
          onChange={handleFileChange}
          required
          className="border rounded px-4 py-2 w-full"
        />
        {signatureFile && (
          <p className="mt-1 text-xs text-green-600">
            File selected: {signatureFile.name}
          </p>
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700"
      >
        Submit Commitment Form
      </button>
    </form>
  );
};

export default ApplicantCommitmentForm;
