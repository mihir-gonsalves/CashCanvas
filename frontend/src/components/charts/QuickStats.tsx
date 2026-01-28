// frontend/src/components/charts/QuickStats.tsx
import { Box, Typography, Divider } from '@mui/material';
import { TrendingUpRounded, TrendingDownRounded, AccountBalanceRounded } from "@mui/icons-material";
import type { Analytics } from '@/types';
import { formatCurrency } from '@/utils/formatters';

interface QuickStatsProps {
  data: Analytics;
}

export function QuickStats({ data }: QuickStatsProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Primary Stats */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pb: 1 }}>
        {/* Total Income */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            border: '3px solid #059669',
            borderRadius: 2.5,
            p: 2.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <TrendingUpRounded sx={{ color: '#059669' }} />
            <Typography
              variant="h3"
              sx={{ color: '#059669', fontWeight: 600 }}
            >
              Income
            </Typography>
          </Box>

          <Typography
            variant="h3"
            sx={{ color: '#059669', fontWeight: 600, alignContent: 'center' }}
          >
            {formatCurrency(data.total_income)}
          </Typography>
        </Box>

        {/* Total Spent */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            border: '3px solid #dc2626',
            borderRadius: 2.5,
            p: 2.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <TrendingDownRounded sx={{ color: '#dc2626' }} />
            <Typography
              variant="h3"
              sx={{ color: '#dc2626', fontWeight: 600 }}
            >
              Expenses
            </Typography>
          </Box>

          <Typography
            variant="h3"
            sx={{ color: '#dc2626', fontWeight: 600, alignContent: 'center' }}
          >
            {formatCurrency(Math.abs(data.total_spent))}
          </Typography>
        </Box>

        {/* Net Balance */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            border: '3px solid',
            borderColor: data.total_cash >= 0 ? '#059669' : '#dc2626',
            borderRadius: 2.5,
            p: 2.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AccountBalanceRounded
              sx={{
                color: data.total_cash >= 0 ? '#059669' : '#dc2626'
              }}
            />
            <Typography
              variant="h3"
              sx={{
                color: data.total_cash >= 0 ? '#059669' : '#dc2626',
                fontWeight: 600
              }}
            >
              Balance
            </Typography>
          </Box>

          <Typography
            variant="h3"
            sx={{
              color: data.total_cash >= 0 ? '#059669' : '#dc2626',
              fontWeight: 600,
              alignContent: 'center'
            }}
          >
            {formatCurrency(data.total_cash)}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Averages */}
      <Box sx={{ display: 'flex', flexDirection: 'column', px: 0.5, gap: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            Avg. Income
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#059669' }}>
            {formatCurrency(data.avg_income)}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            Avg. Expense
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#dc2626' }}>
            {formatCurrency(Math.abs(data.avg_expense))}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Secondary Stats */}
      <Box sx={{ display: 'flex', flexDirection: 'column', px: 0.5, gap: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            Cost Centers
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {data.total_cost_centers}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            Spend Categories
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {data.total_spend_categories}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}