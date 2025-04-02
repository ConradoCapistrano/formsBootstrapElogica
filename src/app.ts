import { Transaction } from './transaction.model';
import { TransactionService } from './transaction.service';
import { FormService } from './form.service';
import { UIService } from './ui.service';
import * as bootstrap from 'bootstrap';

class App {
    private transactionService: TransactionService;
    
    private form: HTMLFormElement;
    private productNameInput: HTMLInputElement;
    private quantityInput: HTMLInputElement;
    private valueInput: HTMLInputElement;
    private transactionTypeSelect: HTMLSelectElement;
    private limparBtn: HTMLButtonElement;

    private actionModal: bootstrap.Modal;
    private modalIcon: HTMLImageElement;
    private modalTitle: HTMLElement;
    private modalItemElement: HTMLElement;
    private modalQuantityElement: HTMLElement;
    private modalValueElement: HTMLElement;
    private modalCancelBtn: HTMLButtonElement;
    private modalConfirmBtn: HTMLButtonElement;

    private extratoBody: HTMLElement;
    private balanceElement: HTMLElement;
    private totalValueElement: HTMLElement;

    private viewExtratoBtn: HTMLButtonElement;
    private newTransactionBtn: HTMLButtonElement;

    private section1: HTMLElement;
    private section2: HTMLElement;

    private currentAction: string | null = null;
    private transactionToDelete: Transaction | null = null;

    constructor() {
        this.transactionService = new TransactionService();
        
        this.form = document.getElementById('transactionForm') as HTMLFormElement;
        this.productNameInput = document.getElementById('productName') as HTMLInputElement;
        this.quantityInput = document.getElementById('quantity') as HTMLInputElement;
        this.valueInput = document.getElementById('value') as HTMLInputElement;
        this.transactionTypeSelect = document.getElementById('transactionType') as HTMLSelectElement;
        this.limparBtn = document.getElementById('limparBtn') as HTMLButtonElement;

        this.actionModal = new bootstrap.Modal(document.getElementById('actionModal') as HTMLElement);
        this.modalIcon = document.getElementById('modalIcon') as HTMLImageElement;
        this.modalTitle = document.getElementById('actionModalLabel') as HTMLElement;
        this.modalItemElement = document.getElementById('modalItem') as HTMLElement;
        this.modalQuantityElement = document.getElementById('modalQuantity') as HTMLElement;
        this.modalValueElement = document.getElementById('modalValue') as HTMLElement;
        this.modalCancelBtn = document.getElementById('modalCancelBtn') as HTMLButtonElement;
        this.modalConfirmBtn = document.getElementById('modalConfirmBtn') as HTMLButtonElement;

        this.extratoBody = document.getElementById('extratoBody') as HTMLElement;
        this.balanceElement = document.getElementById('balance') as HTMLElement;
        this.totalValueElement = document.getElementById('totalValue') as HTMLElement;

        this.viewExtratoBtn = document.getElementById('viewExtratoBtn') as HTMLButtonElement;
        this.newTransactionBtn = document.getElementById('newTransactionBtn') as HTMLButtonElement;

        this.section1 = document.getElementById('section1') as HTMLElement;
        this.section2 = document.getElementById('section2') as HTMLElement;

        this.initApp();
        this.setupEventListeners();
    }

    private initApp(): void {
        this.updateUI();
        if (this.transactionService.getAllTransactions().length > 0) {
            this.renderTransactions();
        }
        if (window.innerWidth < 992) {
            this.section1.classList.remove('d-none');
            this.section2.classList.add('d-none');
        }
    }

    private setupEventListeners(): void {
        this.productNameInput.addEventListener('input', () => {
            this.productNameInput.value = this.productNameInput.value.trim();
            this.productNameInput.classList.toggle('is-invalid', this.productNameInput.value.length > 35);
        });

        this.quantityInput.addEventListener('input', () => {
            this.quantityInput.value = this.quantityInput.value.replace(/[^0-9]/g, '');
            if (this.quantityInput.value === '0' || this.quantityInput.value === '' || parseInt(this.quantityInput.value) > 999) {
                this.quantityInput.classList.add('is-invalid');
                if (parseInt(this.quantityInput.value) > 999) this.quantityInput.value = '999';
            } else {
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

    private handleFormSubmit(e: Event): void {
        e.preventDefault();

        const productName = this.productNameInput.value.trim();
        const quantity = parseInt(this.quantityInput.value);
        const value = FormService.parseCurrency(this.valueInput.value);

        if (!FormService.validateForm(productName, quantity, value)) return;

        this.currentAction = 'add';
        this.modalIcon.src = './assets/positivo.svg';
        this.modalTitle.textContent = 'Confirma a adição do produto?';
        this.modalItemElement.textContent = productName;
        this.modalQuantityElement.textContent = quantity.toString();
        this.modalValueElement.textContent = this.valueInput.value;
        this.modalConfirmBtn.textContent = 'Adicionar';
        this.actionModal.show();
    }

    private handleModalConfirm(): void {
        if (this.currentAction === 'add') {
            const transaction = new Transaction(
                Date.now(),
                this.transactionTypeSelect.value,
                this.productNameInput.value.trim(),
                parseInt(this.quantityInput.value),
                FormService.parseCurrency(this.valueInput.value),
                new Date().toLocaleString()
            );
            this.transactionService.addTransaction(transaction);
            this.form.reset();
            if (window.innerWidth < 992) {
                this.section1.classList.add('d-none');
                this.section2.classList.remove('d-none');
                this.section2.classList.add('vh-100');
            }
        } else if (this.currentAction === 'delete' && this.transactionToDelete) {
            this.transactionService.deleteTransaction(this.transactionToDelete.id);
        }
        this.updateUI();
        this.actionModal.hide();
    }

    private renderTransactions(): void {
        UIService.renderTransactions(
            this.extratoBody,
            this.transactionService.getAllTransactions(),
            (id) => this.showDeleteConfirmation(id),
            window.innerWidth < 992
        );
    }

    private showDeleteConfirmation(id: number): void {
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

    private updateUI(): void {
        this.renderTransactions();
        UIService.updateBalanceUI(this.balanceElement, this.transactionService.getBalance());
        this.totalValueElement.textContent = `R$ ${UIService.formatCurrencyValue(Math.abs(this.transactionService.getTotalValue()))}`;
    }

    private handleWindowResize(): void {
        if (window.innerWidth >= 992) {
            this.section1.classList.remove('d-none', 'vh-100');
            this.section2.classList.remove('d-none', 'vh-100');
            this.section1.classList.add('d-lg-flex');
            this.section2.classList.add('d-lg-flex');
        } else {
            if (!this.section1.classList.contains('d-none')) {
                this.section1.classList.add('vh-100');
                this.section2.classList.add('d-none');
            } else {
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