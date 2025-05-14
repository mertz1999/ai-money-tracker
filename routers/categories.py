from fastapi import APIRouter, Depends
from typing import List
from pydantic import BaseModel

# Create router
router = APIRouter()

# Define models
class Category(BaseModel):
    id: int
    name: str

# Create a dependency function that will be injected at runtime
def get_db_dependency():
    from main import get_db
    return get_db()

# API routes
@router.get("/api/categories", response_model=List[Category])
async def get_categories(db=Depends(get_db_dependency)):
    """Get all categories"""
    categories = db.get_all_categories()
    return [{"id": cat[0], "name": cat[1]} for cat in categories] 