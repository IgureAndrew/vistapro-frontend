// src/components/ApplicantBiodataForm.jsx
import React, { useState } from "react";
import api from "../api";
import FormStepper from "./FormStepper";

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

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(f => ({ ...f, [name]: value }));
    setErrors(errs => ({ ...errs, [name]: null }));
  };
  const handlePassportPhotoChange = e =>
    e.target.files[0] && setPassportPhoto(e.target.files[0]);
  const handleIdentificationFileChange = e =>
    e.target.files[0] && setIdentificationFile(e.target.files[0]);

  const isValidPhone = phone => /^\d{11}$/.test(phone);
  const isValidAccountNumber = acct => /^\d{10}$/.test(acct);

  const handleSubmit = async e => {
    e.preventDefault();
    // client-side format checks
    if (!isValidPhone(formData.phone)) {
      setErrors({ phone: "Phone number must be exactly 11 digits." });
      return;
    }
    if (!isValidAccountNumber(formData.account_number)) {
      setErrors({ account_number: "Account number must be exactly 10 digits." });
      return;
    }

    const payload = new FormData();
    Object.entries(formData).forEach(([k, v]) => payload.append(k, v));
    if (passportPhoto) payload.append("passport_photo", passportPhoto);
    if (formData.means_of_identification && identificationFile) {
      payload.append("id_document", identificationFile);
    }


    try {
      const res1 = await api.post("/verification/bio-data", payload);
      if (res1.status !== 201) {
        return alert(res1.data.message || "Biodata submission failed.");
      }
      await api.patch("/verification/biodata-success");
      alert("Biodata submitted successfully!");
      onSuccess?.();

      // reset form
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
     setErrors({});
    } catch (err) {
      const { field, message } = err.response?.data || {};
      if (field) {
        setErrors({ [field]: message });
      } else {
        alert("Unexpected error, please try again.");
      }
    }
  };

  return (
    <div className="max-w-3xl w-full mx-auto p-4 md:p-6 bg-white shadow rounded">
      <FormStepper currentStep={1} />

      <h2 className="text-2xl font-bold mb-4">APPLICANT BIO-DATA FORM</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name & Address full width */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium">NAME:</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full border rounded p-2"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium">ADDRESS:</label>
            <input
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              className="mt-1 block w-full border rounded p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">PHONE NO:</label>
             <input
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            placeholder="08012345678"
            className="mt-1 block w-full border rounded p-2"
          />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
          )}
          </div>
          <div>
            <label className="block text-sm font-medium">RELIGION:</label>
            <select
              name="religion"
              value={formData.religion}
              onChange={handleChange}
              required
              className="mt-1 block w-full border rounded p-2"
            >
              <option value="">Select…</option>
              <option>Christian</option>
              <option>Muslim</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">DATE OF BIRTH:</label>
            <input
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              required
              className="mt-1 block w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">MARITAL STATUS:</label>
            <select
              name="marital_status"
              value={formData.marital_status}
              onChange={handleChange}
              required
              className="mt-1 block w-full border rounded p-2"
            >
              <option value="">Select…</option>
              <option>Single</option>
              <option>Married</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">STATE OF ORIGIN:</label>
            <select
              name="state_of_origin"
              value={formData.state_of_origin}
              onChange={handleChange}
              required
              className="mt-1 block w-full border rounded p-2"
            >
              <option value="">Select…</option>
              {NIGERIAN_STATES.map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">STATE OF RESIDENCE:</label>
            <select
              name="state_of_residence"
              value={formData.state_of_residence}
              onChange={handleChange}
              required
              className="mt-1 block w-full border rounded p-2"
            >
              <option value="">Select…</option>
              {NIGERIAN_STATES.map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium">MOTHER’S MAIDEN NAME:</label>
            <input
              name="mothers_maiden_name"
              value={formData.mothers_maiden_name}
              onChange={handleChange}
              required
              className="mt-1 block w-full border rounded p-2"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium">
              SCHOOL ATTENDED WITH DATE:
            </label>
            <input
              name="school_attended"
              value={formData.school_attended}
              onChange={handleChange}
              required
              placeholder="e.g., XYZ University (2005–2009)"
              className="mt-1 block w-full border rounded p-2"
            />
          </div>
        </div>

        {/* Means of Identification */}
        <div className="border-t pt-4">
          <h3 className="text-xl font-semibold mb-2">
            MEANS OF IDENTIFICATION
          </h3>
          <select
            name="means_of_identification"
            value={formData.means_of_identification}
            onChange={handleChange}
            required
            className="mt-1 block w-full border rounded p-2"
          >
            <option value="">Select…</option>
            {IDENTIFICATION_OPTIONS.map(o => (
              <option key={o}>{o}</option>
            ))}
          </select>
          {formData.means_of_identification && (
            <div className="mt-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleIdentificationFileChange}
                required
                className="w-full"
              />
            </div>
          )}
        </div>

        {/* Work & Other Details */}
        <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">LAST PLACE OF WORK:</label>
            <input
              name="last_place_of_work"
              value={formData.last_place_of_work}
              onChange={handleChange}
              required
              className="mt-1 block w-full border rounded p-2"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium">JOB DESCRIPTION:</label>
            <textarea
              name="job_description"
              value={formData.job_description}
              onChange={handleChange}
              required
              rows="3"
              className="mt-1 block w-full border rounded p-2"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium">
              REASON FOR QUITTING PREVIOUS JOB:
            </label>
            <textarea
              name="reason_for_quitting"
              value={formData.reason_for_quitting}
              onChange={handleChange}
              required
              rows="3"
              className="mt-1 block w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">ANY MEDICAL CONDITION:</label>
            <input
              name="medical_condition"
              value={formData.medical_condition}
              onChange={handleChange}
              required
              className="mt-1 block w-full border rounded p-2"
            />
          </div>
        </div>

        {/* Next of Kin */}
        <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">NEXT OF KIN NAME:</label>
            <input
              name="next_of_kin_name"
              value={formData.next_of_kin_name}
              onChange={handleChange}
              required
              className="mt-1 block w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">PHONE NO:</label>
            <input
              name="next_of_kin_phone"
              value={formData.next_of_kin_phone}
              onChange={handleChange}
              required
              className="mt-1 block w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">ADDRESS:</label>
            <input
              name="next_of_kin_address"
              value={formData.next_of_kin_address}
              onChange={handleChange}
              required
              className="mt-1 block w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">RELATIONSHIP:</label>
            <input
              name="next_of_kin_relationship"
              value={formData.next_of_kin_relationship}
              onChange={handleChange}
              required
              className="mt-1 block w-full border rounded p-2"
            />
          </div>
        </div>

        {/* Account Details */}
        <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">BANK NAME:</label>
            <input
              name="bank_name"
              value={formData.bank_name}
              onChange={handleChange}
              required
              className="mt-1 block w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">ACCOUNT NAME:</label>
            <input
              name="account_name"
              value={formData.account_name}
              onChange={handleChange}
              required
              className="mt-1 block w-full border rounded p-2"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium">ACCOUNT NO:</label>
            <label className="block text-sm font-medium">ACCOUNT NO:</label>
          <input
            name="account_number"
            value={formData.account_number}
            onChange={handleChange}
            required
            placeholder="10 digits only"
            className="mt-1 block w-full border rounded p-2"
          />
          {errors.account_number && (
            <p className="text-red-500 text-sm mt-1">{errors.account_number}</p>
          )}
          </div>
        </div>

        {/* Passport Photo Upload */}
        <div className="border-t pt-4">
          <h3 className="text-xl font-semibold mb-2">Upload Passport Photo</h3>
          <input
            type="file"
            accept="image/*"
            onChange={handlePassportPhotoChange}
            required
            className="w-full"
          />
          {passportPhoto && (
            <p className="mt-1 text-green-600 text-xs">
              Selected: {passportPhoto.name}
            </p>
          )}
        </div>

        {/* Submit */}
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
