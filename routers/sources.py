from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Optional
from pydantic import BaseModel

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

# Create a dependency function that will be injected at runtime
def get_db_dependency():
    from main import get_db
    return get_db()

# API routes
@router.get("/api/sources", response_model=List[Source])
async def get_sources(db=Depends(get_db_dependency)):
    """Get all sources"""
    sources = db.get_all_sources()
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
async def add_source(source: SourceCreate, db=Depends(get_db_dependency)):
    """Add a new source"""
    try:
        source_id = db.add_source(
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