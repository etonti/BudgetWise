const { jsPDF } = window.jspdf;

let transactions = [];
let budgets = {};

const balanceElem = document.getElementById('balance');
const incomeElem = document.getElementById('income');
const expensesElem = document.getElementById('expenses');
const budgetListElem = document.getElementById('budget-list');
const transactionsTableBody = document.querySelector('#transactions-table tbody');

const transactionModal = document.getElementById('transaction-modal');
const budgetModal = document.getElementById('budget-modal');
const alertModal = document.getElementById('alert-modal');
const alertContent = document.getElementById('alert-content');

const transactionForm = document.getElementById('transaction-form');
const budgetForm = document.getElementById('budget-form');

const addTransactionBtn = document.getElementById('add-transaction-btn');
const setBudgetBtn = document.getElementById('set-budget-btn');
const exportPdfBtn = document.getElementById('export-pdf-btn');

const typeFilter = document.getElementById('type-filter');
const startDateFilter = document.getElementById('start-date');
const endDateFilter = document.getElementById('end-date');
const applyFiltersBtn = document.getElementById('apply-filters');

const budgetInputsContainer = document.getElementById('budget-inputs');
const addCategoryBtn = document.getElementById('add-category-btn');

const expensesChartCtx = document.getElementById('expenses-chart').getContext('2d');
const monthlyChartCtx = document.getElementById('monthly-chart').getContext('2d');

let expensesChart, monthlyChart;

function updateBalance() {
    let income = 0;
    let expense = 0;
    transactions.forEach(t => {
        if (t.type === 'income') income += t.amount;
        else expense += t.amount;
    });
    balanceElem.textContent = (income - expense).toFixed(2) + ' €';
    incomeElem.textContent = income.toFixed(2) + ' €';
    expensesElem.textContent = expense.toFixed(2) + ' €';
}

function renderBudgets() {
    budgetListElem.innerHTML = '';
    for (const cat in budgets) {
        const div = document.createElement('div');
        div.textContent = `${cat}: ${budgets[cat].toFixed(2)} €`;
    
    // Ajout bouton supprimer pour chaque catégorie budget
    const btnDel = document.createElement('button');
    btnDel.textContent = 'Supprimer';
    btnDel.classList.add('btn-action');
    btnDel.style.marginLeft = '10px';
    btnDel.addEventListener('click', () => {
    delete budgets[cat];
    renderBudgets();
    updateCharts();
    });
    div.appendChild(btnDel);
    
    budgetListElem.appendChild(div);
    }
}

function renderTransactions(filtered = transactions) {
    transactionsTableBody.innerHTML = '';
    filtered.forEach(t => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
        <td>${t.date}</td>
        <td>${t.type}</td>
        <td>${t.category}</td>
        <td>${t.amount.toFixed(2)} €</td>
        <td>${t.description || ''}</td>
        <td>${t.tags.join(', ')}</td>
        <td>
            <button class="btn-action btn-edit">Modifier</button>
            <button class="btn-action btn-delete">Supprimer</button>
        </td>
    `;
    // Modifier
    tr.querySelector('.btn-edit').addEventListener('click', () => openEditTransaction(t.id));
    // Supprimer
    tr.querySelector('.btn-delete').addEventListener('click', () => {
        transactions = transactions.filter(tx => tx.id !== t.id);
        applyFilters();
        updateBalance();
        updateCharts();
        checkAlerts();
    });
    transactionsTableBody.appendChild(tr);
    });
}

function openEditTransaction(id) {
    const t = transactions.find(tx => tx.id === id);
    if (!t) return;

    document.getElementById('transaction-id').value = t.id;
    document.getElementById('transaction-type').value = t.type;
    document.getElementById('transaction-amount').value = t.amount;
    document.getElementById('transaction-category').value = t.category;
    document.getElementById('transaction-date').value = t.date;
    document.getElementById('transaction-description').value = t.description;
    document.getElementById('transaction-tags').value = t.tags.join(', ');
    document.getElementById('modal-title').textContent = 'Modifier la transaction';
    showModal(transactionModal);
}

function resetTransactionForm() {
    transactionForm.reset();
    document.getElementById('transaction-id').value = '';
    document.getElementById('modal-title').textContent = 'Nouvelle transaction';
}

function applyFilters() {
    let filtered = [...transactions];
    const type = typeFilter.value;
    if (type !== 'all') filtered = filtered.filter(t => t.type === type);

    const startDate = startDateFilter.value;
    if (startDate) filtered = filtered.filter(t => t.date >= startDate);

    const endDate = endDateFilter.value;
    if (endDate) filtered = filtered.filter(t => t.date <= endDate);

    renderTransactions(filtered);
}

function showModal(modal) {
    modal.style.display = 'block';
}

function closeModal(modal) {
    modal.style.display = 'none';
}

function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}


function renderBudgetInputs() {
    budgetInputsContainer.innerHTML = '';
    for (const cat in budgets) {
        addBudgetInput(cat, budgets[cat]);
    }
}

function addBudgetInput(cat = '', value = '') {
    const div = document.createElement('div');
    div.classList.add('budget-input-row');
    div.innerHTML = `
        <input type="text" class="budget-category-input" placeholder="Catégorie" required value="${cat}">
        <input type="number" class="budget-value-input" step="0.01" placeholder="Montant (€)" required value="${value}">
        <button type="button" class="btn-action btn-delete-category">Supprimer</button>
    `;

    div.querySelector('.btn-delete-category').addEventListener('click', () => {
        div.remove();
    });
    budgetInputsContainer.appendChild(div);
}

addCategoryBtn.addEventListener('click', () => {
    addBudgetInput();
});


function updateCharts() {

    const expenseData = {};
    transactions.forEach(t => {
        if (t.type === 'expense') {
        expenseData[t.category] = (expenseData[t.category] || 0) + t.amount;
    }
});

  // Mise à jour graphique dépenses
    if (expensesChart) expensesChart.destroy();
    expensesChart = new Chart(expensesChartCtx, {
        type: 'doughnut',
        data: {
        labels: Object.keys(expenseData),
        datasets: [{
            label: 'Dépenses par catégorie',
            data: Object.values(expenseData),
            backgroundColor: generateColors(Object.keys(expenseData).length),
        }]
    },
        options: {
        responsive: true,
        plugins: {
            legend: { position: 'bottom' },
        }
    }
});

    const months = {};
    transactions.forEach(t => {
        const month = t.date.slice(0,7); // YYYY-MM
        if (!months[month]) months[month] = { income: 0, expense: 0 };
        months[month][t.type] += t.amount;
    });

    const sortedMonths = Object.keys(months).sort();

    if (monthlyChart) monthlyChart.destroy();
    monthlyChart = new Chart(monthlyChartCtx, {
    type: 'bar',
    data: {
        labels: sortedMonths,
        datasets: [
            {
            label: 'Revenus',
            data: sortedMonths.map(m => months[m].income),
            backgroundColor: 'rgba(75, 192, 192, 0.7)'
            },
            {
            label: 'Dépenses',
            data: sortedMonths.map(m => months[m].expense),
            backgroundColor: 'rgba(255, 99, 132, 0.7)'
            }
        ]
        },
        options: {
        responsive: true,
        scales: {
            x: {
            title: { display: true, text: 'Mois' },
            ticks: {
                autoSkip: false
            }
            },
            y: {
            beginAtZero: true,
            title: { display: true, text: 'Montant (€)' }
            }
        },
        plugins: {
            legend: { position: 'bottom' }
        }
        }
    });
    }

    function generateColors(count) {
    const colors = [
        '#3498db','#e74c3c','#2ecc71','#9b59b6','#f1c40f',
        '#1abc9c','#e67e22','#34495e','#95a5a6','#d35400'
    ];
    return Array.from({length: count}, (_, i) => colors[i % colors.length]);
    }

    // Gestion alertes (par exemple : alerte si dépenses dépassent budget)

    function checkAlerts() {
    alertContent.innerHTML = '';
    let alerts = [];

    for (const cat in budgets) {
        const spent = transactions
        .filter(t => t.type === 'expense' && t.category === cat)
        .reduce((sum, t) => sum + t.amount, 0);
        if (spent > budgets[cat]) {
        alerts.push(`Budget dépassé pour la catégorie "${cat}" : dépensé ${spent.toFixed(2)} €, budget ${budgets[cat].toFixed(2)} €.`);
        }
    }

    if (alerts.length > 0) {
        alerts.forEach(a => {
        const p = document.createElement('p');
        p.textContent = a;
        alertContent.appendChild(p);
        });
        showModal(alertModal);
    } else {
        closeModal(alertModal);
    }
    }

    // Export PDF

    function exportPDF() {
    const doc = new jsPDF();
    doc.text("Liste des transactions", 14, 15);

    const headers = [];
    document.querySelectorAll('#transactions-table thead th').forEach(th => {
        headers.push(th.innerText.trim());
    });

    const data = [];
    document.querySelectorAll('#transactions-table tbody tr').forEach(tr => {
        const row = [];
        tr.querySelectorAll('td').forEach(td => {
        row.push(td.innerText.trim());
        });
        data.push(row);
    });

    doc.autoTable({
        head: [headers],
        body: data,
        startY: 20,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [22, 160, 133] },
    });

    doc.save('transactions.pdf');
    }

    // Événements

    // Ouvrir modal nouvelle transaction
    addTransactionBtn.addEventListener('click', () => {
    resetTransactionForm();
    showModal(transactionModal);
    });
    setBudgetBtn.addEventListener('click', () => {
    renderBudgetInputs();
    showModal(budgetModal);
    });

    document.querySelectorAll('.modal .close').forEach(span => {
    span.addEventListener('click', () => {
        closeModal(span.closest('.modal'));
    });
    });

    // Soumission formulaire transaction
    transactionForm.addEventListener('submit', e => {
    e.preventDefault();
    const id = document.getElementById('transaction-id').value;
    const type = document.getElementById('transaction-type').value;
    const amount = parseFloat(document.getElementById('transaction-amount').value);
    const category = document.getElementById('transaction-category').value.trim();
    const date = document.getElementById('transaction-date').value;
    const description = document.getElementById('transaction-description').value.trim();
    const tags = document.getElementById('transaction-tags').value.split(',').map(s => s.trim()).filter(s => s);

    if (amount <= 0 || !category || !date) {
        alert('Veuillez remplir correctement tous les champs obligatoires.');
        return;
    }

    if (id) {

        const tx = transactions.find(t => t.id === id);
        if (tx) {
        tx.type = type;
        tx.amount = amount;
        tx.category = category;
        tx.date = date;
        tx.description = description;
        tx.tags = tags;
        }
    } else {

        transactions.push({
        id: generateId(),
        type,
        amount,
        category,
        date,
        description,
        tags
        });
    }

    closeModal(transactionModal);
    applyFilters();
    updateBalance();
    updateCharts();
    checkAlerts();
    });

    // Soumission formulaire budget
    budgetForm.addEventListener('submit', e => {
    e.preventDefault();

    budgets = {};
    const rows = budgetInputsContainer.querySelectorAll('.budget-input-row');
    let valid = true;
    rows.forEach(row => {
        const catInput = row.querySelector('.budget-category-input');
        const valInput = row.querySelector('.budget-value-input');
        const cat = catInput.value.trim();
        const val = parseFloat(valInput.value);

        if (!cat || isNaN(val) || val < 0) {
        valid = false;
        } else {
        budgets[cat] = val;
        }
    });

    if (!valid) {
        alert('Veuillez remplir correctement les catégories et montants de budget.');
        return;
    }

    closeModal(budgetModal);
    renderBudgets();
    updateCharts();
    checkAlerts();
    });

    // Appliquer filtres sur transactions
    applyFiltersBtn.addEventListener('click', applyFilters);

    // Export PDF
    exportPdfBtn.addEventListener('click', exportPDF);

    // Initialisation

    updateBalance();
    renderBudgets();
    applyFilters();
    updateCharts();
    checkAlerts();
