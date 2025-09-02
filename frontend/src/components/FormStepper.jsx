// src/components/FormStepper.jsx
import React from "react";
import { Check } from "lucide-react";

export default function FormStepper({
  steps = [],         // fall back to empty array
  activeIndex = 0,    // which step is active (0‑based)
  completed = [],     // array of booleans, same length as steps
  onStepClick = () => {}
}) {
  return (
    <nav className="flex space-x-4">
      {steps.map((step, idx) => {
        const isCompleted = Boolean(completed[idx]);
        const isActive    = idx === activeIndex;
        const isClickable = isCompleted || idx === activeIndex;
        return (
          <button
            key={step.key}
            onClick={() => isClickable && onStepClick(idx, step.key)}
            disabled={!isClickable}
            className={`
              flex items-center space-x-2 px-3 py-1 rounded
              ${isActive      ? "bg-blue-100 text-blue-800" : ""}
              ${!isClickable  ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
          >
            {isCompleted
              ? <Check size={16} />
              : <span className={`w-5 h-5 flex items-center justify-center rounded-full border ${isActive ? "border-blue-600" : "border-gray-400"}`}>
                  {idx + 1}
                </span>
            }
            <span className="font-medium">{step.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
