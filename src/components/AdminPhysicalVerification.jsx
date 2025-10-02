import React, { useState, useEffect } from 'react';
import { MapPin, Camera, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../api';

const AdminPhysicalVerification = ({ marketer, onComplete }) => {
  const [formData, setFormData] = useState({
    locationLatitude: '',
    locationLongitude: '',
    locationAddress: '',
    landmarkDescription: '',
    verificationNotes: ''
  });
  const [files, setFiles] = useState({
    adminAtLocationPhoto: null,
    marketerAtLocationPhoto: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            locationLatitude: position.coords.latitude.toString(),
            locationLongitude: position.coords.longitude.toString()
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Unable to get current location. Please enter manually.');
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFiles(prev => ({
      ...prev,
      [name]: files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      
      // Add form data
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });
      
      // Add files
      if (files.adminAtLocationPhoto) {
        formDataToSend.append('adminAtLocationPhoto', files.adminAtLocationPhoto);
      }
      if (files.marketerAtLocationPhoto) {
        formDataToSend.append('marketerAtLocationPhoto', files.marketerAtLocationPhoto);
      }
      
      // Add marketer ID
      formDataToSend.append('marketerUniqueId', marketer.unique_id);

      const response = await api.post('/enhanced-verification/admin/physical-verification', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setSuccess(true);
        onComplete?.(response.data.data);
      } else {
        setError(response.data.message || 'Verification failed');
      }
    } catch (err) {
      console.error('Error submitting physical verification:', err);
      setError(err.response?.data?.message || 'An error occurred during verification');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Complete!</h2>
          <p className="text-gray-600 mb-6">
            Physical verification has been completed successfully. The marketer's application is now being reviewed by SuperAdmin.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900 text-center">Physical Verification</h1>
          <p className="text-sm text-gray-600 text-center mt-1">
            Verify {marketer?.first_name} {marketer?.last_name}'s location and residence
          </p>
        </div>
      </div>

      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Location Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <MapPin className="w-5 h-5 text-blue-600 mr-2" />
              Location Verification
            </h2>
            
            <div className="space-y-4">
              {/* Get Current Location Button */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  Get Current Location
                </button>
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Latitude *</label>
                  <input
                    type="text"
                    name="locationLatitude"
                    value={formData.locationLatitude}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 6.5244"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Longitude *</label>
                  <input
                    type="text"
                    name="locationLongitude"
                    value={formData.locationLongitude}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 3.3792"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Address *</label>
                <textarea
                  name="locationAddress"
                  value={formData.locationAddress}
                  onChange={handleInputChange}
                  required
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter the complete address of the marketer's residence"
                />
              </div>

              {/* Landmark */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Landmark Description *</label>
                <textarea
                  name="landmarkDescription"
                  value={formData.landmarkDescription}
                  onChange={handleInputChange}
                  required
                  rows="2"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe nearby landmarks (e.g., near the main market, opposite the school)"
                />
              </div>
            </div>
          </div>

          {/* Photo Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Camera className="w-5 h-5 text-blue-600 mr-2" />
              Photo Documentation
            </h2>
            
            <div className="space-y-6">
              {/* Admin at Location Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo of Admin at Marketer's Location *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    name="adminAtLocationPhoto"
                    onChange={handleFileChange}
                    accept="image/*"
                    required
                    className="hidden"
                    id="admin-photo-upload"
                  />
                  <label htmlFor="admin-photo-upload" className="cursor-pointer">
                    <div className="text-gray-600">
                      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                      <p className="text-sm">Click to upload admin photo</p>
                      <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                      {files.adminAtLocationPhoto && (
                        <p className="mt-2 text-green-600 text-sm font-medium">
                          ✓ Selected: {files.adminAtLocationPhoto.name}
                        </p>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* Marketer at Location Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo of Marketer at Their Location *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    name="marketerAtLocationPhoto"
                    onChange={handleFileChange}
                    accept="image/*"
                    required
                    className="hidden"
                    id="marketer-photo-upload"
                  />
                  <label htmlFor="marketer-photo-upload" className="cursor-pointer">
                    <div className="text-gray-600">
                      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                      <p className="text-sm">Click to upload marketer photo</p>
                      <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                      {files.marketerAtLocationPhoto && (
                        <p className="mt-2 text-green-600 text-sm font-medium">
                          ✓ Selected: {files.marketerAtLocationPhoto.name}
                        </p>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Verification Notes</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                name="verificationNotes"
                value={formData.verificationNotes}
                onChange={handleInputChange}
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add any additional observations or notes about the verification process"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Submitting Verification...
                </div>
              ) : (
                'Complete Physical Verification'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPhysicalVerification;
