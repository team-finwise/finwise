import Layout from '../components/Layout';
import ComingSoon from '../components/ComingSoon';

export default function Reports() {
  return (
    <Layout
      title="Financial Reports & Analytics"
      subtitle="Historical trends, net worth tracking, and monthly financial statements"
    >
      <ComingSoon
        title="Historical Reporting Coming Soon"
        description="Multi-month reporting requires persistent historical data storage to generate trend graphs, month-over-month comparisons, and net worth charts over time."
        icon={
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        }
      />
    </Layout>
  );
}
