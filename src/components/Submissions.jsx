// src/components/Submissions.jsx
import React, { useState, useEffect } from "react";

// DeleteFormModal Component: Allows Master Admin to select a specific form submission to delete.
function DeleteFormModal({ marketer, onClose, onDelete }) {
  const [selectedDetail, setSelectedDetail] = useState({ id: "", type: "" });

  const handleSubmit = () => {
    if (!selectedDetail.id || !selectedDetail.type) return;
    onDelete(selectedDetail.type, selectedDetail.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 text-2xl"
        >
          &times;
        </button>
        <h2 className="text-xl font-bold mb-4">
          Delete a Specific Form for{" "}
          {marketer.name || marketer.marketer_unique_id}
        </h2>
        <p className="mb-2">Select which submission entry to delete:</p>
        <select
          value={selectedDetail.id}
          onChange={(e) => {
            const submissionId = e.target.value;
            const detail = marketer.details.find(
              (d) => String(d.id) === submissionId
            );
            if (detail) {
              setSelectedDetail({ id: detail.id, type: detail.type });
            } else {
              setSelectedDetail({ id: "", type: "" });
            }
          }}
          className="border rounded px-3 py-2 w-full mb-4"
        >
          <option value="">-- Select Submission --</option>
          {marketer.details.map((detail) => (
            <option key={detail.id} value={detail.id}>
              {detail.type} (ID: {detail.id})
            </option>
          ))}
        </select>
        <button
          onClick={handleSubmit}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded w-full"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// ResetFormModal Component: Allows Master Admin to select which form type to reset.
// This version always shows the three form types regardless of the marketer's submission state.
function ResetFormModal({ marketer, onClose, onReset }) {
  // Define a constant array with the three fixed form types.
  const FORM_TYPES = ["Biodata", "Guarantor", "Commitment"];

  const [selectedType, setSelectedType] = useState("");

  const handleSubmit = () => {
    if (!selectedType) return;
    onReset(marketer.marketer_unique_id, selectedType);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 text-2xl"
        >
          &times;
        </button>
        <h2 className="text-xl font-bold mb-4">
          Reset a Form for {marketer.name || marketer.marketer_unique_id}
        </h2>
        <p className="mb-2">Select which form type to reset:</p>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="border rounded px-3 py-2 w-full mb-4"
        >
          <option value="">-- Select Form Type --</option>
          {FORM_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <button
          onClick={handleSubmit}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded w-full"
        >
          Reset Form
        </button>
      </div>
    </div>
  );
}


export default function Submissions() {
  // State for raw submissions fetched from the API.
  const [submissions, setSubmissions] = useState([]);
  // State for grouped submissions by marketer_unique_id.
  const [groupedSubmissions, setGroupedSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state for detailed view.
  const [modalOpen, setModalOpen] = useState(false);
  // For modal details, we store an array of submissions for that marketer.
  const [modalData, setModalData] = useState([]);

  // Modal state for resetting a form.
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedResetMarketer, setSelectedResetMarketer] = useState(null);

  // Modal state for deleting a specific form.
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDeleteMarketer, setSelectedDeleteMarketer] = useState(null);

  // Get current user from localStorage.
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  // Determine API endpoint based on user's role.
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
        acc[key] = {
          marketer_unique_id: key,
          // Use the marketer's name and location from the submission (or fallback)
          name: submission.name || submission.marketer_name || "N/A",
          location: submission.location || submission.marketer_location || "N/A",
          types: [submission.type],
          details: [submission],
        };
      } else {
        if (!acc[key].types.includes(submission.type)) {
          acc[key].types.push(submission.type);
        }
        acc[key].details.push(submission);
      }
      return acc;
    }, {});
    return Object.values(grouped);
  };

  // Fetch submissions from the backend on component mount.
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
        // Expected structure: data.submissions contains keys: biodata, guarantor, commitment.
        const { biodata = [], guarantor = [], commitment = [] } = data.submissions;
        // Tag each submission with its form type.
        const taggedBiodata = biodata.map((i) => ({ ...i, type: "Biodata" }));
        const taggedGuarantor = guarantor.map((i) => ({ ...i, type: "Guarantor" }));
        const taggedCommitment = commitment.map((i) => ({ ...i, type: "Commitment" }));
        const combined = [...taggedBiodata, ...taggedGuarantor, ...taggedCommitment];
        setSubmissions(combined);
        setGroupedSubmissions(groupSubmissions(combined));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  // Handlers for the details modal.
  const openModal = (details) => {
    setModalData(details);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setModalData([]);
  };

  // Handlers for the reset modal.
  const openResetModal = (marketer) => {
    setSelectedResetMarketer(marketer);
    setResetModalOpen(true);
  };
  const closeResetModal = () => {
    setResetModalOpen(false);
    setSelectedResetMarketer(null);
  };

  // Handlers for the delete modal.
  const openDeleteModal = (marketer) => {
    setSelectedDeleteMarketer(marketer);
    setDeleteModalOpen(true);
  };
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setSelectedDeleteMarketer(null);
  };

  // Handler for deleting a specific form submission.
  const handleDeleteSpecificForm = async (type, submissionId) => {
    if (!window.confirm(`Are you sure you want to delete this ${type} submission?`))
      return;
    try {
      const token = localStorage.getItem("token");
      let endpoint = "";
      if (type.toLowerCase() === "biodata") {
        endpoint = "/api/verification/biodata";
      } else if (type.toLowerCase() === "guarantor") {
        endpoint = "/api/verification/guarantor";
      } else if (type.toLowerCase() === "commitment") {
        endpoint = "/api/verification/commitment";
      } else {
        alert("Unknown form type.");
        return;
      }
      const url = `${import.meta.env.VITE_API_URL}${endpoint}/${submissionId}`;
      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          marketerUniqueId: selectedDeleteMarketer.marketer_unique_id
        })
     });
      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "Failed to delete submission");
        return;
      }
      const newSubmissions = submissions.filter(
        (item) => String(item.id) !== String(submissionId)
      );
      setSubmissions(newSubmissions);
      setGroupedSubmissions(groupSubmissions(newSubmissions));
      alert("Submission deleted successfully.");
    } catch (error) {
      console.error("Error deleting submission:", error);
      alert("Error deleting submission.");
    }
  };

  // Handler for resetting a form submission.
  const handleResetFormType = async (marketerUniqueId, formType) => {
    if (!window.confirm(`Allow refill for the ${formType} form for this marketer?`))
      return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/verification/allow-refill`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          marketerUniqueId,
          formType: formType.toLowerCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to reset form.");
      } else {
        alert(data.message || `${formType} form has been reset successfully.`);
      }
    } catch (error) {
      console.error("Error resetting form type:", error);
      alert("Error resetting form type.");
    }
  };

  // Handler for approving a marketer (Master Admin only).
  const handleApprove = async (marketer) => {
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
          marketerUniqueId: marketer.marketer_unique_id,
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
  if (groupedSubmissions.length === 0) return <p>No submissions available.</p>;

  return (
    <div className="container mx-auto px-4 py-6">
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
            {groupedSubmissions.map((group) => (
              <tr key={group.marketer_unique_id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {group.name || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {group.location || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {group.marketer_unique_id || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800"
                    onClick={() => openModal(group.details)}
                  >
                    {group.types.join(", ")}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => openModal(group.details)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                  >
                    View Details
                  </button>
                  {user && user.role === "MasterAdmin" && (
                    <>
                      <button
                        onClick={() => openDeleteModal(group)}
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => openResetModal(group)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs"
                      >
                        Reset Form
                      </button>
                      <button
                        onClick={() => handleApprove(group)}
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
                        {value
                          ? typeof value === "string"
                            ? value
                            : JSON.stringify(value, null, 2)
                          : "N/A"}
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

      {/* Delete Modal */}
      {deleteModalOpen && selectedDeleteMarketer && (
        <DeleteFormModal
          marketer={selectedDeleteMarketer}
          onClose={closeDeleteModal}
          onDelete={handleDeleteSpecificForm}
        />
      )}

      {/* Reset Modal */}
      {resetModalOpen && selectedResetMarketer && (
        <ResetFormModal
          marketer={selectedResetMarketer}
          onClose={closeResetModal}
          onReset={handleResetFormType}
        />
      )}
    </div>
  );
}
