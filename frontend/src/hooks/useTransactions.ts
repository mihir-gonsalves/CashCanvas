// frontend/src/hooks/useTransactions.ts
// For DataGrid (MIT version caps pages at 100 rows), for more than 100 transactions (charts/analytics), use useAnalytics.ts
import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import type { TransactionFilters } from '@/types';

export function useTransactions(
  filters: TransactionFilters = {},
  page: number,
  pageSize: number  // MUI DataGrid defaults at 25 transactions upon initial render, limited to 100 transactions per MIT license
) {
  return useQuery({
    queryKey: ['transactions', filters, page, pageSize],
    queryFn: () => api.getFilteredTransactions(filters, page, pageSize),
  });
}