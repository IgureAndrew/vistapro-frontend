import React from "react";

export default function FormStepper({ steps, currentIndex, onStepClick }) {
  return (
    <div className="flex items-center space-x-4 mb-6">
      {steps.map((step, i) => {
        const done   = i < currentIndex;
        const active = i === currentIndex;
        const locked = i > currentIndex;

        return (
          <button
            key={step.key}
            onClick={() => !locked && onStepClick(i)}
            disabled={locked}
            className={`
              flex-1 p-3 rounded-md text-sm font-medium
              ${done   ? "bg-green-100 text-green-900" : ""}
              ${active ? "bg-blue-100  text-blue-900"  : ""}
              ${locked ? "bg-gray-100  text-gray-400 cursor-not-allowed" : ""}
            `}
          >
            {done && "✔︎ "}{step.label}
          </button>
        );
      })}
    </div>
  );
}
