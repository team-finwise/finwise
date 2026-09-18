import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ComparisonTable from '../components/ComparisonTable';
import useStore from '../store/useStore';
import { whatIf } from '../lib/api';
import { formatRupee, formatDelta } from '../lib/formatters';
import AnimatedNumber from '../components/AnimatedNumber';

const SLIDER_CONFIG = [
  { key: 'incomeDelta', label: 'Monthly Income', min: -20000, max: 50000, step: 500, positive: true },
  { key: 'housingDelta', label: 'Housing (rent/EMI)', min: -10000, max: 20000, step: 500, positive: false },
  { key: 'foodDelta', label: 'Food & Groceries', min: -5000, max: 10000, step: 500, positive: false },
  { key: 'transportationDelta', label: 'Transportation', min: -5000, max: 10000, step: 500, positive: false },
  { key: 'educationDelta', label: 'Education', min: -5000, max: 10000, step: 500, positive: false },
  { key: 'healthcareDelta', label: 'Healthcare', min: -2000, max: 5000, step: 500, positive: false },
  { key: 'entertainmentDelta', label: 'Entertainment', min: -2000, max: 5000, step: 500, positive: false },
  { key: 'subscriptionsDelta', label: 'Subscriptions', min: -2000, max: 5000, step: 500, positive: false },
  { key: 'otherDelta', label: 'Other Expenses', min: -5000, max: 10000, step: 500, positive: false },
  { key: 'savingsContributionDelta', label: 'Savings Contribution', min: -10000, max: 30000, step: 500, positive: true },
];

const defaultDeltas = Object.fromEntries(SLIDER_CONFIG.map((s) => [s.key, 0]));

export default function WhatIf() {
  const { results } = useStore();
  const navigate = useNavigate();
  const [deltas, setDeltas] = useState(defaultDeltas);
  const [comparison, setComparison] = useState(null);

  useEffect(() => {
    if (!results) navigate('/');
  }, [results, navigate]);

  // Recalculate whenever deltas change
  const recalculate = useCallback(async () => {
    if (!results) return;
    try {
      const data = await whatIf(results.profile, {
        incomeDelta: deltas.incomeDelta,
        housingDelta: deltas.housingDelta,
        foodDelta: deltas.foodDelta,
        transportationDelta: deltas.transportationDelta,
        educationDelta: deltas.educationDelta,
        healthcareDelta: deltas.healthcareDelta,
        entertainmentDelta: deltas.entertainmentDelta,
        subscriptionsDelta: deltas.subscriptionsDelta,
        otherDelta: deltas.otherDelta,
        debtPaymentDelta: 0,
        savingsContributionDelta: deltas.savingsContributionDelta,
      });
      setComparison(data);
    } catch (e) {
      console.error(e);
    }
  }, [deltas, results]);

  useEffect(() => {
    recalculate();
  }, [recalculate]);

  if (!results) return null;

  function handleSliderChange(key, value) {
    setDeltas((prev) => ({ ...prev, [key]: Number(value) }));
  }

  function handleReset() {
    setDeltas(defaultDeltas);
  }

  const anyChanged = Object.values(deltas).some((v) => v !== 0);

  function deltaColor(key, value) {
    if (value === 0) return 'var(--text-muted)';
    const config = SLIDER_CONFIG.find((s) => s.key === key);
    if (!config) return 'var(--text-muted)';
    const isImprovement = config.positive ? value > 0 : value < 0;
    return isImprovement ? 'var(--green)' : 'var(--red)';
  }

  return (
    <Layout
      title="What-If Scenario Simulator"
      subtitle="Simulate changes in income, expenses, or savings to evaluate cash flow impact"
    >
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Sliders Panel */}
        <div>
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="card-title">Adjust Variables</h3>
              {anyChanged && (
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: 11, padding: '4px 8px' }}
                  onClick={handleReset}
                >
                  Reset All
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {SLIDER_CONFIG.map((config) => {
                const val = deltas[config.key];
                return (
                  <div key={config.key} className="slider-container">
                    <div className="slider-header">
                      <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{config.label}</span>
                      <span className="num" style={{ fontWeight: 600, color: deltaColor(config.key, val) }}>
                        {val === 0 ? 'No change' : formatDelta(val)}
                      </span>
                    </div>

                    <input
                      type="range"
                      min={config.min}
                      max={config.max}
                      step={config.step}
                      value={val}
                      onChange={(e) => handleSliderChange(config.key, e.target.value)}
                      aria-label={`Adjust ${config.label}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {anyChanged && (
            <div
              className="card mt-4"
              style={{
                backgroundColor: comparison?.surplusChange >= 0 ? 'var(--green-muted)' : 'var(--red-muted)',
                borderColor: comparison?.surplusChange >= 0 ? 'var(--green-border)' : 'var(--red-border)',
              }}
            >
              <div className="card-label">Net Surplus Impact</div>
              <div
                className="card-value num"
                style={{
                  color: comparison?.surplusChange >= 0 ? 'var(--green-hover)' : 'var(--red-hover)',
                  fontSize: 22,
                  transition: 'color 300ms ease',
                }}
              >
                {comparison ? (
                  <AnimatedNumber value={comparison.surplusChange} format={formatDelta} />
                ) : '—'}
              </div>
              <div className="card-sub mt-1">Monthly difference vs current baseline</div>
            </div>
          )}
        </div>

        {/* Comparison Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <h3 className="card-title mb-3">Projected Financial Impact</h3>
            {comparison ? (
              <ComparisonTable
                current={comparison.current}
                projected={comparison.projected}
              />
            ) : (
              <div className="card">
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Move the sliders on the left to see instant financial projections.
                </p>
              </div>
            )}
          </div>

          {comparison && anyChanged && (
            <div className="card">
              <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
                Active Scenario Modifications
              </h4>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th className="text-right">Adjustment</th>
                  </tr>
                </thead>
                <tbody>
                  {SLIDER_CONFIG.filter((s) => deltas[s.key] !== 0).map((s) => (
                    <tr key={s.key}>
                      <td style={{ fontWeight: 500 }}>{s.label}</td>
                      <td
                        className="text-right num"
                        style={{ color: deltaColor(s.key, deltas[s.key]), fontWeight: 600 }}
                      >
                        {formatDelta(deltas[s.key])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
