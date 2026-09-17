import { Link } from 'react-router-dom';

/**
 * ComingSoon
 *
 * Clean placeholder component for features requiring backend/database support.
 *
 * Props:
 *   title       — string (e.g. "Transaction Tracking")
 *   description — string (explanation of backend dependency)
 *   icon        — JSX element (optional custom icon)
 */
export default function ComingSoon({ title, description, icon }) {
  return (
    <div className="coming-soon-wrapper">
      <div className="coming-soon-icon">
        {icon || (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        )}
      </div>

      <span className="coming-soon-badge">Backend Dependency Pending</span>

      <h2 className="coming-soon-title" style={{ marginTop: 16 }}>{title}</h2>

      <p className="coming-soon-desc">
        {description}
      </p>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <Link to="/dashboard" className="btn btn-primary">
          Back to Dashboard
        </Link>
        <Link to="/what-if" className="btn btn-secondary">
          Try What-If Simulator
        </Link>
      </div>
    </div>
  );
}
