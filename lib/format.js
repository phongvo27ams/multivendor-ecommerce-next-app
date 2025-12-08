export function formatMoney(value, symbol = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$') {
  const num = typeof value === 'number' ? value : Number(value) || 0;
  const formatted = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
  return `${symbol}${formatted}`;
}