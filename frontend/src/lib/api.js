/**
 * FINWISE API Client
 *
 * Calls the FastAPI backend (http://localhost:8000).
 * If the backend is not running, falls back gracefully.
 */

import {
  calculateFinancialSnapshot,
  calculateGoalPlan,
  calculateGoalProgress,
  calculateWhatIf,
} from './calculations.js';

const API_BASE_URL = 'http://localhost:8000';

function buildProfile(profile) {
  return {
    income: profile.income,
    housing: profile.expenses?.housing || 0,
    food: profile.expenses?.food || 0,
    transportation: profile.expenses?.transportation || 0,
    education: profile.expenses?.education || 0,
    healthcare: profile.expenses?.healthcare || 0,
    entertainment: profile.expenses?.entertainment || 0,
    subscriptions: profile.expenses?.subscriptions || 0,
    other: profile.expenses?.other || 0,
    debtPayment: profile.debtPayment || 0,
    savingsContribution: profile.savingsContribution || 0,
  };
}

/**
 * Check backend health status.
 */
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) return { online: false };
    const data = await res.json();
    return { online: true, ...data };
  } catch (err) {
    return { online: false, error: err.message };
  }
}

/**
 * Send chat prompt to Strands AI Agent via FastAPI backend.
 */
export async function sendChatMessage(message, profile = null, goal = null) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, profile, goal }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `Server error: ${res.status}`);
    }

    const data = await res.json();
    return data.response;
  } catch (err) {
    console.error('API Chat Error:', err);
    throw err;
  }
}

/**
 * Analyze a user's financial profile.
 */
export async function analyze(profile, goal) {
  // Use calculation engine directly
  const p = buildProfile(profile);
  const snapshot = calculateFinancialSnapshot(p);
  const progress = calculateGoalProgress({
    targetAmount: goal.targetAmount,
    amountSaved: goal.amountSaved,
  });
  const plan = calculateGoalPlan({
    targetAmount: goal.targetAmount,
    amountSaved: goal.amountSaved,
    monthlySavings: profile.savingsContribution,
    targetDate: goal.targetDate,
  });

  return { snapshot, progress, plan };
}

/**
 * Run a what-if scenario.
 */
export async function whatIf(profile, deltas) {
  const p = buildProfile(profile);
  return calculateWhatIf({ ...p, ...deltas });
}
