from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from typing import List, Dict, Any
from datetime import datetime, date
from modules.database import Database
from routers.users import get_current_user
from modules.currency_exchange import CurrencyExchange
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
import io

# Create router
router = APIRouter()

# Get currency exchange instance
currency_exchange = CurrencyExchange()

class MonthlyReportData:
    def __init__(self, user_id: int, month: int, year: int):
        self.user_id = user_id
        self.month = month
        self.year = year
        self.db = Database()
        self.exchange_rate = currency_exchange.get_usd_rate()
        
    def get_transactions(self) -> List[Dict[str, Any]]:
        """Get all transactions for the specified month"""
        try:
            transactions = self.db.get_transactions_by_month(self.user_id, self.month, self.year)
            return transactions
        except Exception as e:
            raise
    
    def get_sources(self) -> List[Dict[str, Any]]:
        """Get all sources for the user"""
        try:
            sources = self.db.get_sources(self.user_id)
            return sources
        except Exception as e:
            print(f"Debug: Error in get_sources: {e}")
            raise
    
    def calculate_totals(self, transactions: List[Dict[str, Any]]) -> Dict[str, float]:
        """Calculate income, expense, and net totals in both currencies"""
        total_income_usd = 0
        total_expense_usd = 0
        total_income_toman = 0
        total_expense_toman = 0
        
        
        for tx in transactions:
            # Handle both tuple and dictionary formats
            if isinstance(tx, dict):
                price = tx['price_in_dollar']  # Database returns price_in_dollar
                is_usd = tx.get('is_usd', True)  # Default to True if not present
                is_deposit = bool(tx['is_deposit'])  # Convert 0/1 to boolean
                currency_rate = tx['your_currency_rate']
            else:
                # Assume tuple format from database: need to figure out column order
                # For now, let's convert tuple to dict
                print(f"Debug: Transaction is tuple with {len(tx)} items: {tx}")
                # This will help us understand the tuple structure
                continue  # Skip for now to avoid errors
            
            amount = abs(price)
            if is_usd:
                if is_deposit:
                    total_income_usd += amount
                else:
                    total_expense_usd += amount
                # Convert to Toman
                toman_amount = amount * currency_rate
                if is_deposit:
                    total_income_toman += toman_amount
                else:
                    total_expense_toman += toman_amount
            else:
                if is_deposit:
                    total_income_toman += amount
                else:
                    total_expense_toman += amount
                # Convert to USD
                usd_amount = amount / currency_rate
                if is_deposit:
                    total_income_usd += usd_amount
                else:
                    total_expense_usd += usd_amount
        
        net_usd = total_income_usd - total_expense_usd
        net_toman = total_income_toman - total_expense_toman
        
        return {
            'income_usd': total_income_usd,
            'expense_usd': total_expense_usd,
            'net_usd': net_usd,
            'income_toman': total_income_toman,
            'expense_toman': total_expense_toman,
            'net_toman': net_toman
        }

def create_pdf_report(report_data: MonthlyReportData) -> bytes:
    """Create a PDF report with transactions and sources data"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
    
    # Get styles
    styles = getSampleStyleSheet()
    
    # Create custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=30,
        alignment=TA_CENTER,
        textColor=colors.darkblue
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=12,
        spaceBefore=20,
        textColor=colors.darkblue
    )
    
    # Get data
    transactions = report_data.get_transactions()
    totals = report_data.calculate_totals(transactions)
    
    # Build content
    story = []
    
    # Title
    month_name = datetime(report_data.year, report_data.month, 1).strftime('%B %Y')
    title = Paragraph(f"Monthly Financial Report - {month_name}", title_style)
    story.append(title)
    story.append(Spacer(1, 20))
    
    # Exchange Rate
    exchange_info = Paragraph(f"<b>Exchange Rate:</b> 1 USD = {report_data.exchange_rate:,.0f} Toman", styles['Normal'])
    story.append(exchange_info)
    story.append(Spacer(1, 20))
    
    # Summary Section
    story.append(Paragraph("Financial Summary", heading_style))
    
    summary_data = [
        ['Currency', 'Income', 'Expenses', 'Net'],
        ['USD', f"${totals['income_usd']:,.2f}", f"${totals['expense_usd']:,.2f}", f"${totals['net_usd']:,.2f}"],
        ['Toman', f"{totals['income_toman']:,.0f} T", f"{totals['expense_toman']:,.0f} T", f"{totals['net_toman']:,.0f} T"]
    ]
    
    summary_table = Table(summary_data, colWidths=[1.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(summary_table)
    story.append(Spacer(1, 30))
    
    # Transactions Section
    story.append(Paragraph("Transaction Details", heading_style))
    
    if transactions:
        # Group transactions by type
        income_transactions = []
        expense_transactions = []
        
        for tx in transactions:
            if isinstance(tx, dict):
                is_deposit = bool(tx['is_deposit'])  # Convert 0/1 to boolean
            else:
                # Skip tuples for now
                continue
                
            if is_deposit:
                income_transactions.append(tx)
            else:
                expense_transactions.append(tx)
        
        # Income Transactions
        if income_transactions:
            story.append(Paragraph("Income Transactions", styles['Heading3']))
            income_data = [['Date', 'Description', 'Amount (USD)', 'Amount (Toman)', 'Source']]
            
            for tx in income_transactions:
                # Handle both tuple and dictionary formats
                if isinstance(tx, dict):
                    date = tx['date']
                    name = tx['name']
                    price = tx['price_in_dollar']  # Database returns price_in_dollar
                    is_usd = tx.get('is_usd', True)  # Default to True if not present
                    currency_rate = tx['your_currency_rate']
                    source = tx.get('source', 'N/A')
                else:
                    # Skip tuples for now
                    continue
                
                amount_usd = price if is_usd else price / currency_rate
                amount_toman = price * currency_rate if is_usd else price
                
                income_data.append([
                    date,
                    name,
                    f"${amount_usd:,.2f}",
                    f"{amount_toman:,.0f} T",
                    source
                ])
            
            income_table = Table(income_data, colWidths=[1*inch, 2.5*inch, 1*inch, 1*inch, 1*inch])
            income_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.lightgreen),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            story.append(income_table)
            story.append(Spacer(1, 20))
        
        # Expense Transactions
        if expense_transactions:
            story.append(Paragraph("Expense Transactions", styles['Heading3']))
            expense_data = [['Date', 'Description', 'Amount (USD)', 'Amount (Toman)', 'Source']]
            
            for tx in expense_transactions:
                # Handle both tuple and dictionary formats
                if isinstance(tx, dict):
                    date = tx['date']
                    name = tx['name']
                    price = tx['price_in_dollar']  # Database returns price_in_dollar
                    is_usd = tx.get('is_usd', True)  # Default to True if not present
                    currency_rate = tx['your_currency_rate']
                    source = tx.get('source', 'N/A')
                else:
                    # Skip tuples for now
                    continue
                
                amount_usd = price if is_usd else price / currency_rate
                amount_toman = price * currency_rate if is_usd else price
                
                expense_data.append([
                    date,
                    name,
                    f"${amount_usd:,.2f}",
                    f"{amount_toman:,.0f} T",
                    source
                ])
            
            expense_table = Table(expense_data, colWidths=[1*inch, 2.5*inch, 1*inch, 1*inch, 1*inch])
            expense_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.lightcoral),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            story.append(expense_table)
    else:
        story.append(Paragraph("No transactions found for this month.", styles['Normal']))
    
    # Footer
    story.append(Spacer(1, 30))
    footer = Paragraph(f"Report generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal'])
    story.append(footer)
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()

@router.get("/monthly-report")
async def get_monthly_report_pdf(
    month: int = Query(..., ge=1, le=12, description="Month (1-12)"),
    year: int = Query(..., ge=2020, le=2030, description="Year"),
    current_user: dict = Depends(get_current_user)
):
    """
    Generate a comprehensive monthly PDF report including:
    - Financial summary (income, expenses, net) in both USD and Toman
    - Detailed transaction list (income and expenses) for the selected month
    """
    try:
        # Create report data
        report_data = MonthlyReportData(current_user[0], month, year)
        
        # Generate PDF
        pdf_content = create_pdf_report(report_data)
        
        # Return PDF as response
        filename = f"monthly_report_{year}_{month:02d}.pdf"
        
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")

@router.get("/monthly-summary")
async def get_monthly_summary(
    month: int = Query(..., ge=1, le=12, description="Month (1-12)"),
    year: int = Query(..., ge=2020, le=2030, description="Year"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get a JSON summary of monthly transaction data (for API testing or quick preview)
    """
    try:
        report_data = MonthlyReportData(current_user[0], month, year)
        transactions = report_data.get_transactions()
        totals = report_data.calculate_totals(transactions)
        
        return {
            "month": month,
            "year": year,
            "exchange_rate": report_data.exchange_rate,
            "summary": totals,
            "transaction_count": len(transactions),
            "transactions": transactions
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating summary: {str(e)}")
