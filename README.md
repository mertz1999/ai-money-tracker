# Money Tracker System

A simple money tracking system with SQLite database support. This is the initial version without AI features.

## Project Structure

```
.
├── modules/
│   └── database.py    # Database module with SQLite implementation
├── tests/
│   └── test_database.py  # Simple test file to demonstrate database operations
├── requirements.txt   # Project dependencies
└── README.md         # This file
```

## Database Schema

The system uses SQLite3 with three main tables:

1. **Categories**
   - id (INTEGER PRIMARY KEY)
   - name (TEXT)

2. **Sources**
   - id (INTEGER PRIMARY KEY)
   - name (TEXT)
   - bank (BOOLEAN)
   - usd (BOOLEAN)
   - value (REAL)

3. **Transactions**
   - id (INTEGER PRIMARY KEY)
   - name (TEXT)
   - date (TEXT)
   - price_in_dollar (REAL)
   - your_currency_rate (REAL)
   - category_id (INTEGER, FOREIGN KEY)
   - source_id (INTEGER, FOREIGN KEY)

## Setup

1. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running Tests

To run the simple test file:
```bash
python tests/test_database.py
```

This will create a test database and demonstrate basic operations like adding categories, sources, and transactions.