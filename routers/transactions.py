from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import date

# Create router
router = APIRouter()

# Define models
class Transaction(BaseModel):
    id: int
    name: str
    date: str
    price_in_dollar: float
    your_currency_rate: float
    category: str
    source: str
    is_income: bool

class TransactionCreate(BaseModel):
    name: str
    date: str
    price: float
    is_usd: bool
    category_name: str
    source_name: str

class IncomeCreate(BaseModel):
    name: str
    date: str
    amount: float
    is_usd: bool
    category_name: str
    source_name: str

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

# Create dependency functions that will be injected at runtime
def get_db_dependency():
    from main import get_db
    return get_db()

def get_exchange_dependency():
    from main import get_exchange
    return get_exchange()

def get_parser_dependency():
    from main import get_parser
    return get_parser()

# API routes
@router.get("/api/transactions", response_model=List[Transaction])
async def get_transactions(db=Depends(get_db_dependency)):
    """Get all transactions"""
    transactions = db.get_all_transactions()
    result = []
    categories = {cat[0]: cat[1] for cat in db.get_all_categories()}
    sources = {src[0]: src[1] for src in db.get_all_sources()}
    
    for tx in transactions:
        result.append({
            'id': tx[0],
            'name': tx[1],
            'date': tx[2],
            'price_in_dollar': tx[3],
            'your_currency_rate': tx[4],
            'category': categories.get(tx[5], 'Unknown'),
            'source': sources.get(tx[6], 'Unknown'),
            'is_income': tx[3] < 0  # Negative price indicates income
        })
    
    return result

@router.post("/api/add_transaction", response_model=TransactionResponse)
async def add_transaction(transaction: TransactionCreate, db=Depends(get_db_dependency), exchange=Depends(get_exchange_dependency)):
    """Add a new transaction"""
    # Get category ID
    categories = {cat[1].lower(): cat[0] for cat in db.get_all_categories()}
    category_name = transaction.category_name.lower()
    
    if category_name not in categories:
        # Use 'other' category if not found
        category_id = categories.get('other')
    else:
        category_id = categories[category_name]
    
    # Get source ID
    sources = {src[1].lower(): src[0] for src in db.get_all_sources()}
    source_name = transaction.source_name.lower()
    
    if source_name not in sources:
        raise HTTPException(status_code=400, detail=f"Source not found: {source_name}")
    
    source_id = sources[source_name]
    
    # Get current exchange rate
    usd_rate = exchange.get_usd_rate(live=False)
    
    # Convert price to USD if needed
    price_in_dollar = transaction.price if transaction.is_usd else transaction.price / usd_rate
    
    # Add transaction to database
    try:
        tx_id = db.add_transaction(
            name=transaction.name,
            date=transaction.date,
            price_in_dollar=price_in_dollar,
            your_currency_rate=usd_rate,
            category_id=category_id,
            source_id=source_id,
            update_balance=True  # Update source balance
        )
        
        return {"id": tx_id, "message": "Transaction added successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/add_income", response_model=TransactionResponse)
async def add_income(income: IncomeCreate, db=Depends(get_db_dependency), exchange=Depends(get_exchange_dependency)):
    """Add income to a source"""
    # Get category ID
    categories = {cat[1].lower(): cat[0] for cat in db.get_all_categories()}
    category_name = income.category_name.lower()
    
    if category_name not in categories:
        # Use 'other' category if not found
        category_id = categories.get('other')
    else:
        category_id = categories[category_name]
    
    # Get source ID
    sources = {src[1].lower(): src[0] for src in db.get_all_sources()}
    source_name = income.source_name.lower()
    
    if source_name not in sources:
        raise HTTPException(status_code=400, detail=f"Source not found: {source_name}")
    
    source_id = sources[source_name]
    
    # Get current exchange rate
    usd_rate = exchange.get_usd_rate(live=False)
    
    # Add income to database
    try:
        tx_id = db.add_income(
            name=income.name,
            date=income.date,
            amount=income.amount,
            is_usd=income.is_usd,
            your_currency_rate=usd_rate,
            category_id=category_id,
            source_id=source_id
        )
        
        return {"id": tx_id, "message": "Income added successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class TransactionText(BaseModel):
    text: str

@router.post("/api/parse_transaction", response_model=ParsedTransaction)
async def parse_transaction(transaction_text: TransactionText, parser=Depends(get_parser_dependency)):
    """Parse transaction description using AI"""
    text = transaction_text.text
    
    if not text:
        raise HTTPException(status_code=400, detail="No text provided")
    
    try:
        transaction = parser.parse_transaction(text)
        return transaction.dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 