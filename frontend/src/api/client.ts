// frontend/src/api/client.ts
import axios, { AxiosError } from 'axios';

import type {
  Analytics,
  CostCenter,
  CreateTransactionData,
  PaginatedResponse,
  SpendCategory,
  Transaction,
  TransactionFilters,
  UpdateTransactionData,
  UploadResponse,
} from '@/types';


// ============================================================================
// Axios Instance
// ============================================================================

const apiClient = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000, // 5 seconds

  // CRITICAL: Configure axios to send arrays as repeated parameters
  paramsSerializer: {
    indexes: null, // This tells axios to use the "repeat" style: ?id=1&id=2&id=3
  },
});

// ============================================================================
// Response Interceptor (Error Handling)
// ============================================================================

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Log for debugging
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
    });

    // Re-throw for Tanstack Query to handle
    throw error;
  }
);

// ============================================================================
// Helper: Build Query Params from Filters
// ============================================================================

function buildQueryParams(
  filters: TransactionFilters,
  page?: number,
  pageSize?: number
): Record<string, any> {
  const params: Record<string, any> = {};

  // Pagination
  if (page !== undefined) params.page = page;
  if (pageSize !== undefined) params.page_size = pageSize;

  // Filters
  if (filters.search) params.search = filters.search;
  if (filters.start_date) params.start_date = filters.start_date;
  if (filters.end_date) params.end_date = filters.end_date;
  if (filters.min_amount !== undefined) params.min_amount = filters.min_amount;
  if (filters.max_amount !== undefined) params.max_amount = filters.max_amount;

  // Array filters - DON'T JOIN! Pass arrays directly
  // Axios will handle serialization based on paramsSerializer config
  if (filters.cost_center_ids?.length) {
    params.cost_center_ids = filters.cost_center_ids;
  }
  if (filters.spend_category_ids?.length) {
    params.spend_category_ids = filters.spend_category_ids;
  }
  if (filters.account?.length) {
    params.account = filters.account;
  }

  return params;
}

// ============================================================================
// API Functions
// ============================================================================

export const api = {
  // --------------------------------------------------------------------------
  // Transactions
  // --------------------------------------------------------------------------

  async getFilteredTransactions(
    filters: TransactionFilters = {},
    page: number = 1,
    pageSize: number = 10000
  ): Promise<PaginatedResponse<Transaction>> {
    const params = buildQueryParams(filters, page, pageSize);
    const { data } = await apiClient.get('/transactions/filter', { params });
    return data;
  },

  async getAnalytics(filters: TransactionFilters = {}): Promise<Analytics> {
    const params = buildQueryParams(filters);
    const { data } = await apiClient.get('/transactions/analytics', { params });
    return data;
  },

  async createTransaction(txn: CreateTransactionData): Promise<Transaction> {
    const { data } = await apiClient.post('/transactions/', txn);
    return data;
  },

  async updateTransaction(
    id: number,
    updates: UpdateTransactionData
  ): Promise<Transaction> {
    const { data } = await apiClient.put(`/transactions/${id}`, updates);
    return data;
  },

  async deleteTransaction(id: number): Promise<void> {
    await apiClient.delete(`/transactions/${id}`);
  },

  // --------------------------------------------------------------------------
  // Metadata
  // --------------------------------------------------------------------------

  async getCostCenters(): Promise<CostCenter[]> {
    const { data } = await apiClient.get('/transactions/cost_centers');
    return data.cost_centers;
  },

  async getSpendCategories(): Promise<SpendCategory[]> {
    const { data } = await apiClient.get('/transactions/spend_categories');
    return data.spend_categories;
  },

  async getAccounts(): Promise<string[]> {
    const { data } = await apiClient.get('/transactions/accounts');
    return data;
  },

  // --------------------------------------------------------------------------
  // CSV Upload
  // --------------------------------------------------------------------------

  async uploadCSV(institution: string, file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('institution', institution);
    formData.append('file', file);

    const { data } = await apiClient.post('/transactions/upload-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};