// Main exam functionality
document.addEventListener("DOMContentLoaded", function () {
    // Exam data
    const exams = [
        { file: "INF_02_01_25_01_SG.pdf", key: "INF_02_01_25_01_SG_zo.pdf", podstawa: "2019", serwer: "Windows Server", klient: "Windows" },
        { file: "inf_02_2024_06_06_SG.pdf", key: "inf_02_2024_06_06_SG_zo.pdf", podstawa: "2019", serwer: "Linux", klient: "Windows" },
        { file: "inf_02_2024_06_05_SG.pdf", key: "inf_02_2024_06_05_SG_zo.pdf", podstawa: "2019", serwer: "Linux", klient: "Windows" },
        { file: "inf_02_2024_06_04_SG.pdf", key: "inf_02_2024_06_04_SG_zo.pdf", podstawa: "2019", serwer: "Linux", klient: "Windows" },
        { file: "inf_02_2024_06_03_SG.pdf", key: "inf_02_2024_06_03_SG_zo.pdf", podstawa: "2019", serwer: "Windows Server", klient: "Windows" },
        { file: "inf_02_2024_06_02_SG.pdf", key: "inf_02_2024_06_02_SG_zo.pdf", podstawa: "2019", serwer: "Windows Server", klient: "Linux" },
        { file: "inf_02_2024_06_01_SG.pdf", key: "inf_02_2024_06_01_SG_zo.pdf", podstawa: "2019", serwer: "Windows Server", klient: "Linux" },
        { file: "inf_02_2024_06_01_SD.pdf", key: "inf_02_2024_06_01_SD_zo.pdf", podstawa: "2019", serwer: "Windows Server", klient: "Windows" },
        { file: "inf_02_2023_01_04_SG_kolor.pdf", key: "inf_02_2023_01_04_SG_zo_kolor.pdf", podstawa: "2019", serwer: "Linux", klient: "Windows" },
        { file: "inf_02_2023_01_03_SG_kolor.pdf", key: "inf_02_2023_01_03_SG_zo_kolor.pdf", podstawa: "2019", serwer: "Windows Server", klient: "Windows" },
        { file: "inf_02_2023_01_02_SG_kolor.pdf", key: "inf_02_2023_01_02_SG_zo_kolor.pdf", podstawa: "2019", serwer: "Windows Server", klient: "Linux" },
        { file: "inf_02_2023_01_01_SG_kolor.pdf", key: "inf_02_2023_01_01_SG_zo_kolor.pdf", podstawa: "2019", serwer: "Windows Server", klient: "Linux" },
        { file: "inf_02_2021_06_01_SG_kolor.pdf", key: "inf_02_2021_06_01_SG_zo_kolor.pdf", podstawa: "2019", serwer: "Linux", klient: "Windows" },
        { file: "inf_02_2021_06_01_SD_kolor.pdf", key: "inf_02_2021_06_01_SD_zo_kolor.pdf", podstawa: "2019", serwer: "Linux", klient: "Windows" },
  
        { file: "INF_02_04_23_06_SG.pdf", key: "INF_02_04_23_06_SG_zo.pdf", podstawa: "2019", serwer: "Linux", klient: "Windows" },
        { file: "INF_02_04_22_06_SG.pdf", key: "INF_02_04_22_06_SG_zo.pdf", podstawa: "2019", serwer: "Windows Server", klient: "Linux" },
        { file: "INF_02_03_23_06_SG.pdf", key: "INF_02_03_23_06_SG_zo.pdf", podstawa: "2019", serwer: "Windows Server", klient: "Linux" },
        { file: "INF_02_03_22_06_SG.pdf", key: "INF_02_03_22_06_SG_zo.pdf", podstawa: "2019", serwer: "Windows Server", klient: "Linux" },
        { file: "INF_02_02_23_06_SG.pdf", key: "INF_02_02_23_06_SG_zo.pdf", podstawa: "2019", serwer: "Windows Server", klient: "Linux" },
        { file: "INF_02_02_22_06_SG.pdf", key: "INF_02_02_22_06_SG_zo.pdf", podstawa: "2019", serwer: "Linux", klient: "Windows" },
        { file: "INF_02_01_23_06_SG.pdf", key: "INF_02_01_23_06_SG_zo.pdf", podstawa: "2019", serwer: "Linux", klient: "Windows" },
        { file: "INF_02_01_22_06_SG.pdf", key: "INF_02_01_22_06_SG_zo.pdf", podstawa: "2019", serwer: "Windows Server", klient: "Linux" },
        { file: "INF_02_01_22_01_SG.pdf", key: "INF_02_01_22_01_SG_zo.pdf", podstawa: "2019", serwer: "Windows Server", klient: "Linux" },
  
        { file: "INF.02-04-24.01-SG.pdf", key: "INF.02-04-24.01-SG-zo.pdf", podstawa: "2019", serwer: "Windows Server", klient: "Windows" },
        { file: "INF.02-03-24.01-SG.pdf", key: "INF.02-03-24.01-SG-zo.pdf", podstawa: "2019", serwer: "Windows Server", klient: "Windows" },
        { file: "INF.02-02-24.01-SG.pdf", key: "INF.02-02-24.01-SG-zo.pdf", podstawa: "2019", serwer: "Linux", klient: "Windows" },
        { file: "INF.02-01-24.01-SG.pdf", key: "INF.02-01-24.01-SG-zo.pdf", podstawa: "2019", serwer: "Windows Server", klient: "Linux" },
  
        { file: "ee_08_2024_06_01_SG.pdf", key: "ee_08_2024_06_01_SG_zo.pdf", podstawa: "2017", serwer: "Linux", klient: "Windows" },
        { file: "ee_08_2023_01_01_SG_kolor.pdf", key: "ee_08_2023_01_01_SG_zo_kolor.pdf", podstawa: "2017", serwer: "Linux", klient: "Windows" },
        { file: "ee_08_2021_06_04_SG_kolor.pdf", key: "ee_08_2021_06_04_SG_zo_kolor.pdf", podstawa: "2017", serwer: "Linux", klient: "Windows" },
        { file: "ee_08_2021_06_03_SG_kolor.pdf", key: "ee_08_2021_06_03_SG_zo_kolor.pdf", podstawa: "2017", serwer: "Linux", klient: "Windows" },
        { file: "ee_08_2021_06_02_SG_kolor.pdf", key: "ee_08_2021_06_02_SG_zo_kolor.pdf", podstawa: "2017", serwer: "Windows Server", klient: "Windows" },
        { file: "ee_08_2021_06_01_SG_kolor.pdf", key: "ee_08_2021_06_01_SG_zo_kolor.pdf", podstawa: "2017", serwer: "Windows Server", klient: "Linux" },
        { file: "ee_08_2021_01_04_SG_kolor.pdf", key: "ee_08_2021_01_04_SG_zo_kolor.pdf", podstawa: "2017", serwer: "Linux", klient: "Windows" },
        { file: "ee_08_2021_01_03_SG_kolor.pdf", key: "ee_08_2021_01_03_SG_zo_kolor.pdf", podstawa: "2017", serwer: "Linux", klient: "Windows" },
        { file: "ee_08_2021_01_02_SG_kolor.pdf", key: "ee_08_2021_01_02_SG_zo_kolor.pdf", podstawa: "2017", serwer: "Windows Server", klient: "Linux" },
        { file: "ee_08_2021_01_01_SG_kolor.pdf", key: "ee_08_2021_01_01_SG_zo_kolor.pdf", podstawa: "2017", serwer: "Windows Server", klient: "Linux" },
        { file: "ee_08_2020_06_04_SG_kolor.pdf", key: "ee_08_2020_06_04_SG_zo_kolor.pdf", podstawa: "2017", serwer: "Linux", klient: "Windows" },
        { file: "ee_08_2020_06_03_SG_kolor.pdf", key: "ee_08_2020_06_03_SG_zo_kolor.pdf", podstawa: "2017", serwer: "Linux", klient: "Windows" },
        { file: "ee_08_2020_06_02_SG_kolor.pdf", key: "ee_08_2020_06_02_SG_zo_kolor.pdf", podstawa: "2017", serwer: "Windows Server", klient: "Windows" },
        { file: "ee_08_2020_06_01_SG_kolor.pdf", key: "ee_08_2020_06_01_SG_zo_kolor.pdf", podstawa: "2017", serwer: "Windows Server", klient: "Linux" },
        { file: "ee_08_2020_01_04_SG_kolor.pdf", key: "ee_08_2020_01_04_SG_zo_kolor.pdf", podstawa: "2017", serwer: "Windows Server", klient: "Linux" },
        { file: "ee_08_2020_01_03_SG_kolor.pdf", key: "ee_08_2020_01_03_SG_zo_kolor.pdf", podstawa: "2017", serwer: "Windows Server", klient: "Linux" },
        { file: "ee_08_2020_01_02_SG_kolor.pdf", key: "ee_08_2020_01_02_SG_zo_kolor.pdf", podstawa: "2017", serwer: "Linux", klient: "Windows" },
        { file: "ee_08_2020_01_01_SG_kolor.pdf", key: "ee_08_2020_01_01_SG_zo_kolor.pdf", podstawa: "2017", serwer: "Windows Server", klient: "Linux" },
        { file: "ee_08_2019_06_07_kolor.pdf", key: "ee_08_2019_06_07_zo_kolor.pdf", podstawa: "2017", serwer: "Windows Server", klient: "Linux" },
        { file: "ee_08_2019_06_06_kolor.pdf", key: "ee_08_2019_06_06_zo_kolor.pdf", podstawa: "2017", serwer: "Windows Server", klient: "Windows" },
        { file: "ee_08_2019_06_03_kolor.pdf", key: "ee_08_2019_06_03_zo_kolor.pdf", podstawa: "2017", serwer: "Linux", klient: "Windows" },
        { file: "ee_08_2019_06_02_kolor.pdf", key: "ee_08_2019_06_02_zo_kolor.pdf", podstawa: "2017", serwer: "Windows Server", klient: "Linux" },
        { file: "ee_08_2019_06_01_kolor.pdf", key: "ee_08_2019_06_01_zo_kolor.pdf", podstawa: "2017", serwer: "Windows Server", klient: "Linux" },
        { file: "ee_08_2019_01_01_kolor.pdf", key: "ee_08_2019_01_01_zo.pdf", podstawa: "2017", serwer: "Windows Server", klient: "Linux" },
        { file: "ee_08_2018_06_01_kolor.pdf", key: "ee_08_2018_06_01_zo_kolor.pdf", podstawa: "2017", serwer: "Windows Server", klient: "Linux" },
        { file: "EE_08_04_22_01_SG.pdf", key: "EE_08_04_22_01_SG_zo.pdf", podstawa: "2017", serwer: "Linux", klient: "Windows" },
        { file: "EE_08_03_22_01_SG.pdf", key: "EE_08_03_22_01_SG_zo.pdf", podstawa: "2017", serwer: "Linux", klient: "Windows" },
        { file: "EE_08_02_22_01_SG.pdf", key: "EE_08_02_22_01_SG_zo.pdf", podstawa: "2017", serwer: "Windows Server", klient: "Linux" }
    ];

    const totalExams = 143;
    const availableExams = exams.length;
    let count2019 = exams.filter(exam => exam.podstawa === "2019").length;
    let count2017 = exams.filter(exam => exam.podstawa === "2017").length;
    let countOlder = exams.filter(exam => parseInt(exam.podstawa) < 2017).length;

    // Update stats
    document.getElementById("total-exams").textContent = totalExams;
    document.getElementById("available-exams").textContent = availableExams;

    // DOM elements
    const losujBtn = document.getElementById("losuj");
    const zakonczBtn = document.getElementById("zakoncz");
    const examFrame = document.getElementById("examFrame");
    const keyFrame = document.getElementById("keyFrame");
    const loadingOverlay = document.getElementById("loading-overlay");
    const blurOverlay = document.getElementById("blur-overlay");
    const timerDiv = document.getElementById("timer");
    const timerText = document.getElementById("timer-text");
    const progressBar = document.getElementById("progress-bar");
    const downloadExamButton = document.getElementById("download-exam");
    const fileInfo = document.getElementById("plik");
    const ratingInfo = document.getElementById("rating-info");
    const examFileName = document.getElementById("exam-file-name");
    const ratingValue = document.getElementById("rating-value");
    const ratingCount = document.getElementById("rating-count");

    // Variables
    let timeLeft = 150 * 60; // 150 minutes in seconds
    let countdown;
    let currentExam = null;

    // Check for saved exam
    function checkSavedExam() {
        const savedExam = localStorage.getItem('savedExam');
        if (savedExam) {
            const examData = JSON.parse(savedExam);
            const currentTime = Math.floor(Date.now() / 1000);
            const timeDiff = currentTime - examData.timestamp;
            const remainingTime = examData.timeLeft - timeDiff;

            if (remainingTime > 0) {
                const minutes = Math.floor(remainingTime / 60);
                const seconds = remainingTime % 60;

                const shouldContinue = confirm(`Przeglądarka została zamknięta podczas trwania egzaminu ${examData.examFile}. Pozostały czas: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}. Czy kontynuować ten egzamin?`);

                if (shouldContinue) {
                    currentExam = exams.find(e => e.file === examData.examFile);
                    examFrame.src = "egzamin/egzaminy/" + examData.examFile;
                    examFrame.style.display = "block";
                    zakonczBtn.style.display = "block";
                    zakonczBtn.dataset.key = "egzamin/egzaminy/" + examData.examKey;
                    timeLeft = remainingTime;
                    startTimer();
                } else {
                    localStorage.removeItem('savedExam');
                }
            } else {
                localStorage.removeItem('savedExam');
            }
        }
    }

    // Save exam to storage
    function saveExamToStorage() {
        if (currentExam && timeLeft > 0) {
            const examData = {
                examFile: currentExam.file,
                examKey: currentExam.key,
                timeLeft: timeLeft,
                timestamp: Math.floor(Date.now() / 1000)
            };
            localStorage.setItem('savedExam', JSON.stringify(examData));
        }
    }

    // Beforeunload event
    window.addEventListener('beforeunload', function(e) {
        if (currentExam && timeLeft > 0) {
            saveExamToStorage();
            e.preventDefault();
            e.returnValue = 'Trwa egzamin. Czy na pewno chcesz opuścić stronę?';
            return e.returnValue;
        }
    });

    // Start timer
    function startTimer() {
        clearInterval(countdown);
        timeLeft = 150 * 60;
        updateTimerDisplay();
        timerDiv.style.display = "flex";
        
        countdown = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateTimerDisplay();
            } else {
                clearInterval(countdown);
                endExam();
                localStorage.removeItem('savedExam');
            }
        }, 1000);
    }

    // Update timer display
    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerText.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        
        // Update progress bar
        const progressPercentage = (timeLeft / (150 * 60)) * 100;
        progressBar.style.width = `${progressPercentage}%`;
        
        // Change color when time is running out
        if (timeLeft <= 15 * 60) {
            timerDiv.classList.add("warning");
            progressBar.style.background = "linear-gradient(90deg, var(--warning-color), var(--danger-color))";
            
            if (timeLeft <= 10 * 60) {
                timerDiv.classList.add("danger");
                timerDiv.style.animation = "pulse 1s infinite";
            }
        }
    }

    // End exam
    function endExam() {
        clearInterval(countdown);
        blurOverlay.style.display = "flex";
        zakonczBtn.style.display = "block";
        currentExam = null;
        localStorage.removeItem('savedExam');
    }

    // Draw exam
    losujBtn.addEventListener("click", function () {
        if (isTechBreakActive()) {
            showAlert("Przerwa techniczna jest w trakcie! Nie możesz teraz losować egzaminu.", "error");
            return;
        }

        examFrame.style.display = "none";
        keyFrame.style.display = "none";
        zakonczBtn.style.display = "none";
        loadingOverlay.style.display = "flex";
        blurOverlay.style.display = "none";

        setTimeout(() => {
            const podstawa = document.getElementById("podstawa").value;
            const serwer = document.getElementById("serwer").value;
            const klient = document.getElementById("klient").value;

            let filteredExams = exams.filter(exam => 
                (podstawa === "" || exam.podstawa === podstawa) &&
                (serwer === "" || exam.serwer === serwer) &&
                (klient === "" || exam.klient === klient)
            );

            if (filteredExams.length === 0) {
                showAlert("Brak pasujących egzaminów. Zmień kryteria wyszukiwania.", "warning");
                loadingOverlay.style.display = "none";
                return;
            }

            let randomExam = filteredExams[Math.floor(Math.random() * filteredExams.length)];
            currentExam = randomExam;

            examFrame.src = "egzamin/egzaminy/" + randomExam.file;
            examFrame.style.display = "block";
            zakonczBtn.style.display = "block";
            zakonczBtn.dataset.key = "egzamin/egzaminy/" + randomExam.key;

            // Update download link
            downloadExamButton.href = "egzamin/egzaminy/" + randomExam.file;
            fileInfo.textContent = randomExam.file;

            // Update exam info
            examFileName.textContent = randomExam.file;
            ratingInfo.style.display = "flex";

            loadingOverlay.style.display = "none";
            startTimer();
        }, 1000);
    });

    // End exam button
    zakonczBtn.addEventListener("click", function () {
        const confirmationModal = document.getElementById("confirmation-modal");
        const confirmationText = document.getElementById("confirmation-text");
        const remainingTime = document.getElementById("remaining-time");
        
        function updateConfirmationText() {
            const remainingMinutes = Math.floor(timeLeft / 60);
            const remainingSeconds = timeLeft % 60;
            remainingTime.textContent = `${remainingMinutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
        }
        
        updateConfirmationText();
        confirmationModal.style.display = "flex";
        
        const timeInterval = setInterval(() => {
            if (timeLeft > 0) {
                updateConfirmationText();
            } else {
                clearInterval(timeInterval);
            }
        }, 1000);
        
        // Confirm button
        document.getElementById("confirm-btn").addEventListener("click", function() {
            clearInterval(countdown);
            blurOverlay.style.display = "flex";
            keyFrame.src = zakonczBtn.dataset.key;
            keyFrame.style.display = "block";
            timeLeft = 0;
            timerText.textContent = "Egzamin zakończony!";
            confirmationModal.style.display = "none";
            currentExam = null;
            localStorage.removeItem('savedExam');
            clearInterval(timeInterval);
        });
        
        // Cancel button
        document.getElementById("cancel-btn").addEventListener("click", function() {
            confirmationModal.style.display = "none";
            clearInterval(timeInterval);
        });
    });

    // Check technical break
    function isTechBreakActive() {
        const breakStart = new Date('2025-03-28T18:30:00');
        const breakEnd = new Date('2025-03-31T14:20:00');
        const currentDate = new Date();

        return currentDate >= breakStart && currentDate <= breakEnd;
    }

    // Show alert
    function showAlert(message, type) {
        const alertDiv = document.createElement("div");
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.classList.add("fade-out");
            setTimeout(() => {
                alertDiv.remove();
            }, 500);
        }, 3000);
    }

    // Initialize
    checkSavedExam();
    
    // Modal close handlers
    document.querySelectorAll(".modal-close").forEach(btn => {
        btn.addEventListener("click", function() {
            this.closest(".modal").style.display = "none";
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener("click", function(event) {
        if (event.target.classList.contains("modal")) {
            event.target.style.display = "none";
        }
    });
    
    // Open modals
    document.getElementById("open-ranking-modal").addEventListener("click", function() {
        document.getElementById("ranking-modal").style.display = "flex";
    });
    
    document.getElementById("open-pay-modal").addEventListener("click", function() {
        document.getElementById("pay-modal").style.display = "flex";
    });
});

// Rating functionality
document.addEventListener("DOMContentLoaded", function() {
    const ratingModal = document.getElementById("rating-modal");
    const ratingCircles = document.querySelectorAll(".rating-circle");
    const submitRatingBtn = document.getElementById("submit-rating");
    let selectedRating = 0;

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

    // Submit rating
    submitRatingBtn.addEventListener("click", function() {
        if (selectedRating === 0) {
            alert("Proszę wybrać ocenę przed zatwierdzeniem.");
            return;
        }
        
        // Here you would typically send the rating to your backend
        console.log(`Submitted rating: ${selectedRating} stars`);
        
        // Close modal and show thank you message
        ratingModal.style.display = "none";
        alert("Dziękujemy za ocenę!");
    });

    // Open rating modal
    document.getElementById("open-rating-modal").addEventListener("click", function() {
        ratingModal.style.display = "flex";
        selectedRating = 0;
        updateRatingSelection();
    });
});