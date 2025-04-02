export class FormService {
    static formatCurrency(input) {
        let value = input.value.replace(/\D/g, '');
        value = value.replace(/^0+/, '') || '0';
        while (value.length < 3)
            value = '0' + value;
        const formattedValue = (value.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, '.')) + ',' + value.slice(-2);
        input.value = formattedValue;
        input.classList.toggle('is-invalid', parseFloat(value) === 0);
    }
    static parseCurrency(value) {
        return parseFloat(value.replace(/\./g, '').replace(',', '.'));
    }
    static validateForm(productName, quantity, value) {
        let isValid = true;
        if (!productName || productName.length > 35) {
            isValid = false;
        }
        if (isNaN(quantity) || quantity <= 0 || quantity > 999) {
            isValid = false;
        }
        if (isNaN(value) || value <= 0) {
            isValid = false;
        }
        return isValid;
    }
}
