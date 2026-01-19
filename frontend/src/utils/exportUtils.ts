// frontend/src/utils/exportUtils.ts
import type { Transaction } from '../hooks/useTransactions';

const CSV_HEADERS = ['Date', 'Description', 'Amount', 'Account', 'Cost Center', 'Spend Categories', 'Notes'];
const UNCATEGORIZED = 'Uncategorized';

function escapeCSVValue(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function formatTransactionRow(txn: Transaction): string[] {
  const costCenter = txn.cost_center?.name || UNCATEGORIZED;
  const spendCategories = txn.spend_categories?.length
    ? txn.spend_categories.map(cat => cat.name).join(', ')
    : UNCATEGORIZED;

  return [
    txn.date,
    escapeCSVValue(txn.description),
    txn.amount.toString(),
    escapeCSVValue(txn.account),
    escapeCSVValue(costCenter),
    escapeCSVValue(spendCategories),
    txn.notes ? escapeCSVValue(txn.notes) : '',
  ];
}

function generateFilename(): string {
  const timestamp = new Date().toISOString().split('T')[0];
  return `transactions_${timestamp}.csv`;
}

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

export function exportTransactionsToCSV(transactions: Transaction[]): void {
  if (transactions.length === 0) {
    alert('No transactions to export');
    return;
  }

  const rows = transactions.map(formatTransactionRow);
  const csvContent = [
    CSV_HEADERS.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  downloadCSV(csvContent, generateFilename());
}
