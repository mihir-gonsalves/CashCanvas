// frontend/src/ErrorFallback.tsx
import { Button, Box, Typography } from '@mui/material';
import type { FallbackProps } from 'react-error-boundary';

import { getErrorMessage } from '@/utils/errors';

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <Box
      sx={{
        minHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography variant="h4">
        Something went wrong. Please retry.
      </Typography>

      <Typography variant="body2" sx={{ p: 2 }}>
        {getErrorMessage(error)}
      </Typography>

      <Button variant="contained" onClick={resetErrorBoundary}>
        Try again
      </Button>
    </Box>
  );
}