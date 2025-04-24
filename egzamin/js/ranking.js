// Ranking functionality with Firebase
document.addEventListener("DOMContentLoaded", function() {
    // Firebase configuration
    const firebaseConfig = {
        apiKey: "AIzaSyA303t0WQ0EyjXLHrRa0PiE8lgK1-Ch0FE",
        authDomain: "kacpiq-egz-wyniki.firebaseapp.com",
        databaseURL: "https://kacpiq-egz-wyniki-default-rtdb.europe-west1.firebasedatabase.app/",
        projectId: "kacpiq-egz-wyniki",
        storageBucket: "kacpiq-egz-wyniki.firebasestorage.app",
        messagingSenderId: "925929166432",
        appId: "1:925929166432:web:81756e7675f468b8d19505",
        measurementId: "G-Z8ZFL73Q6Q"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();

    // Load student ranking
    async function loadStudentRanking() {
        const tbody = document.querySelector("#ranking-table tbody");
        tbody.innerHTML = `<tr><td colspan="3">Wczytywanie...</td></tr>`;

        try {
            const snapshot = await db.ref('uczniowie').once('value');
            if (!snapshot.exists()) {
                tbody.innerHTML = `<tr><td colspan="3">Brak danych</td></tr>`;
                return;
            }

            const uczniowie = snapshot.val();
            const ranking = [];

            for (const numer in uczniowie) {
                const egzaminy = uczniowie[numer].egzaminy || {};
                let sumaWynik = 0;
                let sumaMax = 0;

                for (const egzaminId in egzaminy) {
                    const egzamin = egzaminy[egzaminId];
                    sumaWynik += egzamin.wynik || 0;
                    sumaMax += egzamin.max || 0;
                }

                if (sumaMax > 0) {
                    const procent = Math.round((sumaWynik / sumaMax) * 100);
                    ranking.push({
                        numer,
                        suma: `${sumaWynik}/${sumaMax}`,
                        procent,
                    });
                }
            }

            ranking.sort((a, b) => b.procent - a.procent);

            tbody.innerHTML = "";
            let separatorInserted = false;

            ranking.forEach((uczen, index) => {
                if (!separatorInserted && uczen.procent < 75) {
                    const separatorRow = document.createElement("tr");
                    separatorRow.innerHTML = `
                        <td colspan="3" class="ranking-separator">
                            ──── Próg zdawalności 75% ────
                        </td>
                    `;
                    tbody.appendChild(separatorRow);
                    separatorInserted = true;
                }

                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${index < 3 ? ['🥇', '🥈', '🥉'][index] + ' ' : ''}${uczen.numer}</td>
                    <td>${uczen.suma}</td>
                    <td>${uczen.procent}%</td>
                `;
                tbody.appendChild(tr);
            });

        } catch (error) {
            console.error("Error loading ranking:", error);
            tbody.innerHTML = `<tr><td colspan="3">Błąd podczas ładowania danych</td></tr>`;
        }
    }

    // Load ranking when modal opens
    document.getElementById("open-ranking-modal")?.addEventListener("click", loadStudentRanking);
});