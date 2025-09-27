from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import date, datetime
from modules.database import Database
from routers.users import get_current_user

# Create router
router = APIRouter()

# Define models
class Loan(BaseModel):
    id: int
    name: str
    total_amount: float
    monthly_payment: float
    interest_rate: float
    start_date: str
    end_date: Optional[str]
    remaining_amount: float
    is_usd: bool
    created_at: str

class LoanCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    total_amount: float = Field(..., gt=0)
    monthly_payment: float = Field(..., gt=0)
    is_usd: bool = True

class LoanPayment(BaseModel):
    id: int
    loan_id: int
    amount: float
    payment_date: str
    source_id: int
    source_name: str
    is_paid: bool
    created_at: str

class LoanPaymentCreate(BaseModel):
    loan_id: int
    amount: float = Field(..., gt=0)
    payment_date: str
    source_id: int

class LoanSummary(BaseModel):
    total_loans: int
    total_remaining: float
    total_borrowed: float
    avg_monthly_payment: float

class LoanResponse(BaseModel):
    id: int
    message: str

# Dependency
def get_db():
    return Database()

# API routes
@router.get("/api/loans", response_model=List[Loan])
async def get_loans(
    current_user = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Get all loans for the current user"""
    loans = db.get_all_loans(current_user[0])
    
    result = []
    for loan in loans:
        # Ensure created_at is a string
        created_at = str(loan[9]) if loan[9] is not None else datetime.now().isoformat()
        
        result.append({
            "id": loan[0],
            "name": loan[1],
            "total_amount": loan[2],
            "monthly_payment": loan[3],
            "interest_rate": loan[4],
            "start_date": loan[5],
            "end_date": loan[6],
            "remaining_amount": loan[7],
            "is_usd": bool(loan[8]),
            "created_at": created_at
        })
    
    return result

@router.post("/api/loans", response_model=LoanResponse)
async def create_loan(
    loan: LoanCreate,
    current_user = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Create a new loan"""
    try:
        loan_id = db.add_loan(
            name=loan.name,
            total_amount=loan.total_amount,
            monthly_payment=loan.monthly_payment,
            is_usd=loan.is_usd,
            user_id=current_user[0]
        )
        
        if not loan_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create loan"
            )
        
        return {"id": loan_id, "message": "Loan created successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating loan: {str(e)}"
        )

@router.get("/api/loans/{loan_id}", response_model=Loan)
async def get_loan(
    loan_id: int,
    current_user = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Get a specific loan by ID"""
    loan = db.get_loan_by_id(loan_id, current_user[0])
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found"
        )
    
    # Ensure created_at is a string
    created_at = str(loan[9]) if loan[9] is not None else datetime.now().isoformat()
    
    return {
        "id": loan[0],
        "name": loan[1],
        "total_amount": loan[2],
        "monthly_payment": loan[3],
        "interest_rate": loan[4],
        "start_date": loan[5],
        "end_date": loan[6],
        "remaining_amount": loan[7],
        "is_usd": bool(loan[8]),
        "created_at": created_at
    }

@router.delete("/api/loans/{loan_id}")
async def delete_loan(
    loan_id: int,
    current_user = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Delete a loan and all its payments"""
    # Check if loan exists and belongs to user
    loan = db.get_loan_by_id(loan_id, current_user[0])
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found"
        )
    
    # Delete the loan
    if not db.delete_loan(loan_id, current_user[0]):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete loan"
        )
    
    return {"message": "Loan deleted successfully"}

@router.get("/api/loans/{loan_id}/payments", response_model=List[LoanPayment])
async def get_loan_payments(
    loan_id: int,
    current_user = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Get all payments for a specific loan"""
    # Check if loan exists and belongs to user
    loan = db.get_loan_by_id(loan_id, current_user[0])
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found"
        )
    
    payments = db.get_loan_payments(loan_id, current_user[0])
    return [
        {
            "id": payment[0],
            "loan_id": payment[1],
            "amount": payment[2],
            "payment_date": payment[3],
            "source_id": payment[4],
            "source_name": payment[8] if len(payment) > 8 else "Unknown",
            "is_paid": bool(payment[5]),
            "created_at": str(payment[7]) if payment[7] is not None else datetime.now().isoformat()
        }
        for payment in payments
    ]

@router.post("/api/loans/{loan_id}/payments", response_model=LoanResponse)
async def create_loan_payment(
    loan_id: int,
    payment: LoanPaymentCreate,
    current_user = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Create a new loan payment"""
    # Check if loan exists and belongs to user
    loan = db.get_loan_by_id(loan_id, current_user[0])
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found"
        )
    
    # Verify the source belongs to the user
    sources = db.get_all_sources(current_user[0])
    source_ids = [src[0] for src in sources]
    if payment.source_id not in source_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid source ID"
        )
    
    try:
        payment_id = db.add_loan_payment(
            loan_id=loan_id,
            amount=payment.amount,
            payment_date=payment.payment_date,
            source_id=payment.source_id,
            user_id=current_user[0]
        )
        
        if not payment_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create loan payment"
            )
        
        return {"id": payment_id, "message": "Loan payment created successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating loan payment: {str(e)}"
        )

@router.put("/api/loans/payments/{payment_id}/pay")
async def mark_payment_paid(
    payment_id: int,
    current_user = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Mark a loan payment as paid and update loan remaining amount"""
    try:
        success = db.mark_payment_paid(payment_id, current_user[0])
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found or already paid"
            )
        
        return {"message": "Payment marked as paid successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error marking payment as paid: {str(e)}"
        )

@router.get("/api/loans/summary", response_model=LoanSummary)
async def get_loan_summary(
    current_user = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Get loan summary statistics for the current user"""
    summary = db.get_loan_summary(current_user[0])
    if not summary or summary[0] is None:
        return {
            "total_loans": 0,
            "total_remaining": 0.0,
            "total_borrowed": 0.0,
            "avg_monthly_payment": 0.0
        }
    
    return {
        "total_loans": summary[0] or 0,
        "total_remaining": summary[1] or 0.0,
        "total_borrowed": summary[2] or 0.0,
        "avg_monthly_payment": summary[3] or 0.0
    }
