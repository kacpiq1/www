document.addEventListener("DOMContentLoaded", function() {
    const buttonsContainer = document.getElementById('buttons-container');
    const stormWarningsDiv = document.getElementById('storm-warnings');

    const daysToGenerate = 7; // Generujemy przyciski na 7 dni
    const times = [
        { label: 'Dzień', hour: 20, duration: 12 }, // 08:00 - 20:00
        { label: 'Noc', hour: 8, duration: 12 }   // 20:00 - 08:00 następnego dnia
    ];

    generateButtons();

    function generateButtons() {
        const now = new Date();
        for (let i = 0; i < daysToGenerate; i++) {
            const date = new Date(now);
            date.setDate(now.getDate() + i);
            times.forEach(time => {
                const timestamp = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), time.hour, 0, 0) / 1000;
                checkDataAvailability(timestamp, time.label, date, time.duration);
            });
        }
    }

    function checkDataAvailability(timestamp, label, date, duration) {
        const apiUrl = `https://corsproxy.io/?https://meteo.imgw.pl/api/v1/forecast/text/2d?token=p4DXKjsYadfBV21TYrDk&terytCode=00&time=${timestamp}`;

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                if (data.data.forecast.forecast.images.asPng.asBase64) {
                    const button = document.createElement('button');
                    let displayDate = `${date.toLocaleDateString('pl-PL')}`;
                    if (label === 'Noc') {
                        const previousDay = new Date(date);
                        previousDay.setDate(date.getDate() - 1);
                        displayDate = `${previousDay.toLocaleDateString('pl-PL')} / ${date.toLocaleDateString('pl-PL')}`;
                    }
                    button.textContent = `${label} (${displayDate})`;
                    button.addEventListener('click', () => {
                        // Usuwamy klasę selected z aktualnie zaznaczonego przycisku
                        const currentSelected = document.querySelector('button.selected');
                        if (currentSelected) {
                            currentSelected.classList.remove('selected');
                        }
                        // Dodajemy klasę selected do klikniętego przycisku
                        button.classList.add('selected');
                        displayStormWarning(data, label, date, duration);
                    });
                    buttonsContainer.appendChild(button);
                }
            })
            .catch(error => {
                console.error('Error checking data availability:', error);
            });
    }

    function displayStormWarning(data, label, date, duration) {
        stormWarningsDiv.innerHTML = ''; // Czyszczenie poprzednich ostrzeżeń
        const base64Image = data.data.forecast.forecast.images.asPng.asBase64;
        const img = document.createElement('img');
        img.src = `data:image/png;base64,${base64Image}`;
        
        const validFrom = new Date(date);
        validFrom.setUTCHours(label === 'Dzień' ? 8 : 20, 0, 0, 0);
        
        const validTo = new Date(validFrom);
        validTo.setHours(validTo.getHours() + duration);

        const info = document.createElement('p');
        info.textContent = `Ważność: od ${validFrom.toLocaleString('pl-PL', { timeZone: 'GMT' })} do ${validTo.toLocaleString('pl-PL', { timeZone: 'GMT' })} 
        | Ważność dla nocy pokazywana powyżej jest niepoprawna. Zapoznaj się z ilustracją!`;
        

        stormWarningsDiv.appendChild(info);
        stormWarningsDiv.appendChild(img);
    }
});
