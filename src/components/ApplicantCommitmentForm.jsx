// src/components/ApplicantCommitmentForm.jsx
import React, { useState } from "react";

function ApplicantCommitmentForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    promise_accept_false_documents: false,
    promise_not_request_irrelevant_info: false,
    promise_not_charge_customer_fees: false,
    promise_not_modify_contract_info: false,
    promise_not_sell_unapproved_phones: false,
    promise_not_make_unofficial_commitment: false,
    promise_not_operate_customer_account: false,
    promise_accept_fraud_firing: false,
    promise_not_share_company_info: false,
    promise_ensure_loan_recovery: false,
    promise_abide_by_system: false,
    direct_sales_rep_name: "",
    direct_sales_rep_signature_url: "",
    date_signed: "",
  });

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (type === "radio") {
      // Assume value "yes" means true and "no" means false
      setFormData((prev) => ({ ...prev, [name]: value === "yes" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/verification/commitment`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Commitment form submitted successfully!");
        if (onSuccess) onSuccess();
      } else {
        alert(data.message || "Submission failed");
      }
    } catch (error) {
      console.error("Error submitting commitment form:", error);
      alert("Error submitting commitment form");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">COMMITMENT FORM</h2>
      <p className="mb-4 text-sm text-gray-700 leading-relaxed">
        The following are considered prohibited actions which are not allowed in the sales units.
        <br />
        I promise I will not accept false or forged documents and information for the BUY NOW AND PAY LATER process.
        <br />
        I promise I will not request for information unrelated to the BUY NOW PAY LATER process.
        <br />
        I promise I will not charge customer fees for any reason.
        <br />
        I promise I will not modify any contract product information.
        <br />
        I will not sell phones that are not under our company approved phones.
        <br />
        I promise I will not make any non-official/unreasonable/illegal commitment which may cause losses to the company's interest or reputation.
        <br />
        I promise I will not operate customer's personal account without their permissions.
        <br />
        I promise if company found me involved in any fraudulent act, the company should fire me.
        <br />
        I promise I will not share company's information with third party, if company found me involved I should be terminated of my employment.
        <br />
        I promise I will do my best to ensure the company recover all loan amount from my customers.
        <br />
        I will strictly abide by the above system, in case of violation, I accept all penalties.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto">
        {/* Each promise is implemented as radio buttons */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            I promise I will not accept false or forged documents and information for the BUY NOW AND PAY LATER process.
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="promise_accept_false_documents"
                value="yes"
                checked={formData.promise_accept_false_documents === true}
                onChange={handleChange}
                required
              />
              <span className="ml-2">YES</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="promise_accept_false_documents"
                value="no"
                checked={formData.promise_accept_false_documents === false}
                onChange={handleChange}
                required
              />
              <span className="ml-2">NO</span>
            </label>
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            I promise I will not request for information unrelated to the BUY NOW PAY LATER process.
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="promise_not_request_irrelevant_info"
                value="yes"
                checked={formData.promise_not_request_irrelevant_info === true}
                onChange={handleChange}
                required
              />
              <span className="ml-2">YES</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="promise_not_request_irrelevant_info"
                value="no"
                checked={formData.promise_not_request_irrelevant_info === false}
                onChange={handleChange}
                required
              />
              <span className="ml-2">NO</span>
            </label>
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            I promise I will not charge customer fees for any reason.
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="promise_not_charge_customer_fees"
                value="yes"
                checked={formData.promise_not_charge_customer_fees === true}
                onChange={handleChange}
                required
              />
              <span className="ml-2">YES</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="promise_not_charge_customer_fees"
                value="no"
                checked={formData.promise_not_charge_customer_fees === false}
                onChange={handleChange}
                required
              />
              <span className="ml-2">NO</span>
            </label>
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            I promise I will not modify any contract product information.
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="promise_not_modify_contract_info"
                value="yes"
                checked={formData.promise_not_modify_contract_info === true}
                onChange={handleChange}
                required
              />
              <span className="ml-2">YES</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="promise_not_modify_contract_info"
                value="no"
                checked={formData.promise_not_modify_contract_info === false}
                onChange={handleChange}
                required
              />
              <span className="ml-2">NO</span>
            </label>
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            I will not sell phones that are not under our company approved phones.
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="promise_not_sell_unapproved_phones"
                value="yes"
                checked={formData.promise_not_sell_unapproved_phones === true}
                onChange={handleChange}
                required
              />
              <span className="ml-2">YES</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="promise_not_sell_unapproved_phones"
                value="no"
                checked={formData.promise_not_sell_unapproved_phones === false}
                onChange={handleChange}
                required
              />
              <span className="ml-2">NO</span>
            </label>
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            I promise I will not make any non-official/unreasonable/illegal commitment which may cause losses to the company's interest or reputation.
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="promise_not_make_unofficial_commitment"
                value="yes"
                checked={formData.promise_not_make_unofficial_commitment === true}
                onChange={handleChange}
                required
              />
              <span className="ml-2">YES</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="promise_not_make_unofficial_commitment"
                value="no"
                checked={formData.promise_not_make_unofficial_commitment === false}
                onChange={handleChange}
                required
              />
              <span className="ml-2">NO</span>
            </label>
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            I promise I will not operate customer's personal account without their permissions.
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="promise_not_operate_customer_account"
                value="yes"
                checked={formData.promise_not_operate_customer_account === true}
                onChange={handleChange}
                required
              />
              <span className="ml-2">YES</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="promise_not_operate_customer_account"
                value="no"
                checked={formData.promise_not_operate_customer_account === false}
                onChange={handleChange}
                required
              />
              <span className="ml-2">NO</span>
            </label>
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            I promise if company found me involved in any fraudulent act, the company should fire me.
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="promise_accept_fraud_firing"
                value="yes"
                checked={formData.promise_accept_fraud_firing === true}
                onChange={handleChange}
                required
              />
              <span className="ml-2">YES</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="promise_accept_fraud_firing"
                value="no"
                checked={formData.promise_accept_fraud_firing === false}
                onChange={handleChange}
                required
              />
              <span className="ml-2">NO</span>
            </label>
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            I promise I will not share company's information with third party, if company found me involved I should be terminated of my employment.
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="promise_not_share_company_info"
                value="yes"
                checked={formData.promise_not_share_company_info === true}
                onChange={handleChange}
                required
              />
              <span className="ml-2">YES</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="promise_not_share_company_info"
                value="no"
                checked={formData.promise_not_share_company_info === false}
                onChange={handleChange}
                required
              />
              <span className="ml-2">NO</span>
            </label>
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            I promise I will do my best to ensure the company recover all loan amount from my customers.
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="promise_ensure_loan_recovery"
                value="yes"
                checked={formData.promise_ensure_loan_recovery === true}
                onChange={handleChange}
                required
              />
              <span className="ml-2">YES</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="promise_ensure_loan_recovery"
                value="no"
                checked={formData.promise_ensure_loan_recovery === false}
                onChange={handleChange}
                required
              />
              <span className="ml-2">NO</span>
            </label>
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            I will strictly abide by the above system, in case of violation, I accept all penalties.
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="promise_abide_by_system"
                value="yes"
                checked={formData.promise_abide_by_system === true}
                onChange={handleChange}
                required
              />
              <span className="ml-2">YES</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="promise_abide_by_system"
                value="no"
                checked={formData.promise_abide_by_system === false}
                onChange={handleChange}
                required
              />
              <span className="ml-2">NO</span>
            </label>
          </div>
        </div>

        {/* Direct Sales Rep Details */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold">Direct Sales Rep Details</h3>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name of Direct Sales Rep:
            </label>
            <input
              type="text"
              name="direct_sales_rep_name"
              placeholder="Direct Sales Rep Name"
              value={formData.direct_sales_rep_name}
              onChange={handleChange}
              className="block w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Direct Sales Rep. Signature (URL):
            </label>
            <input
              type="text"
              name="direct_sales_rep_signature_url"
              placeholder="URL for Signature"
              value={formData.direct_sales_rep_signature_url}
              onChange={handleChange}
              className="block w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Date:
            </label>
            <input
              type="date"
              name="date_signed"
              value={formData.date_signed}
              onChange={handleChange}
              className="block w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => console.log("Cancel")}
            className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}

export default ApplicantCommitmentForm;
