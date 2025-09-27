import sqlite3
from datetime import datetime
from modules.currency_exchange import CurrencyExchange

class Database:
    def __init__(self, db_name="money_tracker.db"):
        self.db_name = db_name
        self.create_tables()

    def get_connection(self):
        """Get a new connection to the SQLite database"""
        return sqlite3.connect(self.db_name, timeout=20)  # Add timeout parameter
    
    def get_exchange_rate(self):
        """Get the current USD to Toman exchange rate"""
        try:
            exchange = CurrencyExchange()
            rate = exchange.get_usd_rate(live=False)
            return rate if rate is not None else 50000  # Fallback rate
        except Exception as e:
            print(f"Error getting exchange rate: {e}")
            return 50000  # Fallback rate

    def create_tables(self):
        """Create the necessary tables if they don't exist"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Create users table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
            ''')
            
            # Create categories table (without user_id)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS categories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL
                )
            ''')
            
            # Create sources table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS sources (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    bank BOOLEAN NOT NULL,
                    usd BOOLEAN NOT NULL,
                    value REAL NOT NULL,
                    user_id INTEGER NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            ''')
            
            # Create transactions table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS transactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    date TEXT NOT NULL,
                    price_in_dollar REAL NOT NULL,
                    your_currency_rate REAL NOT NULL,
                    category_id INTEGER,
                    source_id INTEGER,
                    is_deposit BOOLEAN NOT NULL DEFAULT FALSE,
                    user_id INTEGER NOT NULL,
                    FOREIGN KEY (category_id) REFERENCES categories (id),
                    FOREIGN KEY (source_id) REFERENCES sources (id),
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            ''')
            
            # Create loans table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS loans (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    total_amount REAL NOT NULL,
                    monthly_payment REAL NOT NULL,
                    interest_rate REAL DEFAULT 0.0,
                    start_date TEXT NOT NULL,
                    end_date TEXT,
                    remaining_amount REAL NOT NULL,
                    is_usd BOOLEAN NOT NULL DEFAULT TRUE,
                    user_id INTEGER NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            ''')
            
            # Create loan payments table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS loan_payments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    loan_id INTEGER NOT NULL,
                    amount REAL NOT NULL,
                    payment_date TEXT NOT NULL,
                    source_id INTEGER NOT NULL,
                    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
                    is_usd BOOLEAN NOT NULL DEFAULT TRUE,
                    user_id INTEGER NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (loan_id) REFERENCES loans (id),
                    FOREIGN KEY (source_id) REFERENCES sources (id),
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            ''')
            
            # Add user_id column if it doesn't exist
            try:
                cursor.execute('ALTER TABLE sources ADD COLUMN user_id INTEGER NOT NULL REFERENCES users(id)')
            except sqlite3.OperationalError:
                pass
                
            try:
                cursor.execute('ALTER TABLE transactions ADD COLUMN user_id INTEGER NOT NULL REFERENCES users(id)')
            except sqlite3.OperationalError:
                pass
                
            conn.commit()

    def add_user(self, username, email, password_hash):
        """Add a new user"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """INSERT INTO users (username, email, password_hash, created_at)
                       VALUES (?, ?, ?, ?)""",
                    (username, email, password_hash, datetime.now().isoformat())
                )
                user_id = cursor.lastrowid
                conn.commit()
                return user_id
        except sqlite3.IntegrityError as e:
            print(f"Database integrity error: {e}")
            return None

    def get_user_by_username(self, username):
        """Get user by username"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
            return cursor.fetchone()

    def get_user_by_email(self, email):
        """Get user by email"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
            return cursor.fetchone()

    def get_user_by_id(self, user_id):
        """Get user by ID"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
            return cursor.fetchone()

    def add_category(self, name, user_id=None):
        """Add a new category (global, not user-specific)"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            try:
                cursor.execute(
                    "INSERT INTO categories (name) VALUES (?)",
                    (name,)
                )
                conn.commit()
                return cursor.lastrowid
            except sqlite3.IntegrityError:
                return None

    def add_source(self, name, bank, usd, value=0.0, user_id=None):
        """Add a new source"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "INSERT INTO sources (name, bank, usd, value, user_id) VALUES (?, ?, ?, ?, ?)",
                    (name, bank, usd, value, user_id)
                )
                conn.commit()
                return cursor.lastrowid
        except sqlite3.IntegrityError:
            return None

    def add_transaction(self, name, date, price_in_dollar, your_currency_rate, category_id, source_id, user_id, is_deposit=False, update_balance=True):
        """Add a new transaction and optionally update source balance"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """INSERT INTO transactions 
                       (name, date, price_in_dollar, your_currency_rate, category_id, source_id, is_deposit, user_id)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                    (name, date, price_in_dollar, your_currency_rate, category_id, source_id, is_deposit, user_id)
                )
                transaction_id = cursor.lastrowid
                conn.commit()
                
                if update_balance:
                    self.update_source_balance(source_id, price_in_dollar, your_currency_rate, is_deposit)
                
                return transaction_id
        except sqlite3.IntegrityError:
            return None
    
    def update_source_balance(self, source_id, amount_in_dollar, your_currency_rate, is_deposit):
        """Update source balance based on transaction amount and type (deposit/expense)"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT usd, value FROM sources WHERE id = ?", (source_id,))
            source = cursor.fetchone()
            if not source:
                return False
            is_usd, current_value = source
            if is_usd:
                delta = amount_in_dollar if is_deposit else -amount_in_dollar
                new_value = current_value + delta
            else:
                amount_in_toman = amount_in_dollar * your_currency_rate
                delta = amount_in_toman if is_deposit else -amount_in_toman
                new_value = current_value + delta

            cursor.execute(
                "UPDATE sources SET value = ? WHERE id = ?",
                (new_value, source_id)
            )
            conn.commit()
            return True

    def add_income(self, name, date, amount, is_usd, your_currency_rate, category_id, source_id):
        """Add income to a source
        
        Args:
            name: Description of the income
            date: Date of the income
            amount: Amount in original currency
            is_usd: Whether the amount is in USD
            your_currency_rate: Exchange rate
            category_id: Category ID
            source_id: Source ID to add income to
        """
        try:
            # Convert amount to USD if needed
            amount_in_dollar = amount if is_usd else amount / your_currency_rate
            
            with self.get_connection() as conn:
                cursor = conn.cursor()
                # Add as a negative transaction (income)
                cursor.execute(
                    """INSERT INTO transactions 
                       (name, date, price_in_dollar, your_currency_rate, category_id, source_id, is_deposit)
                       VALUES (?, ?, ?, ?, ?, ?, ?)""",
                    (name, date, -amount_in_dollar, your_currency_rate, category_id, source_id, True)
                )
                transaction_id = cursor.lastrowid
                conn.commit()
                
                # Update source balance
                self.update_source_income(source_id, amount_in_dollar, your_currency_rate)
                
                return transaction_id
        except sqlite3.IntegrityError:
            return None
    
    def update_source_income(self, source_id, amount_in_dollar, your_currency_rate):
        """Update source balance for income
        
        Args:
            source_id: ID of the source to update
            amount_in_dollar: Income amount in USD
            your_currency_rate: Exchange rate used for the transaction
        """
        # Get source details
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT usd, value FROM sources WHERE id = ?", (source_id,))
            source = cursor.fetchone()
            
            if not source:
                return False
            
            is_usd, current_value = source
            
            # Calculate the amount to add based on currency
            if is_usd:
                # Source is in USD, so directly add amount_in_dollar
                new_value = current_value + amount_in_dollar
            else:
                # Source is in Toman, so convert amount_in_dollar to Toman
                amount_in_toman = amount_in_dollar * your_currency_rate
                new_value = current_value + amount_in_toman
            
            # Update source value
            cursor.execute(
                "UPDATE sources SET value = ? WHERE id = ?",
                (new_value, source_id)
            )
            conn.commit()
            
            return True

    def get_all_categories(self):
        """Get all categories (global, not user-specific)"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM categories")
            return cursor.fetchall()

    def get_all_sources(self, user_id):
        """Get all sources for a user"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM sources WHERE user_id = ?", (user_id,))
            return cursor.fetchall()
    
    def get_sources(self, user_id):
        """Get all sources for a user as dictionaries"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM sources WHERE user_id = ?", (user_id,))
            
            # Convert tuples to dictionaries
            columns = [description[0] for description in cursor.description]
            rows = cursor.fetchall()
            return [dict(zip(columns, row)) for row in rows]

    def get_all_transactions(self, user_id, month=None):
        """Get all transactions for a user, optionally filtered by month"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            if month is not None:
                year = datetime.now().year
                start_date = f"{year}-{month:02d}-01"
                end_date = f"{year}-{month + 1:02d}-01" if month < 12 else f"{year + 1}-01-01"
                
                cursor.execute("""
                    SELECT * FROM transactions 
                    WHERE user_id = ? AND date >= ? AND date < ?
                    ORDER BY date DESC
                """, (user_id, start_date, end_date))
            else:
                cursor.execute(
                    "SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC",
                    (user_id,)
                )
            
            return cursor.fetchall()
    
    def get_transactions_by_month(self, user_id, month, year):
        """Get all transactions for a user for a specific month and year"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            start_date = f"{year}-{month:02d}-01"
            if month == 12:
                end_date = f"{year + 1}-01-01"
            else:
                end_date = f"{year}-{month + 1:02d}-01"
            
            cursor.execute("""
                SELECT t.*, c.name as category, s.name as source
                FROM transactions t
                LEFT JOIN categories c ON t.category_id = c.id
                LEFT JOIN sources s ON t.source_id = s.id
                WHERE t.user_id = ? AND t.date >= ? AND t.date < ?
                ORDER BY t.date DESC
            """, (user_id, start_date, end_date))
            
            # Convert tuples to dictionaries
            columns = [description[0] for description in cursor.description]
            rows = cursor.fetchall()
            return [dict(zip(columns, row)) for row in rows]
    
    def get_source_by_id(self, source_id):
        """Get source by ID"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM sources WHERE id = ?", (source_id,))
            result = cursor.fetchone()
            return result
    
    def get_category_by_id(self, category_id):
        """Get category by ID"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM categories WHERE id = ?", (category_id,))
            result = cursor.fetchone()
            return result
    
    def get_transactions_by_source(self, source_id):
        """Get all transactions for a specific source"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM transactions WHERE source_id = ?", (source_id,))
            result = cursor.fetchall()
            return result
    
    def get_transactions_by_category(self, category_id):
        """Get all transactions for a specific category"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM transactions WHERE category_id = ?", (category_id,))
            result = cursor.fetchall()
            return result
    
    def get_transactions_by_date_range(self, start_date, end_date):
        """Get all transactions within a date range"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM transactions WHERE date BETWEEN ? AND ?",
                (start_date, end_date)
            )
            result = cursor.fetchall()
            return result
    
    def get_transaction_by_id(self, transaction_id):
        """Get a transaction by its ID"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM transactions WHERE id = ?", (transaction_id,))
            return cursor.fetchone()

    def update_transaction(self, transaction_id, name, date, price, is_usd, category_id, source_id, your_currency_rate, is_deposit):
        """Update a transaction by its ID and update the source balance as well"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            # Fetch old transaction data
            cursor.execute("SELECT price_in_dollar, your_currency_rate, source_id, is_deposit FROM transactions WHERE id = ?", (transaction_id,))
            old_tx = cursor.fetchone()
            if not old_tx:
                return False
            old_price, old_rate, old_source_id, old_is_deposit = old_tx
            # Revert old effect (invert is_deposit)
            self.update_source_balance(old_source_id, abs(old_price), old_rate, not old_is_deposit)
            # Update transaction
            cursor.execute(
                """
                UPDATE transactions SET name=?, date=?, price_in_dollar=?, your_currency_rate=?, category_id=?, source_id=?, is_deposit=? WHERE id=?
                """,
                (name, date, price, your_currency_rate, category_id, source_id, is_deposit, transaction_id)
            )
            conn.commit()
            # Apply new effect
            self.update_source_balance(source_id, abs(price), your_currency_rate, is_deposit)
            return cursor.rowcount > 0 

    # Loan management methods
    def add_loan(self, name, total_amount, monthly_payment, is_usd, user_id):
        """Add a new loan"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """INSERT INTO loans 
                       (name, total_amount, monthly_payment, interest_rate, start_date, end_date, remaining_amount, is_usd, user_id, created_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (name, total_amount, monthly_payment, 0.0, datetime.now().isoformat().split('T')[0], None, total_amount, is_usd, user_id, datetime.now().isoformat())
                )
                loan_id = cursor.lastrowid
                conn.commit()
                return loan_id
        except sqlite3.IntegrityError:
            return None

    def get_all_loans(self, user_id):
        """Get all loans for a user"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM loans WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
            return cursor.fetchall()

    def get_loan_by_id(self, loan_id, user_id):
        """Get a loan by ID for a specific user"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM loans WHERE id = ? AND user_id = ?", (loan_id, user_id))
            return cursor.fetchone()

    def update_loan_remaining_amount(self, loan_id, new_remaining_amount):
        """Update the remaining amount for a loan"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE loans SET remaining_amount = ? WHERE id = ?",
                (new_remaining_amount, loan_id)
            )
            conn.commit()
            return cursor.rowcount > 0

    def add_loan_payment(self, loan_id, amount, payment_date, source_id, user_id, is_paid=False, is_usd=True):
        """Add a loan payment"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """INSERT INTO loan_payments 
                       (loan_id, amount, payment_date, source_id, is_paid, is_usd, user_id, created_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                    (loan_id, amount, payment_date, source_id, is_paid, is_usd, user_id, datetime.now().isoformat())
                )
                payment_id = cursor.lastrowid
                conn.commit()
                return payment_id
        except sqlite3.IntegrityError:
            return None

    def get_loan_payments(self, loan_id, user_id):
        """Get all payments for a specific loan"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT lp.*, s.name as source_name 
                FROM loan_payments lp
                LEFT JOIN sources s ON lp.source_id = s.id
                WHERE lp.loan_id = ? AND lp.user_id = ?
                ORDER BY lp.payment_date DESC
            """, (loan_id, user_id))
            return cursor.fetchall()

    def mark_payment_paid(self, payment_id, user_id):
        """Mark a loan payment as paid and update loan remaining amount"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Get payment details
            cursor.execute("""
                SELECT lp.*, l.remaining_amount, l.is_usd 
                FROM loan_payments lp
                JOIN loans l ON lp.loan_id = l.id
                WHERE lp.id = ? AND lp.user_id = ?
            """, (payment_id, user_id))
            payment = cursor.fetchone()
            
            if not payment:
                return False
            
            # Mark payment as paid
            cursor.execute(
                "UPDATE loan_payments SET is_paid = TRUE WHERE id = ?",
                (payment_id,)
            )
            
            # Update loan remaining amount
            new_remaining = payment[6] - payment[2]  # remaining_amount - amount
            cursor.execute(
                "UPDATE loans SET remaining_amount = ? WHERE id = ?",
                (new_remaining, payment[1])  # new_remaining, loan_id
            )
            
            conn.commit()
            return True

    def delete_loan(self, loan_id, user_id):
        """Delete a loan and all its payments"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Delete all payments first
            cursor.execute("DELETE FROM loan_payments WHERE loan_id = ? AND user_id = ?", (loan_id, user_id))
            
            # Delete the loan
            cursor.execute("DELETE FROM loans WHERE id = ? AND user_id = ?", (loan_id, user_id))
            
            conn.commit()
            return cursor.rowcount > 0

    def get_loan_summary(self, user_id):
        """Get loan summary statistics for a user"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_loans,
                    SUM(remaining_amount) as total_remaining,
                    SUM(total_amount) as total_borrowed,
                    AVG(monthly_payment) as avg_monthly_payment
                FROM loans 
                WHERE user_id = ?
            """, (user_id,))
            return cursor.fetchone()



            