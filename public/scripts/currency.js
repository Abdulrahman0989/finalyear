class CurrencyConverter {
    static async getExchangeRates() {
        try {
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            const data = await response.json();
            return data.rates;
        } catch (error) {
            console.error('Error fetching exchange rates:', error);
            return null;
        }
    }

    static async convertAmount(amount, fromCurrency, toCurrency) {
        const rates = await this.getExchangeRates();
        if (!rates) return null;

        const fromRate = rates[fromCurrency];
        const toRate = rates[toCurrency];
        return (amount / fromRate) * toRate;
    }

    static createConverterElement() {
        const converter = document.createElement('div');
        converter.className = 'currency-converter';
        converter.innerHTML = `
            <div class="converter-inputs">
                <input type="number" class="amount-input" value="1" min="0" step="0.01">
                <select class="from-currency">
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="JPY">JPY</option>
                    <option value="AUD">AUD</option>
                    <option value="CAD">CAD</option>
                    <option value="CHF">CHF</option>
                    <option value="CNY">CNY</option>
                    <option value="INR">INR</option>
                    <option value="BRL">BRL</option>
                </select>
                <span class="converter-arrow">→</span>
                <select class="to-currency">
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                    <option value="JPY">JPY</option>
                    <option value="AUD">AUD</option>
                    <option value="CAD">CAD</option>
                    <option value="CHF">CHF</option>
                    <option value="CNY">CNY</option>
                    <option value="INR">INR</option>
                    <option value="BRL">BRL</option>
                </select>
                <input type="number" class="result-input" readonly>
            </div>
            <div class="converter-info">
                <span class="exchange-rate"></span>
                <span class="last-updated"></span>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .currency-converter {
                background: white;
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                margin: 10px 0;
            }
            .converter-inputs {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 10px;
            }
            .converter-inputs input,
            .converter-inputs select {
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
            }
            .converter-arrow {
                color: #6a11cb;
                font-weight: bold;
            }
            .converter-info {
                font-size: 12px;
                color: #666;
                display: flex;
                justify-content: space-between;
            }
            .result-input {
                background: #f8f9fa;
            }
        `;
        document.head.appendChild(style);

        // Add event listeners
        const amountInput = converter.querySelector('.amount-input');
        const fromCurrency = converter.querySelector('.from-currency');
        const toCurrency = converter.querySelector('.to-currency');
        const resultInput = converter.querySelector('.result-input');
        const exchangeRate = converter.querySelector('.exchange-rate');
        const lastUpdated = converter.querySelector('.last-updated');

        const updateConversion = async () => {
            try {
                const amount = parseFloat(amountInput.value);
                const from = fromCurrency.value;
                const to = toCurrency.value;
                
                if (isNaN(amount) || amount < 0) return;

                const converted = await CurrencyConverter.convertAmount(amount, from, to);
                if (converted !== null) {
                    resultInput.value = converted.toFixed(2);
                    
                    const rate = await CurrencyConverter.convertAmount(1, from, to);
                    exchangeRate.textContent = `1 ${from} = ${rate.toFixed(4)} ${to}`;
                    lastUpdated.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
                }
            } catch (error) {
                console.error('Conversion error:', error);
            }
        };

        amountInput.addEventListener('input', updateConversion);
        fromCurrency.addEventListener('change', updateConversion);
        toCurrency.addEventListener('change', updateConversion);

        // Initial conversion
        updateConversion();

        return converter;
    }
}

// Make the converter available globally
window.CurrencyConverter = CurrencyConverter;