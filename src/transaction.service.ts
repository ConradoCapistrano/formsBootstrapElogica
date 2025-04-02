import { Transaction } from './transaction.model';

export class TransactionService {
    private transactions: Transaction[] = JSON.parse(localStorage.getItem('transactions') || '[]');
    private balance: number = parseFloat(localStorage.getItem('balance') || '0');

    getAllTransactions(): Transaction[] {
        return this.transactions;
    }

    addTransaction(transaction: Transaction): void {
        this.transactions.push(transaction);
        this.updateBalanceAfterTransaction(transaction);
        this.saveToLocalStorage();
    }

    deleteTransaction(id: number): void {
        const transaction = this.transactions.find(t => t.id === id);
        if (transaction) {
            this.updateBalanceAfterDelete(transaction);
            this.transactions = this.transactions.filter(t => t.id !== id);
            this.saveToLocalStorage();
        }
    }

    getBalance(): number {
        return this.balance;
    }

    getTotalValue(): number {
        return this.transactions.reduce((sum, t) => {
            const value = t.value * t.quantity;
            return t.type === 'Compra' ? sum - value : sum + value;
        }, 0);
    }

    private updateBalanceAfterTransaction(transaction: Transaction): void {
        if (transaction.type === 'Compra') {
            this.balance -= transaction.value * transaction.quantity;
        } else {
            this.balance += transaction.value * transaction.quantity;
        }
    }

    private updateBalanceAfterDelete(transaction: Transaction): void {
        if (transaction.type === 'Compra') {
            this.balance += transaction.value * transaction.quantity;
        } else {
            this.balance -= transaction.value * transaction.quantity;
        }
    }

    private saveToLocalStorage(): void {
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
        localStorage.setItem('balance', this.balance.toString());
    }
}