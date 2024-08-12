const skins = [
    { name: "Reaver Knife", rarity: "Exclusive", price: 3550, image: "reaver_knife.jpg" },
    { name: "Magepunk Guardian", rarity: "Select", price: 1775, image: "magepunk_guardian.jpg" },
    { name: "Ion Operator", rarity: "Select", price: 1775, image: "ion_operator.jpg" },
    { name: "Minima Sheriff", rarity: "Deluxe", price: 1275, image: "minima_sheriff.jpg" },
    { name: "Oni Shorty", rarity: "Premium", price: 1775, image: "oni_shorty.jpg" },
    { name: "Ego Vandal", rarity: "Ultra", price: 1775, image: "ego_vandal.jpg" }
];

const discounts = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49];

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function calculateDiscountPrice(price, discount) {
    return Math.floor(price * ((100 - discount) / 100));
}

function updateMarketStatus() {
    const marketStatusElement = document.getElementById("market-status");
    const now = new Date();
    const marketStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 3); // Najbliższy czwartek
    const marketEnd = new Date(marketStart);
    marketEnd.setDate(marketEnd.getDate() + 14);

    if (now < marketStart) {
        const daysUntilStart = Math.ceil((marketStart - now) / (1000 * 60 * 60 * 24));
        marketStatusElement.textContent = `Night Market starts in ${daysUntilStart} days`;
    } else if (now >= marketStart && now <= marketEnd) {
        const daysUntilEnd = Math.ceil((marketEnd - now) / (1000 * 60 * 60 * 24));
        marketStatusElement.textContent = `Night Market ends in ${daysUntilEnd} days`;
    } else {
        const daysUntilNextStart = Math.ceil((marketStart.setDate(marketStart.getDate() + 7) - now) / (1000 * 60 * 60 * 24));
        marketStatusElement.textContent = `Night Market starts in ${daysUntilNextStart} days`;
    }
}

function createCard(skin) {
    const card = document.createElement("div");
    card.classList.add("card", skin.rarity.toLowerCase());

    const discount = getRandomElement(discounts);
    const discountedPrice = calculateDiscountPrice(skin.price, discount);

    card.innerHTML = `
        <div class="discount">-${discount}%</div>
        <div class="original-price">${skin.price}</div>
        <div class="discounted-price">${discountedPrice} VP</div>
        <div class="info">
            Rzadkość: ${skin.rarity}
        </div>
        <div class="skin-details">
            <img src="${skin.image}" alt="${skin.name}">
            <div>${skin.name}</div>
        </div>
    `;

    card.addEventListener("click", () => {
        card.classList.toggle("revealed");
    });

    return card;
}

function populateMarket() {
    const cardsContainer = document.getElementById("cards-container");
    skins.forEach(skin => {
        const card = createCard(skin);
        cardsContainer.appendChild(card);
    });
}

updateMarketStatus();
populateMarket();