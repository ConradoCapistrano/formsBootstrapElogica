document.addEventListener("DOMContentLoaded", () => {
    // Form elements
    const form = document.getElementById('transactionForm');
    const productNameInput = document.getElementById('productName');
    const quantityInput = document.getElementById('quantity');
    const valueInput = document.getElementById('value');
    const transactionTypeSelect = document.getElementById('transactionType');
    const limparBtn = document.getElementById('limparBtn');

    // Modal elements
    const actionModal = new bootstrap.Modal(document.getElementById('actionModal'));
    const modalIcon = document.getElementById('modalIcon');
    const modalTitle = document.getElementById('actionModalLabel');
    const modalItemElement = document.getElementById('modalItem');
    const modalQuantityElement = document.getElementById('modalQuantity');
    const modalValueElement = document.getElementById('modalValue');
    const modalCancelBtn = document.getElementById('modalCancelBtn');
    const modalConfirmBtn = document.getElementById('modalConfirmBtn');

    // Statement elements
    const extratoBody = document.getElementById('extratoBody');
    const balanceElement = document.getElementById('balance');
    const totalValueElement = document.getElementById('totalValue');

    // Navigation buttons
    const viewExtratoBtn = document.getElementById('viewExtratoBtn');
    const newTransactionBtn = document.getElementById('newTransactionBtn');

    // Sections
    const section1 = document.getElementById('section1');
    const section2 = document.getElementById('section2');

    // Local storage data
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    let balance = parseFloat(localStorage.getItem('balance')) || 0;
    let currentAction = null; // 'add' or 'delete'
    let transactionToDelete = null;

    // Initialize app
    initApp();

    function initApp() {
        updateExtrato();
        updateBalance();
        if (transactions.length > 0) {
            renderTransactions();
        }
        // Ensure initial mobile view
        if (window.innerWidth < 992) {
            section1.classList.remove('d-none');
            section2.classList.add('d-none');
        }
    }

    // Input validations
    productNameInput.addEventListener('input', () => {
        productNameInput.value = productNameInput.value.trim();
        productNameInput.classList.toggle('is-invalid', productNameInput.value.length > 35);
    });

    quantityInput.addEventListener('input', () => {
        quantityInput.value = quantityInput.value.replace(/[^0-9]/g, '');
        if (quantityInput.value === '0' || quantityInput.value === '' || parseInt(quantityInput.value) > 999) {
            quantityInput.classList.add('is-invalid');
            if (parseInt(quantityInput.value) > 999) quantityInput.value = '999';
        } else {
            quantityInput.classList.remove('is-invalid');
        }
    });

    valueInput.addEventListener('input', formatCurrency);

    function formatCurrency(e) {
        let value = this.value.replace(/\D/g, '');
        value = value.replace(/^0+/, '') || '0';
        while (value.length < 3) value = '0' + value;
        const formattedValue = (value.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, '.')) + ',' + value.slice(-2);
        this.value = formattedValue;
        this.classList.toggle('is-invalid', parseFloat(value) === 0);
    }

    function parseCurrency(value) {
        return parseFloat(value.replace(/\./g, '').replace(',', '.'));
    }

    limparBtn.addEventListener('click', () => {
        form.reset();
        productNameInput.classList.remove('is-invalid');
        quantityInput.classList.remove('is-invalid');
        valueInput.classList.remove('is-invalid');
    });

    // Form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const productName = productNameInput.value.trim();
        const quantity = parseInt(quantityInput.value);
        const value = parseCurrency(valueInput.value);

        // Validate form
        if (!validateForm(productName, quantity, value)) return;

        // Setup modal for confirmation
        currentAction = 'add';
        modalIcon.src = './assets/positivo.svg';
        modalTitle.textContent = 'Confirma a adição do produto?';
        modalItemElement.textContent = productName;
        modalQuantityElement.textContent = quantity;
        modalValueElement.textContent = valueInput.value;
        modalConfirmBtn.textContent = 'Adicionar';
        actionModal.show();
    });

    function validateForm(productName, quantity, value) {
        let isValid = true;
        if (!productName || productName.length > 35) {
            productNameInput.classList.add('is-invalid');
            isValid = false;
        }
        if (isNaN(quantity) || quantity <= 0 || quantity > 999) {
            quantityInput.classList.add('is-invalid');
            isValid = false;
        }
        if (isNaN(value) || value <= 0) {
            valueInput.classList.add('is-invalid');
            isValid = false;
        }
        return isValid;
    }

    // Modal actions
    modalCancelBtn.addEventListener('click', () => {
        if (currentAction === 'add') {
            form.reset();
        }
        actionModal.hide();
    });

    modalConfirmBtn.addEventListener('click', () => {
        if (currentAction === 'add') {
            const transaction = {
                id: Date.now(),
                type: transactionTypeSelect.value,
                productName: productNameInput.value.trim(),
                quantity: parseInt(quantityInput.value),
                value: parseCurrency(valueInput.value),
                date: new Date().toLocaleString()
            };
            transactions.push(transaction);
            updateBalanceAfterTransaction(transaction);
            form.reset();
            if (window.innerWidth < 992) {
                section1.classList.add('d-none');
                section2.classList.remove('d-none');
                section2.classList.add('vh-100');
            }
        } else if (currentAction === 'delete' && transactionToDelete) {
            updateBalanceAfterDelete(transactionToDelete);
            transactions = transactions.filter(t => t.id !== transactionToDelete.id);
        }
        saveToLocalStorage();
        updateExtrato();
        actionModal.hide();
    });

    // Navigation for mobile
    viewExtratoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        section1.classList.add('d-none');
        section2.classList.remove('d-none');
        section2.classList.add('vh-100');
    });

    newTransactionBtn.addEventListener('click', (e) => {
        e.preventDefault();
        section2.classList.add('d-none');
        section1.classList.remove('d-none');
        section1.classList.add('vh-100');
    });

    // Render transactions
    function renderTransactions() {
        extratoBody.innerHTML = '';
        transactions.forEach(transaction => {
            const row = document.createElement('tr');
            const sign = transaction.type === 'Compra' ? '-' : '+';
            const valueFormatted = formatCurrencyValue(transaction.value * transaction.quantity);
            row.innerHTML = `
                <td class="py-2 d-flex justify-content-center">${sign}</td>
                <td class="ps-2 py-2">${transaction.productName}</td>
                <td class="ps-2 py-2">${transaction.quantity}</td>
                <td class="ps-2 py-2">R$ ${valueFormatted}</td>
                <td class="d-none d-md-table-cell ps-2 py-2">
                    <button class="btn p-1 delete-btn" data-id="${transaction.id}">
                        <img src="assets/Vector.svg" alt="Deletar">
                    </button>
                </td>
            `;
            row.dataset.id = transaction.id; // Adiciona o ID da transação à linha
            extratoBody.appendChild(row);
        });

        // Evento para botões de exclusão (visíveis em telas maiores)
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                transactionToDelete = transactions.find(t => t.id === id);
                if (transactionToDelete) {
                    currentAction = 'delete';
                    modalIcon.src = './assets/negativo.svg';
                    modalTitle.textContent = 'Confirma a exclusão do produto?';
                    modalItemElement.textContent = transactionToDelete.productName;
                    modalQuantityElement.textContent = transactionToDelete.quantity;
                    modalValueElement.textContent = formatCurrencyValue(transactionToDelete.value * transactionToDelete.quantity);
                    modalConfirmBtn.textContent = 'Excluir';
                    actionModal.show();
                }
            });
        });

        // Evento para clique na linha em mobile
        if (window.innerWidth < 992) {
            document.querySelectorAll('#extratoBody tr').forEach(row => {
                row.addEventListener('click', (e) => {
                    // Evita disparar o evento se o clique for no botão de exclusão
                    if (e.target.closest('.delete-btn')) return;

                    const id = parseInt(row.dataset.id);
                    transactionToDelete = transactions.find(t => t.id === id);
                    if (transactionToDelete) {
                        currentAction = 'delete';
                        modalIcon.src = './assets/negativo.svg';
                        modalTitle.textContent = 'Confirma a exclusão do produto?';
                        modalItemElement.textContent = transactionToDelete.productName;
                        modalQuantityElement.textContent = transactionToDelete.quantity;
                        modalValueElement.textContent = formatCurrencyValue(transactionToDelete.value * transactionToDelete.quantity);
                        modalConfirmBtn.textContent = 'Excluir';
                        actionModal.show();
                    }
                });
            });
        }
    }

    function updateExtrato() {
        renderTransactions();
        const total = transactions.reduce((sum, t) => {
            const value = t.value * t.quantity;
            return t.type === 'Compra' ? sum - value : sum + value;
        }, 0);
        totalValueElement.textContent = `R$ ${formatCurrencyValue(Math.abs(total))}`;
    }

    function updateBalance() {
        balanceElement.textContent = `R$ ${formatCurrencyValue(balance)}`;
        balanceElement.classList.remove('text-success', 'text-danger', 'text-primary');
        if (balance > 0) balanceElement.classList.add('text-success');
        else if (balance < 0) balanceElement.classList.add('text-danger');
        else balanceElement.classList.add('text-primary');
    }

    function updateBalanceAfterTransaction(transaction) {
        if (transaction.type === 'Compra') {
            balance -= transaction.value * transaction.quantity;
        } else {
            balance += transaction.value * transaction.quantity;
        }
        updateBalance();
    }

    function updateBalanceAfterDelete(transaction) {
        if (transaction.type === 'Compra') {
            balance += transaction.value * transaction.quantity;
        } else {
            balance -= transaction.value * transaction.quantity;
        }
        updateBalance();
    }

    function saveToLocalStorage() {
        localStorage.setItem('transactions', JSON.stringify(transactions));
        localStorage.setItem('balance', balance.toString());
    }

    function formatCurrencyValue(value) {
        return value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    // Handle window resize to maintain layout
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 992) {
            section1.classList.remove('d-none', 'vh-100');
            section2.classList.remove('d-none', 'vh-100');
            section1.classList.add('d-lg-flex');
            section2.classList.add('d-lg-flex');
        } else {
            if (!section1.classList.contains('d-none')) {
                section1.classList.add('vh-100');
                section2.classList.add('d-none');
            } else {
                section2.classList.add('vh-100');
                section1.classList.add('d-none');
            }
        }
        updateExtrato(); // Re-renderiza para aplicar eventos corretos ao redimensionar
    });
});