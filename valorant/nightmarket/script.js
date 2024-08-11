document.addEventListener('DOMContentLoaded', () => {
    const skins = [
        { name: "Reaver Vandal", type: "Vandal", price: 1775, imgSrc: "https://example.com/reaver_vandal.jpg" },
        { name: "Prime Phantom", type: "Phantom", price: 1775, imgSrc: "https://example.com/prime_phantom.jpg" },
        { name: "Elderflame Operator", type: "Operator", price: 2475, imgSrc: "https://example.com/elderflame_operator.jpg" },
        { name: "Oni Claw", type: "Melee", price: 3550, imgSrc: "https://example.com/oni_claw.jpg" },
        { name: "Glitchpop Vandal", type: "Vandal", price: 2175, imgSrc: "https://example.com/glitchpop_vandal.jpg" },
        { name: "Spline Phantom", type: "Phantom", price: 1775, imgSrc: "https://example.com/spline_phantom.jpg" },
        // Dodaj więcej skinów według potrzeby
    ];

    const rarities = ["Select", "Deluxe", "Premium", "Exclusive", "Ultra"];
    const discounts = [10, 20, 30, 40, 50]; // Procentowe obniżki

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
    const selectedSkins = [];

    while (selectedSkins.length < 6) {
        const randomIndex = Math.floor(Math.random() * skins.length);
        if (!selectedSkins.includes(skins[randomIndex])) {
            selectedSkins.push(skins[randomIndex]);
        }
    }

    selectedSkins.forEach(skin => {
        const card = document.createElement('div');
        card.classList.add('card');
        
        const img = document.createElement('img');
        img.src = skin.imgSrc;
        img.alt = skin.name;

        const info = document.createElement('div');
        info.classList.add('info');

        const rarity = document.createElement('p');
        rarity.textContent = `Rzadkość: ${rarities[Math.floor(Math.random() * rarities.length)]}`;

        const discount = document.createElement('p');
        discount.textContent = `Promocja: ${discounts[Math.floor(Math.random() * discounts.length)]}%`;

        info.appendChild(rarity);
        info.appendChild(discount);

        card.appendChild(img);
        card.appendChild(info);

        cardsContainer.appendChild(card);

        card.addEventListener('click', () => {
            card.classList.add('revealed');
            const skinDetails = document.createElement('div');
            skinDetails.classList.add('skin-details');

            const name = document.createElement('p');
            name.textContent = skin.name;

            const type = document.createElement('p');
            type.textContent = `Rodzaj: ${skin.type}`;

            const price = document.createElement('p');
            price.textContent = `Cena: ${skin.price} VP`;

            skinDetails.appendChild(name);
            skinDetails.appendChild(type);
            skinDetails.appendChild(price);

            card.appendChild(skinDetails);
        });
    });
});