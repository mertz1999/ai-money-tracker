from convertdate import jalali
from convertdate import gregorian

# Convert Jalali to Gregorian
jalali_date = (1404, 6, 22)  # Year, Month, Day in Jalali
gregorian_date = gregorian.from_jalali(*jalali_date)
print("Gregorian Date:", gregorian_date)

# Convert Gregorian to Jalali
gregorian_date = (2025, 10, 15)
jalali_date = jalali.from_gregorian(*gregorian_date)
print("Jalali Date:", jalali_date)

