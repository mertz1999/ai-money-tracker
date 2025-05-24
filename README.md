# <p align="center"><img src="public/img/logo.png" alt="AI Money Tracker Logo" width="120" style="border-radius:50%;"></p>

# AI Money Tracker

## 💸 Effortless, AI-Powered Personal Finance

AI Money Tracker is a modern, open-source personal finance app that helps you track your expenses and income with ease. It features a FastAPI backend, a beautiful web UI, and a powerful Telegram bot—all enhanced by AI for smart transaction parsing and categorization.

---

## 🚀 Features

- **AI-Powered Transaction Parsing**: Add transactions in plain English (e.g., "I spent $20 on groceries") and let AI do the rest.
- **Expense & Income Tracking**: Log, categorize, and review all your financial activity.
- **Multi-Source & Multi-Currency**: Track balances across cash, bank accounts, cards, and more, in USD or Toman.
- **Live Exchange Rates**: Instantly see the latest USD/Toman rates.
- **Modern Web UI**: Responsive, intuitive dashboard with charts, summaries, and quick actions.
- **Telegram Bot Integration**: Add and review transactions, get summaries, and check exchange rates—all from Telegram.
- **Secure & Private**: Your data is yours. All authentication is JWT-based.

---

## 🖥️ Web App

- **Frontend**: HTML, CSS, JavaScript (in `public/`)
- **Backend**: FastAPI (in `main.py`, `routers/`, `modules/`)
- **Database**: SQLite (default, file: `money_tracker.db`)

---

## 🤖 Telegram Bot

- Add transactions, get summaries, and check exchange rates directly from Telegram.
- Supports AI-powered natural language parsing.
- All actions available via glass (inline) buttons for a modern UX.

---

## ⚡ Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/ai-money-tracker.git
cd ai-money-tracker
```

### 2. Install Dependencies
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Set Up Environment Variables
- Copy `.env.example` to `.env` and fill in the required values (see below).
- For the Telegram bot, set `TELEGRAM_BOT_TOKEN` and (optionally) `API_BASE_URL` in `bot/.env`.

### 4. Initialize the Database
```bash
python create_database.py
```

### 5. Run the Backend (Development)
```bash
uvicorn main:app --reload
```

### 6. Run the Telegram Bot
```bash
cd bot
python telegram_bot.py
```

### 7. Open the Web App
- Go to [http://localhost:9000](http://localhost:9000) in your browser.

---

## 🌐 Production Deployment with Nginx

For production, it is recommended to use **Nginx** as a reverse proxy and static file server for the web UI, with FastAPI serving the API only.

- Use the provided `nginx.conf` for configuration.
- Start both FastAPI and Nginx together using the script:

```bash
./start_servers.sh
```

- By default, the UI will be available at [http://localhost:8080](http://localhost:8080) and the API at [http://localhost:9000](http://localhost:9000).

See `NGINX_SETUP.md` for more details and advanced configuration.

---

## 🔑 Environment Variables

- `.env` (project root):
  - `SECRET_KEY` (for JWT)
  - `DATABASE_URL` (optional, default is SQLite)
- `bot/.env`:
  - `TELEGRAM_BOT_TOKEN` (required)
  - `API_BASE_URL` (default: http://localhost:9000)

---

## 📚 API Overview

- `POST   /api/register` — Register a new user
- `POST   /api/token` — Login and get JWT
- `GET    /api/me` — Get current user info
- `GET    /api/categories` — List categories
- `GET    /api/sources` — List sources
- `POST   /api/add_source` — Add a new source
- `GET    /api/transactions` — List all transactions
- `POST   /api/add_transaction` — Add an expense
- `POST   /api/add_income` — Add income
- `POST   /api/parse_transaction` — AI parse a transaction description
- `GET    /api/exchange_rate` — Get latest exchange rate

See `endpoints.md` for full details.

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

- Follow PEP8 and best practices for Python code.
- Keep UI/UX modern and user-friendly.
- All features should be accessible via both the web app and Telegram bot where possible.

---

## 📄 License

This project is licensed under the MIT License.