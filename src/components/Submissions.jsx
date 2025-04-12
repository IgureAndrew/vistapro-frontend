// src/components/Submissions.jsx
import React, { useState, useEffect } from "react";

function Submissions() {
  // State variables to hold submissions, loading status, errors, and which submission details are open.
  const [submissions, setSubmissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // This state maps submission ids to a boolean indicating whether details are open.
  const [openDetails, setOpenDetails] = useState({});

  // Get the current user from localStorage (assumes user object is stored after login).
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  /**
   * getEndpointForRole
   * Determines the proper GET endpoint based on the logged-in user's role.
   * MasterAdmin sees all submissions.
   * Admin sees submissions for marketers assigned to them.
   * SuperAdmin sees submissions for marketers whose assigned admin belongs to them.
   */
  const getEndpointForRole = () => {
    if (!user) return null;
    switch (user.role) {
      case "MasterAdmin":
        return "/api/verification/submissions/master";
      case "Admin":
        return "/api/verification/submissions/admin";
      case "SuperAdmin":
        return "/api/verification/submissions/superadmin";
      default:
        return null;
    }
  };

  /**
   * fetchSubmissions
   * Fetch submissions from the backend using the endpoint based on the user's role.
   */
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const token = localStorage.getItem("token");
        const endpoint = getEndpointForRole();
        if (!endpoint) {
          throw new Error("User role not authorized to view submissions or user not logged in.");
        }
        const res = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          throw new Error("Failed to fetch submissions");
        }
        const data = await res.json();
        // Assume the backend returns an object with a "submissions" property.
        setSubmissions(data.submissions);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  /**
   * toggleDetails
   * Toggles the detailed view for a specific submission.
   * @param {number|string} id - The submission's unique id.
   */
  const toggleDetails = (id) => {
    setOpenDetails((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  /**
   * handleDelete
   * Deletes a submission from a given form type.
   * @param {string} table - The form type ("biodata", "guarantor", or "commitment").
   * @param {number|string} id - The submission's unique id.
   */
  const handleDelete = async (table, id) => {
    if (!window.confirm("Are you sure you want to delete this submission?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/verification/${table}/${id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "Failed to delete submission");
        return;
      }
      // Update state: remove the deleted submission from the corresponding form array.
      setSubmissions((prev) => ({
        ...prev,
        [table]: prev[table].filter((item) => item.id !== id),
      }));
      alert("Submission deleted successfully.");
    } catch (error) {
      console.error("Error deleting submission:", error);
      alert("Error deleting submission.");
    }
  };

  /**
   * handleReset
   * Allows a Master Admin to reset a submission flag (allowing a marketer to refill/update a form).
   * Sends the marketerUniqueId and formType to the allow-refill endpoint.
   *
   * @param {string} formType - The form type ("biodata", "guarantor", or "commitment").
   * @param {string} marketerUniqueId - The unique ID of the marketer.
   */
  const handleReset = async (formType, marketerUniqueId) => {
    if (!window.confirm(`Are you sure you want to allow a refill for ${formType} form?`)) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/verification/allow-refill`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ marketerUniqueId, formType }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to reset form.");
      } else {
        alert(data.message || `${formType} form reset successfully.`);
      }
    } catch (error) {
      console.error("Error resetting form:", error);
      alert("Error resetting form.");
    }
  };

  /**
   * handleApprove
   * Allows a Master Admin to approve (verify) a marketer's verification.
   * Sends the marketer's unique ID to the master-approve endpoint.
   *
   * @param {string} marketerUniqueId - The unique ID of the marketer to approve.
   */
  const handleApprove = async (marketerUniqueId) => {
    if (!window.confirm("Are you sure you want to approve and verify this marketer?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/verification/master-approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ marketerUniqueId }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "Failed to approve marketer");
      } else {
        const data = await res.json();
        alert(data.message || "Marketer approved successfully.");
        // Optionally refresh submissions, etc.
      }
    } catch (error) {
      console.error("Error approving marketer:", error);
      alert("Error approving marketer.");
    }
  };

  if (loading) return <p>Loading submissions...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!submissions) return <p>No submissions available.</p>;

  return (
    <div className="p-4">
      {/* ---------------- Biodata Submissions Section ---------------- */}
      <h2 className="text-2xl font-bold mb-4">Biodata Submissions</h2>
      {submissions.biodata && submissions.biodata.length > 0 ? (
        <div className="space-y-4">
          {submissions.biodata.map((item) => (
            <div key={item.id} className="border p-4 rounded shadow">
              {/* Summary Section */}
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">
                    <span className="mr-2">ID:</span> {item.id}
                  </p>
                  <p className="font-semibold">
                    <span className="mr-2">Name:</span> {item.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    Submitted on: {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => toggleDetails(item.id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    {openDetails[item.id] ? "Hide Details" : "View Details"}
                  </button>
                  <button
                    onClick={() => handleDelete("biodata", item.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                  {/* Reset button for Master Admin */}
                  {user && user.role === "MasterAdmin" && (
                    <button
                      onClick={() => handleReset("biodata", item.marketer_unique_id)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                    >
                      Reset Form
                    </button>
                  )}
                  {/* Approve button for Master Admin */}
                  {user && user.role === "MasterAdmin" && (
                    <button
                      onClick={() => handleApprove(item.marketer_unique_id)}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                    >
                      Approve &amp; Verify
                    </button>
                  )}
                </div>
              </div>
              {/* Details Section */}
              {openDetails[item.id] && (
                <div className="mt-4 text-sm text-gray-700">
                  <p>
                    <strong>Date of Birth:</strong>{" "}
                    {item.date_of_birth ? new Date(item.date_of_birth).toLocaleDateString() : "N/A"}
                  </p>
                  <p><strong>Phone:</strong> {item.phone}</p>
                  <p><strong>Address:</strong> {item.address}</p>
                  <p><strong>Religion:</strong> {item.religion}</p>
                  <p><strong>Marital Status:</strong> {item.marital_status}</p>
                  <p><strong>State of Origin:</strong> {item.state_of_origin}</p>
                  <p><strong>State of Residence:</strong> {item.state_of_residence}</p>
                  <p><strong>Mother's Maiden Name:</strong> {item.mothers_maiden_name}</p>
                  <p><strong>School Attended:</strong> {item.school_attended}</p>
                  <p><strong>Means of Identification:</strong> {item.means_of_identification}</p>
                  <p><strong>ID Document URL:</strong> {item.id_document_url}</p>
                  <p><strong>Last Place of Work:</strong> {item.last_place_of_work}</p>
                  <p><strong>Job Description:</strong> {item.job_description}</p>
                  <p><strong>Reason for Quitting:</strong> {item.reason_for_quitting}</p>
                  <p><strong>Medical Condition:</strong> {item.medical_condition}</p>
                  <p><strong>Next of Kin Name:</strong> {item.next_of_kin_name}</p>
                  <p><strong>Next of Kin Phone:</strong> {item.next_of_kin_phone}</p>
                  <p><strong>Next of Kin Address:</strong> {item.next_of_kin_address}</p>
                  <p><strong>Next of Kin Relationship:</strong> {item.next_of_kin_relationship}</p>
                  <p><strong>Bank Name:</strong> {item.bank_name}</p>
                  <p><strong>Account Name:</strong> {item.account_name}</p>
                  <p><strong>Account Number:</strong> {item.account_number}</p>
                  <p><strong>Passport Photo URL:</strong> {item.passport_photo_url}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p>No biodata submissions yet.</p>
      )}

      {/* ---------------- Guarantor Submissions Section ---------------- */}
      <h2 className="text-2xl font-bold my-4">Guarantor Submissions</h2>
      {submissions.guarantor && submissions.guarantor.length > 0 ? (
        <div className="space-y-4">
          {submissions.guarantor.map((item) => (
            <div key={item.id} className="border p-4 rounded shadow">
              {/* Summary Section */}
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">
                    <span className="mr-2">ID:</span> {item.id}
                  </p>
                  <p className="font-semibold">
                    <span className="mr-2">Relationship:</span> {item.relationship}
                  </p>
                  <p className="text-sm text-gray-600">
                    Submitted on: {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => toggleDetails(item.id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    {openDetails[item.id] ? "Hide Details" : "View Details"}
                  </button>
                  <button
                    onClick={() => handleDelete("guarantor", item.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                  {user && user.role === "MasterAdmin" && (
                    <button
                      onClick={() => handleReset("guarantor", item.marketer_unique_id)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                    >
                      Reset Form
                    </button>
                  )}
                  {user && user.role === "MasterAdmin" && (
                    <button
                      onClick={() => handleApprove(item.marketer_unique_id)}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                    >
                      Approve &amp; Verify
                    </button>
                  )}
                </div>
              </div>
              {/* Details Section */}
              {openDetails[item.id] && (
                <div className="mt-4 text-sm text-gray-700">
                  <p><strong>Candidate Well Known:</strong> {item.is_candidate_known ? "Yes" : "No"}</p>
                  <p><strong>Known Duration:</strong> {item.known_duration}</p>
                  <p><strong>Occupation:</strong> {item.occupation}</p>
                  <p><strong>Means of Identification:</strong> {item.means_of_identification}</p>
                  <p><strong>Identification File URL:</strong> {item.identification_file_url}</p>
                  <p><strong>Signature URL:</strong> {item.signature_url}</p>
                  <p><strong>Guarantor's Full Name:</strong> {item.guarantor_full_name}</p>
                  <p><strong>Guarantor's Home Address:</strong> {item.guarantor_home_address}</p>
                  <p><strong>Guarantor's Office Address:</strong> {item.guarantor_office_address}</p>
                  <p><strong>Guarantor's Phone:</strong> {item.guarantor_phone}</p>
                  <p><strong>Guarantor's Email:</strong> {item.guarantor_email}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p>No guarantor submissions yet.</p>
      )}

      {/* ---------------- Commitment Submissions Section ---------------- */}
      <h2 className="text-2xl font-bold my-4">Commitment Submissions</h2>
      {submissions.commitment && submissions.commitment.length > 0 ? (
        <div className="space-y-4">
          {submissions.commitment.map((item) => (
            <div key={item.id} className="border p-4 rounded shadow">
              {/* Summary Section */}
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">
                    <span className="mr-2">ID:</span>{item.id}
                  </p>
                  <p className="font-semibold">
                    <span className="mr-2">Direct Sales Rep:</span>{item.direct_sales_rep_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    Submitted on: {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => toggleDetails(item.id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    {openDetails[item.id] ? "Hide Details" : "View Details"}
                  </button>
                  <button
                    onClick={() => handleDelete("commitment", item.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                  {user && user.role === "MasterAdmin" && (
                    <button
                      onClick={() => handleReset("commitment", item.marketer_unique_id)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                    >
                      Reset Form
                    </button>
                  )}
                  {user && user.role === "MasterAdmin" && (
                    <button
                      onClick={() => handleApprove(item.marketer_unique_id)}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                    >
                      Approve &amp; Verify
                    </button>
                  )}
                </div>
              </div>
              {/* Details Section */}
              {openDetails[item.id] && (
                <div className="mt-4 text-sm text-gray-700">
                  <p>
                    <strong>Promise Accept False Documents:</strong>{" "}
                    {item.promise_accept_false_documents ? "Yes" : "No"}
                  </p>
                  <p>
                    <strong>Promise Not Request Unrelated Info:</strong>{" "}
                    {item.promise_not_request_unrelated_info ? "Yes" : "No"}
                  </p>
                  <p>
                    <strong>Promise Not Charge Customer Fees:</strong>{" "}
                    {item.promise_not_charge_customer_fees ? "Yes" : "No"}
                  </p>
                  <p>
                    <strong>Promise Not Modify Contract Info:</strong>{" "}
                    {item.promise_not_modify_contract_info ? "Yes" : "No"}
                  </p>
                  <p>
                    <strong>Promise Not Sell Unapproved Phones:</strong>{" "}
                    {item.promise_not_sell_unapproved_phones ? "Yes" : "No"}
                  </p>
                  <p>
                    <strong>Promise Not Make Unofficial Commitment:</strong>{" "}
                    {item.promise_not_make_unofficial_commitment ? "Yes" : "No"}
                  </p>
                  <p>
                    <strong>Promise Not Operate Customer Account:</strong>{" "}
                    {item.promise_not_operate_customer_account ? "Yes" : "No"}
                  </p>
                  <p>
                    <strong>Promise Accept Fraud Firing:</strong>{" "}
                    {item.promise_accept_fraud_firing ? "Yes" : "No"}
                  </p>
                  <p>
                    <strong>Promise Not Share Company Info:</strong>{" "}
                    {item.promise_not_share_company_info ? "Yes" : "No"}
                  </p>
                  <p>
                    <strong>Promise Ensure Loan Recovery:</strong>{" "}
                    {item.promise_ensure_loan_recovery ? "Yes" : "No"}
                  </p>
                  <p>
                    <strong>Promise Abide by System:</strong>{" "}
                    {item.promise_abide_by_system ? "Yes" : "No"}
                  </p>
                  <p>
                    <strong>Date Signed:</strong>{" "}
                    {item.date_signed ? new Date(item.date_signed).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p>No commitment submissions yet.</p>
      )}
    </div>
  );
}

export default Submissions;
