from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List
from pydantic import BaseModel
from modules.database import Database
from routers.users import get_current_user
from modules.currency_exchange import CurrencyExchange

# Create router
router = APIRouter()

# Define models
class Source(BaseModel):
    id: int
    name: str
    bank: bool
    usd: bool
    value: float

class SourceCreate(BaseModel):
    name: str
    bank: bool
    usd: bool
    value: float

class SourceResponse(BaseModel):
    id: int
    message: str

class TotalSourceResponse(BaseModel):
    total_usd: float

# Dependency
def get_db():
    return Database()

# API routes
@router.get("/api/sources", response_model=List[Source])
async def get_sources(
    current_user = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Get all sources for the current user"""
    sources = db.get_all_sources(current_user[0])  # current_user[0] is the user_id
    return [
        {
            "id": src[0],
            "name": src[1],
            "bank": bool(src[2]),
            "usd": bool(src[3]),
            "value": src[4]
        }
        for src in sources
    ]

@router.post("/api/add_source", response_model=SourceResponse)
async def add_source(
    source: SourceCreate,
    current_user = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Add a new source"""
    try:
        source_id = db.add_source(
            user_id=current_user[0],  # Add user_id here
            name=source.name,
            bank=source.bank,
            usd=source.usd,
            value=float(source.value)
        )
        
        if source_id is None:
            raise HTTPException(status_code=400, detail="Source with this name already exists")
            
        return {"id": source_id, "message": "Source added successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/totalsource", response_model=TotalSourceResponse)
async def get_total_source(
    usd: bool = Query(True, description="If true, return total in USD. If false, return in Toman."),
    current_user = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Get the total of all sources for the current user, converted to USD if needed."""
    sources = db.get_all_sources(current_user[0])
    if not sources:
        return {"total_usd": 0.0}
    exchange = CurrencyExchange()
    rate = exchange.get_usd_rate(live=False)
    if not rate:
        raise HTTPException(status_code=503, detail="Failed to fetch exchange rate")
    total_usd = 0.0
    for src in sources:
        is_usd = bool(src[3])
        value = src[4]
        if is_usd:
            total_usd += value
        else:
            total_usd += value / rate
    return {"total_usd": round(total_usd, 2)} 