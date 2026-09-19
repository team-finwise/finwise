import { formatPercent, formatRupee } from '../lib/formatters';

/**
 * AIInsightCard
 *
 * Generates clear, data-grounded financial observations from user calculations.
 * Shows observations, financial rationale, and actionable next steps.
 *
 * Props:
 *   results — object containing snapshot & goal calculations
 *   profile — object containing user profile inputs
 */
export default function AIInsightCard({ results, profile }) {
  if (!results) {
    return (
      <div className="ai-insight-card">
        <div className="ai-insight-header">
          <span className="ai-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            Financial Insights
          </span>
        </div>
        <p className="ai-insight-body ai-insight-reveal">
          Complete your financial profile to receive personalized observations about your savings, debt ratio, and cash flow.
        </p>
      </div>
    );
  }

  const { snapshot, goalPlan } = results;
  const { savingsRate, debtToIncomeRatio, monthlySurplus, cashFlowStatus, totalMonthlyExpenses } = snapshot;

  // Determine top insight
  let title = "Solid Financial Health";
  let observation = "";
  let rationale = "";
  let recommendation = "";
  let badgeColor = "blue";

  if (cashFlowStatus === 'deficit') {
    title = "Monthly Deficit Detected";
    observation = `You are spending ${formatRupee(Math.abs(monthlySurplus))} more than your monthly income.`;
    rationale = "Operating at a monthly deficit consumes existing savings and risks high-interest debt accumulation over time.";
    recommendation = "Review discretionary categories like entertainment or dining out to restore positive monthly cash flow.";
    badgeColor = "red";
  } else if (debtToIncomeRatio > 0.4) {
    title = "Elevated Debt Load";
    observation = `Debt obligations consume ${formatPercent(debtToIncomeRatio)} of your monthly gross income (recommended ceiling: 36%).`;
    rationale = "A high debt-to-income ratio limits your cash flow flexibility and increases vulnerability to income disruptions.";
    recommendation = "Prioritize paying down high-interest liabilities or explore debt consolidation options.";
    badgeColor = "amber";
  } else if (savingsRate < 0.15) {
    title = "Low Savings Rate";
    observation = `Your current savings rate is ${formatPercent(savingsRate)}. Financial planners recommend targeting 15–20%.`;
    rationale = "A low savings rate delays building an adequate 3–6 month emergency reserve and slows progress toward long-term goals.";
    recommendation = "Automate a monthly transfer of even 5% extra into a high-yield savings account right after income arrival.";
    badgeColor = "amber";
  } else {
    title = "Healthy Cash Flow Structure";
    observation = `Your monthly surplus is ${formatRupee(monthlySurplus)} with a strong ${formatPercent(savingsRate)} savings rate.`;
    rationale = "Maintaining a debt ratio under 36% and saving above 15% provides strong buffer against unexpected expenses.";
    recommendation = goalPlan?.monthsRemaining
      ? `Allocate surplus regularly toward your ${goalPlan.name || 'financial'} goal to remain on track.`
      : "Consider investing excess surplus into index funds or an emergency fund if you haven't already.";
    badgeColor = "green";
  }

  // Find largest expense category if available
  let largestExpenseCategory = null;
  let largestExpenseAmount = 0;
  if (profile?.expenses) {
    Object.entries(profile.expenses).forEach(([cat, amt]) => {
      const num = Number(amt) || 0;
      if (num > largestExpenseAmount) {
        largestExpenseAmount = num;
        largestExpenseCategory = cat;
      }
    });
  }

  return (
    <div className="ai-insight-card">
      <div className="ai-insight-header">
        <span className={`ai-badge`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          AI Financial Observation
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginLeft: 'auto' }}>
          {title}
        </span>
      </div>

      <div className="ai-insight-body ai-insight-reveal">
        <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{observation}</p>
      </div>

      <div className="ai-insight-section ai-insight-reveal">
        <div className="ai-insight-subtitle">Why This Matters</div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{rationale}</p>
      </div>

      <div className="ai-insight-section ai-insight-reveal">
        <div className="ai-insight-subtitle">Suggested Action</div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
          {recommendation}
        </p>
      </div>

      {largestExpenseCategory && totalMonthlyExpenses > 0 && (
        <div className="ai-insight-section ai-insight-reveal">
          <div className="ai-insight-subtitle">Spending Insight</div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Largest expense: <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{largestExpenseCategory}</strong> ({formatRupee(largestExpenseAmount)} / {formatPercent(largestExpenseAmount / totalMonthlyExpenses)} of monthly spending).
          </p>
        </div>
      )}
    </div>
  );
}
