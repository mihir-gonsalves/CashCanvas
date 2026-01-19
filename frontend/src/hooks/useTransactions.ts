// frontend/src/hooks/useTransactions.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../api/client";
import type { TransactionFilters } from "../types/filters";
import { buildFilterParams } from "../utils/filterUtils";

// ========================
// TYPE DEFINITIONS
// ========================

export interface CostCenter {
  id: number;
  name: string;
}

export interface SpendCategory {
  id: number;
  name: string;
}

export interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  account: string;
  cost_center: CostCenter | null;
  spend_categories: SpendCategory[];
  notes: string;
}

export interface CreateTransactionData {
  date: string;
  description: string;
  amount: number;
  account: string;
  cost_center_name?: string;
  spend_category_names?: string[];
  notes?: string;
}

export interface UpdateTransactionData {
  id: number;
  date?: string;
  description?: string;
  amount?: number;
  account?: string;
  cost_center_name?: string;
  spend_category_names?: string[];
  notes?: string;
}

// ========================
// CONSTANTS
// ========================

const STALE_TIME = {
  SHORT: 30000,  // 30 seconds
  MEDIUM: 60000, // 1 minute
  LONG: 300000,  // 5 minutes
} as const;

const QUERY_KEYS = {
  TRANSACTIONS: "transactions",
  FILTERED: "filtered",
  COST_CENTERS: "cost_centers",
  SPEND_CATEGORIES: "spend_categories",
  ACCOUNTS: "accounts",
  DATE_RANGE: "date_range",
} as const;

// ========================
// METADATA QUERIES
// ========================

/**
 * Fetch all cost centers
 */
export function useCostCenters() {
  return useQuery<{ cost_centers: CostCenter[]; count: number }>({
    queryKey: [QUERY_KEYS.COST_CENTERS],
    queryFn: async () => {
      const res = await client.get("/transactions/cost_centers");
      return res.data;
    },
    staleTime: STALE_TIME.MEDIUM,
  });
}

/**
 * Fetch all spend categories
 */
export function useSpendCategories() {
  return useQuery<{ spend_categories: SpendCategory[]; count: number }>({
    queryKey: [QUERY_KEYS.SPEND_CATEGORIES],
    queryFn: async () => {
      const res = await client.get("/transactions/spend_categories");
      return res.data;
    },
    staleTime: STALE_TIME.MEDIUM,
  });
}

/**
 * Fetch unique accounts
 */
export function useAccounts() {
  return useQuery<string[]>({
    queryKey: [QUERY_KEYS.ACCOUNTS],
    queryFn: async () => {
      const res = await client.get("/transactions/accounts");
      return res.data;
    },
    staleTime: STALE_TIME.MEDIUM,
  });
}

/**
 * Fetch date range metadata
 */
export function useDateRange() {
  return useQuery<{ earliest: string | null; latest: string | null; has_data: boolean }>({
    queryKey: [QUERY_KEYS.DATE_RANGE],
    queryFn: async () => {
      const res = await client.get("/transactions/date-range");
      return res.data;
    },
    staleTime: STALE_TIME.LONG,
  });
}

// ========================
// TRANSACTION QUERIES
// ========================

/**
 * Fetch all transactions (no filters)
 */
export function useTransactions() {
  return useQuery<Transaction[]>({
    queryKey: [QUERY_KEYS.TRANSACTIONS],
    queryFn: async () => {
      const res = await client.get("/transactions/");
      return res.data.transactions;
    },
    staleTime: STALE_TIME.SHORT,
  });
}

/**
 * Fetch filtered transactions
 * Backend handles all filtering logic
 */
export function useFilteredTransactions(filters: TransactionFilters) {
  return useQuery({
    queryKey: [QUERY_KEYS.TRANSACTIONS, QUERY_KEYS.FILTERED, filters],
    queryFn: async () => {
      const params = buildFilterParams(filters);
      const res = await client.get(`/transactions/filter?${params}`);
      return res.data.transactions;
    },
  });
}

// ========================
// MUTATIONS - CREATE, UPDATE, DELETE
// ========================

/**
 * Create a new transaction
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (txn: CreateTransactionData) => {
      const res = await client.post("/transactions/", txn);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRANSACTIONS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SPEND_CATEGORIES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COST_CENTERS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DATE_RANGE] });
    },
  });
}

/**
 * Update an existing transaction
 */
export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (txn: UpdateTransactionData) => {
      const { id, ...updateData } = txn;
      const res = await client.put(`/transactions/${id}`, updateData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRANSACTIONS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SPEND_CATEGORIES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COST_CENTERS] });
    },
  });
}

/**
 * Delete a transaction
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await client.delete(`/transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRANSACTIONS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SPEND_CATEGORIES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COST_CENTERS] });
    },
  });
}

/**
 * Bulk delete transactions
 */
export function useBulkDeleteTransactions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transaction_ids: number[]) => {
      const res = await client.post("/transactions/admin/bulk-delete", { transaction_ids });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRANSACTIONS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SPEND_CATEGORIES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COST_CENTERS] });
    },
  });
}

/**
 * Bulk update transactions
 */
export function useBulkUpdateTransactions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { transaction_ids: number[]; update_data: Omit<UpdateTransactionData, 'id'> }) => {
      const res = await client.post("/transactions/admin/bulk-update", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRANSACTIONS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SPEND_CATEGORIES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COST_CENTERS] });
    },
  });
}
