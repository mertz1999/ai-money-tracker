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
    
    // Load initial data
    loadCategories();
    loadSources();
    loadTransactions();
    
    // Parse Transaction Button
    const parseTransactionBtn = document.getElementById('parseTransactionBtn');
    if (parseTransactionBtn) {
        parseTransactionBtn.addEventListener('click', parseTransactionDescription);
    }
    
    // Save Transaction Button
    const saveTransactionBtn = document.getElementById('saveTransactionBtn');
    if (saveTransactionBtn) {
        saveTransactionBtn.addEventListener('click', saveTransaction);
    }
    
    // Save Source Button
    const saveSourceBtn = document.getElementById('saveSourceBtn');
    if (saveSourceBtn) {
        saveSourceBtn.addEventListener('click', saveSource);
    }
});

// Load categories from API
function loadCategories() {
    fetch('http://localhost:9000/api/categories')
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
    fetch('http://localhost:9000/api/sources')
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

// Load transactions from API
function loadTransactions() {
    fetch('http://localhost:9000/api/transactions')
        .then(response => response.json())
        .then(transactions => {
            console.log('Transactions loaded:', transactions);
            
            // Process transactions to calculate USD values
            const processedTransactions = transactions.map(tx => ({
                ...tx,
                price_in_dollar: tx.is_usd ? tx.price : tx.price / 50000, // Assuming 1 USD = 50000 Toman
                is_income: tx.price > 0
            }));
            
            updateTransactionsTable(processedTransactions);
            
            // Calculate totals for transaction stats
            const totals = processedTransactions.reduce((acc, tx) => {
                const amount = Math.abs(tx.price_in_dollar);
                if (tx.is_income) {
                    acc.income += amount;
                } else {
                    acc.expense += amount;
                }
                return acc;
            }, { income: 0, expense: 0 });
            
            updateTransactionSummary(totals.income, totals.expense);
        })
        .catch(error => {
            console.error('Error loading transactions:', error);
            // Show error message to user
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
    const originalText = parseBtn.textContent;
    parseBtn.textContent = 'Parsing...';
    parseBtn.disabled = true;
    
    fetch('http://localhost:9000/api/parse_transaction', {
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
        parseBtn.textContent = originalText;
        parseBtn.disabled = false;
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
    fetch('http://localhost:9000/api/add_transaction', {
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
    fetch('http://localhost:9000/api/add_source', {
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
        
        // Format value based on currency
        const formattedValue = source.usd 
            ? `$${source.value.toFixed(2)}` 
            : `${source.value.toLocaleString()} ₺`;
            
        // Update totals
        if (source.usd) {
            totalUSD += source.value;
        } else {
            totalToman += source.value;
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
            <td>${formattedValue}</td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Update summary cards
    updateBalanceSummary(totalUSD, totalToman);
}

// Update transactions table
function updateTransactionsTable(transactions) {
    const tbody = document.querySelector('#transactions-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Sort transactions by date (most recent first)
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    transactions.forEach(tx => {
        const row = document.createElement('tr');
        
        // Determine if text contains Persian characters
        const hasPersian = /[\u0600-\u06FF]/.test(tx.name);
        const nameClass = hasPersian ? 'font-vazir text-end' : '';
        
        // Determine icon based on category (you can expand this)
        let iconClass = 'fa-shopping-cart';
        switch(tx.category_name.toLowerCase()) {
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
        }
        
        let bgClass = tx.is_income ? 'bg-success' : 'bg-danger';
        
        // Format amount based on currency
        const amount = Math.abs(tx.price);
        const formattedAmount = tx.is_usd 
            ? `${tx.is_income ? '+' : '-'}$${amount.toFixed(2)}` 
            : `${tx.is_income ? '+' : '-'}${amount.toLocaleString('fa-IR')} تومان`;
        
        // Check if category and source names contain Persian
        const hasPersianCategory = /[\u0600-\u06FF]/.test(tx.category_name);
        const hasPersianSource = /[\u0600-\u06FF]/.test(tx.source_name);
        const categoryClass = hasPersianCategory ? 'font-vazir text-end' : '';
        const sourceClass = hasPersianSource ? 'font-vazir text-end' : '';
        
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <div class="transaction-icon ${bgClass}">
                        <i class="fas ${iconClass}"></i>
                    </div>
                    <div class="ms-3 flex-grow-1">
                        <h6 class="mb-0 ${nameClass}">${tx.name}</h6>
                        <small class="text-muted ${sourceClass}">${tx.source_name}</small>
                    </div>
                </div>
            </td>
            <td class="${categoryClass}">${tx.category_name}</td>
            <td dir="ltr">${new Date(tx.date).toLocaleDateString('fa-IR')}</td>
            <td class="${tx.is_income ? 'text-success' : 'text-danger'} ${tx.is_usd ? '' : 'font-vazir'}">${formattedAmount}</td>
        `;
        
        tbody.appendChild(row);
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
        tomanBalanceEl.textContent = `${totalToman.toLocaleString()} ₺`;
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