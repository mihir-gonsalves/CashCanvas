// frontend/src/components/charts/SpendCategoryChart.tsx
import { useMemo } from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';

import type { SpendCategoryStats } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { calculatePercentage, getChartColor } from '@/utils/chartHelpers';

interface SpendCategoryChartProps {
  data: SpendCategoryStats[];
}

export function SpendCategoryChart({ data }: SpendCategoryChartProps) {
  const hasData = data && data.length > 0;

  // Memoized total
  const totalSpent = useMemo(() => {
    return data.reduce((sum, cat) => sum + Math.abs(cat.expense_total), 0);
  }, [data]);

  // Memoized + precomputed render data
  const filteredData = useMemo(() => {
    return data
      .map((category) => {
        const amount = Math.abs(category.expense_total);
        const percentage = calculatePercentage(category.expense_total, totalSpent);

        return {
          ...category,
          amount,
          percentage,
        };
      })
      .filter((category) => category.percentage > 1); // don't show categories with % < 1
  }, [data, totalSpent]);

  // Handle empty state
  if (!hasData) {
    return (
      <Box sx={{ textAlign: 'center', py: 36, color: '#6b7280' }}>
        <Typography variant="body2">No spend category data available.</Typography>
        <Typography variant="body2">Add *expense* transactions or change applied filters.</Typography>
      </Box>
    );
  }

  // Handle all-income case
  if (totalSpent === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 36, color: '#6b7280' }}>
        <Typography variant="body2">No spend category data available.</Typography>
        <Typography variant="body2">Add *expense* transactions or change applied filters.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {filteredData.map((category, index) => {
        const color = getChartColor(index);

        return (
          <Box
            key={category.spend_category_id}
            sx={{ px: 1, py: 3, borderTop: index === 0 ? 'none' : '1px solid #e5e7eb' }}
          >
            {/* Category name and amount */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {/* Color indicator circle */}
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: color,
                  }}
                />
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {category.spend_category_name}
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {formatCurrency(category.amount)}
              </Typography>
            </Box>

            {/* Progress bar and percentage */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={category.percentage}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: '#e5e7eb',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: color,
                    },
                  }}
                />
              </Box>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: '#6b7280', minWidth: '45px', textAlign: 'right' }}
              >
                {category.percentage.toFixed(1)}%
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}