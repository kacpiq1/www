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

// Funkcja do pobrania listy skinów
async function fetchSkins() {
  const response = await fetch(API_URL);
  const data = await response.json();
  displaySkins(data.data);
}

// Funkcja do wyświetlania listy skinów
function displaySkins(skins) {
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
      skin.chromas.forEach(chroma => {
          const chromaIcon = document.createElement('img');
          chromaIcon.src = chroma.swatch || skin.displayIcon;

          // Obsługa kliknięcia na wariant skina (chroma)
          chromaIcon.addEventListener('click', async () => {
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
              skinVideoElement.play(); // Automatyczne odtwarzanie wideo
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
          if (index === 0) levelButton.classList.add('active-level'); // Ustaw domyślnie na aktywny poziom

          // Obsługa kliknięcia na przycisk poziomu (level)
          levelButton.addEventListener('click', () => {
              // Zaktualizuj wszystkie przyciski, aby usunąć klasę aktywną
              const allButtons = document.querySelectorAll('.level-button');
              allButtons.forEach(btn => btn.classList.remove('active-level'));
              
              // Dodaj klasę aktywną do klikniętego przycisku
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

  document.addEventListener('DOMContentLoaded', function() {
    // Funkcja do filtrowania skinów
    function filterSkins() {
        const searchInput = document.getElementById('search-input');
        const searchTerm = searchInput.value.toLowerCase();
        const skinsList = document.getElementById('skins-list');
        const skins = skinsList.getElementsByClassName('skin-card');

        // Przechodzimy przez wszystkie skiny i ukrywamy lub pokazujemy je w zależności od wyszukiwania
        Array.from(skins).forEach(skin => {
            const skinName = skin.querySelector('h3').textContent.toLowerCase();
            if (skinName.includes(searchTerm)) {
                skin.style.display = ''; // Pokazuje skina
            } else {
                skin.style.display = 'none'; // Ukrywa skina
            }
        });
    }

    // Inicjalizuj wyszukiwarkę
    document.getElementById('search-input').addEventListener('input', filterSkins);
});



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

// Dodaj CSS do ukrywania paska postępu
skinVideoElement.setAttribute('controls', 'false'); // Ukryj kontrole wideo

  

  let favorites = []; // Lista ulubionych skinów

// Funkcja do przełączania stanu ulubionego skina
function toggleFavorite(skinId) {
    const index = favorites.indexOf(skinId);
    const favoriteIcon = document.getElementById('favorite-icon');

    if (index === -1) {
        // Jeśli skin nie jest w ulubionych, dodaj go
        favorites.push(skinId);
        favoriteIcon.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAACDElEQVRIS8WW0VECMRBAd4MzcjpzkArEDigBOoAOsAOpQK0AO4AOoAPpQDuQDhLOUXBGsm6QYw683JEMDPmEu333NrubIJxp4Zm4EAxWqtqCiqjL+GsS8vFBYAsVFRwzsG4AuyHwIHCSRGMC6FhTDjCN40Xb19obzLYNtn21tinMrOhWyuXMB+4PnlcfBeJDFoKAozj+ujsZWKl6XVS+37O2odZexirHdgsmepK15eOh1geDN7Z2bxuO4LoWL2QQeN2bApv25QsBN0TIBUQNQi4kWheTC5ryNJf5DAm40FAjkv4xNLe/AQidbbutsUquOgLI9ubJlgG6k/FytGnDP45S101RMTaVJ1vZYbOzxyqp9gTg8ARkzbb91HbHOIVtxuHLEeEMRU7x7kzPreojwnOhucZHNJ/xKG27RmlhHwebI7yZH+oWze/SATJPIjsiy/p3pyQOmd0lxsEtVjrFisHz6F4gDEIqvOyoLARnD3xfuCHoy9ri2fVeIbhkfzUH3V4G9gEceMI3k643uGiE2uvOaiX6Nqi4MEM+QNYHy/4yq0sppbYf+G85jR2HhuYUPoG5HGUDKkctZA+FnIzkJyNJroYE1Ev/TS2l/HzLe2OdoT37orZyGn98RAO2u2dIrqVr77L2RfvsTjXfr0B898CIqcvSCWd7EKYFhiZBI9O3hXyeLx2ZPsF8nv0FVqXzH7WgOXMAAAAASUVORK5CYII";
        alert("Aktualnie ta funkcja nie działa!"); // Informacja dla użytkownika
    } else {
        // Jeśli skin jest w ulubionych, usuń go
        favorites.splice(index, 1);
        favoriteIcon.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAABqElEQVRIS8WWgVECMRBFSQdSgdiBJUAH0gF0oBUoFWgH0oF0IB1oB14JUMH5v7O5uQvZ5Dbmhp3JzAF3efey2Q1udqVwV+LOisFt2y7x0jfOuUPJyxeBBfpBMMa6BF4KJvRBTI8Ar6zWZjBsF4B8ia3n3QHeWOAl4BcAngPIHuDtZGDYMqc/gW2RtckY4JitB+9gzd9HxWiw2DK3zHEsTgDPR1Fx0wAsZXIvD9/KkhLEJebQoJ53wkUjg9ccZ/+5X3YdGFCWB8tkytgCviegD6Ypl3LK6JpNuNQbUN8nIHPJn7ztwNjDJM+fFeGEcokHPT26qyvCo9CocUVz7u6V1kqTdfwP829AuZEIj0a2gQDOFrkw5jzbu3PGpSWW7WI58CNMX422/vbkUZkD9w98K591+1aU40x+WSrs31ocAF6bwYCm8ntkJ5JJ2en8wRJy5oDzBS9CXWrl0OAkOwzu2m5C3Kvthe5QCMkpME02vQf+LAFkjV6ErFBor5ZVCszdTJOopZa7wF7NcwrMjUNj/n2NWibgzPkSg+DGlGNt0lrfZ1tmLVA4zy9GJ6kfsbtO7AAAAABJRU5ErkJggg";
        alert("Aktualnie ta funkcja nie działa!"); // Informacja dla użytkownika
    }
    updateFavoriteDisplay(); // Zaktualizuj wyświetlanie ulubionych skinów
}

// Funkcja do aktualizacji wyświetlania ulubionych skinów
function updateFavoriteDisplay() {
    const favoritesContainer = document.getElementById('favorites-container');
    favoritesContainer.innerHTML = ''; // Czyść zawartość

    if (favorites.length > 0) {
        favoritesContainer.style.display = 'block'; // Pokaż sekcję ulubionych
        const title = document.createElement('h2');
        title.className = 'favorites-title';
        title.textContent = 'Ulubione Skins';
        favoritesContainer.appendChild(title);

        favorites.forEach(favoriteId => {
            const favoriteSkin = document.createElement('div');
            favoriteSkin.className = 'skin-card'; // Używamy klasy skina dla stylizacji

            // Dodaj tutaj kod do generowania zawartości ulubionego skina na podstawie ID
            favoriteSkin.innerHTML = `
                <img src="skin_image_url" alt="Skin Image">
                <h3 class="skin-name">Skin Name</h3>
            `;

            favoritesContainer.appendChild(favoriteSkin);
        });
    } else {
        favoritesContainer.style.display = 'none'; // Ukryj sekcję, jeśli brak ulubionych
    }
}

  

  
  
  

// Funkcja zamykająca modal
closeButton.addEventListener('click', () => {
  skinDetailModal.style.display = 'none';
});

// Wywołanie funkcji na start
fetchSkins();
