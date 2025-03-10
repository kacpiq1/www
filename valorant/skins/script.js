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



const bundleFilter = document.getElementById('bundle-filter');

const weaponTypeFilter = document.getElementById('weapon-type-filter');

const searchInput = document.getElementById('search-input');



const availableWeaponTypes = ['CLASSIC', 'SHORTY', 'FRENZY', 'GHOST', 'SHERIFF', 'STINGER', 'SPECTRE', 'BUCKY', 'JUDGE', 'BULLDOG', 'GUARDIAN', 'PHANTOM', 'VANDAL', 'MARSHAL', 'OUTLAW', 'OPERATOR', 'ARES', 'ODIN'];



// Funkcja do pobrania listy skinów

async function fetchSkins() {

  const response = await fetch(API_URL);

  const data = await response.json();

  skinsData = data.data; // Przypisanie danych do globalnej zmiennej

  populateFilters(skinsData);

  displaySkins(skinsData);

  checkURLForSkin(); // Sprawdzenie URL po załadowaniu skinów

}



function populateFilters(skins) {

  const bundles = new Set();

  const weaponTypes = new Set();



  skins.forEach(skin => {

    if (skin.displayName) {

      const bundleName = skin.displayName.split(' ')[0]; // Pobranie nazwy bundla (pierwsze słowo)

      bundles.add(bundleName);

    }

    if (skin.weapon && skin.weapon.displayName) {

      weaponTypes.add(skin.weapon.displayName); // Pobranie typu broni

    }

  });



  // Wypełnij filtr bundli

  bundleFilter.innerHTML = '<option value="">Wszystkie Bundles</option>';

  bundles.forEach(bundle => {

    const option = document.createElement('option');

    option.value = bundle;

    option.textContent = bundle;

    bundleFilter.appendChild(option);

  });



  // Wypełnij filtr typów broni (tylko dostępne typy)

  weaponTypeFilter.innerHTML = '<option value="">Wszystkie Bronie</option>';

  availableWeaponTypes.forEach(type => {

    const option = document.createElement('option');

    option.value = type;

    option.textContent = type;

    weaponTypeFilter.appendChild(option);

  });

}



function filterSkins() {

  const selectedBundle = bundleFilter.value;

  const selectedWeaponType = weaponTypeFilter.value;

  const searchQuery = searchInput.value.toLowerCase();



  const filteredSkins = skinsData.filter(skin => {

    const matchesBundle = selectedBundle ? skin.displayName.split(' ')[0] === selectedBundle : true;

    const matchesWeaponType = selectedWeaponType ? skin.displayName.toLowerCase().includes(selectedWeaponType.toLowerCase()) : true;

    const matchesSearchQuery = skin.displayName.toLowerCase().includes(searchQuery);



    return matchesBundle && matchesWeaponType && matchesSearchQuery;

  });



  displaySkins(filteredSkins);

}



// Obsługa zmiany bundla

bundleFilter.addEventListener('change', filterSkins);



// Obsługa zmiany typu broni

weaponTypeFilter.addEventListener('change', filterSkins);



// Obsługa zmiany wyszukiwarki

searchInput.addEventListener('input', filterSkins);



const TIER_COLORS = { 

  "0cebb8be-46d7-c12a-d306-e9907bfc5a25": "#009E81", 

  "e046854e-406c-37f4-6607-19a9ba8426fc": "#F4965A", 

  "60bca009-4182-7998-dee7-b8a2558dc369": "#D0558C", 

  "12683d76-48d7-84a3-4e09-6985794f0445": "#5A9FE1", 

  "411e4a55-4e59-7757-41f0-86a53f101bb5": "#FAD763" 

};



async function fetchTiers() {

  try {

    const response = await fetch(TIER_API_URL);

    const data = await response.json();



    if (data.status === 200 && data.data) {

      data.data.forEach(tier => {

        const tierColor = TIER_COLORS[tier.uuid] || '#545e6c'; // Jeżeli UUID nie ma w mapie, używamy domyślnego koloru

        TIER_COLORS[tier.uuid] = tierColor; // Przechowujemy kolory dla każdego tieru

      });

      console.log('TIER_COLORS:', TIER_COLORS); // Debug: Sprawdź, czy kolory zostały poprawnie wczytane

    } else {

      console.error('Błąd w odpowiedzi API tierów:', data);

    }

  } catch (error) {

    console.error('Nie udało się pobrać danych o tierach:', error);

  }

}



// Funkcja do wyświetlania listy skinów

function displaySkins(skins) {

  skinsListContainer.innerHTML = ''; // Czyścimy kontener przed dodaniem nowych skinów



  skins.forEach(skin => {

    const skinCard = document.createElement('div');

    skinCard.classList.add('skin-card');



    const borderColor = TIER_COLORS[skin.contentTierUuid] || '#545e6c'; 

    skinCard.style.borderColor = borderColor;



    const tierBackgroundColor = TIER_COLORS[skin.contentTierUuid] || '#545e6c'; 

    skinCard.style.setProperty('--tier-background-color', tierBackgroundColor);



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



// Funkcja wyszukująca skina na podstawie jego ID

function getSkinById(id) {

  return skinsData.find(skin => skin.uuid === id);

}



bundleFilter.addEventListener('change', () => {

  const selectedBundle = bundleFilter.value;

  filterSkinsByBundle(selectedBundle);

});



// Event listener dla filtra typów broni

weaponTypeFilter.addEventListener('change', () => {

  const selectedWeaponType = weaponTypeFilter.value;

  filterSkinsByWeaponType(selectedWeaponType);

});

document.addEventListener('DOMContentLoaded', () => {

  const loadingScreen = document.getElementById('loading-screen');

  const introScreen = document.getElementById('intro-screen'); // Element for the intro animation

  const loadingText = document.getElementById('loading-text'); // Element for loading count

  const closeButton = document.querySelector('.close-button');

  const introVideo = document.getElementById('intro-video'); // Intro video element

  const loadingImage = document.querySelector('#loading-screen img'); // Loading image element



  // Intro animation duration (adjust as needed)

  const introDuration = 3000; // 5 seconds (you can modify this based on your animation)



  // Detect if the user is on a mobile device

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);



  // Set different intro video and image for mobile users

  if (isMobile) {

    introVideo.src = 'skins/source/intro-phone.mp4'; // Mobile intro video

    loadingImage.src = 'skins/source/loading-phone.jpg'; // Mobile loading image

  } else {

    introVideo.src = 'skins/source/intro.mp4'; // Desktop intro video

    loadingImage.src = 'skins/source/loading-image.jpg'; // Desktop loading image

  }



  // Show intro screen for a set amount of time

  setTimeout(() => {

    introScreen.style.display = 'none';

    loadingScreen.style.display = 'block';

    checkImagesLoaded();

  }, introDuration);



  // Funkcja do sprawdzania, czy wszystkie obrazy zostały załadowane

  function checkImagesLoaded() {

    const images = Array.from(document.querySelectorAll('#skins-list img'));

    let loadedCount = 0; // Liczba załadowanych obrazów



    // Aktualizuj licznik po każdym załadowaniu obrazu

    const promises = images.map(image => {

      return new Promise(resolve => {

        if (image.complete) {

          loadedCount++; // Jeśli obraz jest już załadowany

          loadingText.textContent = `${loadedCount}/${images.length}`;

          resolve();

        } else {

          image.addEventListener('load', () => {

            loadedCount++; // Zwiększamy licznik po załadowaniu obrazu

            loadingText.textContent = `${loadedCount}/${images.length}`;

            resolve();

          });

          image.addEventListener('error', resolve); // Obsługuje błąd ładowania obrazu

        }

      });

    });



    // Po załadowaniu wszystkich obrazów ukryj ekran ładowania

    Promise.all(promises).then(() => {

      setTimeout(() => {

        loadingScreen.style.display = 'none'; // Hide loading screen after images are loaded

        document.body.style.overflow = 'auto';

      }, 2000); // Delay to show the final loading screen before hiding

    });

  }



  // Fetch data and images

  fetchTiers();



  // After fetching skins, check URL and images loading

  fetchSkins().then(() => {

    checkURLForSkin(); // Check URL parameters after skins are loaded

  });



  // Funkcja zamykająca modal

  closeButton.addEventListener('click', () => {

    skinDetailModal.style.display = 'none';

  });

});



document.addEventListener("DOMContentLoaded", function () {

    const bundleEndDate = new Date("2025-04-03T00:00:00");



    function updateBundleTimer() {

        const now = new Date().getTime();

        const timeLeft = bundleEndDate - now;



        if (timeLeft <= 0) {

            document.getElementById("bundle-timer").innerText = "00:00:00:00";

            return;

        }



        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));

        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);




        document.getElementById("bundle-timer").innerText = `${days}:${hours}:${minutes}:${seconds}`;

    }



    setInterval(updateBundleTimer, 1000);

    updateBundleTimer();



    function addSkinsToBundle() {

        const allSkins = document.querySelectorAll(".skin-card");

        const bundleContainer = document.getElementById("bundle-skins");



        allSkins.forEach(skin => {

            if (skin.dataset.name.includes("CYRAX")) { 

                const clone = skin.cloneNode(true);

                bundleContainer.appendChild(clone);

            }

        });

    }



    addSkinsToBundle();

});
