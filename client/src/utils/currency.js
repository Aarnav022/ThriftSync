/**
 * ThriftSync Currency & Money Formatting Utility (INR / Paise)
 * All backend money is strictly stored as integers in paise (1 Rupee = 100 paise).
 */

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

const inrFormatterWithDecimals = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

/**
 * Formats integer paise into clean Indian Rupee currency display.
 * Example: 49900 paise -> "₹499", 49950 paise -> "₹499.50"
 */
export function formatINR(amountPaise, forceDecimals = false) {
  if (amountPaise === null || amountPaise === undefined || isNaN(amountPaise)) {
    return '₹0';
  }

  const rupees = Number(amountPaise) / 100;
  const hasSubRupee = Number(amountPaise) % 100 !== 0;

  if (forceDecimals || hasSubRupee) {
    return inrFormatterWithDecimals.format(rupees);
  }

  return inrFormatter.format(rupees);
}

/**
 * Converts integer paise to numerical rupees.
 */
export function paiseToRupees(amountPaise) {
  if (!amountPaise || isNaN(amountPaise)) return 0;
  return Number(amountPaise) / 100;
}

/**
 * Converts numeric rupees into integer paise without floating point inaccuracy.
 */
export function rupeesToPaise(rupees) {
  if (!rupees || isNaN(rupees)) return 0;
  return Math.round(Number(rupees) * 100);
}

export default {
  formatINR,
  paiseToRupees,
  rupeesToPaise,
};
