// frontend/src/types/index.ts

// ============================================================================
// API Response Types (match backend exactly)
// ============================================================================

export interface Transaction {
  id: number;
  date: string;         // ISO format: YYYY-MM-DD
  description: string;
  amount: number;       // Negative = expense, Positive = income
  account: string;
  cost_center_id: number;
  spend_category_ids: number[];
  notes: string | null;
}

export interface CostCenter {
  id: number;
  name: string;
}

export interface SpendCategory {
  id: number;
  name: string;
}

export interface PaginatedResponse<T> {
  transactions: T[];
  cost_centers: CostCenter[];
  spend_categories: SpendCategory[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

/**
 * Balance timeline point - one entry per transaction in chronological order.
 * Used for rendering the balance chart with transaction-level tooltips.
 */
export interface BalanceTimelinePoint {
  date: string;               // YYYY-MM-DD
  balance: number;            // Running balance after this transaction
  description: string;        // Transaction description for tooltip
  amount: number;             // Transaction amount for tooltip
  cost_center_name: string;   // Cost center for tooltip
}

/**
 * Monthly spending aggregates with cost center breakdown for tooltips.
 * Backend guarantees: sorted by month ASC.
 */
export interface MonthlySpending {
  month: string; // YYYY-MM format
  total: number;               // Backend: income - expenses. Frontend: unused (future net balance feature)
  expense_total: number;       // Used for bar chart height
  income_total: number;        // Backend: sum of positive amounts. Frontend: unused
  transaction_count: number;
  by_cost_center: Record<string, number>; // For bar chart tooltips
}

/**
 * Cost center spending aggregates.
 * Backend guarantees: sorted by expense_total ASC.
 * 
 * NOTE: Since expense_total is negative, ASC sort gives BIGGEST spending first.
 * Example: [-500, -300, -100] means $500, $300, $100 in spending order.
 */
export interface CostCenterSpending {
  cost_center_id: number;
  cost_center_name: string;
  total: number;               // Backend: income - expenses. Frontend: unused
  expense_total: number;       // Used for pie chart slices
  income_total: number;        // Backend: sum of positive amounts. Frontend: unused (should be 0)
  transaction_count: number;
}

/**
 * Spend category statistics.
 * Backend guarantees: sorted by expense_total ASC.
 * 
 * NOTE: Since expense_total is negative, ASC sort gives BIGGEST spending first.
 * Example: [-500, -300, -100] means $500, $300, $100 in spending order.
 */
export interface SpendCategoryStats {
  spend_category_id: number;
  spend_category_name: string;
  total: number;
  expense_total: number;    // Negative value (e.g., -500 = $500 spent)
  income_total: number;     // Backend: sum of positive amounts. Frontend: unused (should be 0)
  transaction_count: number;
}

/**
 * Complete analytics response.
 * All arrays are pre-sorted by backend - frontend should NOT re-sort.
 */
export interface Analytics {
  total_spent: number;
  total_income: number;
  total_cash: number;                           // Final balance (last value of balance_timeline)
  total_transactions: number;
  total_cost_centers: number;
  total_spend_categories: number;
  avg_expense: number;
  avg_income: number;
  monthly_spending: MonthlySpending[];
  cost_center_spending: CostCenterSpending[];
  spend_category_stats: SpendCategoryStats[];
  balance_timeline: BalanceTimelinePoint[];     // Sorted by (date ASC, id ASC)
}

export interface UploadResponse {
  message: string;
  count: number;
  institution: string;
}

// ============================================================================
// Frontend-Only Types
// ============================================================================

export interface TransactionFilters {
  search?: string;
  cost_center_ids?: number[];
  spend_category_ids?: number[];
  account?: string[];
  start_date?: string;  // YYYY-MM-DD
  end_date?: string;    // YYYY-MM-DD
  min_amount?: number;
  max_amount?: number;
}

// Enriched transaction (with joined metadata for display)
export interface EnrichedTransaction extends Transaction {
  cost_center_name: string;
  spend_category_names: string[];
}

// For creating new transactions
export interface CreateTransactionData {
  date: string;
  description: string;
  amount: number;
  account: string;
  cost_center_name?: string;        // Backend defaults to "Uncategorized" if missing
  spend_category_names?: string[];  // Backend defaults to ["Uncategorized"] if missing
  notes?: string | null;
}

// For updating transactions - BACKEND EXPECTS NAMES
export interface UpdateTransactionData {
  date?: string;
  description?: string;
  amount?: number;
  account?: string;
  cost_center_name?: string;        // Backend defaults to "Uncategorized" if empty string
  spend_category_names?: string[];  // Backend defaults to ["Uncategorized"] if empty array
  notes?: string | null;
}

// View modes for workspace
export type WorkspaceView = 'table' | 'timeline' | 'monthly';

// Analytics panel view
export type AnalyticsPanelView = 'cost-center-overview' | 'top-spend-categories' | 'quick-stats';