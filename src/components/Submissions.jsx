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

  // Delete a biodata submission by its id
  const handleDeleteBiodata = async (id) => {
    if (!window.confirm("Are you sure you want to delete this biodata submission?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/verification/biodata/${id}`,
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
        biodata: prev.biodata.filter((item) => item.id !== id),
      }));
      alert("Biodata submission deleted successfully.");
    } catch (error) {
      console.error("Error deleting submission:", error);
      alert("Error deleting submission.");
    }
  };

  if (loading) return <p>Loading submissions...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="p-4">
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
                    onClick={() => handleDeleteBiodata(item.id)}
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

      {/* Similar tables for Guarantor and Commitment submissions can be added here */}
    </div>
  );
}

export default Submissions;
