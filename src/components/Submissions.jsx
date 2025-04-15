// src/components/Submissions.jsx
import React, { useState, useEffect } from "react";

function Submissions() {
  // State for the combined submissions array (raw data from API).
  const [submissions, setSubmissions] = useState([]);
  // State for the grouped submissions (by marketer_unique_id).
  const [groupedSubmissions, setGroupedSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state for detailed view.
  const [modalOpen, setModalOpen] = useState(false);
  // For modal details, we now will have an array of all submissions for that marketer.
  const [modalData, setModalData] = useState([]);

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

  // Function to group submissions by marketer_unique_id.
  const groupSubmissions = (data) => {
    const grouped = data.reduce((acc, submission) => {
      const key = submission.marketer_unique_id;
      if (!acc[key]) {
        // If not already present, create an entry for this marketer.
        // We'll also store a 'types' array for form types and a 'details' array with the original submissions.
        acc[key] = {
          marketer_unique_id: key,
          // Use name and location from the first record found; adjust if needed.
          name: submission.name || submission.marketer_name || "N/A",
          location: submission.location || submission.marketer_location || "N/A",
          types: [submission.type],
          details: [submission],
        };
      } else {
        // Add the form type if not already in the types array.
        if (!acc[key].types.includes(submission.type)) {
          acc[key].types.push(submission.type);
        }
        // Add the full submission to details.
        acc[key].details.push(submission);
      }
      return acc;
    }, {});

    // Convert the object to an array.
    return Object.values(grouped);
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
        // Group submissions by marketer_unique_id.
        const grouped = groupSubmissions(combined);
        setGroupedSubmissions(grouped);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  // Open modal with details for a specific marketer.
  const openModal = (details) => {
    setModalData(details);
    setModalOpen(true);
  };

  // Close modal.
  const closeModal = () => {
    setModalOpen(false);
    setModalData([]);
  };

  // Handler for deleting a submission.
  // If you want to delete a specific submission, you might update the logic
  // to remove it from the grouped object if necessary.
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
      // Remove the specific submission from the groupedSubmissions.
      // First, update the raw submissions list.
      const newSubmissions = submissions.filter((item) => item.id !== submissionId);
      setSubmissions(newSubmissions);
      // Then, group the new submissions list.
      setGroupedSubmissions(groupSubmissions(newSubmissions));
      alert("Submission deleted successfully.");
    } catch (error) {
      console.error("Error deleting submission:", error);
      alert("Error deleting submission.");
    }
  };

  // Handler for resetting a form submission (allow refill).
  const handleReset = async (item) => {
    if (!window.confirm(`Allow refill for this ${item.types.join(", ")} submission(s)?`)) return;
    try {
      const token = localStorage.getItem("token");
      // Use the first detail's form type (or adapt if you want to reset all forms for that marketer)
      const formType = item.details[0].type.toLowerCase();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/verification/allow-refill`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          marketerUniqueId: item.marketer_unique_id,
          formType, // resets one type—adjust if needed for multiple.
        }),
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
  if (groupedSubmissions.length === 0)
    return <p>No submissions available.</p>;

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Since filter is removed, we simply display the grouped data */}
      <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Marketer Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unique ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Form Types
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {groupedSubmissions.map((item) => (
              <tr key={item.marketer_unique_id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.name || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.location || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.marketer_unique_id || "N/A"}
                </td>
                {/* Make form types clickable */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800"
                    onClick={() => openModal(item.details)}
                  >
                    {item.types.join(", ")}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => openModal(item.details)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleDelete(item.details[0].type, item.details[0].id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                  >
                    Delete
                  </button>
                  {user && user.role === "MasterAdmin" && (
                    <>
                      <button
                        onClick={() => handleReset(item)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs"
                      >
                        Reset Form
                      </button>
                      <button
                        onClick={() => handleApprove(item)}
                        className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs"
                      >
                        Approve
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Responsive Modal for Detailed View */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg max-w-xl w-full p-6 relative">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 text-2xl"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4">Submission Details</h3>
            {modalData ? (
              <div className="text-sm text-gray-700 space-y-2 max-h-[70vh] overflow-y-auto pr-2">
                {modalData.map((detail, idx) => (
                  <div key={idx} className="border-b pb-2 mb-2">
                    {Object.entries(detail).map(([key, value]) => (
                      <div key={key}>
                        <strong className="capitalize">{key}:</strong>{" "}
                        {value ? (typeof value === "string" ? value : JSON.stringify(value, null, 2)) : "N/A"}
                      </div>
                    ))}
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
