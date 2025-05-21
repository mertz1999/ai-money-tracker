from fastapi import APIRouter, Depends, HTTPException, Body, Query, status
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import date, datetime
from modules.database import Database
from routers.users import get_current_user

# Create router
router = APIRouter()

# Define models
class Transaction(BaseModel):
    id: int
    name: str
    date: str
    price: float
    is_usd: bool
    category_id: int
    source_id: int

class TransactionCreate(BaseModel):
    name: str
    date: str
    price: float
    is_usd: bool
    category_id: int
    source_id: int

class IncomeCreate(BaseModel):
    name: str
    date: str
    price: float
    is_usd: bool
    category_name: str
    source_name: str
    is_deposit: bool = True

class TransactionResponse(BaseModel):
    id: int
    message: str

class ParsedTransaction(BaseModel):
    name: str
    date: str
    price: float
    is_usd: bool
    category_name: str
    source_name: str
    notes: Optional[str] = None
    is_deposit: bool

class ExchangeRateResponse(BaseModel):
    rate: float
    timestamp: str

# Create dependency functions that will be injected at runtime
def get_db():
    return Database()

def get_exchange_dependency():
    from main import get_exchange
    return get_exchange()

def get_parser_dependency():
    from main import get_parser
    return get_parser()

# API routes
@router.get("/api/transactions", response_model=List[Transaction])
async def get_transactions(
    current_user = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Get all transactions for the current user"""
    transactions = db.get_all_transactions(current_user[0])  # current_user[0] is the user_id
    # Fetch all categories and sources for mapping
    categories = {cat[0]: cat[1] for cat in db.get_all_categories()}
    sources = {src[0]: src[1] for src in db.get_all_sources(current_user[0])}
    return [
        {
            "id": transaction[0],
            "name": transaction[1],
            "date": transaction[2],
            "price": transaction[3],
            "your_currency_rate": transaction[4],
            "is_usd": bool(sources.get(transaction[6], False)),  # fallback if source not found
            "category_id": transaction[5],
            "source_id": transaction[6],
            "category": categories.get(transaction[5], ""),
            "source": sources.get(transaction[6], ""),
            "is_deposit": bool(transaction[7]) if len(transaction) > 7 else False
        }
        for transaction in transactions
    ]

@router.post("/api/add_transaction", response_model=Transaction)
async def create_transaction(
    transaction: TransactionCreate,
    current_user = Depends(get_current_user),
    db: Database = Depends(get_db),
    exchange=Depends(get_exchange_dependency)
):
    """Create a new transaction"""
    # Get current exchange rate
    usd_rate = exchange.get_usd_rate(live=False)
    if usd_rate is None:
        raise HTTPException(status_code=503, detail="Failed to fetch exchange rate")

    # Convert price to USD if needed
    if transaction.is_usd:
        price_in_dollar = transaction.price
        your_currency_rate = usd_rate
    else:
        price_in_dollar = transaction.price / usd_rate
        your_currency_rate = usd_rate

    transaction_id = db.add_transaction(
        user_id=current_user[0],
        name=transaction.name,
        date=transaction.date,
        price_in_dollar=price_in_dollar,
        your_currency_rate=your_currency_rate,
        category_id=transaction.category_id,
        source_id=transaction.source_id,
        is_deposit=False,
        update_balance=True
    )
    if not transaction_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create transaction"
        )
    
    # Get the created transaction
    transaction_data = db.get_transaction_by_id(transaction_id)
    # Fetch all categories and sources for mapping
    categories = {cat[0]: cat[1] for cat in db.get_all_categories()}
    sources = {src[0]: src[1] for src in db.get_all_sources(current_user[0])}
    return {
        "id": transaction_data[0],
        "name": transaction_data[1],
        "date": transaction_data[2],
        "price": transaction_data[3],
        "is_usd": bool(transaction_data[4]),
        "category_id": transaction_data[5],
        "source_id": transaction_data[6],
        "category": categories.get(transaction_data[5], ""),
        "source": sources.get(transaction_data[6], "")
    }

@router.delete("/api/transactions/{transaction_id}")
async def delete_transaction(
    transaction_id: int,
    current_user = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Delete a transaction"""
    # Check if transaction exists and belongs to user
    transaction = db.get_transaction_by_id(transaction_id)
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    # Delete the transaction
    if not db.delete_transaction(transaction_id):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete transaction"
        )
    
    return {"message": "Transaction deleted successfully"}

@router.post("/api/add_income", response_model=TransactionResponse)
async def add_income(
    income: IncomeCreate,
    current_user = Depends(get_current_user),
    db: Database = Depends(get_db),
    exchange=Depends(get_exchange_dependency)
):
    """Add income to a source"""
    # Get category ID
    categories = {cat[1].lower(): cat[0] for cat in db.get_all_categories(current_user[0])}
    category_name = income.category_name.lower()
    
    if category_name not in categories:
        # Use 'other' category if not found
        category_id = categories.get('other')
    else:
        category_id = categories[category_name]
    
    # Get source ID
    sources = {src[1].lower(): src[0] for src in db.get_all_sources(current_user[0])}
    source_name = income.source_name.lower()
    
    if source_name not in sources:
        raise HTTPException(status_code=400, detail=f"Source not found: {source_name}")
    
    source_id = sources[source_name]
    
    # Get current exchange rate
    usd_rate = exchange.get_usd_rate(live=False)
    if usd_rate is None:
        raise HTTPException(status_code=503, detail="Failed to fetch exchange rate")
    
    # Convert price to USD if needed
    price_in_dollar = income.price if income.is_usd else income.price / usd_rate
    
    # Add transaction to database
    try:
        tx_id = db.add_transaction(
            user_id=current_user[0],
            name=income.name,
            date=income.date,
            price_in_dollar=-price_in_dollar,  # Negative for income
            your_currency_rate=usd_rate,
            category_id=category_id,
            source_id=source_id,
            is_deposit=True,  # Always True for income
            update_balance=True
        )
        
        return {"id": tx_id, "message": "Income added successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class TransactionText(BaseModel):
    text: str

@router.post("/api/parse_transaction", response_model=ParsedTransaction)
async def parse_transaction(
    transaction_text: TransactionText,
    current_user = Depends(get_current_user),
    parser=Depends(get_parser_dependency)
):
    """Parse transaction description using AI"""
    text = transaction_text.text
    
    if not text:
        raise HTTPException(status_code=400, detail="No text provided")
    
    try:
        # Get available categories and sources for the parser
        db = Database()
        categories = [cat[1] for cat in db.get_all_categories()]  # Get category names
        sources = [src[1] for src in db.get_all_sources(current_user[0])]  # Get source names
        
        # Update parser with available categories and sources
        parser.available_categories = categories
        parser.available_sources = sources
        
        # Parse the transaction
        transaction = parser.parse_transaction(text)
        return transaction.dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/exchange_rate", response_model=ExchangeRateResponse)
def get_exchange_rate(live: bool = False, exchange=Depends(get_exchange_dependency)):
    """Get the current USD to Toman exchange rate"""
    try:
        rate = exchange.get_usd_rate(live=live)
        if rate is None:
            raise HTTPException(status_code=503, detail="Failed to fetch exchange rate")
        return {
            "rate": rate,
            "timestamp": datetime.now().isoformat() 
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 