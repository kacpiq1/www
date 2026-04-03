const styleSheet = document.createElement("style");
styleSheet.innerText = `
    @keyframes pulseAlert {
        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(218, 33, 40, 0.7); }
        70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(218, 33, 40, 0); }
        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(218, 33, 40, 0); }
    }
    .jutro-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: linear-gradient(45deg, #DA2128, #ff4b52);
        color: white;
        padding: 6px 14px;
        border-radius: 12px;
        font-weight: 900;
        letter-spacing: 0.5px;
        box-shadow: 0 4px 15px rgba(218, 33, 40, 0.4);
        animation: pulseAlert 2s infinite;
        margin-top: 5px;
    }
    .dzis-badge {
        color: #4CAF50;
        font-weight: bold;
        display: flex;
        align-items: center;
        gap: 5px;
        margin-top: 5px;
    }
`;
document.head.appendChild(styleSheet);

let originalPrices = {};
let priceHistoryChart = null;

// Globalny magazyn na historyczne dane
window.dailyNettoPrices = {};
let rawFuelDataList = [];
let rawLpgData = null;

// Product icons
const productIcons = {
    'Pb95': 'https://www.kacpiq.pl/img/efecta95.png',
    'Pb98': 'https://www.kacpiq.pl/img/verva98.png',
    'LPG': 'https://www.kacpiq.pl/img/lpg.png',
    'ONEkodiesel': 'https://www.kacpiq.pl/img/efectadiesel.png',
    'ONArctic2': 'https://www.kacpiq.pl/img/vervadiesel.png'
};

const STATE = {
    forecastData: null,
    currentDisplayDate: null
};

const MY_PROXY = "https://proxy.kacpiq.workers.dev/";

// RĘCZNE NADPISANIE CEN DLA 31.03.2026 (Nie zmieniane)
const OVERRIDE_PRICES = {
    '2026-03-31': {
        'Pb95': 6.16,
        'ONEkodiesel': 7.54,
        'Pb98': 6.76,
        'ONArctic2': 7.60 
    }
};

// POMOCNICZA FUNKCJA: OBSUNIĘCIE DATY O +1 DZIEŃ
function shiftDate(dateStr) {
    if (!dateStr) return dateStr;
    let d = new Date(dateStr);
    d.setDate(d.getDate() + 1); // Dodajemy jeden dzień
    return d.toISOString().split('T')[0];
}

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

// === LOGIKA OBLICZEŃ Z ZALEŻNOŚCIĄ OD DATY ===
function calculateRetailPrice(productName, wholesalePriceNetto, dateStr = null) {
    if (productName === 'LPG') return wholesalePriceNetto * 1.26; 

    let isCpnActive = true; 

    if (dateStr && dateStr < '2026-03-31') {
        isCpnActive = false;
    }

    if (isCpnActive) {
        return (wholesalePriceNetto + 0.30) * 1.08;
    } else {
        let taxRate = 0.26;
        if (productName === 'Pb98') taxRate = 0.32;
        return wholesalePriceNetto * (1 + taxRate);
    }
}
// =============================================

// === POBIERANIE PEŁNEJ HISTORII DO OBLICZENIA DZIŚ / WCZORAJ ===
async function fetchLastData() {
    const year = new Date().getFullYear();
    const todayStr = new Date().toLocaleDateString('sv-SE');
    const yesterdayStr = new Date(Date.now() - 86400000).toLocaleDateString('sv-SE');

    const productIds = {
        'Pb95': 41, 'Pb98': 42, 'ONEkodiesel': 43, 'ONArctic2': 44
    };

    window.dailyNettoPrices = {};

    await Promise.all(Object.entries(productIds).map(async ([productName, productId]) => {
        const url = `${MY_PROXY}https://tool.orlen.pl/api/wholesalefuelprices/ByProduct?productId=${productId}&from=${year}-01-01&to=${year}-12-31`;
        try {
            const res = await fetch(url);
            if (!res.ok) return;
            const text = await res.text();
            if (!text || text.trim() === "") return;
            
            const data = JSON.parse(text);
            if (data && data.length > 0) {
                let todayNetto = 0;
                let yesterdayNetto = 0;
                
                data.sort((a,b) => a.effectiveDate.localeCompare(b.effectiveDate));
                
                for (let item of data) {
                    const shiftedDate = shiftDate(item.effectiveDate.split('T')[0]);
                    let netto = item.value / 1000;
                    
                    if (shiftedDate <= todayStr) todayNetto = netto;
                    if (shiftedDate <= yesterdayStr) yesterdayNetto = netto;
                }
                window.dailyNettoPrices[productName] = { todayNetto, yesterdayNetto };
            }
        } catch (err) {
            console.error(`Błąd dla ${productName}:`, err.message);
        }
    }));

    try {
        const res = await fetch(`${MY_PROXY}https://tool.orlen.pl/api/autogasprices/Dates?year=${year}`);
        if (res.ok) {
            const textResponse = await res.text();
            if (textResponse && textResponse.trim() !== "") {
                const dates = JSON.parse(textResponse);
                if (dates && dates.length >= 1) {
                    let lpgDataArr = [];
                    for (let i = 0; i < Math.min(5, dates.length); i++) {
                        try {
                            const lpgRes = await fetch(`${MY_PROXY}https://tool.orlen.pl/api/autogasprices/ByDate?date=${dates[i].split('T')[0]}`);
                            if (!lpgRes.ok) continue;
                            const lpgText = await lpgRes.text();
                            if (!lpgText || lpgText.trim() === "") continue;
                            
                            const lpgData = JSON.parse(lpgText);
                            const malopolska = lpgData.find(entry => entry.locationName.toLowerCase() === "małopolskie");
                            if (malopolska) {
                                lpgDataArr.push({
                                    shiftedDate: shiftDate(dates[i].split('T')[0]),
                                    value: malopolska.value
                                });
                            }
                        } catch (errLoop) {}
                    }
                    
                    lpgDataArr.sort((a,b) => a.shiftedDate.localeCompare(b.shiftedDate));
                    let lpgTodayNetto = 0;
                    let lpgYesterdayNetto = 0;
                    
                    for (let item of lpgDataArr) {
                        if (item.shiftedDate <= todayStr) lpgTodayNetto = item.value;
                        if (item.shiftedDate <= yesterdayStr) lpgYesterdayNetto = item.value;
                    }
                    window.dailyNettoPrices['LPG'] = { todayNetto: lpgTodayNetto, yesterdayNetto: lpgYesterdayNetto };
                }
            }
        }
    } catch (err) {
        console.warn("Brak dostępu do historii LPG z Orlenu, polegamy na bieżącym proxy.");
    }
    
    if (!window.dailyNettoPrices['LPG']) {
        window.dailyNettoPrices['LPG'] = { todayNetto: 0, yesterdayNetto: 0 };
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    loadThemeFromLocalStorage();
    if (localStorage.getItem('infoModalAcknowledged') !== 'true') {
        setTimeout(showInfoModal, 1500);
    }
    if (isMobileDevice()) {
        showNotification("Strona może nie wyświetlać się optymalnie na urządzeniach mobilnych");
    }

    await fetchLastData();
    fetchData();
    initializeYearSelector();
    
    setTimeout(() => {
        analyzeMultiFuelTrends();
    }, 2000);
});

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

function fetchData() {
    showLoading();
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

function processFuelData(data) {
    let latestDate = 'brak danych';
    let isTomorrowAvailable = false;
    
    const todayStr = new Date().toLocaleDateString('sv-SE');
    const tomorrowStr = new Date(Date.now() + 86400000).toLocaleDateString('sv-SE');
    
    if (data && data.length > 0 && data[0].publishFrom) {
        latestDate = shiftDate(data[0].publishFrom.replace('T00:00:00', '').split('T')[0]);
        if (latestDate >= tomorrowStr) {
            isTomorrowAvailable = true;
        }
    }
    
    STATE.currentDisplayDate = latestDate;
    const updateInfoEl = document.getElementById('updateInfo');
    
    if (isTomorrowAvailable) {
        updateInfoEl.innerHTML = `
            <div class="jutro-badge">
                <i class='bx bx-time-five'></i> UWAGA: OPUBIKOWANO CENY NA JUTRO (${latestDate})
            </div>`;
    } else {
        updateInfoEl.innerHTML = `
            <span class="dzis-badge">
                <i class='bx bx-check-circle'></i> Ceny obowiązujące dzisiaj (${todayStr})
            </span>`;
    }
    
    rawFuelDataList = data.filter(item => 
        item.productName === 'Pb95' || 
        item.productName === 'ONEkodiesel' ||
        item.productName === 'Pb98' || 
        item.productName === 'ONArctic2'
    );
    
    renderAllFuels();
    processForecastData();
}

function fetchLPGData() {
    fetch('https://cenypaliw-lpg.kacpiq.workers.dev/')
        .then(response => {
            if (!response.ok) throw new Error("HTTP error " + response.status);
            return response.text();
        })
        .then(text => {
            if (!text || text.trim() === "") throw new Error("Pusta odpowiedź API LPG");
            const data = JSON.parse(text);
            if (Array.isArray(data)) {
                const małopolskieData = data.find(entry => entry.locationName.toLowerCase() === 'małopolskie');
                if (małopolskieData) {
                    rawLpgData = małopolskieData;
                    renderAllFuels();
                }
            }
            hideLoading();
        })
        .catch(error => {
            console.warn('Aktualnie dane LPG są niedostępne:', error.message);
            hideLoading();
        });
}

function renderAllFuels() {
    const fuelGrid = document.getElementById('fuelGrid');
    fuelGrid.innerHTML = '';
    
    const todayStr = new Date().toLocaleDateString('sv-SE');
    const yesterdayStr = new Date(Date.now() - 86400000).toLocaleDateString('sv-SE');
    const tomorrowStr = new Date(Date.now() + 86400000).toLocaleDateString('sv-SE');
    
    let isTomorrowAvailable = STATE.currentDisplayDate >= tomorrowStr;
    const fuels = ['Pb95', 'ONEkodiesel', 'Pb98', 'ONArctic2', 'LPG'];
    
    fuels.forEach(productName => {
        let pricesObj = window.dailyNettoPrices[productName];
        if (!pricesObj) return;
        
        let todayNetto = pricesObj.todayNetto; // Prawdziwy hurt
        let yesterdayNetto = pricesObj.yesterdayNetto; // Prawdziwy hurt
        
        if (productName === 'LPG' && rawLpgData) {
            if (todayNetto === 0) todayNetto = rawLpgData.value;
            if (yesterdayNetto === 0) yesterdayNetto = rawLpgData.value;
        }
        
        if (todayNetto === 0) return; 
        
        // Zawsze używamy hurtu z Efecta Diesel dla ceny rynkowej Vervy (od 01.04.2026)
        let efectaTodayNetto = window.dailyNettoPrices['ONEkodiesel'] ? window.dailyNettoPrices['ONEkodiesel'].todayNetto : todayNetto;
        let efectaYesterdayNetto = window.dailyNettoPrices['ONEkodiesel'] ? window.dailyNettoPrices['ONEkodiesel'].yesterdayNetto : yesterdayNetto;

        let todayPrice = 0;
        if (todayStr === '2026-03-31' && OVERRIDE_PRICES['2026-03-31'][productName]) {
            todayPrice = OVERRIDE_PRICES['2026-03-31'][productName];
        } else if (productName === 'ONArctic2' && todayStr >= '2026-04-01' && efectaTodayNetto > 0) {
            todayPrice = calculateRetailPrice('ONEkodiesel', efectaTodayNetto, todayStr);
        } else {
            todayPrice = calculateRetailPrice(productName, todayNetto, todayStr);
        }
        
        let yesterdayPrice = 0;
        if (yesterdayStr === '2026-03-31' && OVERRIDE_PRICES['2026-03-31'][productName]) {
            yesterdayPrice = OVERRIDE_PRICES['2026-03-31'][productName];
        } else if (productName === 'ONArctic2' && yesterdayStr >= '2026-04-01' && efectaYesterdayNetto > 0) {
            yesterdayPrice = calculateRetailPrice('ONEkodiesel', efectaYesterdayNetto, yesterdayStr);
        } else {
            yesterdayPrice = calculateRetailPrice(productName, yesterdayNetto, yesterdayStr);
        }
        
        const priceChange = yesterdayPrice > 0 ? ((todayPrice - yesterdayPrice) / yesterdayPrice) * 100 : 0;
        
        let tomorrowBadgeHtml = '';
        if (isTomorrowAvailable) {
            let tomorrowNetto = 0;
            let tomorrowEfectaNetto = 0;

            if (productName === 'LPG' && rawLpgData) {
                tomorrowNetto = rawLpgData.value;
            } else {
                const rawFuel = rawFuelDataList.find(f => f.productName === productName);
                if (rawFuel) tomorrowNetto = rawFuel.value / 1000; // Prawdziwy hurt jutro

                const rawEfecta = rawFuelDataList.find(f => f.productName === 'ONEkodiesel');
                if (rawEfecta) tomorrowEfectaNetto = rawEfecta.value / 1000;
            }
            
            if (tomorrowNetto > 0) {
                let tomorrowPrice = 0;
                if (tomorrowStr === '2026-03-31' && OVERRIDE_PRICES['2026-03-31'][productName]) {
                    tomorrowPrice = OVERRIDE_PRICES['2026-03-31'][productName];
                } else if (productName === 'ONArctic2' && tomorrowStr >= '2026-04-01' && tomorrowEfectaNetto > 0) {
                    tomorrowPrice = calculateRetailPrice('ONEkodiesel', tomorrowEfectaNetto, tomorrowStr);
                } else {
                    tomorrowPrice = calculateRetailPrice(productName, tomorrowNetto, tomorrowStr);
                }
                
                let diffGrosze = (tomorrowPrice - todayPrice) * 100;
                let diffFormatted = diffGrosze > 0 ? `+${diffGrosze.toFixed(0)}gr` : `${diffGrosze.toFixed(0)}gr`;
                
                let badgeColor = diffGrosze > 0 ? '#DA2128' : (diffGrosze < 0 ? '#4CAF50' : '#8D99AE');
                let badgeIcon = diffGrosze > 0 ? 'bx-trending-up' : (diffGrosze < 0 ? 'bx-trending-down' : 'bx-minus');
                
                if (Math.abs(diffGrosze) >= 1) {
                    tomorrowBadgeHtml = `
                        <div style="margin-top: 12px; background: ${badgeColor}15; padding: 6px 10px; border-radius: 8px; font-size: 0.8rem; font-weight: 700; color: ${badgeColor}; display: inline-flex; align-items: center; gap: 4px; border: 1px solid ${badgeColor}33;">
                            <i class='bx ${badgeIcon}'></i> Jutro: ${tomorrowPrice.toFixed(2)} PLN (${diffFormatted})
                        </div>
                    `;
                } else {
                     tomorrowBadgeHtml = `
                        <div style="margin-top: 12px; background: rgba(0,0,0,0.03); padding: 6px 10px; border-radius: 8px; font-size: 0.8rem; font-weight: 700; color: #8D99AE; display: inline-flex; align-items: center; gap: 4px; border: 1px solid rgba(0,0,0,0.05);">
                            <i class='bx bx-check'></i> Jutro cena bez zmian
                        </div>
                    `;
                }
            }
        }
        
        const fuelData = {
            productName,
            todayPrice,
            todayNetto, // To zostaje w interfejsie jako PRAWDZIWY hurt dla Vervy
            priceChange,
            tomorrowBadgeHtml
        };
        
        fuelGrid.appendChild(createFuelCard(fuelData));
    });
}

function createFuelCard(fuelData) {
    const card = document.createElement('div');
    card.className = 'fuel-card animate-up';
    card.id = `fuel-card-${fuelData.productName}`;
    
    let priceChangeClass = 'price-neutral';
    let priceChangeIcon = 'bx-minus';
    
    if (fuelData.priceChange > 0) {
        priceChangeClass = 'price-up';
        priceChangeIcon = 'bx-up-arrow-alt';
    } else if (fuelData.priceChange < 0) {
        priceChangeClass = 'price-down';
        priceChangeIcon = 'bx-down-arrow-alt';
    }

    const todayStr = new Date().toLocaleDateString('sv-SE');
    let cpnTagHtml = '';
    if (fuelData.productName !== 'LPG' && todayStr >= '2026-03-31') {
        cpnTagHtml = '<span class="cpn-badge">CPN</span>';
    }
    
    card.innerHTML = `
        <div class="fuel-header">
            <img src="${productIcons[fuelData.productName]}" alt="${fuelData.productName}" class="fuel-icon">
            <div class="fuel-name">${getFuelDisplayName(fuelData.productName)} ${cpnTagHtml}</div>
        </div>
        <div class="fuel-price">
            ${fuelData.todayPrice.toFixed(2)} PLN
            <span class="price-change ${priceChangeClass}">
                <i class='bx ${priceChangeIcon}'></i> ${Math.abs(fuelData.priceChange).toFixed(1)}%
            </span>
        </div>
        <div class="fuel-price-wholesale">Hurt netto: ${fuelData.todayNetto.toFixed(2)} PLN</div>
        ${fuelData.tomorrowBadgeHtml}
    `;
    
    originalPrices[fuelData.productName] = fuelData.todayPrice.toFixed(2);
    return card;
}

function processForecastData() {
    const forecastData = [
        { productName: 'Pb95', minPrice: 6.18, maxPrice: 6.27 },
        { productName: 'Pb98', minPrice: 6.79, maxPrice: 6.89 },
        { productName: 'ONEkodiesel', minPrice: 7.85, maxPrice: 7.99 },
        { productName: 'ONArctic2', minPrice: 6.05, maxPrice: 6.25 },
        { productName: 'LPG', minPrice: 3.84, maxPrice: 3.99 }
    ];
    
    const forecastGrid = document.getElementById('forecastGrid');
    forecastGrid.innerHTML = '';
    
    const todayStr = new Date().toLocaleDateString('sv-SE');
    
    forecastData.forEach(data => {
        const card = document.createElement('div');
        card.className = 'fuel-card animate-up';
        
        let cpnTagHtml = '';
        if (data.productName !== 'LPG' && todayStr >= '2026-03-31') {
            cpnTagHtml = '<span class="cpn-badge">CPN</span>';
        }

        card.innerHTML = `
            <div class="fuel-header">
                <img src="${productIcons[data.productName]}" alt="${data.productName}" class="fuel-icon">
                <div class="fuel-name">${getFuelDisplayName(data.productName)} ${cpnTagHtml}</div>
            </div>
            <div class="fuel-price">${data.minPrice.toFixed(2)} - ${data.maxPrice.toFixed(2)} PLN</div>
            <div class="fuel-price-wholesale">Prognozowany zakres cen</div>
        `;
        forecastGrid.appendChild(card);
    });
}

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

function showCouponModal() {
    document.getElementById('couponModal').style.display = 'block';
    setTimeout(() => { document.getElementById('couponModal').classList.add('show'); }, 10);
}

function closeCouponModal() {
    document.getElementById('couponModal').classList.remove('show');
    setTimeout(() => { document.getElementById('couponModal').style.display = 'none'; }, 300);
}

function applyCoupon() {
    const couponValue = parseFloat(document.getElementById('couponSelect').value);
    const messageElement = document.getElementById('couponMessage');
    const expiryElement = document.getElementById('couponExpiry');
    
    if (couponValue === 0) {
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
        Object.keys(originalPrices).forEach(productName => {
            const card = document.getElementById(`fuel-card-${productName}`);
            if (card && !card.querySelector('.fuel-name').textContent.includes('LPG')) {
                const priceElement = card.querySelector('.fuel-price');
                if (priceElement) {
                    priceElement.innerHTML = priceElement.innerHTML.replace(/<span class="coupon-badge">.*?<\/span>/, '');
                    const originalPrice = parseFloat(originalPrices[productName]);
                    const newPrice = (originalPrice + couponValue).toFixed(2);
                    priceElement.innerHTML = priceElement.innerHTML.replace(
                        `${originalPrice.toFixed(2)} PLN`, 
                        `${newPrice} PLN<span class="coupon-badge">-${Math.abs(couponValue * 100)} gr</span>`
                    );
                    priceElement.classList.add('price-flash');
                    setTimeout(() => { priceElement.classList.remove('price-flash'); }, 2000);
                }
            }
        });
        messageElement.innerHTML = `<i class="bx bx-check-circle"></i> Kupon zastosowany! Obniżka <strong>${Math.abs(couponValue * 100)} gr/l</strong>`;
        expiryElement.style.display = 'flex';
        startCouponCountdown();
    }
}

function startCouponCountdown() {
    const couponExpiryDate = new Date('2026-04-30T23:59:59');
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
        setTimeout(() => { document.getElementById('infoModal').classList.add('show'); }, 10);
    }
}

function closeInfoModal() {
    document.getElementById('infoModal').classList.remove('show');
    setTimeout(() => { document.getElementById('infoModal').style.display = 'none'; }, 300);
}

function closeInfoModalAndAcknowledge() {
    localStorage.setItem('infoModalAcknowledged', 'true');
    closeInfoModal();
}

function toggleHistory() {
    document.getElementById('historyModal').style.display = 'block';
    setTimeout(() => {
        document.getElementById('historyModal').classList.add('show');
        fetchHistoryData();
    }, 10);
}

function closeHistoryModal() {
    document.getElementById('historyModal').classList.remove('show');
    setTimeout(() => { document.getElementById('historyModal').style.display = 'none'; }, 300);
}

// === POBIERANIE DANYCH HISTORII ===
function fetchHistoryData() {
    const loadingElement = document.getElementById('loadingHistory');
    const tableBody = document.getElementById('historyTableBody');
    
    loadingElement.style.display = 'block';
    tableBody.innerHTML = '';
    
    const fuelType = document.getElementById('fuelType').value;
    const selectedYear = document.getElementById('year').value;
    const productId = fuelType.split('-')[0];
    
    let productNameKey = '';
    if (productId === '41') productNameKey = 'Pb95';
    else if (productId === '42') productNameKey = 'Pb98';
    else if (productId === '43') productNameKey = 'ONEkodiesel';
    else if (productId === '44') productNameKey = 'ONArctic2';
    
    const viewOption = document.querySelector('input[name="dataView"]:checked').value;
    const historyUrl = `${MY_PROXY}https://tool.orlen.pl/api/wholesalefuelprices/ByProduct?productId=${productId}&from=${selectedYear}-01-01&to=${selectedYear}-12-31`;
    
    fetch(historyUrl)
        .then(response => response.json())
        .then(async data => {
            
            // POBIERAMY RÓWNOLEGLE HISTORIĘ EFECTA DIESEL, JEŚLI WYSZUKUJEMY VERVĘ
            let efectaMap = {};
            if (productId === '44') {
                try {
                    const efectaUrl = `${MY_PROXY}https://tool.orlen.pl/api/wholesalefuelprices/ByProduct?productId=43&from=${selectedYear}-01-01&to=${selectedYear}-12-31`;
                    const resEfecta = await fetch(efectaUrl);
                    const dataEfecta = await resEfecta.json();
                    dataEfecta.forEach(e => {
                        efectaMap[e.effectiveDate] = e.value;
                    });
                } catch(e) {
                    console.error("Błąd pobierania bazy Efecty dla Vervy w historii");
                }
            }

            const transformedData = data.map(item => {
                const shiftedDateStr = shiftDate(item.effectiveDate.split('T')[0]);
                let efectaValue = null;
                
                // Zapisujemy przypisaną cenę Efecty do tego samego dnia
                if (productId === '44' && efectaMap[item.effectiveDate]) {
                    efectaValue = efectaMap[item.effectiveDate];
                }

                return {
                    value: item.value,
                    efectaValue: efectaValue,
                    shiftedDate: shiftedDateStr,
                    dateObj: new Date(shiftedDateStr)
                };
            });

            if (transformedData.length === 0) {
                tableBody.innerHTML = '<tr><td colspan=\"2\" style=\"text-align:center; padding:2rem; opacity:0.6;\">Brak danych giełdowych dla tego roku.</td></tr>';
                loadingElement.style.display = 'none';
                return;
            }
            
            let minPrice = Infinity;
            let maxPrice = -Infinity;
            const processedData = [];
            
            if (viewOption === 'daily') {
                transformedData.forEach(item => {
                    let price = 0;
                    if (item.shiftedDate === '2026-03-31' && OVERRIDE_PRICES['2026-03-31'][productNameKey]) {
                        price = OVERRIDE_PRICES['2026-03-31'][productNameKey];
                    } else {
                        // Jeśli sprawdzamy Vervę (od 01.04.2026), cenę detaliczną liczymy tak jakby to była Efecta
                        if (productNameKey === 'ONArctic2' && item.shiftedDate >= '2026-04-01' && item.efectaValue) {
                            price = calculateRetailPrice('ONEkodiesel', item.efectaValue / 1000, item.shiftedDate);
                        } else {
                            price = calculateRetailPrice(productNameKey, item.value / 1000, item.shiftedDate); 
                        }
                    }
                    
                    if (price < minPrice) minPrice = price;
                    if (price > maxPrice) maxPrice = price;
                    
                    processedData.push({ date: item.shiftedDate, price });
                });
            } else {
                const monthlyData = {};
                transformedData.forEach(item => {
                    const month = item.shiftedDate.slice(0, 7);
                    if (!monthlyData[month]) monthlyData[month] = [];
                    monthlyData[month].push(item);
                });
                
                for (const [month, items] of Object.entries(monthlyData)) {
                    let monthSum = 0;
                    items.forEach(it => {
                        if (it.shiftedDate === '2026-03-31' && OVERRIDE_PRICES['2026-03-31'][productNameKey]) {
                            monthSum += OVERRIDE_PRICES['2026-03-31'][productNameKey];
                        } else {
                            if (productNameKey === 'ONArctic2' && it.shiftedDate >= '2026-04-01' && it.efectaValue) {
                                monthSum += calculateRetailPrice('ONEkodiesel', it.efectaValue / 1000, it.shiftedDate);
                            } else {
                                monthSum += calculateRetailPrice(productNameKey, it.value / 1000, it.shiftedDate);
                            }
                        }
                    });
                    const avgPrice = monthSum / items.length;
                    
                    if (avgPrice < minPrice) minPrice = avgPrice;
                    if (avgPrice > maxPrice) maxPrice = avgPrice;
                    
                    processedData.push({ date: month, price: avgPrice });
                }
            }
            
            processedData.forEach(item => {
                const row = document.createElement('tr');
                const priceClass = item.price === minPrice ? 'min-price' : item.price === maxPrice ? 'max-price' : '';
                
                let showCpnTag = false;
                if (productNameKey !== 'LPG') {
                    if (item.date.length > 7 && item.date >= '2026-03-31') {
                        showCpnTag = true;
                    } else if (item.date.length === 7 && item.date >= '2026-04') {
                        showCpnTag = true;
                    }
                }
                const cpnTagHtml = showCpnTag ? ' <span class="cpn-badge">CPN</span>' : '';

                let dateHtml = item.date;
                if (item.date.length > 7 && item.date >= '2026-03-31') {
                    const rowDateObj = new Date(item.date);
                    if (rowDateObj.getDay() === 6) {
                        if (item.date === '2026-04-04') {
                            dateHtml += '<br><span style="font-size: 0.75rem; color: #8D99AE;">(Okres: 04.04.2026 - 07.04.2026)</span>';
                        } else {
                            dateHtml += '<br><span style="font-size: 0.75rem; color: #8D99AE;">(Następna zmiana we wtorek)</span>';
                        }
                    }
                }

                row.innerHTML = `
                    <td>${dateHtml}</td>
                    <td class="${priceClass}">${item.price.toFixed(2)} PLN ${cpnTagHtml}</td>
                `;
                tableBody.appendChild(row);
            });
            
            loadingElement.style.display = 'none';
        })
        .catch(error => {
            console.error('Error fetching history data:', error);
            tableBody.innerHTML = '<tr><td colspan=\"2\">Wystąpił błąd podczas pobierania danych z giełdy</td></tr>';
            loadingElement.style.display = 'none';
        });
}

function showPriceHistoryChart() {
    if (priceHistoryChart) {
        priceHistoryChart.destroy();
    }
    
    const tableRows = document.querySelectorAll('#historyTableBody tr');
    const dates = [];
    const prices = [];
    
    tableRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length === 2 && !cells[0].textContent.includes('Brak danych')) {
            const rawDate = cells[0].innerHTML.split('<br>')[0];
            dates.push(rawDate);
            prices.push(parseFloat(cells[1].textContent));
        }
    });
    
    if (dates.length === 0) {
        showNotification("Brak danych do wyświetlenia wykresu.");
        return;
    }
    
    const ctx = document.getElementById('priceHistoryChart').getContext('2d');
    priceHistoryChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Cena rynkowa (PLN)',
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
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: function(context) { return `Cena: ${context.parsed.y.toFixed(2)} PLN`; }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: { callback: function(value) { return value.toFixed(2) + ' PLN'; } }
                }
            }
        }
    });
    
    document.getElementById('priceHistoryModal').style.display = 'block';
    setTimeout(() => { document.getElementById('priceHistoryModal').classList.add('show'); }, 10);
}

function closePriceHistoryModal() {
    document.getElementById('priceHistoryModal').classList.remove('show');
    setTimeout(() => { document.getElementById('priceHistoryModal').style.display = 'none'; }, 300);
}

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark-theme' : 'light-theme');
}

function loadThemeFromLocalStorage() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark-theme') {
        document.body.classList.add('dark-theme');
    }
}

function showLoading() {
    document.getElementById('loading').style.display = 'flex';
    document.getElementById('container').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('container').style.display = 'block';
}

function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.style.display = 'flex';
    notification.innerHTML = `<i class='bx bx-check'></i> ${message}`;
    notification.classList.add('show');
    setTimeout(() => { notification.classList.remove('show'); }, 3000);
}

function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

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
                const res = await fetch(`${MY_PROXY}https://tool.orlen.pl/api/wholesalefuelprices/ByProduct?productId=${fuel.id}&from=${year-1}-01-01&to=${year}-12-31`);
                const data = await res.json();
                
                if (data && data.length > 10) {
                    data.sort((a, b) => new Date(a.effectiveDate) - new Date(b.effectiveDate));
                    const last30 = data.slice(-30);
                    
                    if (last30.length >= 14) {
                        const last7 = last30.slice(-7);
                        const avg7 = last7.reduce((sum, item) => sum + item.value, 0) / last7.length;
                        const prev7 = last30.slice(-14, -7);
                        const avgPrev7 = prev7.reduce((sum, item) => sum + item.value, 0) / prev7.length;
                        
                        const diffGrosze = ((avg7 - avgPrev7) / 1000 * 100);
                        const diffValue = diffGrosze;
                        
                        allChanges.push(diffValue);
                        globalChangeSum += diffValue;
                        
                        let status = "Stabilnie";
                        let color = "text-blue-600";
                        let icon = "bx-minus";
                        let bgClass = "trend-stable";

                        if (diffValue > 3) { 
                            status = "Wzrost"; color = "text-red-600"; icon = "bx-trending-up"; bgClass = "trend-up";
                        } else if (diffValue < -3) { 
                            status = "Spadek"; color = "text-green-600"; icon = "bx-trending-down"; bgClass = "trend-down";
                        }

                        trendDetails.push({ name: fuel.displayName, status, color, icon, bgClass, diff: diffValue });
                    }
                }
            } catch (e) {
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

        const avgChange = allChanges.length > 0 ? globalChangeSum / allChanges.length : 0;
        let forecastGrosze = 0;
        let trendType = 'stable';
        
        if (avgChange > 2) {
            forecastGrosze = avgChange * 1.25; trendType = 'up';
        } else if (avgChange < -2) {
            forecastGrosze = avgChange * 1; trendType = 'down';
        } else {
            forecastGrosze = avgChange; trendType = 'stable';
        }

        const forecastText = forecastGrosze > 0 ? `+${forecastGrosze.toFixed(0)} gr` : forecastGrosze < 0 ? `${forecastGrosze.toFixed(0)} gr` : '0 gr';
        
        STATE.forecastData = { date: new Date().toISOString(), forecast: forecastText, value: forecastGrosze, type: trendType, details: trendDetails };
        updateForecastUI(avgChange, trendDetails, forecastText, trendType);

    } catch (e) {
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

    const grid = document.getElementById('forecast-details-grid');
    grid.innerHTML = '';
    if (details.length > 0) {
        details.forEach(d => {
            const item = document.createElement('div');
            item.className = `report-detail-item`; 
            item.innerHTML = `<span>${d.name}</span><span>${d.diff > 0 ? '+' : ''}${d.diff.toFixed(1)} gr</span>`;
            grid.appendChild(item);
        });
    } else {
        grid.innerHTML = '<p style="text-align: center; opacity: 0.5;">Brak danych szczegółowych</p>';
    }

    const recContainer = document.getElementById('forecast-recommendation');
    if (trendType === 'up') {
        recContainer.innerHTML = `
            <div style="font-size: 2rem; color: #E30613;"><i class='bx bxs-gas-pump'></i></div>
            <div>
                <p style="font-weight: 800; font-size: 1.1rem; margin-bottom: 0.2rem !important;">Zatankuj dzisiaj</p>
                <p style="font-size: 0.9rem; opacity: 0.8;">Przewidywane podwyżki o ${forecastGrosze} w ciągu tygodnia.</p>
            </div>`;
    } else if (trendType === 'down') {
        recContainer.innerHTML = `
            <div style="font-size: 2rem; color: #4CAF50;"><i class='bx bx-time-five'></i></div>
            <div>
                <p style="font-weight: 800; font-size: 1.1rem; margin-bottom: 0.2rem !important;">Wstrzymaj się</p>
                <p style="font-size: 0.9rem; opacity: 0.8;">Ceny mogą spaść o ${forecastGrosze} w ciągu tygodnia.</p>
            </div>`;
    } else {
        recContainer.innerHTML = `
            <div style="font-size: 2rem; color: #2196F3;"><i class='bx bx-check'></i></div>
            <div>
                <p style="font-weight: 800; font-size: 1.1rem; margin-bottom: 0.2rem !important;">Możesz tankować</p>
                <p style="font-size: 0.9rem; opacity: 0.8;">Brak znaczących zmian w najbliższym czasie.</p>
            </div>`;
    }

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