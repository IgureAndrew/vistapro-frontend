// src/components/ApplicantGuarantorForm.jsx
import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import guarantorSchema from "../validation/guarantorSchema";

function ApplicantGuarantorForm({ onSuccess }) {
  // You might prepopulate the marketer's unique ID from local storage or props.
  const prepopulatedMarketerId = localStorage.getItem("marketerUniqueId") || "PREPOPULATED_UNIQUE_ID";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: yupResolver(guarantorSchema),
    defaultValues: {
      marketer_id: prepopulatedMarketerId,
      is_candidate_well_known: "", // expecting a boolean value as string ("true" or "false")
      relationship: "",
      known_duration: "",
      occupation: "",
      id_document: null, // file input will be handled via FormData
      passport_photo: null,
      signature: null,
      guarantor_full_name: "",
      guarantor_home_address: "",
      guarantor_office_address: "",
      guarantor_telephone: "",
      guarantor_email: "",
      guarantor_date: "",
      state_of_residence: "",
      id_type: "", // Dropdown field for ID type
    },
  });

  const onSubmit = async (data) => {
    // Create a FormData instance to send files along with text fields.
    const formData = new FormData();
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        // For file inputs, append the first file if provided.
        if (key === "id_document" || key === "passport_photo" || key === "signature") {
          if (data[key] && data[key].length > 0) {
            formData.append(key, data[key][0]);
          }
        } else {
          formData.append(key, data[key]);
        }
      }
    }
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/verification/guarantor`,
        {
          method: "POST",
          // Do not set Content-Type header when sending FormData.
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );
      const result = await response.json();
      if (response.ok) {
        alert("Guarantor form submitted successfully!");
        if (onSuccess) onSuccess();
        reset();
      } else {
        alert(result.message || "Submission failed");
      }
    } catch (error) {
      console.error("Error submitting guarantor form:", error);
      alert("Error submitting guarantor form");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Guarantor Form for Employment</h2>
      <div className="mb-6 text-sm text-gray-700 leading-relaxed">
        <p>
          Our employment process requires that a person seeking employment in our establishment should
          produce a capable, responsible and acceptable person as a Guarantor. If you are willing to stand as a
          guarantor for the said applicant, kindly complete this form. Please note that it is dangerous to stand
          as a guarantor for someone whom you do not know.
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto">
        {/* Basic Commitment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            1. Is the candidate well known to you?
          </label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="true"
                {...register("is_candidate_well_known")}
                className="mr-2"
                required
              />
              Yes
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="false"
                {...register("is_candidate_well_known")}
                className="mr-2"
                required
              />
              No
            </label>
          </div>
          {errors.is_candidate_well_known && (
            <p className="text-red-600 text-sm">{errors.is_candidate_well_known.message}</p>
          )}
        </div>

        {/* Prepopulated Marketer ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Marketer ID
          </label>
          <input
            type="text"
            {...register("marketer_id")}
            className="block w-full border border-gray-300 rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
            readOnly
            required
          />
          {errors.marketer_id && (
            <p className="text-red-600 text-sm">{errors.marketer_id.message}</p>
          )}
        </div>

        {/* Guarantor Personal Details */}
        <hr className="my-4" />
        <h3 className="text-lg font-semibold mb-2">Guarantor Personal Details</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Guarantor's Full Name
            </label>
            <input
              type="text"
              {...register("guarantor_full_name")}
              className="block w-full border border-gray-300 rounded px-3 py-2"
              required
            />
            {errors.guarantor_full_name && (
              <p className="text-red-600 text-sm">{errors.guarantor_full_name.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Guarantor's Home Address
            </label>
            <input
              type="text"
              {...register("guarantor_home_address")}
              className="block w-full border border-gray-300 rounded px-3 py-2"
              required
            />
            {errors.guarantor_home_address && (
              <p className="text-red-600 text-sm">{errors.guarantor_home_address.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Guarantor's Office Address
            </label>
            <input
              type="text"
              {...register("guarantor_office_address")}
              className="block w-full border border-gray-300 rounded px-3 py-2"
            />
            {errors.guarantor_office_address && (
              <p className="text-red-600 text-sm">{errors.guarantor_office_address.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Guarantor's Telephone (11 digits)
            </label>
            <input
              type="text"
              {...register("guarantor_telephone")}
              className="block w-full border border-gray-300 rounded px-3 py-2"
              required
            />
            {errors.guarantor_telephone && (
              <p className="text-red-600 text-sm">{errors.guarantor_telephone.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Guarantor's Email Address
            </label>
            <input
              type="email"
              {...register("guarantor_email")}
              className="block w-full border border-gray-300 rounded px-3 py-2"
              required
            />
            {errors.guarantor_email && (
              <p className="text-red-600 text-sm">{errors.guarantor_email.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              type="date"
              {...register("guarantor_date")}
              className="block w-full border border-gray-300 rounded px-3 py-2"
              required
            />
            {errors.guarantor_date && (
              <p className="text-red-600 text-sm">{errors.guarantor_date.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              State of Residence
            </label>
            <select
              {...register("state_of_residence")}
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
            {errors.state_of_residence && (
              <p className="text-red-600 text-sm">{errors.state_of_residence.message}</p>
            )}
          </div>
        </div>

        {/* Document Uploads Section */}
        <hr className="my-4" />
        <h3 className="text-lg font-semibold mb-2">Document Uploads</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Select ID Type:
            </label>
            <select
              {...register("id_type")}
              className="block w-full border border-gray-300 rounded px-3 py-2"
              required
            >
              <option value="">Select Identification Type</option>
              <option value="International Passport">International Passport</option>
              <option value="Driver's License">Driver's License</option>
              <option value="NIN">NIN</option>
            </select>
            {errors.id_type && (
              <p className="text-red-600 text-sm">{errors.id_type.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Upload ID Document (JPEG/JPG):
            </label>
            <input
              type="file"
              {...register("id_document")}
              accept=".jpg,.jpeg"
              className="block w-full border border-gray-300 rounded px-3 py-2"
              required
            />
            {errors.id_document && (
              <p className="text-red-600 text-sm">{errors.id_document.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Upload Passport Photo (JPEG/JPG):
            </label>
            <input
              type="file"
              {...register("passport_photo")}
              accept=".jpg,.jpeg"
              className="block w-full border border-gray-300 rounded px-3 py-2"
              required
            />
            {errors.passport_photo && (
              <p className="text-red-600 text-sm">{errors.passport_photo.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Upload Signature (JPEG/JPG):
            </label>
            <input
              type="file"
              {...register("signature")}
              accept=".jpg,.jpeg"
              className="block w-full border border-gray-300 rounded px-3 py-2"
              required
            />
            {errors.signature && (
              <p className="text-red-600 text-sm">{errors.signature.message}</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
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
            disabled={isSubmitting}
            className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ApplicantGuarantorForm;
