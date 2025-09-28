document.addEventListener('DOMContentLoaded', function() {
    
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
        console.log('Click detected on:', e.target);
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
let currentMonth = new Date().getMonth() + 1; // 1-12
let currentPage = 1;
const itemsPerPage = 5;
let allTransactions = []; // Store all transactions
let currentExchangeRate = null;
let sourceDisplayMode = 'default'; // 'default', 'usd', or 'toman'

// Load transactions from API
async function loadTransactions(month = currentMonth) {
    if (!checkAuth()) return;
    
    try {
        const response = await fetchWithAuth(`/api/transactions?month=${month}`);
        if (response.ok) {
            const transactions = await response.json();
            // Store all transactions
            allTransactions = transactions;
            
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
            updateTransactionsTable(1); // Reset to first page when loading new data
            
            // Attach download button event listener after transactions are loaded
            attachDownloadButtonListener();
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
        document.getElementById('transactionDate').value = data.date;
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
        showErrorToast('Failed to parse transaction. Please try again or fill the form manually.');
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
    const date = document.getElementById('transactionDate').value;
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
        showErrorToast('Invalid category or source. Please make sure categories and sources are loaded.');
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
        showErrorToast(error.message || 'Failed to save transaction. Please try again.');
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
        showSuccessToast('Source added successfully!');
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
                <td>${source.bank ? 'Bank' : 'Cash'}</td>
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
            <p class="table-row-subtitle">${source.bank ? 'Bank Account' : 'Cash'}</p>
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
    currentPage = page;
    const tbody = document.querySelector('#transactions-table tbody');
    const transactionsList = document.querySelector('#transactions-list');
    const paginationContainer = document.querySelector('#transactionsPagination');
    
    if (!allTransactions) return;
    
    // Calculate pagination
    const totalItems = allTransactions.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    
    // Get current page transactions
    const currentTransactions = allTransactions.slice(startIndex, endIndex);
    
    // Update mobile transactions list
    if (transactionsList) {
        transactionsList.innerHTML = '';
        if (currentTransactions.length === 0) {
            transactionsList.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-receipt fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No transactions found</h5>
                    <p class="text-muted">No transactions for the selected month.</p>
                </div>
            `;
        } else {
            currentTransactions.forEach(tx => {
                const transactionCard = createTransactionCard(tx);
                transactionsList.appendChild(transactionCard);
            });
        }
    }
    
    // Update desktop table
    if (tbody) {
        tbody.innerHTML = '';
        if (currentTransactions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4">
                        <i class="fas fa-receipt fa-2x text-muted mb-2"></i>
                        <h6 class="text-muted">No transactions found</h6>
                        <p class="text-muted mb-0">No transactions for the selected month.</p>
                    </td>
                </tr>
            `;
        } else {
            currentTransactions.forEach(tx => {
            console.log('Transaction:', tx);
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
                <td>${new Date(tx.date).toLocaleDateString()}</td>
                <td>
                    <span class="badge ${tx.is_deposit ? 'bg-success' : 'bg-danger'}">
                        ${tx.is_deposit ? 'Deposit' : 'Expense'}
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
        }
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
                ${categoryName} • ${new Date(tx.date).toLocaleDateString()}
            </p>
            <span class="badge ${tx.is_deposit ? 'bg-success' : 'bg-danger'}">
                ${tx.is_deposit ? 'Income' : 'Expense'}
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
    document.getElementById('deleteTransactionDate').textContent = new Date(transaction.date).toLocaleDateString();
    
    // Format amount based on currency
    const amount = Math.abs(transaction.price);
    const currency = transaction.is_usd ? '$' : 'T';
    const formattedAmount = transaction.is_usd ? 
        `$${amount.toFixed(2)}` : 
        `${amount.toLocaleString()} T`;
    
    document.getElementById('deleteTransactionAmount').textContent = formattedAmount;
    document.getElementById('deleteTransactionType').textContent = transaction.is_deposit ? 'Income' : 'Expense';
    
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
        
        showSuccessToast('Transaction deleted successfully');
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
        
        showSuccessToast('Transaction updated successfully');
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
    
    // Reload transactions to update the display
    loadTransactions(currentMonth);
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
        loadTransactions(currentMonth);
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
    
    // Load transactions for current month
    loadTransactions(currentMonth);
    
    // Load loans and loan summary
    loadLoans();
    loadLoanSummary();
    
    // Load exchange rate
    fetchExchangeRate();
    
    // Initialize month selector
    initializeMonthSelector();
    
    console.log('Initial data loaded');
}

// Initialize month selector
function initializeMonthSelector() {
    const monthSelector = document.getElementById('monthSelector');
    if (monthSelector) {
        // Set current month
        monthSelector.value = currentMonth;
        
        // Add event listener
        monthSelector.addEventListener('change', function() {
            const selectedMonth = parseInt(this.value);
            console.log('Month changed to:', selectedMonth);
            currentMonth = selectedMonth;
            loadTransactions(currentMonth);
        });
    }
    
    // Initialize currency toggle button
    const toggleCurrencyBtn = document.getElementById('toggleCurrencyBtn');
    if (toggleCurrencyBtn) {
        toggleCurrencyBtn.addEventListener('click', function() {
            toggleTransactionCurrency();
        });
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
    
    // Initialize download report button using event delegation
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'downloadReportBtn') {
            e.preventDefault();
            console.log('Download report button clicked');
            downloadMonthlyReport();
        }
    });
    
    // Initialize report month/year selectors
    const reportMonth = document.getElementById('reportMonth');
    const reportYear = document.getElementById('reportYear');
    if (reportMonth && reportYear) {
        // Set current month and year as default
        const currentDate = new Date();
        reportMonth.value = currentDate.getMonth() + 1;
        reportYear.value = currentDate.getFullYear();
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
        
        const month = parseInt(monthSelect.value);
        const year = parseInt(yearSelect.value);
        
        console.log('Selected month:', month, 'year:', year);
        
        // Show loading state
        const downloadBtn = document.getElementById('downloadReportBtn');
        const originalContent = downloadBtn.innerHTML;
        downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        downloadBtn.disabled = true;
        
        // Make API call to download PDF
        const apiUrl = `/api/monthly-report?month=${month}&year=${year}`;
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
            a.download = `monthly_report_${year}_${month.toString().padStart(2, '0')}.pdf`;
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
                                <small class="text-muted">Monthly: ${monthlyPayment}</small>
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
                Monthly: ${monthlyPayment} • ${progress.toFixed(1)}% paid
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
    const paymentDate = document.getElementById('paymentDate').value;
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
        showErrorToast('Loan not found');
        return;
    }
    
    // Populate loan details
    const detailsContent = document.getElementById('loanDetailsContent');
    if (detailsContent) {
        const progress = ((loan.total_amount - loan.remaining_amount) / loan.total_amount) * 100;
        
        detailsContent.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Loan Information</h6>
                    <p><strong>Name:</strong> ${loan.name}</p>
                    <p><strong>Total Amount:</strong> ${formatLoanAmount(loan.total_amount, loan.is_usd)}</p>
                    <p><strong>Monthly Payment:</strong> ${formatLoanAmount(loan.monthly_payment, loan.is_usd)}</p>
                </div>
                <div class="col-md-6">
                    <h6>Payment Status</h6>
                    <p><strong>Remaining Amount:</strong> ${formatLoanAmount(loan.remaining_amount, loan.is_usd)}</p>
                    <p><strong>Amount Paid:</strong> ${formatLoanAmount(loan.total_amount - loan.remaining_amount, loan.is_usd)}</p>
                    <p><strong>Progress:</strong> ${progress.toFixed(1)}%</p>
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
        showErrorToast('Loan not found');
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