// frontend/src/components/filters/FilterControls.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';

import { useAccounts } from '@/hooks/useAccounts';
import { useCostCenters } from '@/hooks/useCostCenters';
import { useSpendCategories } from '@/hooks/useSpendCategories';
import type { TransactionFilters } from '@/types';

import { AmountRangeFilter } from './AmountRangeFilter';
import { DateRangeInputs } from './DateRangeInputs';
import { DateRangeShortcuts } from './DateRangeShortcuts';
import { MultiSelect, type MultiSelectOption } from './MultiSelect';
import { SearchFilter } from './SearchFilter';

interface FilterControlsProps {
  appliedFilters: TransactionFilters;
  onApply: (filters: TransactionFilters) => void;
  onReset: () => void;
}

export function FilterControls({ appliedFilters, onApply, onReset }: FilterControlsProps) {
  // ============================================================================
  // Metadata
  // ============================================================================
  const { data: costCenters = [], isLoading: loadingCostCenters } = useCostCenters();
  const { data: spendCategories = [], isLoading: loadingCategories } = useSpendCategories();
  const { data: accounts = [], isLoading: loadingAccounts } = useAccounts();

  // Normalize accounts once for UI usage
  const accountOptions: MultiSelectOption[] = useMemo(
    () =>
      accounts.map((name, index) => ({
        id: index,
        name,
      })),
    [accounts]
  );

  const accountNameById = useMemo(
    () => new Map(accountOptions.map((o) => [o.id, o.name])),
    [accountOptions]
  );

  // ============================================================================
  // Draft state (staged changes)
  // ============================================================================
  const [draft, setDraft] = useState<TransactionFilters>(appliedFilters);

  useEffect(() => {
    setDraft(appliedFilters);
  }, [appliedFilters]);

  // ============================================================================
  // Actions
  // ============================================================================
  const applyFilters = useCallback(() => {
    const cleaned: TransactionFilters = {};

    if (draft.search?.trim()) cleaned.search = draft.search.trim();
    if (draft.start_date) cleaned.start_date = draft.start_date;
    if (draft.end_date) cleaned.end_date = draft.end_date;

    if (draft.min_amount != null) cleaned.min_amount = Number(draft.min_amount);
    if (draft.max_amount != null) cleaned.max_amount = Number(draft.max_amount);

    if (draft.cost_center_ids?.length)
      cleaned.cost_center_ids = draft.cost_center_ids;

    if (draft.spend_category_ids?.length)
      cleaned.spend_category_ids = draft.spend_category_ids;

    if (draft.account?.length) cleaned.account = draft.account;

    onApply(cleaned);
  }, [draft, onApply]);

  const resetAll = () => {
    setDraft({});
    onReset();
  };

  // ============================================================================
  // Render
  // ============================================================================
  return (
    <Box>
      {/* Filters Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            sm: '1fr',              // tablet
            md: 'repeat(2, 1fr)',   // small desktop
            lg: 'repeat(4, 1fr)',   // large screens
          },
          gap: 2.5,
          mb: 2.5,
        }}
      >
        {/* ───────────── Row 1 ───────────── */}

        <SearchFilter
          value={draft.search || ''}
          onChange={(value) => setDraft({ ...draft, search: value })}
        />

        <MultiSelect
          label="Cost Centers"
          placeholder="Select..."
          options={costCenters}
          value={draft.cost_center_ids || []}
          onChange={(ids) => setDraft({ ...draft, cost_center_ids: ids })}
          loading={loadingCostCenters}
        />

        <DateRangeInputs
          startDate={draft.start_date || ''}
          endDate={draft.end_date || ''}
          onStartDateChange={(date) => setDraft({ ...draft, start_date: date })}
          onEndDateChange={(date) => setDraft({ ...draft, end_date: date })}
        />

        <AmountRangeFilter
          minAmount={draft.min_amount?.toString() || ''}
          maxAmount={draft.max_amount?.toString() || ''}
          onMinAmountChange={(value) =>
            setDraft({
              ...draft,
              min_amount: value ? Number(value) : undefined,
            })
          }
          onMaxAmountChange={(value) =>
            setDraft({
              ...draft,
              max_amount: value ? Number(value) : undefined,
            })
          }
        />

        {/* ───────────── Row 2 ───────────── */}

        <MultiSelect
          label="Accounts"
          placeholder="Select..."
          options={accountOptions}
          value={
            draft.account
              ?.map((name) => accountOptions.find((o) => o.name === name)?.id)
              .filter((id): id is number => id !== undefined) || []
          }
          onChange={(ids) => {
            const selected = ids
              .map((id) => accountNameById.get(id))
              .filter((v): v is string => Boolean(v));
            setDraft({ ...draft, account: selected });
          }}
          loading={loadingAccounts}
        />

        <MultiSelect
          label="Spend Categories"
          placeholder="Select..."
          options={spendCategories}
          value={draft.spend_category_ids || []}
          onChange={(ids) => setDraft({ ...draft, spend_category_ids: ids })}
          loading={loadingCategories}
        />

        <DateRangeShortcuts
          onStartDateChange={(date) => setDraft({ ...draft, start_date: date })}
          onEndDateChange={(date) => setDraft({ ...draft, end_date: date })}
          onDateRangeChange={(start, end) =>
            setDraft({ ...draft, start_date: start, end_date: end })
          }
        />

        <Typography variant="caption" sx={{ textAlign: 'center', color: '#6b7280' }} >
          Negative for expenses, positive for income
        </Typography>
      </Box>

      {/* Action Buttons */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 2.5,
          pt: 2.5,
          pb: 1.5,
          borderTop: '1px solid #e2e8f0',
        }}
      >
        <Button
          variant="outlined"
          onClick={resetAll}
          sx={{
            px: 3,
            fontWeight: 600,
            borderRadius: 2.5,
            textTransform: 'none',
            '&:hover': {
              borderColor: '#0e2238',
              backgroundColor: 'rgba(31, 58, 95, 0.04)',
            },
          }}
        >
          Reset All
        </Button>
        <Button
          variant="contained"
          onClick={applyFilters}
          sx={{
            px: 2,
            borderRadius: 2.5,
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#0e2238',
            },
          }}
        >
          Apply Filters
        </Button>
      </Box>
    </Box>
  );
}