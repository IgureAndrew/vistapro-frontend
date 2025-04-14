// src/components/Submissions.jsx
import React, { useState, useEffect } from "react";

function Submissions() {
  // State for the combined submissions array.
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for filtering by submission type.
  const [selectedFormType, setSelectedFormType] = useState("All");

  // Modal state for detailed view.
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);

  // Get current user from localStorage.
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  // Determine GET endpoint based on user's role.
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

  // Fetch submissions from the backend.
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const token = localStorage.getItem("token");
        const endpoint = getEndpointForRole();
        if (!endpoint) {
          throw new Error("User role not authorized to view submissions or not logged in.");
        }
        const res = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to fetch submissions");
        }
        const data = await res.json();
        // Expected structure: data.submissions has keys: biodata, guarantor, commitment.
        const { biodata = [], guarantor = [], commitment = [] } = data.submissions;
        // Tag each submission with its type.
        const taggedBiodata = biodata.map((item) => ({ ...item, type: "Biodata" }));
        const taggedGuarantor = guarantor.map((item) => ({ ...item, type: "Guarantor" }));
        const taggedCommitment = commitment.map((item) => ({ ...item, type: "Commitment" }));

        // Combine all submissions into one array.
        const combined = [...taggedBiodata, ...taggedGuarantor, ...taggedCommitment];
        setSubmissions(combined);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  // Filter submissions based on the selected form type.
  const filteredSubmissions =
    selectedFormType === "All"
      ? submissions
      : submissions.filter(
          (sub) =>
            sub.type.toLowerCase() === selectedFormType.toLowerCase()
        );

  // Open modal with details.
  const openModal = (data) => {
    setModalData(data);
    setModalOpen(true);
  };

  // Close modal.
  const closeModal = () => {
    setModalOpen(false);
    setModalData(null);
  };

  // Handler for deleting a submission.
  const handleDelete = async (table, submissionId) => {
    if (!window.confirm("Are you sure you want to delete this submission?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/verification/${table.toLowerCase()}/${submissionId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "Failed to delete submission");
        return;
      }
      setSubmissions((prev) =>
        prev.filter((item) => item.id !== submissionId)
      );
      alert("Submission deleted successfully.");
    } catch (error) {
      console.error("Error deleting submission:", error);
      alert("Error deleting submission.");
    }
  };

  // Handler for allowing a refill (reset) of a submission flag.
  const handleReset = async (item) => {
    if (!window.confirm(`Allow refill for ${item.type} form?`)) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/verification/allow-refill`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          marketerUniqueId: item.marketer_unique_id,
          formType: item.type.toLowerCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to reset form.");
      } else {
        alert(data.message || `${item.type} form reset successfully.`);
      }
    } catch (error) {
      console.error("Error resetting form:", error);
      alert("Error resetting form.");
    }
  };

  // Handler for approving a marketer (Master Admin only).
  const handleApprove = async (item) => {
    if (!window.confirm("Approve and verify this marketer?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/verification/master-approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          marketerUniqueId: item.marketer_unique_id,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "Failed to approve marketer");
      } else {
        const data = await res.json();
        alert(data.message || "Marketer approved successfully.");
      }
    } catch (error) {
      console.error("Error approving marketer:", error);
      alert("Error approving marketer.");
    }
  };

  if (loading) return <p>Loading submissions...</p>;
  if (error) return <p>Error: {error}</p>;
  if (filteredSubmissions.length === 0)
    return <p>No submissions available for the selected form type.</p>;

  return (
    <div className="p-4">
      {/* Dropdown for selecting submission type */}
      <div className="mb-4">
        <label className="mr-2 font-semibold">Filter by Form Type:</label>
        <select
          value={selectedFormType}
          onChange={(e) => setSelectedFormType(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
        >
          <option value="All">All</option>
          <option value="Biodata">Biodata</option>
          <option value="Guarantor">Guarantor</option>
          <option value="Commitment">Commitment</option>
        </select>
      </div>

      {/* Table List for submissions */}
      <table className="min-w-full border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 border text-left">Marketer Name</th>
            <th className="px-4 py-2 border text-left">Location</th>
            <th className="px-4 py-2 border text-left">Unique ID</th>
            <th className="px-4 py-2 border text-left">Form Type</th>
            <th className="px-4 py-2 border text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredSubmissions.map((item) => (
            <tr key={`${item.type}_${item.id}`} className="border-t">
              <td className="px-4 py-2 border">{item.name || "N/A"}</td>
              <td className="px-4 py-2 border">{item.marketer_location || "N/A"}</td>
              <td className="px-4 py-2 border">{item.marketer_unique_id || "N/A"}</td>
              <td className="px-4 py-2 border">{item.type}</td>
              <td className="px-4 py-2 border">
                <button
                  onClick={() => openModal(item)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs mr-1"
                >
                  View Details
                </button>
                <button
                  onClick={() => handleDelete(item.type, item.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs mr-1"
                >
                  Delete
                </button>
                {user && user.role === "MasterAdmin" && (
                  <>
                    <button
                      onClick={() => handleReset(item)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs mr-1"
                    >
                      Reset Form
                    </button>
                    <button
                      onClick={() => handleApprove(item)}
                      className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs"
                    >
                      Approve & Verify
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal for submission details */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg max-w-xl w-full p-6 relative">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
            >
              Close
            </button>
            <h3 className="text-xl font-bold mb-4">Submission Details</h3>
            {modalData ? (
              <div className="text-sm text-gray-700 space-y-2">
                {Object.entries(modalData).map(([key, value]) => (
                  <div key={key}>
                    <strong className="capitalize">{key}:</strong>{" "}
                    {value
                      ? typeof value === "string"
                        ? value
                        : JSON.stringify(value, null, 2)
                      : "N/A"}
                  </div>
                ))}
              </div>
            ) : (
              <p>No details available.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Submissions;
