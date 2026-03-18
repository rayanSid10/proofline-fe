/**
 * Format large numbers with K/M/B abbreviations
 * @param {number} num - The number to format
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted number
 */
export function formatLargeNumber(num, decimals = 1) {
  if (num === null || num === undefined) return '0';

  const absNum = Math.abs(num);

  if (absNum >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(decimals).replace(/\.0$/, '') + 'B';
  }
  if (absNum >= 1_000_000) {
    return (num / 1_000_000).toFixed(decimals).replace(/\.0$/, '') + 'M';
  }
  if (absNum >= 1_000) {
    return (num / 1_000).toFixed(decimals).replace(/\.0$/, '') + 'K';
  }

  return num.toString();
}

/**
 * Format currency with K/M/B abbreviations
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency symbol (default: 'PKR')
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted currency
 */
export function formatCurrencyAbbreviated(amount, currency = 'PKR', decimals = 1) {
  return `${currency} ${formatLargeNumber(amount, decimals)}`;
}

/**
 * Format number with commas for full display (in tooltips)
 * @param {number} num - The number to format
 * @returns {string} Formatted number with commas
 */
export function formatNumberWithCommas(num) {
  if (num === null || num === undefined) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format full currency with commas (for tooltips)
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency symbol (default: 'PKR')
 * @returns {string} Formatted currency
 */
export function formatCurrencyFull(amount, currency = 'PKR') {
  return `${currency} ${formatNumberWithCommas(amount)}`;
}
