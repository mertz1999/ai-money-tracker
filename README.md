# AI Money Tracker

A Python-based money tracking system that uses AI to parse transaction information from natural language input and manages financial data with support for multiple currencies.

## Features

- Natural language transaction parsing using OpenRouter API
- Multi-currency support (USD and Toman) with automatic conversion
- SQLite database for storing transactions, categories, and sources
- Transaction categorization and source tracking
- Report generation with charts
- Cached currency exchange rates

## Project Structure

```
ai-money-tracker/
├── modules/
│   ├── database.py         # Database operations
│   ├── currency_exchange.py # Currency conversion
│   ├── transaction_parser.py # AI-powered transaction parsing
│   └── reports.py          # Report generation
├── reports/                # Generated reports and charts
├── .env                    # Environment variables
├── requirements.txt        # Project dependencies
└── create_database.py      # Database initialization
```

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Create a `.env` file with your API keys:
   ```
   OPENROUTER_API_KEY=your_api_key_here
   OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
   OPENROUTER_MODEL=gpt-3.5-turbo
   ```
4. Initialize the database:
   ```bash
   python create_database.py
   ```

## Usage

### Transaction Parsing
```python
from modules.transaction_parser import TransactionParser

parser = TransactionParser()
transaction = parser.parse_transaction("I spent 50 dollars on groceries at Walmart")
print(transaction)
```

### Reports
```python
from modules.reports import Reports

reports = Reports()
report = reports.generate_sources_report()
print(report)
```

## TODO List

### Core Functionality
- [ ] Enhance transaction parsing
  - [ ] Add more test cases for text-to-transaction conversion
  - [ ] Define and implement input schema validation
  - [ ] Improve error handling for malformed inputs
  - [ ] Add support for more transaction types

### Database Integration
- [ ] Connect transaction parser to database
  - [ ] Implement transaction insertion
  - [ ] Add transaction validation
  - [ ] Create transaction update/delete functionality
- [ ] Implement source management
  - [ ] Add functionality to add new sources
  - [ ] Add functionality to remove sources
  - [ ] Add source balance tracking
- [ ] Handle income transactions
  - [ ] Define income categories
  - [ ] Implement income tracking
  - [ ] Add income reports

### Transaction Management
- [ ] Implement transaction balance updates
  - [ ] Add automatic source balance updates
  - [ ] Handle currency conversions
  - [ ] Add transaction history tracking

### User Interface
- [ ] Create Telegram bot integration
  - [ ] Add command handlers
  - [ ] Implement transaction input via bot
  - [ ] Add report generation commands
  - [ ] Add source management commands
- [ ] Develop web interface
  - [ ] Create Bootstrap-based HTML pages
  - [ ] Implement dashboard
  - [ ] Add transaction management interface
  - [ ] Add report visualization
  - [ ] Add source management interface

### System Improvements
- [ ] Make the system more dynamic
  - [ ] Add configuration management
  - [ ] Implement plugin system
  - [ ] Add support for more currencies
  - [ ] Create API endpoints
  - [ ] Add user authentication
  - [ ] Implement data backup/restore

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.