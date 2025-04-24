
// Authentication functionality
document.addEventListener("DOMContentLoaded", function() {
    
    // Firebase configuration
    const firebaseConfig = {
        apiKey: "AIzaSyA303t0WQ0EyjXLHrRa0PiE8lgK1-Ch0FE",
        authDomain: "kacpiq-egz-wyniki.firebaseapp.com",
        databaseURL: "https://kacpiq-egz-wyniki-default-rtdb.europe-west1.firebasedatabase.app/",
        projectId: "kacpiq-egz-wyniki",
        storageBucket: "kacpiq-egz-wyniki.firebasestorage.app",
        messagingSenderId: "925929166432",
        appId: "1:925929166432:web:81756e7675f468b8d19505",
        measurementId: "G-Z8ZFL73Q6Q"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const provider = new firebase.auth.GoogleAuthProvider();

    // DOM elements
    const userAvatar = document.getElementById("user-avatar");
    const userDropdown = document.getElementById("user-dropdown");
    const userLoggedIn = document.getElementById("user-logged");
    const userNotLoggedIn = document.getElementById("user-not-logged");
    const userName = document.getElementById("user-name");
    const userEmail = document.getElementById("user-email");
    const avatarCircle = document.getElementById("avatar-circle");
    const loginBtn = document.getElementById("login-btn");
    const logoutBtn = document.getElementById("logout-btn");
    const loginBtnRanking = document.getElementById("login-btn-ranking");
    const logoutBtnRanking = document.getElementById("logout-btn-ranking");

    // Toggle user dropdown
    userAvatar.addEventListener("click", function(e) {
        e.stopPropagation();
        userDropdown.style.display = userDropdown.style.display === "block" ? "none" : "block";
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", function() {
        userDropdown.style.display = "none";
    });

    // Login handler
    function handleLogin() {
        auth.signInWithPopup(provider)
            .then((result) => {
                const user = result.user;
                updateUserUI(user);
            })
            .catch((error) => {
                console.error("Login error:", error);
                alert("Wystąpił błąd podczas logowania: " + error.message);
            });
    }

    // Logout handler
    function handleLogout() {
        auth.signOut()
            .then(() => {
                updateUserUI(null);
            })
            .catch((error) => {
                console.error("Logout error:", error);
            });
    }

    // Update UI based on auth state
    function updateUserUI(user) {
        if (user) {
            // User is logged in
            userLoggedIn.style.display = "block";
            userNotLoggedIn.style.display = "none";
            
            userName.textContent = user.displayName || "Użytkownik";
            userEmail.textContent = user.email;
            
            // Update avatar
            if (user.photoURL) {
                avatarCircle.innerHTML = `<img src="${user.photoURL}" alt="Avatar">`;
            } else {
                avatarCircle.innerHTML = '<i class="fas fa-user"></i>';
            }
            
            // Enable ranking if school email
            const rankingBtn = document.getElementById("open-ranking-modal");
            if (user.email.endsWith("@uczniowie.zs1.bochnia.pl")) {
                rankingBtn.disabled = false;
                rankingBtn.title = "";
            } else {
                rankingBtn.disabled = true;
                rankingBtn.title = "Dostęp do danych tylko dla uczniów ZS1";
            }
        } else {
            // User is logged out
            userLoggedIn.style.display = "none";
            userNotLoggedIn.style.display = "block";
            
            // Disable ranking
            const rankingBtn = document.getElementById("open-ranking-modal");
            rankingBtn.disabled = true;
            rankingBtn.title = "Zaloguj się, aby uzyskać dostęp";
        }
    }

    // Auth state listener
    auth.onAuthStateChanged((user) => {
        updateUserUI(user);
    });

    // Event listeners
    loginBtn?.addEventListener("click", handleLogin);
    logoutBtn?.addEventListener("click", handleLogout);
    loginBtnRanking?.addEventListener("click", handleLogin);
    logoutBtnRanking?.addEventListener("click", handleLogout);
});