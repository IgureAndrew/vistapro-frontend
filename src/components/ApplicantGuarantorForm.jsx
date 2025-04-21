// src/components/ApplicantGuarantorForm.jsx
import React, { useState } from "react";
import api from "../api";
import FormStepper from "./FormStepper";

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
        return alert(res.data.message || "Submission failed.");
      }

      alert(res.data.message || "Guarantor form submitted successfully.");

      // notify back‑end that we succeeded (so front‑end success endpoints no longer 404)
      await api.patch("/verification/guarantor-success");

      // advance stepper
      onSuccess?.();

      // reset everything
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
    } catch (err) {
      console.error(err);
      alert("Error submitting the guarantor form.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow rounded">
      {/* show step 2 in your FormStepper */}
      <FormStepper currentStep={2} />

      <h2 className="text-2xl font-bold mb-4">Guarantor Employment Form</h2>
      <p className="text-sm text-gray-600 mb-4">
        Acceptable Guarantors: Lecturer, Architects, Engineers, Teachers, Doctors, Lawyers, Nurses,
        Bankers, Accountants, Managers/Directors, Traditional rulers, Clergy, Senior Civil Servants.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1) Known to you */}
        <div>
          <label className="block font-semibold">Is the candidate well known to you?</label>
          <div className="mt-1 flex gap-6">
            {["yes", "no"].map((val) => (
              <label key={val}>
                <input
                  type="radio"
                  name="is_candidate_known"
                  value={val}
                  onChange={handleChange}
                  required
                />{" "}
                {val.charAt(0).toUpperCase() + val.slice(1)}
              </label>
            ))}
          </div>
        </div>

        {/* 2) Relationship */}
        <div>
          <label className="block font-semibold">Relationship with the candidate:</label>
          <input
            type="text"
            name="relationship"
            value={formData.relationship}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* 3) Known duration */}
        <div>
          <label className="block font-semibold">
            How long have you known the candidate? (Min 3 years)
          </label>
          <input
            type="text"
            name="known_duration"
            value={formData.known_duration}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* 4) Occupation */}
        <div>
          <label className="block font-semibold">Your Occupation:</label>
          <input
            type="text"
            name="occupation"
            value={formData.occupation}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* 5) Means of ID */}
        <div>
          <label className="block font-semibold">Means of Identification:</label>
          <select
            name="means_of_identification"
            value={formData.means_of_identification}
            onChange={handleMeansChange}
            required
            className="w-full border rounded px-3 py-2"
          >
            <option value="">-- Select --</option>
            {IDENTIFICATION_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* 6) ID file upload */}
        {formData.means_of_identification && (
          <div>
            <label className="block font-semibold">
              Upload your {formData.means_of_identification} image:
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleIdentificationFileChange}
              required
              className="w-full border rounded p-2"
            />
          </div>
        )}

        {/* 7) Guarantor Full Name */}
        <div>
          <label className="block font-semibold">Guarantor Full Name:</label>
          <input
            type="text"
            name="guarantor_full_name"
            value={formData.guarantor_full_name}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* 8) Home Address */}
        <div>
          <label className="block font-semibold">Guarantor Home Address:</label>
          <textarea
            name="guarantor_home_address"
            value={formData.guarantor_home_address}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* 9) Office Address */}
        <div>
          <label className="block font-semibold">Guarantor Office Address:</label>
          <textarea
            name="guarantor_office_address"
            value={formData.guarantor_office_address}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* 10) Email */}
        <div>
          <label className="block font-semibold">Guarantor Email:</label>
          <input
            type="email"
            name="guarantor_email"
            value={formData.guarantor_email}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* 11) Phone */}
        <div>
          <label className="block font-semibold">Guarantor Phone (11 digits):</label>
          <input
            type="text"
            name="guarantor_phone"
            value={formData.guarantor_phone}
            onChange={handleChange}
            required
            pattern="\d{11}"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* 12) Candidate Name (optional) */}
        <div>
          <label className="block font-semibold">Candidate Name (if any):</label>
          <input
            type="text"
            name="candidate_name"
            value={formData.candidate_name}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* 13) Guarantor Signature */}
        <div>
          <label className="block font-semibold">Upload Guarantor Signature:</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleSignatureFileChange}
            required
            className="w-full border rounded p-2"
          />
          {signatureFile && (
            <p className="mt-1 text-xs text-green-600">
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
            Submit Guarantor Form
          </button>
        </div>
      </form>
    </div>
  );
}
