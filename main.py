from fastapi import FastAPI, Request, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from routers import transactions, categories, sources, users
from modules.database import Database
from modules.currency_exchange import CurrencyExchange
from modules.transaction_parser import TransactionParser
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

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

# Create OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Include routers
app.include_router(users.router, tags=["users"])
app.include_router(transactions.router, tags=["transactions"])
app.include_router(categories.router, tags=["categories"])
app.include_router(sources.router, tags=["sources"])

# Serve static files
from fastapi.staticfiles import StaticFiles
app.mount("/", StaticFiles(directory="public", html=True), name="public")

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

# Dependency for reports (commented out since reports module was deleted)
# def get_reports():
#     reports = Reports()
#     return reports

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to Money Tracker API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=9000, reload=True) 