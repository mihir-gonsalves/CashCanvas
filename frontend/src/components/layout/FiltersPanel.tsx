// frontend/src/components/layout/FiltersPanel.tsx
import { Box, Chip, Collapse, IconButton, Typography } from '@mui/material';
import { ExpandLess, ExpandMore, Tune } from '@mui/icons-material';

import { FilterControls } from '@/components/filters/FilterControls';
import type { TransactionFilters } from '@/types';

interface FiltersPanelProps {
  open: boolean;
  onToggle: () => void;
  filters: TransactionFilters;
  onApply: (filters: TransactionFilters) => void;
  onReset: () => void;
}

export function FiltersPanel({ open, onToggle, filters, onApply, onReset }: FiltersPanelProps) {
  // Count active filters
  const activeFilterCount = Object.keys(filters).filter(key => {
    const value = filters[key as keyof TransactionFilters];
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== '';
  }).length;

  return (
    <Box sx={{ transition: 'max-height 0.3s ease-in' }} >
      {/* Header Bar - Always Visible */}
      <Box
        sx={{ display: 'flex', justifyContent: 'space-between', px: 4, py: 2.5, cursor: 'pointer', }}
        onClick={onToggle}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          <Typography variant="h3" sx={{ display: 'flex', alignItems: 'center', color: '#1f3a5f' }} >
            <Tune fontSize="medium" sx={{ mr: 1.5 }} />
            Filter Transactions
          </Typography>
          {activeFilterCount > 0 && (
            <Chip
              label={`${activeFilterCount} active`}
              size="small"
              sx={{ color: '#f5f1e8', backgroundColor: '#1f3a5f', fontSize: '0.75rem', fontWeight: 500 }}
            />
          )}
        </Box>
        <IconButton size="small">
          {open ? (
            <ExpandLess sx={{ color: '#1f3a5f' }} />
          ) : (
            <ExpandMore sx={{ color: '#1f3a5f' }} />
          )}
        </IconButton>
      </Box>

      {/* Filter Content - Slides Down */}
      <Box sx={{ px: 2, opacity: open ? 1 : 0, transition: 'opacity 0.15s ease-in', }} >
        <Collapse in={open}>
          <Box sx={{ px: 2, pb: 2 }}>
            <FilterControls
              appliedFilters={filters}
              onApply={onApply}
              onReset={onReset}
            />
          </Box>
        </Collapse>
      </Box>
    </Box>
  );
}