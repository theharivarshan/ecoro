export default function ProgressBar({ currentStep, totalSteps, sectionTitle, sectionIcon }) {
  const percent = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{sectionIcon}</span>
          <span className="font-semibold text-forest-900">{sectionTitle}</span>
        </div>
        <span className="text-sm text-gray-500">Step {currentStep} of {totalSteps} &middot; {percent}%</span>
      </div>
      <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-forest-600 to-forest-400 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex justify-between mt-2">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all ${
              i + 1 < currentStep
                ? 'bg-forest-600'
                : i + 1 === currentStep
                ? 'bg-forest-500 pulse-dot'
                : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
