// frontend/src/components/transactions/DeleteConfirmDialog.tsx
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography, } from '@mui/material';
import { Delete } from '@mui/icons-material';

import type { EnrichedTransaction } from '@/types';
import { formatDisplayDate, formatCurrency } from '@/utils/formatters';
import { getErrorMessage } from '@/utils/errors';


interface DeleteConfirmDialogProps {
  open: boolean;
  transaction: EnrichedTransaction | null;
  onClose: () => void;
  onConfirm: (id: number) => void;
  loading?: boolean;
  error?: unknown | null;
}

export function DeleteConfirmDialog({
  open,
  transaction,
  onClose,
  onConfirm,
  loading = false,
  error,
}: DeleteConfirmDialogProps) {
  if (!transaction) return null;

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 5,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          borderTop: '3px solid #dc2626',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          py: 2.5,
          gap: 1.5,
          fontSize: '1.25rem',
          fontWeight: 500,
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <Delete sx={{ color: '#dc2626' }} />
        Delete Transaction
      </DialogTitle>

      <DialogContent sx={{ my: 2, overflow: 'hidden' }}>
        {!!error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2.5 }}>
            {getErrorMessage(error)}
          </Alert>
        )}

        <Typography variant="body1" sx={{ px: 1, mt: 1 }}>
          Are you sure you want to delete this transaction?
        </Typography>

        <Box sx={{ mt: 3, p: 2.5, backgroundColor: '#f9fafb', border: '1px solid #e2e8f0', borderRadius: 2.5 }} >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  letterSpacing: '0.05em',
                }}
              >
                Date
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }} >
                {formatDisplayDate(transaction.date)}
              </Typography>
            </Box>

            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  letterSpacing: '0.05em',
                }}
              >
                Description
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }} >
                {transaction.description}
              </Typography>
            </Box>

            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  letterSpacing: '0.05em',
                }}
              >
                Amount
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }} >
                {formatCurrency(transaction.amount)}
              </Typography>
            </Box>

            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  letterSpacing: '0.05em',
                }}
              >
                Account
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }} >
                {transaction.account}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Typography
          variant="body2"
          sx={{
            px: 1,
            mt: 2.5,
            mb: -2.0,
            color: '#6b7280',
            fontSize: '0.875rem',
            fontStyle: 'italic',
          }}
        >
          This action cannot be undone.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1.5, borderTop: '1px solid #e2e8f0' }} >
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={loading}
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
          Cancel
        </Button>
        <Button
          onClick={() => onConfirm(transaction.id)}
          variant="contained"
          disabled={loading}
          sx={{
            borderRadius: 2.5,
            backgroundColor: '#dc2626',
            color: '#ffffff',
            fontWeight: 600,
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#cf1818',
            },
            '&:disabled': {
              backgroundColor: '#e5e7eb',
              color: '#9ca3af',
            },
          }}
        >
          {loading ? <CircularProgress size={20} sx={{ color: '#ffffff' }} /> : 'Delete Transaction'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}