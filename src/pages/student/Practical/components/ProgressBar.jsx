// ProgressBar.jsx
import React from "react";

export default function ProgressBar({ currentStep, totalSteps, language = "en" }) {
  const percentage = (currentStep / totalSteps) * 100;

  // Hardcoded labels
  const stepText = language === "yo" ? "Ipele" : "Step";
  const ofText = language === "yo" ? "lati" : "of";

  return (
    <div className="w-full mb-6">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-[#FFD700]">
          {stepText} {currentStep} {ofText} {totalSteps}
        </span>
        <span className="text-sm font-medium text-[#FFD700]">
          {Math.round(percentage)}%
        </span>
      </div>

      <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden shadow-inner">
        <div
          className="h-4 bg-gradient-to-r from-[#FFD700] via-[#00FFB2] to-[#00FFFF] animate-pulse transition-all duration-700"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}
