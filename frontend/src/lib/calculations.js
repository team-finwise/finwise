/**
 * FINWISE Financial Calculations
 *
 * This module mirrors financial/calculations.py and financial/what_if.py
 * exactly. All arithmetic here must stay in sync with the Python engine.
 * When the FastAPI backend is connected, this is the fallback/offline layer.
 */

/**
 * Calculate core monthly financial metrics.
 * Mirrors: calculate_financial_snapshot()
 */
export function calculateFinancialSnapshot({
  income,
  housing,
  food,
  transportation,
  education,
  healthcare,
  entertainment,
  subscriptions,
  other,
  debtPayment,
  savingsContribution,
}) {
  const totalExpenses =
    housing +
    food +
    transportation +
    education +
    healthcare +
    entertainment +
    subscriptions +
    other +
    debtPayment;

  const monthlySurplus = income - totalExpenses;

  const savingsRate =
    income > 0 ? (savingsContribution / income) * 100 : null;

  const debtToIncome =
    income > 0 ? (debtPayment / income) * 100 : null;

  const surplusRate =
    income > 0 ? (monthlySurplus / income) * 100 : null;

  return {
    totalMonthlyExpenses: totalExpenses,
    monthlySurplus,
    cashFlowStatus: monthlySurplus >= 0 ? 'surplus' : 'deficit',
    savingsRate,
    surplusRate,
    debtToIncomeRatio: debtToIncome,
  };
}

/**
 * Calculate progress toward a financial goal.
 * Mirrors: calculate_goal_progress()
 */
export function calculateGoalProgress({ targetAmount, amountSaved }) {
  if (targetAmount <= 0) {
    return { remainingAmount: 0, progressPercentage: 100 };
  }

  const remainingAmount = Math.max(targetAmount - amountSaved, 0);
  const progressPercentage = Math.min((amountSaved / targetAmount) * 100, 100);

  return { remainingAmount, progressPercentage };
}

/**
 * Calculate how much needs to be saved monthly to hit a goal by a date.
 * Mirrors: calculate_goal_plan()
 */
export function calculateGoalPlan({
  targetAmount,
  amountSaved,
  monthlySavings,
  targetDate,
}) {
  const remainingAmount = Math.max(targetAmount - amountSaved, 0);

  if (remainingAmount === 0) {
    return {
      remainingAmount: 0,
      requiredMonthlySaving: 0,
      currentSavingSufficient: true,
      monthsRemaining: 0,
    };
  }

  if (monthlySavings <= 0) {
    return {
      remainingAmount,
      requiredMonthlySaving: null,
      currentSavingSufficient: false,
      monthsRemaining: null,
    };
  }

  const today = new Date();
  const target = new Date(targetDate);

  let months =
    (target.getFullYear() - today.getFullYear()) * 12 +
    (target.getMonth() - today.getMonth());

  if (target.getDate() >= today.getDate()) {
    months += 1;
  }

  if (months <= 0) {
    return {
      remainingAmount,
      requiredMonthlySaving: null,
      currentSavingSufficient: false,
      monthsRemaining: 0,
    };
  }

  const requiredMonthlySaving = remainingAmount / months;

  return {
    remainingAmount,
    requiredMonthlySaving,
    currentSavingSufficient: monthlySavings >= requiredMonthlySaving,
    monthsRemaining: months,
  };
}

/**
 * Calculate the impact of a what-if scenario.
 * Mirrors: calculate_what_if()
 */
export function calculateWhatIf({
  income, housing, food, transportation, education,
  healthcare, entertainment, subscriptions, other,
  debtPayment, savingsContribution,
  // deltas
  incomeDelta = 0,
  housingDelta = 0,
  foodDelta = 0,
  transportationDelta = 0,
  educationDelta = 0,
  healthcareDelta = 0,
  entertainmentDelta = 0,
  subscriptionsDelta = 0,
  otherDelta = 0,
  debtPaymentDelta = 0,
  savingsContributionDelta = 0,
}) {
  const current = calculateFinancialSnapshot({
    income, housing, food, transportation, education,
    healthcare, entertainment, subscriptions, other,
    debtPayment, savingsContribution,
  });

  const projected = calculateFinancialSnapshot({
    income: income + incomeDelta,
    housing: housing + housingDelta,
    food: food + foodDelta,
    transportation: transportation + transportationDelta,
    education: education + educationDelta,
    healthcare: healthcare + healthcareDelta,
    entertainment: entertainment + entertainmentDelta,
    subscriptions: subscriptions + subscriptionsDelta,
    other: other + otherDelta,
    debtPayment: debtPayment + debtPaymentDelta,
    savingsContribution: savingsContribution + savingsContributionDelta,
  });

  return {
    current,
    projected,
    changes: {
      income: incomeDelta,
      housing: housingDelta,
      food: foodDelta,
      transportation: transportationDelta,
      education: educationDelta,
      healthcare: healthcareDelta,
      entertainment: entertainmentDelta,
      subscriptions: subscriptionsDelta,
      other: otherDelta,
      debtPayment: debtPaymentDelta,
      savingsContribution: savingsContributionDelta,
    },
    surplusChange: projected.monthlySurplus - current.monthlySurplus,
  };
}
