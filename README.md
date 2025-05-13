# Money Tracker System

A simple money tracking system with SQLite database support and currency exchange functionality. This is the initial version without AI features.

## Project Structure

```
.
├── modules/
│   ├── database.py           # Database module with SQLite implementation
│   └── currency_exchange.py  # Currency exchange module for USD/Toman rates
├── tests/
│   └── test_database.py      # Simple test file to demonstrate database operations
├── requirements.txt          # Project dependencies
└── README.md                # This file
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

## Currency Exchange Module

The `currency_exchange.py` module provides functionality to fetch and cache USD to Toman exchange rates:

- Fetches live rates from tgju.org
- Caches rates for up to 10 hours
- Converts Rial to Toman automatically (divides by 10)
- Provides both live and cached rate options

### Usage Example:
```python
from modules.currency_exchange import CurrencyExchange

# Create an instance
exchange = CurrencyExchange()

# Get cached rate (if available and less than 10 hours old)
cached_rate = exchange.get_usd_rate(live=False)

# Get live rate from website
live_rate = exchange.get_usd_rate(live=True)
```

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

## Dependencies

- SQLite3 (built into Python)
- requests
- beautifulsoup4