import sqlite3
from datetime import datetime

class Database:
    def __init__(self, db_name="money_tracker.db"):
        self.db_name = db_name
        self.create_tables()

    def get_connection(self):
        """Get a new connection to the SQLite database"""
        conn = sqlite3.connect(self.db_name)
        return conn

    def create_tables(self):
        """Create the necessary tables if they don't exist"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Create categories table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE
            )
        ''')

        # Create sources table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sources (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                bank BOOLEAN NOT NULL,
                usd BOOLEAN NOT NULL,
                value REAL NOT NULL DEFAULT 0.0
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
                FOREIGN KEY (category_id) REFERENCES categories (id),
                FOREIGN KEY (source_id) REFERENCES sources (id)
            )
        ''')
        conn.commit()
        conn.close()

    def add_category(self, name):
        """Add a new category"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute("INSERT INTO categories (name) VALUES (?)", (name,))
            conn.commit()
            last_id = cursor.lastrowid
            conn.close()
            return last_id
        except sqlite3.IntegrityError:
            return None

    def add_source(self, name, bank, usd, value=0.0):
        """Add a new source"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO sources (name, bank, usd, value) VALUES (?, ?, ?, ?)",
                (name, bank, usd, value)
            )
            conn.commit()
            last_id = cursor.lastrowid
            conn.close()
            return last_id
        except sqlite3.IntegrityError:
            return None

    def add_transaction(self, name, date, price_in_dollar, your_currency_rate, category_id, source_id, update_balance=True):
        """Add a new transaction and optionally update source balance"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute(
                """INSERT INTO transactions 
                   (name, date, price_in_dollar, your_currency_rate, category_id, source_id)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (name, date, price_in_dollar, your_currency_rate, category_id, source_id)
            )
            transaction_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            # Update source balance if requested
            if update_balance:
                self.update_source_balance(source_id, price_in_dollar, your_currency_rate)
                
            return transaction_id
        except sqlite3.IntegrityError:
            return None
    
    def update_source_balance(self, source_id, price_in_dollar, your_currency_rate):
        """Update source balance based on transaction amount
        
        Args:
            source_id: ID of the source to update
            price_in_dollar: Transaction amount in USD
            your_currency_rate: Exchange rate used for the transaction
        """
        # Get source details
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT usd, value FROM sources WHERE id = ?", (source_id,))
        source = cursor.fetchone()
        
        if not source:
            conn.close()
            return False
        
        is_usd, current_value = source
        
        # Calculate the amount to subtract based on currency
        if is_usd:
            # Source is in USD, so directly subtract price_in_dollar
            new_value = current_value - price_in_dollar
        else:
            # Source is in Toman, so convert price_in_dollar to Toman
            price_in_toman = price_in_dollar * your_currency_rate
            new_value = current_value - price_in_toman
        
        # Update source value
        cursor.execute(
            "UPDATE sources SET value = ? WHERE id = ?",
            (new_value, source_id)
        )
        conn.commit()
        conn.close()
        
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
            
            conn = self.get_connection()
            cursor = conn.cursor()
            # Add as a negative transaction (income)
            cursor.execute(
                """INSERT INTO transactions 
                   (name, date, price_in_dollar, your_currency_rate, category_id, source_id)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (name, date, -amount_in_dollar, your_currency_rate, category_id, source_id)
            )
            transaction_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
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
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT usd, value FROM sources WHERE id = ?", (source_id,))
        source = cursor.fetchone()
        
        if not source:
            conn.close()
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
        conn.close()
        
        return True

    def get_all_categories(self):
        """Get all categories"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM categories")
        result = cursor.fetchall()
        conn.close()
        return result

    def get_all_sources(self):
        """Get all sources"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM sources")
        result = cursor.fetchall()
        conn.close()
        return result

    def get_all_transactions(self, month=None):
        """Get all transactions, optionally filtered by month
        
        Args:
            month: Optional month number (1-12). If provided, returns only transactions for that month
                  in the current year.
        """
        conn = self.get_connection()
        cursor = conn.cursor()
        
        if month is not None:
            # Get transactions for the specified month in the current year
            year = datetime.now().year
            start_date = f"{year}-{month:02d}-01"
            
            # Handle the end date for different months
            if month == 12:
                end_date = f"{year + 1}-01-01"
            else:
                end_date = f"{year}-{month + 1:02d}-01"
            
            cursor.execute("""
                SELECT * FROM transactions 
                WHERE date >= ? AND date < ?
                ORDER BY date DESC
            """, (start_date, end_date))
        else:
            cursor.execute("SELECT * FROM transactions ORDER BY date DESC")
        
        result = cursor.fetchall()
        conn.close()
        return result
    
    def get_source_by_id(self, source_id):
        """Get source by ID"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM sources WHERE id = ?", (source_id,))
        result = cursor.fetchone()
        conn.close()
        return result
    
    def get_category_by_id(self, category_id):
        """Get category by ID"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM categories WHERE id = ?", (category_id,))
        result = cursor.fetchone()
        conn.close()
        return result
    
    def get_transactions_by_source(self, source_id):
        """Get all transactions for a specific source"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM transactions WHERE source_id = ?", (source_id,))
        result = cursor.fetchall()
        conn.close()
        return result
    
    def get_transactions_by_category(self, category_id):
        """Get all transactions for a specific category"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM transactions WHERE category_id = ?", (category_id,))
        result = cursor.fetchall()
        conn.close()
        return result
    
    def get_transactions_by_date_range(self, start_date, end_date):
        """Get all transactions within a date range"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM transactions WHERE date BETWEEN ? AND ?",
            (start_date, end_date)
        )
        result = cursor.fetchall()
        conn.close()
        return result 