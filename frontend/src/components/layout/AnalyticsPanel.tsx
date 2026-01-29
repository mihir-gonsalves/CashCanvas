// frontend/src/components/layout/AnalyticsPanel.tsx
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';
import { DonutLarge, CategoryRounded, AutoAwesomeRounded } from '@mui/icons-material';

import { QuickStats } from '@/components/charts/QuickStats';
import { CostCenterChart } from '@/components/charts/CostCenterChart';
import { SpendCategoryChart } from '@/components/charts/SpendCategoryChart';
import { useAnalytics } from '@/hooks/useAnalytics';
import type { TransactionFilters, AnalyticsPanelView } from '@/types';
import { getErrorMessage } from '@/utils/errors';

interface AnalyticsPanelProps {
  filters: TransactionFilters;
  view: AnalyticsPanelView;
  onViewChange: (view: AnalyticsPanelView) => void;
}

const VIEW_CYCLE: AnalyticsPanelView[] = ['cost-center-overview', 'top-spend-categories', 'quick-stats'];

export function AnalyticsPanel({ filters, view, onViewChange }: AnalyticsPanelProps) {
  const { data, isLoading, isError, error } = useAnalytics(filters);

  const handleCycleView = () => {
    const currentIndex = VIEW_CYCLE.indexOf(view);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % VIEW_CYCLE.length;
    onViewChange(VIEW_CYCLE[nextIndex]);
  };

  const getViewConfig = () => {
    switch (view) {
      case 'cost-center-overview':
        return { label: 'Cost Center Overview', icon: <DonutLarge /> };
      case 'top-spend-categories':
        return { label: 'Top Spend Categories', icon: <CategoryRounded /> };
      case 'quick-stats':
        return { label: 'Quick Stats', icon: <AutoAwesomeRounded /> };
    }
  };

  const viewConfig = getViewConfig();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', p: 4 }}>
      {/* Header with cycling button */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3.5 }}>
        <Button
          variant="text"
          onClick={handleCycleView}
          sx={{
            color: '#1f3a5f',
            textTransform: 'none',
            height: 50,
            borderRadius: 2.5,
            mx: -1,
            '&:hover': {
              color: '#0e2238',
              backgroundColor: 'transparent',
            },
          }}
        >
          {viewConfig.icon}
          <Typography variant="h3" sx={{ ml: 1.5 }}>
            {viewConfig.label}
          </Typography>
        </Button>
      </Box>

      {/* Content area */}
      <Box sx={{ flex: 1 }}>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} sx={{ color: '#1f3a5f' }} />
          </Box>
        )}

        {isError && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <Alert severity="error" sx={{ borderRadius: 2.5 }}>
              Failed to load analytics: {getErrorMessage(error)}
            </Alert>
          </Box>
        )}

        {data && (
          <Box sx={{
            height: 'calc(100vh - 220px)',
            overflowY: view === 'cost-center-overview' ? 'hidden' : 'auto',
            scrollbarWidth: 'none',   // Firefox
            '&::-webkit-scrollbar': {
              display: 'none',        // Chrome, Safari, Edge
            },
          }}>
            {view === 'cost-center-overview' && (
              <CostCenterChart data={data.cost_center_spending} />
            )}

            {view === 'top-spend-categories' && (
              <SpendCategoryChart data={data.spend_category_stats} />
            )}

            {view === 'quick-stats' && (
              <QuickStats data={data} />
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}