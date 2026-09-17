/**
 * FINWISE Formatters
 * Consistent display of monetary values, percentages and dates.
 */

const rupeeFmt = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/**
 * Format a number as Indian Rupees.
 * e.g. 60000 → "₹60,000"
 */
export function formatRupee(value) {
  if (value === null || value === undefined) return '—';
  return rupeeFmt.format(value);
}

/**
 * Format a number as a percentage to 1 decimal place.
 * e.g. 16.66 → "16.7%"
 */
export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined) return '—';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a month count into a readable string.
 * e.g. 14 → "14 months"
 */
export function formatMonths(months) {
  if (months === null || months === undefined) return '—';
  if (months === 0) return 'Goal reached';
  if (months === 1) return '1 month';
  return `${months} months`;
}

/**
 * Format a delta value as a signed rupee string.
 * e.g. 5000 → "+₹5,000", -2000 → "-₹2,000"
 */
export function formatDelta(value) {
  if (value === null || value === undefined) return '—';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${rupeeFmt.format(value)}`;
}

/**
 * Format a date string as "Month YYYY".
 * e.g. "2027-03-01" → "Mar 2027"
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

/**
 * Determine status color from a rate value with given thresholds.
 */
export function rateStatus(value, goodThreshold, badThreshold, higherIsBetter = true) {
  if (value === null || value === undefined) return 'muted';
  if (higherIsBetter) {
    if (value >= goodThreshold) return 'green';
    if (value >= badThreshold) return 'amber';
    return 'red';
  } else {
    if (value <= goodThreshold) return 'green';
    if (value <= badThreshold) return 'amber';
    return 'red';
  }
}
