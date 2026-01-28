// frontend/src/hooks/useCostCenters.ts
import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';

export function useCostCenters() {
  return useQuery({
    queryKey: ['cost-centers'],
    queryFn: api.getCostCenters,
    staleTime: Infinity, // Rarely changes
  });
}