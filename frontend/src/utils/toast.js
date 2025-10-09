// src/utils/toast.js
// Simple toast notification utility

export const showSuccess = (message) => {
  // For now, just use console.log
  // In a real app, you might use a toast library like react-toastify
  console.log('✅ Success:', message);
  alert(`✅ ${message}`);
};

export const showError = (message) => {
  // For now, just use console.log
  // In a real app, you might use a toast library like react-toastify
  console.log('❌ Error:', message);
  alert(`❌ ${message}`);
};

export const showInfo = (message) => {
  console.log('ℹ️ Info:', message);
  alert(`ℹ️ ${message}`);
};

export const showWarning = (message) => {
  console.log('⚠️ Warning:', message);
  alert(`⚠️ ${message}`);
};
