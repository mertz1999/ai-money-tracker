# Project Structure & File Guide

This document describes the directory and file layout of the AI Money Tracker project, with a brief explanation of each part.

---

## Root Directory

| Name                  | Type      | Description                                                                 |
|-----------------------|-----------|-----------------------------------------------------------------------------|
| `main.py`             | Python    | Main FastAPI application entry point. Includes API, CORS, and static serving.|
| `requirements.txt`    | Text      | Python dependencies for the project.                                        |
| `create_database.py`  | Python    | Script to initialize the SQLite database.                                   |
| `money_tracker.db`    | SQLite DB | The main SQLite database file.                                              |
| `currency_cache.json` | JSON      | Cached exchange rate data for currency conversion.                          |
| `endpoints.md`        | Markdown  | Documentation of all API endpoints.                                         |
| `README.md`           | Markdown  | Project overview, setup, and usage instructions.                            |
| `nginx.conf`          | Config    | Nginx configuration for serving the app in production.                      |
| `NGINX_SETUP.md`      | Markdown  | Instructions for setting up Nginx with the app.                             |
| `start_servers.sh`    | Shell     | Script to start both FastAPI and Nginx servers.                             |
| `.env`                | Text      | Environment variables (not committed, for secrets/config).                  |
| `.gitignore`          | Text      | Git ignore rules.                                                          |
| `reports/`            | Folder    | Generated report images (e.g., charts).                                     |
| `tests/`              | Folder    | Automated and manual test scripts.                                          |
| `modules/`            | Folder    | Core backend logic (database, auth, AI, etc).                               |
| `routers/`            | Folder    | FastAPI routers for API endpoints.                                          |
| `public/`             | Folder    | All frontend (web UI) files and static assets.                              |
| `.venv/`              | Folder    | Python virtual environment (dependencies, not committed).                   |

---

## `modules/` — Core Backend Logic

| File/Folder              | Description                                                      |
|--------------------------|------------------------------------------------------------------|
| `database.py`            | Database access and operations (CRUD for users, transactions, etc).|
| `currency_exchange.py`   | Fetches and caches currency exchange rates.                      |
| `transaction_parser.py`  | AI-powered transaction description parser.                       |
| `auth.py`                | Authentication helpers (password hashing, JWT, etc).             |
| `__init__.py`            | (empty/init file)                                                |
| `__pycache__/`           | Python bytecode cache (auto-generated).                          |

---

## `routers/` — API Endpoint Routers

| File/Folder         | Description                                         |
|---------------------|-----------------------------------------------------|
| `transactions.py`   | Endpoints for transactions (CRUD, parsing, etc).    |
| `users.py`          | Endpoints for user registration, login, profile.    |
| `sources.py`        | Endpoints for managing financial sources.           |
| `categories.py`     | Endpoints for managing categories.                  |
| `__init__.py`       | (empty/init file)                                   |
| `__pycache__/`      | Python bytecode cache (auto-generated).             |

---

## `public/` — Frontend (Web UI) & Static Files

| File/Folder         | Description                                         |
|---------------------|-----------------------------------------------------|
| `index.html`        | Main dashboard HTML page.                           |
| `login.html`        | Login page.                                         |
| `register.html`     | Registration page.                                  |
| `js/`               | JavaScript files (main frontend logic).             |
| `css/`              | CSS stylesheets.                                    |
| `img/`              | Images and icons.                                   |
| `components/`       | HTML partials/components (sidebar, modals, etc).    |
| `charts/`           | (Empty or for chart images, if used).               |

### `public/js/`
- `main.js` — Main JavaScript for dashboard interactivity and API calls.

### `public/css/`
- `styles.css` — Main stylesheet for the frontend.

### `public/img/`
- `logo.svg` — App logo.
- `create_logo.html` — (Legacy or test) HTML for generating a logo.

### `public/components/`
- `sidebar.html` — Sidebar navigation component.
- `modals.html` — Modal dialogs (add transaction/source, etc).
- `transactions-table.html` — Table for listing transactions.
- `sources-table.html` — Table for listing sources.
- `summary-cards.html` — Dashboard summary cards.
- `topnav.html` — (Legacy) Top navigation bar.

---

## `tests/` — Test Scripts

| File                        | Description                                 |
|-----------------------------|---------------------------------------------|
| `test_transaction_to_database.py` | Manual/automated test for transaction DB logic. |
| `test_database.py`          | Manual/automated test for database logic.   |
| `__pycache__/`              | Python bytecode cache (auto-generated).     |

---

## `reports/` — Generated Reports

| File                                 | Description                |
|---------------------------------------|----------------------------|
| `sources_chart_20250513_215053.png`   | Example generated chart.   |
| `sources_chart_20250513_214724.png`   | Example generated chart.   |

---

## `.venv/` — Python Virtual Environment

- Contains all installed Python packages and environment-specific files.
- Not committed to version control.

---

If you want a more detailed description of any file or folder, or want to keep this up to date, just update this file as your project evolves. 