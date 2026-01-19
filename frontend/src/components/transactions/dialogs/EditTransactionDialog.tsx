// frontend/src/components/transactions/dialogs/EditTransactionDialog.tsx
import { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box } from "@mui/material";
import { Edit } from "@mui/icons-material";
import {
  DIALOG_CONFIG,
  BUTTON_TEXT,
  FIELD_LABELS,
  PLACEHOLDERS,
  HELPER_TEXT,
  parseSpendCategories,
  getCostCenterInput,
  getSpendCategoryInput,
  formatAmountForInput
} from "../../../utils/dialogUtils";
import { layoutStyles, commonStyles } from "../../../styles";
import type { Transaction, UpdateTransactionData } from "../../../hooks/useTransactions";

interface EditTransactionDialogProps {
  open: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onSave: (data: UpdateTransactionData) => void;
  isLoading?: boolean;
}

export function EditTransactionDialog({
  open,
  transaction,
  onClose,
  onSave,
  isLoading = false,
}: EditTransactionDialogProps) {
  const [editData, setEditData] = useState<Partial<Transaction>>({});
  const [costCenterInput, setCostCenterInput] = useState("");
  const [spendCategoryInput, setSpendCategoryInput] = useState("");

  useEffect(() => {
    if (transaction) {
      setEditData(transaction);
      setCostCenterInput(getCostCenterInput(transaction.cost_center));
      setSpendCategoryInput(getSpendCategoryInput(transaction.spend_categories));
    }
  }, [transaction]);

  const handleClose = () => {
    setEditData({});
    setCostCenterInput("");
    setSpendCategoryInput("");
    onClose();
  };

  const handleSave = () => {
    if (!transaction) return;

    const updateData: UpdateTransactionData = {
      id: transaction.id,
      date: editData.date,
      description: editData.description,
      amount: editData.amount,
      account: editData.account,
      cost_center_name: costCenterInput.trim(),
      spend_category_names: parseSpendCategories(spendCategoryInput),
      notes: editData.notes,
    };

    onSave(updateData);
    handleClose();
  };

  const handleFieldChange = (field: keyof Transaction, value: any) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth={DIALOG_CONFIG.MAX_WIDTH} fullWidth>
      <DialogTitle sx={commonStyles.dialog.title}>
        <Edit sx={{ fontSize: 20 }} />
        Edit Transaction
      </DialogTitle>

      <DialogContent sx={commonStyles.dialog.content}>
        <Box sx={layoutStyles.dialogLayout.form}>
          <TextField
            label={FIELD_LABELS.DESCRIPTION}
            value={editData.description || ""}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            fullWidth
          />

          <Box sx={layoutStyles.dialogLayout.formRow}>
            <TextField
              label={FIELD_LABELS.AMOUNT}
              type="number"
              value={formatAmountForInput(editData.amount || "")}
              onChange={(e) => handleFieldChange('amount', Number(e.target.value))}
              fullWidth
            />
            <TextField
              label={FIELD_LABELS.ACCOUNT}
              value={editData.account || ""}
              onChange={(e) => handleFieldChange('account', e.target.value)}
              fullWidth
            />
          </Box>

          <TextField
            label={FIELD_LABELS.COST_CENTER}
            value={costCenterInput}
            onChange={(e) => setCostCenterInput(e.target.value)}
            fullWidth
            placeholder={PLACEHOLDERS.COST_CENTER}
            helperText={HELPER_TEXT.COST_CENTER}
          />

          <TextField
            label={FIELD_LABELS.SPEND_CATEGORIES}
            value={spendCategoryInput}
            onChange={(e) => setSpendCategoryInput(e.target.value)}
            fullWidth
            placeholder={PLACEHOLDERS.SPEND_CATEGORIES}
            helperText={HELPER_TEXT.SPEND_CATEGORIES}
            multiline
            maxRows={3}
          />

          <TextField
            label={FIELD_LABELS.DATE}
            type="date"
            value={editData.date || ""}
            onChange={(e) => handleFieldChange('date', e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label={FIELD_LABELS.NOTES}
            value={editData.notes || ""}
            onChange={(e) => handleFieldChange('notes', e.target.value)}
            fullWidth
          />
        </Box>
      </DialogContent>

      <DialogActions sx={commonStyles.dialog.actions}>
        <Button onClick={handleClose}>{BUTTON_TEXT.CANCEL}</Button>
        <Button onClick={handleSave} variant="contained" disabled={isLoading}>
          {isLoading ? BUTTON_TEXT.LOADING : BUTTON_TEXT.SUBMIT}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
