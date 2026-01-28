// frontend/src/components/filters/AmountRangeFilter.tsx
import { Box, TextField, InputAdornment } from '@mui/material';

interface AmountRangeFilterProps {
  minAmount: string;
  maxAmount: string;
  onMinAmountChange: (value: string) => void;
  onMaxAmountChange: (value: string) => void;
}

export function AmountRangeFilter({
  minAmount,
  maxAmount,
  onMinAmountChange,
  onMaxAmountChange,
}: AmountRangeFilterProps) {
  return (
    <Box sx={{ display: 'flex', gap: 2.5 }}>
      <TextField
        fullWidth
        size="small"
        type="number"
        label="Min Amount"
        value={minAmount}
        onChange={(e) => onMinAmountChange(e.target.value)}
        InputProps={{
          startAdornment: <InputAdornment position="start">$</InputAdornment>,
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2.5
          },
        }}
      />
      <TextField
        fullWidth
        size="small"
        type="number"
        label="Max Amount"
        value={maxAmount}
        onChange={(e) => onMaxAmountChange(e.target.value)}
        InputProps={{
          startAdornment: <InputAdornment position="start">$</InputAdornment>,
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2.5
          },
        }}
      />
    </Box>
  );
}