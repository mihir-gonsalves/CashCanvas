// frontend/src/hooks/useUploadCSV.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';

/**
 * Mutation hook for uploading CSV files
 * 
 * Invalidates both transactions and analytics queries on success
 * to refresh all views with newly imported data.
 */
export function useUploadCSV() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ institution, file }: { institution: string; file: File }) =>
      api.uploadCSV(institution, file),
    onSuccess: () => {
      // Invalidate all transaction and analytics queries
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['cost-centers'] });
      queryClient.invalidateQueries({ queryKey: ['spend-categories'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}