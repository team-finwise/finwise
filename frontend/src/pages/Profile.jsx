import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import StepIndicator from '../components/StepIndicator';
import useStore from '../store/useStore';
import { analyze } from '../lib/api';

function Field({ label, id, required, hint, children }) {
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>
        <span>
          {label}
          {required && <span style={{ color: 'var(--red)', marginLeft: 4 }}>*</span>}
        </span>
      </label>
      {children}
      {hint && <span className="form-hint">{hint}</span>}
    </div>
  );
}

function RupeeInput({ id, value, onChange, placeholder, min = 0 }) {
  return (
    <div className="input-wrapper">
      <span className="input-prefix">₹</span>
      <input
        id={id}
        className="form-input has-prefix num"
        type="number"
        min={min}
        step="500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || '0'}
      />
    </div>
  );
}

/* ── Step 1: Income ────────────────────────────────── */
function Step1({ onNext }) {
  const { profile, setProfile, userName, setUserName } = useStore();
  const [error, setError] = useState('');

  function handleNext() {
    if (!profile.income || Number(profile.income) <= 0) {
      setError('Monthly income is required and must be greater than zero.');
      return;
    }
    setError('');
    onNext();
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Monthly Take-Home Income
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Enter your net monthly earnings after tax.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Your Name (Optional)" id="userName" hint="Used to personalize your dashboard greeting">
            <input
              id="userName"
              className="form-input"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g. Alex"
              maxLength={40}
            />
          </Field>

          <Field label="Monthly Take-Home Income" id="income" required hint="Total net monthly income from salary, business, or investments">
            <RupeeInput
              id="income"
              value={profile.income}
              onChange={(v) => setProfile({ income: v })}
              placeholder="60000"
            />
          </Field>
        </div>

        {error && (
          <p style={{ color: 'var(--red)', fontSize: 13, marginTop: 12, fontWeight: 500 }}>
            {error}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={handleNext}>
          Continue to Expenses →
        </button>
      </div>
    </div>
  );
}

/* ── Step 2: Expenses ────────────────────────────── */
const EXPENSE_FIELDS = [
  { key: 'housing', label: 'Housing (rent / EMI)', hint: 'Rent or home EMI' },
  { key: 'food', label: 'Food & Groceries', hint: 'Groceries, dining out' },
  { key: 'transportation', label: 'Transportation', hint: 'Fuel, transit, cabs' },
  { key: 'education', label: 'Education', hint: 'Tuition, courses, books' },
  { key: 'healthcare', label: 'Healthcare', hint: 'Insurance, meds, care' },
  { key: 'entertainment', label: 'Entertainment', hint: 'Movies, hobbies, events' },
  { key: 'subscriptions', label: 'Subscriptions', hint: 'Streaming, apps' },
  { key: 'other', label: 'Other Expenses', hint: 'Miscellaneous' },
];

function Step2({ onNext, onBack }) {
  const { profile, setExpense } = useStore();

  const totalExpenses = Object.values(profile.expenses).reduce(
    (sum, v) => sum + (Number(v) || 0), 0
  );

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Monthly Living Expenses
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Enter your average monthly spending across categories. Leave blank if not applicable.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {EXPENSE_FIELDS.map((field) => (
            <Field key={field.key} label={field.label} id={field.key} hint={field.hint}>
              <RupeeInput
                id={field.key}
                value={profile.expenses[field.key]}
                onChange={(v) => setExpense(field.key, v)}
              />
            </Field>
          ))}
        </div>

        <div style={{ marginTop: 16, pt: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
            Total Monthly Living Expenses
          </span>
          <span className="num" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
            ₹{totalExpenses.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button className="btn btn-secondary" onClick={onBack}>
          ← Back
        </button>
        <button className="btn btn-primary" onClick={onNext}>
          Continue to Savings & Debt →
        </button>
      </div>
    </div>
  );
}

/* ── Step 3: Savings & Debt ─────────────────────── */
function Step3({ onNext, onBack }) {
  const { profile, setProfile } = useStore();
  const [error, setError] = useState('');

  function handleNext() {
    if (profile.savingsContribution === '' || profile.savingsContribution === null) {
      setError('Please enter your monthly savings contribution (enter 0 if none).');
      return;
    }
    setError('');
    onNext();
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Savings & Debt Payments
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Specify your monthly savings transfers and active debt payments.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field
            label="Monthly Savings Contribution"
            id="savings"
            required
            hint="Amount you transfer into savings, FDs, RDs, or investments each month"
          >
            <RupeeInput
              id="savings"
              value={profile.savingsContribution}
              onChange={(v) => setProfile({ savingsContribution: v })}
              placeholder="10000"
            />
          </Field>

          <Field
            label="Monthly Debt Payment"
            id="debt"
            hint="Total monthly EMIs for loans, credit cards, or car payments"
          >
            <RupeeInput
              id="debt"
              value={profile.debtPayment}
              onChange={(v) => setProfile({ debtPayment: v })}
              placeholder="5000"
            />
          </Field>
        </div>

        {error && (
          <p style={{ color: 'var(--red)', fontSize: 13, marginTop: 12, fontWeight: 500 }}>
            {error}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button className="btn btn-secondary" onClick={onBack}>
          ← Back
        </button>
        <button className="btn btn-primary" onClick={handleNext}>
          Continue to Financial Goal →
        </button>
      </div>
    </div>
  );
}

/* ── Step 4: Goal ────────────────────────────────── */
function Step4({ onSubmit, onBack, loading }) {
  const { goal, setGoal } = useStore();
  const [error, setError] = useState('');

  function handleSubmit() {
    if (!goal.name.trim()) {
      setError('Please enter a name for your financial goal.');
      return;
    }
    if (!goal.targetAmount || Number(goal.targetAmount) <= 0) {
      setError('Please enter a valid target amount.');
      return;
    }
    if (!goal.targetDate) {
      setError('Please select a target completion date.');
      return;
    }
    if (new Date(goal.targetDate) <= new Date()) {
      setError('Target date must be in the future.');
      return;
    }
    setError('');
    onSubmit();
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Define Primary Goal
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Specify the major financial objective you want to plan toward.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Goal Name" id="goalName" required hint='e.g. "Emergency Reserve", "House Down Payment"'>
            <input
              id="goalName"
              className="form-input"
              type="text"
              value={goal.name}
              onChange={(e) => setGoal({ name: e.target.value })}
              placeholder="Emergency Reserve"
              maxLength={60}
            />
          </Field>

          <Field label="Target Amount" id="targetAmount" required>
            <RupeeInput
              id="targetAmount"
              value={goal.targetAmount}
              onChange={(v) => setGoal({ targetAmount: v })}
              placeholder="150000"
            />
          </Field>

          <Field label="Amount Already Saved" id="amountSaved" hint="Existing balance saved specifically toward this goal">
            <RupeeInput
              id="amountSaved"
              value={goal.amountSaved}
              onChange={(v) => setGoal({ amountSaved: v })}
              placeholder="0"
            />
          </Field>

          <Field label="Target Date" id="targetDate" required hint="When do you want to reach this target?">
            <input
              id="targetDate"
              className="form-input"
              type="date"
              value={goal.targetDate}
              min={today}
              onChange={(e) => setGoal({ targetDate: e.target.value })}
            />
          </Field>
        </div>

        {error && (
          <p style={{ color: 'var(--red)', fontSize: 13, marginTop: 12, fontWeight: 500 }}>
            {error}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button className="btn btn-secondary" onClick={onBack} disabled={loading}>
          ← Back
        </button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Calculating Profile...' : 'Analyze Finances & Open Dashboard'}
        </button>
      </div>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────── */
export default function Profile() {
  const { formStep, setFormStep, setResults, profile, goal } = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    try {
      const numericProfile = {
        income: Number(profile.income),
        expenses: Object.fromEntries(
          Object.entries(profile.expenses).map(([k, v]) => [k, Number(v) || 0])
        ),
        debtPayment: Number(profile.debtPayment) || 0,
        savingsContribution: Number(profile.savingsContribution) || 0,
      };
      const numericGoal = {
        name: goal.name,
        targetAmount: Number(goal.targetAmount),
        amountSaved: Number(goal.amountSaved) || 0,
        targetDate: goal.targetDate,
      };

      const results = await analyze(numericProfile, numericGoal);
      setResults({ ...results, goal: numericGoal, profile: numericProfile });
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const stepTitles = ['Income', 'Expenses', 'Savings & Debt', 'Goal'];

  return (
    <Layout
      title="A clearer picture of your money."
      subtitle="Set up your Finwise profile in a few thoughtful steps. Your information stays in this browser session."
    >
      <div className="profile-layout">
        <section className="profile-form-panel">
          <div className="setup-kicker"><span>01</span> Your personal money map</div>
          <div className="setup-progress-label">Step {formStep} of 4 <b>{stepTitles[formStep - 1]}</b></div>
          <StepIndicator current={formStep} />

          {formStep === 1 && <Step1 onNext={() => setFormStep(2)} />}
          {formStep === 2 && (
            <Step2 onNext={() => setFormStep(3)} onBack={() => setFormStep(1)} />
          )}
          {formStep === 3 && (
            <Step3 onNext={() => setFormStep(4)} onBack={() => setFormStep(2)} />
          )}
          {formStep === 4 && (
            <Step4
              onSubmit={handleSubmit}
              onBack={() => setFormStep(3)}
              loading={loading}
            />
          )}
        </section>

        <aside className="profile-visual" aria-label="Financial planning preview">
          <div className="visual-orbit orbit-one" />
          <div className="visual-orbit orbit-two" />
          <div className="visual-summary-card">
            <span className="visual-label">YOUR NEXT CHAPTER</span>
            <strong>Small choices.<br />A complete view.</strong>
            <p>Bring income, spending, savings, and your next big goal into focus.</p>
            <div className="visual-progress"><i /></div>
            <div className="visual-stat-row"><span>Financial confidence</span><b>Building</b></div>
          </div>
          <div className="visual-mini-card visual-income"><span>Monthly view</span><strong>One place</strong><i>↗</i></div>
          <div className="visual-mini-card visual-goal"><span>Personal goal</span><strong>Made possible</strong><i>◎</i></div>
        </aside>
      </div>
    </Layout>
  );
}
