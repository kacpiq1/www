document.addEventListener("DOMContentLoaded", () => {
    const checkboxes = document.querySelectorAll(".mod-selection input[type='checkbox']");
    const orderContainer = document.querySelector(".selected-mods .order");
    const counterDisplay = document.querySelector("#activeModsCounter");

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
    const defaultCheckedPackages = ["polreb", "promods"];
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
    });

    // Aktualizacja widoczności i liczby przy załadowaniu strony
    updateProModsDefinitionVisibility();
    updateActiveModsCounter();
});
