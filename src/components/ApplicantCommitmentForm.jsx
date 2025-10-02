// src/components/ApplicantCommitmentForm.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import FormStepper from "./FormStepper";
import AlertDialog from "@/components/ui/alert-dialog";
import { validateCommitmentForm } from '../utils/formValidation';

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
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
  };
  const handleFileChange = (e) =>
    e.target.files[0] && setSignatureFile(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent double submission
    if (loading) return;
    
    // Show confirmation dialog
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    setLoading(true);
    setShowConfirmDialog(false);
    
    // Use comprehensive validation
    const { errors: validationErrors, isValid } = validateCommitmentForm(formData, signatureFile);
    
    // If there are validation errors, show them and stop submission
    if (!isValid) {
      setErrors(validationErrors);
      setLoading(false);
      return;
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
        setLoading(false);
        setErrors({ general: postRes.data.message || "Submission failed." });
        return;
      }

      // Success - form submitted successfully
      setErrors({});

      // Scroll to top for better UX
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // If backend says "under review":
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
      console.error('❌ Commitment form submission error:', err);
      
      let errorMessage = "Error submitting commitment form. Please try again.";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.field) {
        errorMessage = `${err.response.data.field}: ${err.response.data.message}`;
      } else if (err.response?.status === 500) {
        errorMessage = "Server error occurred. Please try again or contact support if the problem persists.";
      } else if (err.response?.status === 400) {
        errorMessage = "Please check your form data and try again.";
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        errorMessage = "Network error. Please check your connection and try again.";
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Mobile Header */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-6">
        <h2 className="text-xl font-bold mb-2">Commitment Form</h2>
        <p className="text-purple-100 text-sm">Step 3 of 3 - Terms & Commitments</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* General Error Display */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-600 text-sm font-medium">
                {errors.general}
              </div>
            </div>
          </div>
        )}
        
        {/* Important Notice */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-red-800 mb-1">Important Notice</h3>
              <p className="text-xs text-red-700">
                The following are considered prohibited actions which are not allowed in the sales units. 
                Please read each statement carefully and provide your commitment.
              </p>
            </div>
          </div>
        </div>
        {/* Commitment Questions Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
            Commitment Statements
          </h3>
          
          <div className="space-y-6">
            {promiseQuestions.map(({ name, label }, index) => (
              <div key={name} className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-start mb-4">
                  <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">
                    {index + 1}
                  </span>
                  <p className="text-sm font-medium text-gray-800 leading-relaxed">{label}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
              {["yes", "no"].map((val) => (
                    <label key={val} className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name={name}
                    value={val}
                    onChange={handleChange}
                    required
                        className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                  />
                      <span className="ml-3 text-sm font-medium text-gray-700">
                  {val.charAt(0).toUpperCase() + val.slice(1)}
                      </span>
                </label>
              ))}
            </div>
          </div>
        ))}
          </div>
        </div>

        {/* Signature Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
            Digital Signature
          </h3>
          
          <div className="space-y-4">
            {/* Name and Date - Side by side on larger screens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name of Direct Sales Rep *
            </label>
            <input
              type="text"
              name="direct_sales_rep_name"
              value={formData.direct_sales_rep_name}
              onChange={handleChange}
              required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your full name"
            />
          </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Signed *
                </label>
            <input
              type="date"
              name="date_signed"
              value={formData.date_signed}
              onChange={handleChange}
              required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Signature Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Digital Signature *
          </label>
              <div className="relative rounded-lg p-6 text-center hover:shadow-md transition-all duration-200 shadow-sm bg-gray-50">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            required
                  className="hidden"
                  id="commitment-signature-upload"
                />
                <label htmlFor="commitment-signature-upload" className="cursor-pointer">
                  <div className="text-gray-600">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="mt-2 text-sm">Click to upload digital signature</p>
                    <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
          {signatureFile && (
                      <p className="mt-2 text-green-600 text-sm font-medium">
                        ✓ Selected: {signatureFile.name}
            </p>
          )}
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-600 text-sm font-medium">
                {errors.general}
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <button
            type="button"
            onClick={() => setShowConfirmDialog(true)}
            disabled={loading}
            className="w-full text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            style={{ backgroundColor: '#f59e0b' }}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Submitting...
              </div>
            ) : (
              'Submit Commitment Form'
            )}
          </button>
          
          <AlertDialog
            open={showConfirmDialog}
            type="warning"
            title="Confirm Submission"
            message="Are you sure you want to submit the Commitment Form? This action cannot be undone."
            confirmText="Submit Form"
            cancelText="Cancel"
            onConfirm={handleConfirmSubmit}
            onCancel={() => setShowConfirmDialog(false)}
            variant="default"
          />
        </div>
      </form>
    </div>
  );
};

export default ApplicantCommitmentForm;
