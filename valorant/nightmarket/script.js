document.addEventListener('DOMContentLoaded', () => {
    const skins = [
        { id: 1, name: "Reaver Vandal", type: "Vandal", price: 1775, imgSrc: "https://example.com/reaver_vandal.jpg" },
        { id: 2, name: "Prime Phantom", type: "Phantom", price: 1775, imgSrc: "https://example.com/prime_phantom.jpg" },
        { id: 3, name: "Elderflame Operator", type: "Operator", price: 2475, imgSrc: "https://example.com/elderflame_operator.jpg" },
        { id: 4, name: "Oni Claw", type: "Melee", price: 3550, imgSrc: "https://example.com/oni_claw.jpg" },
        // Dodaj więcej skinów według potrzeby
    ];

    const nightMarketStart = new Date("2023-09-01");
    const nightMarketEnd = new Date("2023-09-15");
    const currentDate = new Date();
    const marketStatus = document.getElementById('market-status');

    let daysUntilEvent;

    if (currentDate >= nightMarketStart && currentDate <= nightMarketEnd) {
        daysUntilEvent = Math.ceil((nightMarketEnd - currentDate) / (1000 * 60 * 60 * 24));
        marketStatus.textContent = `Night Market kończy się za ${daysUntilEvent} dni.`;
    } else {
        daysUntilEvent = Math.ceil((nightMarketStart - currentDate) / (1000 * 60 * 60 * 24));
        marketStatus.textContent = `Night Market zaczyna się za ${daysUntilEvent} dni.`;
    }

    const cardsContainer = document.getElementById('cards-container');

    skins.forEach(skin => {
        const card = document.createElement('div');
        card.classList.add('card');
        
        const img = document.createElement('img');
        img.src = skin.imgSrc;
        img.alt = skin.name;

        const name = document.createElement('p');
        name.textContent = skin.name;

        const type = document.createElement('p');
        type.textContent = `Rodzaj: ${skin.type}`;

        const price = document.createElement('p');
        price.textContent = `Cena: ${skin.price} VP`;

        card.appendChild(img);
        card.appendChild(name);
        card.appendChild(type);
        card.appendChild(price);

        cardsContainer.appendChild(card);

        card.addEventListener('click', () => {
            // Tutaj możesz dodać logikę do obsługi kliknięcia karty
            alert(`Wybrany skin: ${skin.name}`);
        });
    });
});