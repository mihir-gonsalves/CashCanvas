// frontend/src/hooks/useCreateTransaction.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import type { CreateTransactionData } from '@/types';

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTransactionData) => api.createTransaction(data),
    onSuccess: () => {
      // Used to update frontend dropdown fields without needing page refresh

      // Invalidate transactions and analytics to refetch with new data
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });

      // Invalidates the cc, sc, and account dropdowns in filters/dialogs to refetch with new data
      queryClient.invalidateQueries({ queryKey: ['cost-centers'] });
      queryClient.invalidateQueries({ queryKey: ['spend-categories'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}