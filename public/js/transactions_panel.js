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

    function renderTable(transactions) {
        tableBody.innerHTML = '';
        transactions.forEach(tx => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${tx.id}</td>
                <td><input type="text" class="form-control form-control-sm" value="${tx.name}"></td>
                <td><input type="date" class="form-control form-control-sm" value="${tx.date}"></td>
                <td><input type="number" class="form-control form-control-sm" value="${tx.price}"></td>
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
                } else {
                    tr.classList.add('table-danger');
                    setTimeout(() => tr.classList.remove('table-danger'), 1000);
                }
            });
        });
    }

    async function loadTransactions() {
        await fetchCategories();
        await fetchSources();
        let url = '/api/transactions';
        const month = monthSelect.value;
        if (month) url += `?month=${month}`;
        const res = await fetchWithAuth(url);
        const transactions = await res.json();
        renderTable(transactions);
    }

    if (loadBtn) {
        loadBtn.addEventListener('click', loadTransactions);
    }
    // Optionally auto-load current month
    // loadTransactions(); 
} 