// src/components/ApplicantBiodataForm.jsx
import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import biodataSchema from "../validation/biodataSchema";

function ApplicantBiodataForm({ onSuccess }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: yupResolver(biodataSchema),
    defaultValues: {
      marketer_id: "PREPOPULATED_UNIQUE_ID", // example prepopulated value
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
    },
  });

  const onSubmit = async (data) => {
    // Create a FormData instance and append all fields.
    const formData = new FormData();
    // Loop through each field in the data object.
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        // For file inputs, append the first file from the FileList.
        if (key === "passport_photo" || key === "id_document") {
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
        `${import.meta.env.VITE_API_URL}/api/verification/biodata`,
        {
          method: "POST",
          // Do not set Content-Type when sending FormData.
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );
      const result = await response.json();
      if (response.ok) {
        alert("Biodata submitted successfully!");
        if (onSuccess) onSuccess();
        reset();
      } else {
        alert(result.message || "Submission failed");
      }
    } catch (error) {
      console.error("Error submitting biodata:", error);
      alert("Error submitting biodata");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Text fields */}
      <div>
        <label className="block font-semibold">Name:</label>
        <input type="text" {...register("name")} className="border rounded px-3 py-2 w-full" />
        {errors.name && <p className="text-red-600 text-sm">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block font-semibold">Date of Birth:</label>
        <input type="date" {...register("date_of_birth")} className="border rounded px-3 py-2 w-full" />
        {errors.date_of_birth && <p className="text-red-600 text-sm">{errors.date_of_birth.message}</p>}
      </div>

      <div>
        <label className="block font-semibold">Address:</label>
        <input type="text" {...register("address")} className="border rounded px-3 py-2 w-full" />
        {errors.address && <p className="text-red-600 text-sm">{errors.address.message}</p>}
      </div>

      <div>
        <label className="block font-semibold">Phone (11 digits):</label>
        <input type="text" {...register("phone")} className="border rounded px-3 py-2 w-full" />
        {errors.phone && <p className="text-red-600 text-sm">{errors.phone.message}</p>}
      </div>

      <div>
        <label className="block font-semibold">Religion:</label>
        <input type="text" {...register("religion")} className="border rounded px-3 py-2 w-full" />
        {errors.religion && <p className="text-red-600 text-sm">{errors.religion.message}</p>}
      </div>

      <div>
        <label className="block font-semibold">Marital Status:</label>
        <input type="text" {...register("marital_status")} className="border rounded px-3 py-2 w-full" />
        {errors.marital_status && <p className="text-red-600 text-sm">{errors.marital_status.message}</p>}
      </div>

      <div>
        <label className="block font-semibold">State of Origin:</label>
        <input type="text" {...register("state_of_origin")} className="border rounded px-3 py-2 w-full" />
        {errors.state_of_origin && <p className="text-red-600 text-sm">{errors.state_of_origin.message}</p>}
      </div>

      <div>
        <label className="block font-semibold">State of Residence:</label>
        <input type="text" {...register("state_of_residence")} className="border rounded px-3 py-2 w-full" />
        {errors.state_of_residence && <p className="text-red-600 text-sm">{errors.state_of_residence.message}</p>}
      </div>

      <div>
        <label className="block font-semibold">Mother's Maiden Name:</label>
        <input type="text" {...register("mothers_maiden_name")} className="border rounded px-3 py-2 w-full" />
        {errors.mothers_maiden_name && <p className="text-red-600 text-sm">{errors.mothers_maiden_name.message}</p>}
      </div>

      <div>
        <label className="block font-semibold">School Attended:</label>
        <input type="text" {...register("school_attended")} className="border rounded px-3 py-2 w-full" />
        {errors.school_attended && <p className="text-red-600 text-sm">{errors.school_attended.message}</p>}
      </div>

      <div>
        <label className="block font-semibold">Means of Identification:</label>
        <input type="text" {...register("means_of_identification")} className="border rounded px-3 py-2 w-full" />
        {errors.means_of_identification && <p className="text-red-600 text-sm">{errors.means_of_identification.message}</p>}
      </div>

      <div>
        <label className="block font-semibold">Last Place of Work:</label>
        <input type="text" {...register("last_place_of_work")} className="border rounded px-3 py-2 w-full" />
        {errors.last_place_of_work && <p className="text-red-600 text-sm">{errors.last_place_of_work.message}</p>}
      </div>

      <div>
        <label className="block font-semibold">Job Description:</label>
        <textarea {...register("job_description")} className="border rounded px-3 py-2 w-full" />
        {errors.job_description && <p className="text-red-600 text-sm">{errors.job_description.message}</p>}
      </div>

      <div>
        <label className="block font-semibold">Reason for Quitting:</label>
        <textarea {...register("reason_for_quitting")} className="border rounded px-3 py-2 w-full" />
        {errors.reason_for_quitting && <p className="text-red-600 text-sm">{errors.reason_for_quitting.message}</p>}
      </div>

      <div>
        <label className="block font-semibold">Medical Condition (if any):</label>
        <input type="text" {...register("medical_condition")} className="border rounded px-3 py-2 w-full" />
        {errors.medical_condition && <p className="text-red-600 text-sm">{errors.medical_condition.message}</p>}
      </div>

      <div>
        <label className="block font-semibold">Next of Kin Name:</label>
        <input type="text" {...register("next_of_kin_name")} className="border rounded px-3 py-2 w-full" />
        {errors.next_of_kin_name && <p className="text-red-600 text-sm">{errors.next_of_kin_name.message}</p>}
      </div>

      <div>
        <label className="block font-semibold">Next of Kin Phone (11 digits):</label>
        <input type="text" {...register("next_of_kin_phone")} className="border rounded px-3 py-2 w-full" />
        {errors.next_of_kin_phone && <p className="text-red-600 text-sm">{errors.next_of_kin_phone.message}</p>}
      </div>

      <div>
        <label className="block font-semibold">Next of Kin Address:</label>
        <input type="text" {...register("next_of_kin_address")} className="border rounded px-3 py-2 w-full" />
        {errors.next_of_kin_address && <p className="text-red-600 text-sm">{errors.next_of_kin_address.message}</p>}
      </div>

      <div>
        <label className="block font-semibold">Relationship with Next of Kin:</label>
        <input type="text" {...register("next_of_kin_relationship")} className="border rounded px-3 py-2 w-full" />
        {errors.next_of_kin_relationship && <p className="text-red-600 text-sm">{errors.next_of_kin_relationship.message}</p>}
      </div>

      <div>
        <label className="block font-semibold">Bank Name:</label>
        <input type="text" {...register("bank_name")} className="border rounded px-3 py-2 w-full" />
        {errors.bank_name && <p className="text-red-600 text-sm">{errors.bank_name.message}</p>}
      </div>

      <div>
        <label className="block font-semibold">Account Name:</label>
        <input type="text" {...register("account_name")} className="border rounded px-3 py-2 w-full" />
        {errors.account_name && <p className="text-red-600 text-sm">{errors.account_name.message}</p>}
      </div>

      <div>
        <label className="block font-semibold">Account Number (10 digits):</label>
        <input type="text" {...register("account_number")} className="border rounded px-3 py-2 w-full" />
        {errors.account_number && <p className="text-red-600 text-sm">{errors.account_number.message}</p>}
      </div>

      {/* File fields */}
      <div>
        <label className="block font-semibold">Passport Photo (JPEG/JPG):</label>
        <input type="file" {...register("passport_photo")} accept=".jpg,.jpeg" className="border rounded px-3 py-2 w-full" />
        {errors.passport_photo && <p className="text-red-600 text-sm">{errors.passport_photo.message}</p>}
      </div>

      <div>
        <label className="block font-semibold">ID Document (JPEG/JPG):</label>
        <input type="file" {...register("id_document")} accept=".jpg,.jpeg" className="border rounded px-3 py-2 w-full" />
        {errors.id_document && <p className="text-red-600 text-sm">{errors.id_document.message}</p>}
      </div>

      <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700">
        {isSubmitting ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}

export default ApplicantBiodataForm;
