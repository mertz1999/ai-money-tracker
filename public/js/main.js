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
            
            // Trigger currency change event
            const event = new CustomEvent('currencyChange', {
                detail: { currency: currencyText }
            });
            document.dispatchEvent(event);
        });
    });
    
    // Load categories and sources for dropdowns
    loadCategories();
    loadSources();
    
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
    
    // Update currency symbol when currency selection changes
    const sourceCurrency = document.getElementById('sourceCurrency');
    const sourceValueCurrency = document.getElementById('sourceValueCurrency');
    
    if (sourceCurrency && sourceValueCurrency) {
        sourceCurrency.addEventListener('change', function() {
            sourceValueCurrency.textContent = this.value === 'true' ? '$' : '₺';
        });
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
        })
        .catch(error => {
            console.error('Error loading sources:', error);
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
    // Check if we have parsed data
    const parsedDetails = document.getElementById('parsedTransactionDetails');
    if (parsedDetails.style.display === 'none') {
        // If not parsed yet, try to parse
        parseTransactionDescription();
        return;
    }
    
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
                throw new Error(err.error || 'Failed to save transaction');
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
        
        // Refresh dashboard data
        document.dispatchEvent(new Event('refreshDashboard'));
        
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
                throw new Error(err.error || 'Failed to save source');
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
        
        // Refresh dashboard data and source dropdown
        document.dispatchEvent(new Event('refreshDashboard'));
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