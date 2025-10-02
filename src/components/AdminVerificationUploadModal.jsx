import React, { useState } from 'react';
import { X, Upload, Camera, MapPin, Users, FileText, AlertCircle } from 'lucide-react';
import { useToast } from './ui/use-toast';

const AdminVerificationUploadModal = ({ isOpen, onClose, submission, onSuccess }) => {
  const [formData, setFormData] = useState({
    locationPhotos: [],
    adminMarketerPhotos: [],
    landmarkPhotos: [],
    verificationNotes: ''
  });
  const [uploading, setUploading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const { showSuccess, showError } = useToast();

  if (!isOpen || !submission) return null;

  const handleFileChange = (field, files) => {
    const fileArray = Array.from(files);
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ...fileArray]
    }));
  };

  const removeFile = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('submissionId', submission.submission_id);
      formDataToSend.append('verificationNotes', formData.verificationNotes);

      // Append files
      formData.locationPhotos.forEach((file, index) => {
        formDataToSend.append(`locationPhotos`, file);
      });
      formData.adminMarketerPhotos.forEach((file, index) => {
        formDataToSend.append(`adminMarketerPhotos`, file);
      });
      formData.landmarkPhotos.forEach((file, index) => {
        formDataToSend.append(`landmarkPhotos`, file);
      });

      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/verification/admin/upload-verification/${submission.submission_id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        showSuccess("Verification photos and details have been uploaded successfully. Please review and click 'Verify and Send' to proceed.", "Upload Successful");
        setUploadSuccess(true);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload verification');
      }
    } catch (error) {
      console.error('Error uploading verification:', error);
      showError(error.message || "Failed to upload verification. Please try again.", "Upload Failed");
    } finally {
      setUploading(false);
    }
  };

  const handleVerifyAndSend = async () => {
    setVerifying(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/verification/admin/verify-and-send/${submission.submission_id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        showSuccess("Submission has been verified and sent to SuperAdmin for review.", "Verification Complete");
        onSuccess?.();
        onClose();
        // Reset form
        setFormData({
          locationPhotos: [],
          adminMarketerPhotos: [],
          landmarkPhotos: [],
          verificationNotes: ''
        });
        setUploadSuccess(false);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to verify and send submission');
      }
    } catch (error) {
      console.error('Error verifying and sending submission:', error);
      showError(error.message || "Failed to verify and send submission. Please try again.", "Verification Failed");
    } finally {
      setVerifying(false);
    }
  };

  const FileUploadSection = ({ title, description, icon: Icon, field, acceptedTypes = "image/*" }) => (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Icon className="w-5 h-5 text-gray-600" />
        <h4 className="font-medium text-gray-900">{title}</h4>
      </div>
      <p className="text-sm text-gray-500">{description}</p>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
        <input
          type="file"
          multiple
          accept={acceptedTypes}
          onChange={(e) => handleFileChange(field, e.target.files)}
          className="hidden"
          id={`upload-${field}`}
        />
        <label
          htmlFor={`upload-${field}`}
          className="cursor-pointer flex flex-col items-center justify-center space-y-2 py-4"
        >
          <Upload className="w-8 h-8 text-gray-400" />
          <span className="text-sm text-gray-600">Click to upload or drag and drop</span>
          <span className="text-xs text-gray-400">PNG, JPG, JPEG up to 10MB each</span>
        </label>
      </div>

      {/* Display uploaded files */}
      {formData[field].length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Uploaded files:</p>
          {formData[field].map((file, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
              <span className="text-sm text-gray-700 truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(field, index)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Camera className="w-6 h-6 text-amber-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Upload Verification Details
              </h2>
              <p className="text-sm text-gray-500">
                For: {submission.marketer_name || 'Marketer'} (ID: {submission.marketer_id})
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
        <form onSubmit={handleUpload} className="p-6 space-y-6">
          {/* Location Photos */}
          <FileUploadSection
            title="Location Photos"
            description="Upload photos of the marketer's residence/address for verification"
            icon={MapPin}
            field="locationPhotos"
          />

          {/* Admin + Marketer Photos */}
          <FileUploadSection
            title="Admin + Marketer Photos"
            description="Upload photos of you (Admin) and the marketer together at their residence"
            icon={Users}
            field="adminMarketerPhotos"
          />

          {/* Landmark Photos */}
          <FileUploadSection
            title="Landmark Photos"
            description="Upload photos of nearby landmarks to verify the address location"
            icon={MapPin}
            field="landmarkPhotos"
          />

          {/* Verification Notes */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-gray-600" />
              <h4 className="font-medium text-gray-900">Verification Notes</h4>
            </div>
            <p className="text-sm text-gray-500">
              Add any additional notes or observations about the verification process
            </p>
            <textarea
              value={formData.verificationNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, verificationNotes: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Enter verification notes..."
            />
          </div>

          {/* Success Message */}
          {uploadSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-green-800">Upload Successful!</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Verification files have been uploaded successfully. Please review your uploads and click "Verify and Send" to proceed to SuperAdmin review.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Requirements Info */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800">Verification Requirements</h4>
                <ul className="text-sm text-amber-700 mt-2 space-y-1">
                  <li>• At least 2 location photos showing the residence</li>
                  <li>• At least 1 photo of Admin + Marketer together</li>
                  <li>• At least 1 landmark photo for address verification</li>
                  <li>• All photos should be clear and well-lit</li>
                  <li>• Photos will be reviewed by SuperAdmin before approval</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={uploading || verifying}
            >
              Cancel
            </button>
            
            {!uploadSuccess ? (
              <button
                type="submit"
                disabled={uploading || formData.locationPhotos.length === 0 || formData.adminMarketerPhotos.length === 0}
                className="px-4 py-2 bg-amber-600 text-white hover:bg-amber-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Upload Verification'}
              </button>
            ) : (
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setUploadSuccess(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  disabled={verifying}
                >
                  Edit Upload
                </button>
                <button
                  type="button"
                  onClick={handleVerifyAndSend}
                  disabled={verifying}
                  className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifying ? 'Sending...' : 'Verify and Send'}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminVerificationUploadModal;
