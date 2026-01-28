// frontend/src/components/layout/AppHeader.tsx
import { Box, Typography } from '@mui/material';

export function AppHeader() {
  return (
    <Box component="header" sx={{ p: 2, px: 9, borderBottom: '3px solid #1f3a5f' }} >
      <Typography variant="h2" color="#1f3a5f">
        CashCanvas
      </Typography>
    </Box>
  );
}