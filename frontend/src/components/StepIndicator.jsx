const STEPS = ['Income', 'Expenses', 'Savings & Debt', 'Goal'];

/**
 * StepIndicator
 *
 * Props:
 *   current — number 1–4 (current active step)
 */
export default function StepIndicator({ current }) {
  return (
    <div className="step-indicator">
      {STEPS.map((label, index) => {
        const stepNum = index + 1;
        const isDone = stepNum < current;
        const isActive = stepNum === current;

        return (
          <div key={label} className="step-item" style={{ flex: index < STEPS.length - 1 ? 1 : 'none' }}>
            <div className={`step-circle ${isDone ? 'done' : isActive ? 'active' : ''}`}>
              {isDone ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                stepNum
              )}
            </div>
            <span className={`step-label ${isActive ? 'active' : ''}`}>{label}</span>
            {index < STEPS.length - 1 && (
              <div className={`step-connector ${isDone ? 'done' : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
