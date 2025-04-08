// src/components/ApplicantBiodataForm.jsx
import React, { useState } from "react";

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa",
  "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger",
  "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara", "FCT"
];

function ApplicantBiodataForm({ onSuccess }) {
  // Retrieve logged in user from localStorage and extract unique ID
  const storedUser = localStorage.getItem("user");
  const parsedUser = storedUser ? JSON.parse(storedUser) : {};
  const marketerUniqueId = parsedUser.unique_id || "";

  const [bioData, setBioData] = useState({
    marketer_id: marketerUniqueId, // pre-populated with marketer's unique id
    name: "",
    date_of_birth: "",
    address: "",
    phone: "",
    religion: "",
    marital_status: "",
    state_of_origin: "",
    state_of_residence: "",
    mothers_maiden_name: "",
    school_attended: "",
    means_of_identification: "",
    id_document_url: "", // Will be replaced by file upload
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
    passport_photo_url: "", // Will be replaced by file upload
  });

  // State to hold the selected files
  const [idFile, setIdFile] = useState(null);
  const [passportFile, setPassportFile] = useState(null);

  // Handle changes in text/selection inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setBioData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle change for means of identification
  const handleIdentificationChange = (e) => {
    const { value } = e.target;
    setBioData((prev) => ({ ...prev, means_of_identification: value }));
    // Clear previously selected file and URL field when changing the ID type
    setIdFile(null);
    setBioData((prev) => ({ ...prev, id_document_url: "" }));
  };

  // Handle file upload for ID Document
  const handleIdFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type (.jpg or .jpeg)
      const validTypes = ["image/jpeg", "image/jpg"];
      if (!validTypes.includes(file.type.toLowerCase())) {
        alert("ID Document must be in .jpg or .jpeg format.");
        e.target.value = "";
        return;
      }
      // Validate file size (<= 800 KB)
      if (file.size > 800 * 1024) {
        alert("ID Document file size must not exceed 800 KB.");
        e.target.value = "";
        return;
      }
      setIdFile(file);
      // For demo, we set the file name as a placeholder for the URL.
      setBioData((prev) => ({ ...prev, id_document_url: file.name }));
    }
  };

  // Handle file upload for Passport Photo
  const handlePassportFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/jpg"];
      if (!validTypes.includes(file.type.toLowerCase())) {
        alert("Passport Photo must be in .jpg or .jpeg format.");
        e.target.value = "";
        return;
      }
      if (file.size > 800 * 1024) {
        alert("Passport Photo file size must not exceed 800 KB.");
        e.target.value = "";
        return;
      }
      setPassportFile(file);
      setBioData((prev) => ({ ...prev, passport_photo_url: file.name }));
    }
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
        // Optionally reset the form; prepopulate marketer_id again.
        setBioData({
          marketer_id: marketerUniqueId,
          name: "",
          date_of_birth: "",
          address: "",
          phone: "",
          religion: "",
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
        setPassportFile(null);
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
          {/* Marketer ID (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              MARKETER ID:
            </label>
            <input
              type="text"
              name="marketer_id"
              placeholder="Your Marketer Unique ID"
              value={bioData.marketer_id}
              readOnly
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
              required
              onChange={handleChange}
            />
          </div>
          {/* Name */}
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
          {/* Date of Birth */}
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
              required
            />
          </div>
          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              ADDRESS:
            </label>
            <input
              type="text"
              name="address"
              placeholder="Address"
              value={bioData.address}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
          {/* Phone (11 digits only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              PHONE (11 digits):
            </label>
            <input
              type="text"
              name="phone"
              placeholder="Phone Number"
              value={bioData.phone}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
              pattern="\d{11}"
              required
            />
          </div>
          {/* Religion */}
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
              required
            />
          </div>
          {/* Marital Status */}
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
              required
            />
          </div>
          {/* State of Origin */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              STATE OF ORIGIN:
            </label>
            <input
              type="text"
              name="state_of_origin"
              placeholder="State of Origin"
              value={bioData.state_of_origin}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
          {/* State of Residence */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              STATE OF RESIDENCE:
            </label>
            <input
              type="text"
              name="state_of_residence"
              placeholder="State of Residence"
              value={bioData.state_of_residence}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
          {/* Mother's Maiden Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              MOTHER'S MAIDEN NAME:
            </label>
            <input
              type="text"
              name="mothers_maiden_name"
              placeholder="Mother's Maiden Name"
              value={bioData.mothers_maiden_name}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
          {/* School Attended */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              SCHOOL ATTENDED:
            </label>
            <input
              type="text"
              name="school_attended"
              placeholder="School Attended"
              value={bioData.school_attended}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
          {/* Means of Identification */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              MEANS OF IDENTIFICATION:
            </label>
            <select
              name="means_of_identification"
              value={bioData.means_of_identification}
              onChange={(e) => {
                handleIdentificationChange(e);
              }}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
              required
              {...{ value: bioData.means_of_identification }} // Spread current value
            >
              <option value="">Select Identification</option>
              <option value="Driver's License">Driver's License</option>
              <option value="Voter's Card">Voter's Card</option>
              <option value="Intl. Passport">Intl. Passport</option>
              <option value="National ID">National ID</option>
            </select>
            {/* No need to show error if Yup handles it */}
          </div>
          {/* File Upload for ID Document */}
          {bioData.means_of_identification && (
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700">
                Upload a valid image of your {bioData.means_of_identification} (JPEG/JPG):
              </label>
              <p className="text-xs text-gray-500">Image must be clear and not more than 800KB.</p>
              <input
                type="file"
                accept=".jpg,.jpeg"
                onChange={handleIdFileUpload}
                className="block w-full border border-gray-300 rounded px-3 py-2 mt-1"
                required
              />
              {idFile && (
                <p className="mt-1 text-xs text-green-600">Selected file: {idFile.name}</p>
              )}
            </div>
          )}
          {/* Last Place of Work */}
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
          {/* Job Description */}
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
          {/* Reason for Quitting */}
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
          {/* Medical Condition */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              ANY MEDICAL CONDITION WE NEED TO KNOW ABOUT:
            </label>
            <input
              type="text"
              name="medical_condition"
              placeholder="Any medical condition we need to know about"
              value={bioData.medical_condition}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          {/* Next of Kin Name */}
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
              required
            />
          </div>
          {/* Next of Kin Phone (11 digits) */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              NEXT OF KIN PHONE (11 digits):
            </label>
            <input
              type="text"
              name="next_of_kin_phone"
              placeholder="Next of Kin Phone Number"
              value={bioData.next_of_kin_phone}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
              pattern="\d{11}"
              required
            />
          </div>
          {/* Next of Kin Address */}
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
              required
            />
          </div>
          {/* Relationship with Next of Kin */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              RELATIONSHIP WITH NEXT OF KIN:
            </label>
            <input
              type="text"
              name="next_of_kin_relationship"
              placeholder="Relationship with Next of Kin"
              value={bioData.next_of_kin_relationship}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
          {/* Account Details Header */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold">ACCOUNT DETAIL:</h3>
          </div>
          {/* Bank Name */}
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
          {/* Account Name */}
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
          {/* Account Number (10 digits) */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              ACCOUNT NUMBER (10 digits):
            </label>
            <input
              type="text"
              name="account_number"
              placeholder="Account Number"
              value={bioData.account_number}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
              pattern="\d{10}"
              required
            />
          </div>
          {/* File Upload for Passport Photo */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              PASSPORT PHOTO (JPEG/JPG):
            </label>
            <input
              type="file"
              accept=".jpg,.jpeg"
              onChange={handlePassportFileUpload}
              className="border rounded px-3 py-2 w-full"
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
