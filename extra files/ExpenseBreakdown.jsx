import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
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

// Coordinated indigo → blue palette (matches --accent / --accent-2)
const COLORS = ['#4c3fc7', '#6c5ce7', '#7d70eb', '#4c6fff', '#7d93ff', '#a6b4ff', '#c8d1ff', '#e4e9ff'];

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

  if (rows.length === 0) {
    return (
      <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
        No expense details provided yet.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Donut Chart */}
      <div style={{ height: 180, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={rows}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              stroke="none"
              isAnimationActive={true}
              animationDuration={700}
            >
              {rows.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => formatRupee(value)}
              contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px', boxShadow: 'var(--shadow-sm)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend / List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 6, borderTop: '1px solid var(--border-subtle)' }}>
        {rows.map((row, index) => {
          const pct = total > 0 ? row.value / total : 0;
          const color = COLORS[index % COLORS.length];

          return (
            <div key={row.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: color }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{row.label}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right' }}>
                {formatRupee(row.value)}
                <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: 11, fontWeight: 400 }}>
                  {total > 0 ? formatPercent(pct) : ''}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
