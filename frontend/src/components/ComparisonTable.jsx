import { formatRupee, formatPercent, formatDelta } from '../lib/formatters';
import AnimatedNumber from './AnimatedNumber';

const ROWS = [
  { key: 'totalMonthlyExpenses', label: 'Total Monthly Expenses', format: formatRupee },
  { key: 'monthlySurplus', label: 'Monthly Surplus / Deficit', format: formatRupee, signed: true },
  { key: 'savingsRate', label: 'Savings Rate', format: formatPercent },
  { key: 'surplusRate', label: 'Surplus Rate', format: formatPercent },
  { key: 'debtToIncomeRatio', label: 'Debt-to-Income Ratio', format: formatPercent },
];

/**
 * ComparisonTable
 *
 * Props:
 *   current   — snapshot object
 *   projected — snapshot object
 */
export default function ComparisonTable({ current, projected }) {
  if (!current || !projected) return null;

  return (
    <div style={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Metric</th>
            <th className="text-right">Current Baseline</th>
            <th className="text-right">Simulated Scenario</th>
            <th className="text-right">Net Change</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => {
            const cur = current[row.key];
            const pro = projected[row.key];
            const delta = typeof cur === 'number' && typeof pro === 'number'
              ? pro - cur
              : 0;

            let deltaColor = 'var(--text-muted)';
            if (delta !== 0) {
              const upIsGood = row.key !== 'totalMonthlyExpenses' && row.key !== 'debtToIncomeRatio';
              deltaColor = (delta > 0) === upIsGood ? 'var(--green)' : 'var(--red)';
            }

            return (
              <tr key={row.key}>
                <td style={{ fontWeight: 500 }}>{row.label}</td>
                <td className="text-right num" style={{ color: 'var(--text-secondary)' }}>
                  {cur !== null && cur !== undefined ? row.format(cur) : '—'}
                </td>
                <td className="text-right num" style={{ fontWeight: 600 }}>
                  {pro !== null && pro !== undefined ? (
                    <AnimatedNumber value={pro} format={row.format} />
                  ) : '—'}
                </td>
                <td
                  className="text-right num"
                  style={{ color: deltaColor, fontWeight: 600, transition: 'color 300ms ease' }}
                >
                  {delta === 0 ? '—' : (
                    <AnimatedNumber
                      value={delta}
                      format={(d) => `${d > 0 ? '+' : ''}${row.format(d)}`}
                    />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
