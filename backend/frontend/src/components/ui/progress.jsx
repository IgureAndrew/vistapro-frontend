import React from "react";

const Progress = ({ value, className = "", ...props }) => {
  return (
    <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${className}`} {...props}>
      <div
        className="h-full bg-amber-500 transition-all duration-300 ease-in-out"
        style={{ width: `${Math.min(100, Math.max(0, value || 0))}%` }}
      />
    </div>
  );
};

export { Progress };
