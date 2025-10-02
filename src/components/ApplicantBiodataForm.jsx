// src/components/ApplicantBiodataForm.jsx
import React, { useState } from "react";
import api from "../api";
import FormStepper from "./FormStepper";
import AlertDialog from "@/components/ui/alert-dialog";
import SuccessAnimation from "./SuccessAnimation";
import { validateBiodataForm, isValidPhone, isValidAccountNumber } from '../utils/formValidation';

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","Gombe","Imo","Jigawa",
  "Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger",
  "Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara","FCT"
];

const IDENTIFICATION_OPTIONS = [
  "NIN",
  "International Passport",
  "Driver's License"
];

export default function ApplicantBiodataForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    religion: "",
    date_of_birth: "",
    marital_status: "",
    state_of_origin: "",
    state_of_residence: "",
    mothers_maiden_name: "",
    school_attended: "",
    means_of_identification: "",
    last_place_of_work: "",
    job_description: "",
    reason_for_quitting: "",
    medical_condition: "",
    next_of_kin_name: "",
    next_of_kin_phone: "",
    next_of_kin_address: "",
    next_of_kin_relationship: "",
    bank_name: "",
    account_name: "",
    account_number: ""
  });
  const [passportPhoto, setPassportPhoto] = useState(null);
  const [identificationFile, setIdentificationFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(f => ({ ...f, [name]: value }));
    setErrors(errs => ({ ...errs, [name]: null }));
    
    // Real-time validation for specific fields
    if (name === 'phone' && value && !isValidPhone(value)) {
      setErrors(errs => ({ ...errs, [name]: 'Phone number must be exactly 11 digits' }));
    } else if (name === 'account_number' && value && !isValidAccountNumber(value)) {
      setErrors(errs => ({ ...errs, [name]: 'Account number must be exactly 10 digits' }));
    }
  };
  const handlePassportPhotoChange = e =>
    e.target.files[0] && setPassportPhoto(e.target.files[0]);
  const handleIdentificationFileChange = e =>
    e.target.files[0] && setIdentificationFile(e.target.files[0]);


  const handleSubmit = async e => {
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
    const { errors: validationErrors, isValid } = validateBiodataForm(formData, passportPhoto, identificationFile);
    
    // If there are validation errors, show them and stop submission
    if (!isValid) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    // Debug: Log form data
    console.log('Form data:', formData);
    console.log('Passport photo:', passportPhoto);
    console.log('Identification file:', identificationFile);

    const payload = new FormData();
    Object.entries(formData).forEach(([k, v]) => {
      if (v !== '') { // Only append non-empty values
        payload.append(k, v);
      }
    });
    
    if (passportPhoto) {
      payload.append("passport_photo", passportPhoto);
    }
    if (formData.means_of_identification && identificationFile) {
      payload.append("id_document", identificationFile);
    }

    // Debug: Log FormData contents
    console.log('FormData contents:');
    for (let [key, value] of payload.entries()) {
      console.log(key, value);
    }

    try {
      const res1 = await api.post("/verification/bio-data", payload);
      if (res1.status !== 201) {
        setLoading(false);
        setErrors({ general: res1.data.message || "Biodata submission failed." });
        return;
      }
      
      // Show success animation
      setShowConfirmDialog(false);
      setErrors({});
      setShowSuccess(true);
      
      // Scroll to top for better UX
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Reset form after success animation
      setTimeout(() => {
        setFormData({
        name: "",
        address: "",
        phone: "",
        religion: "",
        date_of_birth: "",
        marital_status: "",
        state_of_origin: "",
        state_of_residence: "",
        mothers_maiden_name: "",
        school_attended: "",
        means_of_identification: "",
        last_place_of_work: "",
        job_description: "",
        reason_for_quitting: "",
        medical_condition: "",
        next_of_kin_name: "",
        next_of_kin_phone: "",
        next_of_kin_address: "",
        next_of_kin_relationship: "",
        bank_name: "",
        account_name: "",
        account_number: ""
      });
        setPassportPhoto(null);
        setIdentificationFile(null);
        setLoading(false);
        setShowSuccess(false);
        
        // Call success callback
        onSuccess?.();
      }, 1500); // 1.5 second delay for success animation
    } catch (err) {
      setLoading(false);
      console.error('Form submission error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      const { field, message } = err.response?.data || {};
      if (field) {
        setErrors({ [field]: message });
      } else {
        setErrors({ general: message || `Server error: ${err.response?.status || 'Unknown'}. Please try again.` });
      }
    }
  };

  return (
    <div className="w-full">
      {/* Mobile Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
        <h2 className="text-xl font-bold mb-2">Biodata Form</h2>
        <p className="text-blue-100 text-sm">Step 1 of 3 - Personal Information</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Personal Details Section */}
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
              Personal Information
            </h3>
            
            <div className="space-y-4">
              {/* Name - Full width on mobile */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm transition-all duration-200 ${
                errors.name ? 'border-red-500' : ''
              }`}
              placeholder="Enter your full name"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

              {/* Address - Full width on mobile */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
            <input
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
                  className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm transition-all duration-200"
                  placeholder="Enter your residential address"
            />
          </div>

              {/* Phone and Religion - Side by side on larger screens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                  <div className="relative">
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="08012345678"
                      className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm transition-all duration-200 ${
                        errors.phone ? 'border-red-500' : formData.phone && isValidPhone(formData.phone) ? 'border-green-500' : ''
                      }`}
                    />
                    {formData.phone && isValidPhone(formData.phone) && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
          </div>
                
          <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Religion *</label>
            <select
              name="religion"
              value={formData.religion}
              onChange={handleChange}
              required
                    className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm transition-all duration-200"
            >
                    <option value="">Select Religion</option>
              <option>Christian</option>
              <option>Muslim</option>
                    <option>Other</option>
            </select>
                </div>
          </div>

              {/* Date of Birth and Marital Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
            <input
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              required
                    className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm transition-all duration-200"
            />
          </div>
                
          <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Marital Status *</label>
            <select
              name="marital_status"
              value={formData.marital_status}
              onChange={handleChange}
              required
                    className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm transition-all duration-200"
            >
                    <option value="">Select Status</option>
              <option>Single</option>
              <option>Married</option>
                    <option>Divorced</option>
                    <option>Widowed</option>
            </select>
                </div>
          </div>

              {/* States - Side by side on larger screens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State of Origin *</label>
            <select
              name="state_of_origin"
              value={formData.state_of_origin}
              onChange={handleChange}
              required
                    className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm transition-all duration-200"
            >
                    <option value="">Select State</option>
              {NIGERIAN_STATES.map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
                
          <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State of Residence *</label>
            <select
              name="state_of_residence"
              value={formData.state_of_residence}
              onChange={handleChange}
              required
                    className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm transition-all duration-200"
            >
                    <option value="">Select State</option>
              {NIGERIAN_STATES.map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
                </div>
          </div>

              {/* Mother's Maiden Name - Full width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mother's Maiden Name *</label>
            <input
              name="mothers_maiden_name"
              value={formData.mothers_maiden_name}
              onChange={handleChange}
              required
                  className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm transition-all duration-200"
                  placeholder="Enter your mother's maiden name"
            />
          </div>

              {/* School Attended - Full width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">School Attended with Dates *</label>
            <input
              name="school_attended"
              value={formData.school_attended}
              onChange={handleChange}
              required
              placeholder="e.g., XYZ University (2005–2009)"
                  className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm transition-all duration-200"
            />
              </div>
            </div>
          </div>
        </div>

        {/* Identification Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
            Identification Documents
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Means of Identification *</label>
          <select
            name="means_of_identification"
            value={formData.means_of_identification}
            onChange={handleChange}
            required
                className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm transition-all duration-200"
          >
                <option value="">Select ID Type</option>
            {IDENTIFICATION_OPTIONS.map(o => (
              <option key={o}>{o}</option>
            ))}
          </select>
            </div>
            
          {formData.means_of_identification && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload ID Document *</label>
                <div className="relative rounded-lg p-6 text-center hover:shadow-md transition-all duration-200 shadow-sm bg-gray-50">
                  <label htmlFor="id-document-upload" className="cursor-pointer block">
              <input
                type="file"
                accept="image/*"
                onChange={handleIdentificationFileChange}
                required
                      className="hidden"
                      id="id-document-upload"
                    />
                    <div className="text-gray-600">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="mt-2 text-sm">Click to upload ID document</p>
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

        {/* Work Experience Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">3</span>
            Work Experience
          </h3>
          
          <div className="space-y-4">
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Place of Work *</label>
            <input
              name="last_place_of_work"
              value={formData.last_place_of_work}
              onChange={handleChange}
              required
                className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm transition-all duration-200"
                placeholder="Company or organization name"
            />
          </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Job Description *</label>
            <textarea
              name="job_description"
              value={formData.job_description}
              onChange={handleChange}
              required
              rows="3"
                className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm transition-all duration-200"
                placeholder="Describe your role and responsibilities"
            />
          </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Quitting *</label>
            <textarea
              name="reason_for_quitting"
              value={formData.reason_for_quitting}
              onChange={handleChange}
              required
              rows="3"
                className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm transition-all duration-200"
                placeholder="Explain why you left your previous job"
            />
          </div>
            
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Medical Conditions *</label>
            <input
              name="medical_condition"
              value={formData.medical_condition}
              onChange={handleChange}
              required
                className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm transition-all duration-200"
                placeholder="Any medical conditions (or 'None')"
            />
            </div>
          </div>
        </div>

        {/* Next of Kin Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">4</span>
            Next of Kin Information
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
            <input
              name="next_of_kin_name"
              value={formData.next_of_kin_name}
              onChange={handleChange}
              required
                  className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm transition-all duration-200"
                  placeholder="Next of kin full name"
            />
          </div>
              
          <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
            <input
              name="next_of_kin_phone"
              value={formData.next_of_kin_phone}
              onChange={handleChange}
              required
                  className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm transition-all duration-200"
                  placeholder="08012345678"
            />
          </div>
            </div>
            
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
            <input
              name="next_of_kin_address"
              value={formData.next_of_kin_address}
              onChange={handleChange}
              required
                className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm transition-all duration-200"
                placeholder="Next of kin residential address"
            />
          </div>
            
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Relationship *</label>
            <input
              name="next_of_kin_relationship"
              value={formData.next_of_kin_relationship}
              onChange={handleChange}
              required
                className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm transition-all duration-200"
                placeholder="e.g., Father, Mother, Spouse, Sibling"
            />
            </div>
          </div>
        </div>

        {/* Banking Information Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">5</span>
            Banking Information
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name *</label>
            <input
              name="bank_name"
              value={formData.bank_name}
              onChange={handleChange}
              required
                  className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm transition-all duration-200"
                  placeholder="Your bank name"
            />
          </div>
              
          <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Name *</label>
            <input
              name="account_name"
              value={formData.account_name}
              onChange={handleChange}
              required
                  className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm transition-all duration-200"
                  placeholder="Account holder name"
            />
          </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Number *</label>
              <div className="relative">
                <input
                  name="account_number"
                  value={formData.account_number}
                  onChange={handleChange}
                  required
                  placeholder="10 digits only"
                  className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm transition-all duration-200 ${
                    errors.account_number ? 'border-red-500' : formData.account_number && isValidAccountNumber(formData.account_number) ? 'border-green-500' : ''
                  }`}
                />
                {formData.account_number && isValidAccountNumber(formData.account_number) && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              {errors.account_number && (
                <p className="text-red-500 text-sm mt-1">{errors.account_number}</p>
              )}
            </div>
          </div>
        </div>

        {/* Passport Photo Upload Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">6</span>
            Passport Photo
          </h3>
          
          <div className="relative rounded-lg p-6 text-center hover:shadow-md transition-all duration-200 shadow-sm bg-gray-50">
            <label htmlFor="passport-photo-upload" className="cursor-pointer block">
          <input
            type="file"
            accept="image/*"
            onChange={handlePassportPhotoChange}
            required
                className="hidden"
                id="passport-photo-upload"
              />
              <div className="text-gray-600">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-2 text-sm">Click to upload passport photo</p>
                <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
          {passportPhoto && (
                  <p className="mt-2 text-green-600 text-sm font-medium">
                    ✓ Selected: {passportPhoto.name}
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
              'Submit Biodata Form'
            )}
          </button>
          
          <AlertDialog
            open={showConfirmDialog}
            type="warning"
            title="Confirm Submission"
            message="Are you sure you want to submit the Biodata Form? This action cannot be undone."
            confirmText="Submit Form"
            cancelText="Cancel"
            onConfirm={handleConfirmSubmit}
            onCancel={() => setShowConfirmDialog(false)}
            variant="default"
          />

          {/* Success Animation */}
          {showSuccess && (
            <SuccessAnimation 
              message="Biodata Form Submitted Successfully!" 
              onComplete={() => setShowSuccess(false)}
            />
          )}
        </div>
      </form>
    </div>
  );
}
