// src/validation/biodataSchema.js
import * as Yup from "yup";

const biodataSchema = Yup.object().shape({
  name: Yup.string().required("Name is required."),
  date_of_birth: Yup.date()
    .max(new Date(), "Date of birth cannot be in the future.")
    .required("Date of birth is required."),
  address: Yup.string().required("Address is required."),
  phone: Yup.string()
    .matches(/^\d{11}$/, "Phone number must be exactly 11 digits.")
    .required("Phone number is required."),
  religion: Yup.string().required("Religion is required."),
  marital_status: Yup.string().required("Marital status is required."),
  state_of_origin: Yup.string().required("State of origin is required."),
  state_of_residence: Yup.string().required("State of residence is required."),
  mothers_maiden_name: Yup.string().required("Mother's maiden name is required."),
  school_attended: Yup.string().required("School attended is required."),
  means_of_identification: Yup.string().required("Means of identification is required."),
  // Validate ID document as a file (JPEG/JPG)
  id_document: Yup.mixed()
    .required("ID document is required.")
    .test("fileFormat", "Unsupported file format. Only JPEG/JPG allowed.", (value) => {
      if (!value) return false;
      const allowedFormats = ["image/jpeg", "image/jpg"];
      return allowedFormats.includes(value.type);
    }),
  last_place_of_work: Yup.string().required("Last place of work is required."),
  job_description: Yup.string().required("Job description is required."),
  reason_for_quitting: Yup.string().required("Reason for quitting is required."),
  medical_condition: Yup.string().nullable(),
  next_of_kin_name: Yup.string().required("Next of kin name is required."),
  next_of_kin_phone: Yup.string()
    .matches(/^\d{11}$/, "Next of kin phone number must be exactly 11 digits.")
    .required("Next of kin phone number is required."),
  next_of_kin_address: Yup.string().required("Next of kin address is required."),
  next_of_kin_relationship: Yup.string().required("Relationship with next of kin is required."),
  bank_name: Yup.string().required("Bank name is required."),
  account_name: Yup.string().required("Account name is required."),
  account_number: Yup.string()
    .matches(/^\d{10}$/, "Account number must be exactly 10 digits.")
    .required("Account number is required."),
  // Validate passport photo as a file (JPEG/JPG)
  passport_photo: Yup.mixed()
    .required("Passport photo is required.")
    .test("fileFormat", "Unsupported file format. Only JPEG/JPG allowed.", (value) => {
      if (!value) return false;
      const allowedFormats = ["image/jpeg", "image/jpg"];
      return allowedFormats.includes(value.type);
    }),
});

export default biodataSchema;
