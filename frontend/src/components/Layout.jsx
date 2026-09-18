import { NavLink, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';

const mark = (
  <svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M16 15.8C9.2 6.4 3.4 7.8 4.5 13.1c1 4.9 6.7 4.5 11.5 2.7Z" />
    <path d="M16 15.8c6.8-9.4 12.6-8 11.5-2.7-1 4.9-6.7 4.5-11.5 2.7Z" />
    <path d="M16 15.8C6.6 22.6 8 28.4 13.3 27.3c4.9-1 4.5-6.7 2.7-11.5Z" />
    <path d="M16 15.8c9.4 6.8 8 12.6 2.7 11.5-4.9-1-4.5-6.7-2.7-11.5Z" />
  </svg>
);

export default function Layout({ children, title, subtitle }) {
  const { results, resetAll, authUser, logout } = useStore();
  const navigate = useNavigate();

  function startFresh() {
    if (results && !window.confirm('Start a fresh financial profile? Your current session will be cleared.')) return;
    resetAll();
    navigate('/onboarding');
  }

  return (
    <div className="site-shell">
      <div className="offer-bar">Your financial clarity starts today <span>— built around your real life</span></div>
      <header className="site-nav">
        <NavLink to="/" className="brand" aria-label="Finwise home">
          <span className="brand-mark">{mark}</span>
          <span>fin<span>wise</span></span>
        </NavLink>

        <nav className="site-links" aria-label="Main navigation">
          <NavLink to="/dashboard">Overview</NavLink>
          <NavLink to="/transactions">Transactions</NavLink>
          <NavLink to="/reports">Reports</NavLink>
          <NavLink to="/what-if" className={!results ? 'is-disabled' : ''} onClick={(e) => !results && e.preventDefault()}>Plan ahead</NavLink>
          <NavLink to="/assistant">Ask Finwise</NavLink>
        </nav>

        <div className="site-actions">
          {results && <button className="nav-text-button" onClick={startFresh}>New plan</button>}
          <button className="nav-text-button" onClick={() => { logout(); navigate('/'); }}>Sign out</button>
          <button className="nav-cta" onClick={() => results ? navigate('/dashboard') : navigate('/onboarding')}>{results ? 'Open dashboard' : `Hi, ${authUser?.name?.split(' ')[0] || 'there'}`}</button>
        </div>
      </header>

      <main className="site-main">
        {title && (
          <div className="page-intro">
            <p className="eyebrow">FINWISE / PERSONAL FINANCE</p>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
        )}
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
