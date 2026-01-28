// frontend/src/components/layout/TransactionWorkspace.tsx
import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Menu, MenuItem } from '@mui/material';
import { Add, EqualizerRounded, FileDownload, FileUpload, MoreVert, TableChart, Timeline } from '@mui/icons-material';

import { BalanceTimeline } from '@/components/charts/BalanceTimeline';
import { MonthlySpendingChart } from '@/components/charts/MonthlySpendingChart';
import { DeleteConfirmDialog } from '@/components/transactions/DeleteConfirmDialog';
import { TransactionCreateDialog } from '@/components/transactions/TransactionCreateDialog';
import { TransactionEditDialog } from '@/components/transactions/TransactionEditDialog';
import { TransactionGrid } from '@/components/transactions/TransactionGrid';
import { CSVUploadDialog } from '@/components/upload/CSVUploadDialog';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useCreateTransaction } from '@/hooks/useCreateTransaction';
import { useDeleteTransaction } from '@/hooks/useDeleteTransaction';
import { useTransactions } from '@/hooks/useTransactions';
import { useUpdateTransaction } from '@/hooks/useUpdateTransaction';
import type {
  TransactionFilters,
  WorkspaceView,
  EnrichedTransaction,
  CreateTransactionData,
  UpdateTransactionData,
} from '@/types';
import { getErrorMessage } from '@/utils/errors';
import { fetchAndExportTransactions } from '@/utils/exportUtils';

interface TransactionWorkspaceProps {
  filters: TransactionFilters;
  view: WorkspaceView;
  onViewChange: (view: WorkspaceView) => void;
}

type DialogState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit'; transaction: EnrichedTransaction }
  | { type: 'delete'; transaction: EnrichedTransaction }
  | { type: 'upload' };

const VIEW_CYCLE: WorkspaceView[] = ['table', 'timeline', 'monthly'];

export function TransactionWorkspace({
  filters,
  view,
  onViewChange,
}: TransactionWorkspaceProps) {
  // State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25); // DataGrid MIT version has 100 row limit - charts use separate query for all data
  const [dialogState, setDialogState] = useState<DialogState>({ type: 'none' });
  const [isExporting, setIsExporting] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  // Data queries 
  const { data, isLoading, isError, error } = useTransactions(filters, page, pageSize); // Paginated data for DataGrid (respects 100 row limit)
  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    isError: analyticsError,
    error: analyticsErrorData
  } = useAnalytics(filters);

  // Mutations
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();

  // Effects
  useEffect(() => {
    setPage(1);
  }, [filters]);

  // View helpers
  const getViewConfig = () => {
    switch (view) {
      case 'table':
        return { label: 'Table', icon: <TableChart /> };
      case 'timeline':
        return { label: 'Timeline', icon: <Timeline /> };
      case 'monthly':
        return { label: 'Monthly', icon: <EqualizerRounded /> };
    }
  };

  const handleCycleView = () => {
    const currentIndex = VIEW_CYCLE.indexOf(view);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % VIEW_CYCLE.length;
    onViewChange(VIEW_CYCLE[nextIndex]);
  };

  // Pagination handlers
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1); // Reset when page size changes
  };

  // CRUD handlers
  const handleCreate = (data: CreateTransactionData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setDialogState({ type: 'none' });
      },
    });
  };

  const handleEdit = (transaction: EnrichedTransaction) => {
    updateMutation.reset();
    setDialogState({ type: 'edit', transaction });
  };

  const handleUpdate = (id: number, updates: UpdateTransactionData) => {
    updateMutation.mutate(
      { id, updates },
      {
        onSuccess: () => {
          setDialogState({ type: 'none' });
        },
      }
    );
  };

  const handleDeleteClick = (transaction: EnrichedTransaction) => {
    deleteMutation.reset();
    setDialogState({ type: 'delete', transaction });
  };

  const handleDeleteConfirm = (id: number) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        setDialogState({ type: 'none' });
      },
    });
  };

  // Export handler
  const handleExportCSV = async () => {
    setIsExporting(true);
    setMenuAnchor(null);
    try {
      await fetchAndExportTransactions(filters);
    } catch (error) {
      alert(`Export failed: ${getErrorMessage(error)}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleUploadClick = () => {
    setMenuAnchor(null);
    setDialogState({ type: 'upload' });
  };

  const viewConfig = getViewConfig();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', p: 4 }}>
      {/* Header with view cycling button */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3.5 }}>
        <Button
          variant="outlined"
          onClick={handleCycleView}
          sx={{
            height: 50,
            minWidth: 50,
            padding: 0,
            borderRadius: '50%',
            '&:hover': {
              borderColor: '#0e2238',
              backgroundColor: 'rgba(31, 58, 95, 0.04)',
            },
          }}
        >
          {viewConfig.icon}
        </Button>

        {/* Action buttons */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => {
              createMutation.reset();
              setDialogState({ type: 'create' })
            }}
            sx={{
              height: 50,
              minWidth: 50,
              padding: 0,
              borderRadius: '50%',
              '&:hover': {
                borderColor: '#0e2238',
                backgroundColor: 'rgba(31, 58, 95, 0.04)',
              },
            }}
          >
            <Add />
          </Button>

          <Button
            variant="outlined"
            onClick={handleMenuOpen}
            disabled={isExporting}
            sx={{
              height: 50,
              minWidth: 50,
              padding: 0,
              borderRadius: '50%',
              '&:hover': {
                borderColor: '#0e2238',
                backgroundColor: 'rgba(31, 58, 95, 0.04)',
              },
            }}
          >
            {isExporting ? (
              <CircularProgress size={24} sx={{ color: '#1f3a5f' }} />
            ) : (
              <MoreVert />
            )}
          </Button>

          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={handleMenuClose}
            elevation={2}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            sx={{
              '& .MuiPaper-root': {
                borderRadius: 2.5,
              },
            }}
          >
            <MenuItem onClick={handleUploadClick}>
              <FileUpload sx={{ mr: 1.5 }} />
              Upload a CSV
            </MenuItem>
            <MenuItem onClick={handleExportCSV}>
              <FileDownload sx={{ mr: 1.5 }} />
              Export to CSV
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Content area */}
      <Box sx={{ flex: 1, minHeight: 0 }}>
        {/* Table view loading/error states */}
        {view === 'table' && isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#1f3a5f' }} />
          </Box>
        )}

        {view === 'table' && isError && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <Alert severity="error" sx={{ borderRadius: 2.5 }}>
              Failed to load transactions: {getErrorMessage(error)}
            </Alert>
          </Box>
        )}

        {/* Chart views loading/error states */}
        {(view === 'timeline' || view === 'monthly') && analyticsLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#1f3a5f' }} />
          </Box>
        )}

        {(view === 'timeline' || view === 'monthly') && analyticsError && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <Alert severity="error" sx={{ borderRadius: 2.5 }}>
              Failed to load analytics: {getErrorMessage(analyticsErrorData)}
            </Alert>
          </Box>
        )}

        {/* Table view */}
        {view === 'table' && data && (
          <Box sx={{ height: 'calc(100vh - 220px)' }}>
            <TransactionGrid
              data={data}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={handlePageSizeChange}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          </Box>
        )}

        {/* Timeline view */}
        {view === 'timeline' && analyticsData && (
          <Box sx={{
            height: 'calc(100vh - 220px)',
            p: 3,
            borderRadius: 2.5,
            border: '1px solid #e2e8f0'
          }}>
            <BalanceTimeline data={analyticsData.balance_timeline} />
          </Box>
        )}

        {/* Monthly view */}
        {view === 'monthly' && analyticsData && (
          <Box sx={{
            height: 'calc(100vh - 220px)',
            p: 3,
            borderRadius: 2.5,
            border: '1px solid #e2e8f0',
          }}>
            <MonthlySpendingChart data={analyticsData.monthly_spending} />
          </Box>
        )}
      </Box>

      {/* Dialogs */}
      <TransactionCreateDialog
        open={dialogState.type === 'create'}
        onClose={() => setDialogState({ type: 'none' })}
        onCreate={handleCreate}
        loading={createMutation.isPending}
        error={createMutation.error ?? null}
      />

      <TransactionEditDialog
        open={dialogState.type === 'edit'}
        transaction={dialogState.type === 'edit' ? dialogState.transaction : null}
        onClose={() => setDialogState({ type: 'none' })}
        onSave={handleUpdate}
        loading={updateMutation.isPending}
        error={updateMutation.error ?? null}
      />

      <DeleteConfirmDialog
        open={dialogState.type === 'delete'}
        transaction={dialogState.type === 'delete' ? dialogState.transaction : null}
        onClose={() => setDialogState({ type: 'none' })}
        onConfirm={handleDeleteConfirm}
        loading={deleteMutation.isPending}
        error={deleteMutation.error ?? null}
      />

      <CSVUploadDialog
        open={dialogState.type === 'upload'}
        onClose={() => setDialogState({ type: 'none' })}
      />
    </Box>
  );
}