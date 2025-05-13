import sqlite3
from datetime import datetime

class Database:
    def __init__(self, db_name="money_tracker.db"):
        self.db_name = db_name
        self.conn = None
        self.cursor = None
        self.connect()
        self.create_tables()

    def connect(self):
        """Connect to the SQLite database"""
        self.conn = sqlite3.connect(self.db_name)
        self.cursor = self.conn.cursor()

    def create_tables(self):
        """Create the necessary tables if they don't exist"""
        # Create categories table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE
            )
        ''')

        # Create sources table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS sources (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                bank BOOLEAN NOT NULL,
                usd BOOLEAN NOT NULL,
                value REAL NOT NULL DEFAULT 0.0
            )
        ''')

        # Create transactions table
        self.cursor.execute('''
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
        self.conn.commit()

    def add_category(self, name):
        """Add a new category"""
        try:
            self.cursor.execute("INSERT INTO categories (name) VALUES (?)", (name,))
            self.conn.commit()
            return self.cursor.lastrowid
        except sqlite3.IntegrityError:
            return None

    def add_source(self, name, bank, usd, value=0.0):
        """Add a new source"""
        try:
            self.cursor.execute(
                "INSERT INTO sources (name, bank, usd, value) VALUES (?, ?, ?, ?)",
                (name, bank, usd, value)
            )
            self.conn.commit()
            return self.cursor.lastrowid
        except sqlite3.IntegrityError:
            return None

    def add_transaction(self, name, date, price_in_dollar, your_currency_rate, category_id, source_id):
        """Add a new transaction"""
        try:
            self.cursor.execute(
                """INSERT INTO transactions 
                   (name, date, price_in_dollar, your_currency_rate, category_id, source_id)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (name, date, price_in_dollar, your_currency_rate, category_id, source_id)
            )
            self.conn.commit()
            return self.cursor.lastrowid
        except sqlite3.IntegrityError:
            return None

    def get_all_categories(self):
        """Get all categories"""
        self.cursor.execute("SELECT * FROM categories")
        return self.cursor.fetchall()

    def get_all_sources(self):
        """Get all sources"""
        self.cursor.execute("SELECT * FROM sources")
        return self.cursor.fetchall()

    def get_all_transactions(self):
        """Get all transactions"""
        self.cursor.execute("SELECT * FROM transactions")
        return self.cursor.fetchall()

    def close(self):
        """Close the database connection"""
        if self.conn:
            self.conn.close() 