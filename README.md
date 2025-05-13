# AI Money Tracker

A Python-based money tracking system that helps you manage your finances with AI-powered transaction parsing.

## Features

- **Database Management**: SQLite-based storage for transactions, categories, and sources
- **Currency Exchange**: Real-time and cached currency exchange rates
- **AI Transaction Parsing**: Intelligent transaction information extraction using OpenAI's language models
- **Category and Source Management**: Structured organization of transaction categories and payment sources

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ai-money-tracker.git
cd ai-money-tracker
```

2. Create and activate a virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file with your API keys:
```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_API_BASE=your_openrouter_base_url
OPENAI_MODEL_NAME=your_preferred_model
```

## Modules

### Database Module (`modules/database.py`)
- SQLite database management
- CRUD operations for transactions, categories, and sources
- Efficient data storage and retrieval

### Currency Exchange Module (`modules/currency_exchange.py`)
- Real-time currency exchange rate fetching
- JSON-based rate caching
- Configurable cache duration
- Support for multiple currencies

### Transaction Parser Module (`modules/transaction_parser.py`)
- AI-powered transaction information extraction
- Support for custom categories and sources
- Structured output using Pydantic models
- Intelligent date and amount parsing

#### Usage Example:
```python
from modules.transaction_parser import TransactionParser

# Define available categories and sources
categories = [
    "Groceries",
    "Entertainment",
    "Utilities",
    "Transportation",
    "Shopping",
    "Dining",
    "Healthcare"
]

sources = [
    "Cash",
    "Bank-Account",
    "Credit-Card",
    "USD Account",
    "Debit-Card"
]

# Create parser instance
parser = TransactionParser(
    available_categories=categories,
    available_sources=sources
)

# Parse a transaction
transaction = parser.parse_transaction(
    "I spent 50 dollars on groceries at Walmart yesterday using my bank account"
)

# Access parsed information
print(f"Name: {transaction.name}")
print(f"Date: {transaction.date}")
print(f"Price: ${transaction.price_in_dollar:.2f}")
print(f"Category: {transaction.category_name}")
print(f"Source: {transaction.source_name}")
```

## Development

### Running Tests
```bash
python -m pytest tests/
```

### Code Style
The project follows PEP 8 guidelines. Use a linter to ensure code quality:
```bash
flake8 modules/ tests/
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

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