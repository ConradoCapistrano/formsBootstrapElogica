export class Transaction {
    constructor(id, type, productName, quantity, value, date) {
        this.id = id;
        this.type = type;
        this.productName = productName;
        this.quantity = quantity;
        this.value = value;
        this.date = date;
    }
}
