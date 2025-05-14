from modules.database import Database
from modules.transaction_parser import TransactionParser
from modules.currency_exchange import CurrencyExchange
from datetime import datetime
import os

def get_categories_from_db(db):
    """Get all categories from database and format them for the parser"""
    categories = db.get_all_categories()
    return [category[1] for category in categories]  # Extract category names

def get_sources_from_db(db):
    """Get all sources from database and format them for the parser"""
    sources = db.get_all_sources()
    return [source[1] for source in sources]  # Extract source names

def get_category_id(db, category_name):
    """Get category ID from name"""
    categories = db.get_all_categories()
    for category in categories:
        if category[1].lower() == category_name.lower():
            return category[0]
    return None

def get_source_id(db, source_name):
    """Get source ID from name"""
    sources = db.get_all_sources()
    for source in sources:
        if source[1].lower() == source_name.lower():
            return source[0]
    return None

def add_transaction_to_db(db, transaction, exchange_rate):
    """Add a parsed transaction to the database"""
    # Get category and source IDs
    category_id = get_category_id(db, transaction.category_name)
    source_id = get_source_id(db, transaction.source_name)
    
    # If category or source not found, use "other"
    if category_id is None:
        print(f"Category '{transaction.category_name}' not found, using 'other'")
        category_id = get_category_id(db, "other")
    
    if source_id is None:
        print(f"Source '{transaction.source_name}' not found, using 'other'")
        source_id = get_source_id(db, "other")
    
    # Convert price to USD if needed
    if transaction.is_usd:
        price_in_dollar = transaction.price
        your_currency_rate = 1.0
    else:
        # If in Toman, convert to USD using exchange rate
        price_in_dollar = transaction.price / exchange_rate
        your_currency_rate = exchange_rate
    
    # Add transaction to database
    transaction_id = db.add_transaction(
        name=transaction.name,
        date=transaction.date,
        price_in_dollar=price_in_dollar,
        your_currency_rate=your_currency_rate,
        category_id=category_id,
        source_id=source_id
    )
    
    return transaction_id

def test_transaction_flow():
    """Test the full flow from text parsing to database insertion"""
    # Initialize components
    db = Database()
    exchange = CurrencyExchange()
    
    # Get current exchange rate
    exchange_rate = exchange.get_usd_rate(live=False)
    print(f"Current USD to Toman exchange rate: {exchange_rate:,.0f}")
    
    # Get categories and sources from database
    categories = get_categories_from_db(db)
    sources = get_sources_from_db(db)
    
    # Initialize parser with categories and sources from database
    parser = TransactionParser(
        available_categories=categories,
        available_sources=sources
    )
    
    # Sample transaction texts
    sample_texts = [
        # English examples
        # "I spent 50 dollars on groceries at Walmart yesterday using my bank account",
        "Bought a movie ticket for 15 USD with cash today",
        "Paid 200 dollars for electricity bill from my bank-account last week",
        
        # Farsi/Mixed examples
        "خرید نان به مبلغ ۵۰۰۰۰ تومان از نانوایی محلی با پول نقد",  # Bread purchase for 50000 Toman with cash
        "پرداخت قبض برق به مبلغ ۲۵۰۰۰۰ تومان از حساب بانکی",  # Electricity bill payment for 250000 Toman from bank account
        "خرید لباس به مبلغ ۸۰۰۰۰۰ تومان با کارت بانکی",  # Clothes purchase for 800000 Toman with bank card
    ]
    
    # Process each sample text
    print("\n=== Processing Transactions ===")
    for i, text in enumerate(sample_texts):
        print(f"\n[{i+1}/{len(sample_texts)}] Processing: {text}")
        
        try:
            # Parse the transaction text
            transaction = parser.parse_transaction(text)

            print(transaction)
            input()            
            # Add to database
            transaction_id = add_transaction_to_db(db, transaction, exchange_rate)
            
            # Confirm addition
            print(f"\nTransaction added to database with ID: {transaction_id}")
            
        except Exception as e:
            print(f"Error processing transaction: {e}")
    
    # Display all transactions in database
    print("\n=== All Transactions in Database ===")
    transactions = db.get_all_transactions()
    
    for transaction in transactions:
        # transaction format: (id, name, date, price_in_dollar, your_currency_rate, category_id, source_id)
        print(f"\nID: {transaction[0]}")
        print(f"Name: {transaction[1]}")
        print(f"Date: {transaction[2]}")
        print(f"Price in USD: ${transaction[3]:.2f}")
        print(f"Exchange Rate: {transaction[4]:,.0f}")
        
        # Get category and source names
        category = next((cat for cat in db.get_all_categories() if cat[0] == transaction[5]), None)
        source = next((src for src in db.get_all_sources() if src[0] == transaction[6]), None)
        
        print(f"Category: {category[1] if category else 'Unknown'}")
        print(f"Source: {source[1] if source else 'Unknown'}")
        
        # Calculate local currency amount
        local_amount = transaction[3] * transaction[4]
        print(f"Local Amount: {local_amount:,.0f} Toman")

if __name__ == "__main__":
    test_transaction_flow() 