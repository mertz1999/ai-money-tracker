import sqlite3
from datetime import datetime

class Database:
    def __init__(self, db_name="money_tracker.db"):
        self.db_name = db_name
        self.create_tables()

    def get_connection(self):
        """Get a new connection to the SQLite database"""
        return sqlite3.connect(self.db_name, timeout=20)  # Add timeout parameter

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

            print(is_usd, current_value, amount_in_dollar, is_deposit)
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



            