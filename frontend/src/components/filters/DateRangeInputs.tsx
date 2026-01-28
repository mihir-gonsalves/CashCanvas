// frontend/src/components/filters/DateRangeInputs.tsx
import { Box, TextField } from '@mui/material';

interface DateRangeInputsProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export function DateRangeInputs({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangeInputsProps) {
  return (
    <Box sx={{ display: 'flex', gap: 2.5 }}>
      <TextField
        fullWidth
        size="small"
        type="date"
        label="Start Date"
        value={startDate}
        onChange={(e) => onStartDateChange(e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2.5
          },
        }}
      />
      <TextField
        fullWidth
        size="small"
        type="date"
        label="End Date"
        value={endDate}
        onChange={(e) => onEndDateChange(e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2.5
          },
        }}
      />
    </Box>
  );
}