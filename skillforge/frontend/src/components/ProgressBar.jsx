import React from 'react';

export default function ProgressBar({ value = 0, label, showPercentage = true }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div>
      {(label || showPercentage) && (
        <div className="mb-1 flex items-center justify-between text-xs text-brand-steel">
          {label && <span>{label}</span>}
          {showPercentage && <span className="font-semibold text-brand-light">{Math.round(clamped)}%</span>}
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-brand-steel/25">
        <div
          className="h-full rounded-full bg-brand-orchid transition-all duration-500"
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
