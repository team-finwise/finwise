/**
 * ProgressBar
 *
 * Props:
 *   value    — number 0–100 (percentage)
 *   color    — 'blue' | 'green' | 'amber' | 'red' (default: 'blue')
 *   label    — string (optional screen-reader label)
 */
export default function ProgressBar({ value, color = 'blue', label }) {
  const clamped = Math.min(Math.max(value || 0, 0), 100);
  const colorClass = color !== 'blue' ? color : '';

  return (
    <div
      className="progress-bar-track"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={`progress-bar-fill ${colorClass}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
