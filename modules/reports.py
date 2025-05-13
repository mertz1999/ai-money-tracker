from modules.database import Database
from modules.currency_exchange import CurrencyExchange
import matplotlib.pyplot as plt
from datetime import datetime
import os

class Reports:
    def __init__(self):
        self.db = Database()
        self.exchange = CurrencyExchange()
        self.reports_dir = "reports"
        self._ensure_reports_directory()

    def _ensure_reports_directory(self):
        """Ensure the reports directory exists"""
        if not os.path.exists(self.reports_dir):
            os.makedirs(self.reports_dir)

    def _convert_to_usd(self, value: float, is_usd: bool) -> float:
        """Convert Toman to USD using cached exchange rate"""
        if not is_usd:
            # Get cached USD rate from currency exchange module
            usd_rate = self.exchange.get_usd_rate(live=False)
            return value / usd_rate
        return value

    def _convert_to_toman(self, value: float, is_usd: bool) -> float:
        """Convert USD to Toman using cached exchange rate"""
        if is_usd:
            # Get cached USD rate from currency exchange module
            usd_rate = self.exchange.get_usd_rate(live=False)
            return value * usd_rate
        return value

    def generate_sources_report(self, save_chart: bool = True) -> str:
        """Generate a report of all sources with their values and create a pie chart"""
        sources = self.db.get_all_sources()
        
        if not sources:
            return "No sources found in the database."

        # Get cached exchange rate
        current_rate = self.exchange.get_usd_rate(live=False)
        
        # Prepare data for report and chart
        total_value_usd = 0
        total_value_toman = 0
        source_details = []
        labels = []
        sizes = []
        usd_values = []

        for source in sources:
            # source tuple format: (id, name, bank, usd, value)
            value_usd = self._convert_to_usd(source[4], source[3])  # value and usd flag
            value_toman = self._convert_to_toman(source[4], source[3])
            total_value_usd += value_usd
            total_value_toman += value_toman
            
            # Format the value for display
            if source[3]:  # if usd is True
                value_display = f"${source[4]:,.2f} USD"
                value_toman_display = f"{value_toman:,.0f} Toman"
            else:
                value_display = f"{source[4]:,.0f} Toman"
                value_usd_display = f"${value_usd:,.2f} USD"
            
            source_details.append({
                'name': source[1],  # name
                'value': value_display,
                'value_converted': value_toman_display if source[3] else value_usd_display,
                'type': 'USD' if source[3] else 'Toman',
                'bank': 'Bank' if source[2] else 'Cash'  # bank flag
            })
            
            # Always use USD values for the pie chart
            labels.append(f"{source[1]}\n(${value_usd:,.2f} USD)")
            sizes.append(value_usd)
            usd_values.append(value_usd)

        # Generate text report
        report = "=== Sources Report ===\n\n"
        report += f"Current USD Rate: {current_rate:,.0f} Toman\n"
        report += f"Total Value: ${total_value_usd:,.2f} USD\n"
        report += f"Total Value: {total_value_toman:,.0f} Toman\n\n"
        
        for detail in source_details:
            report += f"Source: {detail['name']}\n"
            report += f"Value: {detail['value']}\n"
            report += f"Converted: {detail['value_converted']}\n"
            report += f"Type: {detail['type']}\n"
            report += f"Storage: {detail['bank']}\n"
            report += "-" * 30 + "\n"

        # Create pie chart
        if save_chart:
            plt.figure(figsize=(12, 8))
            plt.pie(sizes, labels=labels, autopct='%1.1f%%', startangle=90)
            plt.axis('equal')
            plt.title(f'Distribution of Funds Across Sources\n(USD Rate: {current_rate:,.0f} Toman)')
            
            # Save the chart
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            chart_path = os.path.join(self.reports_dir, f"sources_chart_{timestamp}.png")
            plt.savefig(chart_path)
            plt.close()
            
            report += f"\nChart saved as: {chart_path}"

        return report

    def get_sources_summary(self) -> dict:
        """Get a summary of sources with total values in both USD and Toman"""
        sources = self.db.get_all_sources()
        current_rate = self.exchange.get_usd_rate(live=False)
        
        summary = {
            'total_usd': 0,
            'total_toman': 0,
            'source_count': len(sources),
            'bank_sources': 0,
            'cash_sources': 0,
            'current_rate': current_rate
        }
        
        for source in sources:
            # source tuple format: (id, name, bank, usd, value)
            if source[3]:  # if usd is True
                summary['total_usd'] += source[4]
                summary['total_toman'] += source[4] * current_rate
            else:
                summary['total_toman'] += source[4]
                summary['total_usd'] += source[4] / current_rate
            
            if source[2]:  # if bank is True
                summary['bank_sources'] += 1
            else:
                summary['cash_sources'] += 1
        
        return summary

# Example usage
if __name__ == "__main__":
    reports = Reports()
    
    # Generate and print the sources report
    report = reports.generate_sources_report()
    print(report)
    
    # Get and print summary
    summary = reports.get_sources_summary()
    print("\nSummary:")
    print(f"Current USD Rate: {summary['current_rate']:,.0f} Toman")
    print(f"Total USD: ${summary['total_usd']:,.2f}")
    print(f"Total Toman: {summary['total_toman']:,.0f}")
    print(f"Number of Sources: {summary['source_count']}")
    print(f"Bank Sources: {summary['bank_sources']}")
    print(f"Cash Sources: {summary['cash_sources']}") 