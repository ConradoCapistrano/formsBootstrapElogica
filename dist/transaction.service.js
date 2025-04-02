export class TransactionService {
    constructor() {
        this.transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        this.balance = parseFloat(localStorage.getItem('balance') || '0');
    }
    getAllTransactions() {
        return this.transactions;
    }
    addTransaction(transaction) {
        this.transactions.push(transaction);
        this.updateBalanceAfterTransaction(transaction);
        this.saveToLocalStorage();
    }
    deleteTransaction(id) {
        const transaction = this.transactions.find(t => t.id === id);
        if (transaction) {
            this.updateBalanceAfterDelete(transaction);
            this.transactions = this.transactions.filter(t => t.id !== id);
            this.saveToLocalStorage();
        }
    }
    getBalance() {
        return this.balance;
    }
    getTotalValue() {
        return this.transactions.reduce((sum, t) => {
            const value = t.value * t.quantity;
            return t.type === 'Compra' ? sum - value : sum + value;
        }, 0);
    }
    updateBalanceAfterTransaction(transaction) {
        if (transaction.type === 'Compra') {
            this.balance -= transaction.value * transaction.quantity;
        }
        else {
            this.balance += transaction.value * transaction.quantity;
        }
    }
    updateBalanceAfterDelete(transaction) {
        if (transaction.type === 'Compra') {
            this.balance += transaction.value * transaction.quantity;
        }
        else {
            this.balance -= transaction.value * transaction.quantity;
        }
    }
    saveToLocalStorage() {
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
        localStorage.setItem('balance', this.balance.toString());
    }
}
