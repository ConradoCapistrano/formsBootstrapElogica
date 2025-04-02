import { Transaction } from './transaction.model';

export class UIService {
    static formatCurrencyValue(value: number): string {
        return value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    static updateBalanceUI(balanceElement: HTMLElement, balance: number): void {
        balanceElement.textContent = `R$ ${this.formatCurrencyValue(balance)}`;
        balanceElement.classList.remove('text-success', 'text-danger', 'text-primary');
        if (balance > 0) balanceElement.classList.add('text-success');
        else if (balance < 0) balanceElement.classList.add('text-danger');
        else balanceElement.classList.add('text-primary');
    }

    static renderTransactions(
        extratoBody: HTMLElement, 
        transactions: Transaction[], 
        deleteHandler: (id: number) => void,
        isMobile: boolean
    ): void {
        extratoBody.innerHTML = '';
        transactions.forEach(transaction => {
            const row = document.createElement('tr');
            const sign = transaction.type === 'Compra' ? '-' : '+';
            const valueFormatted = this.formatCurrencyValue(transaction.value * transaction.quantity);
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
                deleteHandler(id);
            });
        });

        if (isMobile) {
            document.querySelectorAll('#extratoBody tr').forEach(row => {
                row.addEventListener('click', (e) => {
                    if ((e.target as HTMLElement).closest('.delete-btn')) return;
                    const id = parseInt((row as HTMLElement).dataset.id || '0');
                    deleteHandler(id);
                });
            });
        }
    }
}