// src/components/ApplicantBiodataForm.jsx
import React, { useState } from "react";

// List of Nigerian states.
const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
  "FCT"
];

// Options for Means of Identification.
const IDENTIFICATION_OPTIONS = [
  "NIN",
  "International Passport",
  "Driver's License"
];

function ApplicantBiodataForm({ onSuccess }) {
  // Form state for text and select inputs.
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    religion: "", // e.g., "Christian" or "Muslim"
    date_of_birth: "",
    marital_status: "", // e.g., "Single" or "Married"
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
    account_number: "",
  });

  // File state for uploads.
  const [passportPhoto, setPassportPhoto] = useState(null);
  const [identificationFile, setIdentificationFile] = useState(null);

  // Handler for text and select input changes.
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handler for file input changes.
  const handlePassportPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPassportPhoto(file);
    }
  };

  const handleIdentificationFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIdentificationFile(file);
    }
  };

  // Simple client-side validations.
  const isValidPhone = (phone) => /^\d{11}$/.test(phone);
  const isValidAccountNumber = (acct) => /^\d{10}$/.test(acct);

  // Handle form submission.
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate phone and account numbers.
    if (!isValidPhone(formData.phone)) {
      alert("Phone number must be exactly 11 digits.");
      return;
    }
    if (!isValidAccountNumber(formData.account_number)) {
      alert("Account number must be exactly 10 digits.");
      return;
    }

    // Create a FormData object to bundle text fields and file uploads.
    const payload = new FormData();
    for (const key in formData) {
      payload.append(key, formData[key]);
    }
    // Append passport photo.
    if (passportPhoto) {
      payload.append("passport_photo", passportPhoto);
    }
    // Append identification file if a means of identification is selected.
    if (formData.means_of_identification && identificationFile) {
      payload.append("id_document", identificationFile);
    }

    try {
      const token = localStorage.getItem("token");
      // Let the browser set the correct Content-Type when using FormData.
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/verification/bio-data`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: payload,
        }
      );
      const data = await response.json();
      if (response.ok) {
        alert("Biodata submitted successfully!");
        if (onSuccess) onSuccess();
        // Clear the form.
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
          account_number: "",
        });
        setPassportPhoto(null);
        setIdentificationFile(null);
      } else {
        alert(data.message || "Submission failed.");
      }
    } catch (error) {
      console.error("Error submitting biodata:", error);
      alert("Error submitting biodata.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">APPLICANT BIO-DATA FORM</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Details */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">NAME:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full border rounded p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ADDRESS:</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="mt-1 block w-full border rounded p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">PHONE NO:</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="mt-1 block w-full border rounded p-2"
              placeholder="e.g., 08012345678"
              required
              pattern="\d{11}"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">RELIGION:</label>
            <select
              name="religion"
              value={formData.religion}
              onChange={handleChange}
              className="mt-1 block w-full border rounded p-2"
              required
            >
              <option value="">Select...</option>
              <option value="Christian">Christian</option>
              <option value="Muslim">Muslim</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">DATE OF BIRTH:</label>
            <input
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              className="mt-1 block w-full border rounded p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">MARITAL STATUS:</label>
            <select
              name="marital_status"
              value={formData.marital_status}
              onChange={handleChange}
              className="mt-1 block w-full border rounded p-2"
              required
            >
              <option value="">Select...</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">STATE OF ORIGIN:</label>
              <select
                name="state_of_origin"
                value={formData.state_of_origin}
                onChange={handleChange}
                className="mt-1 block w-full border rounded p-2"
                required
              >
                <option value="">Select...</option>
                {NIGERIAN_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">STATE OF RESIDENCE:</label>
              <select
                name="state_of_residence"
                value={formData.state_of_residence}
                onChange={handleChange}
                className="mt-1 block w-full border rounded p-2"
                required
              >
                <option value="">Select...</option>
                {NIGERIAN_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">MOTHER’S MAIDEN NAME:</label>
            <input
              type="text"
              name="mothers_maiden_name"
              value={formData.mothers_maiden_name}
              onChange={handleChange}
              className="mt-1 block w-full border rounded p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">SCHOOL ATTENDED WITH DATE:</label>
            <input
              type="text"
              name="school_attended"
              value={formData.school_attended}
              onChange={handleChange}
              className="mt-1 block w-full border rounded p-2"
              placeholder="e.g., XYZ University (2005-2009)"
              required
            />
          </div>
        </div>

        {/* Means of Identification Section */}
        <div className="border-t pt-4">
          <h3 className="text-xl font-semibold mb-2">MEANS OF IDENTIFICATION:</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Select your Means of Identification:
            </label>
            <select
              name="means_of_identification"
              value={formData.means_of_identification}
              onChange={handleChange}
              className="mt-1 block w-full border rounded p-2"
              required
            >
              <option value="">Select...</option>
              {IDENTIFICATION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          {formData.means_of_identification && (
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700">
                Upload image of your {formData.means_of_identification}:
              </label>
              <input
                type="file"
                accept="image/jpeg, image/jpg, image/png"
                onChange={handleIdentificationFileChange}
                className="mt-1 block"
                required
              />
            </div>
          )}
        </div>

        {/* Work and Other Details */}
        <div className="border-t pt-4 grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">LAST PLACE OF WORK:</label>
            <input
              type="text"
              name="last_place_of_work"
              value={formData.last_place_of_work}
              onChange={handleChange}
              className="mt-1 block w-full border rounded p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">JOB DESCRIPTION:</label>
            <textarea
              name="job_description"
              value={formData.job_description}
              onChange={handleChange}
              className="mt-1 block w-full border rounded p-2"
              rows="3"
              required
            ></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">REASON FOR QUITING YOUR PREVIOUS JOB:</label>
            <textarea
              name="reason_for_quitting"
              value={formData.reason_for_quitting}
              onChange={handleChange}
              className="mt-1 block w-full border rounded p-2"
              rows="3"
              required
            ></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ANY MEDICAL CONDITION WE NEED TO KNOW ABOUT:</label>
            <input
              type="text"
              name="medical_condition"
              value={formData.medical_condition}
              onChange={handleChange}
              className="mt-1 block w-full border rounded p-2"
              required
            />
          </div>
        </div>

        {/* Next of Kin Details */}
        <div className="border-t pt-4 grid grid-cols-1 gap-4">
          <h3 className="text-xl font-semibold">NEXT OF KIN</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700">NAME:</label>
            <input
              type="text"
              name="next_of_kin_name"
              value={formData.next_of_kin_name}
              onChange={handleChange}
              className="mt-1 block w-full border rounded p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">PHONE NO:</label>
            <input
              type="text"
              name="next_of_kin_phone"
              value={formData.next_of_kin_phone}
              onChange={handleChange}
              className="mt-1 block w-full border rounded p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ADDRESS:</label>
            <input
              type="text"
              name="next_of_kin_address"
              value={formData.next_of_kin_address}
              onChange={handleChange}
              className="mt-1 block w-full border rounded p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">RELATIONSHIP:</label>
            <input
              type="text"
              name="next_of_kin_relationship"
              value={formData.next_of_kin_relationship}
              onChange={handleChange}
              className="mt-1 block w-full border rounded p-2"
              required
            />
          </div>
        </div>

        {/* Account Details */}
        <div className="border-t pt-4 grid grid-cols-1 gap-4">
          <h3 className="text-xl font-semibold">ACCOUNT DETAILS</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700">BANK NAME:</label>
            <input
              type="text"
              name="bank_name"
              value={formData.bank_name}
              onChange={handleChange}
              className="mt-1 block w-full border rounded p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ACCOUNT NAME:</label>
            <input
              type="text"
              name="account_name"
              value={formData.account_name}
              onChange={handleChange}
              className="mt-1 block w-full border rounded p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ACCOUNT NO:</label>
            <input
              type="text"
              name="account_number"
              value={formData.account_number}
              onChange={handleChange}
              className="mt-1 block w-full border rounded p-2"
              required
              placeholder="10 digits only"
              pattern="\d{10}"
            />
          </div>
        </div>

        {/* Upload Passport Photo */}
        <div className="border-t pt-4">
          <h3 className="text-xl font-semibold mb-2">Upload Passport Photo</h3>
          <input
            type="file"
            accept="image/jpeg, image/jpg, image/png"
            onChange={handlePassportPhotoChange}
            className="block"
            required
          />
          {passportPhoto && (
            <p className="mt-1 text-xs text-green-600">File selected: {passportPhoto.name}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded"
          >
            Submit Biodata Form
          </button>
        </div>
      </form>
    </div>
  );
}

export default ApplicantBiodataForm;
