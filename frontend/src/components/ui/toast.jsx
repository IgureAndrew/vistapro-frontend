import React from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useToast } from "./use-toast";

const toastTypes = {
  success: { icon: CheckCircle, className: "border-green-200 bg-green-50 text-green-800" },
  error: { icon: AlertCircle, className: "border-red-200 bg-red-50 text-red-800" },
  warning: { icon: AlertTriangle, className: "border-yellow-200 bg-yellow-50 text-yellow-800" },
  info: { icon: Info, className: "border-blue-200 bg-blue-50 text-blue-800" }
};

export default function Toast({ 
  type = "info", 
  title, 
  message, 
  onClose, 
  duration = 5000 
}) {
  const { icon: Icon, className } = toastTypes[type];

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div className={`fixed top-4 right-4 z-[100] w-96 max-w-md rounded-lg border p-4 shadow-lg transition-all duration-300 ease-in-out ${className}`}>
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          {title && <h4 className="font-medium text-sm mb-1">{title}</h4>}
          {message && (
            <div className="text-sm whitespace-pre-line">
              {message}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="ml-2 flex-shrink-0 rounded-md p-1 hover:bg-[#f59e0b] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast();
  
  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => removeToast(toast.id)}
          duration={toast.duration}
        />
      ))}
    </div>
  );
}
