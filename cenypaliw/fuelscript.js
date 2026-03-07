let originalPrices = {};
let priceHistoryChart = null;
let lastWeekPrices = {};

// Product icons
const productIcons = {
    'Pb95': 'https://www.kacpiq.pl/img/efecta95.png',
    'Pb98': 'https://www.kacpiq.pl/img/verva98.png',
    'LPG': 'https://www.kacpiq.pl/img/lpg.png',
    'ONEkodiesel': 'https://www.kacpiq.pl/img/efectadiesel.png',
    'ONArctic2': 'https://www.kacpiq.pl/img/vervadiesel.png'
};

// Stan aplikacji
const STATE = {
    forecastData: null
};

// Initialize particles.js
particlesJS("particles-js", {
    particles: {
        number: { value: 80, density: { enable: true, value_area: 800 } },
        color: { value: "#E30613" },
        shape: { type: "circle" },
        opacity: { value: 0.5, random: true },
        size: { value: 3, random: true },
        line_linked: { enable: true, distance: 150, color: "#E30613", opacity: 0.4, width: 1 },
        move: { enable: true, speed: 2, direction: "none", random: true, straight: false, out_mode: "out" }
    },
    interactivity: {
        detect_on: "canvas",
        events: {
            onhover: { enable: true, mode: "repulse" },
            onclick: { enable: true, mode: "push" }
        }
    }
});

async function fetchLastData() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const year = yesterday.getFullYear();

    const productIds = {
        'Pb95': 41,
        'Pb98': 42,
        'ONEkodiesel': 43,
        'ONArctic2': 44
    };

    const taxes = {
        'Pb95': 1.26,
        'Pb98': 1.32,
        'ONEkodiesel': 1.26,
        'ONArctic2': 1.26,
        'LPG': 1.26
    };

    lastWeekPrices = {};

    // Pobierz ceny hurtowe
    await Promise.all(Object.entries(productIds).map(async ([productName, productId]) => {
        const url = `https://corsproxy.io/?https://tool.orlen.pl/api/wholesalefuelprices/ByProduct?productId=${productId}&from=${year}-01-01&to=${year}-12-31`;

        try {
            const res = await fetch(url);
            const data = await res.json();
            if (data && data.length > 1) {
                const rawValue = data[1].value;
                const netto = rawValue / 1000;
                const brutto = (netto * taxes[productName]).toFixed(2);
                lastWeekPrices[productName] = parseFloat(brutto);
                console.log(`${productName}: ${brutto}`);
            } else {
                console.warn(`Brak danych dla ${productName}`);
            }
        } catch (err) {
            console.error(`Błąd dla ${productName}:`, err);
        }
    }));

    // Pobierz LPG
    try {
        const res = await fetch(`https://corsproxy.io/?https://tool.orlen.pl/api/autogasprices/Dates?year=${year}`);
        const dates = await res.json();
        if (dates.length >= 2) {
            const targetDate = dates[1];
            const lpgRes = await fetch(`https://corsproxy.io/?https://tool.orlen.pl/api/autogasprices/ByDate?date=${targetDate}`);
            const lpgData = await lpgRes.json();

            const malopolska = lpgData.find(entry =>
                entry.locationName.toLowerCase() === "małopolskie"
            );

            if (malopolska && malopolska.value) {
                const brutto = parseFloat((malopolska.value * taxes['LPG']).toFixed(2));
                lastWeekPrices['LPG'] = brutto;
                console.log(`LPG (małopolskie): ${brutto}`);
            } else {
                console.warn("Brak LPG dla Małopolskiego");
            }
        }
    } catch (err) {
        console.error("Błąd pobierania LPG:", err);
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    // Initialize theme
    loadThemeFromLocalStorage();

    // Show info modal if not acknowledged
    if (localStorage.getItem('infoModalAcknowledged') !== 'true') {
        setTimeout(showInfoModal, 1500);
    }

    // Check if mobile device
    if (isMobileDevice()) {
        showNotification("Strona może nie wyświetlać się optymalnie na urządzeniach mobilnych");
    }

    // Poczekaj na ceny
    await fetchLastData();

    // Teraz bezpiecznie odpal resztę
    fetchData();
    initializeYearSelector();
    
    // Analiza trendów
    setTimeout(() => {
        analyzeMultiFuelTrends();
    }, 2000);
});

// Initialize year selector for history
function initializeYearSelector() {
    const yearSelect = document.getElementById('year');
    const currentYear = new Date().getFullYear();
    
    for (let year = currentYear; year >= 2004; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }
}

// Fetch fuel data
function fetchData() {
    showLoading();
    
    // Fetch fuel prices
    fetch('https://cenypaliw.kacpiq.workers.dev/')
        .then(response => response.json())
        .then(data => {
            processFuelData(data);
            setTimeout(fetchLPGData, 1000);
        })
        .catch(error => {
            console.error('Error fetching fuel data:', error);
            displayError("Wystąpił błąd podczas pobierania danych paliw");
            hideLoading();
        });
}

// Process fuel data
function processFuelData(data) {
    const publishFrom = data[0]?.publishFrom?.replace('T00:00:00', '') || 'brak danych';
    document.getElementById('updateInfo').textContent = `Ostatnia aktualizacja: ${publishFrom}`;
    
    const filteredData = data.filter(item => 
        item.productName === 'Pb95' || 
        item.productName === 'ONEkodiesel' ||
        item.productName === 'Pb98' || 
        item.productName === 'ONArctic2'
    ).map(item => {
        let taxRate = 0.26;
        if (item.productName === 'Pb98') taxRate = 0.32;
        
        const currentPrice = (item.value / 1000) * (1 + taxRate);
        const priceChange = calculatePriceChange(item.productName, currentPrice);
        
        return {
            productName: item.productName,
            valueWithTax: currentPrice.toFixed(2),
            valueWithoutTax: (item.value / 1000).toFixed(2),
            priceChange: priceChange
        };
    });
    
    renderFuelCards(filteredData);
    processForecastData();
}

// Calculate price change compared to last week
function calculatePriceChange(productName, currentPrice) {
    if (!lastWeekPrices[productName]) return 0;
    
    const change = ((currentPrice - lastWeekPrices[productName]) / lastWeekPrices[productName]) * 100;
    return parseFloat(change.toFixed(1));
}

// Fetch LPG data
function fetchLPGData() {
    fetch('https://cenypaliw-lpg.kacpiq.workers.dev/')
        .then(response => response.json())
        .then(data => {
            if (Array.isArray(data)) {
                const małopolskieData = data.find(entry => entry.locationName.toLowerCase() === 'małopolskie');
                if (małopolskieData) {
                    console.log(małopolskieData.value)
                    const currentPrice = małopolskieData.value * 1.26;
                    const priceChange = calculatePriceChange('LPG', currentPrice);
                    
                    const lpgData = {
                        productName: 'LPG',
                        valueWithTax: currentPrice.toFixed(2),
                        valueWithoutTax: małopolskieData.value.toFixed(2),
                        priceChange: priceChange
                    };
                    
                    // Add LPG to fuel cards
                    const fuelGrid = document.getElementById('fuelGrid');
                    fuelGrid.appendChild(createFuelCard(lpgData));
                }
            }
            hideLoading();
        })
        .catch(error => {
            console.error('Error fetching LPG data:', error);
            hideLoading();
        });
}

// Create fuel card element
function createFuelCard(fuelData) {
    const card = document.createElement('div');
    card.className = 'fuel-card animate-up';
    card.id = `fuel-card-${fuelData.productName}`;
    
    // Determine price change style
    let priceChangeClass = 'price-neutral';
    let priceChangeIcon = 'bx-minus';
    
    if (fuelData.priceChange > 0) {
        priceChangeClass = 'price-up';
        priceChangeIcon = 'bx-up-arrow-alt';
    } else if (fuelData.priceChange < 0) {
        priceChangeClass = 'price-down';
        priceChangeIcon = 'bx-down-arrow-alt';
    }
    
    card.innerHTML = `
        <div class="fuel-header">
            <img src="${productIcons[fuelData.productName]}" alt="${fuelData.productName}" class="fuel-icon">
            <div class="fuel-name">${getFuelDisplayName(fuelData.productName)}</div>
        </div>
        <div class="fuel-price">
            ${fuelData.valueWithTax} PLN
            <span class="price-change ${priceChangeClass}">
                <i class='bx ${priceChangeIcon}'></i> ${Math.abs(fuelData.priceChange)}%
            </span>
        </div>
        <div class="fuel-price-wholesale">Cena hurtowa: ${fuelData.valueWithoutTax} PLN</div>
    `;
    
    // Store original price
    originalPrices[fuelData.productName] = fuelData.valueWithTax;
    
    return card;
}

// Render fuel cards
function renderFuelCards(fuelData) {
    const fuelGrid = document.getElementById('fuelGrid');
    fuelGrid.innerHTML = '';
    
    fuelData.forEach(data => {
        fuelGrid.appendChild(createFuelCard(data));
    });
}

// Process forecast data
function processForecastData() {
    const forecastData = [
        { productName: 'Pb95', minPrice: 5.76, maxPrice: 5.89 },
        { productName: 'Pb98', minPrice: 6.52, maxPrice: 6.67 },
        { productName: 'ONEkodiesel', minPrice: 5.85, maxPrice: 5.99 },
        { productName: 'ONArctic2', minPrice: 6.05, maxPrice: 6.25 },
        { productName: 'LPG', minPrice: 3.02, maxPrice: 3.09 }
    ];
    
    const forecastGrid = document.getElementById('forecastGrid');
    forecastGrid.innerHTML = '';
    
    forecastData.forEach(data => {
        const card = document.createElement('div');
        card.className = 'fuel-card animate-up';
        
        card.innerHTML = `
            <div class="fuel-header">
                <img src="${productIcons[data.productName]}" alt="${data.productName}" class="fuel-icon">
                <div class="fuel-name">${getFuelDisplayName(data.productName)}</div>
            </div>
            <div class="fuel-price">${data.minPrice.toFixed(2)} - ${data.maxPrice.toFixed(2)} PLN</div>
            <div class="fuel-price-wholesale">Prognozowany zakres cen</div>
        `;
        
        forecastGrid.appendChild(card);
    });
}

// Get fuel display name
function getFuelDisplayName(productName) {
    const names = {
        'Pb95': 'EFECTA 95',
        'Pb98': 'VERVA 98',
        'LPG': 'LPG',
        'ONEkodiesel': 'EFECTA DIESEL',
        'ONArctic2': 'VERVA DIESEL'
    };
    return names[productName] || productName;
}

// Show coupon modal
function showCouponModal() {
    document.getElementById('couponModal').style.display = 'block';
    setTimeout(() => {
        document.getElementById('couponModal').classList.add('show');
    }, 10);
}

// Close coupon modal
function closeCouponModal() {
    document.getElementById('couponModal').classList.remove('show');
    setTimeout(() => {
        document.getElementById('couponModal').style.display = 'none';
    }, 300);
}

// Apply coupon
function applyCoupon() {
    const couponValue = parseFloat(document.getElementById('couponSelect').value);
    const messageElement = document.getElementById('couponMessage');
    const expiryElement = document.getElementById('couponExpiry');
    
    if (couponValue === 0) {
        // Remove coupon
        Object.keys(originalPrices).forEach(productName => {
            const card = document.getElementById(`fuel-card-${productName}`);
            if (card && !card.querySelector('.fuel-name').textContent.includes('LPG')) {
                const priceElement = card.querySelector('.fuel-price');
                if (priceElement) {
                    priceElement.innerHTML = priceElement.innerHTML.replace(/<span class="coupon-badge">.*?<\/span>/, '');
                    priceElement.innerHTML = priceElement.innerHTML.replace(`${originalPrices[productName]} PLN`, `${originalPrices[productName]} PLN`);
                }
            }
        });
        
        messageElement.innerHTML = '<i class="bx bx-check-circle"></i> Kupon został usunięty. Ceny przywrócone.';
        expiryElement.style.display = 'none';
    } else {
        // Apply coupon
        Object.keys(originalPrices).forEach(productName => {
            const card = document.getElementById(`fuel-card-${productName}`);
            if (card && !card.querySelector('.fuel-name').textContent.includes('LPG')) {
                const priceElement = card.querySelector('.fuel-price');
                if (priceElement) {
                    // Remove any existing coupon badge
                    priceElement.innerHTML = priceElement.innerHTML.replace(/<span class="coupon-badge">.*?<\/span>/, '');
                    
                    // Apply new price
                    const originalPrice = parseFloat(originalPrices[productName]);
                    const newPrice = (originalPrice + couponValue).toFixed(2);
                    
                    // Update price with animation
                    priceElement.innerHTML = priceElement.innerHTML.replace(
                        `${originalPrice.toFixed(2)} PLN`, 
                        `${newPrice} PLN<span class="coupon-badge">-${Math.abs(couponValue * 100)} gr</span>`
                    );
                    
                    // Add flash effect
                    priceElement.classList.add('price-flash');
                    setTimeout(() => {
                        priceElement.classList.remove('price-flash');
                    }, 2000);
                }
            }
        });
        
        messageElement.innerHTML = `<i class="bx bx-check-circle"></i> Kupon zastosowany! Obniżka <strong>${Math.abs(couponValue * 100)} gr/l</strong>`;
        expiryElement.style.display = 'flex';
        startCouponCountdown();
    }
}

// Start coupon countdown
function startCouponCountdown() {
    const couponExpiryDate = new Date('2025-04-31T23:59:59');
    const now = new Date();
    const timeLeft = couponExpiryDate - now;
    
    if (timeLeft <= 0) {
        document.getElementById('couponMessage').innerHTML = '<i class="bx bx-error-circle"></i> Kupon wygasł';
        return;
    }
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
    
    function updateCountdown() {
        const now = new Date();
        const timeLeft = couponExpiryDate - now;
        
        if (timeLeft <= 0) {
            document.getElementById('couponMessage').innerHTML = '<i class="bx bx-error-circle"></i> Kupon wygasł';
            return;
        }
        
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        document.getElementById('days').textContent = days.toString().padStart(2, '0');
        document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
    }
}

function showInfoModal() {
    if (localStorage.getItem('infoModalAcknowledged') !== 'true') {
        document.getElementById('infoModal').style.display = 'block';
        setTimeout(() => {
            document.getElementById('infoModal').classList.add('show');
        }, 10);
    }
}

function closeInfoModal() {
    document.getElementById('infoModal').classList.remove('show');
    setTimeout(() => {
        document.getElementById('infoModal').style.display = 'none';
    }, 300);
}

function closeInfoModalAndAcknowledge() {
    localStorage.setItem('infoModalAcknowledged', 'true');
    closeInfoModal();
}

// Toggle history modal
function toggleHistory() {
    document.getElementById('historyModal').style.display = 'block';
    setTimeout(() => {
        document.getElementById('historyModal').classList.add('show');
        fetchHistoryData();
    }, 10);
}

// Close history modal
function closeHistoryModal() {
    document.getElementById('historyModal').classList.remove('show');
    setTimeout(() => {
        document.getElementById('historyModal').style.display = 'none';
    }, 300);
}

// Fetch history data
function fetchHistoryData() {
    const loadingElement = document.getElementById('loadingHistory');
    const tableBody = document.getElementById('historyTableBody');
    
    loadingElement.style.display = 'block';
    tableBody.innerHTML = '';
    
    const fuelType = document.getElementById('fuelType').value;
    const selectedYear = document.getElementById('year').value;
    const productId = fuelType.split('-')[0];
    const viewOption = document.querySelector('input[name="dataView"]:checked').value;
    
    let taxRate = 0.26;
    if (productId === '42') taxRate = 0.32;
    
    const historyUrl = `https://corsproxy.io/?https://tool.orlen.pl/api/wholesalefuelprices/ByProduct?productId=${productId}&from=${selectedYear}-01-01&to=${selectedYear}-12-31`;
    
    fetch(historyUrl)
        .then(response => response.json())
        .then(data => {
            if (data.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="2">Brak danych dla wybranego okresu</td></tr>';
                return;
            }
            
            let minPrice = Infinity;
            let maxPrice = -Infinity;
            const processedData = [];
            
            // Process data based on view option
            if (viewOption === 'daily') {
                data.forEach(item => {
                    const date = item.effectiveDate.replace('T00:00:00', '');
                    const price = (item.value / 1000) * (1 + taxRate);
                    
                    if (price < minPrice) minPrice = price;
                    if (price > maxPrice) maxPrice = price;
                    
                    processedData.push({ date, price });
                });
            } else {
                // Monthly view
                const monthlyData = {};
                
                data.forEach(item => {
                    const month = item.effectiveDate.slice(0, 7);
                    if (!monthlyData[month]) monthlyData[month] = [];
                    monthlyData[month].push(item.value);
                });
                
                for (const [month, values] of Object.entries(monthlyData)) {
                    const avgPrice = (values.reduce((sum, val) => sum + val, 0) / values.length / 1000) * (1 + taxRate);
                    
                    if (avgPrice < minPrice) minPrice = avgPrice;
                    if (avgPrice > maxPrice) maxPrice = avgPrice;
                    
                    processedData.push({ date: month, price: avgPrice });
                }
            }
            
            // Render table rows
            processedData.forEach(item => {
                const row = document.createElement('tr');
                const priceClass = item.price === minPrice ? 'min-price' : item.price === maxPrice ? 'max-price' : '';
                
                row.innerHTML = `
                    <td>${item.date}</td>
                    <td class="${priceClass}">${item.price.toFixed(2)}</td>
                `;
                tableBody.appendChild(row);
            });
            
            loadingElement.style.display = 'none';
        })
        .catch(error => {
            console.error('Error fetching history data:', error);
            tableBody.innerHTML = '<tr><td colspan="2">Wystąpił błąd podczas pobierania danych</td></tr>';
            loadingElement.style.display = 'none';
        });
}

// Show price history chart
function showPriceHistoryChart() {
    if (priceHistoryChart) {
        priceHistoryChart.destroy();
    }
    
    const tableRows = document.querySelectorAll('#historyTableBody tr');
    const dates = [];
    const prices = [];
    
    tableRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length === 2) {
            dates.push(cells[0].textContent);
            prices.push(parseFloat(cells[1].textContent));
        }
    });
    
    if (dates.length === 0) {
        showNotification("Brak danych do wyświetlenia wykresu");
        return;
    }
    
    const ctx = document.getElementById('priceHistoryChart').getContext('2d');
    priceHistoryChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Cena paliwa (PLN)',
                data: prices,
                borderColor: 'rgba(227, 6, 19, 1)',
                backgroundColor: 'rgba(227, 6, 19, 0.1)',
                borderWidth: 2,
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Cena: ${context.parsed.y.toFixed(2)} PLN`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(2) + ' PLN';
                        }
                    }
                }
            }
        }
    });
    
    document.getElementById('priceHistoryModal').style.display = 'block';
    setTimeout(() => {
        document.getElementById('priceHistoryModal').classList.add('show');
    }, 10);
}

// Close price history modal
function closePriceHistoryModal() {
    document.getElementById('priceHistoryModal').classList.remove('show');
    setTimeout(() => {
        document.getElementById('priceHistoryModal').style.display = 'none';
    }, 300);
}

// Toggle theme
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark-theme' : 'light-theme');
}

// Load theme from local storage
function loadThemeFromLocalStorage() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark-theme') {
        document.body.classList.add('dark-theme');
    }
}

// Show loading
function showLoading() {
    document.getElementById('loading').style.display = 'flex';
    document.getElementById('container').style.display = 'none';
}

// Hide loading
function hideLoading() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('container').style.display = 'block';
}

// Show notification
function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.style.display = 'flex';
    notification.innerHTML = `<i class='bx bx-check'></i> ${message}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Check if mobile device
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Display error message
function displayError(message) {
    const container = document.getElementById('container');
    container.innerHTML = `
        <div class="alert alert-error animate">
            <i class='bx bx-error-circle'></i>
            <span>${message}</span>
        </div>
    `;
    container.style.display = 'block';
}

// ==================== ANALIZA TRENDÓW ====================
async function analyzeMultiFuelTrends() {
    const year = new Date().getFullYear();
    const fuelsToCheck = [
        { id: 41, name: 'Pb95', displayName: 'EFECTA 95' },
        { id: 43, name: 'ONEkodiesel', displayName: 'EFECTA DIESEL' },
        { id: 42, name: 'Pb98', displayName: 'VERVA 98' },
        { id: 44, name: 'ONArctic2', displayName: 'VERVA DIESEL' }
    ];

    try {
        let allChanges = [];
        let trendDetails = [];
        let globalChangeSum = 0;

        for (let fuel of fuelsToCheck) {
            try {
                const res = await fetch(`https://corsproxy.io/?https://tool.orlen.pl/api/wholesalefuelprices/ByProduct?productId=${fuel.id}&from=${year-1}-01-01&to=${year}-12-31`);
                const data = await res.json();
                
                if (data && data.length > 10) {
                    data.sort((a, b) => new Date(a.effectiveDate) - new Date(b.effectiveDate));
                    
                    const last30 = data.slice(-30);
                    
                    if (last30.length >= 14) {
                        const last7 = last30.slice(-7);
                        const avg7 = last7.reduce((sum, item) => sum + item.value, 0) / last7.length;
                        
                        const prev7 = last30.slice(-14, -7);
                        const avgPrev7 = prev7.reduce((sum, item) => sum + item.value, 0) / prev7.length;
                        
                        // Rzeczywista różnica w groszach
                        const diffGrosze = ((avg7 - avgPrev7) / 1000 * 100);
                        const diffValue = diffGrosze;
                        
                        allChanges.push(diffValue);
                        globalChangeSum += diffValue;
                        
                        let status = "Stabilnie";
                        let color = "text-blue-600";
                        let icon = "bx-minus";
                        let bgClass = "trend-stable";

                        if (diffValue > 3) { 
                            status = "Wzrost"; 
                            color = "text-red-600"; 
                            icon = "bx-trending-up";
                            bgClass = "trend-up";
                        } else if (diffValue < -3) { 
                            status = "Spadek"; 
                            color = "text-green-600"; 
                            icon = "bx-trending-down";
                            bgClass = "trend-down";
                        }

                        trendDetails.push({ 
                            name: fuel.displayName, 
                            status, 
                            color, 
                            icon, 
                            bgClass, 
                            diff: diffValue 
                        });
                    }
                }
            } catch (e) {
                console.error(`Błąd dla ${fuel.name}:`, e);
                // Symulowane dane tylko w przypadku błędu API
                const simDiff = (Math.random() * 30 - 15);
                allChanges.push(simDiff);
                globalChangeSum += simDiff;
                
                trendDetails.push({ 
                    name: fuel.displayName, 
                    status: simDiff > 3 ? "Wzrost" : (simDiff < -3 ? "Spadek" : "Stabilnie"),
                    color: simDiff > 3 ? "text-red-600" : (simDiff < -3 ? "text-green-600" : "text-blue-600"),
                    icon: simDiff > 3 ? "bx-trending-up" : (simDiff < -3 ? "bx-trending-down" : "bx-minus"),
                    bgClass: simDiff > 3 ? "trend-up" : (simDiff < -3 ? "trend-down" : "trend-stable"),
                    diff: simDiff
                });
            }
        }

        // Średnia zmiana
        const avgChange = allChanges.length > 0 ? globalChangeSum / allChanges.length : 0;
        
        // Prognoza na 7 dni
        let forecastGrosze = 0;
        let trendType = 'stable';
        
        if (avgChange > 2) {
            forecastGrosze = avgChange * 1.25;
            trendType = 'up';
        } else if (avgChange < -2) {
            forecastGrosze = avgChange * 1;
            trendType = 'down';
        } else {
            forecastGrosze = avgChange;
            trendType = 'stable';
        }

        const forecastText = forecastGrosze > 0 ? `+${forecastGrosze.toFixed(0)} gr` : forecastGrosze < 0 ? `${forecastGrosze.toFixed(0)} gr` : '0 gr';
        
        STATE.forecastData = {
            date: new Date().toISOString(),
            forecast: forecastText,
            value: forecastGrosze,
            type: trendType,
            details: trendDetails
        };
        
        updateForecastUI(avgChange, trendDetails, forecastText, trendType);

    } catch (e) {
        console.error("Trend Analysis Error:", e);
        document.getElementById('home-trend-title').innerHTML = "Błąd analizy <i class='bx bx-error-circle text-red-500'></i>";
        
        if (STATE.forecastData) {
            updateForecastUI(0, STATE.forecastData.details || [], STATE.forecastData.forecast, STATE.forecastData.type);
        } else {
            updateForecastUI(0, [], '0 gr', 'stable');
        }
    }
}

function updateForecastUI(globalDiff, details, forecastGrosze, trendType) {
    const widgetTitle = document.getElementById('home-trend-title');
    const widgetBadge = document.getElementById('home-trend-badge');
    const widgetBar = document.getElementById('home-trend-bar');
    const groszeSpan = document.getElementById('forecast-grosze-value');
    const groszeDetailed = document.getElementById('forecast-grosze-detailed-value');

    let mainStatusText = "";
    let mainColorClass = "";

    if (trendType === 'up') {
        mainStatusText = "Trend Wzrostowy";
        widgetBadge.innerText = "WZROST";
        widgetBadge.className = "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-black px-3 py-1.5 rounded-xl uppercase";
        widgetBar.className = "h-full bg-red-500 w-3/4 transition-all duration-1000 rounded-full";
        mainColorClass = "text-red-600 dark:text-red-400";
    } else if (trendType === 'down') {
        mainStatusText = "Trend Spadkowy";
        widgetBadge.innerText = "SPADEK";
        widgetBadge.className = "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 text-[10px] font-black px-3 py-1.5 rounded-xl uppercase";
        widgetBar.className = "h-full bg-green-500 w-1/4 transition-all duration-1000 rounded-full";
        mainColorClass = "text-green-600 dark:text-green-400";
    } else {
        mainStatusText = "Stabilizacja";
        widgetBadge.innerText = "STABILNIE";
        widgetBadge.className = "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] font-black px-3 py-1.5 rounded-xl uppercase";
        widgetBar.className = "h-full bg-blue-500 w-1/2 transition-all duration-1000 rounded-full";
        mainColorClass = "text-blue-600 dark:text-blue-400";
    }

    widgetTitle.innerHTML = `${mainStatusText} <i class='bx ${trendType === 'up' ? 'bx-trending-up' : (trendType === 'down' ? 'bx-trending-down' : 'bx-minus')} ${mainColorClass}'></i>`;
    
    groszeSpan.innerText = forecastGrosze;
    groszeDetailed.innerText = forecastGrosze;

    const heroBg = document.getElementById('forecast-hero-bg');
    const mainTitle = document.getElementById('forecast-main-title');
    const mainDesc = document.getElementById('forecast-main-desc');

    mainTitle.innerText = mainStatusText;
    // Przestajemy nadpisywać klasy Tailwindem! Używamy tylko naszej pancernej klasy CSS:
    mainTitle.className = "report-hero-title";

    let desc = `Analiza cen hurtowych dla wszystkich paliw wskazuje na ${mainStatusText.toLowerCase()}. `;
    if (trendType === 'up') {
        desc += `Obserwujemy presję cenową. W ciągu 7 dni ceny mogą wzrosnąć o ${forecastGrosze}.`;
        heroBg.className = "report-hero trend-up";
    } else if (trendType === 'down') {
        desc += `Dobre wieści! Rynek hurtowy notuje spadki. Przewidywana obniżka o ${forecastGrosze}.`;
        heroBg.className = "report-hero trend-down";
    } else {
        desc += `Sytuacja zrównoważona. Prognozowana zmiana: ${forecastGrosze}.`;
        heroBg.className = "report-hero trend-stable";
    }
    mainDesc.innerText = desc;

    // === 1. TWORZENIE LISTY PALIW ===
    const grid = document.getElementById('forecast-details-grid');
    grid.innerHTML = '';
    
    if (details.length > 0) {
        details.forEach(d => {
            const item = document.createElement('div');
            // Czysty, minimalny HTML. Całą magię robi teraz CSS.
            item.className = `report-detail-item`; 
            item.innerHTML = `
                <span>${d.name}</span>
                <span>${d.diff > 0 ? '+' : ''}${d.diff.toFixed(1)} gr</span>
            `;
            grid.appendChild(item);
        });
    } else {
        grid.innerHTML = '<p style="text-align: center; opacity: 0.5;">Brak danych szczegółowych</p>';
    }

    // === 2. REKOMENDACJA AI ===
    const recContainer = document.getElementById('forecast-recommendation');
    if (trendType === 'up') {
        recContainer.innerHTML = `
            <div style="font-size: 2rem; color: #E30613;"><i class='bx bxs-gas-pump'></i></div>
            <div>
                <p style="font-weight: 800; font-size: 1.1rem; margin-bottom: 0.2rem !important;">Zatankuj dzisiaj</p>
                <p style="font-size: 0.9rem; opacity: 0.8;">Przewidywane podwyżki o ${forecastGrosze} w ciągu tygodnia.</p>
            </div>
        `;
    } else if (trendType === 'down') {
        recContainer.innerHTML = `
            <div style="font-size: 2rem; color: #4CAF50;"><i class='bx bx-time-five'></i></div>
            <div>
                <p style="font-weight: 800; font-size: 1.1rem; margin-bottom: 0.2rem !important;">Wstrzymaj się</p>
                <p style="font-size: 0.9rem; opacity: 0.8;">Ceny mogą spaść o ${forecastGrosze} w ciągu tygodnia.</p>
            </div>
        `;
    } else {
        recContainer.innerHTML = `
            <div style="font-size: 2rem; color: #2196F3;"><i class='bx bx-check'></i></div>
            <div>
                <p style="font-weight: 800; font-size: 1.1rem; margin-bottom: 0.2rem !important;">Możesz tankować</p>
                <p style="font-size: 0.9rem; opacity: 0.8;">Brak znaczących zmian w najbliższym czasie.</p>
            </div>
        `;
    }

    // Aktualności rynkowe
    const newsContainer = document.getElementById('market-news');
    if (trendType === 'up') {
        newsContainer.innerHTML = `📈 Notowania ropy naftowej rosną. Analitycy przewidują dalsze wzrosty cen paliw w najbliższych tygodniach.`;
    } else if (trendType === 'down') {
        newsContainer.innerHTML = `📉 Ceny ropy na świecie spadają. Korzystny kurs złotego może przynieść dalsze obniżki na stacjach.`;
    } else {
        newsContainer.innerHTML = `⚖️ Rynek paliw stabilny. Analitycy nie przewidują gwałtownych zmian w najbliższym czasie.`;
    }
}

function openForecastDetails() {
    document.getElementById('view-forecast').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeForecastDetails() {
    document.getElementById('view-forecast').classList.add('hidden');
    document.body.style.overflow = 'auto';
}