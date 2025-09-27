#!/usr/bin/env python3
"""
Script to fix any issues with the loans database table
"""

import sqlite3
from datetime import datetime

def fix_loans_database():
    """Fix any data type issues in the loans table"""
    db_path = "money_tracker.db"
    
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        
        # Check current data
        cursor.execute("SELECT id, name, created_at FROM loans LIMIT 5")
        loans = cursor.fetchall()
        
        print("Current loans data:")
        for loan in loans:
            print(f"ID: {loan[0]}, Name: {loan[1]}, Created_at: {loan[2]} (type: {type(loan[2])})")
        
        # Check if there are any loans with integer created_at
        cursor.execute("SELECT id, created_at FROM loans WHERE typeof(created_at) = 'integer'")
        problematic_loans = cursor.fetchall()
        
        if problematic_loans:
            print(f"\nFound {len(problematic_loans)} loans with integer created_at, fixing...")
            
            for loan_id, created_at in problematic_loans:
                # Convert integer to proper datetime string
                if isinstance(created_at, int):
                    # If it's a timestamp, convert it
                    if created_at > 1000000000:  # Unix timestamp
                        dt = datetime.fromtimestamp(created_at)
                        new_created_at = dt.isoformat()
                    else:
                        # If it's just a number, use current time
                        new_created_at = datetime.now().isoformat()
                else:
                    new_created_at = str(created_at)
                
                cursor.execute(
                    "UPDATE loans SET created_at = ? WHERE id = ?",
                    (new_created_at, loan_id)
                )
                print(f"Fixed loan {loan_id}: {created_at} -> {new_created_at}")
        else:
            print("\nNo problematic loans found.")
        
        # Check loan_payments table too
        cursor.execute("SELECT id, created_at FROM loan_payments WHERE typeof(created_at) = 'integer'")
        problematic_payments = cursor.fetchall()
        
        if problematic_payments:
            print(f"\nFound {len(problematic_payments)} loan payments with integer created_at, fixing...")
            
            for payment_id, created_at in problematic_payments:
                if isinstance(created_at, int):
                    if created_at > 1000000000:
                        dt = datetime.fromtimestamp(created_at)
                        new_created_at = dt.isoformat()
                    else:
                        new_created_at = datetime.now().isoformat()
                else:
                    new_created_at = str(created_at)
                
                cursor.execute(
                    "UPDATE loan_payments SET created_at = ? WHERE id = ?",
                    (new_created_at, payment_id)
                )
                print(f"Fixed payment {payment_id}: {created_at} -> {new_created_at}")
        else:
            print("\nNo problematic loan payments found.")
        
        conn.commit()
        print("\nDatabase fix completed!")

if __name__ == "__main__":
    fix_loans_database()
