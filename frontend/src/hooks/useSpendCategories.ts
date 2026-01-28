// frontend/src/hooks/useSpendCategories.ts
import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';

export function useSpendCategories() {
  return useQuery({
    queryKey: ['spend-categories'],
    queryFn: api.getSpendCategories,
    staleTime: Infinity,
  });
}