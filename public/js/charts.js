document.addEventListener('DOMContentLoaded', function() {
    // Set Chart.js default options
    Chart.defaults.font.family = "'Poppins', 'Helvetica', 'Arial', sans-serif";
    Chart.defaults.color = '#6c757d';
    
    // Fetch dashboard data from API
    fetchDashboardData();
    
    // Listen for currency change events
    document.addEventListener('currencyChange', function(e) {
        updateChartsForCurrency(e.detail.currency);
    });
    
    // Listen for dashboard refresh events
    document.addEventListener('refreshDashboard', function() {
        fetchDashboardData();
    });
});

// Test function to directly add data to tables
function testTablesWithDummyData() {
    console.log('Testing tables with dummy data');
    
    // Test sources table
    const dummySources = [
        { id: 1, name: 'Test Bank', bank: true, usd: false, value: 10000 },
        { id: 2, name: 'Test Cash', bank: false, usd: true, value: 500 }
    ];
    updateSourcesTable(dummySources);
    
    // Test transactions table
    const dummyTransactions = [
        { 
            id: 1, 
            name: 'Test Purchase', 
            category: 'Shopping', 
            date: '2023-05-14', 
            price_in_dollar: 50, 
            is_income: false,
            source: 'Test Bank' 
        },
        { 
            id: 2, 
            name: 'Test Income', 
            category: 'Salary', 
            date: '2023-05-13', 
            price_in_dollar: -1000, 
            is_income: true,
            source: 'Test Bank' 
        }
    ];
    updateTransactionsTable(dummyTransactions);
}

// Fetch dashboard data from API
function fetchDashboardData() {
    console.log('Fetching dashboard data...');
    fetch('http://localhost:9000/api/dashboard')
        .then(response => response.json())
        .then(data => {
            console.log('Dashboard data received:', data);
            
            // Update summary cards
            updateSummaryCards(data);
            
            // Initialize charts with data
            initSpendingChart(data);
            initCategoryChart(data);
            
            // Update sources table
            updateSourcesTable(data.sources);
            
            // Update transactions table
            updateTransactionsTable(data.recent_transactions);
        })
        .catch(error => {
            console.error('Error fetching dashboard data:', error);
        });
}

// Update summary cards with data
function updateSummaryCards(data) {
    // Total Balance
    const totalBalanceEl = document.querySelector('.summary-card:nth-child(1) .card-title');
    if (totalBalanceEl) {
        totalBalanceEl.textContent = `$${data.total_balance_usd.toFixed(2)}`;
    }
    
    // Income
    const incomeEl = document.querySelector('.summary-card:nth-child(2) .card-title');
    if (incomeEl) {
        incomeEl.textContent = `$${data.total_income.toFixed(2)}`;
    }
    
    // Expenses
    const expensesEl = document.querySelector('.summary-card:nth-child(3) .card-title');
    if (expensesEl) {
        expensesEl.textContent = `$${data.total_expense.toFixed(2)}`;
    }
    
    // Exchange Rate
    const rateEl = document.querySelector('.summary-card:nth-child(4) .card-title');
    if (rateEl) {
        rateEl.textContent = data.exchange_rate.toFixed(0);
    }
}

// Update sources table with data
function updateSourcesTable(sources) {
    console.log('Updating sources table with:', sources);
    const tbody = document.querySelector('#sources-table tbody');
    if (!tbody) {
        console.error('Sources table tbody not found in DOM');
        return;
    }
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    // Add new rows
    sources.forEach(source => {
        const row = document.createElement('tr');
        
        // Determine icon based on source type
        let iconClass = 'fa-university';
        let bgClass = 'bg-primary';
        
        if (!source.bank && source.usd) {
            iconClass = 'fa-dollar-sign';
            bgClass = 'bg-success';
        } else if (!source.bank && !source.usd) {
            iconClass = 'fa-money-bill-wave';
            bgClass = 'bg-info';
        } else if (source.bank && source.usd) {
            iconClass = 'fa-credit-card';
            bgClass = 'bg-warning';
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
            <td>${source.usd ? '$' + source.value.toFixed(2) : source.value.toFixed(0) + ' ₺'}</td>
        `;
        
        tbody.appendChild(row);
    });
    console.log('Sources table updated with rows:', sources.length);
}

// Update transactions table with data
function updateTransactionsTable(transactions) {
    console.log('Updating transactions table with:', transactions);
    const tbody = document.querySelector('#transactions-table tbody');
    if (!tbody) {
        console.error('Transactions table tbody not found in DOM');
        return;
    }
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    // Add new rows
    transactions.forEach(tx => {
        const row = document.createElement('tr');
        
        // Determine icon based on category
        let iconClass = 'fa-shopping-basket';
        let bgClass = 'bg-danger';
        
        if (tx.category.toLowerCase().includes('dining')) {
            iconClass = 'fa-utensils';
            bgClass = 'bg-warning';
        } else if (tx.category.toLowerCase().includes('utilities')) {
            iconClass = 'fa-bolt';
            bgClass = 'bg-danger';
        } else if (tx.is_income) {
            iconClass = 'fa-briefcase';
            bgClass = 'bg-success';
        }
        
        const formattedDate = new Date(tx.date).toLocaleDateString();
        const isIncome = tx.is_income;
        const amountClass = isIncome ? 'text-success' : 'text-danger';
        const amountPrefix = isIncome ? '+' : '-';
        const amount = Math.abs(tx.price_in_dollar).toFixed(2);
        
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <div class="transaction-icon ${bgClass}">
                        <i class="fas ${iconClass}"></i>
                    </div>
                    <div class="ms-3">
                        <h6 class="mb-0">${tx.name}</h6>
                        <small class="text-muted">${tx.source}</small>
                    </div>
                </div>
            </td>
            <td>${tx.category}</td>
            <td>${formattedDate}</td>
            <td class="${amountClass}">${amountPrefix}$${amount}</td>
        `;
        
        tbody.appendChild(row);
    });
    console.log('Transactions table updated with rows:', transactions.length);
}

// Spending Overview Chart
function initSpendingChart(data) {
    const ctx = document.getElementById('spendingChart');
    
    if (!ctx) return;
    
    // Create dummy data for now (would be replaced with actual data)
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const expenseData = [65, 59, 80, 81, 56, 55, 40];
    const incomeData = [28, 48, 40, 19, 86, 27, 90];
    
    // Destroy existing chart if it exists
    if (window.spendingChart) {
        window.spendingChart.destroy();
    }
    
    const spendingChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Expenses',
                    data: expenseData,
                    fill: false,
                    borderColor: '#dc3545',
                    tension: 0.1
                },
                {
                    label: 'Income',
                    data: incomeData,
                    fill: false,
                    borderColor: '#28a745',
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
    
    // Store chart reference for later updates
    window.spendingChart = spendingChart;
}

// Category Pie Chart
function initCategoryChart(data) {
    const ctx = document.getElementById('categoryChart');
    
    if (!ctx) return;
    
    // Extract category data from API response
    const categories = data.expense_data || [];
    const labels = categories.map(cat => cat.name);
    const values = categories.map(cat => cat.value);
    
    // Default colors
    const backgroundColors = [
        '#4e73df',
        '#1cc88a',
        '#36b9cc',
        '#f6c23e',
        '#e74a3b',
        '#858796',
        '#5a5c69',
        '#4c51bf',
        '#6b46c1',
        '#d69e2e'
    ];
    
    // Destroy existing chart if it exists
    if (window.categoryChart) {
        window.categoryChart.destroy();
    }
    
    const categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: backgroundColors.slice(0, values.length),
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12
                    }
                }
            },
            cutout: '70%'
        }
    });
    
    // Store chart reference for later updates
    window.categoryChart = categoryChart;
}

// Update charts when currency changes
function updateChartsForCurrency(currency) {
    // This function would typically fetch new data from the server
    // based on the selected currency and update the charts
    
    // For now, we'll just update the chart labels
    if (window.spendingChart) {
        const datasets = window.spendingChart.data.datasets;
        const currencySymbol = currency.includes('USD') ? '$' : '₺';
        
        // Update tooltips and other currency-dependent elements
        window.spendingChart.update();
    }
    
    if (window.categoryChart) {
        // Update any currency-specific elements in the category chart
        window.categoryChart.update();
    }
    
    // Refetch dashboard data to update all values
    fetchDashboardData();
} 