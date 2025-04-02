import { Transaction } from './transaction.model';
import { TransactionService } from './transaction.service';
import { FormService } from './form.service';
import { UIService } from './ui.service';

class App {
    constructor() {
        this.currentAction = null;
        this.transactionToDelete = null;
        this.transactionService = new TransactionService();
        this.form = document.getElementById('transactionForm');
        this.productNameInput = document.getElementById('productName');
        this.quantityInput = document.getElementById('quantity');
        this.valueInput = document.getElementById('value');
        this.transactionTypeSelect = document.getElementById('transactionType');
        this.limparBtn = document.getElementById('limparBtn');
        this.actionModal = new bootstrap.Modal(document.getElementById('actionModal'));
        this.modalIcon = document.getElementById('modalIcon');
        this.modalTitle = document.getElementById('actionModalLabel');
        this.modalItemElement = document.getElementById('modalItem');
        this.modalQuantityElement = document.getElementById('modalQuantity');
        this.modalValueElement = document.getElementById('modalValue');
        this.modalCancelBtn = document.getElementById('modalCancelBtn');
        this.modalConfirmBtn = document.getElementById('modalConfirmBtn');
        this.extratoBody = document.getElementById('extratoBody');
        this.balanceElement = document.getElementById('balance');
        this.totalValueElement = document.getElementById('totalValue');
        this.viewExtratoBtn = document.getElementById('viewExtratoBtn');
        this.newTransactionBtn = document.getElementById('newTransactionBtn');
        this.section1 = document.getElementById('section1');
        this.section2 = document.getElementById('section2');
        this.initApp();
        this.setupEventListeners();
    }
    initApp() {
        this.updateUI();
        if (this.transactionService.getAllTransactions().length > 0) {
            this.renderTransactions();
        }
        if (window.innerWidth < 992) {
            this.section1.classList.remove('d-none');
            this.section2.classList.add('d-none');
        }
    }
    setupEventListeners() {
        this.productNameInput.addEventListener('input', () => {
            this.productNameInput.value = this.productNameInput.value.trim();
            this.productNameInput.classList.toggle('is-invalid', this.productNameInput.value.length > 35);
        });
        this.quantityInput.addEventListener('input', () => {
            this.quantityInput.value = this.quantityInput.value.replace(/[^0-9]/g, '');
            if (this.quantityInput.value === '0' || this.quantityInput.value === '' || parseInt(this.quantityInput.value) > 999) {
                this.quantityInput.classList.add('is-invalid');
                if (parseInt(this.quantityInput.value) > 999)
                    this.quantityInput.value = '999';
            }
            else {
                this.quantityInput.classList.remove('is-invalid');
            }
        });
        this.valueInput.addEventListener('input', () => FormService.formatCurrency(this.valueInput));
        this.limparBtn.addEventListener('click', () => {
            this.form.reset();
            this.productNameInput.classList.remove('is-invalid');
            this.quantityInput.classList.remove('is-invalid');
            this.valueInput.classList.remove('is-invalid');
        });
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        this.modalCancelBtn.addEventListener('click', () => {
            if (this.currentAction === 'add') {
                this.form.reset();
            }
            this.actionModal.hide();
        });
        this.modalConfirmBtn.addEventListener('click', () => this.handleModalConfirm());
        this.viewExtratoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.section1.classList.add('d-none');
            this.section2.classList.remove('d-none');
            this.section2.classList.add('vh-100');
        });
        this.newTransactionBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.section2.classList.add('d-none');
            this.section1.classList.remove('d-none');
            this.section1.classList.add('vh-100');
        });
        window.addEventListener('resize', () => this.handleWindowResize());
    }
    handleFormSubmit(e) {
        e.preventDefault();
        const productName = this.productNameInput.value.trim();
        const quantity = parseInt(this.quantityInput.value);
        const value = FormService.parseCurrency(this.valueInput.value);
        if (!FormService.validateForm(productName, quantity, value))
            return;
        this.currentAction = 'add';
        this.modalIcon.src = './assets/positivo.svg';
        this.modalTitle.textContent = 'Confirma a adição do produto?';
        this.modalItemElement.textContent = productName;
        this.modalQuantityElement.textContent = quantity.toString();
        this.modalValueElement.textContent = this.valueInput.value;
        this.modalConfirmBtn.textContent = 'Adicionar';
        this.actionModal.show();
    }
    handleModalConfirm() {
        if (this.currentAction === 'add') {
            const transaction = new Transaction(Date.now(), this.transactionTypeSelect.value, this.productNameInput.value.trim(), parseInt(this.quantityInput.value), FormService.parseCurrency(this.valueInput.value), new Date().toLocaleString());
            this.transactionService.addTransaction(transaction);
            this.form.reset();
            if (window.innerWidth < 992) {
                this.section1.classList.add('d-none');
                this.section2.classList.remove('d-none');
                this.section2.classList.add('vh-100');
            }
        }
        else if (this.currentAction === 'delete' && this.transactionToDelete) {
            this.transactionService.deleteTransaction(this.transactionToDelete.id);
        }
        this.updateUI();
        this.actionModal.hide();
    }
    renderTransactions() {
        UIService.renderTransactions(this.extratoBody, this.transactionService.getAllTransactions(), (id) => this.showDeleteConfirmation(id), window.innerWidth < 992);
    }
    showDeleteConfirmation(id) {
        const transaction = this.transactionService.getAllTransactions().find(t => t.id === id);
        if (transaction) {
            this.transactionToDelete = transaction;
            this.currentAction = 'delete';
            this.modalIcon.src = './assets/negativo.svg';
            this.modalTitle.textContent = 'Confirma a exclusão do produto?';
            this.modalItemElement.textContent = transaction.productName;
            this.modalQuantityElement.textContent = transaction.quantity.toString();
            this.modalValueElement.textContent = UIService.formatCurrencyValue(transaction.value * transaction.quantity);
            this.modalConfirmBtn.textContent = 'Excluir';
            this.actionModal.show();
        }
    }
    updateUI() {
        this.renderTransactions();
        UIService.updateBalanceUI(this.balanceElement, this.transactionService.getBalance());
        this.totalValueElement.textContent = `R$ ${UIService.formatCurrencyValue(Math.abs(this.transactionService.getTotalValue()))}`;
    }
    handleWindowResize() {
        if (window.innerWidth >= 992) {
            this.section1.classList.remove('d-none', 'vh-100');
            this.section2.classList.remove('d-none', 'vh-100');
            this.section1.classList.add('d-lg-flex');
            this.section2.classList.add('d-lg-flex');
        }
        else {
            if (!this.section1.classList.contains('d-none')) {
                this.section1.classList.add('vh-100');
                this.section2.classList.add('d-none');
            }
            else {
                this.section2.classList.add('vh-100');
                this.section1.classList.add('d-none');
            }
        }
        this.updateUI();
    }
}
document.addEventListener("DOMContentLoaded", () => {
    new App();
});
