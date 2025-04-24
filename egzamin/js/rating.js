// Rating functionality with Firebase
document.addEventListener("DOMContentLoaded", function() {
    // Firebase configuration
    const firebaseConfig = {
        apiKey: "AIzaSyDxweHC9eBj-1iZPtrgPBPngqSZGO0A_hY",
        authDomain: "kacpiq-egzamin.firebaseapp.com",
        databaseURL: "https://kacpiq-egzamin-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "kacpiq-egzamin",
        storageBucket: "kacpiq-egzamin.firebasestorage.app",
        messagingSenderId: "1060401996008",
        appId: "1:1060401996008:web:a382e44d487e8a079ae95d",
        measurementId: "G-KSJX5H1GFT"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();

    // DOM elements
    const ratingValue = document.getElementById("rating-value");
    const ratingCount = document.getElementById("rating-count");
    const submitRatingBtn = document.getElementById("submit-rating");
    const ratingCircles = document.querySelectorAll(".rating-circle");
    let selectedRating = 0;
    let currentExamName = "";

    // Rating circle click handler
    ratingCircles.forEach(circle => {
        circle.addEventListener("click", function() {
            const value = parseInt(this.dataset.value);
            selectedRating = selectedRating === value ? 0 : value;
            updateRatingSelection();
        });
    });

    // Update rating selection
    function updateRatingSelection() {
        ratingCircles.forEach(circle => {
            const value = parseInt(circle.dataset.value);
            if (value <= selectedRating) {
                circle.innerHTML = '<i class="fas fa-star"></i>';
                circle.classList.add("selected");
            } else {
                circle.innerHTML = '<i class="far fa-star"></i>';
                circle.classList.remove("selected");
            }
        });
    }

    // Sanitize exam name for Firebase
    function sanitizeExamName(examName) {
        return examName.replace(/[.#$\[\]]/g, "_");
    }

    // Get current exam name
    function getExamName() {
        const examName = document.getElementById("exam-file-name").textContent;
        return examName.trim();
    }

    // Calculate average rating
    function calculateAverage(ratings) {
        if (ratings && ratings.length > 0) {
            const total = ratings.reduce((sum, rating) => sum + rating, 0);
            return (total / ratings.length).toFixed(1);
        }
        return "0.0";
    }

    // Load current rating
    function loadCurrentRating() {
        const examName = getExamName();
        if (!examName) return;

        const sanitizedExamName = sanitizeExamName(examName);
        const ratingsRef = db.ref('exam-ratings/' + sanitizedExamName + '/ratings');

        ratingsRef.once('value').then((snapshot) => {
            if (snapshot.exists()) {
                const ratingsObject = snapshot.val();
                const ratings = Object.values(ratingsObject);
                
                const averageRating = calculateAverage(ratings);
                const ratingCountValue = ratings.length;
                
                ratingValue.textContent = averageRating;
                ratingCount.textContent = ratingCountValue;
            } else {
                ratingValue.textContent = "0.0";
                ratingCount.textContent = "0";
            }
        }).catch((error) => {
            console.error("Error loading ratings:", error);
        });
    }

    // Get user IP address
    async function getUserIP() {
        try {
            const response = await fetch("https://api.ipify.org?format=json");
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.error("Error getting IP:", error);
            return null;
        }
    }

    // Sanitize IP address
    function sanitizeIP(ip) {
        return ip.replace(/\./g, "_");
    }

    // Check if user can rate
    async function canUserRate() {
        const userIP = await getUserIP();
        if (!userIP) return false;

        const sanitizedIP = sanitizeIP(userIP);
        const userRef = db.ref(`exam-ratings/global/users/${sanitizedIP}`);
        
        const snapshot = await userRef.once('value');
        if (snapshot.exists()) {
            const lastVoteTime = snapshot.val().timestamp;
            const currentTime = Date.now();
            const oneHour = 60 * 60 * 1000;

            if (currentTime - lastVoteTime < oneHour) {
                return false;
            }
        }
        return true;
    }

    // Submit rating
    async function submitRating() {
        if (selectedRating === 0) {
            alert("Proszę wybrać ocenę przed zatwierdzeniem.");
            return;
        }

        const canRate = await canUserRate();
        if (!canRate) {
            alert("Możesz ocenić tylko raz na godzinę!");
            return;
        }

        const examName = getExamName();
        if (!examName) return;

        const sanitizedExamName = sanitizeExamName(examName);
        const ratingsRef = db.ref(`exam-ratings/${sanitizedExamName}/ratings`);

        // Save rating
        ratingsRef.push(selectedRating)
            .then(() => {
                console.log("Rating saved:", selectedRating);
                document.getElementById("rating-modal").style.display = "none";
                loadCurrentRating();
            })
            .catch(error => console.error("Error saving rating:", error));

        // Save user IP with timestamp
        const userIP = await getUserIP();
        if (!userIP) return;

        const sanitizedIP = sanitizeIP(userIP);
        const userRef = db.ref(`exam-ratings/global/users/${sanitizedIP}`);
        userRef.set({ timestamp: Date.now() });
    }

    // Event listeners
    submitRatingBtn?.addEventListener("click", submitRating);
    document.getElementById("open-rating-modal")?.addEventListener("click", function() {
        document.getElementById("rating-modal").style.display = "flex";
        selectedRating = 0;
        updateRatingSelection();
    });

    // Initialize
    loadCurrentRating();
});