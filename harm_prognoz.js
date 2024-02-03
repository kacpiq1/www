document.addEventListener('DOMContentLoaded', function () {
    // Funkcja do aktualizacji prognoz
    function updatePrognoza() {
        // Zdefiniuj godziny prognoz na dzień i na noc
        const godzinaPrognozaDzien = 11; // 11:30
        const godzinaPrognozaNoc = 19; // 19:00

        // Pobierz aktualną datę
        const currentTime = new Date();

        // Utwórz datę prognozy na dzień dla dzisiaj
        const prognozaDzien1 = getNextPrognozaDate(currentTime, godzinaPrognozaDzien);
        
        // Utwórz datę prognozy na noc dla dzisiaj
        const prognozaNoc1 = getNextPrognozaDate(currentTime, godzinaPrognozaNoc);
        
        // Utwórz datę prognozy na dzień dla jutrzejszego dnia
        const prognozaDzien2 = getNextPrognozaDate(new Date(currentTime.setDate(currentTime.getDate() + 1)), godzinaPrognozaDzien);
        
        // Utwórz datę prognozy na noc dla jutrzejszego dnia
        const prognozaNoc2 = getNextPrognozaDate(new Date(currentTime.setDate(currentTime.getDate() + 1)), godzinaPrognozaNoc);

        // Ukryj wszystkie prognozy
        const prognozaElements = document.querySelectorAll('.education-content');
        prognozaElements.forEach(element => {
            element.style.display = 'none';
        });

        // Sprawdź, która prognoza jest aktualna i pokaż ją
        if (currentTime < prognozaNoc1) {
            showPrognoza('countdown1', prognozaDzien1, 'Prognoza na dzień');
        } else if (currentTime < prognozaDzien2) {
            showPrognoza('countdown2', prognozaNoc1, 'Prognoza na noc');
        } else {
            // Tutaj dodaj obsługę kolejnych dat prognoz, jeśli są dostępne
            showPrognoza('countdown3', prognozaDzien2, 'Prognoza na dzień');
        }
    }

    // Funkcja do pokazywania prognozy w danym elemencie
    function showPrognoza(elementId, targetDate, title) {
        const element = document.getElementById(elementId);

        // Sprawdź, czy czas osiągnął 0s
        if (targetDate <= new Date()) {
            element.innerHTML = `
                <div class="content">
                    <div class="year">Prognoza jest już dostępna</div>
                    <h3>${title}</h3>
                    <p></p>
                </div>
            `;
        } else {
            // W przeciwnym razie wyświetl odliczanie
            element.innerHTML = countdownHTML(targetDate, title);
        }

        // Pokaż całą kolumnę
        element.closest('.education-column').style.display = 'flex';
        element.style.display = 'block';
    }

    // Funkcja do uzyskiwania HTML z odliczenia czasu
    function countdownHTML(targetDate, title) {
        const currentTime = new Date();
        const diff = targetDate - currentTime;

        let days = Math.floor(diff / (1000 * 60 * 60 * 24));
        let hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        let minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        let seconds = Math.floor((diff % (1000 * 60)) / 1000);

        let timeString = '';

        if (days > 0) {
            timeString = `${days}d ${hours}h`;
        } else if (hours > 0) {
            timeString = `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            timeString = `${minutes}m ${seconds}s`;
        } else {
            timeString = `${seconds}s`;
        }

        const dateText = targetDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric' });

        return `
            <div class="content">
                <div class="year"><i class='bx bxs-time' ></i> ${timeString}</div>
                <h3>${title} (${dateText})</h3>
                <p></p>
            </div>
        `;
    }

    // Funkcja do uzyskiwania następnej daty prognozy na dzień
    function getNextPrognozaDate(currentDate, hour) {
        const nextDate = new Date(currentDate);
        nextDate.setHours(hour, 30, 0, 0); // Ustaw godzinę prognozy na dzień
        return nextDate;
    }

    // Wywołaj funkcję po załadowaniu strony
    updatePrognoza();

    // Aktualizuj prognozy co sekundę
    setInterval(updatePrognoza, 1000);
});
