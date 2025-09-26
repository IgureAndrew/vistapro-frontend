import React from 'react';
import { X, FileText, User, Shield, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const ViewSubmissionModal = ({ isOpen, onClose, submission }) => {
  if (!isOpen || !submission) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'not_submitted':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'not_submitted':
        return 'Not Submitted';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'not_submitted':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <User className="w-6 h-6 text-gray-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {submission.marketer_name || 'Marketer Details'}
              </h2>
              <p className="text-sm text-gray-500">
                ID: {submission.marketer_id || 'N/A'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Forms Status Overview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Forms Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Biodata Form */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">Biodata Form</h4>
                  <div className={`flex items-center space-x-2 px-2 py-1 rounded-full text-xs ${getStatusColor(submission.biodata_status || 'not_submitted')}`}>
                    {getStatusIcon(submission.biodata_status || 'not_submitted')}
                    <span>{getStatusText(submission.biodata_status || 'not_submitted')}</span>
                  </div>
                </div>
                {submission.biodata_submitted_at && (
                  <p className="text-xs text-gray-500">
                    Submitted: {format(new Date(submission.biodata_submitted_at), 'MMM dd, yyyy HH:mm')}
                  </p>
                )}
              </div>

              {/* Guarantor Form */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">Guarantor Form</h4>
                  <div className={`flex items-center space-x-2 px-2 py-1 rounded-full text-xs ${getStatusColor(submission.guarantor_status || 'not_submitted')}`}>
                    {getStatusIcon(submission.guarantor_status || 'not_submitted')}
                    <span>{getStatusText(submission.guarantor_status || 'not_submitted')}</span>
                  </div>
                </div>
                {submission.guarantor_submitted_at && (
                  <p className="text-xs text-gray-500">
                    Submitted: {format(new Date(submission.guarantor_submitted_at), 'MMM dd, yyyy HH:mm')}
                  </p>
                )}
              </div>

              {/* Commitment Form */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">Commitment Form</h4>
                  <div className={`flex items-center space-x-2 px-2 py-1 rounded-full text-xs ${getStatusColor(submission.commitment_status || 'not_submitted')}`}>
                    {getStatusIcon(submission.commitment_status || 'not_submitted')}
                    <span>{getStatusText(submission.commitment_status || 'not_submitted')}</span>
                  </div>
                </div>
                {submission.commitment_submitted_at && (
                  <p className="text-xs text-gray-500">
                    Submitted: {format(new Date(submission.commitment_submitted_at), 'MMM dd, yyyy HH:mm')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Form Data */}
          {submission.biodata_status === 'completed' && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Biodata Form Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-gray-900">{submission.biodata_name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-900">{submission.biodata_phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                  <p className="text-gray-900">{submission.biodata_dob ? format(new Date(submission.biodata_dob), 'MMM dd, yyyy') : 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Marital Status</label>
                  <p className="text-gray-900">{submission.biodata_marital_status || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">State of Origin</label>
                  <p className="text-gray-900">{submission.biodata_state_origin || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">State of Residence</label>
                  <p className="text-gray-900">{submission.biodata_state_residence || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Religion</label>
                  <p className="text-gray-900">{submission.biodata_religion || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">ID Type</label>
                  <p className="text-gray-900">{submission.biodata_id_type || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="text-gray-900">{submission.biodata_address || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">School Attended</label>
                  <p className="text-gray-900">{submission.biodata_school || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Last Place of Work</label>
                  <p className="text-gray-900">{submission.biodata_work_place || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Job Description</label>
                  <p className="text-gray-900">{submission.biodata_job_desc || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Reason for Quitting</label>
                  <p className="text-gray-900">{submission.biodata_quit_reason || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Medical Condition</label>
                  <p className="text-gray-900">{submission.biodata_medical || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Next of Kin Name</label>
                  <p className="text-gray-900">{submission.biodata_kin_name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Next of Kin Phone</label>
                  <p className="text-gray-900">{submission.biodata_kin_phone || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Next of Kin Address</label>
                  <p className="text-gray-900">{submission.biodata_kin_address || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Bank Name</label>
                  <p className="text-gray-900">{submission.biodata_bank_name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Account Number</label>
                  <p className="text-gray-900">{submission.biodata_account_number || 'N/A'}</p>
                </div>
                {submission.biodata_id_document && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500">ID Document</label>
                    <div className="mt-1">
                      <img 
                        src={submission.biodata_id_document} 
                        alt="ID Document" 
                        className="w-32 h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity" 
                        onClick={() => window.open(submission.biodata_id_document, '_blank')}
                        title="Click to view full size"
                      />
                    </div>
                  </div>
                )}
                {submission.biodata_passport_photo && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500">Passport Photo</label>
                    <div className="mt-1">
                      <img 
                        src={submission.biodata_passport_photo} 
                        alt="Passport Photo" 
                        className="w-32 h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity" 
                        onClick={() => window.open(submission.biodata_passport_photo, '_blank')}
                        title="Click to view full size"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Guarantor Form Details */}
          {submission.guarantor_status === 'completed' && (
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Guarantor Form Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Knows Candidate Well</label>
                  <p className="text-gray-900">{submission.guarantor_well_known ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Relationship</label>
                  <p className="text-gray-900">{submission.guarantor_relationship || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Known Duration (Years)</label>
                  <p className="text-gray-900">{submission.guarantor_known_duration || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Occupation</label>
                  <p className="text-gray-900">{submission.guarantor_occupation || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Means of Identification</label>
                  <p className="text-gray-900">{submission.guarantor_means_of_identification || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Guarantor Full Name</label>
                  <p className="text-gray-900">{submission.guarantor_full_name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Guarantor Email</label>
                  <p className="text-gray-900">{submission.guarantor_email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Guarantor Phone</label>
                  <p className="text-gray-900">{submission.guarantor_phone || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Guarantor Home Address</label>
                  <p className="text-gray-900">{submission.guarantor_home_address || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Guarantor Office Address</label>
                  <p className="text-gray-900">{submission.guarantor_office_address || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Candidate Name</label>
                  <p className="text-gray-900">{submission.guarantor_candidate_name || 'N/A'}</p>
                </div>
                {submission.guarantor_id_document && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500">ID Document</label>
                    <div className="mt-1">
                      <img 
                        src={submission.guarantor_id_document} 
                        alt="Guarantor ID Document" 
                        className="w-32 h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity" 
                        onClick={() => window.open(submission.guarantor_id_document, '_blank')}
                        title="Click to view full size"
                      />
                    </div>
                  </div>
                )}
                {submission.guarantor_passport_photo && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500">Passport Photo</label>
                    <div className="mt-1">
                      <img 
                        src={submission.guarantor_passport_photo} 
                        alt="Guarantor Passport Photo" 
                        className="w-32 h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity" 
                        onClick={() => window.open(submission.guarantor_passport_photo, '_blank')}
                        title="Click to view full size"
                      />
                    </div>
                  </div>
                )}
                {submission.guarantor_signature && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500">Signature</label>
                    <div className="mt-1">
                      <img 
                        src={submission.guarantor_signature} 
                        alt="Guarantor Signature" 
                        className="w-32 h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity" 
                        onClick={() => window.open(submission.guarantor_signature, '_blank')}
                        title="Click to view full size"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Commitment Form Details */}
          {submission.commitment_status === 'completed' && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Commitment Form Details
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-white rounded border">
                    <span className="text-sm text-gray-700">Will not accept false or forged documents</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${submission.commitment_false_docs ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {submission.commitment_false_docs ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded border">
                    <span className="text-sm text-gray-700">Will not request irrelevant information</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${submission.commitment_irrelevant_info ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {submission.commitment_irrelevant_info ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded border">
                    <span className="text-sm text-gray-700">Will not charge customer fees</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${submission.commitment_no_fees ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {submission.commitment_no_fees ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded border">
                    <span className="text-sm text-gray-700">Will not modify contract information</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${submission.commitment_no_modify ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {submission.commitment_no_modify ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded border">
                    <span className="text-sm text-gray-700">Will only sell approved phones</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${submission.commitment_approved_phones ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {submission.commitment_approved_phones ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded border">
                    <span className="text-sm text-gray-700">Will not make unofficial commitments</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${submission.commitment_no_unofficial ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {submission.commitment_no_unofficial ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded border">
                    <span className="text-sm text-gray-700">Will not operate customer accounts without permission</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${submission.commitment_no_operate_account ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {submission.commitment_no_operate_account ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded border">
                    <span className="text-sm text-gray-700">Accepts fraud-related firing</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${submission.commitment_fraud_firing ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {submission.commitment_fraud_firing ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded border">
                    <span className="text-sm text-gray-700">Will not share company information</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${submission.commitment_no_share_info ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {submission.commitment_no_share_info ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded border">
                    <span className="text-sm text-gray-700">Will ensure loan recovery</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${submission.commitment_loan_recovery ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {submission.commitment_loan_recovery ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded border">
                    <span className="text-sm text-gray-700">Will abide by the system</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${submission.commitment_abide_system ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {submission.commitment_abide_system ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Direct Sales Rep Name</label>
                    <p className="text-gray-900">{submission.commitment_rep_name || 'N/A'}</p>
                  </div>
                  {submission.commitment_rep_signature && (
                    <div className="mt-2">
                      <label className="text-sm font-medium text-gray-500">Rep Signature</label>
                      <div className="mt-1">
                        <img 
                          src={submission.commitment_rep_signature} 
                          alt="Rep Signature" 
                          className="w-32 h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity" 
                          onClick={() => window.open(submission.commitment_rep_signature, '_blank')}
                          title="Click to view full size"
                        />
                      </div>
                    </div>
                  )}
                  <div className="mt-2">
                    <label className="text-sm font-medium text-gray-500">Date Signed</label>
                    <p className="text-gray-900">
                      {submission.commitment_date_signed ? 
                        format(new Date(submission.commitment_date_signed), 'MMM dd, yyyy HH:mm') : 
                        'N/A'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submission Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Submission Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Submission Status</label>
                <p className="text-gray-900 capitalize">
                  {submission.submission_status?.replace(/_/g, ' ') || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Created Date</label>
                <p className="text-gray-900">
                  {submission.submission_created_at ? 
                    format(new Date(submission.submission_created_at), 'MMM dd, yyyy HH:mm') : 
                    'N/A'
                  }
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <p className="text-gray-900">
                  {submission.submission_updated_at ? 
                    format(new Date(submission.submission_updated_at), 'MMM dd, yyyy HH:mm') : 
                    'N/A'
                  }
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">All Forms Submitted</label>
                <p className="text-gray-900">
                  {submission.all_forms_submitted ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </div>

          {/* Admin Verification Details */}
          {submission.admin_verification_date && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-blue-600" />
                Admin Verification
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Verification Date</label>
                  <p className="text-gray-900">
                    {format(new Date(submission.admin_verification_date), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Verified By</label>
                  <p className="text-gray-900">
                    {submission.admin_name || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Close
            </button>
            {submission.submission_status === 'pending_admin_review' && submission.all_forms_submitted && (
              <button
                onClick={() => {
                  onClose();
                  // This will be handled by the parent component
                  if (window.handleUploadVerification) {
                    window.handleUploadVerification(submission);
                  }
                }}
                className="px-4 py-2 bg-amber-600 text-white hover:bg-amber-700 rounded-lg transition-colors"
              >
                Upload Verification
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewSubmissionModal;
