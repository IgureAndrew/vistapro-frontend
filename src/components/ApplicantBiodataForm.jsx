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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBioData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
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
          <div>
            <label className="block text-sm font-medium text-gray-700">
              ADDRESS:
            </label>
            <input
              type="text"
              name="address"
              placeholder="Residential Address"
              value={bioData.address}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              PHONE NO:
            </label>
            <input
              type="text"
              name="phone"
              placeholder="Phone Number"
              value={bioData.phone}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              RELIGION:
            </label>
            <input
              type="text"
              name="religion"
              placeholder="Religion"
              value={bioData.religion}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              DATE OF BIRTH:
            </label>
            <input
              type="date"
              name="date_of_birth"
              value={bioData.date_of_birth}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              MARITAL STATUS:
            </label>
            <input
              type="text"
              name="marital_status"
              placeholder="Marital Status"
              value={bioData.marital_status}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              STATE OF ORIGIN:
            </label>
            <select
              name="state_of_origin"
              value={bioData.state_of_origin}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
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
          <div>
            <label className="block text-sm font-medium text-gray-700">
              STATE OF RESIDENCE:
            </label>
            <select
              name="state_of_residence"
              value={bioData.state_of_residence}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
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
          <div>
            <label className="block text-sm font-medium text-gray-700">
              MOTHER’S MAIDEN NAME:
            </label>
            <input
              type="text"
              name="mothers_maiden_name"
              placeholder="Mother's Maiden Name"
              value={bioData.mothers_maiden_name}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              SCHOOL ATTENDED WITH DATE:
            </label>
            <input
              type="text"
              name="school_attended"
              placeholder="School attended (with dates)"
              value={bioData.school_attended}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              MEANS OF IDENTIFICATION:
            </label>
            <select
              name="means_of_identification"
              value={bioData.means_of_identification}
              onChange={handleChange}
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
