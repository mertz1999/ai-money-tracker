import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime

class CurrencyExchange:
    def __init__(self):
        self.url = "https://www.tgju.org/profile/price_dollar_rl"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

    def get_usd_rate(self):
        """Fetch the current USD to Rial exchange rate from tgju.org and convert to Toman"""
        try:
            response = requests.get(self.url, headers=self.headers)
            response.raise_for_status()  # Raise an exception for bad status codes
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Find the price element with specific data-col attribute
            price_element = soup.find('span', {'data-col': 'info.last_trade.PDrCotVal'})
            
            if price_element:
                # Extract the price and remove any non-numeric characters except decimal point
                price_text = price_element.text.strip()
                # Convert Rial to Toman by dividing by 10
                price = float(price_text.replace(',', '')) / 10
                return price
            else:
                raise ValueError("Could not find price element on the page")
                
        except requests.RequestException as e:
            print(f"Error fetching data: {e}")
            return None
        except ValueError as e:
            print(f"Error parsing data: {e}")
            return None

    def convert_usd_to_toman(self, usd_amount):
        """Convert USD amount to Toman using current exchange rate"""
        rate = self.get_usd_rate()
        if rate is None:
            return None
        return usd_amount * rate

    def convert_toman_to_usd(self, toman_amount):
        """Convert Toman amount to USD using current exchange rate"""
        rate = self.get_usd_rate()
        if rate is None:
            return None
        return toman_amount / rate

# Sample usage code
if __name__ == "__main__":
    # Create an instance of CurrencyExchange
    exchange = CurrencyExchange()
    
    # Get current USD rate
    current_rate = exchange.get_usd_rate()
    print(f"Current USD to Toman rate: {current_rate:,.2f}")
    
    # Convert some amounts
    usd_amount = 100
    toman_amount = exchange.convert_usd_to_toman(usd_amount)
    print(f"{usd_amount} USD = {toman_amount:,.2f} Toman")
    
    # Convert back to USD
    usd_converted = exchange.convert_toman_to_usd(toman_amount)
    print(f"{toman_amount:,.2f} Toman = {usd_converted:.2f} USD") 