import { format, parseISO, isValid } from 'date-fns';

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string, formatStr = 'dd MMM yyyy'): string {
  if (!dateString) return '-';
  try {
    const parsed = parseISO(dateString);
    if (!isValid(parsed)) return dateString;
    return format(parsed, formatStr);
  } catch {
    return dateString;
  }
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}
