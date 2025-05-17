from modules.database import Database
import os

def create_initial_database():
    """Create and initialize the database with common categories and sources"""
    
    # Initialize database
    db = Database()
    
    # Common categories for money tracking
    categories = [
        # Essential categories
        "personal-shopping",        
        "education",
        "gift",
        "travel",
        "subscriptions",
        "other",
        # Business categories
        "business-expense",
        "charity",
        "taxi",
        "income",
        # Undefined category
        "other",
        
    ]
    
    # Common sources for money tracking
    sources = [
        # Cash and bank accounts
        {"name": "bank-account", "bank": True, "usd": False, "value": 200000000},
        {"name": "inhome-save", "bank": False, "usd": True, "value": 500.0},
        
        # Credit and debit cards
        {"name": "zirrat", "bank": True, "usd": True, "value": 1300},
        {"name": "digital-wallet", "bank": False, "usd": True, "value": 1400},
    ]
    
    # Add categories to database
    print("Adding categories...")
    for category in categories:
        try:
            db.add_category(category)
            print(f"Added category: {category}")
        except Exception as e:
            print(f"Error adding category {category}: {e}")
    
    # Add sources to database
    print("\nAdding sources...")
    for source in sources:
        try:
            db.add_source(
                name=source["name"],
                bank=source["bank"],
                usd=source["usd"],
                value=source["value"]
            )
            print(f"Added source: {source['name']}")
        except Exception as e:
            print(f"Error adding source {source['name']}: {e}")
    
    print("\nDatabase initialization completed!")

if __name__ == "__main__":
    # Check if database already exists
    if os.path.exists("money_tracker.db"):
        response = input("Database already exists. Do you want to recreate it? (y/n): ")
        if response.lower() == 'y':
            os.remove("money_tracker.db")
            create_initial_database()
        else:
            print("Database creation cancelled.")
    else:
        create_initial_database() 