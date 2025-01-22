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
let currentLevel = 0; // Przechowuje aktualny poziom
let currentChroma = 0; // Przechowuje aktualny chroma

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

  variantsContainer.innerHTML = '';
  let defaultVideo = '';

  // Wyświetlanie wariantów skina
  if (skin.chromas && skin.chromas.length > 0) {
    skin.chromas.forEach((chroma, index) => {
      const chromaIcon = document.createElement('img');
      chromaIcon.src = chroma.swatch || skin.displayIcon;
      chromaIcon.classList.add('chroma-icon'); // Dodanie klasy dla stylizacji

      // Ustawienie domyślnej chromy jako aktywnej
      if (index === currentChroma) {
        chromaIcon.style.borderColor = '#90cac1';
      } else {
        chromaIcon.style.borderColor = '#545e6c';
      }

      // Obsługa kliknięcia na wariant skina (chroma)
      chromaIcon.addEventListener('click', () => {
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

    // Kliknięcie domyślnej chromy, aby zaktualizować wideo
    document.querySelectorAll('.chroma-icon')[currentChroma]?.click();
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
      if (index === currentLevel) levelButton.classList.add('active-level'); // Ustawienie aktualnego poziomu jako aktywnego

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

        skinVideoElement.play();
      });

      levelsContainer.appendChild(levelButton);
    });

    // Kliknięcie domyślnego poziomu, aby zaktualizować wideo
    document.querySelectorAll('.level-button')[currentLevel]?.click();
  }

  // Dodanie przycisku „Udostępnij” w szczegółach skina
  const shareButton = document.createElement('button');
  shareButton.textContent = 'Udostępnij';
  shareButton.className = 'share-button'; // Dodaj klasę CSS do stylizacji
  shareButton.addEventListener('click', () => {
    shareSkin(skin.uuid); // Wywołaj funkcję udostępniania z identyfikatorem skina
  });

  variantsContainer.appendChild(shareButton);

  // Ustawienie domyślnego wideo
  skinVideoElement.src = defaultVideo;
  skinVideoElement.style.display = defaultVideo ? 'block' : 'none';

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

// Funkcja sprawdzająca URL i otwierająca skina z odpowiednim poziomem i chromą
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

function updateMetaTags(skin) {
  // Znajdź elementy meta w HTML
  const ogTitle = document.getElementById('og-title');
  const ogDescription = document.getElementById('og-description');
  const ogImage = document.getElementById('og-image');
  const ogUrl = document.getElementById('og-url');

  // Zaktualizuj metadane na podstawie skina
  ogTitle.setAttribute('content', skin.displayName);
  ogDescription.setAttribute('content', 'Zobacz szczegóły skina w Valorant!');
  ogImage.setAttribute('content', skin.displayIcon);
  ogUrl.setAttribute('content', window.location.href);
}

// Sprawdź URL i ustaw metadane
function checkURLForSkin() {
  const params = new URLSearchParams(window.location.search);
  const skinId = params.get('skin');

  if (skinId) {
    const skin = getSkinById(skinId);
    if (skin) {
      updateMetaTags(skin); // Ustaw meta tagi Open Graph
    }
  }
}

// Funkcja wyszukująca skina na podstawie jego ID
function getSkinById(id) {
  return skinsData.find(skin => skin.uuid === id);
}

document.addEventListener('DOMContentLoaded', () => {
  const loadingScreen = document.getElementById('loading-screen');

  // Funkcja do sprawdzania, czy wszystkie obrazy zostały załadowane
  function checkImagesLoaded() {
    const images = Array.from(document.querySelectorAll('#skins-list img'));
    const promises = images.map(image => new Promise(resolve => {
      if (image.complete) {
        resolve();
      } else {
        image.addEventListener('load', resolve);
        image.addEventListener('error', resolve); // Obsługa błędów
      }
    }));

    // Po załadowaniu wszystkich obrazów ukryj ekran ładowania
    Promise.all(promises).then(() => {
      loadingScreen.style.display = 'none';
    });
  }

  // Po załadowaniu danych uruchom sprawdzanie obrazów
  fetchSkins().then(() => {
    checkURLForSkin(); // Sprawdzenie parametrów URL po załadowaniu skinów
    checkImagesLoaded(); // Sprawdź, czy wszystkie obrazy są załadowane
  });

  // Funkcja zamykająca modal
  closeButton.addEventListener('click', () => {
    skinDetailModal.style.display = 'none';
  });
});

