// frontend/src/utils/chartHelpers.ts
import { format, parse } from 'date-fns';

/**
 * Chart color palette
 */
export const CHART_PALETTE = [
  '#059669', // emerald
  '#f59e0b', // amber
  '#3b82f6', // blue
  '#dc2626', // red
];

/**
 * Format month string for chart labels
 * @param month - Month in YYYY-MM format
 * @returns Formatted label like "Jan 2025"
 */
export function formatMonthLabel(month: string): string {
  const date = parse(month, 'yyyy-MM', new Date());
  return format(date, 'MMM yyyy');
}

/**
 * Calculate percentage with safe division
 * @param value - Numerator
 * @param total - Denominator
 * @returns Percentage (0-100) or 0 if total is 0
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (Math.abs(value) / Math.abs(total)) * 100;
}

/**
 * Format tooltip value as currency
 * @param value - Numeric value to format
 * @returns Formatted currency string
 */
export function formatTooltipValue(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));
}

/**
 * Get color from chart palette
 * @param index - Color index
 * @returns Hex color string
 */
export function getChartColor(index: number): string {
  return CHART_PALETTE[index % CHART_PALETTE.length];
}

/**
 * Calculate average monthly expense
 * @param data - Array of monthly spending data
 * @returns Average expense amount
 */
export function calculateAverageExpense(data: { expense_total: number }[]): number {
  if (data.length === 0) return 0;
  const total = data.reduce((sum, month) => sum + Math.abs(month.expense_total), 0);
  return total / data.length;
}