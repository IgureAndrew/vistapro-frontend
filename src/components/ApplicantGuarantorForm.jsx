// src/components/ApplicantGuarantorForm.jsx
import React, { useState } from "react";

// Options for Means of Identification.
const IDENTIFICATION_OPTIONS = [
  "NIN",
  "International Passport",
  "Driver's License"
];

const ApplicantGuarantorForm = ({ onSuccess }) => {
  // Form state for text and selection inputs.
  const [formData, setFormData] = useState({
    is_candidate_known: "",   // "yes" or "no"
    relationship: "",
    known_duration: "",
    occupation: "",
    means_of_identification: "", // Dropdown selection
    guarantor_full_name: "",
    guarantor_home_address: "",
    guarantor_office_address: "",
    guarantor_email: "",
    guarantor_phone: "",
    candidate_name: "",       // Optional field
  });

  // Separate state for file uploads.
  // File for the selected identification document.
  const [identificationFile, setIdentificationFile] = useState(null);
  // File for the guarantor's signature.
  const [signatureFile, setSignatureFile] = useState(null);

  // Handle changes for text and radio inputs.
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle changes when the means_of_identification dropdown is changed.
  // Clear any previously selected identification file.
  const handleMeansChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      means_of_identification: e.target.value,
    }));
    setIdentificationFile(null);
  };

  // File input change for the identification file.
  const handleIdentificationFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIdentificationFile(file);
    }
  };

  // File input change for the signature image.
  const handleSignatureFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSignatureFile(file);
    }
  };

  // Handle form submission.
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Create a FormData object to combine text fields and file uploads.
    const payload = new FormData();

    // Append all text fields.
    for (const key in formData) {
      payload.append(key, formData[key]);
    }

    // Append file fields with the names expected by the backend.
    // For the identification file upload, use the field name "identification_file".
    if (formData.means_of_identification && identificationFile) {
      payload.append("identification_file", identificationFile);
    }
    // Append the signature image file under the field "signature".
    if (signatureFile) {
      payload.append("signature", signatureFile);
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/verification/guarantor`,
        {
          method: "POST",
          // When using FormData, do not manually set Content-Type.
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: payload,
        }
      );

      const result = await res.json();
      if (res.ok) {
        alert("Guarantor form submitted successfully!");
        if (onSuccess) onSuccess();
        // Reset form state.
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
      } else {
        alert(result.message || "Submission failed.");
      }
    } catch (error) {
      console.error("Error submitting guarantor form:", error);
      alert("Error submitting form.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 border rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Guarantor Form for Employment</h2>
      <p className="text-sm text-gray-600 mb-4">
        Acceptable Guarantors: Lecturer, Architects, Engineers, Teachers, Doctors,
        Lawyers, Nurses, Bankers, Accountant, Managers/Directors of reputable companies,
        Traditional rulers and Clergy from well-recognized churches/mosques, Senior Civil
        Servants not lower than Level 8 (excluding uniform personnel). Any other levels are not accepted.
      </p>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Candidate Known */}
        <div>
          <label className="block font-semibold">Is the candidate well known to you?</label>
          <div className="mt-1">
            <label className="mr-4">
              <input
                type="radio"
                name="is_candidate_known"
                value="yes"
                onChange={handleChange}
                required
              />{" "}
              Yes
            </label>
            <label>
              <input
                type="radio"
                name="is_candidate_known"
                value="no"
                onChange={handleChange}
                required
              />{" "}
              No
            </label>
          </div>
        </div>
        {/* Relationship */}
        <div>
          <label className="block font-semibold">Relationship with the candidate:</label>
          <input
            type="text"
            name="relationship"
            value={formData.relationship}
            onChange={handleChange}
            required
            className="w-full border rounded p-2"
          />
        </div>
        {/* Known Duration */}
        <div>
          <label className="block font-semibold">How long have you known the candidate? (Min 3 years):</label>
          <input
            type="text"
            name="known_duration"
            value={formData.known_duration}
            onChange={handleChange}
            required
            className="w-full border rounded p-2"
          />
        </div>
        {/* Occupation */}
        <div>
          <label className="block font-semibold">Your Occupation:</label>
          <input
            type="text"
            name="occupation"
            value={formData.occupation}
            onChange={handleChange}
            required
            className="w-full border rounded p-2"
          />
        </div>
        {/* Means of Identification Dropdown */}
        <div>
          <label className="block font-semibold">Means of Identification:</label>
          <select
            name="means_of_identification"
            value={formData.means_of_identification}
            onChange={handleMeansChange}
            required
            className="w-full border rounded p-2"
          >
            <option value="">-- Select Identification Type --</option>
            {IDENTIFICATION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        {/* Identification File Upload (shown only if an identification type is selected) */}
        {formData.means_of_identification && (
          <div>
            <label className="block font-semibold">
              Upload image of your {formData.means_of_identification}:
            </label>
            <input
              type="file"
              accept="image/jpeg, image/jpg, image/png"
              onChange={handleIdentificationFileChange}
              required
              className="w-full border rounded p-2"
            />
          </div>
        )}
        {/* Guarantor Full Name */}
        <div>
          <label className="block font-semibold">Guarantor Full Name:</label>
          <input
            type="text"
            name="guarantor_full_name"
            value={formData.guarantor_full_name}
            onChange={handleChange}
            required
            className="w-full border rounded p-2"
          />
        </div>
        {/* Guarantor Home Address */}
        <div>
          <label className="block font-semibold">Guarantor Home Address:</label>
          <textarea
            name="guarantor_home_address"
            value={formData.guarantor_home_address}
            onChange={handleChange}
            required
            className="w-full border rounded p-2"
          ></textarea>
        </div>
        {/* Guarantor Office Address */}
        <div>
          <label className="block font-semibold">Guarantor Office Address:</label>
          <textarea
            name="guarantor_office_address"
            value={formData.guarantor_office_address}
            onChange={handleChange}
            required
            className="w-full border rounded p-2"
          ></textarea>
        </div>
        {/* Guarantor Email */}
        <div>
          <label className="block font-semibold">Guarantor Email Address:</label>
          <input
            type="email"
            name="guarantor_email"
            value={formData.guarantor_email}
            onChange={handleChange}
            required
            className="w-full border rounded p-2"
          />
        </div>
        {/* Guarantor Phone */}
        <div>
          <label className="block font-semibold">Guarantor Telephone Number (11 digits):</label>
          <input
            type="text"
            name="guarantor_phone"
            value={formData.guarantor_phone}
            onChange={handleChange}
            required
            pattern="\d{11}"
            placeholder="e.g., 08012345678"
            className="w-full border rounded p-2"
          />
        </div>
        {/* Candidate Name (Optional) */}
        <div>
          <label className="block font-semibold">Candidate Name (if applicable):</label>
          <input
            type="text"
            name="candidate_name"
            value={formData.candidate_name}
            onChange={handleChange}
            className="w-full border rounded p-2"
          />
        </div>
        {/* File Upload for Guarantor Signature */}
        <div>
          <label className="block font-semibold">Upload Guarantor Signature:</label>
          <input
            type="file"
            accept="image/jpeg, image/jpg, image/png"
            onChange={handleSignatureFileChange}
            required
            className="w-full border rounded p-2"
          />
          {signatureFile && (
            <p className="mt-1 text-xs text-green-600">
              File selected: {signatureFile.name}
            </p>
          )}
        </div>
        {/* Submit Button */}
        <div className="flex justify-end">
          <button type="submit" className="bg-blue-600 text-white font-semibold px-4 py-2 rounded">
            Submit Guarantor Form
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplicantGuarantorForm;
