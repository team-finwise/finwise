import Layout from '../components/Layout';
import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <Layout title="Privacy Policy" subtitle="How we handle your data">
      <div className="card" style={{ maxWidth: 800, margin: '0 auto', padding: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 24 }}>
          Last updated: September 17, 2026
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <section>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
              1. Who We Are
            </h2>
            <p>
              FINWISE is an AI-powered personal financial planning engine. For any questions regarding this policy, contact us at{' '}
              <a href="mailto:privacy@finwise.in" style={{ color: 'var(--accent)' }}>privacy@finwise.in</a>.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
              2. Data Storage & Privacy First
            </h2>
            <p>
              FINWISE operates entirely in your browser using local calculation engines. All inputs, income figures, expense items, and target dates are stored locally in your browser's <code>sessionStorage</code>. Your financial data is never sent to external tracking servers.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
              3. No Cookies or Trackers
            </h2>
            <p>
              We do not use advertising cookies, third-party analytics trackers, or cross-site tracking scripts.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
              4. AI Assistant Integration
            </h2>
            <p>
              When connecting to the local Python AI agent backend, queries submitted in the AI Assistant interface are processed to provide personalized financial observations. No personal identity data is sold or stored in external databases.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
              5. Resetting Your Data
            </h2>
            <p>
              You can clear your local data at any time by clicking "Reset Profile" in the sidebar navigation or by closing your browser session.
            </p>
          </section>
        </div>

        <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <Link to="/dashboard" className="btn btn-secondary">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </Layout>
  );
}
