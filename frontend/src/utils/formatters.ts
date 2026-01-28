// frontend/src/utils/formatters.ts
import { format, parseISO } from 'date-fns';

// For backend, inputs, query params, etc.
export function toIsoDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// For UI display ONLY
export function formatDisplayDate(isoDate: string): string {
  return format(parseISO(isoDate), 'MMM d, yyyy');
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}