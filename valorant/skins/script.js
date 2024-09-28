const skinsListContainer = document.getElementById('skins-list');
const skinDetailModal = document.getElementById('skin-detail');
const closeButton = document.querySelector('.close-button');
const skinNameElement = document.getElementById('skin-name');
const skinIconElement = document.getElementById('skin-icon');
const tierIconElement = document.getElementById('tier-icon');
const variantsContainer = document.getElementById('variants-container');
const skinVideoElement = document.getElementById('skin-video');

const API_URL = 'https://valorant-api.com/v1/weapons/skins';
const TIER_API_URL = 'https://valorant-api.com/v1/contenttiers/';

let skinsData = []; // Przechowuje załadowane skiny

// Funkcja do pobrania listy skinów
async function fetchSkins() {
  const response = await fetch(API_URL);
  const data = await response.json();
  skinsData = data.data; // Przypisanie danych do globalnej zmiennej
  displaySkins(skinsData);
  checkURLForSkin(); // Sprawdzenie URL po załadowaniu skinów
}

// Funkcja do wyświetlania listy skinów
function displaySkins(skins) {
  skinsListContainer.innerHTML = ''; // Czyści kontener przed dodaniem nowych skinów

  skins.forEach(skin => {
    const skinCard = document.createElement('div');
    skinCard.classList.add('skin-card');
    skinCard.innerHTML = `
      <img src="${skin.displayIcon}" alt="${skin.displayName}">
      <h3>${skin.displayName}</h3>
    `;

    skinCard.addEventListener('click', () => showSkinDetail(skin));

    skinsListContainer.appendChild(skinCard);
  });
}

let currentLevel = 0; // Przechowuje aktualny poziom
let currentChroma = 0; // Przechowuje aktualny chroma

// Funkcja do wyświetlania szczegółów skina
async function showSkinDetail(skin) {
  skinNameElement.textContent = skin.displayName;
  skinIconElement.src = skin.displayIcon;

  // Pobieranie ikonki rzadkości skina
  if (skin.contentTierUuid) {
    const tierResponse = await fetch(`${TIER_API_URL}${skin.contentTierUuid}`);
    const tierData = await tierResponse.json();
    tierIconElement.src = tierData.data.displayIcon;
  }

  // Wyświetlanie wariantów skina
  variantsContainer.innerHTML = '';
  let defaultVideo = '';

  if (skin.chromas && skin.chromas.length > 0) {
    skin.chromas.forEach((chroma, index) => {
      const chromaIcon = document.createElement('img');
      chromaIcon.src = chroma.swatch || skin.displayIcon;
      chromaIcon.classList.add('chroma-icon'); // Dodanie klasy dla stylizacji

      // Dodanie stylu konturu
      chromaIcon.style.border = `2px solid ${index === currentChroma ? '#90cac1' : '#545e6c'}`;

      // Obsługa kliknięcia na wariant skina (chroma)
      chromaIcon.addEventListener('click', async () => {
        currentChroma = index; // Aktualizacja bieżącego chroma
        let videoUrl = chroma.streamedVideo || '';

        // Jeśli brak video w chroma, sprawdź levels
        if (!videoUrl && skin.levels && skin.levels.length > 0) {
          for (let level of skin.levels) {
            if (level.streamedVideo) {
              videoUrl = level.streamedVideo;
              break;
            }
          }
        }

        // Ustawienie video dla wybranego wariantu
        skinVideoElement.src = videoUrl || '';
        skinVideoElement.play();

        // Aktualizacja stylu konturów ikon
        document.querySelectorAll('.chroma-icon').forEach((icon, i) => {
          icon.style.borderColor = i === currentChroma ? '#90cac1' : '#545e6c';
        });
      });

      variantsContainer.appendChild(chromaIcon);
    });
  }

  // Ustawienie domyślnego video
  if (skin.levels && skin.levels.length > 0) {
    for (let level of skin.levels) {
      if (level.streamedVideo) {
        defaultVideo = level.streamedVideo;
        break;
      }
    }
  }

  // Wyświetlanie przycisków do poziomów (levels)
  const levelsContainer = document.createElement('div');
  levelsContainer.id = 'levels-container';
  variantsContainer.appendChild(levelsContainer);

  if (skin.levels && skin.levels.length > 0) {
    skin.levels.forEach((level, index) => {
      const levelButton = document.createElement('button');
      levelButton.textContent = `Level ${index + 1}`;
      levelButton.classList.add('level-button');
      if (index === currentLevel) levelButton.classList.add('active-level'); // Ustaw domyślnie na aktywny poziom

      // Obsługa kliknięcia na przycisk poziomu (level)
      levelButton.addEventListener('click', () => {
        currentLevel = index; // Aktualizacja bieżącego poziomu
        document.querySelectorAll('.level-button').forEach(btn => btn.classList.remove('active-level'));
        levelButton.classList.add('active-level');

        if (level.streamedVideo) {
          skinVideoElement.src = level.streamedVideo;
        } else {
          skinVideoElement.src = ''; // Brak filmu dla poziomu
        }

        skinVideoElement.play(); // Automatyczne odtwarzanie wideo
      });

      levelsContainer.appendChild(levelButton);
    });
  }

  // Dodanie przycisku „Udostępnij” w szczegółach skina
  const shareButton = document.createElement('button');
  shareButton.textContent = 'Udostępnij';
  shareButton.className = 'share-button'; // Dodaj klasę CSS do stylizacji
  shareButton.addEventListener('click', () => {
    shareSkin(skin.uuid); // Wywołaj funkcję udostępniania z identyfikatorem skina
  });

  // Dodanie przycisku do kontenera z wariantami lub innego miejsca w modalnym oknie
  variantsContainer.appendChild(shareButton);

  // Ustawienie domyślnego wideo
  skinVideoElement.src = defaultVideo;
  if (defaultVideo) {
    skinVideoElement.style.display = 'block';
    skinVideoElement.play(); // Odtwarzanie domyślnego wideo
  } else {
    // Gdy brak wideo
    skinVideoElement.style.display = 'none'; // Ukryj wideo
    const noVideoMessage = document.createElement('div');
    noVideoMessage.className = 'no-video-message';
    noVideoMessage.textContent = 'Brak podglądu dla tego wariantu';
    variantsContainer.appendChild(noVideoMessage);
  }

  skinDetailModal.style.display = 'flex';
}

// Funkcja do generowania linku do udostępniania z poziomem i chromą
function shareSkin(skinId) {
  const url = `${window.location.origin}${window.location.pathname}?skin=${skinId}&level=${currentLevel}&chroma=${currentChroma}`;
  navigator.clipboard.writeText(url).then(() => {
    alert('Link do skina został skopiowany do schowka!');
  }).catch(err => {
    console.error('Nie udało się skopiować linku: ', err);
  });
}

// Funkcja do sprawdzania URL i otwierania skina z odpowiednim poziomem i chromą
function checkURLForSkin() {
  const params = new URLSearchParams(window.location.search);
  const skinId = params.get('skin');
  currentLevel = parseInt(params.get('level')) || 0;
  currentChroma = parseInt(params.get('chroma')) || 0;

  if (skinId) {
    const skin = getSkinById(skinId);
    if (skin) {
      showSkinDetail(skin);

      // Automatyczne ustawienie chromy i poziomu przy otwarciu
      const chromaIcons = document.querySelectorAll('.chroma-icon');
      if (chromaIcons[currentChroma]) {
        chromaIcons[currentChroma].click();
      }
      const levelButtons = document.querySelectorAll('.level-button');
      if (levelButtons[currentLevel]) {
        levelButtons[currentLevel].click();
      }
    }
  }
}

// Funkcja wyszukująca skina na podstawie jego ID
function getSkinById(id) {
  return skinsData.find(skin => skin.uuid === id);
}

// Funkcja zamykająca modal
closeButton.addEventListener('click', () => {
  skinDetailModal.style.display = 'none';
});

// Wywołanie funkcji na start
fetchSkins();
