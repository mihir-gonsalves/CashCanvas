// frontend/src/utils/dialogUtils.ts
const UNCATEGORIZED = "Uncategorized";

export const DIALOG_CONFIG = {
  MAX_WIDTH: "sm" as const,
  FULL_WIDTH: true,
};

export const BUTTON_TEXT = {
  CANCEL: "Cancel",
  SUBMIT: "Save",
  LOADING: "Saving...",
  DELETE: "Delete",
  DELETING: "Deleting...",
  ADD: "Add Transaction",
  ADDING: "Adding...",
};

export const FIELD_LABELS = {
  DESCRIPTION: "Description",
  AMOUNT: "Amount",
  ACCOUNT: "Account",
  COST_CENTER: "Cost Center",
  SPEND_CATEGORIES: "Spend Categories (comma-separated)",
  DATE: "Date",
  NOTES: "Additional Notes"
};

export const PLACEHOLDERS = {
  COST_CENTER: "e.g. Living Expenses, Car, Meals",
  SPEND_CATEGORIES: "e.g. Rent, Gas, Groceries",
};

export const HELPER_TEXT = {
  AMOUNT: "Use negative values for expenses",
  COST_CENTER: 'Leave blank for "Uncategorized"',
  SPEND_CATEGORIES: 'Leave blank for "Uncategorized"',
};

export function parseSpendCategories(input: string): string[] {
  if (!input.trim()) return [];
  return input
    .split(",")
    .map(cat => cat.trim())
    .filter(cat => cat.length > 0);
}

export function getCostCenterInput(costCenter: { name: string } | null | undefined): string {
  if (!costCenter || costCenter.name === UNCATEGORIZED) return "";
  return costCenter.name;
}

export function getSpendCategoryInput(spendCategories: { name: string }[] | null | undefined): string {
  if (!spendCategories) return "";

  const names = spendCategories
    .filter(cat => cat.name !== UNCATEGORIZED)
    .map(cat => cat.name);

  return names.join(", ");
}

export function formatAmountForInput(amount: number | string): string {
  if (typeof amount === "number") return amount.toFixed(2);
  return amount;
}
