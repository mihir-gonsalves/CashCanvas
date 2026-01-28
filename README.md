# CashCanvas

A local-first finance dashboard for visualizing and analyzing spending habits from bank CSV exports.

## Overview

This application helps you track and visualize your personal finances by:
- Importing CSV files from your financial institutions (Discover, Schwab)
- Normalizing transactions into a single database
- Providing analytics and visualizations of your spending patterns
- Allowing manual categorization and editing of transactions
- Exporting data back to CSV for bulk edits

**Key Philosophy**: This is a **visualization and light editing tool**, not a replacement for spreadsheets. Heavy data manipulation should be done in external tools such as Excel. This app maintains high user agency over financial data.

## Features

### Data Management
- Upload CSVs from Discover credit card and Schwab checking
- Upload CashCanvas CSV exports (from this app or manual edits)
- Automatic transaction normalization across institutions
- Manual categorization with cost centers and spend categories
- Individual transaction editing (no bulk edits)
- Export to custom CashCanvas CSV format

### Analytics & Visualization
- Monthly spending totals (for bar charts)
- Spending by cost center (for donut charts)
- Spending by spend category
- Quick stats: total spent, income, cash flow, averages
- All analytics respond to active filters

### Filtering
- Keyword search (description field only)
- Date range filtering
- Amount range filtering
- Filter by cost centers, spend categories, accounts
- Mix and match any combination of filters
- Pagination support (100 items per page, configurable)

## Tech Stack

### Backend (Python/FastAPI)
- **FastAPI** - REST API with automatic validation
- **SQLite** - Local file-based database
- **SQLAlchemy** - ORM for database operations
- **Pydantic** - Request/response validation
- **Uvicorn** - ASGI web server

### Frontend (React/TypeScript)
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Material UI (MUI)** - UI components
- **React Query** - Server state management
- **Axios** - HTTP client

## Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repo-url>
cd finance-tracker
```

2. **Install backend dependencies**
```bash
# Create Virtual Environment (only do this once)
python3 -m venv .venv

# Activate Virtual Environemnt
source .venv/bin/activate

# Install Python dependencies (only do this once)
pip install -r requirements.txt
```

3. **Install frontend dependencies**
```bash
cd frontend
npm install
cd ..
```

### Running the Application

1. **Start the backend** (from project root)
```bash
# Activate Virtual Environemnt
source .venv/bin/activate

# Run FastAPI development server
uvicorn app.main:app --reload
```
Backend runs at: `http://localhost:8000`

2. **Start the frontend** (in a new terminal)
```bash
cd frontend
npm run dev
```
Frontend runs at: `http://localhost:5173`

### Database Initialization
The database is automatically initialized when the backend starts. The file `transactions.db` will be created in the project root.

## CSV Upload Formats

### Supported Institutions

| Institution Code  | Description                   | Notes                         |
|-------------------|-------------------------------|-------------------------------|
| `discover`        | Discover credit card          | Includes default categories   |
| `schwab`          | Schwab checking account       | No categories provided        |
| `cashcanvas`      | Re-importing from this app    | Fully normalized format       |

### Discover Format

**Expected Columns**: `Trans. Date`, `Description`, `Amount`, `Category`

**Example**:
```csv
Trans. Date,Description,Amount,Category
01/15/2026,WHOLE FOODS MARKET,45.23,Groceries
01/16/2026,SHELL OIL,52.00,Gas/Automotive
01/17/2026,NETFLIX.COM,-15.99,Entertainment
```

**Notes**:
- Date format: `MM/DD/YYYY`
- Amount: Positive = expense, Negative = credit/refund
- Category: Maps to Cost Center in database

### Schwab Checking Format

**Expected Columns**: `Date`, `Description`, `Withdrawal`, `Deposit`

**Example**:
```csv
Date,Description,Withdrawal,Deposit
01/15/2026,ACH WITHDRAWAL VENMO,25.00,
01/16/2026,PAYCHECK DEPOSIT,,2500.00
01/17/2026,CHECK 1234,100.00,
```

**Notes**:
- Date format: `MM/DD/YYYY`
- Withdrawal/Deposit: Leave empty if not applicable
- No categories provided (defaults to "Uncategorized")

### Custom CashCanvas Export Format

**Expected Columns**: `Date`, `Description`, `Amount`, `Account`, `Cost Center`, `Spend Categories`, `Notes`

**Example**:
```csv
Date,Description,Amount,Account,Cost Center,Spend Categories,Notes
2026-01-15,Whole Foods Market,-45.23,Discover,Meals,Groceries,Weekly shopping
2026-01-16,Dinner with Sarah,-85.00,Discover,Meals,"Restaurant, Girlfriend",Date night
2026-01-17,Paycheck,2500.00,Schwab Checking,Income,Paycheck,Biweekly salary
```

**Notes**:
- Date format: `YYYY-MM-DD` (ISO format) or `MM/DD/YYYY`
- Amount: Negative = expense, Positive = income
- Spend Categories: Comma-separated list (e.g., `"Restaurant, Girlfriend"`)
- Empty Cost Center or Spend Categories default to "Uncategorized"

## Data Model

### Transaction
Core entity representing a financial transaction.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | Integer | Auto | Primary key |
| date | Date | Yes | Transaction date |
| description | String | Yes | Transaction description (max 200 chars) |
| amount | Float | Yes | Negative = expense, Positive = income |
| account | String | Yes | Account name (e.g., "Discover", "Schwab Checking") |
| notes | String | No | Optional user notes (max 200 chars) |
| cost_center_id | Integer | Yes | Foreign key to Cost Center |

**Relationships**:
- Belongs to one **Cost Center** (required)
- Has many **Spend Categories** (optional, many-to-many)

### Cost Center
Top-level spending bucket (e.g., "Meals", "Transportation", "Entertainment").

| Field | Type | Notes |
|-------|------|-------|
| id | Integer | Primary key |
| name | String | Unique, max 50 chars |

**Examples**: Meals, Gifts, Entertainment, Income, Health & Wellness

### Spend Category
Granular tags for transactions (e.g., "Restaurant", "Groceries", "Nightlife").

| Field | Type | Notes |
|-------|------|-------|
| id | Integer | Primary key |
| name | String | Unique, max 50 chars |

**Examples**: Restaurant, Groceries, Girlfriend, Flowers, Drinks, Friend

### Categorization Examples

**Example 1**: Dinner date
- Description: "The Capital Grille"
- Cost Center: `Meals`
- Spend Categories: `Restaurant`, `Girlfriend`

**Example 2**: Grocery shopping
- Description: "Whole Foods Market"
- Cost Center: `Meals`
- Spend Categories: `Groceries`

**Example 3**: Birthday gift
- Description: "Target"
- Cost Center: `Gifts`
- Spend Categories: `Friend`

**Example 4**: Drinks with friends
- Description: "The Social House"
- Cost Center: `Entertainment`
- Spend Categories: `Drinks`, `Nightlife`

## API Endpoints

### Transactions

#### `POST /transactions/`
Create a new transaction.

**Request Body**:
```json
{
  "date": "2026-01-15",
  "description": "Whole Foods",
  "amount": -45.23,
  "account": "Discover",
  "cost_center_name": "Meals",
  "spend_category_names": ["Groceries"],
  "notes": "Weekly shopping"
}
```

#### `GET /transactions/`
Get all transactions (unfiltered).

#### `GET /transactions/filter?page=1&page_size=100`
Get filtered and paginated transactions.

**Query Parameters**:
- `page` (int, default: 1): Page number
- `page_size` (int, default: 100, max: 1000): Items per page
- `search` (string): Search in description field
- `cost_center_ids` (int[]): Filter by cost center IDs
- `spend_category_ids` (int[]): Filter by spend category IDs
- `account` (string[]): Filter by account names
- `start_date` (date): Start date (inclusive)
- `end_date` (date): End date (inclusive)
- `min_amount` (float): Minimum amount
- `max_amount` (float): Maximum amount

**Response**:
```json
{
  "transactions": [...],
  "cost_centers": [...],
  "spend_categories": [...],
  "page": 1,
  "page_size": 100,
  "total": 523,
  "total_pages": 6
}
```

#### `PUT /transactions/{id}`
Update a transaction.

**Request Body** (all fields optional):
```json
{
  "date": "2026-01-16",
  "amount": -50.00,
  "cost_center_name": "Entertainment"
}
```

#### `DELETE /transactions/{id}`
Delete a transaction.

#### `POST /transactions/upload-csv`
Upload a CSV file.

**Form Data**:
- `institution` (string): "discover", "schwab", or "cashcanvas"
- `file` (file): CSV file (max 10MB)

**Response**:
```json
{
  "message": "Successfully loaded 150 transactions",
  "count": 150,
  "institution": "discover"
}
```

### Analytics

#### `GET /transactions/analytics`
Get analytics for filtered transactions. Supports same filters as `/filter`.

**Response**:
```json
{
  "total_spent": -2345.67,
  "total_income": 5000.00,
  "total_cash": 2654.33,
  "total_transactions": 156,
  "total_cost_centers": 8,
  "total_spend_categories": 15,
  "avg_expense": -42.35,
  "avg_income": 1666.67,
  "monthly_spending": [
    {
      "month": "2026-01",
      "total": 2654.33,
      "expense_total": -2345.67,
      "income_total": 5000.00,
      "transaction_count": 156
    }
  ],
  "cost_center_spending": [
    {
      "cost_center_id": 1,
      "cost_center_name": "Meals",
      "total": -850.50,
      "expense_total": -850.50,
      "income_total": 0.00,
      "transaction_count": 42
    }
  ],
  "spend_category_stats": [...]
}
```

### Metadata

#### `GET /transactions/cost_centers`
Get all cost centers.

#### `GET /transactions/spend_categories`
Get all spend categories.

#### `GET /transactions/accounts`
Get all unique account names.

## Design Decisions

### Why Local-First?
- **Privacy**: Financial data never leaves your machine
- **Simplicity**: No server infrastructure, no authentication, no cloud costs
- **Control**: You own your data and can inspect/backup the SQLite file

### Why SQLite?
- File-based: Easy to backup (just copy `transactions.db`)
- Fast enough for <100K transactions
- Zero configuration
- Perfect for single-user applications

### Why No Bulk Edits in UI?
- **Scope control**: Complex bulk operations are better in Excel
- **User agency**: Users should maintain control over their financial data
- **Export workflow**: Export to CSV → Edit in Excel → Re-import

### Auto-Cleanup of Orphaned Categories
When you delete/update a transaction, unused cost centers and spend categories are automatically removed.

**Why?**: Keeps the database clean and dropdown menus uncluttered.

**Tradeoff**: If a delete operation fails midway, you could lose categories. Acceptable for personal use since you can re-import from CSV backups.

### CSV Upload Validation
If **any** row in a CSV file fails validation, the **entire upload is rejected**. Nothing is saved to the database.

**Why?**: Prevents partial imports and data corruption.

**User Experience**: You get a detailed error message showing exactly which rows failed and why.

## Development

### File Structure
```
├── app/
│   ├── api/
│   │   └── transactions.py     # API endpoints
│   ├── crud/
│   │   └── operations.py       # Database CRUD operations
│   ├── config.py              # Configuration (CORS, etc.)
│   ├── database.py            # Database setup
│   ├── loaders.py             # CSV data loading into DB
│   ├── main.py                # FastAPI app entry point
│   ├── models.py              # SQLAlchemy ORM models
│   ├── parsers.py             # CSV parsing logic
│   └── schemas.py             # Pydantic validation schemas
├── frontend/
│   └── src/
│       ├── api/               # API client
│       ├── components/        # React components
│       ├── hooks/             # Custom hooks
│       └── utils/             # Utility functions
├── transactions.db            # SQLite database (auto-created)
├── requirements.txt           # Python dependencies
└── README.md
```

### Key Principles
1. **Minimalism**: Only build what's needed, avoid feature creep
2. **DRY**: Don't repeat yourself - extract common patterns
3. **Clear boundaries**: Each module has one responsibility
4. **Fail fast**: Validate early, provide clear error messages
5. **User agency**: Users maintain control over their financial data

### Adding a New Institution

1. **Create parser in `app/parsers.py`**:
```python
def load_new_bank_csv(file_path: str):
    """Parse NewBank CSV export."""
    # Your parsing logic here
    return transactions
```

2. **Update router in `parse_csv()`**:
```python
elif institution == "newbank":
    return load_new_bank_csv(file_path)
```

3. **Update documentation** in this README

## Error Handling

### CSV Upload Errors

**Invalid Institution**:
```json
{
  "detail": "Unknown institution: 'chase'. Supported institutions: 'discover', 'schwab', 'cashcanvas'"
}
```

**Validation Errors**:
```json
{
  "detail": "CSV validation failed (3 error(s)):\nRow 2: Date is empty\nRow 5: Invalid currency value: 'abc'\nRow 7: Description is empty"
}
```

**Missing Columns**:
```json
{
  "detail": "CSV file does not look like a Discover export. Missing columns: ['Amount', 'Category']. Found columns: ['Date', 'Desc', 'Total']"
}
```

### API Error Codes
- `400`: Bad request (invalid data, validation errors)
- `404`: Resource not found
- `413`: File too large (>10MB)
- `500`: Server error (database issues, unexpected errors)

## Performance Considerations

### Current Scale
- **Optimized for**: <10,000 transactions
- **Comfortable limit**: ~50,000 transactions
- **Beyond that**: Consider optimizations (see below)

### Future Optimizations (if needed)

**If analytics become slow (>500ms)**:
- Move aggregations to SQL (use `func.sum()`, `func.count()`)
- Add summary tables for pre-computed monthly totals

**If filtering is slow**:
- Add database indexes on frequently filtered columns
- Already indexed: `date`, `account`, `description`, `cost_center_id`

**If frontend becomes sluggish**:
- Already implemented: Pagination (100 items per page)
- Already implemented: Compact transaction format (IDs only)

## Backup & Data Safety

### Backing Up Your Data
Simply copy the `transactions.db` file to a safe location.

```bash
# Backup
cp transactions.db ~/Backups/transactions_2026-01-15.db

# Restore
cp ~/Backups/transactions_2026-01-15.db transactions.db
```

### Export Workflow
1. Export all transactions to CSV via frontend
2. Edit in Excel (bulk operations, fixes, etc.)
3. Re-import via "cashcanvas" institution upload
4. Database is fully rebuilt from CSV

## Troubleshooting

### Backend won't start
- Check Python version: `python --version` (need 3.8+)
- Install dependencies: `pip install -r requirements.txt`
- Check if port 8000 is in use: `lsof -i :8000`

### Frontend won't start
- Check Node version: `node --version` (need 16+)
- Install dependencies: `cd frontend && npm install`
- Check if port 5173 is in use

### CSV upload fails
- Verify institution code: must be exactly "discover", "schwab", or "cashcanvas"
- Check CSV format: headers must match expected format exactly
- Look at error message: shows which rows failed and why

### Database is corrupted
- Restore from backup (see Backup section)
- Or delete `transactions.db` and re-import from CSV exports

## Contributing

This is a personal project, but feedback and suggestions are welcome!

### Code Style
- Python: Follow PEP 8
- TypeScript: Use Prettier for formatting
- Comments: Explain "why", not "what"

## License

MIT License - See LICENSE file for details

## Roadmap

### Completed
- CSV import from Discover and Schwab
- Transaction CRUD operations
- Filtering with pagination
- Analytics computation
- Auto-cleanup of orphaned categories

### Future Enhancements
- Additional bank CSV parsers (Chase, Bank of America, etc.)
- Recurring transaction detection
- Budget tracking and alerts
- Multi-currency support
- Mobile app (React Native)

## Support

For issues, questions, or suggestions:
1. Check this README first
2. Review error messages carefully
3. Open an issue on GitHub (if applicable)

---

**Remember**: This app is a visualization tool, not a replacement for spreadsheets. Maintain your financial data integrity by keeping regular CSV backups!