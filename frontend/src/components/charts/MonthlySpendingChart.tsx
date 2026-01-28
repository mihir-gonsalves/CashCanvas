// frontend/src/components/charts/MonthlySpendingChart.tsx
import { useMemo } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { ChartsReferenceLine } from '@mui/x-charts/ChartsReferenceLine';
import { useItemTooltip, ChartsTooltipContainer } from '@mui/x-charts/ChartsTooltip';

import type { MonthlySpending } from '@/types';
import {
  formatMonthLabel,
  formatTooltipValue,
  CHART_PALETTE,
  calculateAverageExpense
} from '@/utils/chartHelpers';

interface MonthlySpendingChartProps {
  data: MonthlySpending[];
}

// Custom Tooltip Content Component
function CustomTooltipContent({
  data
}: {
  data: MonthlySpending[]
}) {
  const tooltipData = useItemTooltip();

  if (!tooltipData || tooltipData.identifier.dataIndex === undefined) {
    return null;
  }

  const monthData = data[tooltipData.identifier.dataIndex];
  if (!monthData) return null;

  const total = Math.abs(monthData.expense_total);

  // Sort cost centers by amount (descending)
  const costCenters = Object.entries(monthData.by_cost_center)
    .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a));

  return (
    <Paper
      elevation={3}
      sx={{
        px: 1.75,
        py: 1,
        borderRadius: 2.5,
        minWidth: 220
      }}
    >
      {/* Header: Month and Total */}
      <Box sx={{ borderBottom: '1px solid #e2e8f0', mb: 1.5 }}>
        <Box sx={{ display: 'flex', mb: 1 }}>
          <Typography sx={{ fontSize: '1rem', fontWeight: 600 }}>
            {formatMonthLabel(monthData.month)}
          </Typography>

          <Typography sx={{ color: '#dc2626', fontSize: '1rem', fontWeight: 600, ml: 'auto' }}>
            {formatTooltipValue(total)}
          </Typography>
        </Box>
      </Box>

      {/* Cost Center Breakdown */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {costCenters.map(([name, amount], index) => (
          <Box
            key={name}
            sx={{ display: 'flex', gap: 5 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: CHART_PALETTE[index % CHART_PALETTE.length],
                }}
              />
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                {name}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 500, ml: 'auto' }}>
              {formatTooltipValue(Math.abs(amount))}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

// Custom Tooltip Wrapper
function CustomTooltip({ data }: { data: MonthlySpending[] }) {
  return (
    <ChartsTooltipContainer trigger="item">
      <CustomTooltipContent data={data} />
    </ChartsTooltipContainer>
  );
}

export function MonthlySpendingChart({ data }: MonthlySpendingChartProps) {
  const hasData = data && data.length > 0;

  const totalSpent = useMemo(() => {
    if (!hasData) return 0;
    return data.reduce(
      (sum, m) => sum + Math.abs(m.expense_total),
      0
    );
  }, [data, hasData]);

  // Memoized x-axis labels
  const xAxisData = useMemo(
    () => data.map((m) => formatMonthLabel(m.month)),
    [data]
  );

  // Memoized bar values
  const seriesData = useMemo(
    () => data.map((m) => Math.abs(m.expense_total)),
    [data]
  );

  // Memoized average reference line
  const average = useMemo(
    () => calculateAverageExpense(data),
    [data]
  );

  // Simple value formatter for the bars
  const valueFormatter = (value: number | null) => {
    if (value === null) return '';
    return formatTooltipValue(value);
  };

  // Handle empty state
  if (!hasData) {
    return (
      <Box sx={{ textAlign: 'center', py: 33, color: '#6b7280' }}>
        <Typography variant="body2">No monthly spending data available.</Typography>
        <Typography variant="body2">Add *expense* transactions or change applied filters.</Typography>
      </Box>
    );
  }

  // Handle all income case
  if (totalSpent === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 36, color: '#6b7280' }}>
        <Typography variant="body2">No monthly spending data available.</Typography>
        <Typography variant="body2">Add *expense* transactions or change applied filters.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%' }}>
      <BarChart
        xAxis={[
          {
            scaleType: 'band',
            data: xAxisData,
            colorMap: {
              type: 'ordinal',
              colors: CHART_PALETTE,
            },
            tickLabelStyle: {
              fontSize: 12,
              fill: '#6b7280',
            },
          },
        ]}
        yAxis={[
          {
            tickLabelStyle: {
              fontSize: 12,
              fill: '#6b7280',
            },
          },
        ]}
        series={[
          {
            data: seriesData,
            valueFormatter,
          },
        ]}
        slots={{
          tooltip: () => <CustomTooltip data={data} />,
        }}
        hideLegend
      >
        <ChartsReferenceLine
          y={average}
          label={"Avg: " + formatTooltipValue(average)}
          labelAlign="start"
          lineStyle={{
            strokeDasharray: '10 10',
            strokeWidth: 1.5,
          }}
          labelStyle={{
            fontSize: 12,
            fontWeight: 600,
          }}
        />
      </BarChart>
    </Box>
  );
}