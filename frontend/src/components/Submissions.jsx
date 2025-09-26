// src/components/Submissions.jsx
import React, { useState, useEffect } from "react";
import ConfirmDialog from "./ui/confirm-dialog";
import { ChevronDownIcon, EyeIcon, TrashIcon, ArrowPathIcon, CheckIcon } from "@heroicons/react/24/outline";

// ActionDropdown Component: Dropdown menu for submission actions
function ActionDropdown({ group, onViewDetails, onDelete, onReset, onApprove, user }) {
  const [isOpen, setIsOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.action-dropdown')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const actions = [
    {
      id: 'view',
      label: 'View Details',
      icon: EyeIcon,
      onClick: () => {
        onViewDetails(group.details);
        setIsOpen(false);
      },
      className: 'text-gray-700 hover:bg-gray-100'
    }
  ];

  if (user && user.role === "MasterAdmin") {
    actions.push(
      {
        id: 'delete',
        label: 'Delete',
        icon: TrashIcon,
        onClick: () => {
          onDelete(group);
          setIsOpen(false);
        },
        className: 'text-red-700 hover:bg-red-50'
      },
      {
        id: 'reset',
        label: 'Reset Form',
        icon: ArrowPathIcon,
        onClick: () => {
          onReset(group);
          setIsOpen(false);
        },
        className: 'text-yellow-700 hover:bg-yellow-50'
      },
      {
        id: 'approve',
        label: 'Approve',
        icon: CheckIcon,
        onClick: () => {
          onApprove(group);
          setIsOpen(false);
        },
        className: 'text-green-700 hover:bg-green-50'
      }
    );
  }

  return (
    <div className="relative action-dropdown">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Actions
        <ChevronDownIcon className="ml-2 h-4 w-4" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              {actions.map((action) => (
                <button
                  key={action.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick();
                  }}
                  className={`${action.className} group flex items-center px-4 py-2 text-sm w-full text-left hover:bg-gray-50`}
                >
                  <action.icon className="mr-3 h-4 w-4" />
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// StatusBadge Component: Shows submission status
function StatusBadge({ group }) {
  const getStatusInfo = () => {
    // Check if all forms are submitted
    const submittedCount = [group.bio_submitted, group.guarantor_submitted, group.commitment_submitted].filter(Boolean).length;
    const totalCount = 3;
    const allFormsSubmitted = submittedCount === totalCount;
    
    // Check overall verification status
    const isApproved = group.overall_verification_status === 'approved' || group.overall_verification_status === 'complete';
    
    if (isApproved) {
      return { text: 'Complete', className: 'bg-green-100 text-green-800' };
    }
    
    if (submittedCount === 0) {
      return { text: 'Not Started', className: 'bg-gray-100 text-gray-800' };
    } else if (submittedCount < totalCount) {
      return { text: `Incomplete (${submittedCount}/${totalCount})`, className: 'bg-yellow-100 text-yellow-800' };
    } else if (allFormsSubmitted && !isApproved) {
      return { text: 'Pending Review', className: 'bg-blue-100 text-blue-800' };
    } else {
      return { text: 'Incomplete', className: 'bg-red-100 text-red-800' };
    }
  };

  const status = getStatusInfo();

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
      {status.text}
    </span>
  );
}

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
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

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
          // Add status and date information
          bio_submitted: submission.bio_submitted || false,
          guarantor_submitted: submission.guarantor_submitted || false,
          commitment_submitted: submission.commitment_submitted || false,
          overall_verification_status: submission.overall_verification_status || 'incomplete',
          latest_submission_date: submission.created_at,
        };
      } else {
        if (!acc[key].types.includes(submission.type)) {
          acc[key].types.push(submission.type);
        }
        acc[key].details.push(submission);
        // Update latest submission date if this submission is newer
        if (new Date(submission.created_at) > new Date(acc[key].latest_submission_date)) {
          acc[key].latest_submission_date = submission.created_at;
        }
      }
      return acc;
    }, {});
    return Object.values(grouped);
  };

  // Filter submissions to show only incomplete or not approved
  const filterIncompleteSubmissions = (groupedSubmissions) => {
    return groupedSubmissions.filter(group => {
      // Check if overall verification status is approved/complete
      const isApproved = group.overall_verification_status === 'approved' || 
                        group.overall_verification_status === 'complete';
      
      // Check if all required forms are submitted
      const allFormsSubmitted = group.bio_submitted && 
                               group.guarantor_submitted && 
                               group.commitment_submitted;
      
      // Show submission if:
      // 1. It's not approved/complete, OR
      // 2. Not all forms are submitted
      return !isApproved || !allFormsSubmitted;
    });
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
        const { biodata = [], guarantor = [], commitment = [] } = data.submissions || {};
        // Tag each submission with its form type.
        const taggedBiodata = biodata.map((i) => ({ ...i, type: "Biodata" }));
        const taggedGuarantor = guarantor.map((i) => ({ ...i, type: "Guarantor" }));
        const taggedCommitment = commitment.map((i) => ({ ...i, type: "Commitment" }));
        const combined = [...taggedBiodata, ...taggedGuarantor, ...taggedCommitment];
        setSubmissions(combined);
        const grouped = groupSubmissions(combined);
        const filtered = filterIncompleteSubmissions(grouped);
        setGroupedSubmissions(filtered);
        setFilteredSubmissions(filtered);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  // Filter submissions based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSubmissions(groupedSubmissions);
    } else {
      const filtered = groupedSubmissions.filter(group => 
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.marketer_unique_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.types.some(type => type.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredSubmissions(filtered);
    }
  }, [searchTerm, groupedSubmissions]);

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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const confirm = (action) => { setPendingAction(() => action); setConfirmOpen(true); };
  const runPending = async () => { if (pendingAction) { await pendingAction(); } setPendingAction(null); setConfirmOpen(false); };

  const handleDeleteSpecificForm = async (type, submissionId) => {
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
  if (filteredSubmissions.length === 0) {
    if (searchTerm.trim()) {
      return <p>No submissions found matching your search criteria.</p>;
    }
    return <p>No incomplete submissions found. All submissions are complete and approved.</p>;
  }

  return (
    <div className="w-full px-4 py-6">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name, location, ID, or form type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Marketer Info
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Form Types
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submission Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSubmissions.map((group) => (
              <tr key={group.marketer_unique_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-900">
                  {group.name || "N/A"}
                    </div>
                    <div className="text-sm text-gray-500">
                  {group.location || "N/A"}
                    </div>
                    <div className="text-xs text-gray-400">
                      {group.marketer_unique_id || "N/A"}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge group={group} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200"
                    onClick={() => openModal(group.details)}
                  >
                    {group.types.join(", ")}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {group.latest_submission_date 
                    ? new Date(group.latest_submission_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : "N/A"
                  }
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <ActionDropdown
                    group={group}
                    onViewDetails={openModal}
                    onDelete={openDeleteModal}
                    onReset={openResetModal}
                    onApprove={(group) => confirm(() => handleApprove(group))}
                    user={user}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {filteredSubmissions.map((group) => (
          <div key={group.marketer_unique_id} className="bg-white shadow rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {group.name || "N/A"}
                </h3>
                <p className="text-sm text-gray-500">
                  {group.location || "N/A"}
                </p>
                <p className="text-xs text-gray-400">
                  {group.marketer_unique_id || "N/A"}
                </p>
              </div>
              <StatusBadge group={group} />
            </div>
            
            <div className="flex items-center justify-between mb-3">
              <button
                className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200"
                onClick={() => openModal(group.details)}
              >
                {group.types.join(", ")}
              </button>
              <span className="text-xs text-gray-500">
                {group.latest_submission_date 
                  ? new Date(group.latest_submission_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : "N/A"
                }
              </span>
            </div>
            
            <div className="flex justify-end">
              <ActionDropdown
                group={group}
                onViewDetails={openModal}
                onDelete={openDeleteModal}
                onReset={openResetModal}
                onApprove={(group) => confirm(() => handleApprove(group))}
                user={user}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Responsive Modal for Detailed View */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] relative flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Submission Details</h3>
            <button
              onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              &times;
            </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
            {modalData ? (
                <div className="space-y-6">
                {modalData.map((detail, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 capitalize">
                        {detail.type || 'Submission'} Form
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {Object.entries(detail)
                          .filter(([key]) => !['id', 'type', 'marketer_unique_id', 'created_at', 'updated_at'].includes(key))
                          .map(([key, value]) => (
                          <div key={key} className="flex flex-col">
                            <span className="font-medium text-gray-700 capitalize">
                              {key.replace(/_/g, ' ')}:
                            </span>
                            <span className="text-gray-900 mt-1">
                        {value
                          ? typeof value === "string"
                            ? value
                            : JSON.stringify(value, null, 2)
                          : "N/A"}
                            </span>
                      </div>
                    ))}
                      </div>
                  </div>
                ))}
              </div>
            ) : (
                <p className="text-gray-500 text-center py-8">No details available.</p>
            )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && selectedDeleteMarketer && (
        <DeleteFormModal
          marketer={selectedDeleteMarketer}
          onClose={closeDeleteModal}
          onDelete={(type, id) => confirm(() => handleDeleteSpecificForm(type, id))}
        />
      )}

      {/* Reset Modal */}
      {resetModalOpen && selectedResetMarketer && (
        <ResetFormModal
          marketer={selectedResetMarketer}
          onClose={closeResetModal}
          onReset={(uid, t) => confirm(() => handleResetFormType(uid, t))}
        />
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Are you absolutely sure?"
        description="This action cannot be undone."
        confirmText="Continue"
        cancelText="Cancel"
        onConfirm={runPending}
        onCancel={() => { setPendingAction(null); setConfirmOpen(false); }}
      />
    </div>
  );
}
