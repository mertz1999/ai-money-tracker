from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import os
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

class TransactionInfo(BaseModel):
    """Information extracted from transaction text"""
    name: str = Field(description="Name or description of the transaction")
    date: str = Field(description="Date of the transaction in YYYY-MM-DD format")
    price: float = Field(description="Price amount in the original currency (USD or Toman)")
    is_usd: bool = Field(description="Whether the price is in USD (True) or Toman (False)")
    category_name: str = Field(description="Category of the transaction")
    source_name: str = Field(description="Source of the transaction (e.g., Cash, Bank Account)")
    notes: Optional[str] = Field(description="Additional notes about the transaction", default=None)

class TransactionParser:
    def __init__(self, available_categories: List[str] = None, available_sources: List[str] = None):
        self.available_categories = available_categories or []
        self.available_sources = available_sources or []
        
        self.llm = ChatOpenAI(
            model=os.getenv("OPENAI_MODEL_NAME", "gpt-3.5-turbo"),  # Default to gpt-3.5-turbo if not specified
            temperature=0,
            openai_api_base=os.getenv("OPENAI_API_BASE"),
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )
        self.parser = PydanticOutputParser(pydantic_object=TransactionInfo)
        
        # Create the base prompt
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a helpful assistant that extracts transaction information from text.
            Extract the following information and format it as a JSON object.
            IMPORTANT: Return ONLY the JSON object, no additional text or notes.
            
            {format_instructions}
            
            {category_instructions}
            {source_instructions}
            
            For currency detection:
            - If the text mentions dollars, USD, or $ symbols, set is_usd to true
            - If the text mentions toman, rial, تومان, or ریال, set is_usd to false
            - If no currency is specified, make your best guess based on context
            
            If any information is missing, make a reasonable guess based on the context.
            Today's date is {current_date}.
            
            Remember: Return ONLY the JSON object, nothing else."""),
            ("human", "{text}")
        ])

    def _get_category_instructions(self) -> str:
        """Generate instructions for categories"""
        if not self.available_categories:
            return "Choose an appropriate category for the transaction."
        return f"""Available Categories (choose one of these):
{chr(10).join(f'- {cat}' for cat in self.available_categories)}"""

    def _get_source_instructions(self) -> str:
        """Generate instructions for sources"""
        if not self.available_sources:
            return "Specify the source of the transaction (e.g., Cash, Bank Account)."
        return f"""Available Sources (choose one of these):
{chr(10).join(f'- {src}' for src in self.available_sources)}"""

    def clean_response(self, response: str) -> str:
        """Clean the response to ensure it's valid JSON"""
        # Try to find JSON object in the response
        try:
            # First try to parse the entire response as JSON
            json.loads(response)
            return response
        except json.JSONDecodeError:
            # If that fails, try to find JSON object in the text
            try:
                # Look for the first { and last }
                start = response.find('{')
                end = response.rfind('}') + 1
                if start >= 0 and end > start:
                    json_str = response[start:end]
                    # Verify it's valid JSON
                    json.loads(json_str)
                    return json_str
            except (json.JSONDecodeError, ValueError):
                pass
        return response

    def parse_transaction(self, text: str) -> TransactionInfo:
        """Parse transaction information from text"""
        current_date = datetime.now().strftime("%Y-%m-%d")
        
        # Format the prompt with the input text and format instructions
        formatted_prompt = self.prompt.format_messages(
            text=text,
            current_date=current_date,
            format_instructions=self.parser.get_format_instructions(),
            category_instructions=self._get_category_instructions(),
            source_instructions=self._get_source_instructions()
        )
        
        # Get response from LLM
        response = self.llm.invoke(formatted_prompt)
        
        # Clean the response
        cleaned_response = self.clean_response(response.content)
        
        # Parse the response into TransactionInfo
        try:
            transaction_info = self.parser.parse(cleaned_response)
            return transaction_info
        except Exception as e:
            print(f"Error parsing transaction: {e}")
            print("Failed to parse the following response:")
            print(cleaned_response)
            raise ValueError(f"Failed to parse transaction response: {cleaned_response}")

# Sample usage code
if __name__ == "__main__":
    # Sample available categories and sources
    available_categories = [
        "Groceries",
        "Entertainment",
        "Utilities",
        "Transportation",
        "Shopping",
        "Dining",
        "Healthcare"
    ]
    
    available_sources = [
        "Cash",
        "Bank-Account",
        "Credit-Card",
        "USD Account",
        "Debit-Card"
    ]
    
    # Create an instance of TransactionParser with available categories and sources
    parser = TransactionParser(
        available_categories=available_categories,
        available_sources=available_sources
    )
    
    # Sample transaction texts in English and Farsi
    sample_texts = [
        # English examples
        "I spent 50 dollars on groceries at Walmart yesterday using my bank account",
        "Bought a movie ticket for 15 USD with cash today",
        "Paid 200 dollars for electricity bill from my USD account last week",
        
        # Farsi/Mixed examples
        "خرید نان به مبلغ ۵۰۰۰۰ تومان از نانوایی محلی با پول نقد",  # Bread purchase for 50000 Toman with cash
        "پرداخت قبض برق به مبلغ ۲۵۰۰۰۰ تومان از حساب بانکی",  # Electricity bill payment for 250000 Toman from bank account
        "خرید لباس به مبلغ ۸۰۰۰۰۰ تومان با کارت بانکی",  # Clothes purchase for 800000 Toman with bank card
        "هزینه تاکسی ۳۵۰۰۰ تومان پرداخت نقدی",  # Taxi fare 35000 Toman cash payment
        "پرداخت ۲۰ دلار برای اشتراک نتفلیکس"  # Paid 20 dollars for Netflix subscription
    ]
    
    # Process each sample text
    for text in sample_texts:
        print(f"\nProcessing text: {text}")
        try:
            transaction = parser.parse_transaction(text)
            print("Extracted information:")
            print(f"Name: {transaction.name}")
            print(f"Date: {transaction.date}")
            
            # Display price with appropriate currency
            if transaction.is_usd:
                print(f"Price: ${transaction.price:.2f} USD")
            else:
                print(f"Price: {transaction.price:,.0f} Toman")
                
            print(f"Currency: {'USD' if transaction.is_usd else 'Toman'}")
            print(f"Category: {transaction.category_name}")
            print(f"Source: {transaction.source_name}")
            if transaction.notes:
                print(f"Notes: {transaction.notes}")
        except Exception as e:
            print(f"Error: {e}") 