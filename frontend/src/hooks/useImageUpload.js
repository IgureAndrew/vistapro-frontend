import { useState, useCallback } from 'react';

/**
 * Custom hook for handling image uploads with Base64 conversion
 * Provides clean separation of image handling logic
 */
export const useImageUpload = (options = {}) => {
  const {
    maxSize = 2 * 1024 * 1024, // 2MB default
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    onSuccess = () => {},
    onError = () => {}
  } = options;

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [base64Data, setBase64Data] = useState(null);

  const validateFile = useCallback((file) => {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      const error = `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`;
      setUploadError(error);
      onError(error);
      return false;
    }

    // Check file size
    if (file.size > maxSize) {
      const error = `File too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`;
      setUploadError(error);
      onError(error);
      return false;
    }

    return true;
  }, [allowedTypes, maxSize, onError]);

  const convertToBase64 = useCallback((file) => {
    return new Promise((resolve, reject) => {
      // Create a canvas to compress the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 800px width/height)
        const maxSize = 800;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to Base64 with compression (0.8 quality)
        const base64String = canvas.toDataURL('image/jpeg', 0.8);
        console.log('🖼️ Image converted to Base64, length:', base64String.length);
        resolve(base64String);
      };
      
      img.onerror = () => {
        const error = 'Failed to process image file';
        setUploadError(error);
        onError(error);
        reject(new Error(error));
      };
      
      // Load the image
      img.src = URL.createObjectURL(file);
    });
  }, [onError]);

  const handleFileSelect = useCallback(async (file) => {
    if (!file) return null;

    setIsUploading(true);
    setUploadError(null);

    try {
      // Validate file
      if (!validateFile(file)) {
        return null;
      }

      // Convert to Base64
      const base64String = await convertToBase64(file);
      
      // Set preview and data
      setPreviewUrl(base64String);
      setBase64Data(base64String);
      
      onSuccess(base64String);
      return base64String;

    } catch (error) {
      console.error('Image upload error:', error);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [validateFile, convertToBase64, onSuccess]);

  const clearImage = useCallback(() => {
    setPreviewUrl(null);
    setBase64Data(null);
    setUploadError(null);
  }, []);

  const reset = useCallback(() => {
    setIsUploading(false);
    setUploadError(null);
    setPreviewUrl(null);
    setBase64Data(null);
  }, []);

  return {
    isUploading,
    uploadError,
    previewUrl,
    base64Data,
    handleFileSelect,
    clearImage,
    reset,
    validateFile
  };
};
