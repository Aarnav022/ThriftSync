export function formatCurrency(amount, currency = 'INR') {
  if (typeof amount !== 'number') return '₹0';
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatCompactNumber(number) {
  if (!number) return '0';
  return new Intl.NumberFormat('en-IN', { notation: 'compact' }).format(number);
}
