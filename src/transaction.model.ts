export class Transaction {
    constructor(
        public id: number,
        public type: string,
        public productName: string,
        public quantity: number,
        public value: number,
        public date: string
    ) {}
}