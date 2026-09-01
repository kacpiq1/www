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
window.isNettoMode = false; // Zmienna globalna dla trybu podatku

function calculateRetailPrice(productName, wholesalePriceNetto, dateStr = null) {
    let finalPrice = 0;
    let currentTaxRate = 1.0;
    
    if (productName === 'LPG') {
        currentTaxRate = 1.26;
        finalPrice = wholesalePriceNetto * currentTaxRate; 
    } else {
        const isOldCpn = dateStr && dateStr >= '2026-03-31' && dateStr < '2026-07-01';
        const isNewCpn = dateStr && dateStr >= '2026-08-15' && dateStr < '2026-09-01';
        
        if (isOldCpn || isNewCpn) {
            // Pakiet CPN (obowiązujący wiosną oraz od 17.08.2026 do końca wakacji)
            currentTaxRate = 1.08;
            finalPrice = (wholesalePriceNetto + 0.30) * currentTaxRate;
        } else if (dateStr && dateStr >= '2026-07-01') {
            // Ceny standardowe (poza pakietami) - 23% VAT i standardowe marże
            currentTaxRate = 1.23;
            let margin = 0.23; // Domyślna marża
            
            if (productName === 'Pb95') margin = 0.29;
            else if (productName === 'ONEkodiesel') margin = 0.23;
            else if (productName === 'Pb98') margin = 0.24; // (Verva 98)
            else if (productName === 'ONArctic2') margin = 0.23; // (Verva Diesel)
            
            finalPrice = (wholesalePriceNetto + margin) * currentTaxRate;
        } else {
            // Stare stawki przed pierwszym CPN (przed 31.03.2026)
            currentTaxRate = productName === 'Pb98' ? 1.32 : 1.26;
            finalPrice = wholesalePriceNetto * currentTaxRate;
        }
    }

    // Jeśli włączono tryb Netto, zdejmujemy aktualny podatek z danego okresu
    if (window.isNettoMode) {
        return finalPrice / currentTaxRate;
    }
    
    return finalPrice;
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

// Pomocnicza funkcja grupująca standardowy start aplikacji
async function runNormalStartup() {
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
}

document.addEventListener('DOMContentLoaded', async function () {
    loadThemeFromLocalStorage();

    // === SYSTEM PRZERWY TECHNICZNEJ (Aktualizacja Cen) ===
    const now = new Date();
    const day = now.getDay(); // 0 = Niedziela, 1 = Poniedziałek, 2 = Wtorek ... 6 = Sobota
    
    // Ceny aktualizują się od wtorku do soboty
    const isUpdateDay = day >= 2 && day <= 6; 
    // Sprawdzamy czy jest między 00:00:00 a 00:04:59
    const isUpdateTime = now.getHours() === 0 && now.getMinutes() < 5;

    if (isUpdateDay && isUpdateTime) {
        // Zatrzymujemy standardowe ładowanie. Po 2 sekundach pokazujemy komunikat przerwy
        setTimeout(() => {
            const loadingEl = document.getElementById('loading');
            loadingEl.innerHTML = `
                <div class="animate-up" style="text-align: center; max-width: 450px; padding: 25px; background: var(--card-bg); border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 2px solid var(--primary);">
                    <i class='bx bx-cloud-download bx-flashing' style="font-size: 4rem; color: var(--primary); margin-bottom: 1rem;"></i>
                    <h2 style="color: var(--text); margin-bottom: 10px; font-family: 'Outfit', sans-serif;">Pobieranie nowych cen...</h2>
                    <p style="color: var(--text-light); margin-bottom: 20px; font-size: 0.95rem;">Trwa codzienna aktualizacja danych z giełdy Orlen. Zmiany są właśnie przeliczane. <br><br>Strona zostanie automatycznie odświeżona o <b>00:05</b>.</p>
                    <button class="btn btn-secondary" onclick="bypassMaintenance()" style="width: 100%; font-size: 0.9rem;">
                        <i class='bx bx-right-arrow-alt'></i> Wejdź mimo to
                    </button>
                </div>
            `;
            
            // Obliczamy ile milisekund brakuje do 00:05:02, aby automatycznie odświeżyć stronę
            const refreshTime = new Date();
            refreshTime.setHours(0, 5, 2, 0);
            const msUntilRefresh = refreshTime - new Date();
            
            if (msUntilRefresh > 0) {
                setTimeout(() => { window.location.reload(); }, msUntilRefresh);
            }
        }, 2000); // 2 sekundy "zwykłego" kółeczka ładowania przed pokazaniem komunikatu
        
        // Funkcja pozwalająca pominąć przerwę techniczną
        window.bypassMaintenance = async function() {
            const loadingEl = document.getElementById('loading');
            loadingEl.innerHTML = `
                <div class="spinner"></div>
                <h2 style="color: var(--text); margin-top: 1rem;">Ładowanie pomimo przerwy...</h2>
            `;
            await runNormalStartup(); // Uruchomienie aplikacji "na siłę"
        };
        
        return; // Blokujemy dalsze ładowanie kodu pod spodem
    }

    // Jeśli nie ma przerwy, uruchamiamy stronę standardowo
    await runNormalStartup();
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
        
        let todayNetto = pricesObj.todayNetto; 
        let yesterdayNetto = pricesObj.yesterdayNetto; 
        
        if (productName === 'LPG' && rawLpgData) {
            if (todayNetto === 0) todayNetto = rawLpgData.value;
            if (yesterdayNetto === 0) yesterdayNetto = rawLpgData.value;
        }
        
        if (todayNetto === 0) return; 
        
        // OBLICZANIE WŁASNEJ CENY Z WŁASNEGO PRODUCT-ID
        let todayPrice = 0;
        if (todayStr === '2026-03-31' && OVERRIDE_PRICES['2026-03-31'][productName]) {
            todayPrice = OVERRIDE_PRICES['2026-03-31'][productName];
        } else {
            todayPrice = calculateRetailPrice(productName, todayNetto, todayStr);
        }
        
        let yesterdayPrice = 0;
        if (yesterdayStr === '2026-03-31' && OVERRIDE_PRICES['2026-03-31'][productName]) {
            yesterdayPrice = OVERRIDE_PRICES['2026-03-31'][productName];
        } else {
            yesterdayPrice = calculateRetailPrice(productName, yesterdayNetto, yesterdayStr);
        }
        
        const priceChange = yesterdayPrice > 0 ? ((todayPrice - yesterdayPrice) / yesterdayPrice) * 100 : 0;
        
        // OBLICZANIE PRAWDOPODOBNEJ CENY DLA VERVA DIESEL (Efecta Dzisiaj + 0.20 zł)
        let probableVervaPrice = 0;
        if (productName === 'ONArctic2' && todayStr >= '2026-07-01') {
            let efectaNetto = window.dailyNettoPrices['ONEkodiesel'] ? window.dailyNettoPrices['ONEkodiesel'].todayNetto : 0;
            if (efectaNetto > 0) {
                let efectaPrice = calculateRetailPrice('ONEkodiesel', efectaNetto, todayStr);
                probableVervaPrice = efectaPrice + 0.20;
            }
        }

        // --- NOWY KOD: OBLICZANIE CENY REGULARNEJ ---
        let todayRegularPrice = null;
        const isOldCpnNow = todayStr >= '2026-03-31' && todayStr < '2026-07-01';
        const isNewCpnNow = todayStr >= '2026-08-15' && todayStr < '2026-09-01';

        // Jeśli aktywny jest pakiet CPN i nie jest to LPG
        if (productName !== 'LPG' && (isOldCpnNow || isNewCpnNow)) {
            let margin = 0.23;
            if (productName === 'Pb95') margin = 0.29;
            else if (productName === 'ONEkodiesel') margin = 0.23;
            else if (productName === 'Pb98') margin = 0.24;
            else if (productName === 'ONArctic2') margin = 0.23;

            let standardTaxRate = 1.23;
            let regular = (todayNetto + margin) * standardTaxRate;
            
            // Jeśli użytkownik ma włączony widok netto, zdejmujemy VAT
            if (window.isNettoMode) {
                regular = regular / standardTaxRate;
            }
            todayRegularPrice = regular;
        }
        // --- KONIEC NOWEGO KODU ---

        let tomorrowBadgeHtml = '';
        if (isTomorrowAvailable) {
            let tomorrowNetto = 0;

            if (productName === 'LPG' && rawLpgData) {
                tomorrowNetto = rawLpgData.value;
            } else {
                const rawFuel = rawFuelDataList.find(f => f.productName === productName);
                if (rawFuel) tomorrowNetto = rawFuel.value / 1000;
            }
            
            if (tomorrowNetto > 0) {
                let tomorrowPrice = 0;
                if (tomorrowStr === '2026-03-31' && OVERRIDE_PRICES['2026-03-31'][productName]) {
                    tomorrowPrice = OVERRIDE_PRICES['2026-03-31'][productName];
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
            todayRegularPrice, // <--- Tutaj przekazujemy obliczoną cenę regularną
            todayNetto, 
            priceChange,
            tomorrowBadgeHtml,
            probableVervaPrice
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
    
    const isOldCpn = todayStr >= '2026-03-31' && todayStr < '2026-07-01';
    const isNewCpn = todayStr >= '2026-08-15' && todayStr < '2026-09-01';
    
    if (fuelData.productName !== 'LPG' && (isOldCpn || isNewCpn)) {
        cpnTagHtml = '<span class="cpn-badge">CPN</span>';
    }

    // Dodatkowy boks dla Vervy Diesel
    let vervaNoteHtml = '';
    if (fuelData.productName === 'ONArctic2' && fuelData.probableVervaPrice > 0) {
        vervaNoteHtml = `<div style="font-size: 0.85rem; color: #E30613; margin-top: 8px; font-weight: 600; background: rgba(227, 6, 19, 0.05); padding: 6px; border-radius: 6px; border: 1px dashed rgba(227, 6, 19, 0.3);">
            Prawdopodobna cena na stacji: ${fuelData.probableVervaPrice.toFixed(2)} PLN <br>
        </div>`;
    }
    
    // --- NOWY KOD: KOMPAKTOWY BLOK CENY REGULARNEJ ---
    let regularPriceHtml = '';
    if (fuelData.todayRegularPrice && fuelData.todayRegularPrice > fuelData.todayPrice) {
        regularPriceHtml = `
            <div style="display: flex; flex-direction: column; align-items: flex-start; justify-content: center; margin-right: 10px;">
                <span style="font-size: 0.65rem; color: var(--text-light); font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1; margin-bottom: 2px;">Bez pakietu</span>
                <span class="diagonal-strike" style="font-size: 1.25rem; line-height: 1;">${fuelData.todayRegularPrice.toFixed(2)}</span>
            </div>
        `;
    }

    card.innerHTML = `
        <div class="fuel-header">
            <img src="${productIcons[fuelData.productName]}" alt="${fuelData.productName}" class="fuel-icon">
            <div class="fuel-name">${getFuelDisplayName(fuelData.productName)} ${cpnTagHtml}</div>
        </div>
        
        <div class="fuel-price" style="display: flex; align-items: center; margin-top: 0.5rem; margin-bottom: 0.5rem;">
            ${regularPriceHtml}
            <div style="display: flex; align-items: center; flex-wrap: wrap;">
                <span style="font-size: 2rem; font-weight: 700; color: var(--primary);">${fuelData.todayPrice.toFixed(2)} PLN</span>
                <span class="price-change ${priceChangeClass}">
                    <i class='bx ${priceChangeIcon}'></i> ${Math.abs(fuelData.priceChange).toFixed(1)}%
                </span>
            </div>
        </div>

        <div class="fuel-price-wholesale">Hurt netto: ${fuelData.todayNetto.toFixed(2)} PLN</div>
        ${vervaNoteHtml}
        ${fuelData.tomorrowBadgeHtml}
    `;
    
    originalPrices[fuelData.productName] = fuelData.todayPrice.toFixed(2);
    return card;
}



function processForecastData() {
    const forecastData = [
        { productName: 'Pb95', minPrice: 6.42, maxPrice: 6.59 },
        { productName: 'Pb98', minPrice: 7.24, maxPrice: 7.39 },
        { productName: 'ONEkodiesel', minPrice: 7.49, maxPrice: 7.61 },
        { productName: 'ONArctic2', minPrice: 7.69, maxPrice: 7.89 },
        { productName: 'LPG', minPrice: 2.79, maxPrice: 2.99 }
    ];
    
    const forecastGrid = document.getElementById('forecastGrid');
    forecastGrid.innerHTML = '';
    
    const todayStr = new Date().toLocaleDateString('sv-SE');
    
    forecastData.forEach(data => {
        const card = document.createElement('div');
        card.className = 'fuel-card animate-up';
        
        let cpnTagHtml = '';
        const isOldCpnForecast = todayStr >= '2026-03-31' && todayStr < '2026-07-01';
        const isNewCpnForecast = todayStr >= '2026-08-15' && todayStr < '2026-09-01';
        
        if (data.productName !== 'LPG' && (isOldCpnForecast || isNewCpnForecast)) {
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
    
    // Automatyczne ustawienie komunikatu o wygaśnięciu od razu po otwarciu okienka
    const messageElement = document.getElementById('couponMessage');
    if (messageElement) {
        messageElement.innerHTML = '<i class="bx bx-time-five"></i> Weekendowa promocja wygasła 30 sierpnia.';
        messageElement.style.color = 'var(--error)';
    }
    
    // Ukrywamy odliczanie czasu, bo promocja już się skończyła
    const expirySection = document.querySelector('.expiry-section');
    if (expirySection) expirySection.style.display = 'none';
}

function closeCouponModal() {
    document.getElementById('couponModal').classList.remove('show');
    setTimeout(() => { document.getElementById('couponModal').style.display = 'none'; }, 300);
}

// Globalna zmienna dla interwału, aby uniknąć wielu liczników jednocześnie
let countdownInterval = null;

function selectCoupon(value, element) {
    // Jeśli użytkownik próbuje kliknąć w jakikolwiek rabat (-20gr lub -35gr), blokujemy to
    if (value !== 0) {
        showNotification("Promocja wakacyjna zakończyła się 30 sierpnia.");
        const messageElement = document.getElementById('couponMessage');
        if (messageElement) {
            messageElement.innerHTML = '<i class="bx bx-error-circle"></i> Kupony są już nieaktywne.';
            messageElement.style.color = 'var(--error)';
        }
        return; // Przerywamy funkcję - zniżka się nie naliczy!
    }

    // Pozwalamy jedynie na wybranie opcji "Brak zniżki" (value === 0)
    document.querySelectorAll('.coupon-card').forEach(card => card.classList.remove('active'));
    element.classList.add('active');
    applyCouponLogic(value);
}

function applyCouponLogic(couponValue) {
    const messageElement = document.getElementById('couponMessage');
    const expirySection = document.querySelector('.expiry-section');
    
    if (!originalPrices) return;

    if (couponValue === 0) {
        // --- POWRÓT DO CEN STANDARDOWYCH ---
        Object.keys(originalPrices).forEach(productName => {
            const card = document.getElementById(`fuel-card-${productName}`);
            if (card) {
    const priceElement = card.querySelector('.fuel-price');
    // Szukamy istniejącego badge'a zmiany (ten z procentami), żeby go nie stracić
    const trendBadge = priceElement.querySelector('.price-change');
    const fuelName = card.querySelector('.fuel-name').textContent;

    if (!fuelName.includes('LPG')) {
        const basePrice = parseFloat(originalPrices[productName]);
        let finalContent = "";

        if (couponValue === 0) {
            // Przywracanie: Cena + stary badge trendu
            finalContent = `${basePrice.toFixed(2)} PLN `;
        } else {
            // Rabat: Nowa Cena + Badge Kuponu + stary badge trendu
            const newPrice = (basePrice + couponValue).toFixed(2);
            finalContent = `${newPrice} PLN <span class="coupon-badge">-${Math.abs(couponValue * 100).toFixed(0)} gr</span> `;
        }

        // Jeśli badge trendu istniał, doklejamy go z powrotem na końcu
        if (trendBadge) {
            finalContent += trendBadge.outerHTML;
        }

        priceElement.innerHTML = finalContent;
        
        if (couponValue !== 0) {
            priceElement.classList.add('price-flash');
            setTimeout(() => priceElement.classList.remove('price-flash'), 1000);
        }
    }
}
        });

        messageElement.innerHTML = '<i class="bx bx-info-circle"></i> Kupon usunięty. Ceny standardowe.';
        if (expirySection) expirySection.style.display = 'none';
        if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }

    } else {
        // --- NAKŁADANIE ZNIŻKI ---
        Object.keys(originalPrices).forEach(productName => {
            const card = document.getElementById(`fuel-card-${productName}`);
            if (card) {
                const priceElement = card.querySelector('.fuel-price');
                const fuelName = card.querySelector('.fuel-name').textContent;

                if (!fuelName.includes('LPG')) {
                    const basePrice = parseFloat(originalPrices[productName]);
                    const newPrice = (basePrice + couponValue).toFixed(2);
                    
                    priceElement.innerHTML = `${newPrice} PLN <span class="coupon-badge">-${Math.abs(couponValue * 100).toFixed(0)} gr</span>`;
                    
                    priceElement.classList.add('price-flash');
                    setTimeout(() => priceElement.classList.remove('price-flash'), 1000);
                }
            }
        });
        
        messageElement.innerHTML = `<i class="bx bx-check-circle"></i> Zniżka aktywna: <strong>${Math.abs(couponValue * 100).toFixed(0)} gr/l</strong>`;
        if (expirySection) expirySection.style.display = 'block';
        startCouponCountdown();
    }
}

function startCouponCountdown() {
    const couponExpiryDate = new Date('2026-05-10T23:59:59');
    
    // Czyścimy poprzedni interwał, jeśli istniał
    if (countdownInterval) clearInterval(countdownInterval);
    
    function updateCountdown() {
        const now = new Date();
        const timeLeft = couponExpiryDate - now;
        
        if (timeLeft <= 0) {
            document.getElementById('couponMessage').innerHTML = '<i class="bx bx-error-circle"></i> Kupon wygasł';
            const expirySection = document.querySelector('.expiry-section');
            if(expirySection) expirySection.style.display = 'none';
            clearInterval(countdownInterval);
            return;
        }
        
        const d = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const h = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        // Aktualizacja DOM z zabezpieczeniem przed błędami (padStart dla ładnego wyglądu 01, 02 itd.)
        if(document.getElementById('days')) document.getElementById('days').textContent = d.toString().padStart(2, '0');
        if(document.getElementById('hours')) document.getElementById('hours').textContent = h.toString().padStart(2, '0');
        if(document.getElementById('minutes')) document.getElementById('minutes').textContent = m.toString().padStart(2, '0');
        if(document.getElementById('seconds')) document.getElementById('seconds').textContent = s.toString().padStart(2, '0');
    }
    
    updateCountdown(); // Uruchomienie od razu
    countdownInterval = setInterval(updateCountdown, 1000);
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
        .then(data => {
            const transformedData = data.map(item => {
                const shiftedDateStr = shiftDate(item.effectiveDate.split('T')[0]);
                return {
                    value: item.value,
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
                        // Czyste obliczanie własnej ceny
                        price = calculateRetailPrice(productNameKey, item.value / 1000, item.shiftedDate); 
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
                            monthSum += calculateRetailPrice(productNameKey, it.value / 1000, it.shiftedDate);
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
                const isOldCpnDaily = item.date.length > 7 && item.date >= '2026-03-31' && item.date < '2026-07-01';
                const isNewCpnDaily = item.date.length > 7 && item.date >= '2026-08-15' && item.date < '2026-09-01';
                
                const isOldCpnMonthly = item.date.length === 7 && item.date >= '2026-04' && item.date < '2026-07';
                const isNewCpnMonthly = item.date.length === 7 && item.date === '2026-08';

                if (productNameKey !== 'LPG' && (isOldCpnDaily || isNewCpnDaily || isOldCpnMonthly || isNewCpnMonthly)) {
                    showCpnTag = true;
                }
                const cpnTagHtml = showCpnTag ? ' <span class="cpn-badge">CPN</span>' : '';

                let dateHtml = item.date;
                if (isOldCpnDaily || isNewCpnDaily) {
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
    let dates = [];
    let prices = [];
    
    tableRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length === 2 && !cells[0].textContent.includes('Brak danych')) {
            // Pobieramy czystą datę
            const rawDate = cells[0].innerHTML.split('<br>')[0].trim();
            dates.push(rawDate);
            // Wyciągamy samą liczbę z tekstu "6.47 PLN"
            const priceText = cells[1].textContent.replace('PLN', '').trim();
            prices.push(parseFloat(priceText));
        }
    });
    
    // Tabela zazwyczaj ma najnowsze u góry, na wykresie chcemy chronologicznie (najstarsze po lewej)
    dates.reverse();
    prices.reverse();
    
    if (dates.length === 0) {
        showNotification("Brak danych do wyświetlenia wykresu.");
        return;
    }
    
    const canvas = document.getElementById('priceHistoryChart');
    const ctx = canvas.getContext('2d');
    
    // Tworzenie pięknego gradientu pod linią wykresu (Orlen Red -> Przezroczysty)
    let gradientFill = ctx.createLinearGradient(0, 0, 0, 400);
    gradientFill.addColorStop(0, 'rgba(227, 6, 19, 0.5)'); // Góra (ciemniejsza)
    gradientFill.addColorStop(1, 'rgba(227, 6, 19, 0.0)'); // Dół (zanika)
    
    // Wykrywanie motywu do stylizacji wykresu
    const isDark = document.body.classList.contains('dark-theme');
    const textColor = isDark ? '#b0b8c4' : '#8D99AE';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    const tooltipBg = isDark ? '#1E1E1E' : '#FFFFFF';
    const tooltipText = isDark ? '#FFFFFF' : '#1E1E1E';
    // --- OBLICZANIE STATYSTYK ---
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

    // Aktualizacja HTML
    document.getElementById('statMin').textContent = minPrice.toFixed(2) + ' PLN';
    document.getElementById('statMax').textContent = maxPrice.toFixed(2) + ' PLN';
    document.getElementById('statAvg').textContent = avgPrice.toFixed(2) + ' PLN';
    // ----------------------------
    
    priceHistoryChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Cena',
                data: prices,
                borderColor: '#E30613', // Główny kolor Orlen
                backgroundColor: gradientFill,
                borderWidth: 3,
                pointBackgroundColor: tooltipBg,
                pointBorderColor: '#E30613',
                pointBorderWidth: 2,
                pointRadius: 0, // Ukryte kropki w stanie spoczynku (jak w Apple Stocks)
                pointHoverRadius: 6, // Pojawiają się dopiero przy najechaniu
                pointHitRadius: 15, // Większy obszar łapania myszki
                tension: 0.4, // Zmienia ostre kąty w gładkie, eleganckie fale
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false, // Tooltip pokazuje się od razu po najechaniu na oś, bez celowania w kropkę
            },
            plugins: {
                legend: { 
                    display: false // Wyłączamy nudną legendę
                },
                tooltip: {
                    backgroundColor: tooltipBg,
                    titleColor: tooltipText,
                    bodyColor: '#E30613',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    borderWidth: 1,
                    padding: 12,
                    boxPadding: 4,
                    displayColors: false, // Ukrywa ten mały kwadracik w tooltipie
                    titleFont: { family: 'Poppins', size: 13, weight: 'normal' },
                    bodyFont: { family: 'Outfit', size: 16, weight: '900' },
                    callbacks: {
                        label: function(context) { return `${context.parsed.y.toFixed(2)} PLN`; }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false, drawBorder: false },
                    ticks: {
                        color: textColor,
                        font: { family: 'Poppins', size: 11 },
                        maxTicksLimit: 6 // Żeby daty nie nachodziły na siebie
                    }
                },
                y: {
                    border: { display: false, dash: [5, 5] }, // Przerywane linie pomocnicze w tle
                    grid: { color: gridColor, drawBorder: false },
                    ticks: {
                        color: textColor,
                        font: { family: 'Outfit', size: 13, weight: '600' },
                        padding: 10,
                        callback: function(value) { return value.toFixed(2) + ' zł'; }
                    },
                    // Dynamiczne skalowanie, żeby wykres nie był płaski
                    suggestedMin: Math.min(...prices) * 0.98,
                    suggestedMax: Math.max(...prices) * 1.02
                }
            }
        }
    });
    
    document.getElementById('priceHistoryModal').style.display = 'flex';
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

// --- NOWOŚĆ: Funkcja obliczająca matematyczny trend (Regresja Liniowa) ---
function calculateLinearRegressionSlope(data) {
    const n = data.length;
    if (n < 2) return 0;
    
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    for (let i = 0; i < n; i++) {
        let x = i; 
        let y = data[i].value / 1000; // Cena za litr (PLN)
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
    }
    
    // Zwraca zmianę ceny w PLN na jeden dzień
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
}

// --- ZMODYFIKOWANA FUNKCJA: analyzeMultiFuelTrends ---
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
                    
                    // Skracamy historię do 7 dni, aby reagować na rynek NATYCHMIAST
                    const last7 = data.slice(-7);
                    
                    if (last7.length >= 4) {
                        let slopePLN = calculateLinearRegressionSlope(last7); 
                        
                        // 🚀 DETEKTOR ODBICIA (Momentum 3-dniowe)
                        // Sprawdzamy, czy rynek nagle nie zawrócił w ciągu ostatnich 3 notowań
                        const len = last7.length;
                        const d0 = last7[len-1].value; // dzisiaj
                        const d1 = last7[len-2].value; // wczoraj
                        const d2 = last7[len-3].value; // przedwczoraj
                        
                        // Jeśli rośnie od 3 dni, wymuszamy wzrostowy trend (ignorując wcześniejsze spadki)
                        if (d0 > d1 && d1 >= d2) {
                            const shortSlope = ((d0 - d2) / 2) / 1000;
                            slopePLN = shortSlope > 0 ? shortSlope : Math.abs(slopePLN);
                        } 
                        // Jeśli spada od 3 dni, wymuszamy spadkowy trend
                        else if (d0 < d1 && d1 <= d2) {
                            const shortSlope = ((d0 - d2) / 2) / 1000;
                            slopePLN = shortSlope < 0 ? shortSlope : -Math.abs(slopePLN);
                        }

                        // Prognozowana zmiana na kolejne 7 dni w groszach
                        let diffGrosze = slopePLN * 7 * 100;
                        
                        // Uwzględniamy VAT 23% dla widoku detalicznego
                        let diffValue = window.isNettoMode ? diffGrosze : (diffGrosze * 1.23);
                        
                        allChanges.push(diffValue);
                        globalChangeSum += diffValue;
                        
                        let status = "Stabilnie";
                        let color = "text-blue-600";
                        let icon = "bx-minus";
                        let bgClass = "trend-stable";

                        if (diffValue > 2) { 
                            status = "Wzrost"; color = "text-red-600"; icon = "bx-trending-up"; bgClass = "trend-up";
                        } else if (diffValue < -2) { 
                            status = "Spadek"; color = "text-green-600"; icon = "bx-trending-down"; bgClass = "trend-down";
                        }

                        trendDetails.push({ name: fuel.displayName, status, color, icon, bgClass, diff: diffValue });
                    }
                }
            } catch (e) {
                console.warn(`Błąd analizy dla ${fuel.name}`);
            }
        }

        const avgChange = allChanges.length > 0 ? globalChangeSum / allChanges.length : 0;
        let trendType = 'stable';
        let forecastGrosze = avgChange;
        
        // Stabilność uznajemy w zakresie od -1.5 do +1.5 gr
        if (forecastGrosze > 1.5) {
            trendType = 'up';
        } else if (forecastGrosze < -1.5) {
            trendType = 'down';
        } else {
            trendType = 'stable';
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

// === STREFA KIEROWCY (NETTO/BRUTTO, KALKULATORY) ===

function toggleTax() {
    window.isNettoMode = !window.isNettoMode;
    const btn = document.getElementById('taxToggleBtn');
    
    if (window.isNettoMode) {
        btn.innerHTML = "<i class='bx bx-transfer'></i> Pokaż ceny Brutto";
        btn.classList.replace('btn-secondary', 'btn-primary');
        showNotification("Widok cen hurtowych Netto (bez VAT/Akcyzy)");
    } else {
        btn.innerHTML = "<i class='bx bx-transfer'></i> Pokaż ceny Netto";
        btn.classList.replace('btn-primary', 'btn-secondary');
        showNotification("Przywrócono ceny detaliczne Brutto");
    }
    
    // Przeliczenie kart na nowo
    renderAllFuels();
}

function runAllCalculations() {
    if (Object.keys(originalPrices).length === 0) return;

    // Pobranie stałych z kart paliw (lub awaryjnie średnich rynkowych)
    const pb95Price = parseFloat(originalPrices['Pb95']) || 6.50;
    const lpgPrice = parseFloat(originalPrices['LPG']) || 2.99;
    
    // 1. KOSZT PODRÓŻY I PUNKTY VITAY
    const dist = parseFloat(document.getElementById('calcDistance').value) || 0;
    const cons = parseFloat(document.getElementById('calcConsumption').value) || 0;
    const fuel = document.getElementById('calcFuelType').value;
    const fuelPrice = parseFloat(originalPrices[fuel]) || 6.50;
    
    const liters = (dist / 100) * cons;
    const travelCost = liters * fuelPrice;
    
    const pointsPerLiter = (fuel === 'Pb98' || fuel === 'ONArctic2') ? 8 : 4;
    const vitayPoints = Math.floor(liters * pointsPerLiter);
    const coffees = Math.floor(vitayPoints / 1200);
    const vitayRewardStr = coffees > 0 
        ? `☕ Wystarczy na ${coffees} darmową kawę Vitay!` 
        : `Brakuje ${1200 - vitayPoints} pkt do darmowej kawy.`;

    document.getElementById('travelResult').innerHTML = `
        Wymagane paliwo: <strong>${liters.toFixed(1)} l</strong><br>
        Koszt podróży: <strong>${travelCost.toFixed(2)} PLN</strong><br>
        Zdobyte punkty: <span class="vitay-points">${vitayPoints} pkt</span><br>
        <span style="font-size: 0.8rem; color: var(--text-light);">${vitayRewardStr}</span>
    `;

    // 2. PORÓWNYWARKA SPALINA VS EV
    const evCons = parseFloat(document.getElementById('evConsumption').value) || 0;
    const evRate = parseFloat(document.getElementById('evChargeType').value) || 0;
    
    const evCost100km = evCons * evRate;
    const iceCost100km = cons * fuelPrice;
    const diff = iceCost100km - evCost100km;

    let diffText = diff > 0 
        ? `<strong style="color: var(--success)">${diff.toFixed(2)} PLN taniej w EV</strong>` 
        : `<strong style="color: var(--error)">${Math.abs(diff).toFixed(2)} PLN taniej w spalinie</strong>`;

    document.getElementById('evResult').innerHTML = `
        Koszt EV na 100km: <strong>${evCost100km.toFixed(2)} PLN</strong><br>
        Porównanie (na 100km): ${diffText}
    `;

    // 3. REALNE OSZCZĘDNOŚCI Z KUPONU
    const sLiters = parseFloat(document.getElementById('savingsLiters').value) || 0;
    const sCoupon = parseFloat(document.getElementById('savingsCoupon').value) || 0;
    const totalSavings = sLiters * sCoupon;
    
    document.getElementById('savingsResult').innerHTML = `
        Zostaje w portfelu: <strong style="color: var(--success)">${totalSavings.toFixed(2)} PLN</strong>
    `;

    // 4. OPŁACALNOŚĆ LPG
    const yearlyKm = parseFloat(document.getElementById('lpgYearly').value) || 0;
    const lpgSetupCost = parseFloat(document.getElementById('lpgCost').value) || 0;
    
    const yearlyPbCost = (yearlyKm / 100) * cons * pb95Price;
    const lpgCons = cons * 1.15; // Samochód na gaz pali ok. 15% więcej
    const yearlyLpgCost = (yearlyKm / 100) * lpgCons * lpgPrice;
    const yearlySavingsLPG = yearlyPbCost - yearlyLpgCost;
    
    let monthsToReturn = 0;
    if (yearlySavingsLPG > 0) {
        monthsToReturn = (lpgSetupCost / (yearlySavingsLPG / 12)).toFixed(1);
    }

    document.getElementById('lpgResult').innerHTML = `
        Zwrot z inwestycji po: <strong>${monthsToReturn > 0 ? monthsToReturn + ' miesiącach' : 'Brak zwrotu'}</strong><br>
        Roczne oszczędności netto: <strong style="color: var(--success)">${yearlySavingsLPG > 0 ? yearlySavingsLPG.toFixed(2) + ' PLN' : '0.00 PLN'}</strong>
    `;
}

// Podpięcie automatycznego obliczenia po załadowaniu danych z API
const originalProcessFuelDataCalc = window.processFuelData;
window.processFuelData = function(data) {
    originalProcessFuelDataCalc(data);
    setTimeout(runAllCalculations, 1500); // Uruchamia kalkulator jak już zaciągnie API
};


// === UDOSTĘPNIANIE JAKO ZDJĘCIE (Z NAPRAWIONYM OBCINANIEM) ===
async function shareApp() {
    showNotification("Przygotowuję zdjęcie do udostępnienia...");
    
    const container = document.getElementById('container');
    const buttons = document.querySelector('.action-buttons');
    if (buttons) buttons.style.display = 'none';
    
    // NAPRAWA BŁĘDU: Zapisujemy obecną pozycję i przewijamy na samą górę.
    // Dzięki temu html2canvas nie utnie zawartości ekranu.
    const originalScrollPos = window.scrollY;
    window.scrollTo(0, 0);
    
    // Czekamy ułamek sekundy, aby przeglądarka odświeżyła widok po przewinięciu
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
        const canvas = await html2canvas(container, {
            scale: 2, 
            useCORS: true,
            allowTaint: true,
            scrollY: 0,
            backgroundColor: document.body.classList.contains('dark-theme') ? '#121212' : '#F8F9FA'
        });
        
        // Przywracamy przyciski i wracamy do poprzedniego miejsca na stronie
        if (buttons) buttons.style.display = 'flex';
        window.scrollTo(0, originalScrollPos);
        
        canvas.toBlob(async (blob) => {
            const file = new File([blob], 'ceny-paliw-orlen.png', { type: 'image/png' });
            
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        title: 'Aktualne Ceny Paliw',
                        text: 'Zobacz najnowsze ceny paliw! 🚗⛽',
                        files: [file]
                    });
                } catch (err) {
                    console.log('Udostępnianie przerwane', err);
                }
            } else {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'ceny-paliw-orlen.png';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showNotification("Zapisano obrazek na urządzeniu!");
            }
        }, 'image/png');
        
    } catch (error) {
        console.error("Błąd podczas generowania zdjęcia:", error);
        showNotification("Wystąpił błąd przy generowaniu obrazka.");
        if (buttons) buttons.style.display = 'flex';
        window.scrollTo(0, originalScrollPos);
    }
}


// === PROFESJONALNE GENEROWANIE PDF (Z POLSKIMI ZNAKAMI) ===
function generatePDFReport() {
    if (typeof html2pdf === 'undefined') {
        showNotification("Błąd: Biblioteka PDF nie została załadowana.");
        return;
    }
    
    const tableBody = document.getElementById('historyTableBody');
    if (!tableBody || tableBody.innerHTML.trim() === '' || tableBody.innerHTML.includes('Brak danych')) {
        showNotification("Brak danych do wygenerowania raportu.");
        return;
    }
    
    showNotification("Generowanie raportu PDF...");
    
    const fuelSelect = document.getElementById('fuelType');
    const fuelName = fuelSelect.options[fuelSelect.selectedIndex].text;
    const viewOption = document.querySelector('input[name="dataView"]:checked').value;
    const viewText = viewOption === 'daily' ? 'dzienne' : 'średnie miesięczne';
    
    // Tworzymy ukryty, czysty dokument HTML do wydruku
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px'; // Ukrywamy go poza ekranem
    container.style.top = '0';
    container.style.width = '800px';
    container.style.padding = '40px';
    container.style.backgroundColor = '#ffffff';
    container.style.color = '#1e1e1e';
    container.style.fontFamily = 'Arial, sans-serif';
    
    // Nagłówek raportu
    container.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #E30613; margin-bottom: 10px; font-size: 28px;">Raport Rynkowy - Ceny Paliw</h1>
            <h3 style="color: #2B2D42; margin-top: 0; font-size: 18px;">Wybrane paliwo: <strong>${fuelName}</strong></h3>
        </div>
        <div style="margin-bottom: 30px; font-size: 14px; color: #555;">
            <p style="margin: 5px 0;"><strong>Typ zestawienia:</strong> Notowania ${viewText}</p>
            <p style="margin: 5px 0;"><strong>Data wygenerowania:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
    `;
    
    // Generowanie czystej tabeli
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr style="background-color: #E30613; color: white;">
            <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Data Notowania</th>
            <th style="padding: 12px; border: 1px solid #ddd; text-align: right;">Cena Detaliczna (PLN)</th>
        </tr>
    `;
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    const rows = tableBody.querySelectorAll('tr');
    
    rows.forEach((tr, index) => {
        const tds = tr.querySelectorAll('td');
        if (tds.length === 2) {
            // Czyścimy datę i cenę ze śmieci HTML (np. znaczki CPN)
            const dateText = tds[0].innerHTML.split('<br>')[0].trim().replace(/<[^>]*>?/gm, '');
            const priceText = tds[1].textContent.trim().replace(/CPN/g, '');
            const bg = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
            
            const newTr = document.createElement('tr');
            newTr.style.backgroundColor = bg;
            newTr.innerHTML = `
                <td style="padding: 12px; border: 1px solid #ddd; text-align: left;">${dateText}</td>
                <td style="padding: 12px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${priceText}</td>
            `;
            tbody.appendChild(newTr);
        }
    });
    
    table.appendChild(tbody);
    container.appendChild(table);
    
    // MUSIMY dodać kontener do DOM, żeby html2pdf go poprawnie zrenderował
    document.body.appendChild(container);
    
    const opt = {
        margin:       10,
        filename:     `Raport_Cen_${fuelName.replace(/\s+/g, '_')}_${new Date().toLocaleDateString()}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(container).save().then(() => {
        // Po pobraniu usuwamy ukryty kontener
        document.body.removeChild(container);
        showNotification("Pobieranie pliku PDF powiodło się!");
    });
}

// === SYMULATOR DYSTRYBUTORA PALIWA ===
let pumpInterval = null;
let currentLiters = 0;
let maxLiters = 50;
let simPricePerLiter = 0;

function openDispenserModal() {
    document.getElementById('dispenserModal').style.display = 'block';
    setTimeout(() => { document.getElementById('dispenserModal').classList.add('show'); }, 10);
    resetDispenser();
}

function closeDispenserModal() {
    document.getElementById('dispenserModal').classList.remove('show');
    setTimeout(() => { document.getElementById('dispenserModal').style.display = 'none'; }, 300);
    stopPumping();
}

function updateDispenserPrice() {
    const fuelType = document.getElementById('simFuel').value;
    // Pobiera dzisiejszą cenę z głównego skryptu aplikacji
    simPricePerLiter = parseFloat(originalPrices[fuelType]); 
    
    // Jeśli z jakiegoś powodu cena nie jest gotowa (dane się ładują), dajemy fallback
    if (isNaN(simPricePerLiter) || simPricePerLiter === 0) {
        simPricePerLiter = 6.50; 
    }
    
    document.getElementById('simPricePerLiter').innerText = simPricePerLiter.toFixed(2);
    updateDispenserDisplay();
}

function resetDispenser() {
    stopPumping();
    currentLiters = 0;
    
    // Odczytanie danych o wybranym samochodzie (bak, paliwo)
    const vehicleData = document.getElementById('simVehicle').value.split(',');
    maxLiters = parseFloat(vehicleData[0]);
    
    // Auto-przełączanie pistoletu na właściwe paliwo do wybranego auta
    document.getElementById('simFuel').value = vehicleData[1];
    
    updateDispenserPrice();
}

function startPumping(e) {
    if (e && e.cancelable) e.preventDefault(); // Blokuje domyślne akcje dotyku (przewijanie ekranu)
    
    const pumpBtn = document.getElementById('pumpButton');
    pumpBtn.classList.add('active'); // Wymuszony efekt wciśnięcia

    if (currentLiters >= maxLiters) return; // Jeśli pełny, nie tankujemy
    
    // Lekka wibracja telefonu przy rozpoczęciu tankowania (Android)
    if (navigator.vibrate) navigator.vibrate(30);
    
    // Uruchomienie licznika uderzającego co 50ms
    pumpInterval = setInterval(() => {
        if (currentLiters >= maxLiters) {
            stopPumping();
            currentLiters = maxLiters; // Utrzymaj równe maksimum
            updateDispenserDisplay();
            showNotification(`Odbija! Bak jest pełny (${maxLiters} L).`);
            
            // Podwójna wibracja na znak odskoczenia pistoletu
            if (navigator.vibrate) navigator.vibrate([100, 50, 200]); 
        } else {
            // Zmieniona logika: Wolniejsze i losowe tankowanie
            // Generuje losowy skok wartości od ok. 0.04 do 0.09 litra
            let randomIncrement = (Math.random() * (0.09 - 0.04) + 0.04);
            
            currentLiters += randomIncrement; 
            if (currentLiters > maxLiters) currentLiters = maxLiters; // Blokada ułamków
            updateDispenserDisplay();
        }
    }, 50);
}

function stopPumping(e) {
    if (e && e.cancelable && e.type !== 'mouseleave') e.preventDefault();
    
    const pumpBtn = document.getElementById('pumpButton');
    pumpBtn.classList.remove('active');
    
    if (pumpInterval) {
        clearInterval(pumpInterval);
        pumpInterval = null;
    }
}

function updateDispenserDisplay() {
    const totalCost = currentLiters * simPricePerLiter;
    
    // Aktualizacja cyfr z zachowaniem formatu 0.00
    document.getElementById('simTotalLiters').innerText = currentLiters.toFixed(2);
    document.getElementById('simTotalCost').innerText = totalCost.toFixed(2);
}

// === POBIERANIE CEN Z NIEMIEC (NA ŻYWO Z API + PORÓWNANIE) ===
function fetchGermanData() {
    const germanGrid = document.getElementById('germanFuelGrid');
    germanGrid.innerHTML = '<div class="spinner" style="margin: 2rem auto;"></div>';

    // PODMIEŃ NA ADRES SWOJEGO WORKERA:
    const WORKER_URL = "https://de-fuelprices.kacpiq.workers.dev/"; 

    fetch(WORKER_URL)
        .then(res => {
            if (!res.ok) throw new Error("Błąd sieci HTTP: " + res.status);
            return res.json();
        })
        .then(data => {
            germanGrid.innerHTML = '';

            if (!data.stations || data.stations.length === 0) {
                germanGrid.innerHTML = '<p style="text-align:center; width:100%; color: var(--text-light);">Brak dostępnych stacji w wybranym rejonie.</p>';
                return;
            }

            // Pobieramy najbliższą/pierwszą stację z listy
            const station = data.stations[0];
            const exchangeRate = data.exchange_rate_eur_pln;

            const fuelsDE = [
                { id: 'Pb95', name: 'Pb95 (E10)', priceEur: station.prices_eur.pb95_e10, pricePln: station.prices_pln.pb95_e10 },
                { id: 'Pb98', name: 'Pb98 (E5)', priceEur: station.prices_eur.pb98_e5, pricePln: station.prices_pln.pb98_e5 },
                { id: 'ONEkodiesel', name: 'Diesel', priceEur: station.prices_eur.diesel, pricePln: station.prices_pln.diesel }
            ];

            fuelsDE.forEach(fuel => {
                if (!fuel.priceEur || !fuel.pricePln) return; // Jeśli stacja nie ma danego paliwa, pomijamy

                const card = document.createElement('div');
                card.className = 'fuel-card animate-up'; // Wykorzystuje klasy Twojego szablonu
                card.style.display = 'flex';
                card.style.flexDirection = 'column';
                card.style.justifyContent = 'space-between';

                const iconSrc = productIcons[fuel.id] || ''; // Korzysta z Twojej bazy ikon

                // Logika Niemieckiej Ceny (Indeks górny dla ostatniej cyfry)
                const eurString = fuel.priceEur.toFixed(3);
                const mainEurPart = eurString.slice(0, -1);
                const lastDigit = eurString.slice(-1);

                // Logika porównania z polskim Orlenem
                let comparisonHtml = '';
                const plPriceStr = originalPrices[fuel.id];

                if (plPriceStr) {
                    const plPrice = parseFloat(plPriceStr);
                    const dePrice = fuel.pricePln;
                    const diff = dePrice - plPrice;

                    if (Math.abs(diff) < 0.02) {
                        comparisonHtml = `
                            <div style="margin-bottom: 14px; background: rgba(33, 150, 243, 0.1); color: var(--info); padding: 10px 14px; border-radius: 12px; font-size: 0.85rem; font-weight: 700; display: flex; align-items: center; justify-content: space-between; border: 1px solid rgba(33, 150, 243, 0.2);">
                                <span style="display: flex; align-items: center; gap: 6px;"><i class='bx bx-transfer-alt' style="font-size: 1.1rem;"></i> Zbliżone ceny</span>
                                <span>${plPrice.toFixed(2)} PLN w PL</span>
                            </div>
                        `;
                    } else if (diff > 0) {
                        comparisonHtml = `
                            <div style="margin-bottom: 14px; background: rgba(76, 175, 80, 0.1); color: var(--success); padding: 10px 14px; border-radius: 12px; font-size: 0.85rem; font-weight: 700; display: flex; align-items: center; justify-content: space-between; border: 1px solid rgba(76, 175, 80, 0.2);">
                                <span style="display: flex; align-items: center; gap: 6px;"><i class='bx bx-check-circle' style="font-size: 1.1rem;"></i> W Polsce taniej</span>
                                <span>o ${diff.toFixed(2)} PLN/l</span>
                            </div>
                        `;
                    } else {
                        comparisonHtml = `
                            <div style="margin-bottom: 14px; background: rgba(227, 6, 19, 0.1); color: var(--error); padding: 10px 14px; border-radius: 12px; font-size: 0.85rem; font-weight: 700; display: flex; align-items: center; justify-content: space-between; border: 1px solid rgba(227, 6, 19, 0.2);">
                                <span style="display: flex; align-items: center; gap: 6px;"><i class='bx bx-error-circle' style="font-size: 1.1rem;"></i> W Niemczech taniej</span>
                                <span>o ${Math.abs(diff).toFixed(2)} PLN/l</span>
                            </div>
                        `;
                    }
                }

                card.innerHTML = `
                    <div class="fuel-header" style="margin-bottom: 0;">
                        <img src="${iconSrc}" alt="${fuel.name}" class="fuel-icon">
                        <div class="fuel-name" style="display: flex; align-items: center; gap: 8px;">
                            ${fuel.name} 
                            <span style="background: linear-gradient(135deg, #1e2022, #2b2d42); color: #fff; font-size: 0.65rem; padding: 3px 8px; border-radius: 6px; font-weight: 900; letter-spacing: 1px; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">🇩🇪 DE</span>
                        </div>
                    </div>
                    
                    <div class="fuel-price" style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; margin: 1.2rem 0; flex-wrap: wrap; gap: 10px;">
                        <div style="display: flex; align-items: baseline; gap: 4px;">
                            <span style="font-size: 2.4rem; font-weight: 900; color: var(--primary); line-height: 1; font-family: 'Outfit', sans-serif; text-shadow: 0 2px 10px rgba(227, 6, 19, 0.1);">${fuel.pricePln.toFixed(2)}</span>
                            <span style="font-size: 0.9rem; font-weight: 800; color: var(--primary);">PLN</span>
                        </div>
                        <div style="display: inline-flex; align-items: center; background: rgba(128,128,128,0.06); padding: 4px 12px 4px 4px; border-radius: 50px; border: 1px solid rgba(128,128,128,0.12);">
                            <div style="background: var(--text); color: var(--card-bg); width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
                                <i class='bx bx-euro' style="font-size: 1rem;"></i>
                            </div>
                            <span style="font-size: 1.2rem; font-weight: 800; color: var(--text); font-family: 'Outfit', sans-serif; letter-spacing: 0.5px;">
                                ${mainEurPart}<sup style="font-size: 0.65em; top: -0.4em; position: relative; font-weight: 900; margin-left: 1px;">${lastDigit}</sup>
                            </span>
                        </div>
                    </div>
                    
                    ${comparisonHtml}
                    
                    <div style="background: rgba(128,128,128,0.04); border-radius: 12px; padding: 12px; border: 1px solid rgba(128,128,128,0.08); margin-top: auto;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <span style="color: var(--text-light); font-size: 0.75rem; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                                <i class='bx bxs-gas-pump' style="font-size: 0.9rem;"></i> Stacja
                            </span>
                            <strong style="color: var(--text); font-size: 0.85rem; font-family: 'Outfit', sans-serif; letter-spacing: 0.5px;">${station.brand} (${station.place})</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <span style="color: var(--text-light); font-size: 0.75rem; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                                <i class='bx bx-line-chart' style="font-size: 0.9rem;"></i> Kurs NBP
                            </span>
                            <strong style="color: var(--text); font-size: 0.85rem; font-family: 'Outfit', sans-serif; letter-spacing: 0.5px;">1 EUR = ${exchangeRate.toFixed(2)} PLN</strong>
                        </div>
                        <div style="display: flex; justify-content: flex-end; align-items: center; border-top: 1px dashed rgba(128,128,128,0.15); padding-top: 6px; font-size: 0.7rem; color: var(--text-light);">
                            <span>Źródło: <a href="https://www.tankerkoenig.de" target="_blank" rel="noopener noreferrer" style="color: var(--text-light); text-decoration: underline;">Tankerkönig (CC BY 4.0)</a></span>
                        </div>
                    </div>
                `;
                germanGrid.appendChild(card);
            });
        })
        .catch(err => {
            console.error(err);
            germanGrid.innerHTML = `
                <div style="text-align:center; width:100%; padding: 2rem;">
                    <p style="color: var(--error); font-weight: 600;">Nie udało się pobrać danych z Niemiec.</p>
                    <button class="btn btn-secondary" onclick="fetchGermanData()" style="margin-top: 10px;">Spróbuj ponownie</button>
                </div>
            `;
        });
}
