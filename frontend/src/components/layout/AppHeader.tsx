// frontend/src/components/layout/AppHeader.tsx
import { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { QuestionMarkRounded } from '@mui/icons-material';
import { LearnDialog } from '../learn/LearnDialog';

export function AppHeader() {
  const [learnOpen, setLearnOpen] = useState(false);

  return (
    <>
      <Box
        component="header"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          px: 8,
          borderBottom: '3px solid #1f3a5f'
        }}
      >
        <Typography variant="h1" color="#1f3a5f">
          CashCanvas
        </Typography>
        <Button
          variant="outlined"
          onClick={() => setLearnOpen(true)}
          sx={{
            height: 50,
            minWidth: 50,
            padding: 0,
            borderRadius: '50%',
            '&:hover': {
              borderColor: '#0e2238',
              backgroundColor: 'rgba(31, 58, 95, 0.04)',
            },
          }}
        >
          <QuestionMarkRounded />
        </Button>
      </Box>

      <LearnDialog
        open={learnOpen}
        onClose={() => setLearnOpen(false)}
      />
    </>
  );
}