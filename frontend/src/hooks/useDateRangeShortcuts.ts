// frontend/src/hooks/useDateRangeShortcuts.ts
import { toIsoDate } from '@/utils/formatters';

interface UseDateRangeShortcutsProps {
  onDateRangeChange?: (start: string, end: string) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export function useDateRangeShortcuts({
  onDateRangeChange,
  onStartDateChange,
  onEndDateChange,
}: UseDateRangeShortcutsProps) {
  const apply = (start: Date, end: Date) => {
    const s = toIsoDate(start);
    const e = toIsoDate(end);

    if (onDateRangeChange) {
      onDateRangeChange(s, e);
    } else {
      onStartDateChange(s);
      onEndDateChange(e);
    }
  };

  return {
    lastNDays: (days: number) => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - days);
      apply(start, end);
    },
    thisMonth: () => {
      const now = new Date();
      apply(
        new Date(now.getFullYear(), now.getMonth(), 1),
        new Date(now.getFullYear(), now.getMonth() + 1, 0)
      );
    },
    lastMonth: () => {
      const now = new Date();
      apply(
        new Date(now.getFullYear(), now.getMonth() - 1, 1),
        new Date(now.getFullYear(), now.getMonth(), 0)
      );
    },
  };
}