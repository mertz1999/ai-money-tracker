import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime, timedelta
import os

class CurrencyExchange:
    def __init__(self):
        self.url = "https://www.tgju.org/profile/price_dollar_rl"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        self.cache_file = "currency_cache.json"

    def save_to_cache(self, rate):
        """Save the exchange rate and timestamp to cache file"""
        cache_data = {
            "rate": rate,
            "timestamp": datetime.now().isoformat()
        }
        with open(self.cache_file, 'w') as f:
            json.dump(cache_data, f)

    def load_from_cache(self):
        """Load the exchange rate and timestamp from cache file"""
        if not os.path.exists(self.cache_file):
            return None, None
        
        try:
            with open(self.cache_file, 'r') as f:
                cache_data = json.load(f)
                return cache_data["rate"], datetime.fromisoformat(cache_data["timestamp"])
        except (json.JSONDecodeError, KeyError, ValueError):
            return None, None

    def is_cache_valid(self, cache_time):
        """Check if the cache is still valid (less than 10 hours old)"""
        if not cache_time:
            return False
        return datetime.now() - cache_time < timedelta(hours=10)

    def get_usd_rate(self, live=False):
        """Fetch the current USD to Rial exchange rate from tgju.org and convert to Toman"""
        # Try to get from cache first if not live
        if not live:
            cached_rate, cache_time = self.load_from_cache()
            if cached_rate and self.is_cache_valid(cache_time):
                return cached_rate

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
                # Save to cache
                self.save_to_cache(price)
                return price
            else:
                raise ValueError("Could not find price element on the page")
                
        except requests.RequestException as e:
            print(f"Error fetching data: {e}")
            # If fetch fails and we have a valid cache, use that
            cached_rate, cache_time = self.load_from_cache()
            if cached_rate and self.is_cache_valid(cache_time):
                return cached_rate
            return None
        except ValueError as e:
            print(f"Error parsing data: {e}")
            return None

# Sample usage code
if __name__ == "__main__":
    # Create an instance of CurrencyExchange
    exchange = CurrencyExchange()
    
    # Get current USD rate (using cache if available)
    current_rate = exchange.get_usd_rate(live=False)
    print(f"Current USD to Toman rate: {current_rate:,.2f}")
    
    # Get live rate
    live_rate = exchange.get_usd_rate(live=True)
    print(f"Live USD to Toman rate: {live_rate:,.2f}") 