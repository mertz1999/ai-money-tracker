# AI Money Tracker

A Python-based money tracking system that uses AI to parse transaction information from natural language input and manages financial data with support for multiple currencies.

## Features

- Natural language transaction parsing using OpenRouter API
- Multi-currency support (USD and Toman) with automatic conversion
- SQLite database for storing transactions, categories, and sources
- Transaction categorization and source tracking
- Report generation with charts
- Cached currency exchange rates
- Beautiful web dashboard with Bootstrap
- RESTful API built with FastAPI
- Optional Nginx setup for production deployment

## Project Structure

```
ai-money-tracker/
├── modules/
│   ├── database.py         # Database operations
│   ├── currency_exchange.py # Currency conversion
│   ├── transaction_parser.py # AI-powered transaction parsing
│   └── reports.py          # Report generation
├── routers/
│   ├── categories.py       # Categories endpoints
│   ├── sources.py          # Sources endpoints
│   └── transactions.py     # Transactions endpoints
├── public/                 # Web interface files
│   ├── css/                # CSS stylesheets
│   ├── js/                 # JavaScript files
│   └── index.html          # Main dashboard
├── reports/                # Generated reports and charts
├── main.py                 # FastAPI application with run script
├── nginx.conf              # Nginx configuration for UI
├── start_servers.sh        # Script to start both FastAPI and Nginx
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

## Running the Application

### Option 1: FastAPI only (Development)
Run the FastAPI server:
```bash
python main.py
```
Access the API at http://localhost:9000

### Option 2: Nginx + FastAPI (Recommended for Production)
For a production-like setup with Nginx serving the UI and FastAPI handling only the API:
```bash
./start_servers.sh
```
Access the UI at http://localhost:8080 and the API at http://localhost:9000

For detailed instructions on the Nginx setup, see [NGINX_SETUP.md](NGINX_SETUP.md).

## API Documentation

When running the application, you can access the API documentation at:
- http://localhost:9000/docs (FastAPI only setup)
- http://localhost:8080/docs (Nginx + FastAPI setup)

## Usage

### Web Interface

The web interface provides a beautiful dashboard for managing your finances:

- View your total balance in USD and Toman
- Track your expenses by category
- Manage your sources (bank accounts, cash, etc.)
- Add transactions and income
- Generate reports

The UI interacts directly with the RESTful API endpoints.

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

### API Endpoints

The system provides RESTful API endpoints for integration:

- `GET /api/categories` - Get all categories
- `GET /api/sources` - Get all sources
- `GET /api/transactions` - Get all transactions
- `POST /api/parse_transaction` - Parse transaction text
- `POST /api/add_transaction` - Add a new transaction
- `POST /api/add_income` - Add income
- `POST /api/add_source` - Add a new source

## TODO List

### Core Functionality
- [x] Enhance transaction parsing
  - [x] Add more test cases for text-to-transaction conversion
  - [x] Define and implement input schema validation
  - [x] Improve error handling for malformed inputs
  - [x] Add support for more transaction types

### Database Integration
- [x] Connect transaction parser to database
  - [x] Implement transaction insertion
  - [x] Add transaction validation
  - [x] Create transaction update/delete functionality
- [x] Implement source management
  - [x] Add functionality to add new sources
  - [x] Add functionality to remove sources
  - [x] Add source balance tracking
- [x] Handle income transactions
  - [x] Define income categories
  - [x] Implement income tracking
  - [x] Add income reports

### Transaction Management
- [x] Implement transaction balance updates
  - [x] Add automatic source balance updates
  - [x] Handle currency conversions
  - [x] Add transaction history tracking

### User Interface
- [ ] Create Telegram bot integration
  - [ ] Add command handlers
  - [ ] Implement transaction input via bot
  - [ ] Add report generation commands
  - [ ] Add source management commands
- [x] Develop web interface
  - [x] Create Bootstrap-based HTML pages
  - [x] Implement dashboard
  - [x] Add transaction management interface
  - [x] Add report visualization
  - [x] Add source management interface

### System Improvements
- [x] Migrate from Flask to FastAPI
  - [x] Create FastAPI application
  - [x] Implement Pydantic models
  - [x] Add dependency injection
  - [x] Setup automatic documentation
- [x] Deploy with Nginx
  - [x] Create Nginx configuration
  - [x] Setup static file serving
  - [x] Configure API proxying
- [ ] Make the system more dynamic
  - [ ] Add configuration management
  - [ ] Implement plugin system
  - [ ] Add support for more currencies
  - [x] Create API endpoints
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