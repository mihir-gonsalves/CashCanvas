// frontend/src/components/charts/CostCenterChart.tsx
import { useMemo } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';
import { useItemTooltip, ChartsTooltipContainer } from '@mui/x-charts/ChartsTooltip';

import type { CostCenterSpending } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { getChartColor, formatTooltipValue } from '@/utils/chartHelpers';

interface CostCenterChartProps {
  data: CostCenterSpending[];
}

// Custom Tooltip Content Component
function CustomTooltipContent({
  data,
  totalSpent
}: {
  data: CostCenterSpending[];
  totalSpent: number;
}) {
  const tooltipData = useItemTooltip();

  if (!tooltipData || tooltipData.identifier.dataIndex === undefined) {
    return null;
  }

  const costCenter = data[tooltipData.identifier.dataIndex];
  if (!costCenter) return null;

  const amount = Math.abs(costCenter.expense_total);
  const percentage = ((amount / totalSpent) * 100).toFixed(1);
  const color = getChartColor(tooltipData.identifier.dataIndex);

  return (
    <Paper
      elevation={3}
      sx={{
        px: 1.75,
        py: 1,
        borderRadius: 2.5,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: color,
          }}
        />
        <Typography sx={{ fontSize: '1rem', fontWeight: 600, mr: 2 }}>
          {costCenter.cost_center_name}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Typography sx={{ color: '#dc2626', fontSize: '1rem', fontWeight: 600 }}>
            {formatTooltipValue(amount)}
          </Typography>
          <Typography
            sx={{
              color: '#6b7280',
              fontSize: '1rem',
              fontWeight: 500,
            }}
          >
            {percentage}%
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

// Custom Tooltip Wrapper
function CustomTooltip({
  data,
  totalSpent
}: {
  data: CostCenterSpending[];
  totalSpent: number;
}) {
  return (
    <ChartsTooltipContainer trigger="item">
      <CustomTooltipContent data={data} totalSpent={totalSpent} />
    </ChartsTooltipContainer>
  );
}

export function CostCenterChart({ data }: CostCenterChartProps) {
  const hasData = data && data.length > 0;

  const totalSpent = useMemo(() => {
    if (!hasData) return 0;
    return data.reduce((sum, cc) => sum + Math.abs(cc.expense_total), 0);
  }, [data, hasData]);

  const chartData = useMemo(() => {
    if (!hasData) return [];
    return data.map((cc, index) => ({
      id: cc.cost_center_id,
      label: cc.cost_center_name,
      value: Math.abs(cc.expense_total),
      color: getChartColor(index),
    }));
  }, [data, hasData]);

  // Handle empty state
  if (!hasData) {
    return (
      <Box sx={{ textAlign: 'center', py: 36, color: '#6b7280' }}>
        <Typography variant="body2">No cost center data available.</Typography>
        <Typography variant="body2">Add *expense* transactions or change applied filters.</Typography>
      </Box>
    );
  }

  // Handle all income case
  if (totalSpent === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 36, color: '#6b7280' }}>
        <Typography variant="body2">No cost center data available.</Typography>
        <Typography variant="body2">Add *expense* transactions or change applied filters.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
      <Box sx={{ position: 'relative' }}>
        {/* Pie Chart */}
        <PieChart
          series={[
            {
              data: chartData,
              highlightScope: { fade: 'global', highlight: 'item' },
              faded: { innerRadius: 100, additionalRadius: -10 },
              innerRadius: 110,
              outerRadius: 155,
            },
          ]}
          height={500}
          hideLegend
          slots={{
            tooltip: () => <CustomTooltip data={data} totalSpent={totalSpent} />,
          }}
        />

        {/* Center text showing total */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <Typography variant="h2">
            {formatCurrency(totalSpent)}
          </Typography>
          <Typography variant="h6" sx={{ color: '#6b7280' }}>
            Total Spent
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}