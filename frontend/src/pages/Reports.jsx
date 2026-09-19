import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import MetricCard from '../components/MetricCard';
import SkeletonLoader from '../components/SkeletonLoader';
import { fetchHistoricalReport, seedSampleTransactions } from '../lib/api';
import { formatRupee, formatPercent } from '../lib/formatters';

export default function Reports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [monthsRange, setMonthsRange] = useState(12);

  async function loadReport(months = monthsRange) {
    setLoading(true);
    setError('');
    try {
      const data = await fetchHistoricalReport(months);
      setReport(data);
    } catch (err) {
      console.error(err);
      setError('Unable to load historical reports. Ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport(monthsRange);
  }, [monthsRange]);

  async function handleSeedDemoData() {
    setLoading(true);
    try {
      await seedSampleTransactions();
      await loadReport(monthsRange);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  function handleDownloadCSV() {
    window.open('http://localhost:8000/api/reports/export', '_blank');
  }

  const hasData = report && report.has_data && report.monthly_trends && report.monthly_trends.length > 0;
  const summary = report?.summary;
  const trends = report?.monthly_trends || [];

  // Find max value across trends for relative bar height scaling
  const maxCashFlow = trends.length > 0
    ? Math.max(...trends.map((t) => Math.max(t.income, t.total_outflow, Math.abs(t.surplus))))
    : 100000;

  return (
    <Layout
      title="Financial Reports & Analytics"
      subtitle="Historical trends, cash flow velocity, and multi-month financial statements"
    >
      {/* Controls & Period Selector Bar */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Analysis Range:</span>
            <div style={{ display: 'flex', background: 'var(--bg-raised)', padding: 3, borderRadius: 'var(--radius)', gap: 2 }}>
              {[
                { label: 'Past 3 Months', val: 3 },
                { label: 'Past 6 Months', val: 6 },
                { label: 'Past 12 Months', val: 12 },
              ].map((r) => (
                <button
                  key={r.val}
                  className="btn"
                  style={{
                    padding: '6px 12px',
                    fontSize: 12,
                    background: monthsRange === r.val ? 'var(--bg-surface)' : 'transparent',
                    color: monthsRange === r.val ? 'var(--text-primary)' : 'var(--text-muted)',
                    boxShadow: monthsRange === r.val ? 'var(--shadow-sm)' : 'none',
                    borderRadius: 'var(--radius-sm)',
                  }}
                  onClick={() => setMonthsRange(r.val)}
                >
                  {r.label}
                </button>
              ))}
            </div>
            {hasData && (
              <span className="badge badge-blue" style={{ fontSize: 11 }}>
                {report.period}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {hasData && (
              <>
                <button className="btn btn-secondary" onClick={handleDownloadCSV} title="Download historical CSV report">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Export CSV
                </button>
                <button className="btn btn-secondary" onClick={handlePrint} title="Print or save PDF">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" />
                  </svg>
                  Print Report
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="card" style={{ backgroundColor: 'var(--red-muted)', borderColor: 'var(--red-border)', marginBottom: 20 }}>
          <p style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="card" style={{ padding: 24 }}>
          <SkeletonLoader lines={8} />
        </div>
      ) : !hasData ? (
        /* Empty State */
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div
            className="empty-state-icon"
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: 'var(--accent-muted)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
            No Historical Data Yet
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 460, margin: '0 auto 24px' }}>
            Historical reporting requires transaction records across multiple months. You can record transactions in the Transactions tab or populate 6 months of demo financial history right now.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={handleSeedDemoData}>
              Load Demo 6-Month Indian Data
            </button>
            <Link to="/transactions" className="btn btn-secondary">
              Go to Transactions →
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Top KPI Metrics Row */}
          <section style={{ marginBottom: 24 }}>
            <div className="grid-4">
              <MetricCard
                label="Avg Monthly Income"
                value={formatRupee(summary.avg_income)}
                sub={`${report.months_analyzed} months analyzed`}
                status="blue"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                }
              />

              <MetricCard
                label="Avg Monthly Outflow"
                value={formatRupee(summary.avg_expenses + summary.avg_debt)}
                sub="Living expenses + debt"
                status="amber"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                    <polyline points="17 18 23 18 23 12" />
                  </svg>
                }
              />

              <MetricCard
                label="Avg Monthly Surplus"
                value={formatRupee(Math.abs(summary.avg_surplus))}
                sub={summary.avg_surplus >= 0 ? 'Net monthly savings capability' : 'Monthly shortfall'}
                status={summary.avg_surplus >= 0 ? 'green' : 'red'}
                badge={summary.avg_surplus >= 0 ? 'Surplus' : 'Deficit'}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                }
              />

              <MetricCard
                label="Health Score"
                value={`${summary.financial_health_score} / 100`}
                sub={`Overall rating: ${summary.health_rating}`}
                status={summary.financial_health_score >= 80 ? 'green' : summary.financial_health_score >= 60 ? 'amber' : 'red'}
                badge={summary.health_rating}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                }
              />
            </div>
          </section>

          {/* Visual Trend Charts Grid */}
          <div className="grid-2" style={{ marginBottom: 24 }}>
            {/* Cash Flow Velocity Chart */}
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Monthly Cash Flow Velocity
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Inflow (Income) vs Outflow (Expenses + Debt) vs Net Surplus
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11, fontWeight: 500 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--accent)' }} /> Inflow
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--amber)' }} /> Outflow
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--green)' }} /> Surplus
                  </span>
                </div>
              </div>

              {/* Chart Bars */}
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 190, paddingTop: 20, borderBottom: '1px solid var(--border)', gap: 8 }}>
                {trends.map((t) => {
                  const incHeight = Math.max(10, Math.round((t.income / maxCashFlow) * 160));
                  const outHeight = Math.max(10, Math.round((t.total_outflow / maxCashFlow) * 160));
                  const surHeight = Math.max(6, Math.round((Math.max(0, t.surplus) / maxCashFlow) * 160));

                  return (
                    <div key={t.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, width: '100%', justifyContent: 'center' }}>
                        {/* Income bar */}
                        <div
                          className="report-bar"
                          title={`Inflow: ${formatRupee(t.income)}`}
                          style={{
                            width: '28%',
                            maxWidth: 16,
                            height: `${incHeight}px`,
                            backgroundColor: 'var(--accent)',
                            borderRadius: '3px 3px 0 0',
                            transition: 'height 400ms ease',
                          }}
                        />
                        {/* Outflow bar */}
                        <div
                          className="report-bar"
                          title={`Outflow: ${formatRupee(t.total_outflow)}`}
                          style={{
                            width: '28%',
                            maxWidth: 16,
                            height: `${outHeight}px`,
                            backgroundColor: 'var(--amber)',
                            borderRadius: '3px 3px 0 0',
                            transition: 'height 400ms ease',
                          }}
                        />
                        {/* Surplus bar */}
                        <div
                          className="report-bar"
                          title={`Surplus: ${formatRupee(t.surplus)}`}
                          style={{
                            width: '28%',
                            maxWidth: 16,
                            height: `${surHeight}px`,
                            backgroundColor: t.surplus >= 0 ? 'var(--green)' : 'var(--red)',
                            borderRadius: '3px 3px 0 0',
                            transition: 'height 400ms ease',
                          }}
                        />
                      </div>
                      <span className="num" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {t.label.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Savings Rate Progression */}
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Savings Rate Progression
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Target benchmark: 20% of monthly income
                  </p>
                </div>
                <span className="badge badge-green">
                  Avg: {formatPercent(summary.avg_savings_rate)}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {trends.map((t) => (
                  <div key={t.month}>
                    <div className="flex justify-between items-center mb-1">
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                        {t.label}
                      </span>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }} className="num">
                          {formatRupee(t.savings)} saved
                        </span>
                        <span
                          className="num"
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: t.savings_rate >= 20 ? 'var(--green)' : t.savings_rate >= 10 ? 'var(--amber)' : 'var(--red)',
                          }}
                        >
                          {t.savings_rate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    {/* Track */}
                    <div style={{ height: 8, backgroundColor: 'var(--bg-raised)', borderRadius: 4, overflow: 'hidden' }}>
                      <div
                        className="report-progress-fill"
                        style={{
                          height: '100%',
                          width: `${Math.min(100, Math.max(5, (t.savings_rate / 30) * 100))}%`,
                          backgroundColor: t.savings_rate >= 20 ? 'var(--green)' : t.savings_rate >= 10 ? 'var(--amber)' : 'var(--red)',
                          borderRadius: 4,
                          transition: 'width 400ms ease',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Spending Categories & Insights */}
          <div className="grid-main" style={{ marginBottom: 24 }}>
            {/* Top Categories Distribution */}
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                Major Expenditure Drivers
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                Categorical breakdown of living expenses across the period
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {(report.top_categories || []).map((c) => (
                  <div key={c.category}>
                    <div className="flex justify-between items-center mb-1">
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {c.category}
                      </span>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }} className="num">
                          {c.percentage}% of total
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }} className="num">
                          {formatRupee(c.total)}
                        </span>
                      </div>
                    </div>
                    <div style={{ height: 6, backgroundColor: 'var(--bg-raised)', borderRadius: 3, overflow: 'hidden' }}>
                      <div
                        className="report-progress-fill"
                        style={{
                          height: '100%',
                          width: `${c.percentage}%`,
                          backgroundColor: 'var(--accent)',
                          borderRadius: 3,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Health Observations */}
            <div className="card" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)', borderColor: 'var(--accent-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span className="badge badge-blue">Deterministic Observations</span>
              </div>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
                Financial Health Summary
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {(report.insights || []).map((insight, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--accent)', fontWeight: 700, marginTop: 1 }}>•</span>
                    <span>{insight}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px dashed var(--accent-border)' }}>
                <Link to="/what-if" className="btn btn-outline" style={{ width: '100%', fontSize: 12 }}>
                  Simulate Next Month in What-If →
                </Link>
              </div>
            </div>
          </div>

          {/* Monthly Financial Statements Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                Monthly Financial Statement Ledger
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Aggregated cash flows, debt obligations, and savings performance by month
              </p>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th className="text-right">Inflow (Salary)</th>
                    <th className="text-right">Living Expenses</th>
                    <th className="text-right">Debt EMI</th>
                    <th className="text-right">Savings (SIP)</th>
                    <th className="text-right">Net Surplus</th>
                    <th className="text-right">Savings Rate</th>
                    <th className="text-right">MoM Growth</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {trends.map((t) => (
                    <tr key={t.month}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.label}</td>
                      <td className="text-right num" style={{ color: 'var(--text-primary)' }}>
                        {formatRupee(t.income)}
                      </td>
                      <td className="text-right num" style={{ color: 'var(--text-primary)' }}>
                        {formatRupee(t.expenses)}
                      </td>
                      <td className="text-right num" style={{ color: 'var(--amber)' }}>
                        {formatRupee(t.debt)}
                      </td>
                      <td className="text-right num" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                        {formatRupee(t.savings)}
                      </td>
                      <td
                        className="text-right num"
                        style={{
                          fontWeight: 700,
                          color: t.surplus >= 0 ? 'var(--green)' : 'var(--red)',
                        }}
                      >
                        {formatRupee(t.surplus)}
                      </td>
                      <td className="text-right num" style={{ fontWeight: 600 }}>
                        {t.savings_rate.toFixed(1)}%
                      </td>
                      <td
                        className="text-right num"
                        style={{
                          color:
                            t.mom_expense_growth === 0
                              ? 'var(--text-muted)'
                              : t.mom_expense_growth < 0
                              ? 'var(--green)'
                              : 'var(--red)',
                        }}
                      >
                        {t.mom_expense_growth === 0
                          ? '—'
                          : `${t.mom_expense_growth > 0 ? '+' : ''}${t.mom_expense_growth}%`}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${t.status === 'surplus' ? 'badge-green' : 'badge-red'}`}>
                          {t.status === 'surplus' ? 'Surplus' : 'Deficit'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
