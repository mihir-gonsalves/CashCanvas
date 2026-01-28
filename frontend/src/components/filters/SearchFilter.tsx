// frontend/src/components/filters/SearchFilter.tsx
import { TextField } from '@mui/material';

interface SearchFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchFilter({ value, onChange }: SearchFilterProps) {
  return (
    <TextField
      size="small"
      label="Search Descriptions"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 2.5
        },
      }}
    />
  );
}