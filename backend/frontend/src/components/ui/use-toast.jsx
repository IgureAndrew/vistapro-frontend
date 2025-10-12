import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = 'info', title, message, duration = 5000 }) => {
    const id = Date.now() + Math.random();
    const newToast = { id, type, title, message, duration };
    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showSuccess = useCallback((message, title = 'Success') => {
    return addToast({ type: 'success', title, message });
  }, [addToast]);

  const showError = useCallback((message, title = 'Error') => {
    return addToast({ type: 'error', title, message });
  }, [addToast]);

  const showWarning = useCallback((message, title = 'Warning') => {
    return addToast({ type: 'warning', title, message });
  }, [addToast]);

  const showInfo = useCallback((message, title = 'Info') => {
    return addToast({ type: 'info', title, message });
  }, [addToast]);

  const value = {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
