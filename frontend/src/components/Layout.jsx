import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import useStore from '../store/useStore';

const icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  assistant: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  whatif: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  transactions: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  reports: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  reset: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  ),
  menu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
};

export default function Layout({ children, title, subtitle }) {
  const { results, resetAll } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleReset() {
    if (window.confirm('Reset all financial data? This will clear your current profile and calculations.')) {
      resetAll();
      navigate('/');
    }
  }

  // Format current date e.g. "Sep 17, 2026"
  const formattedDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="wordmark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            FIN<span>WISE</span>
          </div>
          <div className="tagline">AI Personal Finance Engine</div>
        </div>

        <nav className="sidebar-nav">
          <span className="sidebar-section-label">Finance Bot</span>

          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            {icons.dashboard}
            Dashboard
          </NavLink>

          <NavLink
            to="/assistant"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            {icons.assistant}
            AI Assistant
          </NavLink>

          <NavLink
            to="/what-if"
            className={({ isActive }) =>
              `nav-link${isActive ? ' active' : ''}${!results ? ' disabled' : ''}`
            }
            onClick={(e) => {
              if (!results) e.preventDefault();
              else setMobileOpen(false);
            }}
            style={!results ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            {icons.whatif}
            What-If Simulator
          </NavLink>

          <span className="sidebar-section-label">Features</span>

          <NavLink
            to="/transactions"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            {icons.transactions}
            Transactions
            <span className="badge-soon">Soon</span>
          </NavLink>

          <NavLink
            to="/reports"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            {icons.reports}
            Reports
            <span className="badge-soon">Soon</span>
          </NavLink>

          <span className="sidebar-section-label">Account</span>

          <NavLink
            to="/"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            end
            onClick={() => setMobileOpen(false)}
          >
            {icons.profile}
            Financial Profile
          </NavLink>

          <button className="nav-link" onClick={handleReset}>
            {icons.reset}
            Reset Profile
          </button>
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <NavLink to="/privacy">Privacy Policy</NavLink>
            <NavLink to="/terms">Terms &amp; Conditions</NavLink>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="topbar-title">{title}</h1>
            {subtitle && <p className="topbar-subtitle">{subtitle}</p>}
          </div>

          <div className="topbar-right">
            <span className="topbar-date">{formattedDate}</span>
            <button
              className="mobile-nav-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle Navigation"
            >
              {icons.menu}
            </button>
          </div>
        </header>

        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
