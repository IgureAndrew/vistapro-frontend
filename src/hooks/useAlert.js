import { useState } from 'react';

export function useAlert() {
  const [alert, setAlert] = useState({
    open: false,
    type: 'info',
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancel',
    onConfirm: null,
    onCancel: null,
    showCancel: false,
    variant: 'default'
  });

  const showAlert = (options) => {
    setAlert({
      open: true,
      type: options.type || 'info',
      title: options.title || '',
      message: options.message || '',
      confirmText: options.confirmText || 'OK',
      cancelText: options.cancelText || 'Cancel',
      onConfirm: options.onConfirm || (() => setAlert(prev => ({ ...prev, open: false }))),
      onCancel: options.onCancel || (() => setAlert(prev => ({ ...prev, open: false }))),
      showCancel: options.showCancel || false,
      variant: options.variant || 'default'
    });
  };

  const hideAlert = () => {
    setAlert(prev => ({ ...prev, open: false }));
  };

  // Convenience methods for common alert types
  const showSuccess = (message, title = 'Success') => {
    showAlert({
      type: 'success',
      title,
      message,
      variant: 'success',
      showCancel: false
    });
  };

  const showError = (message, title = 'Error') => {
    showAlert({
      type: 'error',
      title,
      message,
      variant: 'destructive',
      showCancel: false
    });
  };

  const showInfo = (message, title = 'Information') => {
    showAlert({
      type: 'info',
      title,
      message,
      showCancel: false
    });
  };

  const showWarning = (message, title = 'Warning') => {
    showAlert({
      type: 'warning',
      title,
      message,
      showCancel: false
    });
  };

  const showConfirmation = (message, title = 'Confirm Action', onConfirm, onCancel) => {
    showAlert({
      type: 'warning',
      title,
      message,
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      showCancel: true,
      onConfirm: () => {
        if (onConfirm) onConfirm();
        hideAlert();
      },
      onCancel: () => {
        if (onCancel) onCancel();
        hideAlert();
      }
    });
  };

  return {
    alert,
    showAlert,
    hideAlert,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showConfirmation
  };
}
