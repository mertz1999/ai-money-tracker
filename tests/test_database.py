from modules.database import Database
from datetime import datetime

def test_database_operations():
    # Initialize database
    db = Database("test_money_tracker.db")
    
    try:
        # Test adding categories
        food_category_id = db.add_category("Food")
        transport_category_id = db.add_category("Transport")
        print("Added categories:", db.get_all_categories())

        # Test adding sources
        cash_source_id = db.add_source("Cash", False, False, 100.0)
        bank_source_id = db.add_source("Bank Account", True, False, 5000.0)
        usd_source_id = db.add_source("USD Account", True, True, 1000.0)
        print("Added sources:", db.get_all_sources())

        # Test adding transactions
        today = datetime.now().strftime("%Y-%m-%d")
        transaction1_id = db.add_transaction(
            "Grocery Shopping",
            today,
            50.0,  # price in dollars
            1.0,   # currency rate
            food_category_id,
            cash_source_id
        )

        transaction2_id = db.add_transaction(
            "Bus Fare",
            today,
            2.5,   # price in dollars
            1.0,   # currency rate
            transport_category_id,
            bank_source_id
        )
        print("Added transactions:", db.get_all_transactions())

    finally:
        # Clean up
        db.close()

if __name__ == "__main__":
    test_database_operations() 