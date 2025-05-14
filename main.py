from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware

from modules.database import Database
from modules.currency_exchange import CurrencyExchange
from modules.transaction_parser import TransactionParser
from modules.reports import Reports

# Import routers
from routers import categories, sources, transactions

# Create FastAPI app
app = FastAPI(title="AI Money Tracker API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Include routers
app.include_router(categories.router, tags=["Categories"])
app.include_router(sources.router, tags=["Sources"])
app.include_router(transactions.router, tags=["Transactions"])

# Dependency for database access
def get_db():
    db = Database()
    return db

# Dependency for exchange rate access
def get_exchange():
    exchange = CurrencyExchange()
    return exchange

# Dependency for transaction parser
def get_parser():
    parser = TransactionParser()
    return parser

# Dependency for reports
def get_reports():
    reports = Reports()
    return reports

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=9000, reload=True) 