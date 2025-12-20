// Persian Calendar Utilities - Get today's date from backend
let cachedPersianDate = null;
let dateCacheTime = null;

async function getCurrentPersianDate() {
    // Cache the date for 1 hour to avoid too many API calls
    const now = Date.now();
    if (cachedPersianDate && dateCacheTime && (now - dateCacheTime) < 3600000) {
        console.log('Using cached Persian date:', cachedPersianDate);
        return cachedPersianDate;
    }
    
    console.log('Fetching Persian date from API...');
    try {
        // The endpoint doesn't require auth, so use regular fetch
        const response = await fetch('/api/today_persian_date', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response && response.ok) {
            const data = await response.json();
            cachedPersianDate = data.date;
            dateCacheTime = now;
            console.log('Persian date fetched successfully:', cachedPersianDate);
            return cachedPersianDate;
        } else {
            console.error('Failed to get Persian date from API, status:', response?.status);
            // Fallback to a default date
            return '1404/09/25';
        }
    } catch (error) {
        console.error('Error fetching Persian date:', error);
        // Fallback to a default date
        return '1404/09/25';
    }
}

function getCurrentPersianDateTime() {
    if (typeof moment !== 'undefined' && moment().format) {
        return moment().format('jYYYY/jMM/jDD HH:mm');
    }
    return '1403/10/15 12:00'; // Fallback datetime
}

function convertToPersianDate(gregorianDate) {
    if (!gregorianDate) return '';
    
    // Check if it's already in Persian format (Persian year range 1300-1500)
    if (typeof gregorianDate === 'string') {
        // Remove 'j' prefix if present
        const normalized = gregorianDate.replace(/^j/, '').trim();
        // Check if it matches Persian date format (YYYY/MM/DD or YYYY-MM-DD with year 1300-1500)
        const persianDateMatch = normalized.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
        if (persianDateMatch) {
            const year = parseInt(persianDateMatch[1]);
            // If year is in Persian range (1300-1500), it's already Persian
            if (year >= 1300 && year <= 1500) {
                // Normalize to YYYY/MM/DD format
                const month = persianDateMatch[2].padStart(2, '0');
                const day = persianDateMatch[3].padStart(2, '0');
                return `${year}/${month}/${day}`;
            }
        }
    }
    
    // Try moment.js to convert Gregorian to Persian
    if (typeof moment !== 'undefined' && moment().format) {
        try {
            // Parse as Gregorian date and convert to Persian
            const gregorianMoment = moment(gregorianDate, 'YYYY-MM-DD');
            if (gregorianMoment.isValid()) {
                // Format as Persian date WITHOUT 'j' prefix (backend expects YYYY/MM/DD)
                const persianDate = gregorianMoment.format('jYYYY/jMM/jDD').replace(/^j/, '');
                console.log('Converted date:', gregorianDate, '->', persianDate);
            return persianDate;
            }
        } catch (error) {
            console.error('Error converting date with moment.js:', error);
        }
    }
    
    // Fallback: If moment.js is not available, return error
    console.error('Cannot convert date: moment.js not available or invalid date format:', gregorianDate);
    // Return current Persian date as fallback
    return getCurrentPersianDate().replace(/^j/, '');
}

function convertToGregorianDate(persianDate) {
    if (!persianDate) return '';
    if (typeof moment !== 'undefined' && moment().format) {
        return moment(persianDate, 'jYYYY/jMM/jDD').format('YYYY-MM-DD');
    }
    return '2024-01-01'; // Fallback
}

function convertJalaliToGregorian(jalaliMonth, jalaliYear) {
    // Convert Jalali month/year to Gregorian month/year
    if (typeof moment !== 'undefined' && moment().format) {
        try {
            // Create a Jalali date (using first day of the month)
            const jalaliDate = moment(`${jalaliYear}/${jalaliMonth}/01`, 'jYYYY/jMM/jDD');
            // Get Gregorian values directly from the moment object
            // moment-jalaali automatically handles the conversion
            return {
                month: jalaliDate.month() + 1, // moment.js months are 0-indexed
                year: jalaliDate.year()
            };
        } catch (error) {
            console.error('Error converting Jalali to Gregorian with moment:', error);
            // Fall through to fallback
        }
    }
    // Fallback: approximate conversion (not accurate but better than nothing)
    // Jalali year 1404 ≈ Gregorian year 2025
    // This is a rough approximation
    const gregorianYear = jalaliYear + 621;
    // Month conversion is complex, so we'll use a simple approximation
    // Jalali months 1-3 ≈ Gregorian months 3-5, etc.
    let gregorianMonth = jalaliMonth + 2;
    if (gregorianMonth > 12) {
        gregorianMonth -= 12;
        gregorianYear += 1;
    }
    return { month: gregorianMonth, year: gregorianYear };
}

function formatPersianDate(date, format = 'jYYYY/jMM/jDD') {
    if (!date) return '';
    if (typeof moment !== 'undefined' && moment().format) {
        return moment(date).format(format);
    }
    return '1403/10/15'; // Fallback
}

function getPersianMonthName(month) {
    const months = [
        'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
        'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ];
    return months[month - 1] || '';
}

function getPersianDayName(day) {
    const days = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
    return days[day] || '';
}

// Initialize Persian year dropdown
function initializePersianYearDropdown() {
    const yearSelect = document.getElementById('reportYear');
    if (yearSelect) {
        // Get current Persian year
        let persianYear = 1404; // Default fallback
        
        if (typeof moment !== 'undefined' && moment().format) {
            const currentPersianYear = moment().format('jYYYY');
            persianYear = parseInt(currentPersianYear);
            console.log('Using moment.js for year initialization:', persianYear);
        } else {
            console.log('Moment.js not available, using fallback year:', persianYear);
        }
        
        // Clear existing options
        yearSelect.innerHTML = '';
        
        // Add Persian years (current year and 2 years before/after)
        for (let year = persianYear - 2; year <= persianYear + 2; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            if (year === persianYear) {
                option.selected = true;
            }
            yearSelect.appendChild(option);
        }
        
        console.log('Persian year dropdown initialized with year:', persianYear);
        return true;
    } else {
        // Dropdown doesn't exist - this is fine, it might not be on this page
        return false;
    }
}

// Initialize year dropdown with retry mechanism
function initializeYearDropdownWithRetry(maxRetries = 3) {
    let retries = 0;
    const tryInit = () => {
        const yearSelect = document.getElementById('reportYear');
        if (yearSelect) {
            if (initializePersianYearDropdown()) {
                console.log('Year dropdown initialized successfully');
                // Also initialize the month selector to current Persian month
                const monthSelect = document.getElementById('monthSelector');
                if (monthSelect) {
                    let currentPersianMonth = 10; // Default fallback
                    
                    if (typeof moment !== 'undefined' && moment().format) {
                        const monthStr = moment().format('jM');
                        currentPersianMonth = parseInt(monthStr);
                        console.log('Using moment.js for month initialization:', currentPersianMonth);
                    } else {
                        console.log('Moment.js not available, using fallback month:', currentPersianMonth);
                    }
                    
                    monthSelect.value = currentPersianMonth;
                    currentMonth = currentPersianMonth;
                    console.log('Month selector set to current Persian month:', currentPersianMonth);
                }
            }
        } else if (retries < maxRetries) {
            retries++;
            setTimeout(tryInit, 500);
        } else {
            // Silently fail - the dropdown might not exist on this page
            // Don't log error as it's not critical
        }
    };
    tryInit();
}

// Ensure year dropdown is ready before any transaction loading
function ensureYearDropdownReady() {
    const yearSelect = document.getElementById('reportYear');
    if (yearSelect) {
        if (!yearSelect.value || isNaN(parseInt(yearSelect.value))) {
            initializePersianYearDropdown();
            return false;
        }
        return true;
    }
    // Dropdown doesn't exist - return true to not block execution
    return true;
}

// Setup date input with auto-insert "/" functionality
function setupDateInputAutoSlash(dateInput) {
    if (!dateInput) return;
    
    let isTyping = false;
    
    // Track when user starts typing
    dateInput.addEventListener('keydown', function(e) {
        // Mark that user is typing
        if (!['Tab', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
            isTyping = true;
        }
        
        // Handle backspace to remove slashes properly
        if (e.key === 'Backspace') {
            const cursorPos = this.selectionStart;
            const value = this.value;
            
            // If backspace is pressed on a slash, remove the slash and the digit before it
            if (cursorPos > 0 && value[cursorPos - 1] === '/') {
                e.preventDefault();
                const newValue = value.substring(0, cursorPos - 2) + value.substring(cursorPos);
                this.value = newValue;
                this.setSelectionRange(cursorPos - 2, cursorPos - 2);
            }
        }
    });
    
    // Auto-insert "/" as user types (format: YYYY/MM/DD)
    dateInput.addEventListener('input', function(e) {
        if (isTyping) {
            // Remove all non-digit characters
            let cleanValue = this.value.replace(/\D/g, '');
            
            // Auto-insert slashes
            if (cleanValue.length > 4) {
                cleanValue = cleanValue.substring(0, 4) + '/' + cleanValue.substring(4);
            }
            if (cleanValue.length > 7) {
                cleanValue = cleanValue.substring(0, 7) + '/' + cleanValue.substring(7, 9);
            }
            // Limit to 10 characters (YYYY/MM/DD)
            if (cleanValue.length > 10) {
                cleanValue = cleanValue.substring(0, 10);
            }
            
            // Update the input value
            const cursorPos = this.selectionStart;
            this.value = cleanValue;
            // Try to maintain cursor position
            const newCursorPos = Math.min(cursorPos + (cleanValue.length > this.value.length ? 1 : 0), cleanValue.length);
            this.setSelectionRange(newCursorPos, newCursorPos);
        }
        
        isTyping = false;
    });
    
    // Reset typing flag on blur
    dateInput.addEventListener('blur', function() {
        isTyping = false;
    });
}

// Set default date inputs to Persian calendar
function setPersianDateInputs() {
    // Set today's date in Persian format for date inputs
    const today = getCurrentPersianDate();
    
    // Update all date inputs to use Persian calendar
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        // Convert Persian date to Gregorian for HTML date input
        const gregorianDate = convertToGregorianDate(today);
        input.value = gregorianDate;
        
        // Add Persian date display
        const persianDisplay = document.createElement('small');
        persianDisplay.className = 'form-text text-muted persian-date-display';
        persianDisplay.textContent = `تاریخ شمسی: ${today}`;
        input.parentNode.appendChild(persianDisplay);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize Persian year dropdown with retry mechanism
    initializeYearDropdownWithRetry();
    
    // Also ensure year dropdown is ready after a delay
    setTimeout(() => {
        ensureYearDropdownReady();
    }, 500);
    
    
    // Add event listener for transaction modal
    const addTransactionModal = document.getElementById('addTransactionModal');
    if (addTransactionModal) {
        addTransactionModal.addEventListener('show.bs.modal', function () {
            // Load categories and sources when modal is opened
            loadCategories();
            loadSources();
            // Always reset the form and show all fields
            const addTransactionForm = document.getElementById('addTransactionForm');
            if (addTransactionForm) {
                addTransactionForm.reset();
            }
            
            // Setup date input with auto-insert "/" functionality
            const transactionDateInput = document.getElementById('transactionDate');
            if (transactionDateInput) {
                console.log('Setting up date input, fetching today date...');
                // Set today's date as default (fetch from backend)
                getCurrentPersianDate().then(today => {
                    console.log('Today date received:', today);
                    transactionDateInput.value = today;
                }).catch(error => {
                    console.error('Error setting today date:', error);
                    // Set fallback date
                    transactionDateInput.value = '1404/09/25';
                });
                
                // Setup auto-insert "/" functionality for manual typing
                setupDateInputAutoSlash(transactionDateInput);
            } else {
                console.warn('Transaction date input not found in modal');
            }
            
            // Setup currency symbol update
            const currencySelect = document.getElementById('transactionCurrency');
            const amountCurrency = document.getElementById('amountCurrency');
            if (currencySelect && amountCurrency) {
                // Function to update currency symbol
                function updateCurrencySymbol() {
                    const isUSD = currencySelect.value === 'true';
                    amountCurrency.textContent = isUSD ? '$' : 'ت';
                }
                
                // Set initial symbol based on current selection
                updateCurrencySymbol();
                
                // Update when currency changes
                currencySelect.addEventListener('change', updateCurrencySymbol);
            }
            // Hide parsed details section by default
            const parsedDetails = document.getElementById('parsedTransactionDetails');
            if (parsedDetails) {
                parsedDetails.style.display = 'none';
            }
            const saveTransactionBtn = document.getElementById('saveTransactionBtn');
            if (saveTransactionBtn) {
                // Remove previous listeners to avoid duplicates
                const newBtn = saveTransactionBtn.cloneNode(true);
                saveTransactionBtn.parentNode.replaceChild(newBtn, saveTransactionBtn);
                newBtn.addEventListener('click', saveTransaction);
            }
        });
    }

    // Add event listener for edit transaction modal
    const editTransactionModal = document.getElementById('editTransactionModal');
    if (editTransactionModal) {
        editTransactionModal.addEventListener('show.bs.modal', function () {
            // Load categories and sources when modal is opened
            loadCategories();
            loadSources();
            
            // Populate category dropdown
            const categorySelect = document.getElementById('editTransactionCategory');
            if (categorySelect && allCategories) {
                categorySelect.innerHTML = '';
                allCategories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    categorySelect.appendChild(option);
                });
            }
            
            // Populate source dropdown
            const sourceSelect = document.getElementById('editTransactionSource');
            if (sourceSelect && allSources) {
                sourceSelect.innerHTML = '';
                allSources.forEach(source => {
                    const option = document.createElement('option');
                    option.value = source.id;
                    option.textContent = source.name;
                    sourceSelect.appendChild(option);
                });
            }
            
            const saveEditedTransactionBtn = document.getElementById('saveEditedTransactionBtn');
            if (saveEditedTransactionBtn) {
                // Remove previous listeners to avoid duplicates
                const newBtn = saveEditedTransactionBtn.cloneNode(true);
                saveEditedTransactionBtn.parentNode.replaceChild(newBtn, saveEditedTransactionBtn);
                newBtn.addEventListener('click', saveEditedTransaction);
            }
        });
    }

    // Add event listener for add loan modal
    const addLoanModal = document.getElementById('addLoanModal');
    if (addLoanModal) {
        addLoanModal.addEventListener('show.bs.modal', function () {
            // Reset form
            const addLoanForm = document.getElementById('addLoanForm');
            if (addLoanForm) {
                addLoanForm.reset();
            }
        });
    }

    // Add event listener for save loan button using event delegation
    document.addEventListener('click', function(e) {
        // Removed debug log to reduce console noise
        if (e.target && e.target.id === 'saveLoanBtn') {
            console.log('Save loan button clicked');
            e.preventDefault();
            saveLoan();
        }
        if (e.target && e.target.id === 'saveLoanPaymentBtn') {
            console.log('Save loan payment button clicked');
            e.preventDefault();
            saveLoanPayment();
        }
        if (e.target && e.target.id === 'addPaymentFromDetailsBtn') {
            console.log('Add payment from details button clicked');
            e.preventDefault();
            addLoanPayment();
        }
        if (e.target && e.target.id === 'confirmDeleteBtn') {
            e.preventDefault();
            confirmDeleteTransaction();
        }
    });

    // Add event listener for currency change in loan modal
    document.addEventListener('change', function(e) {
        if (e.target && e.target.id === 'loanCurrency') {
            const currency = e.target.value === 'true' ? '$' : 'T';
            const totalCurrency = document.getElementById('loanTotalCurrency');
            const monthlyCurrency = document.getElementById('loanMonthlyCurrency');
            if (totalCurrency) totalCurrency.textContent = currency;
            if (monthlyCurrency) monthlyCurrency.textContent = currency;
        }
    });

    // Loan modal event listeners will be attached in initializePWAApp() after components are loaded
    
    // Currency toggle functionality
    const currencyItems = document.querySelectorAll('.dropdown-item');
    const currencyButton = document.getElementById('currencyDropdown');
    
    currencyItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const currencyText = this.innerText.trim();
            currencyButton.innerHTML = `${this.innerHTML.trim()}`;
            
            // Update displayed values based on selected currency
            updateDisplayCurrency(currencyText);
        });
    });
    
    // Load initial exchange rate
    fetchExchangeRate();
    
    // Refresh exchange rate every 30 minutes
    setInterval(() => fetchExchangeRate(), 30 * 60 * 1000);

    // ... after all components are loaded (inside loadedComponents === components.length check)

    fetchAndDisplayTotalBalance(); // Fetch total balance on page load
});

// Add global state for categories and sources
let allCategories = [];
let allSources = [];
let allLoans = [];
let currentEditingTransactionId = null;
let loanDisplayMode = 'default'; // 'default', 'usd', or 'toman'

// Toast Notification System
function showToast(message, type = 'info', duration = 4000) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        console.error('Toast container not found');
        return;
    }

    // Create unique ID for the toast
    const toastId = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    // Define toast styles based on type
    const toastStyles = {
        success: {
            icon: 'fas fa-check-circle',
            bgClass: 'bg-success',
            textClass: 'text-white'
        },
        error: {
            icon: 'fas fa-exclamation-circle',
            bgClass: 'bg-danger',
            textClass: 'text-white'
        },
        warning: {
            icon: 'fas fa-exclamation-triangle',
            bgClass: 'bg-warning',
            textClass: 'text-dark'
        },
        info: {
            icon: 'fas fa-info-circle',
            bgClass: 'bg-info',
            textClass: 'text-white'
        }
    };

    const style = toastStyles[type] || toastStyles.info;

    // Create toast HTML
    const toastHTML = `
        <div id="${toastId}" class="toast show ${style.bgClass} ${style.textClass}" role="alert" aria-live="assertive" aria-atomic="true" style="min-width: 300px; max-width: 400px;">
            <div class="toast-header ${style.bgClass} ${style.textClass} border-0">
                <i class="${style.icon} me-2"></i>
                <strong class="me-auto">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;

    // Add toast to container
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);

    // Get the toast element
    const toastElement = document.getElementById(toastId);
    
    // Auto-remove toast after duration
    setTimeout(() => {
        if (toastElement) {
            toastElement.classList.remove('show');
            setTimeout(() => {
                if (toastElement.parentNode) {
                    toastElement.parentNode.removeChild(toastElement);
                }
            }, 300); // Wait for fade out animation
        }
    }, duration);

    // Add click to dismiss functionality
    const closeBtn = toastElement.querySelector('.btn-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            toastElement.classList.remove('show');
            setTimeout(() => {
                if (toastElement.parentNode) {
                    toastElement.parentNode.removeChild(toastElement);
                }
            }, 300);
        });
    }
}

// Convenience functions for different toast types
function showSuccessToast(message, duration = 4000) {
    showToast(message, 'success', duration);
}

function showErrorToast(message, duration = 6000) {
    showToast(message, 'error', duration);
}

function showWarningToast(message, duration = 5000) {
    showToast(message, 'warning', duration);
}

function showInfoToast(message, duration = 4000) {
    showToast(message, 'info', duration);
}

// Load categories from API
async function loadCategories() {
    if (!checkAuth()) return;
    
    try {
        const response = await fetchWithAuth('/api/categories');
        if (response.ok) {
            const categories = await response.json();
            const categorySelect = document.getElementById('transactionCategory');
            if (categorySelect) {
                categorySelect.innerHTML = '';
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.name;
                    option.textContent = category.name;
                    categorySelect.appendChild(option);
                });
            }
            allCategories = categories;
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Load sources from API
async function loadSources() {
    console.log('loadSources() called');
    if (!checkAuth()) {
        console.log('checkAuth() returned false, redirecting to login');
        return;
    }
    
    console.log('Making API call to /api/sources');
    try {
        const response = await fetchWithAuth('/api/sources');
        console.log('Sources API response:', response);
        if (response.ok) {
            const sources = await response.json();
            console.log('Sources data received:', sources);
            const sourceSelect = document.getElementById('transactionSource');
            if (sourceSelect) {
                sourceSelect.innerHTML = '';
                sources.forEach(source => {
                    const option = document.createElement('option');
                    option.value = source.name;
                    option.textContent = source.name;
                    sourceSelect.appendChild(option);
                });
            }
            updateSourcesTable(sources);
            allSources = sources;
        } else {
            console.error('Sources API response not ok:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Error loading sources:', error);
    }
}

// Add global state for currency displays
let displayInUSD = true;
let currentMonth = 10; // Default fallback Persian month
let currentYear = 1404; // Default fallback Persian year

// Try to get current Persian month from moment.js
if (typeof moment !== 'undefined' && moment().format) {
    const monthStr = moment().format('jM');
    currentMonth = parseInt(monthStr);
    console.log('Initialized currentMonth with moment.js:', currentMonth);
} else {
    console.log('Moment.js not available, using fallback currentMonth:', currentMonth);
}

// Try to get current Persian year from moment.js
if (typeof moment !== 'undefined' && moment().format) {
    const yearStr = moment().format('jYYYY');
    currentYear = parseInt(yearStr);
    console.log('Initialized currentYear with moment.js:', currentYear);
} else {
    console.log('Moment.js not available, using fallback currentYear:', currentYear);
}
let currentPage = 1;
const itemsPerPage = 5;
let allTransactions = []; // Store all transactions
let currentExchangeRate = null;
let sourceDisplayMode = 'default'; // 'default', 'usd', or 'toman'

// Load transactions from API
async function loadTransactions(month = null, year = null) {
    console.log('loadTransactions function called', { month, year });
    
    if (!checkAuth()) {
        console.error('checkAuth() returned false - user not authenticated');
        return;
    }
    console.log('Authentication check passed');
    
    try {
        // Always read the current values directly from the selectors to ensure accuracy
        const monthSelector = document.getElementById('monthSelector');
        const yearSelector = document.getElementById('yearSelector');
        
        console.log('Selectors found:', { 
            monthSelector: !!monthSelector, 
            yearSelector: !!yearSelector,
            monthSelectorValue: monthSelector?.value,
            yearSelectorValue: yearSelector?.value
        });
        
        // Get month from selector if not provided or if selector exists
        if (monthSelector && monthSelector.value) {
            const selectorMonth = parseInt(monthSelector.value);
            if (!isNaN(selectorMonth) && selectorMonth >= 1 && selectorMonth <= 12) {
                month = selectorMonth;
                console.log('Reading month from monthSelector:', month);
            }
        }
        
        // Fallback to parameter or currentMonth if selector not available
        if (!month || isNaN(month)) {
            month = currentMonth || 10;
            console.log('Using fallback month:', month);
        }
        
        // Get year from selector if not provided
        if (yearSelector && yearSelector.value) {
            const selectorYear = parseInt(yearSelector.value);
            if (!isNaN(selectorYear) && selectorYear >= 1300) {
                year = selectorYear;
                console.log('Reading year from selector:', year);
            }
        }
        
        // Fallback to parameter or currentYear if selector not available
        if (!year || isNaN(year)) {
            year = currentYear || 1404;
            console.log('Using fallback year:', year);
        }
        
        console.log('loadTransactions called with:', { month, year, currentMonth, currentYear });
        
        // Ensure year dropdown is ready
        ensureYearDropdownReady();
        
        // Force valid values - no more NaN
        if (!year || isNaN(year) || year === 'NaN') {
            year = 1404; // Always use fallback year
            console.log('Forced year to fallback value:', year);
        }
        
        if (!month || isNaN(month) || month === 'NaN') {
            month = 10; // Always use fallback month
            console.log('Forced month to fallback value:', month);
        }
        
        // Convert to numbers to be absolutely sure
        year = Number(year);
        month = Number(month);
        
        console.log('Final values before API call:', { month, year, monthType: typeof month, yearType: typeof year });
        
        // Final validation - should never be NaN now
        if (isNaN(year) || isNaN(month)) {
            console.error('CRITICAL: Values are still NaN after forced fallbacks!', { month, year });
            year = 1404;
            month = 10;
            console.log('Emergency fallback applied:', { month, year });
        }
        
        // Send Jalali month/year directly to backend
        // Backend will convert the Jalali month range to Gregorian date range for database query
        // This is necessary because Jalali months can span across two Gregorian months
        const apiUrl = `/api/transactions?month=${month}&year=${year}`;
        console.log('Making API request to:', apiUrl);
        console.log('Loading transactions for Jalali month:', month, 'year:', year);
        
        const response = await fetchWithAuth(apiUrl);
        console.log('API response received:', { status: response.status, ok: response.ok });
        if (response.ok) {
            const data = await response.json();
            console.log('Raw data received from API:', data);
            console.log('Data type:', typeof data);
            console.log('Is array:', Array.isArray(data));
            
            // Handle different response formats
            let transactions;
            if (Array.isArray(data)) {
                transactions = data;
            } else if (data.transactions && Array.isArray(data.transactions)) {
                transactions = data.transactions;
                console.log('Found transactions in data.transactions');
            } else if (data.data && Array.isArray(data.data)) {
                transactions = data.data;
                console.log('Found transactions in data.data');
            } else {
                console.error('Unexpected response format:', data);
                transactions = [];
            }
            
            console.log('Transactions extracted:', transactions);
            console.log('Number of transactions:', transactions.length);
            
            // Store all transactions
            allTransactions = transactions;
            console.log('allTransactions stored:', allTransactions);
            console.log('allTransactions length:', allTransactions.length);
            
            // Calculate totals for transaction stats
            const totals = transactions.reduce((acc, tx) => {
                if (tx.is_deposit) {
                    acc.income += Math.abs(tx.price);
                } else {
                    acc.expense += Math.abs(tx.price);
                }
                return acc;
            }, { income: 0, expense: 0 });
            
            // Update summary and table
            updateTransactionSummary(totals.income, totals.expense);
            
            // Always update the transactions table to display the loaded data immediately
            console.log('Calling updateTransactionsTable(1)...');
            updateTransactionsTable(1); // Reset to first page when loading new data
            console.log('updateTransactionsTable called');
            
            // Attach download button event listener after transactions are loaded
            attachDownloadButtonListener();
        } else {
            // If response is not ok, throw an error
            const errorText = await response.text();
            throw new Error(`Failed to load transactions: ${errorText}`);
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
        const transactionsTable = document.querySelector('#transactions-table tbody');
        if (transactionsTable) {
            transactionsTable.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-danger">
                        Failed to load transactions. Please try again later.
                    </td>
                </tr>
            `;
        }
        // Re-throw error so callers can handle it
        throw error;
    }
}

// Parse transaction description using AI
function parseTransactionDescription() {
    console.log('Parse transaction button clicked');
    
    const description = document.getElementById('transactionDescription').value;
    if (!description) {
        showWarningToast('Please enter a transaction description.');
        return;
    }
    
    // Show loading state
    const parseBtn = document.getElementById('parseTransactionBtn');
    const buttonText = parseBtn.querySelector('.button-text');
    const spinner = parseBtn.querySelector('.spinner-border');
    
    // Disable button and show spinner
    parseBtn.disabled = true;
    buttonText.style.opacity = '0';
    spinner.classList.remove('d-none');
    
    fetchWithAuth('/api/parse_transaction', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: description })
    })
    .then(response => {
        console.log('Parse response status:', response.status);
        if (response.status !== 200) {
            // Try to get error details
            return response.text().then(text => {
                console.error('Parse error response:', text);
                throw new Error(`Failed to parse transaction: ${response.status} - ${text}`);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Parse response data:', data);
        // Fill form with parsed data
        document.getElementById('transactionName').value = data.name;
        // Set the parsed date (already in Persian format from backend)
        const dateInput = document.getElementById('transactionDate');
        if (dateInput) {
            // Remove 'j' prefix if present and normalize format
            let persianDate = data.date.replace(/^j/, '').replace(/-/g, '/');
            // Normalize to YYYY/MM/DD format
            const dateParts = persianDate.split('/');
            if (dateParts.length === 3) {
                persianDate = `${dateParts[0]}/${dateParts[1].padStart(2, '0')}/${dateParts[2].padStart(2, '0')}`;
            }
            dateInput.value = persianDate;
            // The date picker will automatically update when the value changes
        }
        document.getElementById('transactionAmount').value = data.price;
        document.getElementById('transactionCurrency').value = data.is_usd.toString();
        
        // Try to select the category and source if they exist
        const categorySelect = document.getElementById('transactionCategory');
        const sourceSelect = document.getElementById('transactionSource');
        const transactionTypeSelect = document.getElementById('transactionType');
        
        // If it's a deposit, force select 'income' category and transaction type
        if (data.is_deposit) {
            // Find and select 'income' category
            for (let i = 0; i < categorySelect.options.length; i++) {
                if (categorySelect.options[i].value.toLowerCase() === 'income') {
                    categorySelect.selectedIndex = i;
                    break;
                }
            }
            // Select income in transaction type dropdown
            transactionTypeSelect.value = 'income';
        } else {
            // For non-deposits, select the parsed category and expense type
            for (let i = 0; i < categorySelect.options.length; i++) {
                if (categorySelect.options[i].value.toLowerCase() === data.category_name.toLowerCase()) {
                    categorySelect.selectedIndex = i;
                    break;
                }
            }
            transactionTypeSelect.value = 'expense';
        }
        
        // Find and select source
        for (let i = 0; i < sourceSelect.options.length; i++) {
            if (sourceSelect.options[i].value.toLowerCase() === data.source_name.toLowerCase()) {
                sourceSelect.selectedIndex = i;
                break;
            }
        }
        
        // Show the parsed details
        const parsedDetails = document.getElementById('parsedTransactionDetails');
        if (parsedDetails) {
            parsedDetails.style.display = 'block';
        }
    })
    .catch(error => {
        console.error('Error parsing transaction:', error);
        showErrorToast('تجزیه تراکنش ناموفق بود. لطفاً دوباره تلاش کنید یا فرم را دستی پر کنید.');
    })
    .finally(() => {
        // Reset button state
        parseBtn.disabled = false;
        buttonText.style.opacity = '1';
        spinner.classList.add('d-none');
    });
}

// Save transaction to database
function saveTransaction() {
    console.log('Save transaction button clicked');
    
    // Get form values
    const name = document.getElementById('transactionName').value;
    const dateInput = document.getElementById('transactionDate').value;
    // Date is already in Persian format (YYYY/MM/DD) from the date picker
    // Just normalize it to ensure proper format
    let date = dateInput.trim();
    // Remove 'j' prefix if present and normalize separators
    date = date.replace(/^j/, '').replace(/-/g, '/');
    // Ensure format is YYYY/MM/DD
    if (!date.match(/^\d{4}\/\d{1,2}\/\d{1,2}$/)) {
        console.error('Invalid date format:', date);
        showWarningToast('لطفا تاریخ معتبر وارد کنید');
        return;
    }
    // Normalize month and day to 2 digits
    const dateParts = date.split('/');
    date = `${dateParts[0]}/${dateParts[1].padStart(2, '0')}/${dateParts[2].padStart(2, '0')}`;
    const price = parseFloat(document.getElementById('transactionAmount').value);
    const is_usd = document.getElementById('transactionCurrency').value === 'true';
    const category_name = document.getElementById('transactionCategory').value;
    const source_name = document.getElementById('transactionSource').value;
    const transactionType = document.getElementById('transactionType').value;
    const is_deposit = transactionType === 'income';
    
    console.log('Form values:', {
        name, date, price, is_usd, category_name, source_name, transactionType, is_deposit
    });
    
    // Validate form
    if (!name || !date || isNaN(price) || !category_name || !source_name) {
        showWarningToast('Please fill all fields correctly.');
        return;
    }
    
    // Check if categories and sources are loaded
    if (!allCategories || allCategories.length === 0) {
        showWarningToast('Categories are still loading. Please wait a moment and try again.');
        return;
    }
    
    if (!allSources || allSources.length === 0) {
        showWarningToast('Sources are still loading. Please wait a moment and try again.');
        return;
    }

    // Find IDs for category and source
    console.log('Looking for category:', category_name, 'in categories:', allCategories);
    console.log('Looking for source:', source_name, 'in sources:', allSources);
    
    const cat = allCategories.find(c => c.name === category_name);
    const src = allSources.find(s => s.name === source_name);
    
    if (!cat || !src) {
        console.error('Category or source not found:', { cat, src, category_name, source_name });
        showErrorToast('دسته‌بندی یا منبع نامعتبر است. لطفاً مطمئن شوید که دسته‌بندی‌ها و منابع بارگذاری شده‌اند.');
        return;
    }

    let requestData, endpoint;
    if (is_deposit) {
        // For income, use names and /api/add_income
        requestData = {
            name,
            date,
            price: Math.abs(price),
            is_usd,
            category_name,
            source_name,
            is_deposit: true
        };
        endpoint = '/api/add_income';
    } else {
        // For expense, use IDs and /api/add_transaction
        requestData = {
            name,
            date,
            price: Math.abs(price),
            is_usd,
            category_id: cat.id,
            source_id: src.id
        };
        endpoint = '/api/add_transaction';
    }

    // Show loading state
    const saveBtn = document.getElementById('saveTransactionBtn');
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;

    // Send to API
    console.log('Sending request to:', endpoint, 'with data:', requestData);
    
    fetchWithAuth(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
    .then(response => {
        if (!response.ok) {
            // Try to parse error response
            return response.text().then(text => {
                console.error('API Error Response:', text);
                try {
                    const errorData = JSON.parse(text);
                    throw new Error(errorData.detail || 'Failed to save transaction');
                } catch (parseError) {
                    throw new Error(`Server Error: ${text}`);
                }
            });
        }
        return response.json();
    })
    .then(data => {
        // Close modal and refresh data
        const modal = bootstrap.Modal.getInstance(document.getElementById('addTransactionModal'));
        modal.hide();
        
        // Reset form
        document.getElementById('addTransactionForm').reset();
        const parsedDetails = document.getElementById('parsedTransactionDetails');
        if (parsedDetails) {
            parsedDetails.style.display = 'none';
        }
        
        // Refresh data
        loadTransactions();
        loadSources();
    })
    .catch(error => {
        console.error('Error saving transaction:', error);
        showErrorToast(error.message || 'ذخیره تراکنش ناموفق بود. لطفاً دوباره تلاش کنید.');
    })
    .finally(() => {
        // Reset button state
        saveBtn.textContent = 'Save Transaction';
        saveBtn.disabled = false;
    });
}

// Save source to database
function saveSource() {
    // Get form values
    const name = document.getElementById('sourceName').value;
    const bank = document.getElementById('sourceType').value === 'true';
    const usd = document.getElementById('sourceCurrency').value === 'true';
    const value = parseFloat(document.getElementById('sourceValue').value);
    
    // Validate form
    if (!name || isNaN(value)) {
        showWarningToast('Please fill all fields correctly.');
        return;
    }
    
    // Show loading state
    const saveBtn = document.getElementById('saveSourceBtn');
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;
    
    // Send to API
    fetchWithAuth('/api/add_source', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name,
            bank,
            usd,
            value
        })
    })
    .then(response => {
        if (!response.ok) {
            // Try to parse error response
            return response.text().then(text => {
                console.error('API Error Response:', text);
                try {
                    const errorData = JSON.parse(text);
                    throw new Error(errorData.detail || 'Failed to save source');
                } catch (parseError) {
                    throw new Error(`Server Error: ${text}`);
                }
            });
        }
        return response.json();
    })
    .then(data => {
        // Close modal and refresh data
        const modal = bootstrap.Modal.getInstance(document.getElementById('addSourceModal'));
        modal.hide();
        
        // Reset form
        document.getElementById('addSourceForm').reset();
        
        // Refresh data
        loadSources();
        
        // Show success message
        showSuccessToast('منبع با موفقیت اضافه شد!');
    })
    .catch(error => {
        console.error('Error saving source:', error);
        showErrorToast(error.message || 'Failed to save source. Please try again.');
    })
    .finally(() => {
        // Reset button state
        saveBtn.textContent = 'Save Source';
        saveBtn.disabled = false;
    });
}

// Fetch and display total balance from backend
async function fetchAndDisplayTotalBalance() {
    if (!checkAuth()) return;
    try {
        const response = await fetchWithAuth('/api/totalsource?usd=true');
        if (response && response.ok) {
            const data = await response.json();
            const totalBalanceEl = document.getElementById('totalBalance');
            if (totalBalanceEl) {
                totalBalanceEl.textContent = `$${data.total_usd.toFixed(2)}`;
            }
        } else {
            const totalBalanceEl = document.getElementById('totalBalance');
            if (totalBalanceEl) {
                totalBalanceEl.textContent = 'Error';
            }
        }
    } catch (error) {
        console.error('Error fetching total balance:', error);
        const totalBalanceEl = document.getElementById('totalBalance');
        if (totalBalanceEl) {
            totalBalanceEl.textContent = 'Error';
        }
    }
}

// Update sources table - Mobile PWA optimized
function updateSourcesTable(sources) {
    // Update mobile sources list
    const sourcesList = document.querySelector('#sources-list');
    if (sourcesList) {
        sourcesList.innerHTML = '';
        sources.forEach(source => {
            const sourceCard = createSourceCard(source);
            sourcesList.appendChild(sourceCard);
        });
    }
    
    // Update desktop table
    const tbody = document.querySelector('#sources-table tbody');
    if (tbody) {
        tbody.innerHTML = '';
        sources.forEach(source => {
            const row = document.createElement('tr');
            
            // Calculate icon and background class
            let iconClass = source.bank ? 'fa-university' : 'fa-wallet';
            let bgClass = source.usd ? 'bg-success' : 'bg-primary';
            
            // Calculate values in different currencies
            let valueInUSD, valueInToman, defaultValue;
            if (source.usd) {
                valueInUSD = source.value;
                valueInToman = source.value * currentExchangeRate;
                defaultValue = `$${source.value.toFixed(2)}`;
            } else {
                valueInUSD = source.value / currentExchangeRate;
                valueInToman = source.value;
                defaultValue = `${source.value.toLocaleString()} T`;
            }
            
            // Format value based on display mode
            let formattedValue;
            switch (sourceDisplayMode) {
                case 'usd':
                    formattedValue = `$${valueInUSD.toFixed(2)}`;
                    break;
                case 'toman':
                    formattedValue = `${valueInToman.toLocaleString()} T`;
                    break;
                default:
                    formattedValue = defaultValue;
            }
                
            row.innerHTML = `
                <td>
                    <div class="d-flex align-items-center">
                        <div class="source-icon ${bgClass}">
                            <i class="fas ${iconClass}"></i>
                        </div>
                        <div class="ms-3">
                            <h6 class="mb-0">${source.name}</h6>
                        </div>
                    </div>
                </td>
                <td>${source.bank ? 'بانک' : 'نقد'}</td>
                <td class="source-value" 
                    data-usd="${valueInUSD.toFixed(2)}"
                    data-toman="${valueInToman.toLocaleString()}"
                    data-default="${defaultValue}">
                    ${formattedValue}
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }
    // Always update the Total Balance card from backend
    fetchAndDisplayTotalBalance();
}

// Create mobile source card
function createSourceCard(source) {
    const card = document.createElement('div');
    card.className = 'table-row';
    
    // Calculate icon and background class
    let iconClass = source.bank ? 'fa-university' : 'fa-wallet';
    let bgClass = source.usd ? 'bg-success' : 'bg-primary';
    
    // Calculate values in different currencies
    let valueInUSD, valueInToman, defaultValue;
    if (source.usd) {
        valueInUSD = source.value;
        valueInToman = source.value * currentExchangeRate;
        defaultValue = `$${source.value.toFixed(2)}`;
    } else {
        valueInUSD = source.value / currentExchangeRate;
        valueInToman = source.value;
        defaultValue = `${source.value.toLocaleString()} T`;
    }
    
    // Format value based on display mode
    let formattedValue;
    switch (sourceDisplayMode) {
        case 'usd':
            formattedValue = `$${valueInUSD.toFixed(2)}`;
            break;
        case 'toman':
            formattedValue = `${valueInToman.toLocaleString()} T`;
            break;
        default:
            formattedValue = defaultValue;
    }
    
    card.innerHTML = `
        <div class="table-row-icon ${bgClass}">
            <i class="fas ${iconClass}"></i>
        </div>
        <div class="table-row-content">
            <h6 class="table-row-title">${source.name}</h6>
            <p class="table-row-subtitle">${source.bank ? 'حساب بانکی' : 'نقد'}</p>
        </div>
        <div class="table-row-value source-value" 
             data-usd="${valueInUSD.toFixed(2)}"
             data-toman="${valueInToman.toLocaleString()}"
             data-default="${defaultValue}">
            ${formattedValue}
        </div>
    `;
    
    return card;
}

// Function to toggle source display mode
function toggleSourceDisplayMode(mode) {
    sourceDisplayMode = mode;
    
    // Update all source value cells (both mobile and desktop)
    const sourceCells = document.querySelectorAll('.source-value');
    sourceCells.forEach(cell => {
        let value;
        switch (mode) {
            case 'usd':
                value = `$${cell.getAttribute('data-usd')}`;
                break;
            case 'toman':
                value = `${cell.getAttribute('data-toman')} T`;
                break;
            default:
                value = cell.getAttribute('data-default');
        }
        cell.textContent = value;
    });
    
    // Update the toggle button states
    const buttons = document.querySelectorAll('.source-currency-toggle');
    buttons.forEach(button => {
        button.classList.toggle('active', button.getAttribute('data-mode') === mode);
    });
    
    // Reload sources to update the display
    loadSources();
}

// Update transactions table with pagination - Mobile PWA optimized
function updateTransactionsTable(page = 1) {
    console.log('updateTransactionsTable called with page:', page);
    console.log('allTransactions:', allTransactions);
    console.log('allTransactions length:', allTransactions ? allTransactions.length : 0);
    
    currentPage = page;
    const tbody = document.querySelector('#transactions-table tbody');
    const transactionsList = document.querySelector('#transactions-list');
    const paginationContainer = document.querySelector('#transactionsPagination');
    
    console.log('Elements found:', {
        tbody: !!tbody,
        transactionsList: !!transactionsList,
        paginationContainer: !!paginationContainer
    });
    
    if (!allTransactions || allTransactions.length === 0) {
        console.log('No transactions to display, showing empty state');
        // Show empty state
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-5">
                        <div class="empty-state">
                            <div class="empty-state-icon">
                                <i class="fas fa-receipt"></i>
                            </div>
                            <h6 class="empty-state-title">تراکنشی یافت نشد</h6>
                            <p class="empty-state-text mb-3">برای ماه و سال انتخاب شده تراکنشی ثبت نشده است.</p>
                            <button class="btn btn-primary btn-sm btn-add-first-transaction" data-bs-toggle="modal" data-bs-target="#addTransactionModal">
                                <i class="fas fa-plus me-2"></i>
                                افزودن اولین تراکنش
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
        if (transactionsList) {
            transactionsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-receipt"></i>
                    </div>
                    <h5 class="empty-state-title">تراکنشی یافت نشد</h5>
                    <p class="empty-state-text">برای ماه و سال انتخاب شده تراکنشی ثبت نشده است.</p>
                    <button class="btn btn-primary btn-add-first-transaction" data-bs-toggle="modal" data-bs-target="#addTransactionModal">
                        <i class="fas fa-plus me-2"></i>
                        افزودن اولین تراکنش
                    </button>
                </div>
            `;
        }
        return;
    }
    
    // Calculate pagination
    const totalItems = allTransactions.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    
    // Get current page transactions
    const currentTransactions = allTransactions.slice(startIndex, endIndex);
    
    console.log('Pagination info:', {
        totalItems,
        totalPages,
        startIndex,
        endIndex,
        currentTransactionsLength: currentTransactions.length
    });
    console.log('Current transactions to display:', currentTransactions);
    
    // Update mobile transactions list
    if (transactionsList) {
        console.log('Updating mobile transactions list...');
        transactionsList.innerHTML = '';
        if (currentTransactions.length === 0) {
            transactionsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-receipt"></i>
                    </div>
                    <h5 class="empty-state-title">تراکنشی یافت نشد</h5>
                    <p class="empty-state-text">برای ماه و سال انتخاب شده تراکنشی ثبت نشده است.</p>
                    <button class="btn btn-primary btn-add-first-transaction" data-bs-toggle="modal" data-bs-target="#addTransactionModal">
                        <i class="fas fa-plus me-2"></i>
                        افزودن اولین تراکنش
                    </button>
                </div>
            `;
        } else {
            console.log('Creating mobile transaction cards, count:', currentTransactions.length);
            currentTransactions.forEach((tx, index) => {
                console.log(`Creating card ${index + 1}:`, tx);
                const transactionCard = createTransactionCard(tx);
                if (transactionCard) {
                transactionsList.appendChild(transactionCard);
                } else {
                    console.error('createTransactionCard returned null for transaction:', tx);
                }
            });
            console.log('Mobile transactions list updated, children count:', transactionsList.children.length);
        }
    } else {
        console.warn('transactionsList element not found!');
    }
    
    // Update desktop table
    if (tbody) {
        console.log('Updating desktop table...');
        tbody.innerHTML = '';
        if (currentTransactions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-5">
                        <div class="empty-state">
                            <div class="empty-state-icon">
                                <i class="fas fa-receipt"></i>
                            </div>
                            <h6 class="empty-state-title">تراکنشی یافت نشد</h6>
                            <p class="empty-state-text mb-3">برای ماه و سال انتخاب شده تراکنشی ثبت نشده است.</p>
                            <button class="btn btn-primary btn-sm btn-add-first-transaction" data-bs-toggle="modal" data-bs-target="#addTransactionModal">
                                <i class="fas fa-plus me-2"></i>
                                افزودن اولین تراکنش
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            console.log('Creating desktop table rows, count:', currentTransactions.length);
            currentTransactions.forEach((tx, index) => {
            console.log(`Creating table row ${index + 1}:`, tx);
            const row = document.createElement('tr');
            
            // No icon logic, just display the category name
            // Map category_id to name using allCategories
            const categoryName = (allCategories.find(cat => cat.id === tx.category_id)?.name) || 'Other';
            
            let bgClass = tx.is_deposit ? 'bg-success' : 'bg-danger';
            
            // Calculate amounts for both currencies
            const amount = Math.abs(tx.price);
            const tomanAmount = amount * tx.your_currency_rate;
            
            // Format amounts for both currencies
            const usdAmount = `$${amount.toFixed(2)}`;
            const tomanAmountStr = `${tomanAmount.toLocaleString()} T`;
            
            // Always start with USD display
            const formattedAmount = displayInUSD ? usdAmount : tomanAmountStr;
            
            // Check if text contains Persian characters
            const hasPersian = /[\u0600-\u06FF]/.test(tx.name);
            const nameClass = hasPersian ? 'font-vazir text-end' : '';
            
            row.innerHTML = `
                <td>
                    <div class="d-flex align-items-center">
                        <div class="ms-3">
                            <h6 class="mb-0 ${nameClass}">${tx.name}</h6>
                            <small class="text-muted">${tx.source}</small>
                        </div>
                    </div>
                </td>
                <td>${categoryName}</td>
                <td class="transaction-date-persian">${tx.date}</td>
                <td>
                    <span class="badge ${tx.is_deposit ? 'bg-success' : 'bg-danger'}">
                        ${tx.is_deposit ? 'درآمد' : 'هزینه'}
                    </span>
                </td>
                <td class="amount-cell ${tx.is_deposit ? 'text-success' : 'text-danger'}" 
                    data-usd="${usdAmount}" 
                    data-toman="${tomanAmountStr}">
                    ${formattedAmount}
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="editTransaction(${tx.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="deleteTransaction(${tx.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            tbody.appendChild(row);
            });
            console.log('Desktop table rows appended, tbody children count:', tbody.children.length);
        }
    } else {
        console.warn('tbody element not found!');
    }
    
    // Update pagination UI
    if (paginationContainer) {
        let paginationHTML = `
            <nav aria-label="Transaction navigation">
                <ul class="pagination justify-content-center mb-0">
                    <li class="page-item ${page === 1 ? 'disabled' : ''}">
                        <a class="page-link" href="#" onclick="updateTransactionsTable(${page - 1}); return false;">
                            Previous
                        </a>
                    </li>
        `;
        
        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `
                <li class="page-item ${i === page ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="updateTransactionsTable(${i}); return false;">
                        ${i}
                    </a>
                </li>
            `;
        }
        
        paginationHTML += `
                    <li class="page-item ${page === totalPages ? 'disabled' : ''}">
                        <a class="page-link" href="#" onclick="updateTransactionsTable(${page + 1}); return false;">
                            Next
                        </a>
                    </li>
                </ul>
            </nav>
        `;
        
        paginationContainer.innerHTML = paginationHTML;
    }
}

// Create mobile transaction card
function createTransactionCard(tx) {
    const card = document.createElement('div');
    card.className = 'table-row';
    
    // Map category_id to name using allCategories
    const categoryName = (allCategories.find(cat => cat.id === tx.category_id)?.name) || 'Other';
    
    // Calculate amounts for both currencies
    const amount = Math.abs(tx.price);
    const tomanAmount = amount * tx.your_currency_rate;
    
    // Format amounts for both currencies
    const usdAmount = `$${amount.toFixed(2)}`;
    const tomanAmountStr = `${tomanAmount.toLocaleString()} T`;
    
    // Always start with USD display
    const formattedAmount = displayInUSD ? usdAmount : tomanAmountStr;
    
    // Check if text contains Persian characters
    const hasPersian = /[\u0600-\u06FF]/.test(tx.name);
    const nameClass = hasPersian ? 'font-vazir text-end' : '';
    
    // Determine icon and color based on transaction type
    let iconClass = tx.is_deposit ? 'fa-arrow-down' : 'fa-arrow-up';
    let bgClass = tx.is_deposit ? 'bg-success' : 'bg-danger';
    let amountClass = tx.is_deposit ? 'text-success' : 'text-danger';
    
    card.innerHTML = `
        <div class="table-row-icon ${bgClass}">
            <i class="fas ${iconClass}"></i>
        </div>
        <div class="table-row-content">
            <h6 class="table-row-title ${nameClass}">${tx.name}</h6>
            <p class="table-row-subtitle">
                ${categoryName} • <span class="transaction-date-persian">${tx.date}</span>
            </p>
            <span class="badge ${tx.is_deposit ? 'bg-success' : 'bg-danger'}">
                ${tx.is_deposit ? 'درآمد' : 'هزینه'}
            </span>
        </div>
        <div class="table-row-value amount-cell ${amountClass}" 
             data-usd="${usdAmount}" 
             data-toman="${tomanAmountStr}">
            ${formattedAmount}
        </div>
        <div class="table-row-actions">
            <button class="btn btn-sm btn-outline-primary" onclick="editTransaction(${tx.id})" title="Edit">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteTransaction(${tx.id})" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    return card;
}

// Edit transaction function
function editTransaction(transactionId) {
    console.log('Edit transaction:', transactionId);
    
    // Find the transaction in allTransactions
    const transaction = allTransactions.find(tx => tx.id === transactionId);
    if (!transaction) {
        showErrorToast('Transaction not found');
        return;
    }
    
    // Populate the edit form (we'll create this modal)
    populateEditForm(transaction);
    
    // Show the edit modal
    const editModal = new bootstrap.Modal(document.getElementById('editTransactionModal'));
    editModal.show();
}

// Delete transaction function
function deleteTransaction(transactionId) {
    console.log('Delete transaction:', transactionId);
    
    // Find the transaction in allTransactions
    const transaction = allTransactions.find(tx => tx.id === transactionId);
    if (!transaction) {
        showErrorToast('Transaction not found');
        return;
    }
    
    // Show custom confirmation modal
    showDeleteConfirmationModal(transaction);
}

// Show custom delete confirmation modal
function showDeleteConfirmationModal(transaction) {
    // Populate modal with transaction data
    document.getElementById('deleteTransactionName').textContent = transaction.name;
    document.getElementById('deleteTransactionDate').innerHTML = `<span class="transaction-date-persian">${convertToPersianDate(transaction.date)}</span>`;
    
    // Format amount based on currency
    const amount = Math.abs(transaction.price);
    const currency = transaction.is_usd ? '$' : 'T';
    const formattedAmount = transaction.is_usd ? 
        `$${amount.toFixed(2)}` : 
        `${amount.toLocaleString()} T`;
    
    document.getElementById('deleteTransactionAmount').textContent = formattedAmount;
    document.getElementById('deleteTransactionType').textContent = transaction.is_deposit ? 'درآمد' : 'هزینه';
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('deleteConfirmationModal'));
    modal.show();
    
    // Store transaction ID for deletion
    window.pendingDeleteTransactionId = transaction.id;
}

// Confirm delete transaction
function confirmDeleteTransaction() {
    const transactionId = window.pendingDeleteTransactionId;
    if (!transactionId) {
        showErrorToast('No transaction selected for deletion');
        return;
    }
    
    // Show loading state
    showLoadingOverlay();
    
    // Call delete API
    fetchWithAuth(`/api/transactions/${transactionId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                console.error('API Error Response:', text);
                try {
                    const errorData = JSON.parse(text);
                    throw new Error(errorData.detail || 'Failed to delete transaction');
                } catch (parseError) {
                    throw new Error(`Server Error: ${text}`);
                }
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Transaction deleted:', data);
        
        // Close the delete confirmation modal
        const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmationModal'));
        if (deleteModal) {
            deleteModal.hide();
        }
        
        // Remove from allTransactions array
        allTransactions = allTransactions.filter(tx => tx.id !== transactionId);
        
        // Refresh the display
        updateTransactionsTable(currentPage);
        loadSources(); // Refresh sources to update balances
        
        showSuccessToast('تراکنش با موفقیت حذف شد');
    })
    .catch(error => {
        console.error('Error deleting transaction:', error);
        showErrorToast(error.message || 'Failed to delete transaction. Please try again.');
    })
    .finally(() => {
        hideLoadingOverlay();
        // Clear pending delete
        window.pendingDeleteTransactionId = null;
    });
}

// Populate edit form with transaction data
function populateEditForm(transaction) {
    document.getElementById('editTransactionName').value = transaction.name;
    document.getElementById('editTransactionDate').value = transaction.date;
    document.getElementById('editTransactionAmount').value = Math.abs(transaction.price);
    document.getElementById('editTransactionCurrency').value = transaction.is_usd ? 'true' : 'false';
    document.getElementById('editTransactionType').value = transaction.is_deposit ? 'income' : 'expense';
    
    // Set category and source
    const categorySelect = document.getElementById('editTransactionCategory');
    const sourceSelect = document.getElementById('editTransactionSource');
    
    if (categorySelect) {
        categorySelect.value = transaction.category_id;
    }
    if (sourceSelect) {
        sourceSelect.value = transaction.source_id;
    }
    
    // Store transaction ID for the update
    document.getElementById('editTransactionForm').dataset.transactionId = transaction.id;
}

// Save edited transaction
function saveEditedTransaction() {
    const form = document.getElementById('editTransactionForm');
    const transactionId = form.dataset.transactionId;
    
    if (!transactionId) {
        showErrorToast('Transaction ID not found');
        return;
    }
    
    // Get form values
    const name = document.getElementById('editTransactionName').value;
    const date = document.getElementById('editTransactionDate').value;
    const price = parseFloat(document.getElementById('editTransactionAmount').value);
    const is_usd = document.getElementById('editTransactionCurrency').value === 'true';
    const is_deposit = document.getElementById('editTransactionType').value === 'income';
    const category_id = parseInt(document.getElementById('editTransactionCategory').value);
    const source_id = parseInt(document.getElementById('editTransactionSource').value);
    
    // Validate form
    if (!name || !date || isNaN(price) || !category_id || !source_id) {
        showWarningToast('Please fill all fields correctly.');
        return;
    }
    
    // Get current exchange rate for your_currency_rate
    const your_currency_rate = currentExchangeRate || 50000; // fallback rate
    
    const updateData = {
        name,
        date,
        price: Math.abs(price),
        is_usd,
        category_id,
        source_id,
        your_currency_rate,
        is_deposit
    };
    
    console.log('Updating transaction:', transactionId, 'with data:', updateData);
    
    // Show loading state
    const saveBtn = document.getElementById('saveEditedTransactionBtn');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;
    
    // Call update API
    fetchWithAuth(`/api/transactions/${transactionId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                console.error('API Error Response:', text);
                try {
                    const errorData = JSON.parse(text);
                    throw new Error(errorData.detail || 'Failed to update transaction');
                } catch (parseError) {
                    throw new Error(`Server Error: ${text}`);
                }
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Transaction updated:', data);
        
        // Update the transaction in allTransactions array
        const index = allTransactions.findIndex(tx => tx.id === parseInt(transactionId));
        if (index !== -1) {
            allTransactions[index] = data;
        }
        
        // Close modal and refresh display
        const modal = bootstrap.Modal.getInstance(document.getElementById('editTransactionModal'));
        modal.hide();
        
        // Refresh the display
        updateTransactionsTable(currentPage);
        loadSources(); // Refresh sources to update balances
        
        showSuccessToast('تراکنش با موفقیت به‌روزرسانی شد');
    })
    .catch(error => {
        console.error('Error updating transaction:', error);
        showErrorToast(error.message || 'Failed to update transaction. Please try again.');
    })
    .finally(() => {
        // Reset button state
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
    });
}

// Function to toggle transaction currency display
function toggleTransactionCurrency() {
    // Toggle the state
    displayInUSD = !displayInUSD;
    
    // Update toggle button text
    const toggleBtn = document.getElementById('toggleCurrencyBtn');
    if (toggleBtn) {
        const span = toggleBtn.querySelector('span');
        if (span) {
            span.textContent = `Show in ${displayInUSD ? 'Toman' : 'USD'}`;
        } else {
            toggleBtn.innerHTML = `<i class="fas fa-exchange-alt"></i> <span>Show in ${displayInUSD ? 'Toman' : 'USD'}</span>`;
        }
    }
    
    // Update all amount cells (both mobile and desktop)
    const amountCells = document.querySelectorAll('.amount-cell');
    amountCells.forEach(cell => {
        const usdAmount = cell.getAttribute('data-usd');
        const tomanAmount = cell.getAttribute('data-toman');
        cell.textContent = displayInUSD ? usdAmount : tomanAmount;
    });
    
    // Just update the table display, don't reload from server
    // The transactions are already loaded, we just need to refresh the display
    updateTransactionsTable(currentPage);
}

// Update balance summary cards
function updateBalanceSummary(totalUSD, totalToman) {
    const usdBalanceEl = document.querySelector('#usdBalance');
    const tomanBalanceEl = document.querySelector('#tomanBalance');
    
    if (usdBalanceEl) {
        usdBalanceEl.textContent = `$${totalUSD.toFixed(2)}`;
    }
    if (tomanBalanceEl) {
        tomanBalanceEl.textContent = `${totalToman.toLocaleString()} T`;
    }
}

// Update transaction summary cards
function updateTransactionSummary(totalIncome, totalExpense) {
    const incomeEl = document.querySelector('#totalIncome');
    const expenseEl = document.querySelector('#totalExpense');
    
    if (incomeEl) {
        incomeEl.textContent = `$${totalIncome.toFixed(2)}`;
    }
    if (expenseEl) {
        expenseEl.textContent = `$${totalExpense.toFixed(2)}`;
    }
}

// Fetch and display exchange rate
function fetchExchangeRate(live = false) {
    // Get button elements
    const refreshBtn = document.getElementById('refreshExchangeBtn');
    const icon = refreshBtn?.querySelector('.fa-sync-alt');
    const spinner = refreshBtn?.querySelector('.spinner-border');
    
    // Show loading state
    if (refreshBtn && live) {
        refreshBtn.disabled = true;
        icon.classList.add('d-none');
        spinner.classList.remove('d-none');
    }
    
    fetchWithAuth(`/api/exchange_rate?live=${live}`)
        .then(response => response.json())
        .then(data => {
            console.log('Exchange rate loaded:', data);
            currentExchangeRate = data.rate;
            updateExchangeRateDisplay(data);
            // Reload sources to update with new exchange rate
            loadSources();
        })
        .catch(error => {
            console.error('Error loading exchange rate:', error);
            // Show error in the exchange rate display
            const summaryExchangeRate = document.getElementById('summaryExchangeRate');
            if (summaryExchangeRate) {
                summaryExchangeRate.innerHTML = '<span class="text-danger">Failed to load</span>';
            }
        })
        .finally(() => {
            // Reset button state if it was a manual refresh
            if (refreshBtn && live) {
                refreshBtn.disabled = false;
                icon.classList.remove('d-none');
                spinner.classList.add('d-none');
            }
        });
}

function updateExchangeRateDisplay(data) {
    const formattedRate = new Intl.NumberFormat('en-US').format(Math.round(data.rate));
    
    // Update the summary card
    const summaryExchangeRate = document.getElementById('summaryExchangeRate');
    if (summaryExchangeRate) {
        summaryExchangeRate.textContent = formattedRate;
    }
}

// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// Add auth header to fetch requests
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token');
        window.location.href = '/login.html';
        return;
    }

    return response;
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
}

// Update all fetch calls to use fetchWithAuth
// ... existing code ...

// Example of updating a fetch call:
async function getSources() {
    if (!checkAuth()) return;
    
    try {
        const response = await fetchWithAuth('/api/sources');
        if (response.ok) {
            const sources = await response.json();
            // Handle sources data
        }
    } catch (error) {
        console.error('Error fetching sources:', error);
    }
}

// Switch view function for PWA navigation
function switchView(viewName) {
    console.log('switchView called with:', viewName);
    
    const views = document.querySelectorAll('.view-container');
    views.forEach(view => view.classList.add('d-none'));
    
    if (viewName === 'dashboard') {
        console.log('Switching to dashboard view');
        document.getElementById('dashboard-view').classList.remove('d-none');
    } else if (viewName === 'transactions') {
        console.log('Switching to transactions view');
        // For transactions view, we'll show the dashboard view but switch to transactions tab
        document.getElementById('dashboard-view').classList.remove('d-none');
        // Switch to transactions tab
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabPanes = document.querySelectorAll('.tab-pane');
        
        tabBtns.forEach(btn => btn.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));
        
        // Find and activate transactions tab
        const transactionsTabBtn = document.querySelector('.tab-btn[data-tab="transactions"]');
        const transactionsTabPane = document.getElementById('transactions-tab');
        
        if (transactionsTabBtn) transactionsTabBtn.classList.add('active');
        if (transactionsTabPane) transactionsTabPane.classList.add('active');
        
        // Load transactions for the current month
        // Don't load transactions automatically - user must click the "دیدن تراکنش‌ها" button
    }
}

// Make functions globally accessible
window.switchView = switchView;
window.loadSources = loadSources;
window.loadTransactions = loadTransactions;

// Initialize navigation event listeners
function initializeNavigation() {
    console.log('Initializing navigation...');
    
    // Use event delegation for better reliability
    document.addEventListener('click', function(e) {
        // Handle navigation items with data-view
        if (e.target.closest('.nav-item[data-view]')) {
            const navItem = e.target.closest('.nav-item[data-view]');
            e.preventDefault();
            const view = navItem.getAttribute('data-view');
            console.log('Navigation clicked:', view, 'Element:', navItem);
            switchView(view);
        }
        
        // Handle quick action buttons with data-action
        if (e.target.closest('.nav-item[data-action]')) {
            const actionBtn = e.target.closest('.nav-item[data-action]');
            e.preventDefault();
            const action = actionBtn.getAttribute('data-action');
            console.log('Quick action clicked:', action);
            handleQuickAction(action);
        }
    });
    
    // Also try direct event listeners as fallback
    setTimeout(() => {
        const navItems = document.querySelectorAll('.nav-item[data-view]');
        console.log('Found navigation items (fallback):', navItems.length, navItems);
        
        navItems.forEach(item => {
            // Remove any existing listeners to avoid duplicates
            item.replaceWith(item.cloneNode(true));
        });
        
        // Re-attach listeners
        document.querySelectorAll('.nav-item[data-view]').forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                const view = this.getAttribute('data-view');
                console.log('Navigation clicked (fallback):', view);
                switchView(view);
            });
        });
    }, 500);
}

// Handle quick actions
function handleQuickAction(action) {
    switch(action) {
        case 'add-transaction':
            const addTransactionModal = new bootstrap.Modal(document.getElementById('addTransactionModal'));
            addTransactionModal.show();
            break;
        case 'add-source':
            const addSourceModal = new bootstrap.Modal(document.getElementById('addSourceModal'));
            addSourceModal.show();
            break;
        case 'profile':
            // Handle profile action
            console.log('Profile clicked');
            break;
        default:
            console.log('Unknown action:', action);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    
    // Initialize navigation with a small delay to ensure all elements are ready
    setTimeout(() => {
        initializeNavigation();
    }, 100);
    
    // Load initial data
    loadInitialData();
});

// Also try to initialize navigation when window loads (fallback)
window.addEventListener('load', function() {
    console.log('Window loaded, ensuring navigation is initialized...');
    setTimeout(() => {
        initializeNavigation();
    }, 200);
});

// Load initial data
function loadInitialData() {
    console.log('Loading initial data...');
    
    // Check authentication
    if (!checkAuth()) {
        console.log('User not authenticated, redirecting to login');
        window.location.href = '/login.html';
        return;
    }
    
    // Load categories and sources
    loadCategories();
    loadSources();
    
    // Don't load transactions automatically - user must click the button
    
    // Load loans and loan summary
    loadLoans();
    loadLoanSummary();
    
    // Load exchange rate
    fetchExchangeRate();
    
    // Initialize month selector - use setTimeout to ensure component is loaded
    setTimeout(() => {
    initializeMonthSelector();
    }, 500);
    
    console.log('Initial data loaded');
}

// Initialize month selector - attach event listeners to trigger backend requests
function initializeMonthSelector() {
    console.log('Initializing month and year selectors...');
    
    // Initialize month selector
    const monthSelector = document.getElementById('monthSelector');
    if (monthSelector) {
        // Remove any existing event listeners by cloning the element
        const newMonthSelector = monthSelector.cloneNode(true);
        monthSelector.parentNode.replaceChild(newMonthSelector, monthSelector);
        
        // Set current month
        newMonthSelector.value = currentMonth;
        
        // Add event listener - automatically load transactions when month changes
        newMonthSelector.addEventListener('change', function() {
            const rawValue = this.value;
            const selectedMonth = parseInt(rawValue);
            
            // Validate the month value
            if (isNaN(selectedMonth) || selectedMonth < 1 || selectedMonth > 12) {
                console.error('Invalid month value:', rawValue);
                return;
            }
            
            // Update currentMonth for consistency
            currentMonth = selectedMonth;
            
            console.log('Month selector changed to:', selectedMonth);
        });
        
        console.log('Month selector initialized');
    } else {
        console.warn('Month selector not found');
    }
    
    // Initialize year selector
    const yearSelector = document.getElementById('yearSelector');
    if (yearSelector) {
        // Remove any existing event listeners by cloning the element
        const newYearSelector = yearSelector.cloneNode(true);
        yearSelector.parentNode.replaceChild(newYearSelector, yearSelector);
        
        // Set current year
        newYearSelector.value = currentYear;
        
        newYearSelector.addEventListener('change', function() {
            const rawValue = this.value;
            const selectedYear = parseInt(rawValue) || 1404; // Fallback to 1404
            
            // Validate the year value
            if (isNaN(selectedYear) || selectedYear < 1300 || selectedYear > 1500) {
                console.error('Invalid year value:', rawValue);
                return;
            }
            
            // Update currentYear for consistency
            currentYear = selectedYear;
            
            console.log('Year selector changed to:', selectedYear);
        });
        
        console.log('Year selector initialized');
    } else {
        console.warn('Year selector not found');
    }
    
    // Initialize currency toggle button
    const toggleCurrencyBtn = document.getElementById('toggleCurrencyBtn');
    if (toggleCurrencyBtn) {
        toggleCurrencyBtn.addEventListener('click', function() {
            toggleTransactionCurrency();
        });
    }
    
    // Initialize load transactions button using event delegation
    // This ensures it works even if the component is loaded dynamically
    document.addEventListener('click', function(e) {
        const button = e.target.closest('#loadTransactionsBtn');
        if (button) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Load transactions button clicked via event delegation');
            
            // Get month and year from selectors
            const monthSelector = document.getElementById('monthSelector');
            const yearSelector = document.getElementById('yearSelector');
            
            if (!monthSelector || !yearSelector) {
                console.error('Month or year selector not found');
                showErrorToast('لطفا ماه و سال را انتخاب کنید');
                return;
            }
            
            const month = parseInt(monthSelector.value);
            const year = parseInt(yearSelector.value);
            
            if (isNaN(month) || isNaN(year)) {
                console.error('Invalid month or year:', { month, year });
                showErrorToast('لطفا ماه و سال معتبر انتخاب کنید');
                return;
            }
            
            console.log('Loading transactions for month:', month, 'year:', year);
            console.log('Making API request to: /api/transactions?month=' + month + '&year=' + year);
            
            // Show loading indicator
            if (typeof showLoadingOverlay === 'function') {
                showLoadingOverlay();
            }
            
            // Load transactions from backend
            loadTransactions(month, year)
                .then(() => {
                    console.log('Transactions loaded successfully');
                    if (typeof hideLoadingOverlay === 'function') {
                        hideLoadingOverlay();
                    }
                })
                .catch(error => {
                    console.error('Error loading transactions:', error);
                    if (typeof hideLoadingOverlay === 'function') {
                        hideLoadingOverlay();
                    }
                    showErrorToast('خطا در بارگذاری تراکنش‌ها');
                });
        }
    });
    
    // Also try to attach directly if button exists
    const loadTransactionsBtn = document.getElementById('loadTransactionsBtn');
    if (loadTransactionsBtn) {
        console.log('Load transactions button found, attaching listener');
        loadTransactionsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Load transactions button clicked (direct listener)');
            
            // Get month and year from selectors
            const monthSelector = document.getElementById('monthSelector');
            const yearSelector = document.getElementById('yearSelector');
            
            if (!monthSelector || !yearSelector) {
                console.error('Month or year selector not found');
                showErrorToast('لطفا ماه و سال را انتخاب کنید');
                return;
            }
            
            const month = parseInt(monthSelector.value);
            const year = parseInt(yearSelector.value);
            
            if (isNaN(month) || isNaN(year)) {
                console.error('Invalid month or year:', { month, year });
                showErrorToast('لطفا ماه و سال معتبر انتخاب کنید');
                return;
            }
            
            console.log('Loading transactions for month:', month, 'year:', year);
            
            // Show loading indicator
            if (typeof showLoadingOverlay === 'function') {
                showLoadingOverlay();
            }
            
            // Load transactions from backend
            loadTransactions(month, year)
                .then(() => {
                    console.log('Transactions loaded successfully');
                    if (typeof hideLoadingOverlay === 'function') {
                        hideLoadingOverlay();
                    }
                })
                .catch(error => {
                    console.error('Error loading transactions:', error);
                    if (typeof hideLoadingOverlay === 'function') {
                        hideLoadingOverlay();
                    }
                    showErrorToast('خطا در بارگذاری تراکنش‌ها');
                });
        });
    } else {
        console.warn('Load transactions button not found during initialization');
    }
    
    // Initialize edit transaction modal
    const editTransactionModal = document.getElementById('editTransactionModal');
    if (editTransactionModal) {
        editTransactionModal.addEventListener('shown.bs.modal', function() {
            // Re-attach event listener for save button
            const saveBtn = document.getElementById('saveEditedTransactionBtn');
            if (saveBtn) {
                // Remove existing listeners and add new ones
                saveBtn.replaceWith(saveBtn.cloneNode(true));
                document.getElementById('saveEditedTransactionBtn').addEventListener('click', saveEditedTransaction);
            }
        });
    }
    
    // Initialize logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    
    // Add fallback event listener for download button (in case it's loaded later)
    setTimeout(() => {
        const downloadBtn = document.getElementById('downloadReportBtn');
        if (downloadBtn && !downloadBtn.hasAttribute('data-listener-attached')) {
            console.log('Attaching fallback event listener to download button');
            downloadBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Fallback download button clicked');
                downloadMonthlyReport();
            });
            downloadBtn.setAttribute('data-listener-attached', 'true');
        }
    }, 2000);
}

// Edit transaction functionality
function editTransaction(transactionId) {
    currentEditingTransactionId = transactionId;
    
    // Find the transaction in allTransactions
    const transaction = allTransactions.find(tx => tx.id === transactionId);
    if (!transaction) {
        showErrorToast('Transaction not found');
        return;
    }
    
    // Populate the edit form
    populateEditForm(transaction);
    
    // Show the edit modal
    const editModal = new bootstrap.Modal(document.getElementById('editTransactionModal'));
    editModal.show();
}

function populateEditForm(transaction) {
    // Populate form fields
    document.getElementById('editTransactionType').value = transaction.is_deposit ? 'income' : 'expense';
    document.getElementById('editTransactionName').value = transaction.name;
    document.getElementById('editTransactionDate').value = transaction.date;
    document.getElementById('editTransactionCurrency').value = transaction.is_usd ? 'true' : 'false';
    document.getElementById('editTransactionAmount').value = transaction.price;
    
    // Populate category dropdown
    const categorySelect = document.getElementById('editTransactionCategory');
    if (categorySelect) {
        categorySelect.innerHTML = '';
        allCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = category.name;
            if (category.name === transaction.category) {
                option.selected = true;
            }
            categorySelect.appendChild(option);
        });
    }
    
    // Populate source dropdown
    const sourceSelect = document.getElementById('editTransactionSource');
    if (sourceSelect) {
        sourceSelect.innerHTML = '';
        allSources.forEach(source => {
            const option = document.createElement('option');
            option.value = source.name;
            option.textContent = source.name;
            if (source.name === transaction.source) {
                option.selected = true;
            }
            sourceSelect.appendChild(option);
        });
    }
}

async function saveEditedTransaction() {
    if (!currentEditingTransactionId) {
        showWarningToast('No transaction selected for editing');
        return;
    }
    
    // Get form values
    const formData = {
        name: document.getElementById('editTransactionName').value,
        date: document.getElementById('editTransactionDate').value,
        price: parseFloat(document.getElementById('editTransactionAmount').value),
        is_usd: document.getElementById('editTransactionCurrency').value === 'true',
        category_name: document.getElementById('editTransactionCategory').value,
        source_name: document.getElementById('editTransactionSource').value,
        is_deposit: document.getElementById('editTransactionType').value === 'income'
    };
    
    try {
        const response = await fetchWithAuth(`/api/transactions/${currentEditingTransactionId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            // Close modal
            const editModal = bootstrap.Modal.getInstance(document.getElementById('editTransactionModal'));
            editModal.hide();
            
            // Reload transactions
            const month = window.currentMonth || new Date().getMonth() + 1;
            loadTransactions(month);
            
            // Reset editing state
            currentEditingTransactionId = null;
        } else {
            const errorData = await response.json();
            showErrorToast('Error updating transaction: ' + (errorData.detail || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error updating transaction:', error);
        showErrorToast('Error updating transaction');
    }
}


// Logout functionality
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear stored token
        localStorage.removeItem('token');
        // Redirect to login page
        window.location.href = '/login.html';
    }
}

// Attach download button event listener
function attachDownloadButtonListener() {
    const downloadBtn = document.getElementById('downloadReportBtn');
    console.log('Looking for download button:', downloadBtn);
    
    if (downloadBtn && !downloadBtn.hasAttribute('data-listener-attached')) {
        console.log('Attaching download button event listener');
        downloadBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Download button clicked via attachDownloadButtonListener');
            downloadMonthlyReport();
        });
        downloadBtn.setAttribute('data-listener-attached', 'true');
    } else if (downloadBtn) {
        console.log('Download button already has listener attached');
    } else {
        console.log('Download button not found');
    }
}

// Download monthly report functionality
async function downloadMonthlyReport() {
    console.log('downloadMonthlyReport function called');
    
    if (!checkAuth()) {
        console.log('Authentication failed');
        return;
    }
    
    try {
        // Get selected month and year from dropdowns
        const monthSelect = document.getElementById('reportMonth');
        const yearSelect = document.getElementById('reportYear');
        
        console.log('Month select element:', monthSelect);
        console.log('Year select element:', yearSelect);
        
        if (!monthSelect || !yearSelect) {
            console.error('Month or year select elements not found');
            showErrorToast('Report selectors not found. Please refresh the page.');
            return;
        }
        
        const jalaliMonth = parseInt(monthSelect.value);
        const jalaliYear = parseInt(yearSelect.value);
        
        console.log('Selected Jalali month:', jalaliMonth, 'year:', jalaliYear);
        
        // Send Jalali dates directly to backend
        // Backend will handle the conversion to Gregorian date range for the report
        // This is necessary because Jalali months can span across two Gregorian months
        
        // Show loading state
        const downloadBtn = document.getElementById('downloadReportBtn');
        const originalContent = downloadBtn.innerHTML;
        downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        downloadBtn.disabled = true;
        
        // Make API call to download PDF (using Jalali dates - backend will convert)
        const apiUrl = `/api/monthly-report?month=${jalaliMonth}&year=${jalaliYear}`;
        console.log('Making API call to:', apiUrl);
        
        const response = await fetchWithAuth(apiUrl);
        console.log('API response status:', response.status);
        
        if (response.ok) {
            // Get the PDF blob
            const blob = await response.blob();
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `monthly_report_${jalaliYear}_${jalaliMonth.toString().padStart(2, '0')}.pdf`;
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            // Show success message
            showSuccessToast('Monthly report downloaded successfully!');
        } else {
            const errorData = await response.json();
            showErrorToast('Error downloading report: ' + (errorData.detail || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error downloading report:', error);
        showErrorToast('Error downloading report. Please try again.');
    } finally {
        // Reset button state
        const downloadBtn = document.getElementById('downloadReportBtn');
        if (downloadBtn) {
            downloadBtn.innerHTML = '<i class="fas fa-file-pdf"></i>';
            downloadBtn.disabled = false;
        }
    }
}

// Loan Management Functions
async function loadLoans() {
    console.log('loadLoans() called');
    if (!checkAuth()) {
        console.log('checkAuth() returned false, redirecting to login');
        return;
    }
    
    console.log('Making API call to /api/loans');
    try {
        const response = await fetchWithAuth('/api/loans');
        console.log('Loans API response:', response);
        if (response.ok) {
            const loans = await response.json();
            console.log('Loans data received:', loans);
            allLoans = loans;
            updateLoansTable(loans);
        } else {
            console.error('Loans API response not ok:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Error loading loans:', error);
    }
}

async function loadLoanSummary() {
    if (!checkAuth()) return;
    
    try {
        const response = await fetchWithAuth('/api/loans/summary');
        if (response.ok) {
            const summary = await response.json();
            updateLoanSummaryCards(summary);
        }
    } catch (error) {
        console.error('Error loading loan summary:', error);
    }
}

function updateLoansTable(loans) {
    // Update mobile loans list
    const loansList = document.querySelector('#loans-list');
    if (loansList) {
        loansList.innerHTML = '';
        if (loans.length === 0) {
            loansList.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-hand-holding-usd fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No loans found</h5>
                    <p class="text-muted">You don't have any active loans yet.</p>
                </div>
            `;
        } else {
            loans.forEach(loan => {
                const loanCard = createLoanCard(loan);
                loansList.appendChild(loanCard);
            });
        }
    }
    
    // Update desktop table
    const tbody = document.querySelector('#loans-table tbody');
    if (tbody) {
        tbody.innerHTML = '';
        if (loans.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <i class="fas fa-hand-holding-usd fa-2x text-muted mb-2"></i>
                        <h6 class="text-muted">No loans found</h6>
                        <p class="text-muted mb-0">You don't have any active loans yet.</p>
                    </td>
                </tr>
            `;
        } else {
            loans.forEach(loan => {
                const row = document.createElement('tr');
                
                // Calculate progress percentage
                const progress = ((loan.total_amount - loan.remaining_amount) / loan.total_amount) * 100;
                
                // Format amounts based on currency and display mode
                const totalAmount = formatLoanAmount(loan.total_amount, loan.is_usd);
                const monthlyPayment = formatLoanAmount(loan.monthly_payment, loan.is_usd);
                const remainingAmount = formatLoanAmount(loan.remaining_amount, loan.is_usd);
                
                row.innerHTML = `
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="loan-icon bg-warning">
                                <i class="fas fa-hand-holding-usd"></i>
                            </div>
                            <div class="ms-3">
                                <h6 class="mb-0">${loan.name}</h6>
                                <small class="text-muted">ماهانه: ${monthlyPayment}</small>
                            </div>
                        </div>
                    </td>
                    <td class="loan-amount" data-usd="${loan.is_usd ? loan.total_amount : loan.total_amount / currentExchangeRate}" 
                        data-toman="${loan.is_usd ? loan.total_amount * currentExchangeRate : loan.total_amount}"
                        data-default="${loan.is_usd ? `$${loan.total_amount.toFixed(2)}` : `${loan.total_amount.toLocaleString()} T`}">
                        ${totalAmount}
                    </td>
                    <td class="loan-amount" data-usd="${loan.is_usd ? loan.monthly_payment : loan.monthly_payment / currentExchangeRate}" 
                        data-toman="${loan.is_usd ? loan.monthly_payment * currentExchangeRate : loan.monthly_payment}"
                        data-default="${loan.is_usd ? `$${loan.monthly_payment.toFixed(2)}` : `${loan.monthly_payment.toLocaleString()} T`}">
                        ${monthlyPayment}
                    </td>
                    <td class="loan-amount" data-usd="${loan.is_usd ? loan.remaining_amount : loan.remaining_amount / currentExchangeRate}" 
                        data-toman="${loan.is_usd ? loan.remaining_amount * currentExchangeRate : loan.remaining_amount}"
                        data-default="${loan.is_usd ? `$${loan.remaining_amount.toFixed(2)}` : `${loan.remaining_amount.toLocaleString()} T`}">
                        ${remainingAmount}
                    </td>
                    <td>
                        <div class="progress" style="height: 8px;">
                            <div class="progress-bar bg-success" role="progressbar" 
                                 style="width: ${progress.toFixed(1)}%" 
                                 aria-valuenow="${progress.toFixed(1)}" 
                                 aria-valuemin="0" aria-valuemax="100">
                            </div>
                        </div>
                        <small class="text-muted">${progress.toFixed(1)}% paid</small>
                    </td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-info" onclick="viewLoanDetails(${loan.id})" title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-outline-primary" onclick="addLoanPayment(${loan.id})" title="Add Payment">
                                <i class="fas fa-plus"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="deleteLoan(${loan.id})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                `;
                
                tbody.appendChild(row);
            });
        }
    }
}

function createLoanCard(loan) {
    const card = document.createElement('div');
    card.className = 'table-row';
    
    // Calculate progress percentage
    const progress = ((loan.total_amount - loan.remaining_amount) / loan.total_amount) * 100;
    
    // Format amounts
    const totalAmount = formatLoanAmount(loan.total_amount, loan.is_usd);
    const monthlyPayment = formatLoanAmount(loan.monthly_payment, loan.is_usd);
    const remainingAmount = formatLoanAmount(loan.remaining_amount, loan.is_usd);
    
    card.innerHTML = `
        <div class="table-row-icon bg-warning">
            <i class="fas fa-hand-holding-usd"></i>
        </div>
        <div class="table-row-content">
            <h6 class="table-row-title">${loan.name}</h6>
            <p class="table-row-subtitle">
                ماهانه: ${monthlyPayment} • ${progress.toFixed(1)}% پرداخت شده
            </p>
            <div class="progress mb-2" style="height: 4px;">
                <div class="progress-bar bg-success" role="progressbar" 
                     style="width: ${progress.toFixed(1)}%">
                </div>
            </div>
        </div>
        <div class="table-row-value">
            <div class="text-end">
                <div class="fw-bold">${remainingAmount}</div>
                <small class="text-muted">of ${totalAmount}</small>
            </div>
        </div>
        <div class="table-row-actions">
            <button class="btn btn-sm btn-outline-info" onclick="viewLoanDetails(${loan.id})" title="View Details">
                <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-sm btn-outline-primary" onclick="addLoanPayment(${loan.id})" title="Add Payment">
                <i class="fas fa-plus"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteLoan(${loan.id})" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    return card;
}

function formatAmount(amount, isUsd) {
    if (displayInUSD) {
        const usdAmount = isUsd ? amount : amount / currentExchangeRate;
        return `$${usdAmount.toFixed(2)}`;
    } else {
        const tomanAmount = isUsd ? amount * currentExchangeRate : amount;
        return `${tomanAmount.toLocaleString()} T`;
    }
}

function formatLoanAmount(amount, isUsd) {
    if (loanDisplayMode === 'usd') {
        const usdAmount = isUsd ? amount : amount / currentExchangeRate;
        return `$${usdAmount.toFixed(2)}`;
    } else if (loanDisplayMode === 'toman') {
        const tomanAmount = isUsd ? amount * currentExchangeRate : amount;
        return `${tomanAmount.toLocaleString()} T`;
    } else {
        return isUsd ? `$${amount.toFixed(2)}` : `${amount.toLocaleString()} T`;
    }
}

function toggleLoanDisplayMode(mode) {
    loanDisplayMode = mode;
    
    // Update all loan amount cells
    const loanCells = document.querySelectorAll('.loan-amount');
    loanCells.forEach(cell => {
        let value;
        switch (mode) {
            case 'usd':
                value = `$${cell.getAttribute('data-usd')}`;
                break;
            case 'toman':
                value = `${cell.getAttribute('data-toman')} T`;
                break;
            default:
                value = cell.getAttribute('data-default');
        }
        cell.textContent = value;
    });
    
    // Update toggle button states
    const buttons = document.querySelectorAll('.loan-currency-toggle');
    buttons.forEach(button => {
        button.classList.toggle('active', button.getAttribute('data-mode') === mode);
    });
    
    // Reload loans to update the display
    loadLoans();
}

function updateLoanSummaryCards(summary) {
    const totalLoansEl = document.querySelector('#totalLoans');
    const totalRemainingEl = document.querySelector('#totalRemaining');
    const totalMonthlyPaymentsEl = document.querySelector('#totalMonthlyPayments');
    const totalBorrowedEl = document.querySelector('#totalBorrowed');
    
    if (totalLoansEl) {
        totalLoansEl.textContent = summary.total_loans;
    }
    if (totalRemainingEl) {
        totalRemainingEl.textContent = `$${summary.total_remaining.toFixed(2)}`;
    }
    if (totalMonthlyPaymentsEl) {
        totalMonthlyPaymentsEl.textContent = `$${summary.avg_monthly_payment.toFixed(2)}`;
    }
    if (totalBorrowedEl) {
        totalBorrowedEl.textContent = `$${summary.total_borrowed.toFixed(2)}`;
    }
}

// Loan CRUD operations
function saveLoan() {
    console.log('saveLoan function called');
    
    const name = document.getElementById('loanName').value;
    const totalAmount = parseFloat(document.getElementById('loanTotalAmount').value);
    const monthlyPayment = parseFloat(document.getElementById('loanMonthlyPayment').value);
    const isUsd = document.getElementById('loanCurrency').value === 'true';
    
    console.log('Form values:', { name, totalAmount, monthlyPayment, isUsd });
    
    if (!name || !totalAmount || !monthlyPayment) {
        showWarningToast('Please fill all required fields.');
        return;
    }
    
    const saveBtn = document.getElementById('saveLoanBtn');
    if (saveBtn) {
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;
    }
    
    fetchWithAuth('/api/loans', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name,
            total_amount: totalAmount,
            monthly_payment: monthlyPayment,
            is_usd: isUsd
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error(`Failed to save loan: ${text}`);
            });
        }
        return response.json();
    })
    .then(data => {
        // Close modal and refresh data
        const modal = bootstrap.Modal.getInstance(document.getElementById('addLoanModal'));
        modal.hide();
        
        // Reset form
        document.getElementById('addLoanForm').reset();
        
        // Refresh data
        loadLoans();
        loadLoanSummary();
        
        showSuccessToast('Loan created successfully!');
    })
    .catch(error => {
        console.error('Error saving loan:', error);
        showErrorToast(error.message || 'Failed to save loan. Please try again.');
    })
    .finally(() => {
        const saveBtn = document.getElementById('saveLoanBtn');
        if (saveBtn) {
            saveBtn.textContent = 'Save Loan';
            saveBtn.disabled = false;
        }
    });
}

function addLoanPayment(loanId = null) {
    // If loanId is provided, pre-select it
    if (loanId) {
        // Store the loan ID for when the modal opens
        document.getElementById('addLoanPaymentModal').dataset.loanId = loanId;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('addLoanPaymentModal'));
    modal.show();
}

function saveLoanPayment() {
    const loanId = document.getElementById('paymentLoanSelect').value;
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    const gregorianPaymentDate = document.getElementById('paymentDate').value;
    const paymentDate = convertToPersianDate(gregorianPaymentDate); // Convert Gregorian input to Persian for backend
    const sourceId = document.getElementById('paymentSource').value;
    const isUsd = document.getElementById('paymentCurrencySelect').value === 'true';
    
    if (!loanId || !amount || !paymentDate || !sourceId) {
        showWarningToast('Please fill all required fields.');
        return;
    }
    
    const saveBtn = document.getElementById('saveLoanPaymentBtn');
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;
    
    // Get loan details for expense transaction
    const selectedLoan = allLoans.find(loan => loan.id == loanId);
    const loanName = selectedLoan ? selectedLoan.name : 'Unknown Loan';
    
    fetchWithAuth(`/api/loans/${loanId}/payments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            loan_id: parseInt(loanId),
            amount: amount,
            payment_date: paymentDate,
            source_id: parseInt(sourceId),
            is_usd: isUsd,
            create_expense_transaction: true,  // Always create expense
            loan_name: loanName
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error(`Failed to save payment: ${text}`);
            });
        }
        return response.json();
    })
    .then(data => {
        // Payment is automatically marked as paid on the backend
        return Promise.resolve();
    })
    .then(() => {
        // Close modal and refresh data
        const modal = bootstrap.Modal.getInstance(document.getElementById('addLoanPaymentModal'));
        modal.hide();
        
        // Reset form
        document.getElementById('addLoanPaymentForm').reset();
        
        // Refresh data
        loadLoans();
        loadLoanSummary();
        
        showSuccessToast('Loan payment created successfully! Expense transaction also created.');
    })
    .catch(error => {
        console.error('Error saving loan payment:', error);
        showErrorToast(error.message || 'Failed to save loan payment. Please try again.');
    })
    .finally(() => {
        saveBtn.textContent = 'Save Payment';
        saveBtn.disabled = false;
    });
}

function viewLoanDetails(loanId) {
    // Find the loan
    const loan = allLoans.find(l => l.id === loanId);
    if (!loan) {
        showErrorToast('وام یافت نشد');
        return;
    }
    
    // Populate loan details
    const detailsContent = document.getElementById('loanDetailsContent');
    if (detailsContent) {
        const progress = ((loan.total_amount - loan.remaining_amount) / loan.total_amount) * 100;
        
        detailsContent.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6>اطلاعات وام</h6>
                    <p><strong>نام:</strong> ${loan.name}</p>
                    <p><strong>مبلغ کل:</strong> ${formatLoanAmount(loan.total_amount, loan.is_usd)}</p>
                    <p><strong>پرداخت ماهانه:</strong> ${formatLoanAmount(loan.monthly_payment, loan.is_usd)}</p>
                </div>
                <div class="col-md-6">
                    <h6>وضعیت پرداخت</h6>
                    <p><strong>مبلغ باقی‌مانده:</strong> ${formatLoanAmount(loan.remaining_amount, loan.is_usd)}</p>
                    <p><strong>مبلغ پرداخت شده:</strong> ${formatLoanAmount(loan.total_amount - loan.remaining_amount, loan.is_usd)}</p>
                    <p><strong>پیشرفت:</strong> ${progress.toFixed(1)}%</p>
                    <div class="progress mb-3">
                        <div class="progress-bar bg-success" role="progressbar" 
                             style="width: ${progress.toFixed(1)}%">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('loanDetailsModal'));
    modal.show();
}

function deleteLoan(loanId) {
    const loan = allLoans.find(l => l.id === loanId);
    if (!loan) {
        showErrorToast('وام یافت نشد');
        return;
    }
    
    const confirmDelete = confirm(`Are you sure you want to delete "${loan.name}"? This will also delete all associated payments.`);
    if (!confirmDelete) {
        return;
    }
    
    fetchWithAuth(`/api/loans/${loanId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error(`Failed to delete loan: ${text}`);
            });
        }
        return response.json();
    })
    .then(data => {
        // Remove from allLoans array
        allLoans = allLoans.filter(l => l.id !== loanId);
        
        // Refresh the display
        updateLoansTable(allLoans);
        loadLoanSummary();
        
        showSuccessToast('Loan deleted successfully');
    })
    .catch(error => {
        console.error('Error deleting loan:', error);
        showErrorToast(error.message || 'Failed to delete loan. Please try again.');
    });
}

// Make functions globally accessible for HTML tab switching
window.loadSources = loadSources;
window.loadTransactions = loadTransactions;
window.loadLoans = loadLoans;
window.loadLoanSummary = loadLoanSummary;
window.currentMonth = currentMonth;
window.editTransaction = editTransaction;
window.deleteTransaction = deleteTransaction;
window.logout = logout;
window.downloadMonthlyReport = downloadMonthlyReport;
window.attachDownloadButtonListener = attachDownloadButtonListener;
window.saveLoan = saveLoan;
window.addLoanPayment = addLoanPayment;
window.saveLoanPayment = saveLoanPayment;
window.viewLoanDetails = viewLoanDetails;
window.deleteLoan = deleteLoan;
window.toggleLoanDisplayMode = toggleLoanDisplayMode; 