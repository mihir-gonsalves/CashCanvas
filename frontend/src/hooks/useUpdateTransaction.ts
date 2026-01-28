// frontend/src/hooks/useUpdateTransaction.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import type { UpdateTransactionData } from '@/types';

interface UpdateTransactionParams {
  id: number;
  updates: UpdateTransactionData;
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: UpdateTransactionParams) =>
      api.updateTransaction(id, updates),
    onSuccess: () => {
      // Invalidate all queries because backend auto-deletes orphaned categories
      // When a transaction changes, its old cost center/categories might be deleted
      // Used to update frontend dropdown fields without needing page refresh

      // Invalidate transactions and analytics to refetch with updated data
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });

      // Invalidates the cc, sc, and account dropdowns in filters/dialogs to refetch with new data
      queryClient.invalidateQueries({ queryKey: ['cost-centers'] });
      queryClient.invalidateQueries({ queryKey: ['spend-categories'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}