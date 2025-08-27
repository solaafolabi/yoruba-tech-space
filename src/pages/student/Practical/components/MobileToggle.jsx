// ProgressBar.jsx
export default function ProgressBar({ currentStep, totalSteps }) {
  const percentage = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full bg-gray-300 rounded-full h-4 mb-4">
      <div
        className="bg-green-500 h-4 rounded-full"
        style={{ width: `${percentage}%` }}
      ></div>
      <p className="text-sm mt-1">{currentStep} / {totalSteps} steps completed</p>
    </div>
  );
}
