// src/components/ApplicantGuarantorForm.jsx
import React, { useState } from "react";
import api from "../api";
import AlertDialog from "@/components/ui/alert-dialog";
import FormStepper from "./FormStepper";
import SuccessAnimation from "./SuccessAnimation";
import { validateGuarantorForm, isValidPhone, isValidEmail } from '../utils/formValidation';

const IDENTIFICATION_OPTIONS = [
  "NIN",
  "International Passport",
  "Driver's License",
];

export default function ApplicantGuarantorForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    is_candidate_known: "",
    relationship: "",
    known_duration: "",
    occupation: "",
    means_of_identification: "",
    guarantor_full_name: "",
    guarantor_home_address: "",
    guarantor_office_address: "",
    guarantor_email: "",
    guarantor_phone: "",
    candidate_name: "",
  });
  const [identificationFile, setIdentificationFile] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
  };

  const handleMeansChange = (e) => {
    setFormData((f) => ({ ...f, means_of_identification: e.target.value }));
    setIdentificationFile(null);
  };

  const handleIdentificationFileChange = (e) => {
    if (e.target.files[0]) setIdentificationFile(e.target.files[0]);
  };

  const handleSignatureFileChange = (e) => {
    if (e.target.files[0]) setSignatureFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🔍 Guarantor form handleSubmit called', { loading, submitted });
    
    // Prevent double submission or resubmission
    if (loading || submitted) {
      console.log('🚫 Form submission blocked:', { loading, submitted });
      return;
    }
    
    // Show confirmation dialog
    console.log('✅ Showing confirmation dialog');
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    setLoading(true);
    setShowConfirmDialog(false);
    
    // Use comprehensive validation
    console.log('🔍 Validating guarantor form:', { formData, identificationFile, signatureFile });
    const { errors: validationErrors, isValid } = validateGuarantorForm(formData, identificationFile, signatureFile);
    console.log('🔍 Validation result:', { validationErrors, isValid });
    
    // If there are validation errors, show them and stop submission
    if (!isValid) {
      console.log('❌ Validation failed, showing errors:', validationErrors);
      setErrors(validationErrors);
      setLoading(false);
      return;
    }
    
    console.log('✅ Validation passed, proceeding with submission');
    
    const payload = new FormData();
    Object.entries(formData).forEach(([k, v]) => payload.append(k, v));
    if (formData.means_of_identification && identificationFile) {
      payload.append("identification_file", identificationFile);
    }
    if (signatureFile) {
      payload.append("signature", signatureFile);
    }

    try {
      const res = await api.post(
        "/verification/guarantor",
        payload,
        {
          headers: { "Content-Type": "multipart/form-data" }
        }
      );
      if (res.status !== 201) {
        setLoading(false);
        setErrors({ general: res.data.message || "Submission failed." });
        return;
      }

      // Mark as submitted to prevent resubmission
      setSubmitted(true);

      // Success - form submitted successfully
      setErrors({});
      setShowSuccess(true);

      // Scroll to top for better UX
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Call success callback immediately - ONLY on successful submission
      onSuccess?.();

      // Reset form after success animation
      setTimeout(() => {
      setFormData({
        is_candidate_known: "",
        relationship: "",
        known_duration: "",
        occupation: "",
        means_of_identification: "",
        guarantor_full_name: "",
        guarantor_home_address: "",
        guarantor_office_address: "",
        guarantor_email: "",
        guarantor_phone: "",
        candidate_name: "",
      });
      setIdentificationFile(null);
      setSignatureFile(null);
        setLoading(false);
        setShowSuccess(false);
      }, 1500); // 1.5 second delay for success animation
    } catch (err) {
      setLoading(false);
      console.error('❌ Guarantor form submission error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      // Parse specific error messages
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (err.response?.data) {
        const { field, message, error } = err.response.data;
        
        if (field && message) {
          // Field-specific error
          setErrors({ [field]: message });
          return;
        } else if (message) {
          errorMessage = message;
        } else if (error) {
          errorMessage = error;
        } else if (err.response.status === 500) {
          errorMessage = 'Server error occurred. Please try again later.';
        } else if (err.response.status === 400) {
          errorMessage = 'Invalid data provided. Please check your inputs.';
        } else if (err.response.status === 401) {
          errorMessage = 'Session expired. Please login again.';
        } else if (err.response.status === 403) {
          errorMessage = 'You do not have permission to perform this action.';
        } else if (err.response.status === 404) {
          errorMessage = 'Service not found. Please contact support.';
        } else if (err.response.status === 413) {
          errorMessage = 'File too large. Please upload smaller files.';
        } else if (err.response.status === 415) {
          errorMessage = 'Invalid file type. Please upload valid image files.';
        }
      } else if (err.code === 'NETWORK_ERROR' || err.message === 'Network Error') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (err.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      }
      
      setErrors({ general: errorMessage });
    }
  };

  return (
    <div className="w-full">
      {/* Mobile Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6">
        <h2 className="text-xl font-bold mb-2">Guarantor Form</h2>
        <p className="text-green-100 text-sm">Step 2 of 3 - Guarantor Information</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Eligibility Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-blue-800 mb-1">Eligible Guarantors</h3>
              <p className="text-xs text-blue-700">
                Lecturer, Architects, Engineers, Teachers, Doctors, Lawyers, Nurses, Bankers, 
                Accountants, Managers/Directors, Traditional rulers, Clergy, Senior Civil Servants.
              </p>
            </div>
          </div>
        </div>
        {/* Relationship Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
            Relationship Information
          </h3>
          
          <div className="space-y-4">
            {/* Known to you - Mobile-friendly radio buttons */}
        <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Is the candidate well known to you? *</label>
              <div className="grid grid-cols-2 gap-3">
            {["yes", "no"].map((val) => (
                  <label key={val} className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="is_candidate_known"
                  value={val}
                  onChange={handleChange}
                  required
                      className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">
                {val.charAt(0).toUpperCase() + val.slice(1)}
                    </span>
              </label>
            ))}
          </div>
        </div>

            {/* Relationship */}
        <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Relationship with the candidate *</label>
          <input
            type="text"
            name="relationship"
            value={formData.relationship}
            onChange={handleChange}
            required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                placeholder="e.g., Friend, Colleague, Family member"
          />
        </div>

            {/* Known duration */}
        <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How long have you known the candidate? (Min 3 years) *
          </label>
          <input
            type="text"
            name="known_duration"
            value={formData.known_duration}
            onChange={handleChange}
            required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                placeholder="e.g., 5 years, 3 years 6 months"
          />
        </div>

            {/* Occupation */}
        <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Occupation *</label>
          <input
            type="text"
            name="occupation"
            value={formData.occupation}
            onChange={handleChange}
            required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                placeholder="e.g., Engineer, Teacher, Doctor"
          />
            </div>
          </div>
        </div>

        {/* Identification Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
            Identification Documents
          </h3>
          
          <div className="space-y-4">
            {/* Means of ID */}
        <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Means of Identification *</label>
          <select
            name="means_of_identification"
            value={formData.means_of_identification}
            onChange={handleMeansChange}
            required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
          >
                <option value="">Select ID Type</option>
            {IDENTIFICATION_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

            {/* ID file upload */}
        {formData.means_of_identification && (
          <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload your {formData.means_of_identification} image *
            </label>
                <div className="relative rounded-lg p-6 text-center hover:shadow-md transition-all duration-200 shadow-sm bg-gray-50">
                  <label htmlFor="guarantor-id-upload" className="cursor-pointer block">
            <input
              type="file"
              accept="image/*"
              onChange={handleIdentificationFileChange}
              required
                      className="hidden"
                      id="guarantor-id-upload"
                    />
                    <div className="text-gray-600">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="mt-2 text-sm">Click to upload {formData.means_of_identification}</p>
                      <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                      {identificationFile && (
                        <p className="mt-2 text-green-600 text-sm font-medium">
                          ✓ Selected: {identificationFile.name}
                        </p>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Guarantor Personal Information Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">3</span>
            Guarantor Personal Information
          </h3>
          
          <div className="space-y-4">
            {/* Full Name */}
        <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Guarantor Full Name *</label>
          <input
            type="text"
            name="guarantor_full_name"
            value={formData.guarantor_full_name}
            onChange={handleChange}
            required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter guarantor's full name"
          />
        </div>

            {/* Email and Phone - Side by side on larger screens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
          <input
            type="email"
            name="guarantor_email"
            value={formData.guarantor_email}
            onChange={handleChange}
            required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="guarantor@email.com"
          />
        </div>

        <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number (11 digits) *</label>
          <input
            type="text"
            name="guarantor_phone"
            value={formData.guarantor_phone}
            onChange={handleChange}
            required
            pattern="\d{11}"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="08012345678"
                />
              </div>
            </div>

            {/* Home Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Home Address *</label>
              <textarea
                name="guarantor_home_address"
                value={formData.guarantor_home_address}
                onChange={handleChange}
                required
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter guarantor's home address"
              />
            </div>

            {/* Office Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Office Address *</label>
              <textarea
                name="guarantor_office_address"
                value={formData.guarantor_office_address}
                onChange={handleChange}
                required
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter guarantor's office address"
          />
        </div>

            {/* Candidate Name (optional) */}
        <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Candidate Name (if any)</label>
          <input
            type="text"
            name="candidate_name"
            value={formData.candidate_name}
            onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter candidate's name (optional)"
          />
            </div>
          </div>
        </div>

        {/* Signature Upload Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">4</span>
            Guarantor Signature
          </h3>
          
          <div className="relative rounded-lg p-6 text-center hover:shadow-md transition-all duration-200 shadow-sm bg-gray-50">
          <input
            type="file"
            accept="image/*"
            onChange={handleSignatureFileChange}
            required
              className="hidden"
              id="guarantor-signature-upload"
            />
            <label htmlFor="guarantor-signature-upload" className="cursor-pointer">
              <div className="text-gray-600">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-2 text-sm">Click to upload guarantor signature</p>
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
            onClick={() => {
              console.log('🔍 Guarantor submit button clicked', { loading, submitted });
              setShowConfirmDialog(true);
            }}
            disabled={loading || submitted}
            className="w-full text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            style={{ backgroundColor: submitted ? '#10b981' : '#f59e0b' }}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Submitting...
              </div>
            ) : submitted ? (
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Form Submitted Successfully
              </div>
            ) : (
              'Submit Guarantor Form'
            )}
          </button>
          
          <AlertDialog
            open={showConfirmDialog}
            type="warning"
            title="Confirm Submission"
            message="Are you sure you want to submit the Guarantor Form? This action cannot be undone."
            confirmText="Submit Form"
            cancelText="Cancel"
            onConfirm={handleConfirmSubmit}
            onCancel={() => setShowConfirmDialog(false)}
            variant="default"
          />

          {/* Success Animation */}
          {showSuccess && (
            <SuccessAnimation 
              message="Guarantor Form Submitted Successfully!" 
              onComplete={() => setShowSuccess(false)}
            />
          )}
        </div>
      </form>
    </div>
  );
}
