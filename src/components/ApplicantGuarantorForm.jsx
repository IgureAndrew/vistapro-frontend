// src/components/ApplicantGuarantorForm.jsx
import React, { useState } from "react";

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa",
  "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger",
  "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara", "FCT"
];

function ApplicantGuarantorForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    marketer_id: "",
    is_candidate_well_known: false,
    relationship: "",
    known_duration: "",
    occupation: "",
    id_document_url: "",
    passport_photo_url: "",
    signature_url: "",
    guarantor_full_name: "",
    guarantor_home_address: "",
    guarantor_office_address: "",
    guarantor_telephone: "",
    guarantor_email: "",
    guarantor_date: "",
    state_of_residence: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/verification/guarantor`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Guarantor form submitted successfully!");
        if(onSuccess) onSuccess();
      } else {
        alert(data.message || "Submission failed");
      }
    } catch (error) {
      console.error("Error submitting guarantor form:", error);
      alert("Error submitting guarantor form");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">GUARANTOR FORM FOR EMPLOYMENT</h2>
      <div className="mb-6 text-sm text-gray-700 leading-relaxed">
        <p>
          Our employment process requires that a person seeking for employment in our establishment should
          produce a capable, responsible and acceptable person as a Guarantor subject to employment confirmation.
          If you are willing to stand as a guarantor for the said applicant, kindly complete this form.
          PLEASE note that it is dangerous to stand as a guarantor to someone whom you do not know.
          Guarantors are warned that any false declaration on this form will attract severe consequences, which may
          include prosecution.
        </p>
        <p className="mt-2">
          Mr/Mrs/Miss/Ms{" "}
          <input
            type="text"
            placeholder="Enter name"
            className="inline-block border-b border-gray-300 focus:outline-none w-48"
          />{" "}
          who is being considered for employment has given your name as his/her guarantor.
          Please confirm your willingness to guarantee him/her any LOSS by completing this form.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto">
        {/* Section 1: Basic Guarantor Commitment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            1. Is the candidate well known to you?
          </label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="is_candidate_well_known"
                value="true"
                checked={formData.is_candidate_well_known === true}
                onChange={() => setFormData((prev) => ({ ...prev, is_candidate_well_known: true }))}
                className="mr-2"
                required
              />
              Yes
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="is_candidate_well_known"
                value="false"
                checked={formData.is_candidate_well_known === false}
                onChange={() => setFormData((prev) => ({ ...prev, is_candidate_well_known: false }))}
                className="mr-2"
                required
              />
              No
            </label>
          </div>
        </div>

        {/* New Field: Marketer ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Marketer ID
          </label>
          <input
            type="text"
            name="marketer_id"
            placeholder="Enter your Marketer ID"
            value={formData.marketer_id}
            onChange={handleChange}
            className="block w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>

        {/* Section 2: Guarantor Personal Details */}
        <hr className="my-4" />
        <h3 className="text-lg font-semibold mb-2">Guarantor Personal Details</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Guarantor's Full Name
            </label>
            <input
              type="text"
              name="guarantor_full_name"
              placeholder="Your Full Name"
              value={formData.guarantor_full_name}
              onChange={handleChange}
              className="block w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Guarantor's Home Address
            </label>
            <input
              type="text"
              name="guarantor_home_address"
              placeholder="Home Address"
              value={formData.guarantor_home_address}
              onChange={handleChange}
              className="block w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Guarantor's Office Address
            </label>
            <input
              type="text"
              name="guarantor_office_address"
              placeholder="Office Address"
              value={formData.guarantor_office_address}
              onChange={handleChange}
              className="block w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Guarantor's Telephone
            </label>
            <input
              type="text"
              name="guarantor_telephone"
              placeholder="Telephone Number"
              value={formData.guarantor_telephone}
              onChange={handleChange}
              className="block w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Guarantor's Email Address
            </label>
            <input
              type="email"
              name="guarantor_email"
              placeholder="Email Address"
              value={formData.guarantor_email}
              onChange={handleChange}
              className="block w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              type="date"
              name="guarantor_date"
              value={formData.guarantor_date}
              onChange={handleChange}
              className="block w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              State of Residence
            </label>
            <select
              name="state_of_residence"
              value={formData.state_of_residence}
              onChange={handleChange}
              className="block w-full border border-gray-300 rounded px-3 py-2"
              required
            >
              <option value="">Select State</option>
              {NIGERIAN_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Section 3: Document Uploads */}
        <hr className="my-4" />
        <h3 className="text-lg font-semibold mb-2">Document Uploads</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Upload ID Document
            </label>
            <input
              type="text"
              name="id_document_url"
              placeholder="URL for ID Document"
              value={formData.id_document_url}
              onChange={handleChange}
              className="block w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Upload Passport Photo
            </label>
            <input
              type="text"
              name="passport_photo_url"
              placeholder="URL for Passport Photo"
              value={formData.passport_photo_url}
              onChange={handleChange}
              className="block w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Upload Signature
            </label>
            <input
              type="text"
              name="signature_url"
              placeholder="URL for Signature"
              value={formData.signature_url}
              onChange={handleChange}
              className="block w-full border border-gray-300 rounded px-3 py-2"
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

export default ApplicantGuarantorForm;
