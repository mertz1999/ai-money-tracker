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
});

// Load categories from API
function loadCategories() {
    fetch('/api/categories')
        .then(response => response.json())
        .then(categories => {
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
            updateCategoryStats(categories);
        })
        .catch(error => {
            console.error('Error loading categories:', error);
        });
}

// Load sources from API
function loadSources() {
    fetch('/api/sources')
        .then(response => response.json())
        .then(sources => {
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
            updateTotalBalance(sources);
        })
        .catch(error => {
            console.error('Error loading sources:', error);
        });
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
function loadTransactions(month = currentMonth) {
    fetch(`/api/transactions?month=${month}`)
        .then(response => response.json())
        .then(transactions => {
            // Store all transactions
            allTransactions = transactions;
            
            // Calculate totals for transaction stats
            const totals = transactions.reduce((acc, tx) => {
                if (tx.is_income) {
                    acc.income += Math.abs(tx.price_in_dollar);
                } else {
                    acc.expense += Math.abs(tx.price_in_dollar);
                }
                return acc;
            }, { income: 0, expense: 0 });
            
            // Update summary and table
            updateTransactionSummary(totals.income, totals.expense);
            updateTransactionsTable(1); // Reset to first page when loading new data
        })
        .catch(error => {
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
        });
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
    
    fetch('/api/parse_transaction', {
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
        
        // Find and select category
        for (let i = 0; i < categorySelect.options.length; i++) {
            if (categorySelect.options[i].value.toLowerCase() === data.category_name.toLowerCase()) {
                categorySelect.selectedIndex = i;
                break;
            }
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
    
    // Validate form
    if (!name || !date || isNaN(price) || !category_name || !source_name) {
        alert('Please fill all fields correctly.');
        return;
    }
    
    // Show loading state
    const saveBtn = document.getElementById('saveTransactionBtn');
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;
    
    // Send to API
    fetch('/api/add_transaction', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name,
            date,
            price,
            is_usd,
            category_name,
            source_name
        })
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
        
        // Show success message
        alert('Transaction added successfully!');
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
    fetch('/api/add_source', {
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

// Update sources table
function updateSourcesTable(sources) {
    const tbody = document.querySelector('#sources-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    let totalUSD = 0;
    let totalToman = 0;
    
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
            
        // Update totals
        totalUSD += valueInUSD;
        totalToman += valueInToman;
        
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
    
    // Update summary cards with totals
    updateBalanceSummary(totalUSD, totalToman);
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
        const row = document.createElement('tr');
        
        // Determine icon based on category
        let iconClass = 'fa-shopping-cart';
        switch(tx.category.toLowerCase()) {
            case 'food':
            case 'groceries':
            case 'غذا':
            case 'خوراک':
                iconClass = 'fa-utensils';
                break;
            case 'transportation':
            case 'حمل و نقل':
                iconClass = 'fa-car';
                break;
            case 'entertainment':
            case 'تفریح':
                iconClass = 'fa-film';
                break;
            case 'utilities':
            case 'قبوض':
                iconClass = 'fa-bolt';
                break;
            case 'healthcare':
            case 'پزشکی':
            case 'سلامت':
                iconClass = 'fa-medkit';
                break;
            case 'personal-shopping':
                iconClass = 'fa-shopping-bag';
                break;
        }
        
        let bgClass = tx.is_income ? 'bg-success' : 'bg-danger';
        
        // Calculate amounts for both currencies
        const amount = Math.abs(tx.price_in_dollar);
        const tomanAmount = amount * tx.your_currency_rate;
        
        // Format amounts for both currencies
        const usdAmount = `${tx.is_income ? '+' : '-'}$${amount.toFixed(2)}`;
        const tomanAmountStr = `${tx.is_income ? '+' : '-'}${tomanAmount.toLocaleString()} T`;
        
        // Always start with USD display
        const formattedAmount = usdAmount;
        
        // Check if text contains Persian characters
        const hasPersian = /[\u0600-\u06FF]/.test(tx.name);
        const nameClass = hasPersian ? 'font-vazir text-end' : '';
        
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <div class="transaction-icon ${bgClass}">
                        <i class="fas ${iconClass}"></i>
                    </div>
                    <div class="ms-3">
                        <h6 class="mb-0 ${nameClass}">${tx.name}</h6>
                        <small class="text-muted">${tx.source}</small>
                    </div>
                </div>
            </td>
            <td>${tx.category}</td>
            <td>${new Date(tx.date).toLocaleDateString()}</td>
            <td class="amount-cell ${tx.is_income ? 'text-success' : 'text-danger'}" 
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
    
    fetch(`/api/exchange_rate?live=${live}`)
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