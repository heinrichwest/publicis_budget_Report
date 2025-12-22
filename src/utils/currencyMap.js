// Currency codes for each market
export const CURRENCY_MAP = {
  'Botswana': 'BWP',
  'Ghana': 'GHS',
  'Hub': 'ZAR', // Hub uses ZAR
  'Kenya': 'KES',
  'Mauritius': 'MUR',
  'Mozambique': 'MZN',
  'Seychelles': 'SCR',
  'Tanzania': 'TZS',
  'Uganda': 'UGX',
  'Zambia': 'ZMW'
};

// Get currency symbol for a market
export const getCurrencySymbol = (market) => {
  return CURRENCY_MAP[market] || 'LOCAL';
};

// Format currency with proper symbol
export const formatCurrencyWithSymbol = (amount, market) => {
  const symbol = getCurrencySymbol(market);
  const formatted = new Intl.NumberFormat('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
  return `${symbol} ${formatted}`;
};

export default CURRENCY_MAP;
