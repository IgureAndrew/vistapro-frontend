// src/components/Submissions.jsx
import React, { useState, useEffect } from "react";

function Submissions() {
  const [submissions, setSubmissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // For toggling details per submission (using submission id)
  const [openDetails, setOpenDetails] = useState({});

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/verification/submissions`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!res.ok) {
          throw new Error("Failed to fetch submissions");
        }
        const data = await res.json();
        setSubmissions(data.submissions);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  const toggleDetails = (id) => {
    setOpenDetails((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Delete a submission by table and id.
  const handleDelete = async (table, id) => {
    if (!window.confirm("Are you sure you want to delete this submission?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/verification/${table}/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "Failed to delete submission");
        return;
      }
      // Remove deleted submission from state
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

  if (loading) return <p>Loading submissions...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="p-4">
      {/* Biodata Submissions */}
      <h2 className="text-2xl font-bold mb-4">Biodata Submissions</h2>
      {submissions && submissions.biodata && submissions.biodata.length > 0 ? (
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
                </div>
              </div>
              {/* Details Section */}
              {openDetails[item.id] && (
                <div className="mt-4 text-sm text-gray-700">
                  <p>
                    <strong>Date of Birth:</strong>{" "}
                    {item.date_of_birth
                      ? new Date(item.date_of_birth).toLocaleDateString()
                      : "N/A"}
                  </p>
                  <p>
                    <strong>Phone:</strong> {item.phone}
                  </p>
                  <p>
                    <strong>Address:</strong> {item.address}
                  </p>
                  <p>
                    <strong>Religion:</strong> {item.religion}
                  </p>
                  <p>
                    <strong>Marital Status:</strong> {item.marital_status}
                  </p>
                  <p>
                    <strong>State of Origin:</strong> {item.state_of_origin}
                  </p>
                  <p>
                    <strong>State of Residence:</strong> {item.state_of_residence}
                  </p>
                  <p>
                    <strong>Mother's Maiden Name:</strong> {item.mothers_maiden_name}
                  </p>
                  <p>
                    <strong>School Attended:</strong> {item.school_attended}
                  </p>
                  <p>
                    <strong>Means of Identification:</strong> {item.means_of_identification}
                  </p>
                  <p>
                    <strong>ID Document URL:</strong> {item.id_document_url}
                  </p>
                  <p>
                    <strong>Last Place of Work:</strong> {item.last_place_of_work}
                  </p>
                  <p>
                    <strong>Job Description:</strong> {item.job_description}
                  </p>
                  <p>
                    <strong>Reason for Quitting:</strong> {item.reason_for_quitting}
                  </p>
                  <p>
                    <strong>Medical Condition:</strong> {item.medical_condition}
                  </p>
                  <p>
                    <strong>Next of Kin Name:</strong> {item.next_of_kin_name}
                  </p>
                  <p>
                    <strong>Next of Kin Phone:</strong> {item.next_of_kin_phone}
                  </p>
                  <p>
                    <strong>Next of Kin Address:</strong> {item.next_of_kin_address}
                  </p>
                  <p>
                    <strong>Next of Kin Relationship:</strong> {item.next_of_kin_relationship}
                  </p>
                  <p>
                    <strong>Bank Name:</strong> {item.bank_name}
                  </p>
                  <p>
                    <strong>Account Name:</strong> {item.account_name}
                  </p>
                  <p>
                    <strong>Account Number:</strong> {item.account_number}
                  </p>
                  <p>
                    <strong>Passport Photo URL:</strong> {item.passport_photo_url}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p>No biodata submissions yet.</p>
      )}

      {/* Guarantor Submissions */}
      <h2 className="text-2xl font-bold my-4">Guarantor Submissions</h2>
      {submissions && submissions.guarantor && submissions.guarantor.length > 0 ? (
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
                </div>
              </div>
              {/* Details Section */}
              {openDetails[item.id] && (
                <div className="mt-4 text-sm text-gray-700">
                  <p>
                    <strong>Candidate Well Known:</strong>{" "}
                    {item.is_candidate_well_known ? "Yes" : "No"}
                  </p>
                  <p>
                    <strong>Known Duration:</strong> {item.known_duration}
                  </p>
                  <p>
                    <strong>Occupation:</strong> {item.occupation}
                  </p>
                  <p>
                    <strong>ID Document URL:</strong> {item.id_document_url}
                  </p>
                  <p>
                    <strong>Passport Photo URL:</strong> {item.passport_photo_url}
                  </p>
                  <p>
                    <strong>Signature URL:</strong> {item.signature_url}
                  </p>
                  <p>
                    <strong>Guarantor's Full Name:</strong> {item.guarantor_full_name}
                  </p>
                  <p>
                    <strong>Guarantor's Home Address:</strong> {item.guarantor_home_address}
                  </p>
                  <p>
                    <strong>Guarantor's Office Address:</strong> {item.guarantor_office_address}
                  </p>
                  <p>
                    <strong>Guarantor's Telephone:</strong> {item.guarantor_telephone}
                  </p>
                  <p>
                    <strong>Guarantor's Email:</strong> {item.guarantor_email}
                  </p>
                  <p>
                    <strong>Date:</strong>{" "}
                    {item.guarantor_date
                      ? new Date(item.guarantor_date).toLocaleDateString()
                      : "N/A"}
                  </p>
                  <p>
                    <strong>State of Residence:</strong> {item.state_of_residence}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p>No guarantor submissions yet.</p>
      )}

      {/* Commitment Submissions */}
      <h2 className="text-2xl font-bold my-4">Commitment Submissions</h2>
      {submissions && submissions.commitment && submissions.commitment.length > 0 ? (
        <div className="space-y-4">
          {submissions.commitment.map((item) => (
            <div key={item.id} className="border p-4 rounded shadow">
              {/* Summary Section */}
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">
                    <span className="mr-2">ID:</span> {item.id}
                  </p>
                  <p className="font-semibold">
                    <span className="mr-2">Direct Sales Rep:</span> {item.direct_sales_rep_name}
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
                    <strong>Promise Not Request Irrelevant Info:</strong>{" "}
                    {item.promise_not_request_irrelevant_info ? "Yes" : "No"}
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
                    {item.date_signed
                      ? new Date(item.date_signed).toLocaleDateString()
                      : "N/A"}
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
