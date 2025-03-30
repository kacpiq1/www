function isTechBreakActive() {
  const breakStart = new Date('2025-03-28T18:30:00');
  const breakEnd = new Date('2025-03-31T14:30:00');
  const currentDate = new Date();

  return currentDate >= breakStart && currentDate <= breakEnd;
}

document.addEventListener("DOMContentLoaded", function () {
  const exams = [
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

  const totalExams = 142;
  const availableExams = exams.length;

  let count2019 = exams.filter(exam => exam.podstawa === "2019").length;
  let count2017 = exams.filter(exam => exam.podstawa === "2017").length;
  let countOlder = exams.filter(exam => parseInt(exam.podstawa) < 2017).length;

  const examInfoDiv = document.createElement("div");
  examInfoDiv.id = "exam-info";
  examInfoDiv.innerHTML = `
      Dostępne egzaminy:<strong> ${availableExams}/${totalExams} </strong><br>
      Podstawa 2019:<strong> ${count2019} egz. </strong><br>
      Podstawa 2017:<strong> ${count2017} egz. </strong><br>
      Starsze niż 2017:<strong> ${countOlder} egz.
  `;
  examInfoDiv.style.position = "absolute";
  examInfoDiv.style.top = "10px";
  examInfoDiv.style.right = "10px";
  examInfoDiv.style.padding = "10px";
  examInfoDiv.style.backgroundColor = "#222";
  examInfoDiv.style.color = "#fff";
  examInfoDiv.style.textAlign = "left";
  examInfoDiv.style.borderRadius = "5px";
  examInfoDiv.style.fontSize = "16px";
  examInfoDiv.style.lineHeight = "1.6";
  document.body.appendChild(examInfoDiv);

  const losujBtn = document.getElementById("losuj");
  const zakonczBtn = document.getElementById("zakoncz");
  const examFrame = document.getElementById("examFrame");
  const keyFrame = document.getElementById("keyFrame");
  const loadingDiv = document.getElementById("loading");

  const iframeContainer = document.createElement("div");
  iframeContainer.classList.add("iframe-container");

  examFrame.parentNode.replaceChild(iframeContainer, examFrame);
  iframeContainer.appendChild(examFrame);

  const timerDiv = document.createElement("div");
  timerDiv.id = "timer";
  timerDiv.style.display = "none"; 
  iframeContainer.appendChild(timerDiv);

  const blurOverlay = document.createElement("div");
  blurOverlay.classList.add("blur-overlay");
  blurOverlay.innerHTML = "Egzamin zakończony!";
  iframeContainer.appendChild(blurOverlay);

  let timeLeft = 150 * 60;
  let countdown;
  let currentExam = null;

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
                
                const shouldContinue = confirm(`Przeglądarka została zamknięta podczas trwania egzaminu ${examData.examFile}. Pozostały czas jaki został egzaminu to ${minutes}:${seconds < 10 ? '0' : ''}${seconds}. Czy kontynuować ten egzamin?`);
                
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

    checkSavedExam();

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

    window.addEventListener('beforeunload', function(e) {
        if (currentExam && timeLeft > 0) {
            saveExamToStorage();
            e.preventDefault();
            e.returnValue = 'Trwa egzamin. Czy na pewno chcesz opuścić stronę?';
            return e.returnValue;
        }
    });

  function startTimer() {
      clearInterval(countdown);
      timeLeft = 150 * 60;
      updateTimerDisplay();
      timerDiv.style.display = "block";
      timerDiv.classList.remove("pulse");
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

  function setExamFileName(fileName) {
        document.getElementById("pdfName").value = fileName;
    }

  function updateTimerDisplay() {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      timerDiv.innerHTML = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

      if (timeLeft <= 15 * 60 && timeLeft > 10 * 60) {
        timerDiv.classList.add("red"); 
        timerDiv.classList.remove("pulse"); 
    }


    if (timeLeft <= 10 * 60) {
        timerDiv.classList.add("pulse");
        timerDiv.classList.add("red"); 
    }
  }

  function endExam() {
      clearInterval(countdown);
      timerDiv.innerHTML = "Czas minął!";
      blurOverlay.style.display = "flex";
      zakonczBtn.style.display = "block";
    currentExam = null;
    localStorage.removeItem('savedExam');
  }

  losujBtn.addEventListener("click", function () {
        if (isTechBreakActive()) {
            alert("Przerwa techniczna jest w trakcie! Nie możesz teraz losować egzaminu.");
            return; 
        }
  
        examFrame.style.display = "none";
        keyFrame.style.display = "none";
        zakonczBtn.style.display = "none";
        loadingDiv.style.display = "block";
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
                alert("Brak pasujących egzaminów.");
                loadingDiv.style.display = "none";
                return;
            }
  
            currentExam = filteredExams[Math.floor(Math.random() * filteredExams.length)];
  
            examFrame.src = "egzamin/egzaminy/" + currentExam.file;
            examFrame.style.display = "block";
            zakonczBtn.style.display = "block"; 
            zakonczBtn.dataset.key = "egzamin/egzaminy/" + currentExam.key;
            setExamFileName(currentExam.file);

            
  
            loadingDiv.style.display = "none";
  
            timeLeft = 150 * 60;
            startTimer(); 
        }, 1000);
    });

  zakonczBtn.addEventListener("click", function () {
      const confirmationOverlay = document.createElement("div");
      confirmationOverlay.classList.add("confirmation-overlay");
  
      const confirmationBox = document.createElement("div");
      confirmationBox.classList.add("confirmation-box");
  
      const confirmationText = document.createElement("p");
      confirmationText.id = "confirmationText";
  
      const buttonsContainer = document.createElement("div");
      buttonsContainer.classList.add("confirmation-buttons");
  
      const confirmBtn = document.createElement("button");
      confirmBtn.innerText = "Tak, zakończ egzamin";
      confirmBtn.classList.add("confirm-btn");
  
      const cancelBtn = document.createElement("button");
      cancelBtn.innerText = "Anuluj";
      cancelBtn.classList.add("cancel-btn");
  
      buttonsContainer.appendChild(confirmBtn);
      buttonsContainer.appendChild(cancelBtn);
      confirmationBox.appendChild(confirmationText);
      confirmationBox.appendChild(buttonsContainer);
      confirmationOverlay.appendChild(confirmationBox);
  
      document.body.appendChild(confirmationOverlay);

              
  
      function updateConfirmationText() {
          const remainingTime = Math.floor(timeLeft / 60);
          const remainingSeconds = timeLeft % 60;
          const message = `Jesteś pewien, że chcesz zakończyć egzamin? Pozostało: ${remainingTime} minut ${remainingSeconds < 10 ? '0' : ''}${remainingSeconds} sekund.`;
          document.getElementById("confirmationText").innerText = message;
      }
  
      const timeInterval = setInterval(() => {
          if (timeLeft > 0) {
              updateConfirmationText();
          } else {
              clearInterval(timeInterval);
          }
      }, 1000);
  
      confirmBtn.addEventListener("click", function () {
          clearInterval(countdown);
          blurOverlay.style.display = "flex";
          keyFrame.src = zakonczBtn.dataset.key;
          keyFrame.style.display = "block";
          timeLeft = 0; 
          timerDiv.innerHTML = "Egzamin zakończony!";
          confirmationOverlay.remove();
          currentExam = null;
          localStorage.removeItem('savedExam');
      });
  
      cancelBtn.addEventListener("click", function () {
          clearInterval(timeInterval);
          confirmationOverlay.remove();
      });

      if (isTechBreakActive()) {
        losujBtn.disabled = true; 
        losujBtn.style.cursor = 'not-allowed'; 
        losujBtn.style.backgroundColor = '#cccccc'; 
    }

      updateConfirmationText();
  });    
})    
