import React from 'react';
import { Camera, Upload, X, AlertCircle } from 'lucide-react';
import { useImageUpload } from '../hooks/useImageUpload';

/**
 * Reusable Image Upload Component
 * Handles image selection, preview, and Base64 conversion
 */
const ImageUpload = ({ 
  value, 
  onChange, 
  onError,
  className = "",
  disabled = false,
  showPreview = true,
  maxSize = 2 * 1024 * 1024, // 2MB
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
}) => {
  const {
    isUploading,
    uploadError,
    previewUrl,
    handleFileSelect,
    clearImage
  } = useImageUpload({
    maxSize,
    allowedTypes,
    onSuccess: (base64Data) => {
      onChange?.(base64Data);
    },
    onError: (error) => {
      onError?.(error);
    }
  });

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClearImage = () => {
    clearImage();
    onChange?.(null);
  };

  const displayPreview = previewUrl || value;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* File Input */}
      <div className="relative">
        <input
          type="file"
          accept={allowedTypes.join(',')}
          onChange={handleFileChange}
          disabled={disabled || isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          id="image-upload"
        />
        <label
          htmlFor="image-upload"
          className={`
            flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer
            ${disabled || isUploading 
              ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
              : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
            }
            ${uploadError ? 'border-red-300 bg-red-50' : ''}
          `}
        >
          {isUploading ? (
            <div className="flex flex-col items-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="text-sm text-gray-600">Processing...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <Upload className="h-8 w-8 text-gray-400" />
              <div className="text-sm text-gray-600">
                <span className="font-medium text-blue-600 hover:text-blue-500">
                  Click to upload
                </span>
                {' '}or drag and drop
              </div>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF up to {Math.round(maxSize / 1024 / 1024)}MB
              </p>
            </div>
          )}
        </label>
      </div>

      {/* Error Message */}
      {uploadError && (
        <div className="flex items-center space-x-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Image Preview */}
      {showPreview && displayPreview && (
        <div className="relative">
          <div className="relative w-32 h-32 mx-auto">
            <img
              src={displayPreview}
              alt="Profile preview"
              className="w-full h-full object-cover rounded-lg border border-gray-200"
            />
            {!disabled && (
              <button
                type="button"
                onClick={handleClearImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                title="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="text-center text-xs text-gray-500 mt-2">
            Preview
          </p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
