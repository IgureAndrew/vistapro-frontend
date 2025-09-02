import React from "react";
import { AlertTriangle, AlertCircle, CheckCircle, Info, X } from "lucide-react";

const alertTypes = {
  warning: { icon: AlertTriangle, className: "border-yellow-200 bg-yellow-50 text-yellow-800" },
  error: { icon: AlertCircle, className: "border-red-200 bg-red-50 text-red-800" },
  success: { icon: CheckCircle, className: "border-green-200 bg-green-50 text-green-800" },
  info: { icon: Info, className: "border-blue-200 bg-blue-50 text-blue-800" }
};

export default function AlertDialog({
  open,
  type = "info",
  title,
  message,
  confirmText = "Continue",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  showCancel = true,
  variant = "default" // default, destructive, success
}) {
  if (!open) return null;

  const { icon: Icon, className } = alertTypes[type];
  
  const getVariantStyles = () => {
    switch (variant) {
      case "destructive":
        return {
          confirmButton: "bg-red-600 hover:bg-red-700 text-white",
          cancelButton: "bg-gray-100 hover:bg-gray-200 text-gray-900"
        };
      case "success":
        return {
          confirmButton: "bg-green-600 hover:bg-green-700 text-white",
          cancelButton: "bg-gray-100 hover:bg-gray-200 text-gray-900"
        };
      default:
        return {
          confirmButton: "bg-blue-600 hover:bg-blue-700 text-white",
          cancelButton: "bg-gray-100 hover:bg-gray-200 text-gray-900"
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onCancel} 
        aria-hidden="true" 
      />
      <div 
        role="dialog" 
        aria-modal="true" 
        className="relative w-full max-w-[480px] bg-white rounded-xl shadow-xl border border-gray-200 p-6 mx-4"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className={`p-2 rounded-full ${className}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
            {message && <p className="text-sm text-gray-600">{message}</p>}
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        
        <div className="flex justify-end gap-3">
          {showCancel && (
            <button 
              onClick={onCancel} 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${variantStyles.cancelButton}`}
            >
              {cancelText}
            </button>
          )}
          <button 
            onClick={onConfirm} 
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${variantStyles.confirmButton}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Simple alert component for quick notifications
export function Alert({ type = "info", title, message, onClose, className = "" }) {
  const { icon: Icon, className: typeClassName } = alertTypes[type];

  return (
    <div className={`rounded-lg border p-4 ${typeClassName} ${className}`}>
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          {title && <h4 className="font-medium text-sm mb-1">{title}</h4>}
          {message && <p className="text-sm">{message}</p>}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-2 flex-shrink-0 rounded-md p-1 hover:bg-black/5 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
