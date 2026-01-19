// frontend/src/components/transactions/TransactionDataGrid.tsx
import { useMemo } from "react";
import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { Edit, Delete } from "@mui/icons-material";
import { Box, Chip, Typography, Tooltip } from "@mui/material";
import { formatDateString } from "../../utils/dateUtils";
import type { Transaction, SpendCategory } from "../../hooks/useTransactions";
import { layoutStyles, commonStyles, combineStyles } from "../../styles";

// ========================
// TYPE DEFINITIONS
// ========================

interface TransactionDataGridProps {
  transactions: Transaction[];
  isLoading: boolean;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: number) => void;
}

// ========================
// CONSTANTS
// ========================

const COLUMN_WIDTHS = {
  DATE: 120,
  DESCRIPTION: 200,
  CATEGORIES: 300,
  AMOUNT: 120,
  ACCOUNT: 120,
  NOTES: 200,
  ACTIONS: 80,
} as const;

const PAGINATION_CONFIG = {
  PAGE_SIZE: 25,
  PAGE_SIZE_OPTIONS: [25, 50, 100],
} as const;

const MAX_VISIBLE_CATEGORIES = 2;

// ========================
// UTILITY FUNCTIONS
// ========================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Math.abs(amount));
};

// ========================
// CELL RENDERERS
// ========================

function DateCell({ value }: GridRenderCellParams) {
  const formattedDate = formatDateString(value);

  return (
    <Tooltip title={formattedDate} placement="top-start">
      <Typography>{formattedDate}</Typography>
    </Tooltip>
  );
}

function DescriptionCell({ value }: GridRenderCellParams) {
  const description = value as string;

  return (
    <Tooltip title={description} placement="top-start">
      <Typography
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          width: '100%',
        }}
      >
        {description}
      </Typography>
    </Tooltip>
  );
}

function CategoriesCell({ row }: GridRenderCellParams) {
  const transaction = row as Transaction;
  const costCenter = transaction.cost_center;
  const spendCategories: SpendCategory[] = transaction.spend_categories || [];

  // Handle uncategorized transactions
  if (!costCenter && spendCategories.length === 0) {
    return <Chip label="Uncategorized" size="small" sx={commonStyles.chip.default} />;
  }

  // Build category list for tooltip
  const allCategories = [
    ...(costCenter ? [costCenter.name] : []),
    ...spendCategories.map(cat => cat.name)
  ];
  const tooltipText = allCategories.join(', ');

  return (
    <Tooltip title={tooltipText} placement="top-start">
      <Box sx={{
        ...layoutStyles.flex.row,
        gap: 0.75,
        flexWrap: 'nowrap',
        overflow: 'hidden',
        width: '100%',
      }}>
        {/* Cost Center Chip */}
        {costCenter && (
          <Chip
            label={costCenter.name}
            size="small"
            sx={combineStyles(
              commonStyles.chip.default,
              commonStyles.chip.category,
              {
                color: 'secondary.main',
                borderColor: 'secondary.main',
              }
            )}
          />
        )}

        {/* Spend Category Chips (limited) */}
        {spendCategories.slice(0, MAX_VISIBLE_CATEGORIES).map((cat) => (
          <Chip
            key={cat.id}
            label={cat.name}
            size="small"
            sx={combineStyles(
              commonStyles.chip.default,
              commonStyles.chip.category
            )}
          />
        ))}

        {/* Overflow Indicator */}
        {spendCategories.length > MAX_VISIBLE_CATEGORIES && (
          <Chip
            label={`+${spendCategories.length - MAX_VISIBLE_CATEGORIES}`}
            size="small"
            sx={commonStyles.chip.default}
          />
        )}
      </Box>
    </Tooltip>
  );
}

function AmountCell({ value }: GridRenderCellParams) {
  const amount = value as number;
  const isNegative = amount < 0;

  return (
    <Box sx={layoutStyles.flex.row}>
      <Typography
        sx={{
          color: isNegative ? 'error.main' : 'success.main',
          fontWeight: 'medium',
        }}
      >
        {isNegative ? '-' : '+'}{formatCurrency(amount)}
      </Typography>
    </Box>
  );
}

function AccountCell({ value }: GridRenderCellParams) {
  const account = value as string;

  return (
    <Tooltip title={account} placement="top-start">
      <Typography
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          width: '100%',
        }}
      >
        {account}
      </Typography>
    </Tooltip>
  );
}

function NotesCell({ value }: GridRenderCellParams) {
  const notes = value as string;

  return (
    <Tooltip title={notes} placement="top-start">
      <Typography
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          width: '100%',
        }}
      >
        {notes}
      </Typography>
    </Tooltip>
  );
}

// ========================
// MAIN COMPONENT
// ========================

export function TransactionDataGrid({
  transactions,
  isLoading,
  onEdit,
  onDelete,
}: TransactionDataGridProps) {

  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'date',
      headerName: 'Date',
      width: COLUMN_WIDTHS.DATE,
      renderCell: DateCell,
    },
    {
      field: 'description',
      headerName: 'Description',
      width: COLUMN_WIDTHS.DESCRIPTION,
      renderCell: DescriptionCell,
    },
    {
      field: 'categories',
      headerName: 'Categories',
      width: COLUMN_WIDTHS.CATEGORIES,
      renderCell: CategoriesCell,
    },
    {
      field: 'amount',
      headerName: 'Amount',
      width: COLUMN_WIDTHS.AMOUNT,
      renderCell: AmountCell,
    },
    {
      field: 'account',
      headerName: 'Account',
      width: COLUMN_WIDTHS.ACCOUNT,
      renderCell: AccountCell,
    },
    {
      field: 'notes',
      headerName: 'Notes',
      width: COLUMN_WIDTHS.NOTES,
      renderCell: NotesCell,
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: COLUMN_WIDTHS.ACTIONS,
      getActions: (params) => [
        <GridActionsCellItem
          key="edit"
          icon={<Edit sx={{ color: 'primary.main' }} />}
          label="Edit"
          onClick={() => onEdit(params.row)}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<Delete sx={{ color: 'error.main' }} />}
          label="Delete"
          onClick={() => onDelete(params.row.id)}
        />,
      ],
    },
  ], [onEdit, onDelete]);

  return (
    <DataGrid
      rows={transactions}
      columns={columns}
      loading={isLoading}
      pageSizeOptions={PAGINATION_CONFIG.PAGE_SIZE_OPTIONS}
      initialState={{
        pagination: {
          paginationModel: { pageSize: PAGINATION_CONFIG.PAGE_SIZE },
        },
        sorting: {
          sortModel: [{ field: 'date', sort: 'desc' }],
        },
      }}
      sx={layoutStyles.dataDisplay.table}
      disableRowSelectionOnClick
      disableColumnMenu
    />
  );
}
