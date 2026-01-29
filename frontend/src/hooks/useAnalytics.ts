// frontend/src/hooks/useAnalytics.ts
import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import type { TransactionFilters, Analytics } from '@/types';

/**
 * Fetch pre-aggregated analytics data for charts and sidebar.
 * 
 * Data Contract:
 * - All arrays are pre-sorted by backend (do NOT re-sort in frontend)
 * - balance_timeline: sorted by (date ASC, id ASC) - ready for line chart
 * - monthly_spending: sorted by month ASC - ready for bar chart with tooltips
 * - cost_center_spending: sorted by expense_total DESC - ready for donut chart
 * - spend_category_stats: sorted by expense_total DESC - ready for progress bars
 * 
 * Tooltip Data:
 * - balance_timeline: each point includes description, amount, cost_center_name
 * - monthly_spending: includes by_cost_center breakdown for bar tooltips
 * - Charts should use this data directly without additional API calls
 * 
 * @param filters - Same filters as useTransactions (shared filter state)
 * @returns Tanstack Query result with Analytics data
 */
export function useAnalytics(filters: TransactionFilters = {}) {
  return useQuery<Analytics, Error>({
    queryKey: ['analytics', filters],
    queryFn: () => api.getAnalytics(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}