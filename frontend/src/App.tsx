// frontend/src/App.tsx - owns layout, filters, which view is selected
import { useState } from 'react';
import { Box, Container, Grid, Paper } from '@mui/material';

import { AnalyticsPanel } from '@/components/layout/AnalyticsPanel';
import { AppHeader } from '@/components/layout/AppHeader';
import { FiltersPanel } from '@/components/layout/FiltersPanel';
import { TransactionWorkspace } from '@/components/layout/TransactionWorkspace';
import type { TransactionFilters, WorkspaceView, AnalyticsPanelView } from '@/types';

function App() {
  // ========================================================================
  // State
  // ========================================================================

  const [appliedFilters, setAppliedFilters] = useState<TransactionFilters>({});
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>('table');
  const [analyticsPanelView, setAnalyticsPanelView] = useState<AnalyticsPanelView>('cost-center-overview');

  // ========================================================================
  // Handlers
  // ========================================================================

  const handleFilterApply = (newFilters: TransactionFilters) => {
    setAppliedFilters(newFilters);
  };

  const handleFilterReset = () => {
    setAppliedFilters({});
  };

  // ========================================================================
  // Layout
  // ========================================================================

  return (
    <>
      {/* Mainland: full-bleed header */}
      <AppHeader />

      {/* Islands: everything below respects page gutters */}
      <Box sx={{ p: 5 }} >

        {/* Filters panel */}
        <Paper sx={{ mb: 5, borderRadius: 5, overflow: 'hidden', boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.16)' }} >
          <FiltersPanel
            open={filtersOpen}
            onToggle={() => setFiltersOpen(!filtersOpen)}
            filters={appliedFilters}
            onApply={handleFilterApply}
            onReset={handleFilterReset}
          />
        </Paper>

        {/* Main content row */}
        <Grid container spacing={5}>
          {/* Workspace (2/3) */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Paper sx={{ borderRadius: 5, overflow: 'hidden', boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.16)' }} >
              <TransactionWorkspace
                filters={appliedFilters}
                view={workspaceView}
                onViewChange={setWorkspaceView}
              />
            </Paper>
          </Grid>

          {/* Analytics (1/3) */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Paper sx={{ borderRadius: 5, overflow: 'hidden', boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.16)' }} >
              <AnalyticsPanel
                filters={appliedFilters}
                view={analyticsPanelView}
                onViewChange={setAnalyticsPanelView}
              />
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </>
  );
}

export default App;