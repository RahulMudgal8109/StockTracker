const apiKey = 'PTO8Q1BhCGwhabCPedqLnE8n0hCOx3vz'; // Replace with your actual API key
//const apiKey = 'YOUR_ALPHA_VANTAGE_API_KEY'; // Replace with your actual API key
const stockDropdown = document.getElementById('stockDropdown');
const stockInput = document.getElementById('stockInput');
const searchButton = document.getElementById('searchButton');
const stockInfoDiv = document.getElementById('stockInfo');
const stockChartCtx = document.getElementById('stockChart').getContext('2d');
const comparisonTableDiv = document.getElementById('comparisonTable');

let stockChart;
let selectedStocks = []; // Array to hold selected stock symbols and their data

// Fetch trending stocks (example static list)
async function fetchTrendingStocks() {
    const trendingStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
    trendingStocks.forEach(stock => {
        const option = document.createElement('option');
        option.value = stock;
        option.textContent = stock;
        stockDropdown.appendChild(option);
    });
}

// Fetch stock data from Alpha Vantage API
async function fetchStockData(symbol) {
    const response = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`);
    const data = await response.json();
    
    // Check for errors in API response
    if (data['Note'] || data['Error Message']) {
        stockInfoDiv.innerHTML = '<p>Error fetching data. Please check the stock symbol.</p>';
        return;
    }

    displayStockData(data, symbol);
    displayStockChart(data);
}

// Display stock information
function displayStockData(data, symbol) {
    const latestDate = Object.keys(data['Time Series (Daily)'])[0];
    const stockData = data['Time Series (Daily)'][latestDate];

    stockInfoDiv.innerHTML = `
        <h2>${symbol.toUpperCase()} - ${latestDate}</h2>
        <p>Open: ${stockData['1. open']}</p>
        <p>Close: ${stockData['4. close']}</p>
        <p>High: ${stockData['2. high']}</p>
        <p>Low: ${stockData['3. low']}</p>
        <p>Volume: ${stockData['5. volume']}</p>
    `;
}

// Display stock price trend in a chart
function displayStockChart(data) {
    const dates = Object.keys(data['Time Series (Daily)']).slice(0, 10);
    const closingPrices = dates.map(date => parseFloat(data['Time Series (Daily)'][date]['4. close']));

    // Destroy the existing chart if it exists
    if (stockChart) {
        stockChart.destroy();
    }

    stockChart = new Chart(stockChartCtx, {
        type: 'line',
        data: {
            labels: dates.reverse(),
            datasets: [{
                label: 'Closing Price',
                data: closingPrices.reverse(),
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

// Add selected stock to comparison table
async function addToComparisonTable(symbol) {
    const response = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`);
    const data = await response.json();

    if (data['Note'] || data['Error Message']) {
        return; // Skip if there's an error
    }

    const latestDate = Object.keys(data['Time Series (Daily)'])[0];
    const stockData = data['Time Series (Daily)'][latestDate];
    const previousClose = Object.values(data['Time Series (Daily)'])[1]['4. close']; // Close of the previous day
    const priceChange = (stockData['4. close'] - previousClose).toFixed(2); // Calculate change

    const row = `
        <tr>
            <td>${symbol.toUpperCase()}</td>
            <td>${stockData['4. close']}</td>
            <td>${priceChange}</td>
            <td>${stockData['5. volume']}</td>
            <td><button class="removeStock" data-symbol="${symbol}">Remove</button></td>
        </tr>
       
    `;

    comparisonTableDiv.querySelector('table tbody').insertAdjacentHTML('beforeend', row);
}

// Update the comparison table display
function updateComparisonTable() {
    comparisonTableDiv.innerHTML = `
        <h3>Comparison Table</h3>
        <table>
            <thead>
                <tr>
                    <th>Stock</th>
                    <th>Price</th>
                    <th>Change</th>
                    <th>Volume</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    `;
}

// Event listeners for button and dropdown
searchButton.addEventListener('click', async () => {
    const stockSymbol = stockInput.value.toUpperCase();
    if (stockSymbol && !selectedStocks.includes(stockSymbol)) {
        await fetchStockData(stockSymbol);
        selectedStocks.push(stockSymbol);
        await addToComparisonTable(stockSymbol);
    }
});

stockDropdown.addEventListener('change', async () => {
    const selectedStock = stockDropdown.value;
    if (selectedStock && !selectedStocks.includes(selectedStock)) {
        await fetchStockData(selectedStock);
        selectedStocks.push(selectedStock);
        await addToComparisonTable(selectedStock);
    }
});

// Event delegation for removing stocks from comparison table
comparisonTableDiv.addEventListener('click', (event) => {
    if (event.target.classList.contains('removeStock')) {
        const stockSymbol = event.target.getAttribute('data-symbol');
        selectedStocks = selectedStocks.filter(stock => stock !== stockSymbol);
        event.target.closest('tr').remove(); // Remove the row from the table
    }
});

// Initialize the dashboard
fetchTrendingStocks();
fetchStockData("aapl")
updateComparisonTable(); // Create the table structure on load