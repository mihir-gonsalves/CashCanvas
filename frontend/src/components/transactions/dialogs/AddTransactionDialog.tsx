// frontend/src/components/transactions/dialogs/AddTransactionDialog.tsx
import { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box } from "@mui/material";
import { Add } from "@mui/icons-material";
import { getTodayDateString } from "../../../utils/dateUtils";
import {
  DIALOG_CONFIG,
  BUTTON_TEXT,
  FIELD_LABELS,
  PLACEHOLDERS,
  HELPER_TEXT,
  parseSpendCategories
} from "../../../utils/dialogUtils";
import { layoutStyles, commonStyles } from "../../../styles";
import type { CreateTransactionData } from "../../../hooks/useTransactions";

interface AddTransactionDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (transaction: CreateTransactionData) => void;
  isLoading?: boolean;
}

const INITIAL_STATE: CreateTransactionData = {
  date: getTodayDateString(),
  description: "",
  spend_category_names: [],
  amount: 0,
  account: "",
  notes: "",
};

export function AddTransactionDialog({
  open,
  onClose,
  onSave,
  isLoading = false,
}: AddTransactionDialogProps) {
  const [transaction, setTransaction] = useState<CreateTransactionData>(INITIAL_STATE);
  const [costCenterInput, setCostCenterInput] = useState("");
  const [spendCategoryInput, setSpendCategoryInput] = useState("");

  const handleClose = () => {
    setTransaction(INITIAL_STATE);
    setCostCenterInput("");
    setSpendCategoryInput("");
    onClose();
  };

  const handleSave = () => {
    const finalTransaction: CreateTransactionData = {
      ...transaction,
      cost_center_name: costCenterInput.trim() || undefined,
      spend_category_names: parseSpendCategories(spendCategoryInput),
    };

    onSave(finalTransaction);
    handleClose();
  };

  const handleFieldChange = (field: keyof CreateTransactionData, value: any) => {
    setTransaction(prev => ({ ...prev, [field]: value }));
  };

  const isValid = !!(transaction.description && transaction.account && transaction.amount !== 0);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth={DIALOG_CONFIG.MAX_WIDTH} fullWidth>
      <DialogTitle sx={commonStyles.dialog.title}>
        <Add sx={{ fontSize: 20 }} />
        {BUTTON_TEXT.ADD}
      </DialogTitle>

      <DialogContent sx={commonStyles.dialog.content}>
        <Box sx={layoutStyles.dialogLayout.form}>
          <TextField
            label={FIELD_LABELS.DESCRIPTION}
            value={transaction.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            fullWidth
            required
          />

          <Box sx={layoutStyles.dialogLayout.formRow}>
            <TextField
              label={FIELD_LABELS.AMOUNT}
              type="number"
              value={transaction.amount || ""}
              onChange={(e) => handleFieldChange('amount', Number(e.target.value))}
              fullWidth
              required
              helperText={HELPER_TEXT.AMOUNT}
            />
            <TextField
              label={FIELD_LABELS.ACCOUNT}
              value={transaction.account}
              onChange={(e) => handleFieldChange('account', e.target.value)}
              fullWidth
              required
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
            value={transaction.date}
            onChange={(e) => handleFieldChange('date', e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            required
          />

          <TextField
            label={FIELD_LABELS.NOTES}
            value={transaction.notes}
            onChange={(e) => handleFieldChange('notes', e.target.value)}
            fullWidth
          />
        </Box>
      </DialogContent>

      <DialogActions sx={commonStyles.dialog.actions}>
        <Button onClick={handleClose}>{BUTTON_TEXT.CANCEL}</Button>
        <Button onClick={handleSave} variant="contained" disabled={isLoading || !isValid}>
          {isLoading ? BUTTON_TEXT.ADDING : BUTTON_TEXT.ADD}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
