import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import MetricCard from '../components/MetricCard';
import ProgressBar from '../components/ProgressBar';
import ExpenseBreakdown from '../components/ExpenseBreakdown';
import AIInsightCard from '../components/AIInsightCard';
import useStore from '../store/useStore';
import {
  formatRupee,
  formatPercent,
  formatMonths,
  formatDate,
  rateStatus,
} from '../lib/formatters';

export default function Dashboard() {
  const { results, userName } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!results) navigate('/');
  }, [results, navigate]);

  if (!results) return null;

  const { snapshot, progress, plan, goal, profile } = results;

  const surplusStatus = snapshot.cashFlowStatus === 'surplus' ? 'green' : 'red';
  const savingsStatus = rateStatus(snapshot.savingsRate, 20, 10, true);
  const dtiStatus = rateStatus(snapshot.debtToIncomeRatio, 15, 35, false);

  const goalProgressColor =
    progress.progressPercentage >= 75
      ? 'green'
      : progress.progressPercentage >= 40
        ? 'blue'
        : 'amber';

  const greeting = userName?.trim() ? `Good morning, ${userName}` : 'Good morning';

  return (
    <Layout
      title="Financial Dashboard"
      subtitle="Real-time cash flow overview and goal tracking"
    >
      {/* Greeting Banner */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          {greeting}
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          Here is your personal financial health breakdown based on your active profile.
        </p>
      </div>

      {/* Primary Key Metrics */}
      <section style={{ marginBottom: 24 }}>
        <div className="grid-4">
          <MetricCard
            label="Monthly Income"
            value={formatRupee(profile.income)}
            sub="Gross monthly take-home"
            gradient="accent"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="5" width="20" height="14" rx="3" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            }
          />

          <MetricCard
            label="Total Expenses"
            value={formatRupee(snapshot.totalMonthlyExpenses)}
            sub="Living costs + debt payments"
            gradient="peach"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                <polyline points="17 18 23 18 23 12" />
              </svg>
            }
          />

          <MetricCard
            label="Monthly Surplus"
            value={formatRupee(Math.abs(snapshot.monthlySurplus))}
            sub={snapshot.cashFlowStatus === 'surplus' ? 'Net positive cash flow' : 'Monthly cash shortfall'}
            gradient={snapshot.cashFlowStatus === 'surplus' ? 'mint' : 'red'}
            badge={snapshot.cashFlowStatus === 'surplus' ? 'Surplus' : 'Deficit'}
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            }
          />

          <MetricCard
            label="Savings Rate"
            value={formatPercent(snapshot.savingsRate)}
            sub={`Goal target: ${formatRupee(profile.savingsContribution)}/mo`}
            gradient="sand"
            badge={savingsStatus === 'green' ? 'Healthy' : savingsStatus === 'amber' ? 'Moderate' : 'Low'}
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            }
          />
        </div>
      </section>

      {/* Main Two-Column Layout */}
      <div className="grid-main">
        {/* Left Column: Goal & Expenses */}
        <div className="flex flex-col gap-6">
          {/* Goal Card */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                  Goal: {goal.name}
                </h3>
                <p className="card-subtitle">
                  Target: {formatRupee(goal.targetAmount)} by {formatDate(goal.targetDate)}
                </p>
              </div>

              <span className="badge badge-blue">
                {formatPercent(progress.progressPercentage, 0)} complete
              </span>
            </div>

            <ProgressBar
              value={progress.progressPercentage}
              color={goalProgressColor}
              label={`Goal progress for ${goal.name}`}
            />

            <div className="grid-3 mt-4" style={{ pt: 12, borderTop: '1px solid var(--border-subtle)' }}>
              <div>
                <div className="card-label">Amount Saved</div>
                <div className="card-value" style={{ fontSize: 18 }}>
                  {formatRupee(goal.amountSaved)}
                </div>
              </div>

              <div>
                <div className="card-label">Required Saving</div>
                <div
                  className="card-value"
                  style={{
                    fontSize: 18,
                    color: plan.currentSavingSufficient ? 'var(--green)' : 'var(--red)',
                  }}
                >
                  {plan.requiredMonthlySaving !== null
                    ? formatRupee(plan.requiredMonthlySaving)
                    : 'Overdue'}
                </div>
              </div>

              <div>
                <div className="card-label">Time Remaining</div>
                <div className="card-value" style={{ fontSize: 18 }}>
                  {formatMonths(plan.monthsRemaining)}
                </div>
              </div>
            </div>

            {plan.currentSavingSufficient !== null && (
              <div
                style={{
                  marginTop: 16,
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: plan.currentSavingSufficient ? 'var(--green-muted)' : 'var(--red-muted)',
                  border: `1px solid ${plan.currentSavingSufficient ? 'var(--green-border)' : 'var(--red-border)'}`,
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: 'var(--text-secondary)',
                }}
              >
                {plan.currentSavingSufficient ? (
                  <span>
                    Your current savings rate of <strong>{formatRupee(profile.savingsContribution)}/mo</strong> is sufficient to reach this goal on schedule.
                  </span>
                ) : plan.requiredMonthlySaving !== null ? (
                  <span>
                    Shortfall: You need to save <strong>{formatRupee(plan.requiredMonthlySaving)}/mo</strong> to reach this target, which is <strong>{formatRupee(plan.requiredMonthlySaving - profile.savingsContribution)}/mo</strong> more than your current rate.
                  </span>
                ) : (
                  <span>The target date for this goal has passed. Please update your target date in settings.</span>
                )}
              </div>
            )}
          </div>

          {/* Expense Breakdown Card */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                    <path d="M22 12A10 10 0 0 0 12 2v10z" />
                  </svg>
                  Monthly Expense Breakdown
                </h3>
                <p className="card-subtitle">Category distribution of your spending</p>
              </div>
            </div>

            <ExpenseBreakdown
              expenses={profile.expenses}
              debtPayment={profile.debtPayment}
              total={snapshot.totalMonthlyExpenses}
            />
          </div>
        </div>

        {/* Right Column: AI Insights & Ratios */}
        <div className="flex flex-col gap-6">
          {/* AI Insight Card */}
          <AIInsightCard results={results} profile={profile} />

          {/* Key Ratios Card */}
          <div className="card">
            <h3 className="card-title mb-4">
              Financial Health Ratios
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Debt-to-Income (DTI)</span>
                  <span className="num" style={{ fontSize: 14, fontWeight: 600, color: dtiStatus === 'green' ? 'var(--green)' : dtiStatus === 'amber' ? 'var(--amber)' : 'var(--red)' }}>
                    {formatPercent(snapshot.debtToIncomeRatio)}
                  </span>
                </div>
                <ProgressBar
                  value={Math.min(snapshot.debtToIncomeRatio * 100, 100)}
                  color={dtiStatus === 'green' ? 'green' : dtiStatus === 'amber' ? 'amber' : 'red'}
                  label="DTI Ratio"
                />
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                  Recommended: below 36%
                </span>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Surplus Ratio</span>
                  <span className="num" style={{ fontSize: 14, fontWeight: 600, color: snapshot.surplusRate >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {formatPercent(snapshot.surplusRate)}
                  </span>
                </div>
                <ProgressBar
                  value={Math.max(Math.min(snapshot.surplusRate * 100, 100), 0)}
                  color={snapshot.surplusRate >= 0.15 ? 'green' : snapshot.surplusRate > 0 ? 'amber' : 'red'}
                  label="Surplus Rate"
                />
              </div>
            </div>
          </div>

          {/* Action Box: What-If Link */}
          <div className="card" style={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border)' }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              Simulate Scenarios
            </h4>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 14 }}>
              Test how income changes, expense reductions, or new debt affect your goal timeline and savings.
            </p>
            <Link to="/what-if" className="btn btn-outline" style={{ width: '100%' }}>
              Open What-If Simulator →
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
