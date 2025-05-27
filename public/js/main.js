document.addEventListener('DOMContentLoaded', function() {
    // Sidebar toggle functionality
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
        });
    }
    
    // Initialize transaction type dropdown styling
    const transactionTypeSelect = document.getElementById('transactionType');
    if (transactionTypeSelect) {
        // Style the dropdown options when they change
        transactionTypeSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            const isIncome = selectedOption.value === 'income';
            
            // Update the select element's styling
            this.className = `form-select ${isIncome ? 'text-success' : 'text-danger'}`;
            
            // If using a category select, update it based on transaction type
            const categorySelect = document.getElementById('transactionCategory');
            if (categorySelect && isIncome) {
                // Find and select 'income' category for income transactions
                for (let i = 0; i < categorySelect.options.length; i++) {
                    if (categorySelect.options[i].value.toLowerCase() === 'income') {
                        categorySelect.selectedIndex = i;
                        break;
                    }
                }
            }
        });
        
        // Trigger initial styling
        transactionTypeSelect.dispatchEvent(new Event('change'));
    }
    
    // Add event listener for transaction modal
    const addTransactionModal = document.getElementById('addTransactionModal');
    if (addTransactionModal) {
        addTransactionModal.addEventListener('show.bs.modal', function () {
            // Load categories and sources when modal is opened
            loadCategories();
            loadSources();
            const saveTransactionBtn = document.getElementById('saveTransactionBtn');
            if (saveTransactionBtn) {
                // Remove previous listeners to avoid duplicates
                const newBtn = saveTransactionBtn.cloneNode(true);
                saveTransactionBtn.parentNode.replaceChild(newBtn, saveTransactionBtn);
                newBtn.addEventListener('click', saveTransaction);
            }
        });
    }
    
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
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }

    fetchAndDisplayTotalBalance(); // Fetch total balance on page load
});

// Add global state for categories and sources
let allCategories = [];
let allSources = [];

// Load categories from API
async function loadCategories() {
    if (!checkAuth()) return;
    
    try {
        const response = await fetchWithAuth('/api/categories');
        if (response.ok) {
            const categories = await response.json();
            console.log('Categories loaded:', categories);
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
    if (!checkAuth()) return;
    
    try {
        const response = await fetchWithAuth('/api/sources');
        if (response.ok) {
            const sources = await response.json();
            console.log('Sources loaded:', sources);
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
    const description = document.getElementById('transactionDescription').value;
    if (!description) {
        alert('Please enter a transaction description.');
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
        if (!response.ok) {
            throw new Error('Failed to parse transaction');
        }
        return response.json();
    })
    .then(data => {
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
        document.getElementById('parsedTransactionDetails').style.display = 'block';
    })
    .catch(error => {
        console.error('Error parsing transaction:', error);
        alert('Failed to parse transaction. Please try again or fill the form manually.');
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
    // Get form values
    const name = document.getElementById('transactionName').value;
    const date = document.getElementById('transactionDate').value;
    const price = parseFloat(document.getElementById('transactionAmount').value);
    const is_usd = document.getElementById('transactionCurrency').value === 'true';
    const category_name = document.getElementById('transactionCategory').value;
    const source_name = document.getElementById('transactionSource').value;
    const transactionType = document.getElementById('transactionType').value;
    const is_deposit = transactionType === 'income';
    
    // Validate form
    if (!name || !date || isNaN(price) || !category_name || !source_name) {
        alert('Please fill all fields correctly.');
        return;
    }

    // Find IDs for category and source
    const cat = allCategories.find(c => c.name === category_name);
    const src = allSources.find(s => s.name === source_name);
    if (!cat || !src) {
        alert('Invalid category or source.');
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
    fetchWithAuth(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.detail || 'Failed to save transaction');
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
        document.getElementById('parsedTransactionDetails').style.display = 'none';
        
        // Refresh data
        loadTransactions();
        loadSources();
    })
    .catch(error => {
        console.error('Error saving transaction:', error);
        alert(error.message || 'Failed to save transaction. Please try again.');
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
        alert('Please fill all fields correctly.');
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
            return response.json().then(err => {
                throw new Error(err.detail || 'Failed to save source');
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
        alert('Source added successfully!');
    })
    .catch(error => {
        console.error('Error saving source:', error);
        alert(error.message || 'Failed to save source. Please try again.');
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

// Update sources table
function updateSourcesTable(sources) {
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

// Function to toggle source display mode
function toggleSourceDisplayMode(mode) {
    sourceDisplayMode = mode;
    
    // Update all source value cells
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
}

// Update transactions table with pagination
function updateTransactionsTable(page = 1) {
    currentPage = page;
    const tbody = document.querySelector('#transactions-table tbody');
    const paginationContainer = document.querySelector('#transactionsPagination');
    if (!tbody || !allTransactions) return;
    
    // Calculate pagination
    const totalItems = allTransactions.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    
    // Get current page transactions
    const currentTransactions = allTransactions.slice(startIndex, endIndex);
    
    tbody.innerHTML = '';
    
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
        const usdAmount = `${tx.is_deposit ? '+' : '-'}$${amount.toFixed(2)}`;
        const tomanAmountStr = `${tx.is_deposit ? '+' : '-'}${tomanAmount.toLocaleString()} T`;
        
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
        `;
        
        tbody.appendChild(row);
    });
    
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

// Function to toggle transaction currency display
function toggleTransactionCurrency() {
    // Toggle the state
    displayInUSD = !displayInUSD;
    
    // Update toggle button text
    const toggleBtn = document.getElementById('toggleCurrencyBtn');
    if (toggleBtn) {
        toggleBtn.innerHTML = `<i class="fas fa-exchange-alt"></i> Show in ${displayInUSD ? 'Toman' : 'USD'}`;
    }
    
    // Update all amount cells
    const amountCells = document.querySelectorAll('.amount-cell');
    amountCells.forEach(cell => {
        const usdAmount = cell.getAttribute('data-usd');
        const tomanAmount = cell.getAttribute('data-toman');
        cell.textContent = displayInUSD ? usdAmount : tomanAmount;
    });
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

// ... rest of your existing code ... 