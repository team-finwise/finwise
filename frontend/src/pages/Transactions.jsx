import Layout from '../components/Layout';
import ComingSoon from '../components/ComingSoon';

export default function Transactions() {
  return (
    <Layout
      title="Transaction Tracking"
      subtitle="View, categorize, and search past financial transactions"
    >
      <ComingSoon
        title="Transaction Tracking Coming Soon"
        description="Transaction storage requires a backend database and transaction sync service (e.g. Plaid or CSV importer) that is not currently set up in this environment."
        icon={
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        }
      />
    </Layout>
  );
}
