document.addEventListener('DOMContentLoaded', () => {
    const lessons = [
        { time: "11:50-12:35", day: 1, subject: "Geografia", teacher: "Bukowiec Anna", room: "G1" },
        { time: "12:40-13:25", day: 1, subject: "Wychowanie fizyczne", teacher: "Konieczna Ewa", room: "H1" },
        { time: "13:30-14:15", day: 1, subject: "Język angielski", teacher: "Pobiedacz-Mucha Joanna", room: "22" },
        { time: "14:20-15:05", day: 1, subject: "Administrowanie serwerowymi systemami operacyjnymi", teacher: "Pławecki Andrzej", room: "17" },
        { time: "15:15-16:00", day: 1, subject: "Administrowanie serwerowymi systemami operacyjnymi", teacher: "Pławecki Andrzej", room: "17" },
        { time: "16:05-16:50", day: 1, subject: "Matematyka", teacher: "Migdał Anna", room: "07" },
        { time: "16:55-17:40", day: 1, subject: "Język polski", teacher: "Zagórska-Kunat Monika", room: "22" },

        { time: "10:00-10:45", day: 2, subject: "Język angielski", teacher: "Pobiedacz-Mucha Joanna", room: "03" },
        { time: "11:00-11:45", day: 2, subject: "Matematyka rozszerzona", teacher: "Migdał Anna", room: "14" },
        { time: "11:50-12:35", day: 2, subject: "Matematyka rozszerzona", teacher: "Migdał Anna", room: "14" },
        { time: "12:40-13:25", day: 2, subject: "Fizyka", teacher: "Mirochna Kinga", room: "13" },
        { time: "13:30-14:15", day: 2, subject: "Religia", teacher: "Wszołek-Wojnicka Anna", room: "05" },
        { time: "14:20-15:05", day: 2, subject: "Język polski", teacher: "Zagórska-Kunat Monika", room: "22" },

        { time: "11:50-12:35", day: 3, subject: "Zajęcia z wychowawcą", teacher: "Pobiedacz-Mucha Joanna", room: "CZYT" },
        { time: "12:40-13:25", day: 3, subject: "Wychowanie fizyczne", teacher: "Konieczna Ewa", room: "Hfit" },
        { time: "13:30-14:15", day: 3, subject: "Wychowanie fizyczne", teacher: "Konieczna Ewa", room: "Hfit" },
        { time: "14:20-15:05", day: 3, subject: "Matematyka", teacher: "Migdał Anna", room: "20" },
        { time: "15:15-16:00", day: 3, subject: "Matematyka", teacher: "Migdał Anna", room: "20" },
        { time: "16:05-16:50", day: 3, subject: "Język niemiecki", teacher: "Lis-Błąkała Kamila", room: "11" },
        { time: "16:55-17:40", day: 3, subject: "Język niemiecki", teacher: "Lis-Błąkała Kamila", room: "11" },
        { time: "17:45-18:30", day: 3, subject: "Montaż i eksploatacja lokalnej sieci komputerowej", teacher: "Pławecki Andrzej", room: "17" },
        { time: "18:35-19:20", day: 3, subject: "Montaż i eksploatacja lokalnej sieci komputerowej", teacher: "Pławecki Andrzej", room: "17" },

        { time: "11:50-12:35", day: 4, subject: "Historia", teacher: "Gąsiorek Bernadetta", room: "09" },
        { time: "12:40-13:25", day: 4, subject: "Religia", teacher: "Wszołek-Wojnicka Anna", room: "05" },
        { time: "13:30-14:15", day: 4, subject: "Historia i teraźniejszość", teacher: "Kwiatek Marcin", room: "S30" },
        { time: "14:20-15:05", day: 4, subject: "Przygotowanie stanowiska komputerowego do pracy", teacher: "Grzywacz Grzegorz", room: "17" },
        { time: "15:15-16:00", day: 4, subject: "Przygotowanie stanowiska komputerowego do pracy", teacher: "Grzywacz Grzegorz", room: "17" },
        { time: "16:05-16:50", day: 4, subject: "Naprawa urządzeń techniki komputerowej", teacher: "Sudoł Aleksander", room: "06" },
        { time: "16:55-17:40", day: 4, subject: "Naprawa urządzeń techniki komputerowej", teacher: "Sudoł Aleksander", room: "06" },
        { time: "17:45-18:30", day: 4, subject: "Naprawa urządzeń techniki komputerowej", teacher: "Sudoł Aleksander", room: "06" },
        { time: "18:35-19:20", day: 4, subject: "Informatyka", teacher: "Pietras Anna", room: "W11" },

        { time: "13:30-14:15", day: 5, subject: "Język polski", teacher: "Zagórska-Kunat Monika", room: "W22" },
        { time: "14:20-15:05", day: 5, subject: "Geografia", teacher: "Bukowiec Anna", room: "G1" },
        { time: "15:15-16:00", day: 5, subject: "Montaż i eksploatacja lokalnej sieci komputerowej", teacher: "Pławecki Andrzej", room: "17" },
        { time: "16:05-16:50", day: 5, subject: "Podstawy przedsiębiorczości", teacher: "Brdej Anna", room: "04" },
        { time: "16:55-17:40", day: 5, subject: "Fizyka", teacher: "Mirochna Kinga", room: "13" },
        { time: "17:45-18:30", day: 5, subject: "Administrowanie serwerowymi systemami operacyjnymi", teacher: "Pławecki Andrzej", room: "17" },
        { time: "18:35-19:20", day: 5, subject: "Administrowanie serwerowymi systemami operacyjnymi", teacher: "Pławecki Andrzej", room: "17" },
    ];

    const lessonsContainer = document.getElementById('lessons-container');
    const currentStatus = document.getElementById('current-status');
    const dateDisplay = document.getElementById('current-date');
    const calendarInput = document.getElementById('calendar-input');
    const prevDayButton = document.getElementById('prev-day');
    const nextDayButton = document.getElementById('next-day');

    const startDate = new Date('2024-09-03');
    const endDate = new Date('2024-12-20');

    // Definicja numeru lekcji na podstawie godzin
    const lessonTimes = [
        { start: "07:30", end: "08:15", number: 1 },
        { start: "08:20", end: "09:05", number: 2 },
        { start: "09:10", end: "09:55", number: 3 },
        { start: "10:00", end: "10:45", number: 4 },
        { start: "11:00", end: "11:45", number: 5 },
        { start: "11:50", end: "12:35", number: 6 },
        { start: "12:40", end: "13:25", number: 7 },
        { start: "13:30", end: "14:15", number: 8 },
        { start: "14:20", end: "15:05", number: 9 },
        { start: "15:15", end: "16:00", number: 10 },
        { start: "16:05", end: "16:50", number: 11 },
        { start: "16:55", end: "17:40", number: 12 },
        { start: "17:45", end: "18:30", number: 13 },
        { start: "18:35", end: "19:20", number: 14 },
    ];

    // Funkcja do przypisania numeru lekcji na podstawie czasu
    function getLessonNumber(lessonTime) {
        const [start] = lessonTime.split('-');
        const matchingTime = lessonTimes.find(time => time.start === start);
        return matchingTime ? matchingTime.number : '?'; // '?' jeśli nie znaleziono numeru lekcji
    }

    // Formatowanie daty do czytelnej formy
    function formatDate(date) {
        return date.toLocaleDateString('pl-PL', {
            weekday: 'long',
            day: 'numeric',
            month: 'numeric',
            year: 'numeric'
        });
    }

    // Oblicz czas pozostały do zakończenia aktualnej lekcji
    function calculateRemainingTime(lessonTime) {
        const [start, end] = lessonTime.split('-');
        const [endHour, endMinute] = end.split(':').map(Number);
        const now = new Date();
        const endTime = new Date(now);
        endTime.setHours(endHour, endMinute, 0, 0);

        const timeDiff = endTime - now; // różnica w ms
        const minutesRemaining = Math.floor(timeDiff / 60000); // konwersja na minuty
        return minutesRemaining;
    }

    // Wyświetl aktualny status lekcji
    function updateCurrentStatus() {
        const now = new Date();
        const currentDay = now.getDay(); // Pobierz bieżący dzień tygodnia
        const currentTime = now.getHours() + ':' + (now.getMinutes().toString().padStart(2, '0'));

        const currentLesson = lessons.find(lesson => {
            const [start, end] = lesson.time.split('-');
            return lesson.day === currentDay && start <= currentTime && end >= currentTime;
        });

        if (currentLesson) {
            const minutesRemaining = calculateRemainingTime(currentLesson.time);
            currentStatus.innerHTML = `Aktualna lekcja: ${currentLesson.subject} - Sala ${currentLesson.room} <br></br>Jeszcze ${minutesRemaining} min.`;
        } else {
            currentStatus.innerHTML = 'Obecnie nie trwa żadna lekcja.';
        }
    }

    // Wyświetl lekcje dla wybranego dnia
    function updateLessonsForDate(date) {
        const dayIndex = date.getDay(); // 0 = Niedziela, 1 = Poniedziałek, itd.
        lessonsContainer.innerHTML = ''; // Wyczyść kontener lekcji

        if (dayIndex === 0 || dayIndex === 6) { // Weekend
            lessonsContainer.innerHTML = '<p>Brak lekcji w tym dniu.</p>';
            return;
        }

        const lessonsForDay = lessons.filter(lesson => lesson.day === dayIndex);

        if (lessonsForDay.length === 0) {
            lessonsContainer.innerHTML = '<p>Brak lekcji w tym dniu.</p>';
            return;
        }

        lessonsForDay.forEach((lesson, index) => {
            const lessonDiv = document.createElement('div');
            lessonDiv.className = 'lesson';

            const lessonNumber = getLessonNumber(lesson.time);

            lessonDiv.innerHTML = `
                <div class="lesson-number">${lessonNumber}</div>
                <div class="lesson-info">
                    <div class="lesson-subject">${lesson.subject}</div>
                    <div class="lesson-details">
                        <span class="lesson-time">${lesson.time}</span>
                        <span class="lesson-room">${lesson.room}</span>
                    </div>
                    <div class="lesson-teacher">${lesson.teacher}</div>
                </div>
            `;
            lessonsContainer.appendChild(lessonDiv);
        });
    }

    // Obsługa zmiany daty
    function updateDateDisplay(date) {
        dateDisplay.textContent = formatDate(date);
    }

    // Inicjalizacja kalendarza
    let selectedDate = new Date();

    function updateCalendar() {
        updateDateDisplay(selectedDate);
        updateLessonsForDate(selectedDate);
    }

    // Obsługa strzałek zmiany dnia
    prevDayButton.addEventListener('click', () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() - 1);

        if (newDate >= startDate) {
            selectedDate = newDate;
            updateCalendar();
        }
    });

    nextDayButton.addEventListener('click', () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() + 1);

        if (newDate <= endDate) {
            selectedDate = newDate;
            updateCalendar();
        }
    });

    // Obsługa bezpośredniego wyboru daty z kalendarza
    calendarInput.addEventListener('change', (e) => {
        const newDate = new Date(e.target.value);
        if (newDate >= startDate && newDate <= endDate) {
            selectedDate = newDate;
            updateCalendar();
        }
    });

    // Aktualizuj status lekcji co minutę
    setInterval(updateCurrentStatus, 60000);

    // Inicjalne wyświetlenie
    updateCalendar();
    updateCurrentStatus();
});