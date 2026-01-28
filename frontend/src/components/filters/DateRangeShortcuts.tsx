// frontend/src/components/filters/DateRangeShortcuts.tsx
import { Button, ButtonGroup } from '@mui/material';

import { useDateRangeShortcuts } from '@/hooks/useDateRangeShortcuts';

interface DateRangeShortcutsProps {
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onDateRangeChange?: (start: string, end: string) => void;
}

export function DateRangeShortcuts(props: DateRangeShortcutsProps) {
  const shortcuts = useDateRangeShortcuts(props);

  return (
    <ButtonGroup
      size="small"
      fullWidth
      sx={{
        border: 1,
        borderRadius: 2.5,
        borderColor: 'rgba(0, 0, 0, 0.24)',
        '& .MuiButton-root': {
          border: 'none', // remove default button borders
        },
        '& .MuiButton-root + .MuiButton-root': {
          borderLeft: 1,
          borderColor: 'rgba(0, 0, 0, 0.24)', // inner separators
        },
      }}
    >
      <Button onClick={() => shortcuts.lastNDays(30)}>Last 30d</Button>
      <Button onClick={() => shortcuts.lastNDays(90)}>Last 90d</Button>
      <Button onClick={shortcuts.thisMonth}>This Month</Button>
      <Button onClick={shortcuts.lastMonth}>Last Month</Button>
    </ButtonGroup>
  );
}