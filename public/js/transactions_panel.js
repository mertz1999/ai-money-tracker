// Transactions Panel JS

window.initTransactionsPanel = function() {
    const monthSelect = document.getElementById('transactionsMonth');
    const loadBtn = document.getElementById('loadTransactionsBtn');
    const tableBody = document.querySelector('#transactionsTable tbody');
    let categories = [];
    let sources = [];

    async function fetchCategories() {
        const res = await fetchWithAuth('/api/categories');
        categories = await res.json();
    }

    async function fetchSources() {
        const res = await fetchWithAuth('/api/sources');
        sources = await res.json();
    }

    // Helper: show toast
    function showToast(message, type = 'success') {
        let toast = document.getElementById('custom-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'custom-toast';
            toast.style.position = 'fixed';
            toast.style.bottom = '32px';
            toast.style.right = '32px';
            toast.style.zIndex = '9999';
            toast.style.minWidth = '220px';
            toast.style.padding = '16px 24px';
            toast.style.borderRadius = '8px';
            toast.style.background = '#222';
            toast.style.color = 'white';
            toast.style.fontWeight = '500';
            toast.style.boxShadow = '0 4px 24px rgba(0,0,0,0.12)';
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.style.opacity = '1';
        setTimeout(() => {
            toast.style.opacity = '0';
        }, 2000);
    }

    function renderTable(transactions) {
        tableBody.innerHTML = '';
        transactions.forEach(tx => {
            const tr = document.createElement('tr');
            // Set row background based on deposit/expense
            tr.className = tx.is_deposit ? 'bg-success-subtle' : 'bg-danger-subtle';
            tr.innerHTML = `
                <td>${tx.id}</td>
                <td><input type="text" class="form-control form-control-sm" value="${tx.name}"></td>
                <td><input type="date" class="form-control form-control-sm" value="${tx.date}"></td>
                <td><input type="number" class="form-control form-control-sm" value="${Math.abs(tx.price)}"></td>
                <td>
                    <select class="form-select form-select-sm">
                        <option value="true" ${tx.is_usd ? 'selected' : ''}>USD</option>
                        <option value="false" ${!tx.is_usd ? 'selected' : ''}>Toman</option>
                    </select>
                </td>
                <td>
                    <select class="form-select form-select-sm">
                        ${categories.map(cat => `<option value="${cat.id}" ${cat.id === tx.category_id ? 'selected' : ''}>${cat.name}</option>`).join('')}
                    </select>
                </td>
                <td>
                    <select class="form-select form-select-sm">
                        ${sources.map(src => `<option value="${src.id}" ${src.id === tx.source_id ? 'selected' : ''}>${src.name}</option>`).join('')}
                    </select>
                </td>
                <td><input type="number" class="form-control form-control-sm" value="${tx.your_currency_rate}"></td>
                <td>
                    <select class="form-select form-select-sm">
                        <option value="true" ${tx.is_deposit ? 'selected' : ''}>Yes</option>
                        <option value="false" ${!tx.is_deposit ? 'selected' : ''}>No</option>
                    </select>
                </td>
                <td><button class="btn btn-success btn-sm save-btn">Save</button></td>
            `;
            tableBody.appendChild(tr);
            // Save handler
            tr.querySelector('.save-btn').addEventListener('click', async function () {
                const inputs = tr.querySelectorAll('input, select');
                const body = {
                    name: inputs[0].value,
                    date: inputs[1].value,
                    price: parseFloat(inputs[2].value),
                    is_usd: inputs[3].value === 'true',
                    category_id: parseInt(inputs[4].value),
                    source_id: parseInt(inputs[5].value),
                    your_currency_rate: parseFloat(inputs[6].value),
                    is_deposit: inputs[7].value === 'true'
                };
                const res = await fetchWithAuth(`/api/transactions/${tx.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                });
                if (res.ok) {
                    tr.classList.add('table-success');
                    setTimeout(() => tr.classList.remove('table-success'), 1000);
                    showToast('Saved successfully', 'success');
                } else {
                    tr.classList.add('table-danger');
                    setTimeout(() => tr.classList.remove('table-danger'), 1000);
                    showToast('Save failed', 'error');
                }
            });
        });
    }

    async function loadTransactions() {
        let showLoadingToast = true;
        await fetchCategories();
        await fetchSources();
        let url = '/api/transactions';
        const month = monthSelect.value;
        if (month) url += `?month=${month}`;
        const res = await fetchWithAuth(url);
        const transactions = await res.json();
        renderTable(transactions);
        if (showLoadingToast) showToast('Loaded successfully', 'success');
    }

    if (loadBtn) {
        loadBtn.addEventListener('click', loadTransactions);
    }
    // Optionally auto-load current month
    // loadTransactions(); 
} 