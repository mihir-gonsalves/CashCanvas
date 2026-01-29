// frontend/src/components/learn/LearnDialog.tsx
import { Dialog, DialogContent, DialogTitle, Box, Typography } from '@mui/material';
import { QuestionMarkRounded } from '@mui/icons-material';

interface LearnDialogProps {
  open: boolean;
  onClose: () => void;
}

export function LearnDialog({ open, onClose }: LearnDialogProps) {
  const info = [
    {
      question: "What is CashCanvas?",
      answer:
        "CashCanvas is an offline personal expense tracker that helps you record transactions, organize them by cost centers and spend categories, and visualize spending habits. It's designed to help you track your day-to-day expenses, not your investments or net worth."
    },
    {
      question: "How do I add a transaction?",
      answer:
        "Click the '+' button in the top-right corner of the main workspace to open the Create Transaction form. Fill in the required fields (date, description, amount, and account), and optionally add a cost center, spend categories, or notes."
    },
    {
      question: "Is there a faster way to add transactions?",
      answer:
        "Yes. You can upload transactions using a .csv exported from your bank. Click the '⋮' button in the top-right corner of the main workspace and select 'Upload a CSV.'"
    },
    {
      question: "Why and how should I export my transactions?",
      answer:
        "CashCanvas runs entirely offline, so your data isn't stored anywhere. If you close the tab without exporting, your data will be lost. To keep a copy, export your transactions as a .csv file by clicking the '⋮' button and selecting 'Export to CSV.' The export includes all transactions and respects any active filters."
    },
    {
      question: "What's the difference between Cost Centers and Spend Categories?",
      answer:
        "Cost Centers are high-level groupings for transactions (e.g., 'Meals' or 'Living Expenses'). Spend Categories provide more detailed tagging, and you can assign multiple categories to a single transaction (e.g., 'Restaurant,' 'Groceries,' 'Rent,' or 'Utilities'). There are no predefined categories, so you can create whatever makes sense to you."
    },
    {
      question: "What do the different views show?",
      answer:
        "Table view displays all transactions in a spreadsheet-style grid. Timeline view shows your balance over time. Monthly view highlights spending by month. The Cost Center Overview breaks down spending by cost center, and Top Spend Categories shows spending by spend category."
    },
    {
      question: "How can I filter specific transactions?",
      answer:
        "Use the Filters panel at the top to combine any and all filters for precise results. All views updated based on the active filters, giving you a more detailed breakdown of your data."
    },
    {
      question: "How do negative and positive amounts work?",
      answer:
        "Negative amounts represent expenses (money going out), while positive amounts represent income (money coming in). For example, enter -45.50 for a $45.50 expense."
    },
    {
      question: "Where can I learn more about budgeting my available cash?",
      answer:
        "Coming Soon."
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 5,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          py: 2.5,
          gap: 1.5,
          fontSize: '1.25rem',
          fontWeight: 500,
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <QuestionMarkRounded fontSize="medium" />
        About CashCanvas
      </DialogTitle>

      <DialogContent sx={{ mx: 1, my: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {info.map((info, index) => (
            <Box key={index}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  mb: 0.5
                }}
              >
                {info.question}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#64748b',
                  lineHeight: 1.6
                }}
              >
                {info.answer}
              </Typography>
            </Box>
          ))}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-around', pt: 3 }}>
          <Typography
            variant="caption"
            sx={{
              color: '#64748b',
              lineHeight: 1.6
            }}
          >
            Made with &#10084;&#65039; by Mihir Gonsalves
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}