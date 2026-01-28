// frontend/src/utils/exportUtils.ts
import type { EnrichedTransaction, TransactionFilters } from '@/types';
import { api } from '@/api/client';

/**
 * CSV Export Utility
 * 
 * Exports transactions to CSV format that can be re-imported via the /upload-csv endpoint.
 * Uses the same format as the backend's custom CashCanvas CSV parser.
 * 
 * Key Features:
 * - Respects active filters (exports only what's shown)
 * - Fetches complete dataset via /filter endpoint with high page_size
 * - Handles special characters and quotes properly
 * - Generates timestamped filenames
 * 
 * NOTE: Use /filter endpoint instead of /analytics because balance_timeline
 * doesn't include account, spend_category_ids, or notes fields needed for export.
 */

const CSV_HEADERS = ['Date', 'Description', 'Amount', 'Account', 'Cost Center', 'Spend Categories', 'Notes'] as const;
const UNCATEGORIZED = 'Uncategorized';

/**
 * Escape CSV values by wrapping in quotes and escaping internal quotes
 */
function escapeCSVValue(value: string): string {
  // If value contains comma, quote, or newline, wrap it in quotes and escape internal quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Format a single transaction as CSV row
 */
function formatTransactionRow(txn: EnrichedTransaction): string {
  const costCenter = txn.cost_center_name || UNCATEGORIZED;
  const spendCategories = txn.spend_category_names?.length
    ? txn.spend_category_names.join(', ')
    : UNCATEGORIZED;

  return [
    txn.date,                                    // Date (already in YYYY-MM-DD format)
    escapeCSVValue(txn.description),             // Description
    txn.amount,                                  // Amount (negative = expense, positive = income)
    escapeCSVValue(txn.account),                 // Account
    escapeCSVValue(costCenter),                  // Cost Center
    escapeCSVValue(spendCategories),             // Spend Categories (comma-separated)
    txn.notes ? escapeCSVValue(txn.notes) : '',  // Notes (optional)
  ].join(',');
}

/**
 * Generate timestamped filename
 */
function generateFilename(): string {
  const timestamp = new Date().toISOString().split('T')[0];
  return `CashCanvas_${timestamp}.csv`;
}

/**
 * Trigger browser download of CSV content
 */
function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export enriched transactions to CSV
 * 
 * @param transactions - Array of enriched transactions to export
 * @throws Alert if no transactions to export
 */
export function exportTransactionsToCSV(transactions: EnrichedTransaction[]): void {
  if (transactions.length === 0) {
    alert('No transactions to export. Add transactions or change applied filters.');
    return;
  }

  // Build CSV content
  const csvContent = [
    CSV_HEADERS.map(h => `"${h}"`).join(','),
    ...transactions.map(formatTransactionRow)
  ].join('\n');

  downloadCSV(csvContent, generateFilename());
}

/**
 * Fetch all filtered transactions and export to CSV
 * 
 * This function handles the complete export workflow:
 * 1. Fetches ALL filtered transactions (using high page_size)
 * 2. Enriches with metadata
 * 3. Exports to CSV
 * 
 * @param filters - Current filter state
 * @throws Error if fetch fails
 * 
 * Usage in TransactionWorkspace:
 * ```tsx
 * import { fetchAndExportTransactions } from '@/utils/exportUtils';
 * 
 * const handleExportCSV = async () => {
 *   try {
 *     await fetchAndExportTransactions(filters);
 *   } catch (error) {
 *     alert(`Export failed: ${getErrorMessage(error)}`);
 *   }
 * };
 * ```
 */
export async function fetchAndExportTransactions(filters: TransactionFilters): Promise<void> {
  try {
    // Fetch ALL transactions matching filters
    // Use page_size=10000 (backend maximum) to get everything in one request
    const data = await api.getFilteredTransactions(filters, 1, 10000);
    
    if (data.transactions.length === 0) {
      alert('No transactions to export. Add transactions or change applied filters.');
      return;
    }
    
    // Enrich compact transactions with metadata
    const enriched: EnrichedTransaction[] = data.transactions.map(txn => {
      const costCenter = data.cost_centers.find(cc => cc.id === txn.cost_center_id);
      const spendCategories = data.spend_categories.filter(sc => 
        txn.spend_category_ids.includes(sc.id)
      );
      
      return {
        ...txn,
        cost_center_name: costCenter?.name || UNCATEGORIZED,
        spend_category_names: spendCategories.length 
          ? spendCategories.map(sc => sc.name)
          : [UNCATEGORIZED],
      };
    });
    
    // Export to CSV
    exportTransactionsToCSV(enriched);
    
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
}