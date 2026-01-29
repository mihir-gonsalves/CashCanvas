// frontend/src/components/transactions/TransactionEditDialog.tsx
import { useState, useEffect } from 'react';
import { Alert, Autocomplete, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, TextField, } from '@mui/material';
import { Edit } from '@mui/icons-material';

import { useAccounts } from '@/hooks/useAccounts';
import { useCostCenters } from '@/hooks/useCostCenters';
import { useSpendCategories } from '@/hooks/useSpendCategories';
import type { EnrichedTransaction, UpdateTransactionData } from '@/types';
import { getErrorMessage } from '@/utils/errors';


interface TransactionEditDialogProps {
  open: boolean;
  transaction: EnrichedTransaction | null;
  onClose: () => void;
  onSave: (id: number, updates: UpdateTransactionData) => void;
  loading?: boolean;
  error?: unknown | null;
}

export function TransactionEditDialog({
  open,
  transaction,
  onClose,
  onSave,
  loading = false,
  error,
}: TransactionEditDialogProps) {
  const { data: costCenters = [] } = useCostCenters();
  const { data: spendCategories = [] } = useSpendCategories();
  const { data: accounts = [] } = useAccounts();

  // Form state - store NAMES as strings
  const [formData, setFormData] = useState({
    date: '',
    description: '',
    amount: '',
    account: '',
    cost_center_name: '',
    spend_categories_text: '', // Comma-separated string
    notes: '',
  });

  // Initialize form when transaction changes
  useEffect(() => {
    if (transaction) {
      setFormData({
        date: transaction.date,
        description: transaction.description,
        amount: transaction.amount.toString(),
        account: transaction.account,
        cost_center_name: transaction.cost_center_name === 'Uncategorized'
          ? ''
          : transaction.cost_center_name,
        spend_categories_text: transaction.spend_category_names
          .filter(name => name !== 'Uncategorized')
          .join(', '),
        notes: transaction.notes || '',
      });
    }
  }, [transaction]);

  const handleSave = () => {
    if (!transaction) return;

    // Parse comma-separated spend categories
    const categoryNames = formData.spend_categories_text
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const updates: UpdateTransactionData = {
      date: formData.date,
      description: formData.description,
      amount: parseFloat(formData.amount),
      account: formData.account,
      // Empty string triggers backend's "Uncategorized" default
      cost_center_name: formData.cost_center_name.trim() || '',
      // Empty array triggers backend's "Uncategorized" default
      spend_category_names: categoryNames.length > 0 ? categoryNames : [],
      notes: formData.notes || null,
    };

    onSave(transaction.id, updates);
  };

  // Check if form is valid
  const isValid =
    formData.date &&
    formData.description &&
    formData.amount &&
    formData.account;

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' },
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
        <Edit fontSize="medium" />
        Edit Transaction
      </DialogTitle>

      <DialogContent sx={{ my: 2, overflow: 'hidden' }}>
        {!!error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2.5 }}>
            {getErrorMessage(error)}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Date */}
          <TextField
            fullWidth
            type="date"
            label="Date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            InputLabelProps={{ shrink: true }}
            required
            sx={{ mt: 2, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
          />

          {/* Description */}
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            inputProps={{ maxLength: 200 }}
            placeholder="e.g., Dinner at Italian restaurant"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
          />

          {/* Row: Cost Center | Spend Categories */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {/* Cost Center */}
              <Autocomplete
                freeSolo
                options={costCenters.map(cc => cc.name)}
                value={formData.cost_center_name}
                onChange={(_, newValue) => setFormData({ ...formData, cost_center_name: newValue || '' })}
                onInputChange={(_, newValue) => setFormData({ ...formData, cost_center_name: newValue })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Cost Center"
                    placeholder="e.g., Meals"
                    helperText="Leave CC or SC blank for 'Uncategorized'"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                  />
                )}
              />
            </Box>

            {/* Spend Categories */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Autocomplete
                freeSolo
                options={spendCategories.map(sc => sc.name)}
                value={formData.spend_categories_text}
                onChange={(_, newValue) => {
                  if (newValue && typeof newValue === 'string') {
                    const current = formData.spend_categories_text.trim();
                    const separator = current && !current.endsWith(',') ? ', ' : '';
                    setFormData({ ...formData, spend_categories_text: current + separator + newValue });
                  }
                }}
                onInputChange={(_, newValue) => setFormData({ ...formData, spend_categories_text: newValue })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Spend Categories"
                    placeholder="e.g. Restaurant, Date Night, New York..."
                    helperText="Separate multiple spend categories with commas."
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                  />
                )}
              />
            </Box>
          </Box>

          {/* Row: Amount | Account */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            {/* Amount */}
            <TextField
              type="number"
              label="Amount"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              helperText="Negative for expenses (e.g., -45.50) and Positive for income"
              required
              inputProps={{ step: '0.1' }}
              placeholder="e.g., -45.50"
              sx={{ flex: 1, minWidth: 0, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
            />

            {/* Account */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Autocomplete
                freeSolo
                options={accounts}
                value={formData.account}
                onChange={(_, newValue) => setFormData({ ...formData, account: newValue || '' })}
                onInputChange={(_, newValue) => setFormData({ ...formData, account: newValue })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Account"
                    required
                    placeholder="e.g., Discover, Schwab Checking"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                  />
                )}
              />
            </Box>
          </Box>

          {/* Notes */}
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Notes (Optional)"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            inputProps={{ maxLength: 200 }}
            placeholder="Additional details..."
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1.5, borderTop: '1px solid #e2e8f0', }} >
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
          onClick={handleSave}
          variant="contained"
          disabled={loading || !isValid}
          sx={{
            px: 2,
            borderRadius: 2.5,
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#0e2238',
            },
            '&:disabled': {
              backgroundColor: '#e5e7eb',
              color: '#9ca3af',
            },
          }}
        >
          {loading ? <CircularProgress size={20} sx={{ color: '#ffffff' }} /> : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}