// frontend/src/components/transactions/TransactionGrid.tsx
import { useMemo, useState } from 'react';
import { Box, Chip, IconButton, Tooltip } from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';

import type { PaginatedResponse, Transaction, EnrichedTransaction } from '@/types';
import { enrichTransactions } from '@/utils/enrichment';
import { formatDisplayDate, formatCurrency } from '@/utils/formatters';


interface TransactionGridProps {
  data: PaginatedResponse<Transaction>;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (transaction: EnrichedTransaction) => void;
  onDelete: (transaction: EnrichedTransaction) => void;
}

function summarizeCategories(categories: string[], max = 3) {
  return {
    visible: categories.slice(0, max),
    hiddenCount: Math.max(0, categories.length - max),
  };
}

export function TransactionGrid({
  data,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
}: TransactionGridProps) {
  const [paginationModel, setPaginationModel] = useState({
    page: page - 1, // MUI DataGrid uses 0-indexed pages
    pageSize,
  });

  // Enrich transactions with metadata
  const enrichedRows = useMemo(() => {
    if (!data) return [];
    return enrichTransactions(
      data.transactions,
      data.cost_centers,
      data.spend_categories
    );
  }, [data.transactions, data.cost_centers, data.spend_categories]);

  // Column definitions
  const columns: GridColDef<EnrichedTransaction>[] = [
    {
      field: 'date',
      headerName: 'Date',
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams<EnrichedTransaction>) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          {formatDisplayDate(params.row.date)}
        </Box>
      ),
    },
    {
      field: 'description',
      headerName: 'Description',
      minWidth: 240,
      sortable: false,
      renderCell: (params) => (
        <Tooltip
          title={params.value || ''}
          slotProps={{
            tooltip: {
              sx: {
                backgroundColor: '#374151',
                fontSize: '0.875rem',
                borderRadius: 2.5,
                px: 1.5,
                py: 1,
              },
            },
          }}
        >
          <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {params.value}
          </Box>
        </Tooltip>
      ),
    },
    {
      field: 'categories',
      headerName: 'Categories',
      minWidth: 240,
      sortable: false,
      renderCell: (params) => {
        const row = params.row;

        const categories = [
          row.cost_center_name,
          ...row.spend_category_names,
        ].filter(Boolean);

        const { visible, hiddenCount } = summarizeCategories(categories, 3);

        return (
          <Tooltip
            title={categories.join(' • ')}
            slotProps={{
              tooltip: {
                sx: {
                  backgroundColor: '#374151',
                  fontSize: '0.875rem',
                  borderRadius: 2.5,
                  px: 1.5,
                  py: 1,
                },
              },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                gap: 0.5,
                alignItems: 'center',
                height: '100%',
              }}
            >
              {visible.map((name, idx) => (
                <Chip
                  key={idx}
                  label={name}
                  sx={{
                    backgroundColor:
                      idx === 0 ? '#fef3c7' : '#c4e2ff',
                    color:
                      idx === 0 ? '#92400e' : '#1f3a5f',
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    height: '24px',
                    '& .MuiChip-label': { px: 1 },
                  }}
                />
              ))}

              {hiddenCount > 0 && (
                <Chip
                  label={`+${hiddenCount}`}
                  sx={{
                    backgroundColor: '#c4e2ff',
                    color: '#1f3a5f',
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    height: '24px',
                    '& .MuiChip-label': { px: 1 },
                  }}
                />
              )}
            </Box>
          </Tooltip>
        );
      },
    },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams<EnrichedTransaction>) => (
        <Box sx={{ fontWeight: 600, color: params.row.amount >= 0 ? '#059669' : '#dc2626' }} >
          {formatCurrency(params.row.amount)}
        </Box>
      ),
    },
    {
      field: 'account',
      headerName: 'Account',
      width: 160,
      sortable: false,
      renderCell: (params) => (
        <Tooltip
          title={params.value || ''}
          slotProps={{
            tooltip: {
              sx: {
                backgroundColor: '#374151',
                fontSize: '0.875rem',
                borderRadius: 2.5,
                px: 1.5,
                py: 1,
              },
            },
          }}
        >
          <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {params.value}
          </Box>
        </Tooltip>
      ),
    },
    {
      field: 'notes',
      headerName: 'Notes',
      minWidth: 160,
      sortable: false,
      renderCell: (params) => (
        <Tooltip
          title={params.value || 'No notes'}
          slotProps={{
            tooltip: {
              sx: {
                backgroundColor: '#374151',
                fontSize: '0.875rem',
                borderRadius: 2.5,
                px: 1.5,
                py: 1,
              },
            },
          }}
        >
          <Box sx={{ color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {params.value || '—'}
          </Box>
        </Tooltip>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      renderCell: (params: GridRenderCellParams<EnrichedTransaction>) => (
        <Box sx={{ height: '100%', gap: 1 }}>
          <IconButton
            onClick={() => onEdit(params.row)}
            sx={{
              color: '#1f3a5f',
              '&:hover': {
                backgroundColor: '#e4effd',
              },
            }}
          >
            <Edit fontSize="small" />
          </IconButton>
          <IconButton
            onClick={() => onDelete(params.row)}
            sx={{
              color: '#ef4444',
              '&:hover': {
                backgroundColor: '#fee9e9',
              },
            }}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ height: '100%' }}>
      <DataGrid
        rows={enrichedRows}
        columns={columns}
        pagination
        paginationMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={(model) => {
          setPaginationModel(model);
          if (model.page !== page - 1) {
            onPageChange(model.page + 1); // Convert back to 1-indexed
          }
          if (model.pageSize !== pageSize) {
            onPageSizeChange(model.pageSize);
          }
        }}
        rowCount={data.total}
        pageSizeOptions={[25, 50, 100]}
        disableRowSelectionOnClick
        disableColumnMenu
        getRowHeight={() => 52}
        sx={{
          border: '1px solid #e2e8f0',
          borderRadius: 2.5,
          '& .MuiDataGrid-cell': {
            cursor: 'default',
          },
          '& .MuiDataGrid-cell:last-of-type': {
            cursor: 'pointer',
          },
          '& .MuiDataGrid-columnHeaders': {
            borderBottom: '1px solid #e2e8f0',
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: '#f9fafb',
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: '1px solid #e2e8f0',
          },
          '& .MuiDataGrid-cell:focus': {
            outline: 'none',
          },
          '& .MuiDataGrid-cell:focus-within': {
            outline: 'none',
          },
          '& .MuiDataGrid-columnHeader:focus': {
            outline: 'none',
          },
          '& .MuiDataGrid-columnHeader:focus-within': {
            outline: 'none',
          },
          '& .MuiDataGrid-scrollbar--vertical': {
            display: 'none',
          },
        }}
      />
    </Box>
  );
}