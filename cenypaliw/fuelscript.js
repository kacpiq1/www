<script>
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
                        item.productName !== 'Pb98' && 
                        item.productName !== 'ONArctic2' && 
                        item.productName !== 'OnEkoterm' &&
                        item.productName !== 'LPG'
                    ).map(item => {
                        let taxRate = 0;
                        if (item.productName === 'Pb95' || item.productName === 'ONEkodiesel') {
                            taxRate = 0.26;
                        } else if (item.productName === 'ONArctic2') {
                            taxRate = 0.23;
                        }

                        let valueWithTax = (item.value / 1000) * (1 + taxRate);
                        let valueWithoutTax = item.value / 1000;
                        return {
                            productName: item.productName,
                            valueWithTax: valueWithTax.toFixed(2),
                            valueWithoutTax: valueWithoutTax.toFixed(2)
                        };
                    });

                    // Dodaj cenę Pb98 i ONArctic2 do danych
                    let pb98ValueWithTax, onArctic2ValueWithTax;
                    filteredData.forEach(item => {
                        if (item.productName === 'Pb95') {
                            pb98ValueWithTax = parseFloat(item.valueWithTax) + 0.60;
                        } else if (item.productName === 'ONEkodiesel') {
                            onArctic2ValueWithTax = parseFloat(item.valueWithTax) + 0.20;
                        }
                    });
                    if (pb98ValueWithTax !== undefined) {
                        filteredData.push({
                            productName: 'Pb98',
                            valueWithTax: pb98ValueWithTax.toFixed(2),
                            valueWithoutTax: (pb98ValueWithTax - 0.60).toFixed(2)
                        });
                    }
                    if (onArctic2ValueWithTax !== undefined) {
                        filteredData.push({
                            productName: 'ONArctic2',
                            valueWithTax: onArctic2ValueWithTax.toFixed(2),
                            valueWithoutTax: (onArctic2ValueWithTax - 0.20).toFixed(2)
                        });
                    }

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
    </script>