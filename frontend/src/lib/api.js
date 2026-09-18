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

/* ─────────────────────────────────────────────
   Transactions API
   ──────────────────────────────────────────── */

export async function fetchTransactions(filters = {}) {
  const params = new URLSearchParams();
  if (filters.category) params.append('category', filters.category);
  if (filters.type) params.append('type', filters.type);
  if (filters.startDate) params.append('start_date', filters.startDate);
  if (filters.endDate) params.append('end_date', filters.endDate);
  if (filters.search) params.append('search', filters.search);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.offset) params.append('offset', filters.offset);

  const url = `${API_BASE_URL}/api/transactions?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch transactions (${res.status})`);
  return res.json();
}

export async function fetchTransactionSummary(startDate = null, endDate = null) {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);

  const url = `${API_BASE_URL}/api/transactions/summary?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch transaction summary (${res.status})`);
  return res.json();
}

export async function createTransaction(txData) {
  const res = await fetch(`${API_BASE_URL}/api/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(txData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to create transaction (${res.status})`);
  }
  return res.json();
}

export async function updateTransaction(id, txData) {
  const res = await fetch(`${API_BASE_URL}/api/transactions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(txData),
  });
  if (!res.ok) throw new Error(`Failed to update transaction (${res.status})`);
  return res.json();
}

export async function deleteTransaction(id) {
  const res = await fetch(`${API_BASE_URL}/api/transactions/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete transaction (${res.status})`);
  return res.json();
}

export async function seedSampleTransactions() {
  const res = await fetch(`${API_BASE_URL}/api/transactions/seed`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Failed to seed demo transactions (${res.status})`);
  return res.json();
}

export async function resetAllTransactions() {
  const res = await fetch(`${API_BASE_URL}/api/transactions/reset`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Failed to reset transactions (${res.status})`);
  return res.json();
}

export async function importBankStatement(csvText) {
  const res = await fetch(`${API_BASE_URL}/api/transactions/import-statement`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ csv_text: csvText }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to import statement (${res.status})`);
  }
  return res.json();
}

export async function parseBankSms(smsText) {
  const res = await fetch(`${API_BASE_URL}/api/transactions/parse-sms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sms_text: smsText }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to parse SMS (${res.status})`);
  }
  return res.json();
}

export async function seedBankPassbook(bank = 'hdfc') {
  const res = await fetch(`${API_BASE_URL}/api/transactions/seed-bank`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bank }),
  });
  if (!res.ok) throw new Error(`Failed to load bank passbook statement (${res.status})`);
  return res.json();
}

/* ─────────────────────────────────────────────
   Historical Reports API
   ──────────────────────────────────────────── */

export async function fetchHistoricalReport(months = 12) {
  const res = await fetch(`${API_BASE_URL}/api/reports/historical?months=${months}`);
  if (!res.ok) throw new Error(`Failed to fetch historical report (${res.status})`);
  return res.json();
}

export async function fetchMonthlyStatement(yearMonth) {
  const res = await fetch(`${API_BASE_URL}/api/reports/monthly/${yearMonth}`);
  if (!res.ok) throw new Error(`Failed to fetch monthly statement (${res.status})`);
  return res.json();
}
