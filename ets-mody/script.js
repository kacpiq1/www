document.addEventListener("DOMContentLoaded", () => {
    const checkboxes = document.querySelectorAll(".mod-selection input[type='checkbox']");
    const orderContainer = document.querySelector(".selected-mods .order");
    const counterDisplay = document.querySelector("#activeModsCounter");
    const downloadModsButton = document.querySelector("#downloadModsButton");
    const downloadModal = document.querySelector("#downloadModal");
    const closeModal = document.querySelector("#closeModal");
    const modsTableBody = document.querySelector("#modsTable tbody");

    // Mapowanie nazw paczek na nazwy wyświetlane
    const modNames = {
        polreb: "Poland Rebuilding",
        promods: "ProMods",
        "promods convoy": "ProMods Convoy Support",
        promodstc: "ProMods Trailer & Company Pack",
        promodsme: "ProMods Middle East Add on",
        mapaeaa: "Mapa EAA",
        pbmap: "Project Balkans",
        roex: "Roextended",
        rusmap: "RusMap",
        srmap: "Southern Region",
        tgsmap: "ProMods - The Great Steppe",
        googlemaps: "Google Maps"
    };

    // Mapowanie paczek na linki
    const modLinks = {
        polreb: ["https://polandrebuilding.pl/download"],
        promods: ["https://promods.net/setup.php?game=ets"],
        "promods convoy": ["https://steamcommunity.com/sharedfiles/filedetails/?id=2637561037"],
        promodstc: ["https://promods.net/extra.php?mod=tcp"],
        promodsme: ["https://promods.net/setup.php?game=me"],
        mapaeaa: ["https://www.modland.net/euro-truck-simulator-2/maps/mapa-eaa.html"],
        pbmap: ["https://allmods.net/euro-truck-simulator-2/ets-2-maps/project-balkans-v-2-8-promods-addon-for-1-31-x/"],
        roex: ["https://roextended.ro/roextended.html"],
        rusmap: ["https://www.modland.net/euro-truck-simulator-2/maps/rusmap.html"],
        srmap: ["https://example.com"],
        tgsmap: ["https://promods.net/setup.php?game=tgs"],
        googlemaps: [
            "https://steamcommunity.com/workshop/filedetails/?l=polish&id=2115873179",
            "https://steamcommunity.com/sharedfiles/filedetails/?id=1147652266"
        ]
    };

    // Status modyfikacji
    const modStatus = {};

    // Funkcja do przenoszenia paczek do selected-mods
    function toggleModPackages(packageName, isChecked) {
        const modElements = document.querySelectorAll(`.order .mod-package[data-package="${packageName}"]`);

        modElements.forEach(modElement => {
            if (isChecked) {
                modElement.style.display = "flex";
                if (!orderContainer.contains(modElement)) {
                    orderContainer.appendChild(modElement);
                }
            } else {
                modElement.style.display = "none";
            }
        });

        updateActiveModsCounter();
    }

    // Funkcja do sprawdzania widoczności ProMods Definition Package
    function updateProModsDefinitionVisibility() {
        const convoyModeCheckbox = document.querySelector('.mod-selection input[type="checkbox"][data-package="promods convoy"]');
        const defPackage = document.querySelector('.order .mod-package[data-package="promods"]');

        if (convoyModeCheckbox && convoyModeCheckbox.checked) {
            if (defPackage) {
                defPackage.style.display = "none"; // Ukryj ProMods Definition Package, gdy Convoy Mode jest zaznaczone
            }
        } else {
            if (defPackage) {
                defPackage.style.display = "flex"; // Pokaż ProMods Definition Package, gdy Convoy Mode nie jest zaznaczone
            }
        }
    }

    // Funkcja do aktualizacji liczby aktywnych modyfikacji na podstawie widocznych elementów
    function updateActiveModsCounter() {
        const activeMods = document.querySelectorAll(".order .mod-package[style*='display: flex']");
        counterDisplay.textContent = `Aktywne modyfikacje: ${activeMods.length}`;
    }

    // Resetowanie zaznaczeń checkboxów przy załadowaniu strony
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });

    // Ustawienie domyślnie zaznaczonych checkboxów dla "Poland Rebuilding" i "ProMods"
    const defaultCheckedPackages = ["promods"];
    defaultCheckedPackages.forEach(packageName => {
        const checkbox = document.querySelector(`.mod-selection input[type='checkbox'][data-package="${packageName}"]`);
        if (checkbox) {
            checkbox.checked = true;
            toggleModPackages(packageName, true);
        }
    });

    // Obsługa zmiany zaznaczenia checkboxa
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener("change", () => {
            const packageName = checkbox.dataset.package;
            const isChecked = checkbox.checked;

            toggleModPackages(packageName, isChecked);
            updateProModsDefinitionVisibility();
        });
    });

    // Funkcja do zaznaczenia domyślnych modyfikacji po kliknięciu przycisku
    document.querySelector("#selectCurrentModsButton").addEventListener("click", () => {
        const selectedPackages = [
            "promodsdlc",
            "promods convoy",
            "googlemaps",
            "promods"
        ];

        selectedPackages.forEach(packageName => {
            const checkbox = document.querySelector(`.mod-selection input[type='checkbox'][data-package="${packageName}"]`);
            if (checkbox) {
                checkbox.checked = true;
                toggleModPackages(packageName, true);
            }
        });

        updateProModsDefinitionVisibility();
        updateActiveModsCounter();
        generateModsTable(); // Aktualizuj tabelę w oknie modalnym
    });

    // Funkcja generowania tabeli
function generateModsTable() {
    modsTableBody.innerHTML = "";

    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            const packageName = checkbox.dataset.package;
            const displayName = modNames[packageName];

            if (displayName) {
                const row = document.createElement("tr");

                // Nazwa modu
                const nameCell = document.createElement("td");
                nameCell.textContent = displayName;
                row.appendChild(nameCell);

                if (packageName === "polreb") {
                    const warning = document.createElement("span");
                    warning.textContent = " NIEKOMPATYBILNE Z WERSJĄ 1.53";
                    warning.style.color = "red";
                    warning.style.marginLeft = "10px";
                    nameCell.appendChild(warning);
                }

                // Przycisk pobierania
                const downloadCell = document.createElement("td");
                const downloadButton = document.createElement("button");
                downloadButton.className = "download-button";
                downloadButton.dataset.package = packageName;

                // Obsługa kliknięcia w przycisk pobierania
                downloadButton.addEventListener("click", () => {
                    const links = modLinks[packageName] || [];
                    links.forEach(link => window.open(link, "_blank"));
                    modStatus[packageName] = "downloaded"; // Oznacz jako pobrane
                    updateModsTable(); // Aktualizuj tabelę
                });

                downloadCell.appendChild(downloadButton);
                row.appendChild(downloadCell);

                // Status pobrania
                const statusCell = document.createElement("td");
                statusCell.textContent = modStatus[packageName] === "downloaded" ? "✅" : "⌛";
                statusCell.className =
                    modStatus[packageName] === "downloaded" ? "status-downloaded" : "status-waiting";
                row.appendChild(statusCell);

                modsTableBody.appendChild(row);
            }
        }
    });
}

    // Aktualizacja tabeli
    function updateModsTable() {
        generateModsTable();
    }

    // Obsługa otwierania modala
    downloadModsButton.addEventListener("click", () => {
        downloadModal.style.display = "flex";
        generateModsTable();
    });

    // Obsługa zamykania modala
    closeModal.addEventListener("click", () => {
        downloadModal.style.display = "none";
    });

    // Zamknij modal, jeśli kliknięto poza jego zawartością
    window.addEventListener("click", event => {
        if (event.target === downloadModal) {
            downloadModal.style.display = "none";
        }
    });

    // Początkowa aktualizacja liczników
    updateProModsDefinitionVisibility();
    updateActiveModsCounter();
});
