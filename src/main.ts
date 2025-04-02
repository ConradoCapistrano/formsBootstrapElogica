document.addEventListener("DOMContentLoaded", () => {
    // Form elements
    const form = document.getElementById('transactionForm') as HTMLFormElement;
    const productNameInput = document.getElementById('productName') as HTMLInputElement;
    const quantityInput = document.getElementById('quantity') as HTMLInputElement;
    const valueInput = document.getElementById('value') as HTMLInputElement;
    const transactionTypeSelect = document.getElementById('transactionType') as HTMLSelectElement;
    const limparBtn = document.getElementById('limparBtn') as HTMLButtonElement;

    // Modal elements
    const actionModal = new bootstrap.Modal(document.getElementById('actionModal') as HTMLElement);
    const modalIcon = document.getElementById('modalIcon') as HTMLImageElement;
    const modalTitle = document.getElementById('actionModalLabel') as HTMLElement;
    const modalItemElement = document.getElementById('modalItem') as HTMLElement;
    const modalQuantityElement = document.getElementById('modalQuantity') as HTMLElement;
    const modalValueElement = document.getElementById('modalValue') as HTMLElement;
    const modalCancelBtn = document.getElementById('modalCancelBtn') as HTMLButtonElement;
    const modalConfirmBtn = document.getElementById('modalConfirmBtn') as HTMLButtonElement;

    // Statement elements
    const extratoBody = document.getElementById('extratoBody') as HTMLElement;
    const balanceElement = document.getElementById('balance') as HTMLElement;
    const totalValueElement = document.getElementById('totalValue') as HTMLElement;

    // Navigation buttons
    const viewExtratoBtn = document.getElementById('viewExtratoBtn') as HTMLButtonElement;
    const newTransactionBtn = document.getElementById('newTransactionBtn') as HTMLButtonElement;

    // Sections
    const section1 = document.getElementById('section1') as HTMLElement;
    const section2 = document.getElementById('section2') as HTMLElement;

    // Local storage data
    let transactions: Array<{
        id: number;
        type: string;
        productName: string;
        quantity: number;
        value: number;
        date: string;
    }> = JSON.parse(localStorage.getItem('transactions') || '[]');

    let balance: number = parseFloat(localStorage.getItem('balance') || '0');
    let currentAction: string | null = null;
    let transactionToDelete: any = null;

    initApp();

    function initApp(): void {
        updateExtrato();
        updateBalance();
        if (transactions.length > 0) {
            renderTransactions();
        }
        if (window.innerWidth < 992) {
            section1.classList.remove('d-none');
            section2.classList.add('d-none');
        }
    }

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

    function formatCurrency(this: HTMLInputElement, e?: Event): void {
        let value = this.value.replace(/\D/g, '');
        value = value.replace(/^0+/, '') || '0';
        while (value.length < 3) value = '0' + value;
        const formattedValue = (value.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, '.')) + ',' + value.slice(-2);
        this.value = formattedValue;
        this.classList.toggle('is-invalid', parseFloat(value) === 0);
    }

    function parseCurrency(value: string): number {
        return parseFloat(value.replace(/\./g, '').replace(',', '.'));
    }

    limparBtn.addEventListener('click', () => {
        form.reset();
        productNameInput.classList.remove('is-invalid');
        quantityInput.classList.remove('is-invalid');
        valueInput.classList.remove('is-invalid');
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const productName = productNameInput.value.trim();
        const quantity = parseInt(quantityInput.value);
        const value = parseCurrency(valueInput.value);

        if (!validateForm(productName, quantity, value)) return;

        currentAction = 'add';
        modalIcon.src = './assets/positivo.svg';
        modalTitle.textContent = 'Confirma a adição do produto?';
        modalItemElement.textContent = productName;
        modalQuantityElement.textContent = quantity.toString();
        modalValueElement.textContent = valueInput.value;
        modalConfirmBtn.textContent = 'Adicionar';
        actionModal.show();
    });

    function validateForm(productName: string, quantity: number, value: number): boolean {
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

    function renderTransactions(): void {
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
            row.dataset.id = transaction.id.toString();
            extratoBody.appendChild(row);
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const id = parseInt(target.getAttribute('data-id') || '0');
                transactionToDelete = transactions.find(t => t.id === id);
                if (transactionToDelete) {
                    currentAction = 'delete';
                    modalIcon.src = './assets/negativo.svg';
                    modalTitle.textContent = 'Confirma a exclusão do produto?';
                    modalItemElement.textContent = transactionToDelete.productName;
                    modalQuantityElement.textContent = transactionToDelete.quantity.toString();
                    modalValueElement.textContent = formatCurrencyValue(transactionToDelete.value * transactionToDelete.quantity);
                    modalConfirmBtn.textContent = 'Excluir';
                    actionModal.show();
                }
            });
        });

        if (window.innerWidth < 992) {
            document.querySelectorAll('#extratoBody tr').forEach(row => {
                row.addEventListener('click', (e) => {
                    if ((e.target as HTMLElement).closest('.delete-btn')) return;

                    const id = parseInt((row as HTMLElement).dataset.id || '0');
                    transactionToDelete = transactions.find(t => t.id === id);
                    if (transactionToDelete) {
                        currentAction = 'delete';
                        modalIcon.src = './assets/negativo.svg';
                        modalTitle.textContent = 'Confirma a exclusão do produto?';
                        modalItemElement.textContent = transactionToDelete.productName;
                        modalQuantityElement.textContent = transactionToDelete.quantity.toString();
                        modalValueElement.textContent = formatCurrencyValue(transactionToDelete.value * transactionToDelete.quantity);
                        modalConfirmBtn.textContent = 'Excluir';
                        actionModal.show();
                    }
                });
            });
        }
    }

    function updateExtrato(): void {
        renderTransactions();
        const total = transactions.reduce((sum, t) => {
            const value = t.value * t.quantity;
            return t.type === 'Compra' ? sum - value : sum + value;
        }, 0);
        totalValueElement.textContent = `R$ ${formatCurrencyValue(Math.abs(total))}`;
    }

    function updateBalance(): void {
        balanceElement.textContent = `R$ ${formatCurrencyValue(balance)}`;
        balanceElement.classList.remove('text-success', 'text-danger', 'text-primary');
        if (balance > 0) balanceElement.classList.add('text-success');
        else if (balance < 0) balanceElement.classList.add('text-danger');
        else balanceElement.classList.add('text-primary');
    }

    function updateBalanceAfterTransaction(transaction: { type: string; value: number; quantity: number }): void {
        if (transaction.type === 'Compra') {
            balance -= transaction.value * transaction.quantity;
        } else {
            balance += transaction.value * transaction.quantity;
        }
        updateBalance();
    }

    function updateBalanceAfterDelete(transaction: { type: string; value: number; quantity: number }): void {
        if (transaction.type === 'Compra') {
            balance += transaction.value * transaction.quantity;
        } else {
            balance -= transaction.value * transaction.quantity;
        }
        updateBalance();
    }

    function saveToLocalStorage(): void {
        localStorage.setItem('transactions', JSON.stringify(transactions));
        localStorage.setItem('balance', balance.toString());
    }

    function formatCurrencyValue(value: number): string {
        return value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

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
        updateExtrato();
    });
});