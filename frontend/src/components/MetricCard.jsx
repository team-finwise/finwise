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
 */
export default function MetricCard({ label, value, sub, status, badge, icon }) {
  return (
    <div className="metric-card">
      <div className={`metric-card-accent ${status || 'blue'}`} />
      
      <div className="flex items-center justify-between">
        <div className="card-label">{label}</div>
        {icon && <div style={{ color: 'var(--text-muted)' }}>{icon}</div>}
      </div>

      <div className="card-value mt-1">
        {value}
      </div>

      {(sub || badge) && (
        <div className="flex items-center justify-between mt-2">
          {sub && <div className="card-sub">{sub}</div>}
          {badge && (
            <span className={`badge badge-${status || 'blue'}`}>{badge}</span>
          )}
        </div>
      )}
    </div>
  );
}
