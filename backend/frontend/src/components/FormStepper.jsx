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
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div 
          className="bg-gradient-to-r from-amber-500 to-amber-600 h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((activeIndex + 1) / steps.length) * 100}%` }}
        ></div>
      </div>
      
      {/* Progress Text */}
      <div className="text-center mb-6">
        <p className="text-sm text-gray-600">
          Step {activeIndex + 1} of {steps.length} - {steps[activeIndex]?.label}
        </p>
      </div>
      
      <div className="flex items-center justify-between relative">
        {steps.map((step, idx) => {
          const isCompleted = Boolean(completed[idx]);
          const isActive    = idx === activeIndex;
          const isClickable = isCompleted || idx === activeIndex;
          
          return (
            <div key={step.key} className="flex flex-col items-center flex-1">
              {/* Step Circle */}
              <button
                onClick={() => isClickable && onStepClick(idx, step.key)}
                disabled={!isClickable}
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold mb-2
                  transition-all duration-300 transform hover:scale-110
                  ${isCompleted 
                    ? "bg-green-500 text-white shadow-lg animate-pulse" 
                    : isActive 
                      ? "text-white shadow-lg ring-4 ring-amber-200" 
                      : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                  }
                  ${!isClickable ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                `}
                style={isActive && !isCompleted ? { backgroundColor: '#f59e0b' } : {}}
              >
                {isCompleted ? <Check size={20} /> : idx + 1}
              </button>
              
              {/* Step Label */}
              <span className={`
                text-xs font-semibold text-center px-2
                ${isActive ? "text-amber-600" : isCompleted ? "text-green-600" : "text-gray-500"}
              `}>
                {step.label}
              </span>
              
              {/* Completion Status */}
              {isCompleted && (
                <div className="text-xs text-green-600 font-medium mt-1">
                  ✓ Complete
                </div>
              )}
              
              {/* Connector Line */}
              {idx < steps.length - 1 && (
                <div className={`
                  absolute top-5 left-1/2 w-full h-0.5 -z-10
                  ${isCompleted ? "bg-green-500" : "bg-gray-200"}
                `} style={{ width: `calc(100% / ${steps.length - 1})`, left: `${(idx + 0.5) * (100 / steps.length)}%` }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
