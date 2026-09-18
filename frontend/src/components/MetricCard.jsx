/**
 * MetricCard
 *
 * Props:
 *   label      — string (e.g. "Monthly Surplus")
 *   value      — string (pre-formatted, e.g. "₹15,000")
 *   sub        — string (optional subtitle)
 *   status     — 'green' | 'red' | 'amber' | 'blue' | null
 *   badge      — string (optional badge text)
 *   icon       — JSX element (optional icon)
 *   gradient   — 'peach' | 'mint' | 'sand' | 'accent' (optional override)
 */
export default function MetricCard({ label, value, sub, status, badge, icon, gradient }) {

  // Decide background based on gradient prop or status
  let bgGradient = 'var(--bg-surface)';
  let darkText = true; // Most gradients in light theme use dark text

  if (gradient === 'peach' || status === 'amber') bgGradient = 'var(--gradient-peach)';
  if (gradient === 'mint' || status === 'green') bgGradient = 'var(--gradient-mint)';
  if (gradient === 'sand' || status === 'blue') bgGradient = 'var(--gradient-sand)';
  if (gradient === 'accent') {
    bgGradient = 'var(--accent-gradient)';
    darkText = false;
  }
  if (status === 'red') bgGradient = 'var(--red-muted)';

  const textColor = darkText ? 'var(--text-primary)' : '#ffffff';
  const mutedColor = darkText ? 'var(--text-secondary)' : 'rgba(255,255,255,0.7)';

  return (
    <div
      className="metric-card"
      style={{
        background: bgGradient,
        color: textColor,
        border: 'none',
        borderRadius: '24px', // Extra round, like Dribbble
        padding: '24px'
      }}
    >
      <div className="flex items-center justify-between">
        <div style={{ fontSize: 13, fontWeight: 600, color: mutedColor }}>
          {label}
        </div>
        {icon && <div style={{ color: darkText ? 'var(--text-primary)' : '#fff', opacity: 0.8 }}>{icon}</div>}
      </div>

      <div style={{ fontSize: 32, fontWeight: 700, marginTop: 16, marginBottom: 8, letterSpacing: '-0.02em', color: textColor }}>
        {value}
      </div>

      {(sub || badge) && (
        <div className="flex items-center justify-between mt-3" style={{ paddingTop: 16, borderTop: `1px solid ${darkText ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)'}` }}>
          {sub && <div style={{ fontSize: 12, color: mutedColor, fontWeight: 500 }}>{sub}</div>}
          {badge && (
            <span style={{
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 600,
              borderRadius: 20,
              background: darkText ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.2)',
              color: textColor
            }}>
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
