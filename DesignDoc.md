# Personal Finance Tracker

## Project Overview

**Local-first personal finance tracker** for visualizing spending habits via CSV imports from financial institutions (Discover, Schwab).

### Core User Workflow
1. Download CSVs from financial institutions
2. Upload via web app (stores in local SQLite)
3. View/edit/delete transactions in paginated table
4. Visualize spending with charts and analytics
5. Apply filters consistently across all views
6. Export transactions to CSV (respects active filters)

### Project Philosophy
- **Minimalism**: Build only what's needed
- **DRY Principle**: No code duplication (excluding inline styling)
- **User agency**: Users control their data; app visualizes it
- **Local-first**: SQLite only, no cloud, no auth
- **Personal use**: Single-user application
- **Clear separation**: Backend aggregates/shapes data; frontend renders/interacts
- **No hover-triggered API calls**: All tooltip data pre-loaded

---

## Backend Architecture (Stable & Complete)

### Tech Stack
- **FastAPI** at `http://localhost:8000`
- **SQLite** (file-based database)
- **SQLAlchemy** (ORM)
- **Pydantic** (validation)

### Data Model
```python
Transaction:
  - id, date, description, amount, account, notes
  - cost_center_id (FK, required)
  - spend_category_ids (M2M, required)
  # Backend auto-creates "Uncategorized" if missing

CostCenter: Top-level buckets (e.g., "Meals", "Gifts")
SpendCategory: Granular tags (e.g., "Restaurant", "Girlfriend")
```

### Key API Endpoints
```
GET  /transactions/filter       # Paginated, filtered transactions
GET  /transactions/analytics    # Pre-aggregated analytics + timeline
GET  /transactions/cost_centers # Metadata
GET  /transactions/spend_categories # Metadata
GET  /transactions/accounts     # Account names
POST /transactions/             # Create
PUT  /transactions/{id}         # Update
DELETE /transactions/{id}       # Delete
POST /transactions/upload-csv   # CSV upload
```

### Critical Backend Guarantees
- **Amounts**: Negative = expense, Positive = income
- **Compact transactions**: IDs only, separate metadata arrays (~40% smaller payload)
- **Pre-sorted arrays**: Frontend NEVER re-sorts
  - `balance_timeline`: date ASC, id ASC
  - `monthly_spending`: month ASC
  - `cost_center_spending`: expense_total DESC
  - `spend_category_stats`: expense_total DESC
- **Tooltip data pre-loaded**: No additional API calls on hover

---

## Frontend Architecture

### Tech Stack (Fixed)
- **React 19** with **TypeScript**
- **Vite** (dev server at `http://localhost:5173`)
- **Material UI (MUI)** for UI components
- **MUI X Data Grid** (MIT version, 100 row limit)
- **MUI X Charts** for bar/donut charts
- **Lightweight Charts** (TradingView) for balance timeline
- **React Query** for server state
- **Axios** for HTTP
- **date-fns** for date formatting
- **react-error-boundary** for error handling

### UI Layout
```
┌─────────────────────────────────────────┐
│ Header: "Personal Finance Tracker"      │
├─────────────────────────────────────────┤
│ Filters Panel (collapsible, pushes down)│
├─────────────────────────────────────────┤
│  Main Workspace (2/3)  │ Analytics (1/3)│
│  - Table View          │ - Cost Centers │
│  - Timeline View       │ - Categories   │
│  - Monthly View        │ - Quick Stats  │
└─────────────────────────────────────────┘
```

**Layout Rules:**
- Filters push content down (no overlay)
- Main: 2/3 width, Analytics: 1/3 width
- Grid layout: `gridTemplateColumns: '2fr 1fr'`
- All styles completed inline, no separate CSS files
- Desktop-only (no mobile optimizations)

---

## Data Fetching Strategy

### Two Separate Queries
1. **`useTransactions(filters, page, pageSize)`** → DataGrid only
   - Server-side pagination (25/50/100 rows)
   - Compact transactions + metadata
   - Query key: `['transactions', filters, page, pageSize]`

2. **`useAnalytics(filters)`** → Charts + Analytics Sidebar
   - Pre-aggregated, chart-ready data
   - Includes balance timeline, monthly spending, cost center/category breakdowns
   - Query key: `['analytics', filters]`

### Why Two Queries?
- DataGrid: Paginated data (respects 100 row MIT limit)
- Charts: Pre-aggregated data (no client-side aggregation)
- Each fetches exactly what it needs
- Backend does heavy lifting

### Per Filter Change
- 2 API calls: `/filter` + `/analytics`
- Changing pages only refetches `/filter`
- **Zero additional calls on hover/tooltips**

---

## State Management

### Server State (React Query)
```typescript
// Queries
useTransactions(filters, page, pageSize) // DataGrid
useAnalytics(filters)                    // Charts/sidebar
useCostCenters()                         // Metadata
useSpendCategories()                     // Metadata
useAccounts()                            // Metadata

// Mutations
useCreateTransaction()
useUpdateTransaction()
useDeleteTransaction()
useUploadCSV() // Phase 5
```

**Invalidation**: After mutations, invalidate `['transactions']` and `['analytics']`

**Caching**:
```typescript
// main.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5,  // 5 min
      gcTime: 1000 * 60 * 5,    // 10 min
      refetchOnMount: true,
    },
  },
});
```

### UI State (React useState)
```typescript
// App.tsx
const [appliedFilters, setAppliedFilters] = useState<TransactionFilters>({});
const [filtersOpen, setFiltersOpen] = useState(false);
const [workspaceView, setWorkspaceView] = useState<WorkspaceView>('table');
const [analyticsPanelView, setAnalyticsPanelView] = useState<AnalyticsPanelView>('cost-center-overview');

// TransactionWorkspace.tsx (owns its pagination)
const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(100);
```

### Enrichment Pattern
```typescript
// Frontend joins compact transactions with metadata once per query
const enrichedRows = useMemo(
  () => enrichTransactions(data.transactions, data.cost_centers, data.spend_categories),
  [data.transactions, data.cost_centers, data.spend_categories] // ← Specific deps
);
```

---

## File Structure

```
frontend/src/
├── styles/
│   ├── theme.ts		# Colors and Typography Constants
│   └── index.ts      	# Barrel export
├── api/
│   └── client.ts   	✅ COMPLETE
├── types/
│   └── index.ts     	✅ COMPLETE
├── hooks/           	✅ COMPLETE
│   ├── useTransactions.ts
│   ├── useAnalytics.ts
│   ├── useCostCenters.ts
│   ├── useSpendCategories.ts
│   ├── useAccounts.ts
│   ├── useDateRangeShortcuts.ts
│   ├── useCreateTransaction.ts
│   ├── useUpdateTransaction.ts
│   ├── useDeleteTransaction.ts
│   └── useUploadCSV.ts         
├── components/
│   ├── layout/          ✅ COMPLETE
│   │   ├── AppHeader.tsx
│   │   ├── FiltersPanel.tsx
│   │   ├── TransactionWorkspace.tsx
│   │   └── AnalyticsPanel.tsx
│   ├── filters/         ✅ COMPLETE
│   │   ├── FilterControls.tsx
│   │   ├── SearchFilter.tsx
│   │   ├── DateRangeInputs.tsx
│   │   ├── DateRangeShortcuts.tsx
│   │   ├── AmountRangeFilter.tsx
│   │   └── MultiSelect.tsx	# contains cost center, spend categories, and account select
│   ├── transactions/    ✅ COMPLETE
│   │   ├── TransactionGrid.tsx
│   │   ├── TransactionEditDialog.tsx
│   │   ├── TransactionCreateDialog.tsx
│   │   └── DeleteConfirmDialog.tsx
│   ├── charts/          ✅ COMPLETE
│   │   ├── BalanceTimeline.tsx
│   │   ├── CostCenterChart.tsx
│   │   ├── MonthlySpendingChart.tsx
│   │   ├── CostCenterChart.tsx
│   │   └── SpendCategoryChart.tsx
│   └── upload/          ✅ COMPLETE
│       └── CSVUploadDialog.tsx
├── utils/		         ✅ COMPLETE
│   ├── formatters.ts    
│   ├── enrichment.ts    
│   ├── errors.ts        
│   ├── exportUtils.ts
│   └── chartHelpers.ts  
├── ErrorFallback.tsx    
├── App.tsx              
└── main.tsx             
```

---

## Implementation Status

### ✅ Phase 0-3: Foundation & Transaction Grid (COMPLETE)
- Type definitions and API client
- React Query setup with proper caching
- Layout components (header, filters, workspace, analytics panel)
- Complete filter system with 4-column grid
- Transaction CRUD with MUI DataGrid
- Dialog state management using discriminated unions
- Analytics foundation with data contracts locked down

**Key Fixes Applied:**
- Enrichment dependencies fixed (specific deps, not entire `data` object)
- DataGrid row height fixed (`52px`, not `'auto'`)
- Pagination moved to `TransactionWorkspace` (owns its state)
- Dialog state refactored (discriminated union, not 4 booleans)
- Mutation errors display in dialogs (not workspace)
- Form reset race condition fixed (MUI `TransitionProps`)

### ✅ Phase 4: Charts & Analytics (COMPLETE)

**Components to Build:**
1. `QuickStats.tsx` - Summary cards (simplest)
2. `SpendCategoryChart.tsx` - MUI Linear Progress bars 
3. `CostCenterChart.tsx` - MUI Pie Chart 
4. `MonthlySpendingChart.tsx` - MUI Bar Chart
5. `BalanceTimeline.tsx` - Lightweight Charts (most complex)

**Helper Utility:**
```typescript
// utils/chartHelpers.ts
formatMonthLabel(month: string)              // "2025-01" → "Jan 2025"
calculatePercentage(value, total)            // Safe percentage calc
formatTooltipValue(value: number)            // Currency for tooltips
getChartColor(index: number)                 // Access chart palette
```

### ✅ Phase 5: CSV Upload & Export (COMPLETE)
- `CSVUploadDialog.tsx` - File upload with institution selector
- `useUploadCSV.ts` - Mutation hook with FormData
- Export CSV button in workspace header
- Integration with existing filter state

---

## Key Technical Decisions

1. **Two separate queries** - Pagination for grid, pre-aggregation for charts
2. **Backend-sorted data** - Frontend never re-sorts analytics
3. **Pre-loaded tooltips** - No hover-triggered API calls
4. **Compact transactions** - IDs only, metadata separate (~40% smaller)
5. **Discriminated unions for dialogs** - Eliminates impossible states
6. **Desktop-only** - No mobile optimizations needed
7. **Fixed DataGrid row height** - Enables virtualization (critical for 1000+ rows)
8. **Memoized enrichment** - Specific dependencies prevent unnecessary re-computation
9. **No over-engineering** - Skip error boundaries, optimistic updates, keyboard shortcuts (not needed for personal project)

---

## Common Patterns

```typescript
// Fetching data
const { data, isLoading, isError, error } = useAnalytics(filters);
if (isLoading) return <CircularProgress />;
if (isError) return <Alert severity="error">{getErrorMessage(error)}</Alert>;

// Enriching transactions
const enriched = useMemo(
  () => enrichTransactions(data.transactions, data.cost_centers, data.spend_categories),
  [data.transactions, data.cost_centers, data.spend_categories]
);

// Formatting values
import { formatDate, formatCurrency } from '@/utils/formatters';
const display = { date: formatDate(txn.date), amount: formatCurrency(txn.amount) };
```

---

## Resources

- [MUI Documentation](https://mui.com/material-ui/)
- [MUI X Charts](https://mui.com/x/react-charts/)
- [Lightweight Charts](https://tradingview.github.io/lightweight-charts/)
- [React Query](https://tanstack.com/query/latest)
- [date-fns](https://date-fns.org/)