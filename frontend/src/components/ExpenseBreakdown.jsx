import { formatRupee, formatPercent } from '../lib/formatters';

const EXPENSE_LABELS = {
  housing: 'Housing',
  food: 'Food',
  transportation: 'Transportation',
  education: 'Education',
  healthcare: 'Healthcare',
  entertainment: 'Entertainment',
  subscriptions: 'Subscriptions',
  other: 'Other',
  debtPayment: 'Debt Payments',
};

/**
 * ExpenseBreakdown
 *
 * Props:
 *   expenses     — object { housing, food, ... }
 *   debtPayment  — number
 *   total        — number (total expenses for percentage calculation)
 */
export default function ExpenseBreakdown({ expenses = {}, debtPayment = 0, total = 0 }) {
  const rows = [
    ...Object.entries(expenses).map(([key, value]) => ({
      key,
      label: EXPENSE_LABELS[key] || key,
      value: Number(value) || 0,
    })),
    { key: 'debtPayment', label: 'Debt Payments', value: Number(debtPayment) || 0 },
  ].filter((r) => r.value > 0);

  // Sort descending by value
  rows.sort((a, b) => b.value - a.value);

  const maxValue = rows[0]?.value || 1;

  if (rows.length === 0) {
    return (
      <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
        No expense details provided yet.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {rows.map((row) => {
        const pct = total > 0 ? row.value / total : 0;
        return (
          <div key={row.key} className="expense-row">
            <div className="expense-row-label">{row.label}</div>
            <div className="expense-bar-bg">
              <div
                className="expense-bar-fill"
                style={{ width: `${(row.value / maxValue) * 100}%` }}
              />
            </div>
            <div className="expense-row-amount">
              {formatRupee(row.value)}
              <span style={{ color: 'var(--text-muted)', marginLeft: 6, fontSize: 11, fontWeight: 400 }}>
                {total > 0 ? formatPercent(pct) : ''}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
