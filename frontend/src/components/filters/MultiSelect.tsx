// frontend/src/components/filters/MultiSelect.tsx - used for cost center, spend category, and account dropdowns
import { Autocomplete, TextField, Chip } from '@mui/material';

export interface MultiSelectOption {
  id: number;
  name: string;
}

interface MultiSelectProps {
  label: string;
  placeholder?: string;
  options: MultiSelectOption[];
  value: number[];
  onChange: (ids: number[]) => void;
  loading?: boolean;
}

export function MultiSelect({
  label,
  placeholder,
  options,
  value,
  onChange,
  loading = false,
}: MultiSelectProps) {
  const selectedOptions = options.filter((opt) => value.includes(opt.id));

  return (
    <Autocomplete
      multiple
      size="small"
      options={options}
      value={selectedOptions}
      loading={loading}
      getOptionLabel={(opt) => opt.name}
      onChange={(_, newValue) => {
        onChange(newValue.map((opt) => opt.id));
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2.5
            },
          }}
        />
      )}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip
            {...getTagProps({ index })}
            key={option.id}
            label={option.name}
            size="small"
            sx={{
              backgroundColor: '#1f3a5f',
              color: '#f5f1e8',
              fontWeight: 500,
              '& .MuiChip-deleteIcon': {
                color: '#f5f1e8',
                '&:hover': {
                  color: '#f5f1e8',
                },
              },
            }}
          />
        ))
      }
    />
  );
}