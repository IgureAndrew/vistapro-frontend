// src/components/ApplicantBiodataForm.jsx
import React, { useState } from "react";

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa",
  "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger",
  "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara", "FCT"
];

function ApplicantBiodataForm({ onSuccess }) {
  const [bioData, setBioData] = useState({
    marketer_id: "",
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
    id_document_url: "", // We'll store file info or URL here
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
    passport_photo_url: "",
  });

  // State to store the selected file
  const [idFile, setIdFile] = useState(null);

  // Handle changes in text/selection inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setBioData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle change for means of identification
  const handleIdentificationChange = (e) => {
    const { value } = e.target;
    setBioData((prev) => ({ ...prev, means_of_identification: value }));
    // Optionally clear any previously selected file if changing ID type
    setIdFile(null);
    // Also clear any stored file URL
    setBioData((prev) => ({ ...prev, id_document_url: "" }));
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type (.jpg or .jpeg)
      const validTypes = ["image/jpeg"];
      if (!validTypes.includes(file.type)) {
        alert("File must be in .jpg or .jpeg format.");
        e.target.value = "";
        return;
      }
      // Validate file size (<= 800 KB)
      if (file.size > 800 * 1024) {
        alert("File size must not exceed 800 KB.");
        e.target.value = "";
        return;
      }
      setIdFile(file);
      // For demonstration, you could set the file name or a generated URL.
      // In a real application you might upload the file to a storage service and then store the URL.
      setBioData((prev) => ({ ...prev, id_document_url: file.name }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    // If you need to handle file upload separately (e.g., using FormData),
    // you can do that here before sending the rest of the biodata.

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/verification/biodata`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(bioData),
        }
      );

      const data = await response.json();
      if (response.ok) {
        alert("Biodata submitted successfully!");
        if (onSuccess) onSuccess();
        // Optionally reset the form
        setBioData({
          marketer_id: "",
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
          id_document_url: "",
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
          passport_photo_url: "",
        });
        setIdFile(null);
      } else {
        alert(data.message || "Submission failed");
      }
    } catch (error) {
      console.error("Error submitting biodata:", error);
      alert("Error submitting biodata");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">APPLICANT BIO-DATA FORM</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              MARKETER ID:
            </label>
            <input
              type="text"
              name="marketer_id"
              placeholder="Enter your Marketer ID"
              value={bioData.marketer_id}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              NAME:
            </label>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={bioData.name}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
          {/* Other input fields ... */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              MEANS OF IDENTIFICATION:
            </label>
            <select
              name="means_of_identification"
              value={bioData.means_of_identification}
              onChange={handleIdentificationChange}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
              required
            >
              <option value="">Select Identification</option>
              <option value="Driver's License">Driver's License</option>
              <option value="Voter's Card">Voter's Card</option>
              <option value="Intl. Passport">Intl. Passport</option>
              <option value="National ID">National ID</option>
            </select>
          </div>

          {/* Conditional file upload for identification */}
          {bioData.means_of_identification && (
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700">
                Upload a valid image of your {bioData.means_of_identification}
              </label>
              <p className="text-xs text-gray-500">
                Image must be very clear, in .jpg or .jpeg format, and not more than 800KB.
              </p>
              <input
                type="file"
                accept=".jpg, .jpeg"
                onChange={handleFileUpload}
                className="block w-full border border-gray-300 rounded px-3 py-2 mt-1"
              />
              {idFile && (
                <p className="mt-1 text-xs text-green-600">
                  Selected file: {idFile.name}
                </p>
              )}
            </div>
          )}

          {/* Continue with remaining fields... */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              LAST PLACE OF WORK:
            </label>
            <input
              type="text"
              name="last_place_of_work"
              placeholder="Last Place of Work"
              value={bioData.last_place_of_work}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              JOB DESCRIPTION:
            </label>
            <textarea
              name="job_description"
              placeholder="Job Description"
              value={bioData.job_description}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            ></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              REASON FOR QUITING YOUR PREVIOUS JOB:
            </label>
            <textarea
              name="reason_for_quitting"
              placeholder="Reason for quitting your previous job"
              value={bioData.reason_for_quitting}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            ></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              ANY MEDICAL CONDITION WE NEED TO KNOW ABOUT:
            </label>
            <textarea
              name="medical_condition"
              placeholder="Any medical condition we need to know about"
              value={bioData.medical_condition}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            ></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              NEXT OF KIN:
            </label>
            <input
              type="text"
              name="next_of_kin_name"
              placeholder="Next of Kin Name"
              value={bioData.next_of_kin_name}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              NEXT OF KIN PHONE NO:
            </label>
            <input
              type="text"
              name="next_of_kin_phone"
              placeholder="Next of Kin Phone Number"
              value={bioData.next_of_kin_phone}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              NEXT OF KIN ADDRESS:
            </label>
            <input
              type="text"
              name="next_of_kin_address"
              placeholder="Next of Kin Address"
              value={bioData.next_of_kin_address}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              RELATIONSHIP:
            </label>
            <input
              type="text"
              name="next_of_kin_relationship"
              placeholder="Relationship with Next of Kin"
              value={bioData.next_of_kin_relationship}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold">ACCOUNT DETAIL:</h3>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              BANK NAME:
            </label>
            <input
              type="text"
              name="bank_name"
              placeholder="Bank Name"
              value={bioData.bank_name}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              ACCOUNT NAME:
            </label>
            <input
              type="text"
              name="account_name"
              placeholder="Account Name"
              value={bioData.account_name}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              ACCOUNT NO:
            </label>
            <input
              type="text"
              name="account_number"
              placeholder="Account Number"
              value={bioData.account_number}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
        </div>
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

export default ApplicantBiodataForm;
