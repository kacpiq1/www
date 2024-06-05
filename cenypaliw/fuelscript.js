// Funkcja wywoływana przy zamknięciu modala dla urządzeń mobilnych
                function closeMobileModal() {
            document.getElementById('mobileModal').style.display = 'none';
        }

       function closeInfoModal() {
    document.getElementById('infoModal').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('infoModal').style.display = 'none';
    }, 500);
}

        function closeInfoModalAndAcknowledge() {
    closeInfoModal();
}
        function showInfoModal() {
    document.getElementById('infoModal').style.display = 'block';
    setTimeout(() => {
        document.getElementById('infoModal').style.opacity = '1';
    }, 100);
}


        // Sprawdzenie, czy urządzenie jest mobilne
        function isMobileDevice() {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        }

        // Wyświetlenie modala dla urządzeń mobilnych
        window.onload = function() {
             showInfoModal()
            if (isMobileDevice()) {
                document.getElementById('mobileModal').style.display = 'block';
            }
        };

        const proxyUrl = 'https://api.allorigins.win/get?url=';
        const targetUrl = 'https://tool.orlen.pl/api/wholesalefuelprices';
        const productIcons = {
            'Pb95': 'img/efecta95.png',
            'Pb98': 'img/verva98.png',
            'LPG': 'img/lpg.png',
            'ONEkodiesel': 'img/efectadiesel.png',
            'ONArctic2': 'img/vervadiesel.png'
        };

        function fetchData() {
            // Pokaż komunikat o odświeżeniu danych
            showNotification("Odświeżono dane.");
            document.getElementById('loadingHistory').style.display = 'block';

            // Wyświetl komunikat o ładowaniu
            document.getElementById('loading').style.display = 'block';
            document.getElementById('container').style.display = 'none';

            // Pobierz dane o cenach paliw
            fetch(proxyUrl + encodeURIComponent(targetUrl))
                .then(response => response.json())
                .then(data => {
                    // Przetwórz pobrane dane
                    const jsonData = JSON.parse(data.contents);

                    // Pobierz datę ostatniej aktualizacji i wyświetl informację
                    const publishFrom = jsonData[0]?.publishFrom?.replace('T', ' ') || 'brak danych';
                    document.getElementById('updateInfo').textContent = `Ostatnia aktualizacja: ${publishFrom}`;

                    // Przygotuj dane dotyczące paliw: Pb95, Pb98, ONEkodiesel, ONArctic2
                    const filteredData = jsonData.filter(item => 
                item.productName === 'Pb95' || 
                item.productName === 'ONEkodiesel' ||
                item.productName === 'Pb98' || 
                item.productName === 'ONArctic2'
            ).map(item => {
                let taxRate = 0;
                if (item.productName === 'Pb95' || item.productName === 'ONEkodiesel' || item.productName === 'ONArctic2') {
                    taxRate = 0.26;
                } else if (item.productName === 'Pb98') {
                    taxRate = 0.31; 
                }

                let valueWithTax = (item.value / 1000) * (1 + taxRate);
                let valueWithoutTax = item.value / 1000;
                return {
                    productName: item.productName,
                    valueWithTax: valueWithTax.toFixed(2),
                    valueWithoutTax: valueWithoutTax.toFixed(2)
                };
            });

            // Wyświetl dane na stronie
            const tableBody = document.getElementById('fuelTableBody');
            tableBody.innerHTML = '';
            filteredData.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><img class="icon" src="${productIcons[item.productName]}" alt="${item.productName}"></td>
                    <td class="bold" style="font-family: 'Outfit', sans-serif;">${item.valueWithTax}</td>
                    <td class="bold" style="font-family: 'Outfit', sans-serif;">${item.valueWithoutTax}</td>
                `;
                tableBody.appendChild(row);
            });

                    // Ukryj komunikat o ładowaniu
                    document.getElementById('loading').style.display = 'none';
                    document.getElementById('container').style.display = 'block';
                });

            fetch(proxyUrl + encodeURIComponent('https://tool.orlen.pl/api/autogasprices'))
            .then(response => response.json())
            .then(responseData => {
                // Przetwórz pobrane dane
                const data = JSON.parse(responseData.contents);

                const lpgTaxRate = 0.27;

                if (Array.isArray(data)) {
                    const małopolskieData = data.find(entry => entry.locationName.toLowerCase() === 'małopolskie');
                    if (małopolskieData) {
                        const lpgValue = małopolskieData.value * (1 + lpgTaxRate);
                        // Wyświetl cenę LPG
                        const lpgRow = document.createElement('tr');
                        lpgRow.innerHTML = `
                            <td><img class="icon" src="img/lpg.png" alt="LPG"></td>
                            <td class="bold" style="font-family: 'Outfit', sans-serif;">${lpgValue.toFixed(2)}</td>
                            <td class="bold" style="font-family: 'Outfit', sans-serif;">${małopolskieData.value.toFixed(2)}</td>
                        `;
                        const tableBody = document.getElementById('fuelTableBody');
                        tableBody.appendChild(lpgRow);
                    } else {
                        console.log('Brak danych dla województwa Małopolskiego.');
                    }
                } else {
                    console.log('Received data is not an array:', data);
                }
            })
            .catch(error => console.error('Error fetching LPG data:', error));
        }

        function processForecastData() {
    const forecastData = [
        { productName: 'Pb95', minPrice: 6.44, maxPrice: 6.55 },
        { productName: 'Pb98', minPrice: 7.12, maxPrice: 7.25 },
        { productName: 'LPG', minPrice: 2.70, maxPrice: 2.77 },
        { productName: 'ONEkodiesel', minPrice: 6.46, maxPrice: 6.58 },
        { productName: 'ONArctic2', minPrice: 6.66, maxPrice: 6.89 }
    ];

    const forecastTableBody = document.getElementById('forecastFuelTableBody');
    forecastTableBody.innerHTML = '';

    forecastData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><img class="icon" src="${productIcons[item.productName]}" alt="${item.productName}"></td>
            <td class="bold">${item.minPrice.toFixed(2)} - ${item.maxPrice.toFixed(2)}</td>
        `;
        forecastTableBody.appendChild(row);

    });

}

// Wywołanie funkcji przetwarzania danych prognozowanych cen paliw
processForecastData();

const webhookUrl = 'https://discord.com/api/webhooks/1247690376257601557/-_1ihSfqvKzrViQ6NCdQhx6GwdMxw-gZ968Jv0q-8yzeQT_Bhb8EOGJm85yuDxhZznrN';

// Funkcja wyświetlająca modal błędu
function displayErrorModal(errorMessage) {
    document.getElementById('errorMessage').textContent = errorMessage;
    document.getElementById('errorModal').style.display = 'block';
}

// Funkcja zamykająca modal błędu
function closeErrorModal() {
    document.getElementById('errorModal').style.display = 'none';
}

// Funkcja wysyłająca zgłoszenie błędu do Discord
function sendErrorReport() {
    const errorMessage = document.getElementById('errorMessage').textContent;

    fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            content: `Zgłoszono błąd na stronie: ${errorMessage}`
        })
    })
    .then(response => {
        if (response.ok) {
            alert('Błąd został zgłoszony pomyślnie.');
            closeErrorModal();
        } else {
            alert('Wystąpił problem podczas zgłaszania błędu.');
        }
    })
    .catch(error => {
        console.error('Error reporting to Discord:', error);
        alert('Wystąpił problem podczas zgłaszania błędu.');
    });
}

// Funkcja do obsługi błędów
window.onerror = function(message, source, lineno, colno, error) {
    const errorMessage = `Error: ${message} at ${source}:${lineno}:${colno}`;
    console.error(errorMessage);
    displayErrorModal(errorMessage);
    return true; // Prevent the default handling of the error
};

// Dla błędów promise
window.addEventListener('unhandledrejection', event => {
    const errorMessage = `Unhandled promise rejection: ${event.reason}`;
    console.error(errorMessage);
    displayErrorModal(errorMessage);
});

        function showNotification(message) {
            const notification = document.getElementById('notification');
            notification.textContent = message;
            notification.style.display = 'block';

            setTimeout(() => {
                notification.style.display = 'none';
            }, 3000);
        }
        function closePriceHistoryModal() {
    document.getElementById('priceHistoryModal').style.display = 'none';
}

    let priceHistoryChart; // Zmienna globalna przechowująca wykres

function showPriceHistoryChart() {
    // Sprawdź, czy istnieje już wykres i zniszcz go
    if (priceHistoryChart) {
        priceHistoryChart.destroy();
    }

    // Pobierz dane z tabeli historii cen paliw
    const tableRows = document.querySelectorAll('#historyTableBody tr');
    const dates = [];
    const prices = [];

    tableRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        dates.push(cells[0].textContent);
        prices.push(parseFloat(cells[1].textContent));
    });

    // Utwórz wykres
    const ctx = document.getElementById('priceHistoryChart').getContext('2d');
    priceHistoryChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Cena paliwa (PLN)',
                backgroundColor: 'rgba(227, 6, 19, 0.2)',
                borderColor: 'rgba(227, 6, 19, 1)',
                borderWidth: 2,
                data: prices,
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Wyświetl modal z wykresem
    document.getElementById('priceHistoryModal').style.display = 'block';
}


        function startCountdown() {
            const countdownElement = document.getElementById('countdown');
            let seconds = 300;

            function updateCountdown() {
                const minutes = Math.floor(seconds / 60);
                const remainingSeconds = seconds % 60;
                countdownElement.textContent = `Odświeżenie za ${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
                seconds--;

                if (seconds < 0) {
                    fetchData();
                } else {
                    setTimeout(updateCountdown, 1000);
                }
            }

            updateCountdown();
        }

        function saveThemeToLocalStorage(theme) {
        localStorage.setItem('theme', theme);
    }

    function loadThemeFromLocalStorage() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.body.classList.add(savedTheme);
            isDarkTheme = savedTheme === 'dark-theme';
        } else {
            document.body.classList.add('light-theme');
        }
    }

    let isDarkTheme = false;

    function toggleTheme() {
        const body = document.body;
        if (isDarkTheme) {
            body.classList.replace('dark-theme', 'light-theme');
            saveThemeToLocalStorage('light-theme');
        } else {
            body.classList.replace('light-theme', 'dark-theme');
            saveThemeToLocalStorage('dark-theme');
        }
        isDarkTheme = !isDarkTheme;
    }

        function toggleHistory() {
            document.getElementById('historyModal').style.display = 'block';
            fetchHistoryData();
        }

        function closeHistoryModal() {
            document.getElementById('historyModal').style.display = 'none';
        }

        function getYears() {

    const years = [2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
    const yearSelect = document.getElementById('year');
    yearSelect.innerHTML = '';
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    });
            yearSelect.value = 2024;
}


        function fetchHistoryData() {
    displayHistoryLoadingModal();
    document.getElementById('loadingHistory').style.display = 'block';

    const fuelType = document.getElementById('fuelType').value;
    const selectedYear = document.getElementById('year').value;
    const productId = fuelType.split('-')[0];

    let additionalCost = 0;
    let taxRateH = 1;

    if (productId == 41) {
        taxRateH = 0.26;
    } else if (productId == 42) {
        taxRateH = 0.31;
    } else if (productId == 43) {
        taxRateH = 0.26;
    } else if (productId == 44) {
        taxRateH = 0.26;
    }

    const historyUrl = 'https://corsproxy.io/?' + `https://tool.orlen.pl/api/wholesalefuelprices/ByProduct?productId=${productId}&from=${selectedYear}-01-01&to=${selectedYear}-12-31`;

    fetch(historyUrl)
        .then(response => response.json())
        .then(historyData => {
            const historyTableBody = document.getElementById('historyTableBody');
            historyTableBody.innerHTML = '';


            if (historyData.length === 0) {
                const noDataMessage = document.createElement('tr');
                noDataMessage.innerHTML = `<td colspan="2">Dla wybranego roku, nie ma danych o cenach.</td>`;
                historyTableBody.appendChild(noDataMessage);
            } else {

            historyData.forEach(item => {
                const totalPrice = item.value + additionalCost;
                const row = document.createElement('tr');
                const effectiveDate = item.effectiveDate.replace('T00:00:00', '');
                const valueWithTax = (item.value / 1000) * (1 + taxRateH);
                row.innerHTML = `
                    <td>${effectiveDate}</td>
                    <td>${valueWithTax.toFixed(2)}</td>
                `;
                historyTableBody.appendChild(row);
            });
        }

            document.getElementById('loadingHistory').style.display = 'none';
            closeHistoryLoadingModal();
        })
        .catch(error => {
            console.error('Error fetching history data:', error);
            displayHistoryError('Wystąpił błąd podczas pobierania danych');
            closeHistoryLoadingModal();
        });
}

        document.addEventListener('DOMContentLoaded', fetchData);
        loadThemeFromLocalStorage();
