// frontend/src/utils/enrichment.ts
// Enriches transactions by mapping cost center and category IDs to names
import type { Transaction, CostCenter, SpendCategory, EnrichedTransaction } from '@/types';

export function enrichTransaction(
  txn: Transaction,
  costCenters: CostCenter[],
  spendCategories: SpendCategory[]
): EnrichedTransaction {
  const costCenter = costCenters.find(cc => cc.id === txn.cost_center_id);
  const categories = spendCategories.filter(sc => txn.spend_category_ids.includes(sc.id));

  return {
    ...txn,
    cost_center_name: costCenter?.name ?? 'Uncategorized',
    spend_category_names: categories.map(c => c.name),
  };
}

export function enrichTransactions(
  transactions: Transaction[],
  costCenters: CostCenter[],
  spendCategories: SpendCategory[]
): EnrichedTransaction[] {
  return transactions.map(txn =>
    enrichTransaction(txn, costCenters, spendCategories)
  );
}